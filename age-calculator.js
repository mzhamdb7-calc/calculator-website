/* Age Calculator page-local JavaScript only. */
(function () {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function isAgePage() {
    return !!(document.body && document.body.getAttribute('data-page') === 'age');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseDate(value, endOfDay) {
    if (!value) return null;
    var parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some(function (n) { return !Number.isFinite(n); })) return null;

    var date = new Date(
      parts[0],
      parts[1] - 1,
      parts[2],
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0
    );

    if (date.getFullYear() !== parts[0] || date.getMonth() !== parts[1] - 1 || date.getDate() !== parts[2]) return null;
    return date;
  }

  function formatDate(value) {
    var parts = String(value || '').split('-');
    return parts.length === 3 ? parts[2] + '/' + parts[1] + '/' + parts[0] : '-';
  }

  function number(value) {
    return Number(value || 0).toLocaleString('en-US');
  }

  function formatCalendar(date, locale) {
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      return '-';
    }
  }

  function ageParts(birth, target) {
    var years = target.getFullYear() - birth.getFullYear();
    var months = target.getMonth() - birth.getMonth();
    var days = target.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      days += new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return {
      years: Math.max(0, years),
      months: Math.max(0, months),
      days: Math.max(0, days)
    };
  }

  function westernZodiac(month, day) {
    var signs = [
      ['Capricorn', 1, 19], ['Aquarius', 2, 18], ['Pisces', 3, 20], ['Aries', 4, 19],
      ['Taurus', 5, 20], ['Gemini', 6, 20], ['Cancer', 7, 22], ['Leo', 8, 22],
      ['Virgo', 9, 22], ['Libra', 10, 22], ['Scorpio', 11, 21], ['Sagittarius', 12, 21]
    ];

    for (var i = 0; i < signs.length; i += 1) {
      if (month < signs[i][1] || (month === signs[i][1] && day <= signs[i][2])) return signs[i][0];
    }

    return 'Capricorn';
  }

  function chineseZodiac(year) {
    var animals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
    var index = (year - 1900) % 12;
    if (index < 0) index += 12;
    return animals[index];
  }

  function nextBirthdayDays(birth, target) {
    var targetDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    var next = new Date(targetDateOnly.getFullYear(), birth.getMonth(), birth.getDate());
    if (next < targetDateOnly) next = new Date(targetDateOnly.getFullYear() + 1, birth.getMonth(), birth.getDate());
    return Math.max(0, Math.ceil((next.getTime() - targetDateOnly.getTime()) / 86400000));
  }

  function daysUntilAge(birth, target, wantedAge, label) {
    var date = new Date(birth.getFullYear() + wantedAge, birth.getMonth(), birth.getDate());
    if (target >= date) return label + ' reached';
    return number(Math.ceil((date.getTime() - target.getTime()) / 86400000)) + ' days before ' + label;
  }

  function resultRow(label, value) {
    return '<li class="age-single-result-row"><strong>' + escapeHtml(label) + '</strong><span>' + escapeHtml(value) + '</span></li>';
  }

  function resultGroup(title, rows) {
    return '<section class="age-single-group-box"><h3>' + escapeHtml(title) + '</h3><ul class="age-single-result-list">' + rows.join('') + '</ul></section>';
  }

  function getMainAndCalculator() {
    var main = qs('main.age-calculator-container');
    var calculator = null;
    if (main) {
      for (var i = 0; i < main.children.length; i += 1) {
        if (main.children[i].classList && main.children[i].classList.contains('calculator')) {
          calculator = main.children[i];
          break;
        }
      }
    }
    return { main: main, calculator: calculator };
  }

  function ensureResultPanel() {
    var layout = getMainAndCalculator();
    if (!layout.main || !layout.calculator) return null;

    var panels = qsa('#ageReportOutput');
    var panel = panels[0] || null;

    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'ageReportOutput';
      panel.hidden = true;
    }

    panels.forEach(function (item) {
      if (item !== panel) item.remove();
    });

    qsa('#ageResult, .age-final-output, .age-clean-result, .age-point-output').forEach(function (item) {
      if (item !== panel && item.id !== 'ageReportOutput') item.remove();
    });

    panel.className = 'age-single-output';
    panel.setAttribute('aria-label', 'Age Calculator result');
    panel.setAttribute('aria-live', 'polite');

    if (panel.parentElement !== layout.main || panel.previousElementSibling !== layout.calculator) {
      layout.calculator.insertAdjacentElement('afterend', panel);
    }

    return panel;
  }

  function syncResultWidth() {
    if (!isAgePage()) return;

    var layout = getMainAndCalculator();
    var panel = byId('ageReportOutput');
    if (!layout.calculator || !panel) return;

    panel.style.boxSizing = 'border-box';
    panel.style.width = '100%';
    panel.style.maxWidth = '100%';

    if (window.innerWidth > 850) {
      var width = Math.round(layout.calculator.getBoundingClientRect().width);
      if (width > 0) {
        panel.style.width = width + 'px';
        panel.style.maxWidth = width + 'px';
      }
    }
  }

  function hideResult() {
    var panel = ensureResultPanel();
    if (!panel) return;
    panel.innerHTML = '';
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    syncResultWidth();
  }

  function showResult(html) {
    var panel = ensureResultPanel();
    if (!panel) return;
    panel.innerHTML = html;
    panel.hidden = false;
    panel.removeAttribute('aria-hidden');
    syncResultWidth();
    if (window.requestAnimationFrame) window.requestAnimationFrame(syncResultWidth);
  }

  function calculateAge() {
    if (!isAgePage()) return;

    var nameInput = byId('ageName');
    var birthInput = byId('birthdate');
    var targetInput = byId('dateToCalculate');

    if (targetInput && !targetInput.value) targetInput.value = todayISO();
    if (!birthInput || !birthInput.value) {
      hideResult();
      return;
    }

    var birthValue = birthInput.value;
    var targetValue = targetInput && targetInput.value ? targetInput.value : todayISO();
    var birth = parseDate(birthValue, false);
    var target = parseDate(targetValue, true);

    if (!birth || !target || birth > target) {
      showResult('<div class="age-single-result-shell"><div class="age-single-error">Please choose a valid birth date before the calculation date.</div></div>');
      return;
    }

    var parts = ageParts(birth, target);
    var totalMs = Math.max(0, target.getTime() - birth.getTime());
    var totalDays = Math.floor(totalMs / 86400000);
    var totalSeconds = Math.floor(totalMs / 1000);
    var totalWeeks = Math.floor(totalDays / 7);
    var totalMonths = parts.years * 12 + parts.months;
    var animal = chineseZodiac(birth.getFullYear());
    var name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '-';
    var asianAge = target.getFullYear() - birth.getFullYear() + 1;
    var birthdayDays = nextBirthdayDays(birth, target);
    var exactText = parts.years + ' years, ' + parts.months + ' months, ' + parts.days + ' days';

    var html = '<div class="age-single-result-shell">' +
      '<h2 class="age-single-result-title">Age result</h2>' +
      '<div class="age-single-result-grid">' +
      resultGroup('Birth & calendar', [
        resultRow('Name', name),
        resultRow('Date range', formatDate(birthValue) + ' to ' + formatDate(targetValue)),
        resultRow('Day of week born', birth.toLocaleDateString('en-US', { weekday: 'long' })),
        resultRow('Born date in Islamic calendar', formatCalendar(birth, 'en-GB-u-ca-islamic')),
        resultRow('Born date in Chinese calendar', formatCalendar(birth, 'en-GB-u-ca-chinese'))
      ]) +
      resultGroup('Current age', [
        resultRow('Exact age', exactText),
        resultRow('Normal age', parts.years + ' years old'),
        resultRow('Asian age', asianAge + ' years old'),
        resultRow('Age in ' + animal + ' year', parts.years + ' years old')
      ]) +
      resultGroup('Total time lived', [
        resultRow('Months old', number(totalMonths)),
        resultRow('Weeks old', number(totalWeeks)),
        resultRow('Days old', number(totalDays)),
        resultRow('Seconds old', number(totalSeconds))
      ]) +
      resultGroup('Birthday & milestones', [
        resultRow('Next birthday countdown', birthdayDays + ' day' + (birthdayDays === 1 ? '' : 's')),
        resultRow('Legal age', daysUntilAge(birth, target, 18, 'legal adult age')),
        resultRow('Retirement', daysUntilAge(birth, target, 60, 'retirement'))
      ]) +
      resultGroup('Life summary', [
        resultRow('Estimated sleep time', number(Math.floor(totalDays / 3)) + ' days'),
        resultRow('Estimated breaths', number(Math.round((totalSeconds / 60) * 16))),
        resultRow('Estimated heartbeats', number(Math.round((totalSeconds / 60) * 70))),
        resultRow('Moon cycles experienced', (totalDays / 29.530588).toFixed(1))
      ]) +
      resultGroup('Zodiac', [
        resultRow('Western zodiac', westernZodiac(birth.getMonth() + 1, birth.getDate())),
        resultRow('Chinese zodiac', animal)
      ]) +
      '</div></div>';

    showResult(html);
  }

  var ageTimer = null;
  var lastAgeKey = '';

  function scheduleAgeCalculation() {
    if (!isAgePage()) return;
    window.clearTimeout(ageTimer);
    ageTimer = window.setTimeout(calculateAge, 30);
  }

  function currentAgeKey() {
    var birth = byId('birthdate');
    var target = byId('dateToCalculate');
    var name = byId('ageName');
    return [
      birth ? birth.value : '',
      target ? target.value : '',
      name ? name.value : ''
    ].join('|');
  }

  function checkAgeValueChange() {
    if (!isAgePage()) return;
    var key = currentAgeKey();
    if (key !== lastAgeKey) {
      lastAgeKey = key;
      scheduleAgeCalculation();
    }
  }

  function bindAgeInputs() {
    if (!isAgePage()) return;

    ensureResultPanel();

    var targetInput = byId('dateToCalculate');
    if (targetInput && !targetInput.value) targetInput.value = todayISO();

    ['ageName', 'birthdate', 'dateToCalculate'].forEach(function (id) {
      var input = byId(id);
      if (!input || input.dataset.ageAutoBound === '1') return;
      input.dataset.ageAutoBound = '1';

      ['input', 'change', 'keyup', 'paste', 'blur'].forEach(function (eventName) {
        input.addEventListener(eventName, scheduleAgeCalculation);
      });
    });

    if (!document.documentElement.dataset.ageDelegatedAutoBound) {
      document.documentElement.dataset.ageDelegatedAutoBound = '1';
      document.addEventListener('input', function (event) {
        if (event.target && /^(ageName|birthdate|dateToCalculate)$/.test(event.target.id || '')) scheduleAgeCalculation();
      }, true);
      document.addEventListener('change', function (event) {
        if (event.target && /^(ageName|birthdate|dateToCalculate)$/.test(event.target.id || '')) scheduleAgeCalculation();
      }, true);
    }

    lastAgeKey = currentAgeKey();
    calculateAge();
    syncResultWidth();
  }

  function setupNavbar() {
    var navbar = byId('navbar');
    if (!navbar) return;

    qsa('.clean-nav-button', navbar).forEach(function (button) {
      if (button.dataset.navBound === '1') return;
      button.dataset.navBound = '1';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        var parent = button.closest('.clean-nav-dropdown, .clean-nav-submenu');
        if (!parent) return;
        var isOpen = parent.classList.toggle('nav-open');
        button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });

    document.addEventListener('click', function (event) {
      if (!navbar.contains(event.target)) {
        qsa('.nav-open', navbar).forEach(function (item) { item.classList.remove('nav-open'); });
        qsa('.clean-nav-button[aria-expanded="true"]', navbar).forEach(function (button) {
          button.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  function setupSearch() {
    var form = qs('.clean-nav-search');
    var input = byId('cleanCalculatorSearchInput');
    var list = form ? qs('.clean-nav-search-results', form) : null;
    if (!form || !input || !list) return;

    var tools = qsa('.clean-calculator-panel a').map(function (link) {
      return {
        title: (link.textContent || '').trim(),
        href: link.getAttribute('href') || '#'
      };
    }).filter(function (item) { return item.title; });

    function renderSearch() {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        list.hidden = true;
        list.innerHTML = '';
        return;
      }

      var matches = tools.filter(function (item) {
        return item.title.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 8);

      list.innerHTML = matches.map(function (item) {
        return '<li><a href="' + escapeHtml(item.href) + '">' + escapeHtml(item.title) + '</a></li>';
      }).join('');
      list.hidden = matches.length === 0;
    }

    input.addEventListener('input', renderSearch);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var first = qs('a', list);
      if (first) window.location.href = first.getAttribute('href');
    });
  }

  window.scrollToTop = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.calculateAge = calculateAge;
  window.calculateAgeStandalone = calculateAge;

  function ready() {
    setupNavbar();
    setupSearch();
    bindAgeInputs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }

  window.addEventListener('load', function () {
    bindAgeInputs();
    syncResultWidth();
  });

  window.addEventListener('resize', syncResultWidth);

  window.setInterval(checkAgeValueChange, 350);
})();
