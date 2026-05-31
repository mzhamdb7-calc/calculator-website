/* Age Calculator page-only JavaScript. Auto-calculate, single result box, live countdown, result actions. */
(function () {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;
  var liveCountdownTimer = null;
  var feedbackTimer = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function isAgePage() {
    return !!document.body && document.body.getAttribute('data-page') === 'age';
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
    var now = new Date();
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  }

  function parseDateInput(value) {
    var match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
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

  function formatDateInput(value) {
    var parsed = parseDateInput(value);
    if (!parsed) return '-';
    return pad(parsed.day) + '/' + pad(parsed.month) + '/' + parsed.year;
  }

  function comma(value) {
    return Number(value || 0).toLocaleString('en-US');
  }

  function plainNumber(value) {
    return String(Math.max(0, Math.floor(Number(value) || 0)));
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function getAgeParts(birth, target) {
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

    return { years: years, months: months, days: days };
  }

  function safeCalendar(parsed, locale) {
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(parsed.date);
    } catch (err) {
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

  function chineseZodiacElement(year) {
    var elements = ['Metal', 'Metal', 'Water', 'Water', 'Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth'];
    var index = (year - 1900) % 10;
    if (index < 0) index += 10;
    return elements[index];
  }

  function birthdayUtcForYear(birth, year) {
    var day = birth.day;
    if (birth.month === 2 && birth.day === 29 && daysInMonth(year, 2) < 29) {
      day = 28;
    }
    return Date.UTC(year, birth.month - 1, day);
  }

  function birthdayLocalForYear(birth, year) {
    var day = birth.day;
    if (birth.month === 2 && birth.day === 29 && daysInMonth(year, 2) < 29) {
      day = 28;
    }
    return new Date(year, birth.month - 1, day, 0, 0, 0, 0);
  }

  function parsedFromUtc(utc) {
    var date = new Date(utc);
    var year = date.getUTCFullYear();
    var month = date.getUTCMonth() + 1;
    var day = date.getUTCDate();
    return {
      year: year,
      month: month,
      day: day,
      date: new Date(year, month - 1, day),
      utc: Date.UTC(year, month - 1, day)
    };
  }

  function formatLongDateFromUtc(utc) {
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(utc));
    } catch (err) {
      return '-';
    }
  }

  function nextBirthdayInfo(birth, target) {
    var nextYear = target.year;
    var nextUtc = birthdayUtcForYear(birth, nextYear);

    if (nextUtc < target.utc) {
      nextYear += 1;
      nextUtc = birthdayUtcForYear(birth, nextYear);
    }

    var previousYear = nextYear - 1;
    var previousUtc = birthdayUtcForYear(birth, previousYear);
    if (previousUtc > target.utc) previousUtc = birthdayUtcForYear(birth, previousYear - 1);

    var daysLeft = Math.max(0, Math.ceil((nextUtc - target.utc) / DAY_MS));
    var cycleDays = Math.max(1, Math.ceil((nextUtc - previousUtc) / DAY_MS));
    var daysPassed = Math.max(0, Math.floor((target.utc - previousUtc) / DAY_MS));
    var progress = daysLeft === 0 ? 100 : Math.min(100, Math.max(0, (daysPassed / cycleDays) * 100));

    return {
      utc: nextUtc,
      year: nextYear,
      days: daysLeft,
      age: nextYear - birth.year,
      progress: progress
    };
  }

  function milestoneUtc(birth, wantedAge) {
    var year = birth.year + wantedAge;
    var day = birth.day;
    if (birth.month === 2 && birth.day === 29 && daysInMonth(year, 2) < 29) {
      day = 28;
    }
    return Date.UTC(year, birth.month - 1, day);
  }

  function daysUntilAge(birth, target, wantedAge, label) {
    var ageUtc = milestoneUtc(birth, wantedAge);
    if (target.utc >= ageUtc) return label + ' reached';
    return comma(Math.ceil((ageUtc - target.utc) / DAY_MS)) + ' days before ' + label;
  }

  function countdownToAgeParts(birth, target, wantedAge) {
    var ageUtc = milestoneUtc(birth, wantedAge);
    if (target.utc >= ageUtc) return null;
    return getAgeParts(target, parsedFromUtc(ageUtc));
  }

  function ordinal(value) {
    var n = Math.abs(Number(value));
    var mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return n + 'th';
    switch (n % 10) {
      case 1: return n + 'st';
      case 2: return n + 'nd';
      case 3: return n + 'rd';
      default: return n + 'th';
    }
  }

  function clampPercent(value) {
    var number = Number(value);
    if (!isFinite(number)) return 0;
    return Math.max(0, Math.min(100, number));
  }

  function progressItem(label, value, percent) {
    var safePercent = clampPercent(percent);
    return '<div class="age-visual-item"><div class="age-visual-top"><strong>' + escapeHtml(label) + '</strong><span>' + escapeHtml(value) + '</span></div><div class="age-progress-track" aria-hidden="true"><span style="width:' + safePercent.toFixed(1) + '%"></span></div></div>';
  }

  function visualGroup(title, html) {
    return '<section class="age-single-group-box age-visual-group"><h3>' + escapeHtml(title) + '</h3>' + html + '</section>';
  }

  function row(label, value) {
    return '<li class="age-single-result-row"><strong>' + escapeHtml(label) + ':</strong><span>' + escapeHtml(value) + '</span></li>';
  }

  function group(title, rows) {
    return '<section class="age-single-group-box"><h3>' + escapeHtml(title) + '</h3><ul class="age-single-result-list">' + rows.join('') + '</ul></section>';
  }

  function getCalculator() {
    var main = document.querySelector('main.age-calculator-container');
    if (!main) return null;
    for (var i = 0; i < main.children.length; i += 1) {
      if (main.children[i].classList && main.children[i].classList.contains('calculator')) {
        return main.children[i];
      }
    }
    return document.querySelector('.calculator');
  }

  function ensurePanel() {
    var main = document.querySelector('main.age-calculator-container');
    var calculator = getCalculator();
    var panel = byId('ageReportOutput');

    if (!main || !calculator) return panel;

    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'ageReportOutput';
      panel.setAttribute('aria-label', 'Age Calculator result');
      panel.hidden = true;
    }

    panel.classList.add('age-single-output', 'loan-style-output-panel', 'calculator-clean-result', 'age-clean-result', 'age-point-output', 'age-final-output');

    if (panel.parentElement !== main || panel.previousElementSibling !== calculator) {
      calculator.insertAdjacentElement('afterend', panel);
    }

    return panel;
  }

  function syncPanelWidth() {
    if (!isAgePage()) return;

    var panel = ensurePanel();
    var calculator = getCalculator();
    if (!panel || !calculator) return;

    panel.style.setProperty('box-sizing', 'border-box', 'important');
    panel.style.setProperty('width', '100%', 'important');
    panel.style.setProperty('max-width', '100%', 'important');

    if (window.innerWidth > 850) {
      var width = Math.round(calculator.getBoundingClientRect().width);
      if (width > 0) {
        panel.style.setProperty('width', width + 'px', 'important');
        panel.style.setProperty('max-width', width + 'px', 'important');
      }
    }
  }

  function hidePanel() {
    var panel = ensurePanel();
    if (!panel) return;
    panel.innerHTML = '';
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.style.setProperty('display', 'none', 'important');
    syncPanelWidth();
  }

  function showPanel(html) {
    var panel = ensurePanel();
    if (!panel) return;

    panel.innerHTML = html;
    panel.hidden = false;
    panel.removeAttribute('hidden');
    panel.removeAttribute('aria-hidden');
    panel.style.setProperty('display', 'block', 'important');
    panel.style.setProperty('visibility', 'visible', 'important');
    panel.style.setProperty('opacity', '1', 'important');
    syncPanelWidth();
    updateLiveCountdown();

    setTimeout(syncPanelWidth, 0);
    setTimeout(syncPanelWidth, 100);
  }

  function showError(message) {
    showPanel('<div class="age-single-result-shell"><div class="age-single-error">' + escapeHtml(message) + '</div></div>');
  }

  function getLiveNextAgeCountdown(birth) {
    var now = new Date();
    var thisYear = now.getFullYear();
    var nextBirthday = birthdayLocalForYear(birth, thisYear);

    if (nextBirthday.getTime() <= now.getTime()) {
      nextBirthday = birthdayLocalForYear(birth, thisYear + 1);
    }

    var seconds = Math.max(0, Math.floor((nextBirthday.getTime() - now.getTime()) / 1000));
    var nextAge = nextBirthday.getFullYear() - birth.year;

    return {
      seconds: seconds,
      nextAge: nextAge,
      text: plainNumber(seconds) + 'seconds to ' + nextAge + ' years old'
    };
  }

  function liveCountdownHtml(birth) {
    var countdown = getLiveNextAgeCountdown(birth);
    return '<div class="age-live-countdown" aria-live="polite"><span id="ageLiveCountdownText" data-birth-year="' + escapeHtml(birth.year) + '" data-birth-month="' + escapeHtml(birth.month) + '" data-birth-day="' + escapeHtml(birth.day) + '">' + escapeHtml(countdown.text) + '</span></div>';
  }

  function updateLiveCountdown() {
    var target = byId('ageLiveCountdownText');
    if (!target) return;

    var birth = {
      year: Number(target.getAttribute('data-birth-year')),
      month: Number(target.getAttribute('data-birth-month')),
      day: Number(target.getAttribute('data-birth-day'))
    };

    if (!birth.year || !birth.month || !birth.day) return;
    target.textContent = getLiveNextAgeCountdown(birth).text;
  }

  function getResultText() {
    var panel = byId('ageReportOutput');
    if (!panel) return '';

    var clone = panel.cloneNode(true);
    all('.age-result-actions, .age-action-feedback', clone).forEach(function (node) {
      node.remove();
    });

    return (clone.innerText || clone.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  }

  function setActionFeedback(message) {
    var feedback = byId('ageActionFeedback');
    if (!feedback) return;

    feedback.textContent = message;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(function () {
      feedback.textContent = '';
    }, 2500);
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.top = '-9999px';
    document.body.appendChild(area);
    area.select();

    try {
      document.execCommand('copy');
      setActionFeedback('Copied');
    } catch (err) {
      setActionFeedback('Copy failed');
    }

    document.body.removeChild(area);
  }

  function copyResultText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setActionFeedback('Copied');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function downloadTextFile(filename, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  function downloadHtmlFile(filename, html) {
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  function sanitizePdfText(value) {
    return String(value == null ? '' : value)
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2026]/g, '...')
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function pdfString(value) {
    return '(' + sanitizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)') + ')';
  }

  function wrapPdfText(text, maxChars) {
    text = sanitizePdfText(text);
    if (!text) return ['-'];

    var words = text.split(/\s+/);
    var lines = [];
    var current = '';

    words.forEach(function (word) {
      if (word.length > maxChars) {
        if (current) {
          lines.push(current);
          current = '';
        }
        while (word.length > maxChars) {
          lines.push(word.slice(0, maxChars));
          word = word.slice(maxChars);
        }
      }

      var test = current ? current + ' ' + word : word;
      if (test.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });

    if (current) lines.push(current);
    return lines.length ? lines : ['-'];
  }

  function buildAgeReportPdf(data, plainText) {
    /* Direct-download PDF report used by the Save button.
       It uses the same compact report data as the viewed report, but is written
       as a real one-page PDF file so Save downloads age-report.pdf directly. */
    data = data || getReportData() || { generated: new Date().toLocaleString(), groups: [] };

    var pageWidth = 595;
    var pageHeight = 842;
    var marginX = 30;
    var topY = 792;
    var contentWidth = pageWidth - (marginX * 2);
    var green = '0.00 0.56 0.45';
    var border = '0.78 0.84 0.90';
    var softBg = '0.95 0.97 0.99';
    var textColor = '0.06 0.12 0.11';
    var mutedColor = '0.30 0.38 0.36';
    var commands = [];

    function addRaw(command) {
      commands.push(command);
    }

    function setStroke(rgb) {
      addRaw(rgb + ' RG');
    }

    function setFill(rgb) {
      addRaw(rgb + ' rg');
    }

    function rect(x, y, w, h, fillRgb, strokeRgb, lineWidth) {
      if (fillRgb) setFill(fillRgb);
      if (strokeRgb) setStroke(strokeRgb);
      addRaw((lineWidth || 0.7) + ' w');
      addRaw(x.toFixed(2) + ' ' + y.toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re ' + (fillRgb && strokeRgb ? 'B' : (fillRgb ? 'f' : 'S')));
    }

    function line(x1, y1, x2, y2, strokeRgb, lineWidth) {
      setStroke(strokeRgb || border);
      addRaw((lineWidth || 0.5) + ' w');
      addRaw(x1.toFixed(2) + ' ' + y1.toFixed(2) + ' m ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ' l S');
    }

    function text(textValue, x, y, size, bold, rgb) {
      setFill(rgb || textColor);
      addRaw('BT /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Td ' + pdfString(textValue) + ' Tj ET');
    }

    function wrapText(value, maxChars) {
      var clean = sanitizePdfText(value || '-');
      if (!clean) return ['-'];
      var words = clean.split(/\s+/);
      var lines = [];
      var current = '';
      words.forEach(function (word) {
        if (word.length > maxChars) {
          if (current) {
            lines.push(current);
            current = '';
          }
          while (word.length > maxChars) {
            lines.push(word.slice(0, maxChars));
            word = word.slice(maxChars);
          }
        }
        var test = current ? current + ' ' + word : word;
        if (test.length > maxChars && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      });
      if (current) lines.push(current);
      return lines.length ? lines : ['-'];
    }

    function findValue(label) {
      if (!data || !data.groups) return '';
      for (var gi = 0; gi < data.groups.length; gi += 1) {
        var rows = data.groups[gi].rows || [];
        for (var ri = 0; ri < rows.length; ri += 1) {
          if ((rows[ri].label || '').toLowerCase() === String(label).toLowerCase()) return rows[ri].value || '';
        }
      }
      return '';
    }

    function drawStat(x, y, w, h, label, value) {
      rect(x, y, w, h, null, border, 0.8);
      text(label, x + 8, y + h - 13, 6.8, true, mutedColor);
      wrapText(value || '-', 22).slice(0, 2).forEach(function (lineText, index) {
        text(lineText, x + 8, y + h - 27 - (index * 9), 8.1, true, textColor);
      });
    }

    function rowHeight(item) {
      var labelLines = wrapText(item.label || '-', 23).length;
      var valueLines = wrapText(item.value || '-', 36).length;
      return Math.max(14, 6 + (Math.max(labelLines, valueLines) * 7.2));
    }

    function drawSection(section, x, yTop, w) {
      var rows = (section.rows || []).slice();
      var title = section.title || 'Details';
      var headerH = 20;
      var bodyH = rows.reduce(function (total, row) { return total + rowHeight(row); }, 0);
      var sectionH = Math.max(48, headerH + bodyH + 4);
      var y = yTop - sectionH;

      rect(x, y, w, sectionH, '1 1 1', border, 0.8);
      rect(x, yTop - headerH, w, headerH, softBg, border, 0.6);
      text(title, x + 8, yTop - 13, 8.4, true, textColor);

      var cursor = yTop - headerH;
      rows.forEach(function (item) {
        var h = rowHeight(item);
        line(x, cursor - h, x + w, cursor - h, '0.90 0.93 0.96', 0.35);
        var labelLines = wrapText(item.label || '-', 22).slice(0, 3);
        var valueLines = wrapText(item.value || '-', 38).slice(0, 4);
        labelLines.forEach(function (lineText, index) {
          text(lineText, x + 8, cursor - 10 - (index * 7), 5.9, true, mutedColor);
        });
        valueLines.forEach(function (lineText, index) {
          text(lineText, x + 101, cursor - 10 - (index * 7), 5.9, true, textColor);
        });
        cursor -= h;
      });

      return sectionH;
    }

    var birthDate = findValue('Birth date') || '-';
    var calculationDate = findValue('Calculation date') || '-';
    var normalAge = findValue('Normal age') || '-';
    var daysOld = findValue('Days old') || '-';
    var zodiac = findValue('Western zodiac') || '-';

    text('CALCSTUDIO', marginX, topY, 7.5, true, green);
    text('Generated', pageWidth - marginX - 65, topY, 6.2, true, textColor);
    text(data.generated || new Date().toLocaleString(), pageWidth - marginX - 95, topY - 9, 6, false, textColor);
    text('Calculation date', pageWidth - marginX - 65, topY - 20, 6.2, true, textColor);
    text(calculationDate, pageWidth - marginX - 62, topY - 29, 6, false, textColor);
    line(marginX, topY - 44, pageWidth - marginX, topY - 44, green, 1.8);

    var statY = topY - 92;
    var statGap = 6;
    var statW = (contentWidth - (statGap * 3)) / 4;
    drawStat(marginX, statY, statW, 36, 'Birth date', birthDate);
    drawStat(marginX + (statW + statGap), statY, statW, 36, 'Normal age', normalAge);
    drawStat(marginX + ((statW + statGap) * 2), statY, statW, 36, 'Days old', daysOld);
    drawStat(marginX + ((statW + statGap) * 3), statY, statW, 36, 'Zodiac', zodiac);

    var sections = (data.groups || []).filter(function (section) {
      return section && section.title !== 'Visual Elements' && section.rows && section.rows.length;
    });

    if (!sections.length && plainText) {
      sections = [{ title: 'Report Details', rows: String(plainText).split(/\n+/).filter(Boolean).map(function (lineText) {
        return { label: '', value: lineText };
      }) }];
    }

    var colGap = 8;
    var colW = (contentWidth - colGap) / 2;
    var leftX = marginX;
    var rightX = marginX + colW + colGap;
    var leftTop = statY - 12;
    var rightTop = statY - 12;

    sections.forEach(function (section, index) {
      var useLeft = leftTop <= rightTop ? false : true;
      if (index === 0) useLeft = true;
      if (index === 1) useLeft = false;
      var x = useLeft ? leftX : rightX;
      var top = useLeft ? leftTop : rightTop;
      var h = drawSection(section, x, top, colW);
      if (useLeft) leftTop -= h + 8;
      else rightTop -= h + 8;
    });

    line(marginX, 52, pageWidth - marginX, 52, '0.88 0.91 0.94', 0.5);
    text('This report is generated automatically by the Age Calculator. Results are for general reference only.', marginX + 135, 36, 5.8, false, mutedColor);

    var content = commands.join('\n') + '\n';
    var objects = [];
    function addObject(contentValue) {
      objects.push(contentValue);
      return objects.length;
    }

    var catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>');
    var pagesId = addObject('');
    var fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    var fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    var contentId = addObject('<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream');
    var pageId = addObject('<< /Type /Page /Parent ' + pagesId + ' 0 R /MediaBox [0 0 ' + pageWidth + ' ' + pageHeight + '] /Resources << /Font << /F1 ' + fontId + ' 0 R /F2 ' + fontBoldId + ' 0 R >> >> /Contents ' + contentId + ' 0 R >>');

    objects[pagesId - 1] = '<< /Type /Pages /Kids [' + pageId + ' 0 R] /Count 1 >>';

    var pdf = '%PDF-1.4\n';
    var offsets = [0];
    objects.forEach(function (objectContent, index) {
      offsets.push(pdf.length);
      pdf += (index + 1) + ' 0 obj\n' + objectContent + '\nendobj\n';
    });

    var xrefOffset = pdf.length;
    pdf += 'xref\n0 ' + (objects.length + 1) + '\n';
    pdf += '0000000000 65535 f \n';
    for (var i = 1; i <= objects.length; i += 1) {
      pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root ' + catalogId + ' 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';
    return pdf;
  }

  function downloadPdfFile(filename, pdf) {
    var blob = new Blob([pdf], { type: 'application/pdf' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  function saveAgeReportPdf(text) {
    var data = getReportData();
    var pdf = buildAgeReportPdf(data, text);
    downloadPdfFile('age-report.pdf', pdf);
    setActionFeedback('PDF report saved.');
  }

  function getReportData() {
    var panel = byId('ageReportOutput');
    if (!panel) return null;

    var titleEl = panel.querySelector('.age-single-result-title');
    var countdownEl = panel.querySelector('.age-live-countdown');
    var data = {
      title: titleEl ? (titleEl.textContent || '').trim() : 'Age Report',
      countdown: countdownEl ? (countdownEl.textContent || '').trim() : '',
      generated: new Date().toLocaleString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      groups: []
    };

    all('.age-single-group-box', panel).forEach(function (section) {
      var headingEl = section.querySelector('h3');
      var groupData = {
        title: headingEl ? (headingEl.textContent || '').trim() : 'Details',
        rows: [],
        visuals: []
      };

      all('.age-single-result-row', section).forEach(function (rowEl) {
        var labelEl = rowEl.querySelector('strong');
        var valueEl = rowEl.querySelector('span');
        var label = labelEl ? (labelEl.textContent || '').replace(/:\s*$/, '').trim() : '';
        var value = valueEl ? (valueEl.textContent || '').trim() : '';
        if (label || value) groupData.rows.push({ label: label, value: value });
      });

      all('.age-visual-item', section).forEach(function (visualEl) {
        var visualLabelEl = visualEl.querySelector('.age-visual-top strong');
        var visualValueEl = visualEl.querySelector('.age-visual-top span');
        var visualFillEl = visualEl.querySelector('.age-progress-track span');
        var visualLabel = visualLabelEl ? (visualLabelEl.textContent || '').trim() : '';
        var visualValue = visualValueEl ? (visualValueEl.textContent || '').trim() : '';
        var visualWidth = visualFillEl ? (visualFillEl.style.width || '0%') : '0%';
        if (visualLabel || visualValue) {
          groupData.visuals.push({ label: visualLabel, value: visualValue, width: visualWidth });
        }
      });

      if (groupData.rows.length || groupData.visuals.length) data.groups.push(groupData);
    });

    return data;
  }

  function findReportValue(data, label) {
    if (!data || !data.groups) return '';

    for (var groupIndex = 0; groupIndex < data.groups.length; groupIndex += 1) {
      var rows = data.groups[groupIndex].rows || [];
      for (var rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        if ((rows[rowIndex].label || '').toLowerCase() === String(label).toLowerCase()) {
          return rows[rowIndex].value || '';
        }
      }
    }

    return '';
  }

  function buildPrintableReportHtml(data, plainText) {
    data = data || { title: 'Age Report', generated: new Date().toLocaleString(), countdown: '', groups: [] };

    var personName = findReportValue(data, 'Name') || 'Age Calculator User';
    var normalAge = findReportValue(data, 'Normal age') || '-';
    var birthDate = findReportValue(data, 'Birth date') || '-';
    var calculationDate = findReportValue(data, 'Calculation date') || '-';
    var daysOld = findReportValue(data, 'Days old') || '-';
    var zodiac = findReportValue(data, 'Western zodiac') || '-';

    function stat(label, value) {
      return '<div class="report-stat"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
    }

    function renderRows(rows) {
      if (!rows || !rows.length) return '';
      return '<table><tbody>' + rows.map(function (item) {
        return '<tr><th>' + escapeHtml(item.label) + '</th><td>' + escapeHtml(item.value) + '</td></tr>';
      }).join('') + '</tbody></table>';
    }

    var sections = (data.groups || []).filter(function (groupData) {
      return groupData && groupData.title !== 'Visual Elements';
    }).map(function (groupData) {
      return '<section class="report-section"><h2>' + escapeHtml(groupData.title) + '</h2>' + renderRows(groupData.rows) + '</section>';
    }).join('');

    if (!sections && plainText) {
      sections = '<section class="report-section"><h2>Report Details</h2><pre>' + escapeHtml(plainText) + '</pre></section>';
    }

    return '<!doctype html>' +
      '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>' + escapeHtml('Age Report - ' + personName) + '</title>' +
      '<style>' +
      '@page{size:A4 portrait;margin:0}' +
      '*{box-sizing:border-box}' +
      'html,body{margin:0;padding:0;min-height:auto;overflow:auto}' +
      'body{font-family:Arial,Inter,sans-serif;color:#111827;background:#eef2f7;line-height:1.25}' +
      '.print-toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:center;align-items:center;gap:10px;padding:10px;background:#0f172a;box-shadow:0 8px 24px rgba(15,23,42,.18)}' +
      '.print-toolbar button{border:0;border-radius:999px;background:#ffffff;color:#0f172a;padding:9px 16px;font-weight:800;cursor:pointer}' +
      '.print-toolbar button.primary{background:#0f8f72;color:#ffffff}' +
      '.print-toolbar span{display:flex;align-items:center;color:#cbd5e1;font-size:12px;font-weight:700}' +
      '.report-page{width:210mm;height:297mm;max-width:calc(100vw - 24px);margin:16px auto;padding:12mm 15mm 10mm;background:#ffffff;border:0;box-shadow:0 18px 55px rgba(15,23,42,.14);overflow:hidden}' +
      '.report-header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding-bottom:9px;border-bottom:3px solid #0f8f72}' +
      '.brand{font-size:9px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#0f8f72;margin:0}' +
      '.report-meta{text-align:right;color:#475569;font-size:8.5px;line-height:1.35;min-width:150px}' +
      '.report-meta strong{display:block;color:#111827;font-size:8.5px}' +
      '.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}' +
      '.report-stat{min-height:36px;padding:7px 8px;border:1px solid #cbd5e1;border-radius:8px;background:#ffffff}' +
      '.report-stat span{display:block;color:#64748b;font-size:7.5px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}' +
      '.report-stat strong{display:block;margin-top:4px;color:#111827;font-size:9.5px;line-height:1.2;overflow-wrap:anywhere}' +
      '.section-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}' +
      '.report-section{break-inside:avoid;page-break-inside:avoid;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#ffffff}' +
      '.report-section h2{margin:0;padding:6px 8px;color:#10231d;background:#f1f5f9;border-bottom:1px solid #cbd5e1;font-size:9.5px;line-height:1.15}' +
      'table{width:100%;border-collapse:collapse;table-layout:fixed}' +
      'th,td{padding:4px 7px;border-bottom:1px solid #edf2f7;vertical-align:top;font-size:7.6px;line-height:1.18}' +
      'tr:last-child th,tr:last-child td{border-bottom:0}' +
      'th{width:38%;text-align:left;color:#475569;font-weight:900}' +
      'td{color:#111827;font-weight:700;overflow-wrap:anywhere}' +
      '.report-footer{margin-top:9px;padding-top:7px;border-top:1px solid #e5e7eb;color:#64748b;font-size:7.3px;text-align:center}' +
      'pre{white-space:pre-wrap;font:inherit;font-size:8px;margin:0;padding:8px}' +
      '@media screen and (max-width:800px){.report-page{width:auto;height:auto;max-width:calc(100vw - 20px);padding:20px}.stats,.section-grid{grid-template-columns:1fr}.report-meta{text-align:left;margin-top:8px}.report-header{display:block}}' +
      '@media print{@page{size:A4 portrait;margin:0}html,body{width:210mm!important;height:297mm!important;background:#fff!important;overflow:hidden!important}.print-toolbar{display:none!important}.report-page{width:210mm!important;height:297mm!important;max-width:none!important;margin:0!important;padding:12mm 15mm 10mm!important;border:0!important;box-shadow:none!important;overflow:hidden!important;break-after:avoid;page-break-after:avoid}.report-header{display:flex!important;justify-content:space-between!important;gap:16px!important;align-items:flex-start!important;padding-bottom:9px!important}.report-meta{text-align:right!important;margin-top:0!important}.stats{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important;margin-top:10px!important}.report-stat{min-height:36px!important;padding:7px 8px!important;border-radius:8px!important}.section-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:9px!important}.report-section{border-radius:8px!important;break-inside:avoid;page-break-inside:avoid}.report-section h2{padding:6px 8px!important;font-size:9.5px!important}th,td{padding:4px 7px!important;font-size:7.6px!important;line-height:1.18!important}.report-footer{margin-top:9px!important;padding-top:7px!important;font-size:7.3px!important}}' +
      '</style></head>' +
      '<body><div class="print-toolbar"><button class="primary" onclick="window.print()">Print / Save PDF</button><button onclick="window.close()">Close</button><span>The report you see is the same one-page layout used for printing and saving.</span></div>' +
      '<main class="report-page">' +
      '<header class="report-header"><p class="brand">CalcStudio</p>' +
      '<div class="report-meta"><strong>Generated</strong>' + escapeHtml(data.generated) + '<br><strong>Calculation date</strong>' + escapeHtml(calculationDate) + '</div></header>' +
      '<section class="stats">' + stat('Birth date', birthDate) + stat('Normal age', normalAge) + stat('Days old', daysOld) + stat('Zodiac', zodiac) + '</section>' +
      '<section class="section-grid">' + sections + '</section>' +
      '<footer class="report-footer">This report is generated automatically by the Age Calculator. Results are for general reference only.</footer>' +
      '</main></body></html>';
  }

  function openPrintableReport(text, options) {
    options = options || {};
    var data = getReportData();
    var reportHtml = buildPrintableReportHtml(data, text);
    var win = window.open('', '_blank');
    if (!win) {
      setActionFeedback('Popup blocked. Allow popups, then click Save or Report again.');
      return;
    }

    win.document.open();
    win.document.write(reportHtml);
    win.document.close();
    win.focus();

    if (options.autoPrint) {
      var runPrint = function () {
        try {
          win.focus();
          win.print();
          setActionFeedback('Choose Save as PDF in the print dialog.');
        } catch (error) {
          setActionFeedback('Open the report tab, then choose Print / Save PDF.');
        }
      };

      if (win.document.readyState === 'complete') {
        setTimeout(runPrint, 350);
      } else {
        win.addEventListener('load', function () {
          setTimeout(runPrint, 350);
        });
        setTimeout(runPrint, 900);
      }
    }
  }

  function resultActionsHtml() {
    return '<div class="age-result-actions" aria-label="Age result actions">' +
      '<button type="button" data-age-action="copy">Copy</button>' +
      '<button type="button" data-age-action="save">Save</button>' +
      '<button type="button" data-age-action="share">Share</button>' +
      '<button type="button" data-age-action="report">Report</button>' +
      '</div><p id="ageActionFeedback" class="age-action-feedback" aria-live="polite"></p>';
  }

  function calculateAge() {
    if (!isAgePage()) return false;

    var nameInput = byId('ageName');
    var birthInput = byId('birthdate');
    var targetInput = byId('dateToCalculate');

    if (!birthInput) return false;
    if (targetInput && !targetInput.value) targetInput.value = todayISO();

    if (!birthInput.value) {
      hidePanel();
      return false;
    }

    var birthValue = birthInput.value;
    var targetValue = targetInput && targetInput.value ? targetInput.value : todayISO();
    var birth = parseDateInput(birthValue);
    var target = parseDateInput(targetValue);

    if (!birth) {
      showError('Please enter a valid birth date.');
      return false;
    }

    if (!target) {
      showError('Please enter a valid calculation date.');
      return false;
    }

    if (birth.utc > target.utc) {
      showError('The birth date must be on or before the calculation date.');
      return false;
    }

    var parts = getAgeParts(birth, target);
    var totalDays = Math.max(0, Math.floor((target.utc - birth.utc) / DAY_MS));
    var totalWeeks = Math.floor(totalDays / 7);
    var totalMonths = parts.years * 12 + parts.months;
    var totalHours = totalDays * 24;
    var totalMinutes = totalHours * 60;
    var totalSeconds = totalMinutes * 60;
    var animal = chineseZodiac(birth.year);
    var animalElement = chineseZodiacElement(birth.year);
    var name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '-';
    var asianAge = target.year - birth.year + 1;
    var nextBirthday = nextBirthdayInfo(birth, target);
    var retirementAge = 60;
    var retirementUtc = milestoneUtc(birth, retirementAge);
    var retirementDays = Math.max(0, Math.ceil((retirementUtc - target.utc) / DAY_MS));
    var retirementParts = countdownToAgeParts(birth, target, retirementAge);
    var yearStartUtc = Date.UTC(target.year, 0, 1);
    var yearEndUtc = Date.UTC(target.year + 1, 0, 1);
    var yearProgress = ((target.utc - yearStartUtc) / Math.max(1, yearEndUtc - yearStartUtc)) * 100;
    var lifeEstimateAge = 80;
    var lifeProgress = Math.min(100, (totalDays / Math.max(1, lifeEstimateAge * 365.2425)) * 100);
    var exactAgeText = parts.years + ' years, ' + parts.months + ' months, ' + parts.days + ' days';
    var nextBirthdayText = nextBirthday.days === 0 ? 'Today' : nextBirthday.days + ' day' + (nextBirthday.days === 1 ? '' : 's');
    var shareText = (name !== '-' ? name + ' is ' : 'I am ') + exactAgeText + ' old on ' + formatDateInput(targetValue) + '. ' + (name !== '-' ? name + ' has' : 'I have') + ' lived ' + comma(totalDays) + ' days and the next birthday countdown is ' + nextBirthdayText + '.';
    var retirementText = retirementParts ? retirementParts.years + ' years, ' + retirementParts.months + ' months, ' + retirementParts.days + ' days' : 'Retirement age reached';

    var html = '<div class="age-single-result-shell">' +
      liveCountdownHtml(birth) +
      '<div class="age-single-result-grid">' +
      group('Age Summary', [
        row('Name', name),
        row('Birth date', formatDateInput(birthValue)),
        row('Calculation date', formatDateInput(targetValue)),
        row('Exact age', exactAgeText),
        row('Normal age', parts.years + ' years old'),
        row('Asian age', asianAge + ' years old'),
        row('Day of week born', birth.date.toLocaleDateString('en-US', { weekday: 'long' })),
        row('Quick summary', shareText)
      ]) +
      group('Time Lived Totals', [
        row('Months old', comma(totalMonths)),
        row('Weeks old', comma(totalWeeks)),
        row('Days old', comma(totalDays)),
        row('Hours old', comma(totalHours)),
        row('Minutes old', comma(totalMinutes)),
        row('Seconds old', comma(totalSeconds)),
        row('Estimated sleep time', comma(Math.floor(totalDays / 3)) + ' days'),
        row('Moon cycles experienced', (totalDays / 29.530588).toFixed(1)),
        row('Approximate heartbeats', comma(Math.round(totalDays * 24 * 60 * 70))),
        row('Approximate breaths', comma(Math.round(totalDays * 24 * 60 * 16)))
      ]) +
      group('Next Birthday Countdown', [
        row('Countdown', nextBirthdayText),
        row('Next birthday date', formatLongDateFromUtc(nextBirthday.utc)),
        row('Age on next birthday', ordinal(nextBirthday.age) + ' birthday'),
        row('Birthday message', nextBirthday.days === 0 ? 'Happy birthday!' : 'Your next birthday is getting closer')
      ]) +
      group('Zodiac Information', [
        row('Western zodiac', westernZodiac(birth.month, birth.day)),
        row('Chinese zodiac', animal),
        row('Chinese zodiac element', animalElement),
        row('Islamic calendar date', safeCalendar(birth, 'en-GB-u-ca-islamic')),
        row('Chinese calendar date', safeCalendar(birth, 'en-GB-u-ca-chinese'))
      ]) +
      group('Retirement Countdown', [
        row('Retirement target age', retirementAge + ' years old'),
        row('Countdown to retirement age', retirementText),
        row('Days until retirement age', target.utc >= retirementUtc ? 'Retirement age reached' : comma(retirementDays) + ' days'),
        row('Retirement date', formatLongDateFromUtc(retirementUtc))
      ]) +
      group('Milestones', [
        row('18 years old', daysUntilAge(birth, target, 18, '18 years old')),
        row('21 years old', daysUntilAge(birth, target, 21, '21 years old')),
        row('30 years old', daysUntilAge(birth, target, 30, '30 years old')),
        row('40 years old', daysUntilAge(birth, target, 40, '40 years old')),
        row('50 years old', daysUntilAge(birth, target, 50, '50 years old')),
        row('80 years old', daysUntilAge(birth, target, 80, '80 years old')),
        row('100 years old', daysUntilAge(birth, target, 100, '100 years old'))
      ]) +
      '</div>' + resultActionsHtml() + '</div>';

    showPanel(html);
    return true;
  }

  var timer = null;
  function scheduleCalculate() {
    clearTimeout(timer);
    timer = setTimeout(calculateAge, 15);
  }

  function bindAgeInputs() {
    if (!isAgePage()) return;

    ensurePanel();

    var targetInput = byId('dateToCalculate');
    if (targetInput && !targetInput.value) targetInput.value = todayISO();

    ['ageName', 'birthdate', 'dateToCalculate'].forEach(function (inputId) {
      var input = byId(inputId);
      if (!input || input.dataset.ageAutoBound === '1') return;
      input.dataset.ageAutoBound = '1';

      ['input', 'change', 'keyup', 'paste', 'blur'].forEach(function (eventName) {
        input.addEventListener(eventName, scheduleCalculate);
      });
    });

    calculateAge();
    syncPanelWidth();
  }

  function setupResultActions() {
    if (!isAgePage() || document.body.dataset.ageActionsReady === '1') return;
    document.body.dataset.ageActionsReady = '1';

    document.body.addEventListener('click', function (event) {
      var button = event.target.closest('[data-age-action]');
      if (!button) return;

      var action = button.getAttribute('data-age-action');
      var text = getResultText();
      if (!text) return;

      if (action === 'copy') {
        copyResultText(text);
      } else if (action === 'save') {
        saveAgeReportPdf(text);
      } else if (action === 'share') {
        if (navigator.share) {
          navigator.share({ title: 'Age result', text: text }).then(function () {
            setActionFeedback('Shared');
          }).catch(function () {
            copyResultText(text);
            setActionFeedback('Share unavailable, copied instead');
          });
        } else {
          copyResultText(text);
          setActionFeedback('Share unavailable, copied instead');
        }
      } else if (action === 'report') {
        openPrintableReport(text, { sourceAction: 'report' });
        setActionFeedback('One-page report opened. Use Print / Save PDF for the same report layout.');
      }
    });
  }

  function setupLiveCountdownTimer() {
    if (liveCountdownTimer) return;
    liveCountdownTimer = setInterval(updateLiveCountdown, 1000);
  }

  function setupNavbar() {
    var navbar = byId('navbar');
    if (!navbar || navbar.dataset.ageNavReady === '1') return;
    navbar.dataset.ageNavReady = '1';

    all('.clean-nav-button', navbar).forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var parent = button.closest('.clean-nav-dropdown, .clean-nav-submenu');
        if (!parent) return;
        parent.classList.toggle('is-open');
        parent.classList.toggle('nav-open');
        button.setAttribute('aria-expanded', parent.classList.contains('is-open') || parent.classList.contains('nav-open') ? 'true' : 'false');
      });
    });

    document.addEventListener('click', function (event) {
      if (!navbar.contains(event.target)) {
        all('.is-open, .nav-open', navbar).forEach(function (item) {
          item.classList.remove('is-open');
          item.classList.remove('nav-open');
        });
        all('.clean-nav-button[aria-expanded="true"]', navbar).forEach(function (button) {
          button.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  function setupSearch() {
    var form = document.querySelector('.clean-nav-search');
    var input = byId('cleanCalculatorSearchInput');
    var list = form ? form.querySelector('.clean-nav-search-results') : null;
    if (!form || !input || !list || form.dataset.ageSearchReady === '1') return;
    form.dataset.ageSearchReady = '1';

    var tools = all('.clean-calculator-panel a').map(function (link) {
      return {
        title: (link.textContent || '').trim(),
        href: link.getAttribute('href') || '#'
      };
    }).filter(function (item) { return item.title; });

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
      var first = list.querySelector('a');
      if (first) window.location.href = first.getAttribute('href');
    });
  }


  function setupScrollTopButton() {
    if (!isAgePage()) return;

    var button = byId('scrollTopBtn');
    if (!button) return;

    button.textContent = '↑';
    button.setAttribute('aria-label', 'Go to top');

    function updateButton() {
      var visible = window.scrollY > 200;
      button.classList.toggle('is-visible', visible);
      button.style.display = visible ? 'flex' : 'none';
    }

    button.addEventListener('click', function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', updateButton, { passive: true });
    updateButton();
  }

  window.scrollToTop = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.calculateAge = calculateAge;
  window.calculateAgeStandalone = calculateAge;

  function ready() {
    bindAgeInputs();
    setupResultActions();
    setupLiveCountdownTimer();
    setupNavbar();
    setupSearch();
    setupScrollTopButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }

  window.addEventListener('load', function () {
    bindAgeInputs();
    calculateAge();
    syncPanelWidth();
  });

  window.addEventListener('resize', syncPanelWidth);
})();
