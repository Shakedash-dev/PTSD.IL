// Shared behaviour for every page.
//
// The header, its three menu panels, the mobile drawer and the footer live in
// partials/ and are injected here, so the menu has one source. Everything that
// depends on them is initialised after the injection, not before.

(function () {
  document.documentElement.classList.add('js');

  var chromeSlot = document.getElementById('site-chrome');
  var footerSlot = document.getElementById('site-footer');

  Promise.all([
    fetch('partials/chrome.html').then(function (r) { return r.text(); }),
    fetch('partials/footer.html').then(function (r) { return r.text(); })
  ]).then(function (parts) {
    if (chromeSlot) { chromeSlot.innerHTML = parts[0]; chromeSlot.removeAttribute('style'); }
    if (footerSlot) { footerSlot.innerHTML = parts[1]; }
    markCurrentPage();
    initMenus();
  });

  // ---- which page are we on -------------------------------------------
  // The menu shows it, so a visitor three levels in still knows where they are.
  function markCurrentPage() {
    var here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.mega__col a, .acc__panel a, .footer a').forEach(function (a) {
      var target = (a.getAttribute('href') || '').split('/').pop();
      if (target && target === here) a.setAttribute('aria-current', 'page');
    });
    var open = document.querySelector('.mega__col a[aria-current="page"]');
    if (open) {
      var panel = open.closest('.mega');
      var btn = panel && document.querySelector('.nav__btn[data-mega="' + panel.id + '"]');
      if (btn) btn.setAttribute('data-current', 'true');
    }
  }

  // ---- menus -----------------------------------------------------------
  function initMenus() {
    var header = document.getElementById('header');
    var triggers = Array.prototype.slice.call(document.querySelectorAll('.nav__btn'));
    var open = null;

    function closeMega() {
      if (!open) return;
      document.getElementById(open.dataset.mega).hidden = true;
      open.setAttribute('aria-expanded', 'false');
      open = null;
    }

    function openMega(btn) {
      closeMega();
      document.getElementById(btn.dataset.mega).hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      open = btn;
    }

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (open === btn) closeMega(); else openMega(btn);
      });
      // Once a panel is open, hovering a sibling switches to it. Hovering never
      // opens the first one, so the menu cannot ambush someone reading the page.
      btn.addEventListener('mouseenter', function () {
        if (open && open !== btn) openMega(btn);
      });
    });

    if (header) header.addEventListener('mouseleave', closeMega);
    document.addEventListener('click', function (e) {
      if (open && header && !header.contains(e.target)) closeMega();
    });

    // ---- drawer ----
    var drawer = document.getElementById('drawer');
    var burger = document.getElementById('burger');

    function closeDrawer() {
      if (!drawer || drawer.hidden) return;
      drawer.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      burger.focus();
    }

    if (burger) {
      burger.addEventListener('click', function () {
        drawer.hidden = false;
        burger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        var first = drawer.querySelector('[data-close]:not(.drawer__scrim)');
        if (first) first.focus();
      });
      drawer.querySelectorAll('[data-close]').forEach(function (el) {
        el.addEventListener('click', closeDrawer);
      });
      drawer.querySelectorAll('.drawer__panel a').forEach(function (a) {
        a.addEventListener('click', closeDrawer);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMega(); closeDrawer(); return; }
      // While the drawer is open it is the whole interface, so Tab cycles inside
      // it instead of walking off into the page hidden behind it.
      if (e.key !== 'Tab' || !drawer || drawer.hidden) return;
      var items = [].slice.call(drawer.querySelectorAll('a[href], button')).filter(function (el) {
        return el.offsetParent !== null;
      });
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Only the drawer's accordions. The ones on content pages are bound below,
    // when the page itself loads; binding them twice would toggle them back.
    if (drawer) bindAccordions(drawer);
  }

  // ---- page content that does not wait for the chrome -------------------

  // Links whose page does not exist yet are written href="#". Left alone the
  // browser jumps to the top of the page on every click, which reads as a bug.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });

  function bindAccordions(root) {
    root.querySelectorAll('.acc__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isOpen));
        document.getElementById(btn.getAttribute('aria-controls')).hidden = isOpen;
      });
    });
  }

  // Accordions on a content page load with the page, before the chrome arrives.
  bindAccordions(document);



  // ---- sections the reader opens -----------------------------------------
  document.querySelectorAll('[data-toggle]').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    var label = btn.querySelector('.toggle__label');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (panel) panel.hidden = open;
      if (label) label.textContent = open ? btn.dataset.show : btn.dataset.hide;
    });
  });

  // ---- catalogue filters ------------------------------------------------
  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    var filters = [].slice.call(filterBar.querySelectorAll('.filter'));
    var items = [].slice.call(document.querySelectorAll('[data-category]'));
    var count = document.getElementById('result-count');
    // What the bar is filtering, so the running total reads correctly on a
    // page of questions or of age groups and not only on the course catalogue.
    var noun = filterBar.dataset.noun || 'קורסים';
    // A bar without an "all" filter is a chooser, not a filter: one group is
    // shown at a time and a count of what is hidden would mean nothing.
    var hasAll = filters.some(function (f) { return f.dataset.filter === 'all'; });
    if (count && !hasAll) count.hidden = true;

    filters.forEach(function (f) {
      var key = f.dataset.filter;
      var n = key === 'all' ? items.length : items.filter(function (i) { return i.dataset.category === key; }).length;
      var badge = f.querySelector('.filter__count');
      if (badge) badge.textContent = n;
    });

    function apply(key) {
      var shown = 0;
      items.forEach(function (i) {
        var ok = key === 'all' || i.dataset.category === key;
        i.hidden = !ok;
        if (ok) shown++;
      });
      filters.forEach(function (f) { f.setAttribute('aria-pressed', String(f.dataset.filter === key)); });
      if (count && hasAll) {
        count.textContent = shown === items.length
          ? 'מציג את כל ' + items.length + ' ה' + noun
          : 'מציג ' + shown + ' מתוך ' + items.length + ' ' + noun;
      }
    }

    filters.forEach(function (f) {
      f.addEventListener('click', function () { apply(f.dataset.filter); });
    });
    apply(hasAll ? 'all' : filters[0].dataset.filter);
  }

  // ---- the self-check questionnaire --------------------------------------
  // Nothing leaves the page: the score is worked out here and never sent or
  // stored, which is what the page itself promises the visitor.
  var quiz = document.getElementById('quiz');
  if (quiz) {
    var groups = [].slice.call(quiz.querySelectorAll('.quiz__q'));
    var left = document.getElementById('quiz-left');
    var result = document.getElementById('quiz-result');
    var cutoff = Number(quiz.dataset.cutoff || 0);
    var maxScore = Number(quiz.dataset.max || 0);

    function answered() {
      return groups.filter(function (g) { return g.querySelector('input:checked'); });
    }

    function updateLeft() {
      var n = groups.length - answered().length;
      left.textContent = n === 0 ? 'ענית על כל השאלות' : n + ' שאלות נותרו';
    }

    quiz.addEventListener('change', function () {
      updateLeft();
      groups.forEach(function (g) { g.removeAttribute('data-missing'); });
    });

    quiz.addEventListener('reset', function () {
      setTimeout(function () {
        updateLeft();
        result.hidden = true;
        groups.forEach(function (g) { g.removeAttribute('data-missing'); });
      }, 0);
    });

    quiz.addEventListener('submit', function (e) {
      e.preventDefault();
      var missing = groups.filter(function (g) { return !g.querySelector('input:checked'); });
      if (missing.length) {
        missing.forEach(function (g) { g.setAttribute('data-missing', 'true'); });
        missing[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
        left.textContent = 'כדי לחשב תוצאה צריך לענות על כל ' + groups.length + ' השאלות. ' + missing.length + ' נותרו.';
        return;
      }
      var score = answered().reduce(function (sum, g) {
        return sum + Number(g.querySelector('input:checked').value);
      }, 0);
      var over = score >= cutoff;
      result.innerHTML =
        '<h3>התוצאה שלך: <span class="quiz__score">' + score + '</span> מתוך ' + maxScore + '</h3>' +
        '<p>' + (over
          ? 'הציון שלך עובר את סף הבדיקה (' + cutoff + '). זה לא אבחנה - זה סימן שכדאי להתייעץ עם איש מקצוע.'
          : 'הציון שלך מתחת לסף הבדיקה (' + cutoff + '). גם כך, אם משהו מטריד אותך, אפשר תמיד להתייעץ.') + '</p>' +
        '<div class="row" style="margin-top:var(--s3)">' +
        '<a class="btn btn--primary btn--sm" href="where-to-get-help.html">איפה מקבלים טיפול</a>' +
        '<a class="btn btn--secondary btn--sm" href="tel:1201" dir="ltr">1201</a>' +
        '</div>';
      result.hidden = false;
      result.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    updateLeft();
  }

  // ---- the figures: reveal once, and count up on the way in ----
  var stats = Array.prototype.slice.call(document.querySelectorAll('.stat'));
  if (!stats.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function settle(el) {
    var to = Number(el.dataset.to || 0);
    // a year carries no thousands separator
    var figure = el.dataset.plain === 'true' ? String(to) : to.toLocaleString('en-US');
    el.textContent = (el.dataset.prefix || '') + figure + (el.dataset.suffix || '');
  }

  function countUp(el) {
    // A year is read, not counted, so it is written out and only revealed.
    if (el.dataset.plain === 'true' || reduced) { settle(el); return; }
    var to = Number(el.dataset.to || 0);
    var started = null;
    var ms = 1400;
    function frame(now) {
      if (started === null) started = now;
      var p = Math.min(1, (now - started) / ms);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (el.dataset.prefix || '') + Math.round(to * eased).toLocaleString('en-US') + (el.dataset.suffix || '');
      if (p < 1) requestAnimationFrame(frame); else settle(el);
    }
    requestAnimationFrame(frame);
  }

  if (!('IntersectionObserver' in window)) {
    stats.forEach(function (s) { s.classList.add('is-in'); countUp(s.querySelector('b')); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      io.unobserve(el);
      setTimeout(function () {
        el.classList.add('is-in');
        countUp(el.querySelector('b'));
      }, stats.indexOf(el) * 120);
    });
  }, { threshold: 0.4 });

  stats.forEach(function (s) { io.observe(s); });
})();
