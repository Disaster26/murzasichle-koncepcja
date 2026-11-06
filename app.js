(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* menu mobilne */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu-mob');
  function zamknij() { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); document.body.style.overflow = ''; }
  burger.addEventListener('click', function () {
    var otw = menu.hidden;
    menu.hidden = !otw;
    burger.setAttribute('aria-expanded', String(otw));
    burger.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
    document.body.style.overflow = otw ? 'hidden' : '';
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { zamknij(); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1100 && !menu.hidden) zamknij(); });

  /* przeciąganie myszą dla przewijanego toru */
  function przeciaganie(tor, kl, krok) {
    var start = null, sl = 0, ruch = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      start = e.clientX; sl = tor.scrollLeft; ruch = false;
    });
    tor.addEventListener('pointermove', function (e) {
      if (start === null) return;
      var dx = e.clientX - start;
      if (!ruch && Math.abs(dx) > 5) { ruch = true; kl.classList.add('ciag'); try { tor.setPointerCapture(e.pointerId); } catch (x) {} }
      if (ruch) tor.scrollLeft = sl - dx;
    });
    function koniec() {
      if (start === null) return;
      start = null;
      if (ruch) {
        var k = krok(), cel = Math.round(tor.scrollLeft / k) * k;
        kl.classList.remove('ciag');
        tor.scrollTo({ left: cel, behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(function () { ruch = false; }, 0);
      }
    }
    tor.addEventListener('pointerup', koniec);
    tor.addEventListener('pointercancel', koniec);
    tor.addEventListener('click', function (e) { if (ruch) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* karuzele w kartach: palec, mysz, strzałki, licznik */
  var strz = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  document.querySelectorAll('[data-car]').forEach(function (car) {
    var tor = car.querySelector('.car-tor');
    var el = tor.children, n = el.length;
    if (n < 2) return;
    car.setAttribute('data-wiele', '');
    tor.setAttribute('tabindex', '0');
    tor.setAttribute('aria-label', 'Zdjęcia - przewiń w bok');
    var nr = document.createElement('span'); nr.className = 'car-nr'; car.appendChild(nr);
    var l = document.createElement('button'); l.type = 'button'; l.className = 'car-btn l'; l.innerHTML = strz; l.setAttribute('aria-label', 'Poprzednie zdjęcie');
    var p = document.createElement('button'); p.type = 'button'; p.className = 'car-btn p'; p.innerHTML = strz.replace('M15 5l-7 7 7 7', 'M9 5l7 7-7 7'); p.setAttribute('aria-label', 'Następne zdjęcie');
    car.appendChild(l); car.appendChild(p);
    function krok() { var g = parseFloat(getComputedStyle(tor).columnGap) || 0; return el[0].getBoundingClientRect().width + g; }
    function odswiez() {
      var i = Math.round(tor.scrollLeft / krok());
      nr.textContent = (Math.min(i, n - 1) + 1) + ' / ' + n;
      l.disabled = tor.scrollLeft < 4;
      p.disabled = tor.scrollLeft > tor.scrollWidth - tor.clientWidth - 4;
    }
    function idz(d) { tor.scrollBy({ left: d * krok(), behavior: reduce ? 'auto' : 'smooth' }); }
    l.addEventListener('click', function () { idz(-1); });
    p.addEventListener('click', function () { idz(1); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(odswiez); }, { passive: true });
    tor.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); idz(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); idz(-1); } });
    przeciaganie(tor, car, krok);
    window.addEventListener('resize', odswiez);
    odswiez();
  });

  /* opinie: tor przewijany + strzałki */
  var op = document.getElementById('op-tor');
  if (op) {
    var opBtn = document.querySelectorAll('[data-op]');
    function opKrok() { return op.querySelector('.op').getBoundingClientRect().width + 20; }
    function opStan() {
      opBtn[0].disabled = op.scrollLeft < 4;
      opBtn[1].disabled = op.scrollLeft > op.scrollWidth - op.clientWidth - 4;
    }
    [].forEach.call(opBtn, function (b) { b.addEventListener('click', function () { op.scrollBy({ left: +b.dataset.op * opKrok(), behavior: reduce ? 'auto' : 'smooth' }); }); });
    op.addEventListener('scroll', function () { window.requestAnimationFrame(opStan); }, { passive: true });
    op.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); op.scrollBy({ left: opKrok() }); } if (e.key === 'ArrowLeft') { e.preventDefault(); op.scrollBy({ left: -opKrok() }); } });
    przeciaganie(op, op, opKrok);
    window.addEventListener('resize', opStan); opStan();
  }

  /* wybór apartamentu z karty */
  var fAp = document.getElementById('f-ap');
  document.querySelectorAll('[data-ap]').forEach(function (a) {
    a.addEventListener('click', function () { fAp.value = a.dataset.ap; });
  });

  /* daty: od dziś, wyjazd po przyjeździe */
  var od = document.getElementById('f-od'), dO = document.getElementById('f-do');
  function iso(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  var dzis = new Date(); od.min = iso(dzis);
  var jutro = new Date(dzis.getTime() + 864e5); dO.min = iso(jutro);
  od.addEventListener('change', function () {
    if (!od.value) return;
    var n = new Date(od.value + 'T12:00:00'); n.setDate(n.getDate() + 1);
    dO.min = iso(n);
    if (!dO.value || dO.value <= od.value) { var t = new Date(od.value + 'T12:00:00'); t.setDate(t.getDate() + 7); dO.value = iso(t); }
  });

  /* formularz (wizualizacja - bez wysyłki) */
  var form = document.getElementById('form');
  var info = document.getElementById('form-info');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!od.value || !dO.value || !form.imie.value.trim() || !form.kontakt.value.trim()) {
      info.className = 'form-info blad';
      info.textContent = 'Podaj daty pobytu, imię oraz telefon albo e-mail.';
      return;
    }
    var noce = Math.round((new Date(dO.value) - new Date(od.value)) / 864e5);
    info.className = 'form-info ok';
    info.textContent = 'Dziękujemy! ' + fAp.value + ', ' + noce + (noce === 1 ? ' noc' : (noce % 10 >= 2 && noce % 10 <= 4 && (noce % 100 < 10 || noce % 100 >= 20) ? ' noce' : ' nocy')) + '. To wersja pokazowa - w docelowej stronie zapytanie trafi od razu na skrzynkę gospodarza.';
    form.reset(); fAp.selectedIndex = 0;
  });

  /* dolny pasek na telefonie: dopiero po przewinięciu za przycisk w hero */
  var pasek = document.getElementById('mob-pasek');
  var cta = document.getElementById('hero-cta');
  var termin = document.getElementById('termin');
  if ('IntersectionObserver' in window && pasek && cta) {
    var zaCta = false, wTerminie = false;
    function ustaw() {
      var w = zaCta && !wTerminie;
      pasek.classList.toggle('widac', w);
      pasek.setAttribute('aria-hidden', String(!w));
      pasek.querySelectorAll('a').forEach(function (a) { a.tabIndex = w ? 0 : -1; });
    }
    new IntersectionObserver(function (en) { zaCta = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; ustaw(); }).observe(cta);
    new IntersectionObserver(function (en) { wTerminie = en[0].isIntersecting; ustaw(); }, { threshold: 0.1 }).observe(termin);
  }
})();
