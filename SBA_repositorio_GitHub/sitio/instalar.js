/* Sistema de Billares Ángel (S.B.A) · Instalar como aplicación.
 *
 * - Guarda el aviso del navegador ("beforeinstallprompt") apenas llega, para que el botón
 *   «Instalar» funcione con un solo toque en cualquier pantalla.
 * - Android / computadora (Chrome, Edge): muestra un aviso con el botón «Instalar». Al tocarlo,
 *   el navegador pide una confirmación propia y la app queda en el inicio y en la lista de aplicaciones.
 * - iPhone / iPad: Apple no permite instalar con un botón; se muestran los 3 pasos.
 * No envía ni guarda datos del negocio. Solo recuerda si se cerró el aviso.
 */
(function () {
  'use strict';

  var CLAVE = 'sba_instalar_cerrado';
  var evento = null;
  var oyentes = [];
  var banner = null;
  var instalada = false; // se instaló durante esta visita

  function modoApp() {
    if (instalada) return true;
    try {
      return (window.matchMedia && (matchMedia('(display-mode: standalone)').matches ||
        matchMedia('(display-mode: window-controls-overlay)').matches ||
        matchMedia('(display-mode: minimal-ui)').matches)) || navigator.standalone === true;
    } catch (e) { return false; }
  }
  function esIOS() {
    var ua = navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  }
  function cerradoReciente(dias) {
    try {
      var t = parseInt(localStorage.getItem(CLAVE), 10);
      return !!t && Date.now() - t < dias * 86400000;
    } catch (e) { return false; }
  }
  function recordarCierre() {
    try { localStorage.setItem(CLAVE, String(Date.now())); } catch (e) { /* sin almacenamiento */ }
  }
  function avisar() { oyentes.forEach(function (f) { try { f(); } catch (e) { /* ignorar */ } }); }

  function el(tag, clase, txt) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function quitarBanner() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function instalar() {
    if (!evento) return Promise.resolve(false);
    var e = evento;
    evento = null; // el navegador solo permite usarlo una vez
    quitarBanner();
    try {
      e.prompt();
      return e.userChoice.then(function (r) { avisar(); return r && r.outcome === 'accepted'; }, function () { avisar(); return false; });
    } catch (err) { avisar(); return Promise.resolve(false); }
  }

  // Ventanita con pasos numerados (sirve para iPhone y para cuando el navegador no deja instalar con un botón).
  function dialogo(titulo, pasos, nota) {
    if (document.querySelector('.tk-velo')) return;
    var raiz = el('div', 'tk-velo no-imprimir');
    var caja = el('div', 'tk-caja');
    caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-modal', 'true');
    var cab = el('div', 'tk-cab'); cab.appendChild(el('strong', '', titulo));
    var x = el('button', 'tk-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); cab.appendChild(x);
    var cuerpo = el('div', 'tk-cuerpo');
    var ol = el('ol', 'ins-pasos');
    pasos.forEach(function (t) { ol.appendChild(el('li', '', t)); });
    cuerpo.appendChild(ol);
    if (nota) cuerpo.appendChild(el('p', 'tk-ayuda', nota));
    var pie = el('div', 'tk-pie');
    var ok = el('button', 'btn btn-primario', 'Entendido'); ok.type = 'button'; pie.appendChild(ok);
    caja.appendChild(cab); caja.appendChild(cuerpo); caja.appendChild(pie); raiz.appendChild(caja);
    document.body.appendChild(raiz);
    function cerrar() { if (raiz.parentNode) raiz.parentNode.removeChild(raiz); document.removeEventListener('keydown', tecla); }
    function tecla(e) { if (e.key === 'Escape') cerrar(); }
    document.addEventListener('keydown', tecla);
    x.onclick = ok.onclick = cerrar;
    raiz.onmousedown = function (e) { if (e.target === raiz) cerrar(); };
    ok.focus();
  }

  function pasosIOS() {
    dialogo('Instalar en iPhone o iPad', [
      'Abre esta página en Safari.',
      'Toca el botón Compartir (el cuadro con una flecha hacia arriba).',
      'Elige «Agregar a inicio» y toca «Agregar».'
    ], 'La aplicación quedará en la pantalla de inicio, con el logo de S.B.A.');
  }

  // Explica cómo instalar cuando el navegador no ofrece el botón directo (computadora, Firefox, Safari…).
  function ayuda() {
    var ua = navigator.userAgent || '';
    if (esIOS()) return pasosIOS();
    var android = /Android/i.test(ua);
    var edge = /Edg\//.test(ua);
    var firefox = /Firefox|FxiOS/i.test(ua);
    var safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
    if (android) {
      return dialogo('Instalar en el celular', [
        'Toca el menú del navegador (los tres puntos ⋮).',
        'Elige «Instalar aplicación» o «Agregar a pantalla principal».',
        'Confirma con «Instalar».'
      ], 'La aplicación quedará con el logo de S.B.A en el inicio y en la lista de aplicaciones.');
    }
    if (firefox) {
      return dialogo('Instalar en la computadora', [
        'Firefox para computadora no puede instalar aplicaciones.',
        'Abre esta misma dirección en Google Chrome o Microsoft Edge.',
        'Allí aparecerá el botón «Instalar aplicación».'
      ]);
    }
    if (safari) {
      return dialogo('Instalar en la Mac', [
        'En el menú «Archivo» de Safari, elige «Agregar al Dock…».',
        'Confirma con «Agregar».'
      ], 'Se abrirá como una aplicación propia, con el logo de S.B.A.');
    }
    if (edge) {
      return dialogo('Instalar en la computadora', [
        'Mira el extremo derecho de la barra de direcciones y haz clic en el ícono de instalar.',
        'Si no lo ves: menú de tres puntos (…) → «Aplicaciones» → «Instalar este sitio como una aplicación».',
        'Confirma con «Instalar».'
      ], 'La aplicación queda en el menú Inicio y en el escritorio, igual que en el celular.');
    }
    return dialogo('Instalar en la computadora', [
      'Mira el extremo derecho de la barra de direcciones: aparece un ícono para instalar (una pantalla con una flecha).',
      'Haz clic en él y elige «Instalar».',
      'Si no lo ves: menú de tres puntos (⋮) → «Guardar y compartir» → «Instalar S.B.A».'
    ], 'La aplicación queda en el menú Inicio y en el escritorio, igual que en el celular.');
  }

  function mostrarBanner() {
    if (banner || !document.body || modoApp()) return;
    var ios = esIOS();
    if (!ios && !evento) return;
    if (cerradoReciente(ios ? 14 : 3)) return;

    banner = el('div', 'ins-banner no-imprimir');
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Instalar la aplicación');
    var img = el('img'); img.src = 'iconos/icono-192.png'; img.width = img.height = 40; img.alt = '';
    var txt = el('div', 'ins-txt');
    txt.appendChild(el('strong', '', 'Instalar S.B.A'));
    txt.appendChild(el('span', '', ios ? 'Agrégala a la pantalla de inicio.' : 'Con un toque queda en tus aplicaciones.'));
    var b = el('button', 'btn btn-primario ins-boton', ios ? 'Cómo' : 'Instalar'); b.type = 'button';
    var c = el('button', 'ins-x', '×'); c.type = 'button'; c.setAttribute('aria-label', 'Ahora no');
    banner.appendChild(img); banner.appendChild(txt); banner.appendChild(b); banner.appendChild(c);
    document.body.appendChild(banner);
    b.onclick = function () { if (ios) pasosIOS(); else instalar(); };
    c.onclick = function () { recordarCierre(); quitarBanner(); };
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    evento = e;
    avisar();
    if (document.body) mostrarBanner(); else document.addEventListener('DOMContentLoaded', mostrarBanner);
  });
  window.addEventListener('appinstalled', function () {
    evento = null;
    instalada = true;
    quitarBanner();
    avisar();
  });
  document.addEventListener('DOMContentLoaded', function () {
    // iPhone / iPad no avisan con evento: se muestra la guía con un pequeño retraso.
    if (esIOS()) setTimeout(mostrarBanner, 2500);
  });

  window.SBA_INSTALAR = {
    evento: function () { return evento; },
    instalar: instalar,
    modoApp: modoApp,
    esIOS: esIOS,
    pasosIOS: pasosIOS,
    ayuda: ayuda,
    escuchar: function (f) { oyentes.push(f); }
  };
})();
