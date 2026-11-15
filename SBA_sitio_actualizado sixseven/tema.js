/* Sistema de Billares Ángel (S.B.A) · Modo oscuro.
 *
 * Se carga al inicio de la página (antes de pintar) para que no haya un destello blanco
 * cuando la persona ya eligió el modo oscuro. Solo guarda la preferencia en este aparato
 * (clave «sba_tema»); no envía nada a ningún servidor.
 */
(function () {
  'use strict';

  var CLAVE = 'sba_tema';
  var oyentes = [];

  function leer() {
    try { return localStorage.getItem(CLAVE) === 'oscuro' ? 'oscuro' : 'claro'; } catch (e) { return 'claro'; }
  }

  function aplicar(t) {
    var h = document.documentElement;
    if (t === 'oscuro') h.setAttribute('data-tema', 'oscuro');
    else h.removeAttribute('data-tema');
  }

  function avisar() {
    oyentes.slice().forEach(function (f) { try { f(); } catch (e) { /* ignorar */ } });
  }

  function poner(t) {
    t = t === 'oscuro' ? 'oscuro' : 'claro';
    try { localStorage.setItem(CLAVE, t); } catch (e) { /* sin almacenamiento: vale solo para esta visita */ }
    aplicar(t);
    avisar();
  }

  aplicar(leer());

  // Si se cambia en otra pestaña, esta también se actualiza.
  window.addEventListener('storage', function (e) {
    if (e.key === CLAVE) { aplicar(leer()); avisar(); }
  });

  window.SBA_TEMA = {
    actual: function () { return document.documentElement.getAttribute('data-tema') === 'oscuro' ? 'oscuro' : 'claro'; },
    poner: poner,
    cambiar: function () { poner(window.SBA_TEMA.actual() === 'oscuro' ? 'claro' : 'oscuro'); },
    escuchar: function (f) { oyentes.push(f); },
    quitar: function (f) { oyentes = oyentes.filter(function (x) { return x !== f; }); }
  };
})();
