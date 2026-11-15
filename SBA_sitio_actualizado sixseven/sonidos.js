/* Sistema de Billares Ángel (S.B.A) · Sonidos suaves de confirmación.
 *
 * Los sonidos se generan en el momento con el audio del navegador (Web Audio): no hay archivos
 * de audio que descargar. Son cortos y de volumen bajo. Se pueden apagar con el botón de la
 * campana (arriba a la derecha); la preferencia se guarda solo en este aparato («sba_sonido»).
 */
(function () {
  'use strict';

  var CLAVE = 'sba_sonido';
  var ctx = null;
  var maestro = null;

  function activo() {
    try { return localStorage.getItem(CLAVE) !== 'no'; } catch (e) { return true; }
  }

  function poner(si) {
    try { localStorage.setItem(CLAVE, si ? 'si' : 'no'); } catch (e) { /* solo esta visita */ }
  }

  function audio() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try {
        ctx = new C();
        maestro = ctx.createGain();
        maestro.gain.value = 0.9;
        maestro.connect(ctx.destination);
      } catch (e) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignorar */ } }
    return ctx;
  }

  // Una nota con ataque rápido y caída suave.
  function nota(a, destino, f, t0, dur, tipo, vol) {
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = tipo || 'sine';
    o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(destino);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }

  // Sonido de campanita: la nota base más dos armónicos que se apagan antes.
  function campana(a, d, f, t0, dur, vol) {
    vol = vol || 0.22;
    nota(a, d, f, t0, dur, 'sine', vol);
    nota(a, d, f * 2.01, t0, dur * 0.6, 'sine', vol * 0.32);
    nota(a, d, f * 3.02, t0, dur * 0.35, 'sine', vol * 0.14);
  }

  var SONIDOS = {
    // Venta cobrada: «ding-ding» de caja registradora.
    cobro: function (a, d, t) { campana(a, d, 1318.5, t, 0.5); campana(a, d, 1975.5, t + 0.11, 0.8, 0.2); },
    // Acción lograda (guardar, registrar…).
    ok: function (a, d, t) { campana(a, d, 987.8, t, 0.4, 0.2); },
    // Partida iniciada / reanudada: tres notas que suben.
    inicio: function (a, d, t) {
      nota(a, d, 523.25, t, 0.16, 'triangle', 0.2);
      nota(a, d, 659.25, t + 0.09, 0.16, 'triangle', 0.2);
      nota(a, d, 783.99, t + 0.18, 0.28, 'triangle', 0.2);
    },
    // Partida en pausa: dos notas que bajan.
    pausa: function (a, d, t) {
      nota(a, d, 659.25, t, 0.16, 'triangle', 0.2);
      nota(a, d, 493.88, t + 0.11, 0.26, 'triangle', 0.2);
    },
    // Caja abierta: dos campanitas.
    abrir: function (a, d, t) { campana(a, d, 784, t, 0.4, 0.2); campana(a, d, 1174.7, t + 0.12, 0.6, 0.2); },
    // Caja cerrada: tres campanitas que bajan.
    cierre: function (a, d, t) {
      campana(a, d, 1046.5, t, 0.5, 0.2);
      campana(a, d, 783.99, t + 0.13, 0.5, 0.2);
      campana(a, d, 523.25, t + 0.26, 0.9, 0.2);
    },
    // Algo se quitó o se anuló: un tono grave y corto.
    quitar: function (a, d, t) {
      nota(a, d, 392, t, 0.14, 'triangle', 0.2);
      nota(a, d, 293.66, t + 0.1, 0.24, 'triangle', 0.2);
    },
    // Error: dos pulsos graves, nada estridente.
    error: function (a, d, t) {
      nota(a, d, 220, t, 0.14, 'triangle', 0.22);
      nota(a, d, 185, t + 0.17, 0.22, 'triangle', 0.22);
    },
    // Toque de botones de ajuste.
    tic: function (a, d, t) { nota(a, d, 1400, t, 0.05, 'sine', 0.12); }
  };

  function reproducir(nombre) {
    if (!activo() || !SONIDOS[nombre]) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    var a = audio();
    if (!a || !maestro) return;
    try { SONIDOS[nombre](a, maestro, a.currentTime + 0.02); } catch (e) { /* nunca debe romper la app */ }
  }

  // Elige el sonido según el aviso que muestra la app.
  function aviso(texto, tipo) {
    if (tipo === 'error') return reproducir('error');
    if (tipo !== 'exito') return;
    var t = String(texto || '').toLowerCase();
    if (/anulad|eliminad|quitad|rechazad/.test(t)) reproducir('quitar');
    else if (/en pausa/.test(t)) reproducir('pausa');
    else if (/iniciada|reanudad/.test(t)) reproducir('inicio');
    else if (/caja abierta/.test(t)) reproducir('abrir');
    else reproducir('ok');
  }

  window.SBA_SONIDOS = { activo: activo, poner: poner, reproducir: reproducir, toast: aviso, _lista: SONIDOS };
})();
