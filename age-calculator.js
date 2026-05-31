/* Age Calculator page-only JavaScript. No shared calculator files needed. */
(function () {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;

  function id(name) {
    return document.getElementById(name);
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

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function todayISO() {
    var today = new Date();
    return today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
  }

  function parseISODate(value) {
    var match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var date = new Date(year, month - 1, day);

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return {
      year: year,
      month: month,
      day: day,
      date: date,
      utc: Date.UTC(year, month - 1, day)
    };
  }

  function formatDate(value) {
    var parsed = parseISODate(value);
    if (!parsed) return '-';
    return pad(parsed.day) + '/' + pad(parsed.month) + '/' + parsed.year;
  }

  function number(value) {
    return Number(value || 0).toLocaleString('en-US');
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function ageParts(birth, target) {
    var years = target.year - birth.year;
    var months = target.month - birth.month;
    var days = target.day - birth.day;

    if (days < 0) {
      months -= 1;
      days += daysInMonth(target.year, target.month - 1);
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

  function formatCalendar(parsed, locale) {
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(parsed.date);
    } catch (error) {
      return '-';
    }
  }

  function westernZodiac(month, day) {
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
    return 'Capricorn';
  }

  function chineseZodiac(year) {
    var animals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
    var index = (year - 1900) % 12;
    if (index < 0) index += 12;
    return animals[index];
  }

  function nextBirthdayDays(birth, target) {
    var targetUtc = target.utc;
    var nextUtc = Date.UTC(target.year, birth.month - 1, birth.day);
    if (nextUtc < targetUtc) nextUtc = Date.UTC(target.year + 1, birth.month - 1, birth.day);
    return Math.max(0, Math.ceil((nextUtc - targetUtc) / DAY_MS));
  }

  function daysUntilAge(birth, target, wantedAge, label) {
    var milestoneUtc = Date.UTC(birth.year + wantedAge, birth.month - 1, birth.day);
    if (target.utc >= milestoneUtc) return label + ' reached';
    return number(Math.ceil((milestoneUtc - target.utc) / DAY_MS)) + ' days before ' + label;
  }

  function row(label, value) {
    return '<li class="age-single-result-row"><strong>' + escapeHtml(label) + '</strong><span>' + escapeHtml(value) + '</span></li>';
  }

  function group(title, rows) {
    return '<section class="age-single-group-box"><h3>' + escapeHtml(title) + '</h3><ul class="age-single-result-list">' + rows.join('') + '</ul></section>';
  }

  function getLayout() {
    var main = qs('main.age-calculator-container');
    var calculator = main ? qs(':scope > .calculator', main) : qs('.calculator');
    return { main: main, calculator: calculator };
  }

  function ensureResultPanel() {
    var layout = getLayout();
    if (!layout.main || !layout.calculator) return null;

    var panels = qsa('#ageReportOutput');
    var panel = panels[0];

    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'ageReportOutput';
    }

    panels.forEach(function (otherPanel) {
      if (otherPanel !== panel) otherPanel.remove();
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
    var panel = id('ageReportOutput');
    var calculator = qs('main.age-calculator-container > .calculator') || qs('.calculator');
    if (!panel || !calculator) return;

    panel.style.boxSizing = 'border-box';
    panel.style.width = '100%';
    panel.style.maxWidth = '100%';

    if (window.innerWidth > 850) {
      var width = Math.round(calculator.getBoundingClientRect().width);
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
    panel.style.display = 'none';
    syncResultWidth();
  }

  function showResult(html) {
    var panel = ensureResultPanel();
    if (!panel) return;
    panel.innerHTML = html;
    panel.hidden = false;
    panel.removeAttribute('hidden');
    panel.removeAttribute('aria-hidden');
    panel.style.display = 'block';
    syncResultWidth();
    setTimeout(syncResultWidth, 0);
  }

  function calculateAge() {
    if (!isAgePage()) return false;

    var nameInput = id('ageName');
    var birthInput = id('birthdate');
    var targetInput = id('dateToCalculate');

    if (!birthInput) return false;
    if (targetInput && !targetInput.value) targetInput.value = todayISO();

    if (!birthInput.value) {
      hideResult();
      return false;
    }

    var birthValue = birthInput.value;
    var targetValue = targetInput && targetInput.value ? targetInput.value : todayISO();
    var birth = parseISODate(birthValue);
    var target = parseISODate(targetValue);

    if (!birth || !target || birth.utc > target.utc) {
      showResult('<div class="age-single-result-shell"><div class="age-single-error">Please choose a valid birth date before the calculation date.</div></div>');
      return false;
    }

    var parts = ageParts(birth, target);
    var totalDays = Math.max(0, Math.floor((target.utc - birth.utc) / DAY_MS));
    var totalWeeks = Math.floor(totalDays / 7);
    var totalMonths = parts.years * 12 + parts.months;
    var totalSeconds = totalDays * 24 * 60 * 60;
    var animal = chineseZodiac(birth.year);
    var name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '-';
    var asianAge = target.year - birth.year + 1;
    var exactAge = parts.years + ' years, ' + parts.months + ' months, ' + parts.days + ' days';
    var birthdayDays = nextBirthdayDays(birth, target);

    var html = '<div class="age-single-result-shell">' +
      '<h2 class="age-single-result-title">Age result</h2>' +
      '<div class="age-single-result-grid">' +
      group('Birth & calendar', [
        row('Name', name),
        row('Date range', formatDate(birthValue) + ' to ' + formatDate(targetValue)),
        row('Day of week born', birth.date.toLocaleDateString('en-US', { weekday: 'long' })),
        row('Born date in Islamic calendar', formatCalendar(birth, 'en-GB-u-ca-islamic')),
        row('Born date in Chinese calendar', formatCalendar(birth, 'en-GB-u-ca-chinese'))
      ]) +
      group('Current age', [
        row('Exact age', exactAge),
        row('Normal age', parts.years + ' years old'),
        row('Asian age', asianAge + ' years old'),
        row('Age in ' + animal + ' year', parts.years + ' years old')
      ]) +
      group('Total time lived', [
        row('Months old', number(totalMonths)),
        row('Weeks old', number(totalWeeks)),
        row('Days old', number(totalDays)),
        row('Seconds old', number(totalSeconds))
      ]) +
      group('Birthday & milestones', [
        row('Next birthday countdown', birthdayDays + ' day' + (birthdayDays === 1 ? '' : 's')),
        row('Legal age', daysUntilAge(birth, target, 18, 'legal adult age')),
        row('Retirement', daysUntilAge(birth, target, 60, 'retirement'))
      ]) +
      group('Life summary', [
        row('Estimated sleep time', number(Math.floor(totalDays / 3)) + ' days'),
        row('Estimated breaths', number(Math.round(totalDays * 24 * 60 * 16))),
        row('Estimated heartbeats', number(Math.round(totalDays * 24 * 60 * 70))),
        row('Moon cycles experienced', (totalDays / 29.530588).toFixed(1))
      ]) +
      group('Zodiac', [
        row('Western zodiac', westernZodiac(birth.month, birth.day)),
        row('Chinese zodiac', animal)
      ]) +
      '</div></div>';

    showResult(html);
    return true;
  }

  var calculateTimer = null;

  function scheduleCalculate() {
    clearTimeout(calculateTimer);
    calculateTimer = setTimeout(calculateAge, 20);
  }

  function bindAgeInputs() {
    if (!isAgePage()) return;

    ensureResultPanel();

    var targetInput = id('dateToCalculate');
    if (targetInput && !targetInput.value) targetInput.value = todayISO();

    ['ageName', 'birthdate', 'dateToCalculate'].forEach(function (inputId) {
      var input = id(inputId);
      if (!input || input.dataset.ageBound === '1') return;
      input.dataset.ageBound = '1';

      ['input', 'change', 'keyup', 'paste', 'blur'].forEach(function (eventName) {
        input.addEventListener(eventName, scheduleCalculate);
      });
    });

    calculateAge();
    syncResultWidth();
  }

  function setupNavbar() {
    var navbar = id('navbar');
    if (!navbar) return;

    qsa('.clean-nav-button', navbar).forEach(function (button) {
      if (button.dataset.navBound === '1') return;
      button.dataset.navBound = '1';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        var parent = button.closest('.clean-nav-dropdown, .clean-nav-submenu');
        if (!parent) return;
        parent.classList.toggle('is-open');
        parent.classList.toggle('nav-open');
        button.setAttribute('aria-expanded', parent.classList.contains('is-open') || parent.classList.contains('nav-open') ? 'true' : 'false');
      });
    });

    document.addEventListener('click', function (event) {
      if (!navbar.contains(event.target)) {
        qsa('.is-open, .nav-open', navbar).forEach(function (item) {
          item.classList.remove('is-open');
          item.classList.remove('nav-open');
        });
        qsa('.clean-nav-button[aria-expanded="true"]', navbar).forEach(function (button) {
          button.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  function setupSearch() {
    var form = qs('.clean-nav-search');
    var input = id('cleanCalculatorSearchInput');
    var list = form ? qs('.clean-nav-search-results', form) : null;
    if (!form || !input || !list) return;

    var tools = qsa('.clean-calculator-panel a').map(function (link) {
      return {
        title: (link.textContent || '').trim(),
        href: link.getAttribute('href') || '#'
      };
    }).filter(function (item) {
      return item.title;
    });

    function renderSearch() {
      var query = input.value.trim().toLowerCase();
      if (!query) {
        list.hidden = true;
        list.innerHTML = '';
        return;
      }

      var matches = tools.filter(function (item) {
        return item.title.toLowerCase().indexOf(query) !== -1;
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
    try { bindAgeInputs(); } catch (error) { /* keep page usable */ }
    try { setupNavbar(); } catch (error) { /* keep page usable */ }
    try { setupSearch(); } catch (error) { /* keep page usable */ }
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
})();
