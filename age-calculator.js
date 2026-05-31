/* Age Calculator page-local JavaScript only.
   This file intentionally contains only the code needed by age-calculator.html. */
(function () {
  'use strict';

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  function isAgePage() {
    return document.body && document.body.getAttribute('data-page') === 'age';
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

  function parseDateInput(value, endOfDay) {
    if (!value) return null;
    var parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some(function (n) { return !Number.isFinite(n); })) return null;
    var d = new Date(parts[0], parts[1] - 1, parts[2], endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    if (d.getFullYear() !== parts[0] || d.getMonth() !== parts[1] - 1 || d.getDate() !== parts[2]) return null;
    return d;
  }

  function formatDMY(value) {
    if (!value) return '-';
    var p = String(value).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : value;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
  }

  function calendarDate(date, locale) {
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (err) {
      return '-';
    }
  }

  function ageBreakdown(birth, target) {
    var years = target.getFullYear() - birth.getFullYear();
    var months = target.getMonth() - birth.getMonth();
    var days = target.getDate() - birth.getDate();
    var hours = target.getHours() - birth.getHours();
    var minutes = target.getMinutes() - birth.getMinutes();

    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    if (hours < 0) {
      days -= 1;
      hours += 24;
    }
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
      days: Math.max(0, days),
      hours: Math.max(0, hours),
      minutes: Math.max(0, minutes)
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

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function leapInfo(birth, target) {
    var count = 0;
    for (var y = birth.getFullYear(); y <= target.getFullYear(); y += 1) {
      if (isLeapYear(y)) count += 1;
    }
    if (birth.getMonth() === 1 && birth.getDate() === 29) {
      return 'Leap day birthday; leap years passed: ' + count;
    }
    return 'Born in leap year: ' + (isLeapYear(birth.getFullYear()) ? 'Yes' : 'No');
  }

  function nextBirthdayData(birth, target) {
    var next = new Date(target.getFullYear(), birth.getMonth(), birth.getDate(), 0, 0, 0, 0);
    if (next <= target) next = new Date(target.getFullYear() + 1, birth.getMonth(), birth.getDate(), 0, 0, 0, 0);
    var ms = Math.max(0, next.getTime() - target.getTime());
    return {
      age: Math.max(0, next.getFullYear() - birth.getFullYear()),
      days: Math.ceil(ms / 86400000),
      seconds: Math.floor(ms / 1000)
    };
  }

  function countdownToAge(birth, target, age, label) {
    var date = new Date(birth.getFullYear() + age, birth.getMonth(), birth.getDate(), 0, 0, 0, 0);
    if (target >= date) return label + ' reached';
    return formatNumber(Math.ceil((date.getTime() - target.getTime()) / 86400000)) + ' days before ' + label;
  }

  function resultRow(label, value) {
    return '<li class="age-single-result-row"><strong>' + escapeHtml(label) + ':</strong><span>' + escapeHtml(value) + '</span></li>';
  }

  function resultGroup(title, rows) {
    return '<section class="age-single-group-box"><h3>' + escapeHtml(title) + '</h3><ul class="age-single-result-list">' + rows.join('') + '</ul></section>';
  }

  function ensureResultPanel() {
    var main = $('main.age-calculator-container');
    var calculator = main && $(':scope > .calculator', main);
    if (!main || !calculator) return null;

    var panel = $('#ageReportOutput');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'ageReportOutput';
      panel.hidden = true;
    }

    $$('#ageResult, .age-final-output, .age-clean-result, .age-point-output').forEach(function (el) {
      if (el !== panel && el.id !== 'ageReportOutput') el.remove();
    });

    panel.className = 'age-single-output';
    panel.setAttribute('aria-label', 'Age Calculator result');
    panel.setAttribute('aria-live', 'polite');

    if (panel.parentElement !== main || panel.previousElementSibling !== calculator) {
      calculator.insertAdjacentElement('afterend', panel);
    }

    return panel;
  }

  function syncResultWidth() {
    if (!isAgePage()) return;
    var main = $('main.age-calculator-container');
    var calculator = main && $(':scope > .calculator', main);
    var panel = $('#ageReportOutput');
    if (!calculator || !panel) return;

    panel.style.boxSizing = 'border-box';
    panel.style.width = '100%';
    panel.style.maxWidth = '100%';

    if (window.innerWidth > 850) {
      var width = calculator.getBoundingClientRect().width;
      if (width > 0) {
        panel.style.width = width + 'px';
        panel.style.maxWidth = width + 'px';
      }
    }
  }

  function hideResult() {
    var panel = ensureResultPanel();
    if (!panel) return;
    panel.hidden = true;
    panel.innerHTML = '';
    syncResultWidth();
  }

  function showResult(html) {
    var panel = ensureResultPanel();
    if (!panel) return;
    panel.innerHTML = html;
    panel.hidden = false;
    syncResultWidth();
    window.requestAnimationFrame(syncResultWidth);
  }

  function calculateAge() {
    if (!isAgePage()) return;
    var nameInput = $('#ageName');
    var birthInput = $('#birthdate');
    var targetInput = $('#dateToCalculate');

    if (targetInput && !targetInput.value) targetInput.value = todayISO();
    if (!birthInput || !birthInput.value) {
      hideResult();
      return;
    }

    var targetValue = targetInput && targetInput.value ? targetInput.value : todayISO();
    var birth = parseDateInput(birthInput.value, false);
    var target = parseDateInput(targetValue, true);

    if (!birth || !target || birth > target) {
      showResult('<div class="age-single-result-shell"><div class="age-single-error">Please choose a valid birth date before the calculation date.</div></div>');
      return;
    }

    var exact = ageBreakdown(birth, target);
    var totalMs = Math.max(0, target.getTime() - birth.getTime());
    var totalDays = Math.floor(totalMs / 86400000);
    var totalSeconds = Math.floor(totalMs / 1000);
    var totalWeeks = Math.floor(totalDays / 7);
    var totalMonths = exact.years * 12 + exact.months;
    var name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '-';
    var animal = chineseZodiac(birth.getFullYear());
    var nextBirthday = nextBirthdayData(birth, target);
    var asianAge = target.getFullYear() - birth.getFullYear() + 1;
    var exactText = exact.years + ' years, ' + exact.months + ' months, ' + exact.days + ' days, ' + exact.hours + ' hours, ' + exact.minutes + ' minutes';
    var title = formatNumber(nextBirthday.seconds) + ' seconds to ' + nextBirthday.age + ' years old';

    var html = '<div class="age-single-result-shell">' +
      '<h2 class="age-single-result-title">' + escapeHtml(title) + '</h2>' +
      '<div class="age-single-result-grid">' +
      resultGroup('Birth & calendar', [
        resultRow('Name', name),
        resultRow('Date range', formatDMY(birthInput.value) + ' to ' + formatDMY(targetValue)),
        resultRow('Day of week born', birth.toLocaleDateString('en-US', { weekday: 'long' })),
        resultRow('Born date in Islamic calendar', calendarDate(birth, 'en-GB-u-ca-islamic')),
        resultRow('Born date in Chinese calendar', calendarDate(birth, 'en-GB-u-ca-chinese'))
      ]) +
      resultGroup('Current age', [
        resultRow('Exact age', exactText),
        resultRow('Normal age', exact.years + ' years old'),
        resultRow('Asian age', asianAge + ' years old'),
        resultRow('Age in ' + animal + ' year', exact.years),
        resultRow('Months old', formatNumber(totalMonths)),
        resultRow('Weeks old', formatNumber(totalWeeks)),
        resultRow('Days old', formatNumber(totalDays)),
        resultRow('Seconds old', formatNumber(totalSeconds))
      ]) +
      resultGroup('Birthday & milestones', [
        resultRow('Next birthday countdown', nextBirthday.days + ' day' + (nextBirthday.days === 1 ? '' : 's')),
        resultRow('Legal age', countdownToAge(birth, target, 18, 'legal adult age')),
        resultRow('Retirement', countdownToAge(birth, target, 60, 'retirement')),
        resultRow('Leap year age', leapInfo(birth, target))
      ]) +
      resultGroup('Life summary', [
        resultRow('Estimated sleep time', formatNumber(Math.floor(totalDays / 3)) + ' days'),
        resultRow('Estimated breaths', formatNumber(Math.round((totalSeconds / 60) * 16))),
        resultRow('Estimated heartbeats', formatNumber(Math.round((totalSeconds / 60) * 70))),
        resultRow('Moon cycles experienced', (totalDays / 29.530588).toFixed(1))
      ]) +
      resultGroup('Zodiac', [
        resultRow('Western zodiac', westernZodiac(birth.getMonth() + 1, birth.getDate())),
        resultRow('Chinese zodiac', animal)
      ]) +
      '</div></div>';

    showResult(html);
  }

  function scheduleAgeCalculation() {
    if (!isAgePage()) return;
    window.clearTimeout(window.__ageAutoCalculateTimer);
    window.__ageAutoCalculateTimer = window.setTimeout(function () {
      calculateAge();
    }, 0);
  }

  function setupAgePage() {
    if (!isAgePage()) return;
    ensureResultPanel();
    var targetInput = $('#dateToCalculate');
    if (targetInput && !targetInput.value) targetInput.value = todayISO();

    ['ageName', 'birthdate', 'dateToCalculate'].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input || input.dataset.ageBound === '1') return;
      input.dataset.ageBound = '1';
      ['input', 'change', 'keyup', 'blur'].forEach(function (eventName) {
        input.addEventListener(eventName, scheduleAgeCalculation);
      });
    });

    scheduleAgeCalculation();
    syncResultWidth();
  }

  function setupNavbar() {
    var navbar = $('#navbar');
    if (!navbar) return;

    $$('.clean-nav-button', navbar).forEach(function (button) {
      if (button.dataset.navBound === '1') return;
      button.dataset.navBound = '1';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        var parent = button.closest('.clean-nav-dropdown, .clean-nav-submenu');
        if (!parent) return;
        var open = parent.classList.toggle('nav-open');
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });

    document.addEventListener('click', function (event) {
      if (!navbar.contains(event.target)) {
        $$('.nav-open', navbar).forEach(function (el) { el.classList.remove('nav-open'); });
        $$('.clean-nav-button[aria-expanded="true"]', navbar).forEach(function (btn) { btn.setAttribute('aria-expanded', 'false'); });
      }
    });
  }

  function setupSearch() {
    var form = $('.clean-nav-search');
    var input = $('#cleanCalculatorSearchInput');
    var list = form && $('.clean-nav-search-results', form);
    if (!form || !input || !list) return;

    var tools = $$('.clean-calculator-panel a').map(function (link) {
      return { title: (link.textContent || '').trim(), href: link.getAttribute('href') || '#' };
    }).filter(function (item) { return item.title; });

    function render() {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        list.hidden = true;
        list.innerHTML = '';
        return;
      }
      var matches = tools.filter(function (item) { return item.title.toLowerCase().indexOf(q) !== -1; }).slice(0, 8);
      list.innerHTML = matches.map(function (item) {
        return '<li><a href="' + escapeHtml(item.href) + '">' + escapeHtml(item.title) + '</a></li>';
      }).join('');
      list.hidden = matches.length === 0;
    }

    input.addEventListener('input', render);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var first = $('a', list);
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
    setupAgePage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();

  window.addEventListener('load', function () {
    setupAgePage();
    syncResultWidth();
  });
  window.addEventListener('resize', syncResultWidth);
})();
