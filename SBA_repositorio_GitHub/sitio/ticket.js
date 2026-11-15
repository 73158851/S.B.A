/* Sistema de Billares Ángel (S.B.A) · Ticket para mini impresora térmica.
 *
 * Qué hace:
 *  1) Muestra una vista previa del recibo como ticket angosto (58 u 80 mm).
 *  2) "Enviar a Fun Print": convierte el ticket en una imagen y abre la lista de apps del
 *     teléfono para elegir Fun Print (o cualquier app de la mini impresora).
 *  3) "Guardar imagen": descarga el ticket como imagen PNG para abrirlo desde la app de la impresora.
 *  4) "Imprimir con el navegador": imprime en papel angosto (impresoras comunes o PDF).
 *
 * No guarda ni envía datos del negocio a ningún servidor: todo ocurre en el equipo.
 * Solo recuerda en este equipo el ancho de papel elegido.
 */
(function () {
  'use strict';

  var CLAVE = 'sba_ticket_ancho';
  var PUNTOS = { '58': 384, '80': 576 }; // puntos de impresión por ancho de papel (203 ppp)
  var FAMILIA = '"Courier New","Liberation Mono","DejaVu Sans Mono",ui-monospace,monospace';
  var estado = null;

  function anchoGuardado() {
    try { return localStorage.getItem(CLAVE) === '80' ? '80' : '58'; } catch (e) { return '58'; }
  }
  function guardarAncho(a) {
    try { localStorage.setItem(CLAVE, a); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  /* ---------- 1. Leer el recibo que está en pantalla ---------- */

  function buscarRecibo() {
    var l = document.querySelectorAll('.recibo');
    return l.length ? l[l.length - 1] : null;
  }
  function texto(n) { return (n.textContent || '').replace(/\s+/g, ' ').trim(); }

  function leer(el, ops) {
    ops = ops || [];
    Array.prototype.forEach.call(el.children, function (n) {
      var tag = n.tagName, st = n.style || {};
      var mt = parseFloat(st.marginTop) || 0;
      if (tag === 'IMG') { ops.push({ t: 'img', src: n.getAttribute('src') || n.src }); return; }
      if (tag === 'HR') { ops.push({ t: 'hr' }); return; }
      var negrita = tag === 'H4' || tag === 'STRONG' || st.fontWeight === 'bold' || parseInt(st.fontWeight, 10) >= 600;
      var tam = tag === 'H4' ? 1.15 : (parseFloat(st.fontSize) ? parseFloat(st.fontSize) / 13 : 1);
      tam = Math.max(0.8, Math.min(1.2, tam));
      if (n.classList.contains('linea')) {
        var h = n.children;
        ops.push({ t: 'lr', l: h[0] ? texto(h[0]) : '', r: h[1] ? texto(h[1]) : '', b: negrita, s: tam, m: mt });
        return;
      }
      if (n.children.length && n.querySelector('.linea') && !n.classList.contains('centro')) { leer(n, ops); return; }
      var tx = texto(n);
      if (!tx) { if (mt) ops.push({ t: 'esp', m: mt }); return; }
      ops.push({ t: 'tx', x: tx, c: tag === 'H4' || n.classList.contains('centro'), b: negrita, s: tam, m: mt });
    });
    return ops;
  }

  /* ---------- 2. Dibujar el ticket en una imagen ---------- */

  function cargar(src) {
    return new Promise(function (ok) {
      if (!src) { ok(null); return; }
      var i = new Image();
      var t = setTimeout(function () { ok(null); }, 4000);
      i.onload = function () { clearTimeout(t); ok(i); };
      i.onerror = function () { clearTimeout(t); ok(null); };
      i.src = src;
    });
  }

  // Convierte el logo a puntos blanco/negro (tramado) para que se vea bien en papel térmico.
  function tramar(img, lado) {
    try {
      var t = document.createElement('canvas'); t.width = lado; t.height = lado;
      var x = t.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, lado, lado);
      var r = Math.min(lado / img.width, lado / img.height), w = img.width * r, h = img.height * r;
      x.drawImage(img, (lado - w) / 2, (lado - h) / 2, w, h);
      var d = x.getImageData(0, 0, lado, lado), p = d.data, g = new Float32Array(lado * lado), i, j;
      for (i = 0; i < g.length; i++) g[i] = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2];
      for (var yy = 0; yy < lado; yy++) {
        for (var xx = 0; xx < lado; xx++) {
          i = yy * lado + xx;
          var viejo = g[i], nuevo = viejo < 128 ? 0 : 255, err = viejo - nuevo;
          g[i] = nuevo;
          if (xx + 1 < lado) g[i + 1] += err * 7 / 16;
          if (yy + 1 < lado) {
            if (xx > 0) g[i + lado - 1] += err * 3 / 16;
            g[i + lado] += err * 5 / 16;
            if (xx + 1 < lado) g[i + lado + 1] += err / 16;
          }
        }
      }
      for (i = 0; i < g.length; i++) { j = i * 4; p[j] = p[j + 1] = p[j + 2] = g[i] < 128 ? 0 : 255; p[j + 3] = 255; }
      x.putImageData(d, 0, 0);
      return t;
    } catch (e) { return null; }
  }

  function partir(c, tx, ancho) {
    var palabras = tx.split(' '), lineas = [], actual = '';
    palabras.forEach(function (p) {
      var prueba = actual ? actual + ' ' + p : p;
      if (c.measureText(prueba).width <= ancho) { actual = prueba; return; }
      if (actual) { lineas.push(actual); actual = ''; }
      while (c.measureText(p).width > ancho && p.length > 1) {
        var n = p.length;
        while (n > 1 && c.measureText(p.slice(0, n)).width > ancho) n--;
        lineas.push(p.slice(0, n)); p = p.slice(n);
      }
      actual = p;
    });
    if (actual || !lineas.length) lineas.push(actual);
    return lineas;
  }

  function disenar(ops, W) {
    var PAD = 4, FS = 20, LH = 25;
    var c = document.createElement('canvas').getContext('2d');
    var util = W - PAD * 2, y = 6, cmds = [];
    function fuente(b, s) { return (b ? 'bold ' : '') + Math.round(FS * s) + 'px ' + FAMILIA; }
    ops.forEach(function (op) {
      if (op.m) y += Math.min(op.m, 30) * 0.8;
      if (op.t === 'esp') return;
      if (op.t === 'img') {
        if (!op.canvas) return;
        cmds.push({ t: 'img', y: y, canvas: op.canvas, x: Math.round((W - op.canvas.width) / 2) });
        y += op.canvas.height + 8; return;
      }
      if (op.t === 'hr') { y += 5; cmds.push({ t: 'hr', y: y }); y += 9; return; }
      var f = fuente(op.b, op.s), lh = Math.round(LH * op.s);
      c.font = f;
      if (op.t === 'tx') {
        partir(c, op.x, util).forEach(function (l) {
          var w = c.measureText(l).width;
          cmds.push({ t: 'tx', f: f, x: op.c ? Math.round((W - w) / 2) : PAD, y: y, s: l });
          y += lh;
        });
        return;
      }
      var rw = op.r ? c.measureText(op.r).width : 0;
      var disp = Math.max(util - rw - (rw ? 10 : 0), 60);
      partir(c, op.l, disp).forEach(function (l, i) {
        cmds.push({ t: 'tx', f: f, x: PAD, y: y, s: l });
        if (i === 0 && op.r) cmds.push({ t: 'tx', f: f, x: Math.round(W - PAD - rw), y: y, s: op.r });
        y += lh;
      });
    });
    return { cmds: cmds, alto: Math.ceil(y + 28), pad: PAD };
  }

  function generar(ancho) {
    var el = buscarRecibo();
    if (!el) return Promise.reject(new Error('No se encontró el recibo'));
    var ops = leer(el), W = PUNTOS[ancho], lado = Math.round(W / 4);
    var cargas = ops.filter(function (o) { return o.t === 'img'; }).map(function (o) {
      return cargar(o.src).then(function (img) { o.canvas = img ? tramar(img, lado) : null; });
    });
    return Promise.all(cargas).then(function () {
      var d = disenar(ops, W);
      var cv = document.createElement('canvas'); cv.width = W; cv.height = d.alto;
      var c = cv.getContext('2d');
      c.fillStyle = '#fff'; c.fillRect(0, 0, W, d.alto);
      c.fillStyle = '#000'; c.strokeStyle = '#000'; c.textBaseline = 'top';
      d.cmds.forEach(function (m) {
        if (m.t === 'img') { c.drawImage(m.canvas, m.x, m.y); return; }
        if (m.t === 'hr') {
          c.lineWidth = 2; c.setLineDash([6, 4]); c.beginPath();
          c.moveTo(d.pad, m.y); c.lineTo(W - d.pad, m.y); c.stroke(); c.setLineDash([]); return;
        }
        c.font = m.f; c.fillText(m.s, m.x, m.y);
      });
      // Solo negro o blanco: la impresora térmica no imprime grises.
      var im = c.getImageData(0, 0, W, d.alto), p = im.data;
      for (var i = 0; i < p.length; i += 4) {
        var v = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2] < 165 ? 0 : 255;
        p[i] = p[i + 1] = p[i + 2] = v; p[i + 3] = 255;
      }
      c.putImageData(im, 0, 0);
      return new Promise(function (ok, mal) {
        cv.toBlob(function (b) { if (b) ok(b); else mal(new Error('No se pudo crear la imagen')); }, 'image/png');
      });
    });
  }

  /* ---------- 3. Imprimir con el navegador en papel angosto ---------- */

  function limpiar() {
    document.body.classList.remove('imprime-recibo', 'tk-58', 'tk-80');
    var s = document.getElementById('tk-pagina');
    if (s && s.parentNode) s.parentNode.removeChild(s);
  }

  // El navegador no acepta "alto automático" en @page; se mide el ticket para darle su alto exacto.
  function medirMM(el, ancho) {
    var caja = document.createElement('div');
    caja.className = 'tk-medida tk-' + ancho;
    var cl = el.cloneNode(true);
    cl.classList.remove('solo-impresion');
    cl.style.display = 'block';
    caja.appendChild(cl);
    document.body.appendChild(caja);
    var px = cl.getBoundingClientRect().height;
    document.body.removeChild(caja);
    return Math.max(40, Math.ceil(px * 25.4 / 96) + 8);
  }

  function imprimir(ancho) {
    limpiar();
    var el = buscarRecibo();
    if (!el) { window.print(); return; }
    var st = document.createElement('style');
    st.id = 'tk-pagina';
    st.textContent = '@page{size:' + (ancho === '80' ? 80 : 58) + 'mm ' + medirMM(el, ancho) + 'mm;margin:0}';
    document.head.appendChild(st);
    document.body.classList.add('imprime-recibo', 'tk-' + ancho);
    function fin() { limpiar(); window.removeEventListener('afterprint', fin); }
    window.addEventListener('afterprint', fin);
    setTimeout(function () { window.print(); }, 60);
  }

  /* ---------- 4. Ventana de opciones ---------- */

  function nombreArchivo() {
    var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'ticket-' + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()) + '.png';
  }

  function el(tag, clase, txt) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function puedeCompartir() {
    try {
      return typeof navigator.canShare === 'function' && typeof navigator.share === 'function' &&
        navigator.canShare({ files: [new File(['x'], 'a.png', { type: 'image/png' })] });
    } catch (e) { return false; }
  }

  function cerrar() {
    if (!estado) return;
    document.removeEventListener('keydown', estado.tecla, true);
    if (estado.url) URL.revokeObjectURL(estado.url);
    if (estado.raiz.parentNode) estado.raiz.parentNode.removeChild(estado.raiz);
    estado = null;
  }

  function abrir() {
    if (estado) return;
    limpiar();
    if (!buscarRecibo()) { window.print(); return; }

    var raiz = el('div', 'tk-velo no-imprimir');
    var caja = el('div', 'tk-caja');
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-modal', 'true');
    caja.setAttribute('aria-label', 'Imprimir ticket');

    var cab = el('div', 'tk-cab');
    cab.appendChild(el('strong', '', 'Imprimir ticket'));
    var x = el('button', 'tk-x', '×');
    x.type = 'button'; x.setAttribute('aria-label', 'Cerrar');
    cab.appendChild(x);

    var cuerpo = el('div', 'tk-cuerpo');
    var fila = el('div', 'tk-fila');
    fila.appendChild(el('span', 'tk-etq', 'Ancho del papel'));
    var seg = el('div', 'tk-seg');
    var b58 = el('button', '', '58 mm'), b80 = el('button', '', '80 mm');
    b58.type = b80.type = 'button';
    seg.appendChild(b58); seg.appendChild(b80); fila.appendChild(seg);
    var vista = el('div', 'tk-vista');
    var img = el('img'); img.alt = 'Vista previa del ticket';
    var cargando = el('p', 'tk-ayuda', 'Preparando el ticket…');
    vista.appendChild(cargando);
    var aviso = el('p', 'tk-aviso'); aviso.setAttribute('role', 'status');
    cuerpo.appendChild(fila); cuerpo.appendChild(vista); cuerpo.appendChild(aviso);

    var pie = el('div', 'tk-pie');
    var bComp = el('button', 'btn btn-primario', 'Enviar a Fun Print');
    var bGuard = el('button', 'btn', 'Guardar imagen');
    var bImp = el('button', 'btn', 'Imprimir con el navegador');
    bComp.type = bGuard.type = bImp.type = 'button';
    var compartible = puedeCompartir();
    if (compartible) pie.appendChild(bComp); else bGuard.className = 'btn btn-primario';
    pie.appendChild(bGuard); pie.appendChild(bImp);
    pie.appendChild(el('p', 'tk-ayuda', compartible
      ? 'Toque «Enviar a Fun Print» y elija Fun Print en la lista de apps. Si no aparece, use «Guardar imagen» y ábrala desde Fun Print.'
      : 'Guarde la imagen y ábrala desde la app de su mini impresora (Fun Print). Para papel angosto en una impresora común, use «Imprimir con el navegador».'));

    caja.appendChild(cab); caja.appendChild(cuerpo); caja.appendChild(pie);
    raiz.appendChild(caja);
    document.body.appendChild(raiz);

    estado = { raiz: raiz, ancho: anchoGuardado(), blob: null, url: null, tecla: null, ver: 0 };
    estado.tecla = function (e) { if (e.key === 'Escape') { e.stopPropagation(); cerrar(); } };
    document.addEventListener('keydown', estado.tecla, true);

    function marcar() {
      b58.setAttribute('aria-pressed', String(estado.ancho === '58'));
      b80.setAttribute('aria-pressed', String(estado.ancho === '80'));
    }
    function refrescar() {
      var mi = ++estado.ver, st = estado;
      marcar();
      aviso.textContent = '';
      generar(st.ancho).then(function (blob) {
        if (estado !== st || st.ver !== mi) return;
        if (st.url) URL.revokeObjectURL(st.url);
        st.blob = blob; st.url = URL.createObjectURL(blob);
        img.src = st.url;
        if (!img.parentNode) { vista.textContent = ''; vista.appendChild(img); }
      }).catch(function () {
        if (estado !== st || st.ver !== mi) return;
        aviso.textContent = 'No se pudo preparar el ticket. Use «Imprimir con el navegador».';
      });
    }
    function elegir(a) { estado.ancho = a; guardarAncho(a); refrescar(); }
    b58.onclick = function () { elegir('58'); };
    b80.onclick = function () { elegir('80'); };
    x.onclick = cerrar;
    raiz.onmousedown = function (e) { if (e.target === raiz) cerrar(); };

    function descargar() {
      if (!estado || !estado.blob) return;
      var a = document.createElement('a');
      a.href = estado.url; a.download = nombreArchivo();
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    bGuard.onclick = function () {
      if (!estado || !estado.blob) return;
      descargar();
      aviso.textContent = 'Imagen guardada en la carpeta de descargas. Ábrala desde Fun Print para imprimirla.';
    };
    bComp.onclick = function () {
      if (!estado || !estado.blob) return;
      var archivo = new File([estado.blob], nombreArchivo(), { type: 'image/png' });
      navigator.share({ files: [archivo], title: 'Ticket' }).catch(function (e) {
        if (e && e.name === 'AbortError') return;
        aviso.textContent = 'No se pudo abrir la lista de apps. Use «Guardar imagen».';
      });
    };
    bImp.onclick = function () {
      var a = estado.ancho;
      cerrar();
      imprimir(a);
    };

    refrescar();
    setTimeout(function () { (compartible ? bComp : bGuard).focus(); }, 0);
  }

  window.SBA_TICKET = { abrir: abrir };
})();
