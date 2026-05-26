/* CHATGPT_FINAL_UPDATE_20260526_SEARCH_SQRT_MORTGAGE_RENAME calculator-search site-search √ */
/* CHATGPT_CACHE_BUST_20260526 */
/*
  Copyright © 2026 Hamdi. All rights reserved.
  Shared calculator script
  - Basic calculator stays as keypad calculator
  - Other calculator pages auto-calculate and use report-style history
*/
(function () {
  "use strict";

  const MAX_HISTORY_ITEMS = 50;
  const REPORT_TYPES = ["age", "bmi", "loan", "personalLoan", "discount", "percentage", "compound"];
  let autoTimer = null;
  let autoRunning = false;

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function has(id) {
    return !!byId(id);
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function lower(value) {
    return cleanText(value).toLowerCase();
  }

  function titleText() {
    const h1 = $("h1");
    return lower(h1 ? h1.textContent : "");
  }

  function pathText() {
    return lower(window.location.pathname);
  }

  function safeGet(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  function loadArray(key) {
    try {
      const value = JSON.parse(safeGet(key, "[]"));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function saveArray(key, value) {
    safeSet(key, JSON.stringify(value.slice(-MAX_HISTORY_ITEMS)));
  }

  function numberFromString(value) {
    const number = Number(String(value || "").replace(/,/g, "").trim());
    return Number.isFinite(number) ? number : NaN;
  }

  function numberValue(id) {
    const input = byId(id);
    return input ? numberFromString(input.value) : NaN;
  }

  function stringValue(id) {
    const input = byId(id);
    return input ? String(input.value || "").trim() : "";
  }

  function firstInput(ids) {
    for (const id of ids) {
      const input = byId(id);
      if (input) return input;
    }
    return null;
  }

  function firstValue(ids) {
    for (const id of ids) {
      const value = stringValue(id);
      if (value) return value;
    }
    return "";
  }

  function firstNumber(ids) {
    for (const id of ids) {
      const value = numberValue(id);
      if (Number.isFinite(value)) return value;
    }
    return NaN;
  }

  function money(value) {
    return Number(value).toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function moneyRM(value) {
    const number = numberFromString(value);
    return Number.isFinite(number) ? "RM " + money(number) : (value || "-");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getPageType() {
    const title = titleText();
    const path = pathText();

    /*
      Important: do not use title.includes("age") because words like
      "percentage" and "mortgage" also contain the letters "age".
    */
    if (has("display") || $(".basic-grid") || $(".scientific-grid") || path.includes("basic-calculator") || /^basic\b/.test(title)) return "basic";
    if (path.includes("bmi") || has("bmiHistoryList") || /\bbmi\b/.test(title)) return "bmi";
    if (path.includes("personal-loan") || has("personalLoanHistoryList") || has("personalLoanResult") || /\bpersonal\s+loan\b/.test(title)) return "personalLoan";
    if (path.includes("loan") || path.includes("mortgage") || has("loanHistoryList") || has("loanResult") || /\bmortgage\b|\bloan\b/.test(title)) return "loan";
    if (path.includes("discount") || has("discountHistoryList") || /\bdiscount\b/.test(title)) return "discount";
    if (path.includes("percentage") || has("percentageHistoryList") || /\bpercentage\b/.test(title)) return "percentage";
    if (path.includes("compound") || has("compoundHistoryList") || /\bcompound\b/.test(title)) return "compound";
    if (path.includes("age-calculator") || has("birthdate") || has("ageHistoryList") || /^age\b|\bage calculator\b/.test(title)) return "age";

    return "";
  }

  function isReportType(type) {
    return REPORT_TYPES.includes(type);
  }

  function applyPageClass() {
    const type = getPageType();
    if (!type) return;

    ["basic-page", "age-page", "bmi-page", "loan-page", "personal-loan-page", "discount-page", "percentage-page", "compound-page"].forEach(function (className) {
      document.body.classList.remove(className);
    });

    document.body.classList.add(type === "personalLoan" ? "personal-loan-page" : type + "-page");
    document.body.dataset.page = type === "personalLoan" ? "personal-loan" : type;
  }

  /* =====================================================
     BASIC CALCULATOR
  ===================================================== */

  let basicHistory = loadArray("basicEquationHistory");
  let lastAnswer = Number(safeGet("lastAnswer", "0")) || 0;
  let lastBasicEquation = "";

  function getDisplay() {
    return byId("display");
  }

  function clearError(display) {
    if (display && display.value === "Error") {
      display.value = "";
    }
  }

  function add(value) {
    const display = getDisplay();
    if (!display) return;

    clearError(display);

    const operators = ["+", "-", "*", "/"];
    const lastChar = display.value.slice(-1);

    if (value === "Ans") {
      display.value += String(lastAnswer);
      return;
    }

    if (value === "%") {
      display.value += "/100";
      return;
    }

    if (
      operators.includes(value) &&
      operators.includes(lastChar) &&
      !(value === "-" && lastChar !== "-")
    ) {
      display.value = display.value.slice(0, -1) + value;
      return;
    }

    display.value += value;
  }

  function clearDisplay() {
    const display = getDisplay();
    if (display) display.value = "";
  }

  function removeLast() {
    const display = getDisplay();
    if (!display) return;

    if (display.value === "Error") {
      display.value = "";
      return;
    }

    display.value = display.value.slice(0, -1);
  }

  const functionMap = {
    sin: "Math.sin(",
    cos: "Math.cos(",
    tan: "Math.tan(",
    log: "Math.log10(",
    ln: "Math.log(",
    sqrt: "√("
  };

  function addFunction(func) {
    const display = getDisplay();
    if (!display) return;

    clearError(display);

    const functionText = functionMap[func];
    if (!functionText) return;

    if (/[0-9.)]$/.test(display.value)) {
      display.value += "*" + functionText;
    } else {
      display.value += functionText;
    }
  }

  function addPower() {
    const display = getDisplay();
    if (!display) return;

    clearError(display);
    display.value += "**";
  }

  function closeOpenBrackets(expression) {
    const open = (expression.match(/\(/g) || []).length;
    const close = (expression.match(/\)/g) || []).length;
    return open > close ? expression + ")".repeat(open - close) : expression;
  }

  function isSafeExpression(expression) {
    if (!/^[0-9+\-*/().,\sA-Za-z]+$/.test(expression)) return false;

    const words = expression.match(/[A-Za-z]+/g) || [];
    const allowedWords = new Set(["Math", "sin", "cos", "tan", "log", "log10", "sqrt", "PI", "E"]);

    return words.every(function (word) {
      return allowedWords.has(word);
    });
  }

  function addBasicEquationHistory(equation) {
    const value = cleanText(equation);
    if (!value || value === "Error") return;

    if (basicHistory[basicHistory.length - 1] !== value) {
      basicHistory.push(value);
      basicHistory = basicHistory.slice(-MAX_HISTORY_ITEMS);
      saveArray("basicEquationHistory", basicHistory);
    }

    showHistory();
  }

  function calculate() {
    const display = getDisplay();
    if (!display) return;

    try {
      let displayExpression = cleanText(display.value)
        .replace(/Math\.sqrt\s*\(/gi, "√(")
        .replace(/\bsqrt\s*\(/gi, "√(");

      if (!displayExpression || displayExpression === "Error") return;

      if (display.value !== displayExpression) {
        display.value = displayExpression;
      }

      lastBasicEquation = displayExpression;

      let expression = displayExpression
        .replace(/√\s*\(/g, "Math.sqrt(")
        .replace(/(\d)(Math\.)/g, "$1*$2")
        .replace(/\)(Math\.)/g, ")*$1");

      expression = closeOpenBrackets(expression);

      if (!isSafeExpression(expression)) {
        display.value = "Error";
        return;
      }

      const result = Function('"use strict"; return (' + expression + ")")();

      if (typeof result !== "number" || !Number.isFinite(result)) {
        display.value = "Error";
        return;
      }

      const cleanResult = Number.isInteger(result) ? result : Number(result.toPrecision(12));
      display.value = String(cleanResult);
      lastAnswer = cleanResult;
      safeSet("lastAnswer", String(lastAnswer));
      addBasicEquationHistory(lastBasicEquation);
      renderBasicAnswer();
    } catch {
      display.value = "Error";
    }
  }

  function showHistory() {
    const list = byId("historyList");
    if (!list) return;

    const title = $(".history h3");
    if (title) title.textContent = "History";

    basicHistory = loadArray("basicEquationHistory");
    list.innerHTML = "";

    basicHistory.slice().reverse().forEach(function (equation) {
      const li = document.createElement("li");
      li.className = "history-item basic-equation-history-item";

      const text = document.createElement("span");
      text.className = "history-text";
      text.textContent = "Eq: " + equation;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "history-copy-btn";
      copyBtn.textContent = "copy";
      copyBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        copyText(equation, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function clearHistory() {
    basicHistory = [];
    safeRemove("basicEquationHistory");
    showHistory();
  }

  function flashButton(buttonText) {
    const wanted = String(buttonText).trim().toUpperCase();

    $$(".buttons button, .ans-btn").forEach(function (button) {
      const actual = button.textContent.trim().toUpperCase();
      if (actual === wanted) {
        button.classList.add("keyboard-active");
        setTimeout(function () {
          button.classList.remove("keyboard-active");
        }, 150);
      }
    });
  }

  function setupKeyboardSupport() {
    document.addEventListener("keydown", function (event) {
      if (getPageType() !== "basic") return;

      const display = getDisplay();
      if (!display) return;

      const target = event.target;

      if (target && target.closest && target.closest(".site-search")) {
        return;
      }

      if (
        target &&
        target.id !== "display" &&
        (
          (target.matches && target.matches("input, textarea, select")) ||
          target.isContentEditable
        )
      ) {
        return;
      }

      const key = event.key;
      const lowerKey = key.toLowerCase();

      if (/^[0-9]$/.test(key)) {
        add(key);
        flashButton(key);
        return;
      }

      if (key === ".") {
        add(".");
        flashButton(".");
        return;
      }

      if (["+", "-"].includes(key)) {
        add(key);
        flashButton(key);
        return;
      }

      if (key === "*" || lowerKey === "x") {
        add("*");
        flashButton("*");
        return;
      }

      if (key === "/") {
        event.preventDefault();
        add("/");
        flashButton("/");
        return;
      }

      if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
        flashButton("=");
        return;
      }

      if (key === "Backspace") {
        event.preventDefault();
        removeLast();
        flashButton("←");
        return;
      }

      if (key === "Delete" || key === "Escape") {
        event.preventDefault();
        clearDisplay();
        flashButton("AC");
        return;
      }

      if (key === "^") {
        addPower();
        flashButton("xʸ");
        return;
      }

      if (lowerKey === "r") {
        addFunction("sqrt");
        flashButton("√");
        return;
      }

      if (lowerKey === "a") {
        add("Ans");
        flashButton("ANS");
      }
    });
  }

  /* =====================================================
     OUTPUT + REPORT HISTORY
  ===================================================== */

  function getOutputPanelId(type) {
    if (type === "basic") return "universalLoanStyleOutput";
    if (type === "loan") return "loanExternalOutput";
    if (type === "personalLoan") return "personalLoanExternalOutput";
    return type + "ReportOutput";
  }

  function getMainCalculator() {
    const main = $("main.pc-calculator-layout") || $("main");
    return main ? $(".calculator", main) : null;
  }

  function getOrCreateOutputPanel(type) {
    const calculator = getMainCalculator();
    if (!calculator) return null;

    const id = getOutputPanelId(type);
    let panel = byId(id);

    if (!panel) {
      panel = document.createElement("section");
      panel.id = id;
      panel.className = "loan-style-output-panel calculator-clean-result";
      panel.setAttribute("aria-label", "Calculator result");
      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function makeTable(rows) {
    return (
      '<div class="loan-result-table-scroll">' +
        '<table class="loan-result-table universal-loan-result-table">' +
          '<thead><tr><th>Item</th><th>Value</th></tr></thead>' +
          '<tbody>' +
            rows.map(function (row) {
              return "<tr><td>" + escapeHtml(row[0]) + "</td><td>" + escapeHtml(row[1]) + "</td></tr>";
            }).join("") +
          "</tbody>" +
        "</table>" +
      "</div>"
    );
  }

  function makePointList(rows) {
    return (
      '<div class="age-point-result-box">' +
        '<ul class="age-point-result-list">' +
          rows.map(function (row) {
            return (
              '<li>' +
                '<strong>' + escapeHtml(row[0]) + ':</strong> ' +
                '<span>' + escapeHtml(row[1]) + '</span>' +
              '</li>'
            );
          }).join("") +
        '</ul>' +
      '</div>'
    );
  }

  function rowsToPlainText(rows) {
    return rows.map(function (row) {
      return row[0] + ": " + row[1];
    }).join("\n");
  }

  function copyTable(table, button) {
    if (!table) return;

    const text = Array.from(table.querySelectorAll("tr"))
      .map(function (row) {
        return Array.from(row.querySelectorAll("th, td"))
          .map(function (cell) {
            return cleanText(cell.textContent);
          })
          .join("\t");
      })
      .join("\n");

    copyText(text, button);
  }

  function hideNativeResultElements(type) {
    const ids = ["result", "ageResult", "bmiResult", "loanResult", "personalLoanResult", "discountResult", "percentageResult", "compoundResult"];
    ids.forEach(function (id) {
      const element = byId(id);
      if (element) element.style.display = "none";
    });
  }

  function renderResultPanel(type, rows, extraTopHtml) {
    const panel = getOrCreateOutputPanel(type);
    if (!panel) return null;

    const isAgeResult = type === "age";
    const resultHtml = isAgeResult ? makePointList(rows) : makeTable(rows);

    panel.className = "loan-style-output-panel calculator-clean-result " + type + "-clean-result" + (isAgeResult ? " age-point-output" : "");
    panel.innerHTML =
      (extraTopHtml || "") +
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +
          '<div class="loan-result-body">' + resultHtml + '</div>' +
        '</div>' +
        '<div class="loan-copy-side"><button type="button" class="loan-copy-btn">Copy</button></div>' +
      '</div>';

    panel.hidden = false;
    panel.style.setProperty("display", "block", "important");
    panel.style.setProperty("visibility", "visible", "important");

    const copyBtn = panel.querySelector(".loan-copy-btn");
    if (copyBtn) {
      copyBtn.onclick = function () {
        if (isAgeResult) {
          copyText(rowsToPlainText(rows), copyBtn);
          return;
        }

        copyTable(panel.querySelector("table"), copyBtn);
      };
    }

    hideNativeResultElements(type);
    return panel;
  }

  function renderBasicAnswer() {
    if (getPageType() !== "basic") return;

    const display = getDisplay();
    const answer = display ? cleanText(display.value) : "";
    if (!answer || answer === "Error") return;

    const panel = getOrCreateOutputPanel("basic");
    if (!panel) return;

    panel.className = "loan-style-output-panel basic-equal-output-panel calculator-clean-result";
    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +
          '<div class="loan-result-body">' +
            '<div class="basic-equal-result"><span class="basic-equal-symbol">=</span> <span class="basic-equal-answer">' + escapeHtml(answer) + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="loan-copy-side"><button type="button" class="loan-copy-btn">Copy</button></div>' +
      '</div>';

    panel.hidden = false;
    panel.style.setProperty("display", "block", "important");

    const copyBtn = panel.querySelector(".loan-copy-btn");
    if (copyBtn) {
      copyBtn.onclick = function () {
        copyText(answer, copyBtn);
      };
    }
  }

  function getInputLabel(input) {
    if (!input) return "Input";

    if (input.id) {
      const label = $('label[for="' + input.id + '"]');
      if (label) return cleanText(label.textContent.replace(/[:：]/g, ""));
    }

    const previous = input.previousElementSibling;
    if (previous && lower(previous.tagName) === "label") {
      return cleanText(previous.textContent.replace(/[:：]/g, ""));
    }

    return cleanText(input.getAttribute("aria-label") || input.placeholder || input.name || input.id || "Input");
  }

  function getInputDisplayValue(input) {
    if (!input) return "";

    if (lower(input.tagName) === "select") {
      const option = input.options[input.selectedIndex];
      return cleanText(option ? option.textContent : input.value);
    }

    return cleanText(input.value);
  }

  function getFilledInputs() {
    const lines = [];
    const used = new Set();

    function addInput(input) {
      if (!input) return;
      if (["hidden", "button", "submit", "reset"].includes(input.type)) return;
      if (input.id === "display") return;

      const key = input.id || input.name || getInputLabel(input);
      if (used.has(key)) return;
      used.add(key);

      const value = getInputDisplayValue(input);
      if (value) {
        lines.push({ label: getInputLabel(input), value: value });
      }
    }

    $$(
      ".calculator input, .calculator select, .calculator textarea, " +
      ".optional-mortgage-costs input, .optional-mortgage-costs select, " +
      ".early-settlement-box input, .early-settlement-box select, " +
      ".bmi-input-groups input, .bmi-input-groups select"
    ).forEach(addInput);

    return lines;
  }

  function reportKey(type) {
    return "calculatorReports_v5_" + type;
  }

  function loadReports(type) {
    return loadArray(reportKey(type));
  }

  function saveReports(type, reports) {
    saveArray(reportKey(type), reports);
  }

  function resultPanelHtml(type) {
    const panel = byId(getOutputPanelId(type));
    if (!panel || panel.hidden) return "";

    const clone = panel.cloneNode(true);
    clone.querySelectorAll("script, iframe, object, embed, link, meta, button, a, .loan-copy-side, .loan-graph-copy-side, .calculator-report-actions").forEach(function (element) {
      element.remove();
    });

    return clone.innerHTML || clone.outerHTML || "";
  }

  function resultPanelText(type) {
    const panel = byId(getOutputPanelId(type));
    return panel && !panel.hidden ? cleanText(panel.innerText || panel.textContent || "") : "";
  }

  function shortReportLabel(type, report) {
    const lines = report.inputLines || [];

    function find(pattern) {
      const line = lines.find(function (item) {
        return pattern.test(item.label || "");
      });
      return line ? line.value : "";
    }

    if (type === "age") return "Birthdate: " + (find(/birth/i) || "-");
    if (type === "bmi") return "BMI: " + ((report.metrics && report.metrics.bmi) || "report");
    if (type === "loan") return "Mortgage amount: " + moneyRM(find(/loan amount|purchase price|amount/i));
    if (type === "personalLoan") return "Loan amount: " + moneyRM(find(/loan amount|amount/i));
    if (type === "discount") return "Price: " + moneyRM(find(/price|amount/i));
    if (type === "percentage") return (find(/percentage|percent/i) || "-") + " of " + (find(/number|amount|value/i) || "-");
    if (type === "compound") return "Principal: " + moneyRM(find(/principal|amount/i));

    return "Report";
  }

  function reportSignature(report) {
    return JSON.stringify({ inputs: report.inputLines, result: report.resultText });
  }

  function saveCurrentReport(type, metrics) {
    if (!isReportType(type)) return;

    metrics = metrics || {};

    const resultHtml = resultPanelHtml(type);
    const resultText = resultPanelText(type);
    if (!resultHtml || !resultText) return;

    const report = {
      type: type,
      id: type + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      createdAt: new Date().toLocaleString(),
      inputLines: getFilledInputs(),
      resultLines: Array.isArray(metrics.resultRows) ? metrics.resultRows : [],
      resultHtml: resultHtml,
      resultText: resultText,
      metrics: metrics || {}
    };

    report.label = shortReportLabel(type, report);

    const reports = loadReports(type);
    const last = reports[reports.length - 1];

    if (last && reportSignature(last) === reportSignature(report)) {
      renderReportHistory(type);
      return;
    }

    reports.push(report);
    saveReports(type, reports);
    renderReportHistory(type);
  }

  function encodeBase64Url(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";

    bytes.forEach(function (byte) {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  function decodeBase64Url(text) {
    const normal = String(text || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normal + "===".slice((normal.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new TextDecoder().decode(bytes);
  }

  function reportHref(report) {
    return window.location.href.split("#")[0] + "#calc-report=" + encodeBase64Url(JSON.stringify(report));
  }

  function getHistoryList(type) {
    const map = {
      age: "ageHistoryList",
      bmi: "bmiHistoryList",
      loan: "loanHistoryList",
      personalLoan: "personalLoanHistoryList",
      discount: "discountHistoryList",
      percentage: "percentageHistoryList",
      compound: "compoundHistoryList"
    };

    return byId(map[type]);
  }

  function renderReportHistory(type) {
    if (!isReportType(type)) return;

    const list = getHistoryList(type);
    if (!list) return;

    const box = list.closest(".history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box");
    const title = box ? $("h3", box) : null;
    if (title) title.textContent = "History";

    list.innerHTML = "";

    loadReports(type).slice().reverse().forEach(function (report) {
      const li = document.createElement("li");
      li.className = "history-item calculator-report-history-item";

      const text = document.createElement("span");
      text.className = "history-text calculator-report-history-label";
      text.textContent = report.label || shortReportLabel(type, report);

      const link = document.createElement("a");
      link.className = "calculator-report-open-link mortgage-fast-open-link";
      link.textContent = "open report";
      link.href = reportHref(report);
      link.target = "_self";
      link.rel = "";

      li.appendChild(text);
      li.appendChild(link);
      list.appendChild(li);
    });
  }

  function clearReports(type) {
    safeRemove(reportKey(type));
    renderReportHistory(type);

    const panel = byId(getOutputPanelId(type));
    if (panel) panel.hidden = true;
  }

  /* =====================================================
     AGE CALCULATOR
  ===================================================== */

  function todayValueISO() {
    const today = new Date();
    return today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  }

  function formatDateDMY(value) {
    const parts = String(value || "").split("-");
    return parts.length === 3 ? parts[2] + "/" + parts[1] + "/" + parts[0] : value || "";
  }

  function parseDateInput(value, endOfToday) {
    if (!value) return null;

    const parts = String(value).split("-").map(Number);
    if (parts.length !== 3 || parts.some(function (part) { return !Number.isFinite(part); })) return null;

    const date = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);

    if (endOfToday && value === todayValueISO()) {
      const now = new Date();
      date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    }

    return date;
  }

  function ensureAgeTargetDateInput() {
    const birthdateInput = byId("birthdate");
    if (!birthdateInput) return null;

    let targetInput = byId("dateToCalculate");

    if (!targetInput) {
      const label = document.createElement("label");
      label.setAttribute("for", "dateToCalculate");
      label.textContent = "Date to calculate:";

      targetInput = document.createElement("input");
      targetInput.type = "date";
      targetInput.id = "dateToCalculate";
      targetInput.setAttribute("aria-label", "Date to calculate");

      birthdateInput.insertAdjacentElement("afterend", targetInput);
      targetInput.insertAdjacentElement("beforebegin", label);
    }

    if (!targetInput.value) targetInput.value = todayValueISO();

    return targetInput;
  }

  function calendarAgeBreakdown(birthDate, targetDate) {
    if (!birthDate || !targetDate || birthDate > targetDate) return null;

    let years = targetDate.getFullYear() - birthDate.getFullYear();
    let months = targetDate.getMonth() - birthDate.getMonth();
    let days = targetDate.getDate() - birthDate.getDate();
    let hours = targetDate.getHours() - birthDate.getHours();
    let minutes = targetDate.getMinutes() - birthDate.getMinutes();

    if (minutes < 0) {
      minutes += 60;
      hours -= 1;
    }

    if (hours < 0) {
      hours += 24;
      days -= 1;
    }

    if (days < 0) {
      const previousMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
      days += previousMonth.getDate();
      months -= 1;
    }

    if (months < 0) {
      months += 12;
      years -= 1;
    }

    return { years, months, days, hours, minutes };
  }

  function calculateAsianAgeBetweenDates(birthdateValue, targetDateValue) {
    const birthYear = Number(String(birthdateValue || "").split("-")[0]);
    const targetYear = Number(String(targetDateValue || "").split("-")[0]);

    if (!birthYear || !targetYear || birthYear > targetYear) return "";

    return targetYear - birthYear + 1;
  }

  function nextBirthdayCountdown(birthDate) {
    if (!birthDate) return "-";

    const now = new Date();
    let next = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate(), 0, 0, 0, 0);

    if (birthDate.getMonth() === 1 && birthDate.getDate() === 29 && !isLeapYear(next.getFullYear())) {
      next = new Date(now.getFullYear(), 2, 1, 0, 0, 0, 0);
    }

    if (next < now) {
      next = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate(), 0, 0, 0, 0);

      if (birthDate.getMonth() === 1 && birthDate.getDate() === 29 && !isLeapYear(next.getFullYear())) {
        next = new Date(now.getFullYear() + 1, 2, 1, 0, 0, 0, 0);
      }
    }

    const diffMs = Math.max(0, next - now);
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    return days + " days, " + hours + " hours, " + minutes + " minutes";
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function westernZodiac(month, day) {
    const signs = [
      ["Capricorn", 1, 19], ["Aquarius", 2, 18], ["Pisces", 3, 20],
      ["Aries", 4, 19], ["Taurus", 5, 20], ["Gemini", 6, 20],
      ["Cancer", 7, 22], ["Leo", 8, 22], ["Virgo", 9, 22],
      ["Libra", 10, 22], ["Scorpio", 11, 21], ["Sagittarius", 12, 21]
    ];

    for (const item of signs) {
      if (month < item[1] || (month === item[1] && day <= item[2])) return item[0];
    }

    return "Capricorn";
  }

  function chineseZodiac(year) {
    const animals = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
    return animals[(year - 1900) % 12 < 0 ? ((year - 1900) % 12) + 12 : (year - 1900) % 12];
  }

  function chineseZodiacAnimalAgeText(animal, exactAgeYears) {
    return "Age in " + animal + " year: " + exactAgeYears;
  }

  function totalDaysBetween(startDate, endDate) {
    if (!startDate || !endDate || endDate < startDate) return 0;
    return Math.floor((endDate.getTime() - startDate.getTime()) / 86400000);
  }

  function compactDuration(parts) {
    if (!parts) return "-";

    const values = [
      [parts.years, "year"],
      [parts.months, "month"],
      [parts.days, "day"]
    ];

    return values
      .filter(function (item) { return Number(item[0]) > 0; })
      .map(function (item) {
        return item[0] + " " + item[1] + (item[0] === 1 ? "" : "s");
      })
      .join(", ") || "0 days";
  }

  function countdownToAge(birthDate, targetDate, ageYears, label) {
    if (!birthDate || !targetDate) return "-";

    const milestoneDate = new Date(
      birthDate.getFullYear() + ageYears,
      birthDate.getMonth(),
      birthDate.getDate(),
      birthDate.getHours(),
      birthDate.getMinutes(),
      birthDate.getSeconds(),
      birthDate.getMilliseconds()
    );

    if (birthDate.getMonth() === 1 && birthDate.getDate() === 29 && !isLeapYear(milestoneDate.getFullYear())) {
      milestoneDate.setMonth(2, 1);
    }

    if (targetDate < milestoneDate) {
      return compactDuration(calendarAgeBreakdown(targetDate, milestoneDate)) + " before " + label + " (age " + ageYears + ")";
    }

    return label + " reached " + compactDuration(calendarAgeBreakdown(milestoneDate, targetDate)) + " ago";
  }

  function estimatedSleepText(totalDays) {
    const sleepDays = Math.floor(totalDays / 3);
    const years = Math.floor(sleepDays / 365.2425);
    const days = Math.floor(sleepDays - years * 365.2425);

    return years + " years, " + days + " days (estimated 8 hours/day)";
  }

  function planetAgeText(totalDays) {
    const planets = [
      ["Mercury", 87.969],
      ["Venus", 224.701],
      ["Mars", 686.98],
      ["Jupiter", 4332.59],
      ["Saturn", 10759.22]
    ];

    return planets.map(function (item) {
      const age = totalDays / item[1];
      return item[0] + ": " + age.toFixed(2);
    }).join(" | ");
  }

  function moonCycleText(totalDays) {
    const cycles = totalDays / 29.530588853;
    return cycles.toFixed(1) + " lunar cycles";
  }

  function formatIntlDate(date, locale) {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(date);
    } catch {
      return "Not available";
    }
  }

  function leapBirthdayInfo(birthDate, targetDate) {
    if (!birthDate) return "-";

    const birthYear = birthDate.getFullYear();
    const targetYear = targetDate ? targetDate.getFullYear() : new Date().getFullYear();
    const bornInLeapYear = isLeapYear(birthYear) ? "Yes" : "No";

    if (birthDate.getMonth() !== 1 || birthDate.getDate() !== 29) {
      return "Born in leap year: " + bornInLeapYear;
    }

    let leapBirthdays = 0;
    for (let year = birthYear + 1; year <= targetYear; year += 1) {
      if (isLeapYear(year)) leapBirthdays += 1;
    }

    return "Leap day birthday; actual Feb 29 birthdays passed: " + leapBirthdays;
  }

  function calculateAge() {
    const birthdate = firstValue(["birthdate", "birthDate", "dob"]);
    const targetInput = ensureAgeTargetDateInput();
    const targetValue = targetInput ? targetInput.value : todayValueISO();

    if (!birthdate || !targetValue) return;

    const birthDate = parseDateInput(birthdate, false);
    const targetDate = parseDateInput(targetValue, true);

    if (!birthDate || !targetDate || birthDate > targetDate) return;

    const exact = calendarAgeBreakdown(birthDate, targetDate);
    if (!exact) return;

    const asianAge = calculateAsianAgeBetweenDates(birthdate, targetValue);
    const weekday = birthDate.toLocaleDateString("en-US", { weekday: "long" });
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    const year = birthDate.getFullYear();

    const exactText =
      exact.years + " years, " +
      exact.months + " months, " +
      exact.days + " days, " +
      exact.hours + " hours, " +
      exact.minutes + " minutes";

    const totalAliveDays = totalDaysBetween(birthDate, targetDate);
    const chineseAnimal = chineseZodiac(year);

    const rows = [
      ["Date range", formatDateDMY(birthdate) + " to " + formatDateDMY(targetValue)],
      ["Exact age", exactText],
      ["Normal age", exact.years + " years old"],
      ["Asian age", asianAge + " years old"],
      ["Next birthday countdown", nextBirthdayCountdown(birthDate)],
      ["Day of week born", weekday],
      ["Born date in Islamic calendar", formatIntlDate(birthDate, "en-GB-u-ca-islamic")],
      ["Born date in Chinese calendar", formatIntlDate(birthDate, "en-GB-u-ca-chinese")],
      ["Western zodiac", westernZodiac(month, day)],
      ["Chinese zodiac", chineseAnimal],
      ["Age in " + chineseAnimal + " year", String(exact.years)],
      ["Retirement", countdownToAge(birthDate, targetDate, 60, "retirement")],
      ["Estimated sleep time", estimatedSleepText(totalAliveDays)],
      ["Age on other planets", planetAgeText(totalAliveDays)],
      ["Days spent alive", totalAliveDays.toLocaleString()],
      ["Moon cycles experienced", moonCycleText(totalAliveDays)],
      ["Legal age", countdownToAge(birthDate, targetDate, 18, "legal adult age")],
      ["Leap year age", leapBirthdayInfo(birthDate, targetDate)]
    ];

    renderResultPanel("age", rows);
    saveCurrentReport("age", {
      exactAge: exactText,
      normalAge: exact.years,
      asianAge: asianAge,
      resultRows: rows.map(function (row) {
        return {
          label: row[0],
          value: row[1]
        };
      })
    });
  }

  /* =====================================================
     BMI CALCULATOR
  ===================================================== */

  function ensureBMIProfileAndGroups() {
    if (getPageType() !== "bmi") return;

    const calculator = $(".calculator");
    if (!calculator) return;

    const weight = byId("weight");
    const height = byId("height");
    const waist = byId("waist");
    if (!weight || !height) return;

    if (!byId("bmiAge")) {
      const ageLabel = document.createElement("label");
      ageLabel.id = "bmiAgeLabel";
      ageLabel.setAttribute("for", "bmiAge");
      ageLabel.textContent = "Age (optional):";

      const age = document.createElement("input");
      age.type = "number";
      age.id = "bmiAge";
      age.placeholder = "Optional";
      age.inputMode = "decimal";

      const genderLabel = document.createElement("label");
      genderLabel.id = "bmiGenderLabel";
      genderLabel.setAttribute("for", "bmiGender");
      genderLabel.textContent = "Gender (optional):";

      const gender = document.createElement("select");
      gender.id = "bmiGender";
      gender.innerHTML = '<option value="">Optional</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>';

      calculator.insertBefore(gender, weight);
      calculator.insertBefore(genderLabel, gender);
      calculator.insertBefore(age, genderLabel);
      calculator.insertBefore(ageLabel, age);
    }

    let row = $(".bmi-input-groups");
    if (!row) {
      row = document.createElement("div");
      row.className = "bmi-input-groups";

      const titleRow = $(".bmi-title-row");
      if (titleRow) {
        titleRow.insertAdjacentElement("afterend", row);
      } else {
        calculator.insertAdjacentElement("afterbegin", row);
      }
    }

    let measurementBox = $(".bmi-measurement-box");
    if (!measurementBox) {
      measurementBox = document.createElement("div");
      measurementBox.className = "bmi-measurement-box";
      measurementBox.innerHTML = '<div class="bmi-extra-title">Measurements</div>';
    }

    let profileBox = $(".bmi-profile-box");
    if (!profileBox) {
      profileBox = document.createElement("div");
      profileBox.className = "bmi-profile-box";
      profileBox.innerHTML = '<div class="bmi-extra-title">Profile</div>';
    }

    if (!row.contains(measurementBox)) row.appendChild(measurementBox);
    if (!row.contains(profileBox)) row.appendChild(profileBox);

    ["weightLabel", "weight", "heightLabel", "height", "waistLabel", "waist"].forEach(function (id) {
      const element = byId(id);
      if (element) measurementBox.appendChild(element);
    });

    ["bmiAgeLabel", "bmiAge", "bmiGenderLabel", "bmiGender"].forEach(function (id) {
      const element = byId(id);
      if (element) profileBox.appendChild(element);
    });
  }

  function setBMIUnit(unit) {
    const normalized = unit === "us" ? "us" : "si";
    document.body.dataset.bmiUnit = normalized;

    const button = byId("unitToggleBtn");
    if (button) {
      button.dataset.currentUnit = normalized;
      button.textContent = normalized === "si" ? "SI" : "US";
    }

    const weightLabel = byId("weightLabel");
    const heightLabel = byId("heightLabel");
    const waistLabel = byId("waistLabel");
    const weight = byId("weight");
    const height = byId("height");
    const waist = byId("waist");

    if (normalized === "si") {
      if (weightLabel) weightLabel.textContent = "Weight in kg:";
      if (heightLabel) heightLabel.textContent = "Height in cm:";
      if (waistLabel) waistLabel.textContent = "Waist circumference in cm:";
      if (weight) weight.placeholder = "Example: 70";
      if (height) height.placeholder = "Example: 170";
      if (waist) waist.placeholder = "Optional, Example: 80";
    } else {
      if (weightLabel) weightLabel.textContent = "Weight in lb:";
      if (heightLabel) heightLabel.textContent = "Height in inch:";
      if (waistLabel) waistLabel.textContent = "Waist circumference in inch:";
      if (weight) weight.placeholder = "Example: 154";
      if (height) height.placeholder = "Example: 67";
      if (waist) waist.placeholder = "Optional, Example: 32";
    }
  }

  function toggleBMIUnit() {
    const button = byId("unitToggleBtn");
    const current = button ? (button.dataset.currentUnit || document.body.dataset.bmiUnit || "si") : (document.body.dataset.bmiUnit || "si");
    setBMIUnit(current === "si" ? "us" : "si");
    scheduleAutoCalculate();
  }

  function ageRangeLabel(age) {
    if (!Number.isFinite(age) || age <= 0) return "Not provided";
    if (age < 18) return "Under 18";
    if (age < 65) return "Adult 18–64";
    return "Senior 65+";
  }

  function genderLabel(value) {
    if (!value) return "Not provided";
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }

  function calculateBMI() {
    ensureBMIProfileAndGroups();

    const weight = firstNumber(["weight", "bmiWeight"]);
    const height = firstNumber(["height", "bmiHeight"]);
    const waist = firstNumber(["waist", "bmiWaist"]);
    const age = firstNumber(["bmiAge"]);
    const gender = firstValue(["bmiGender"]);

    if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) return;

    const button = byId("unitToggleBtn");
    const unit = (button ? button.dataset.currentUnit : document.body.dataset.bmiUnit) || "si";
    let bmi;
    let ratio = NaN;

    if (unit === "us") {
      bmi = 703 * weight / (height * height);
      if (Number.isFinite(waist) && waist > 0) ratio = waist / height;
    } else {
      const heightM = height / 100;
      bmi = weight / (heightM * heightM);
      if (Number.isFinite(waist) && waist > 0) ratio = waist / height;
    }

    let category = "Normal";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 25 && bmi < 30) category = "Overweight";
    else if (bmi >= 30) category = "Obese";

    const rows = [
      ["BMI", bmi.toFixed(2)],
      ["BMI category", category],
      ["Unit", unit === "us" ? "US" : "SI"],
      ["Age range", ageRangeLabel(age)],
      ["Gender", genderLabel(gender)]
    ];

    const metrics = { bmi: bmi.toFixed(2), category: category };

    if (Number.isFinite(ratio)) {
      const status = ratio < 0.5 ? "Healthy (< 0.5)" : "Higher risk (≥ 0.5)";
      rows.push(["Waist-to-height ratio", ratio.toFixed(2)]);
      rows.push(["Waist-to-height status", status]);
      metrics.waistRatio = ratio.toFixed(2);
      metrics.waistStatus = status;
    } else {
      rows.push(["Waist-to-height ratio", "Not provided"]);
      rows.push(["Waist-to-height status", "Enter waist to check; < 0.5 is healthy"]);
    }

    renderResultPanel("bmi", rows);
    saveCurrentReport("bmi", metrics);
  }

  /* =====================================================
     FINANCE / OTHER CALCULATORS
  ===================================================== */

  function calculateDiscount() {
    const price = firstNumber(["price", "originalPrice", "amount"]);
    const discount = firstNumber(["discount", "discountRate"]);

    if (!Number.isFinite(price) || !Number.isFinite(discount) || price <= 0 || discount < 0 || discount > 100) return;

    const savings = price * discount / 100;
    const finalPrice = price - savings;

    const rows = [
      ["Original price", moneyRM(price)],
      ["Discount", discount + "%"],
      ["Savings", moneyRM(savings)],
      ["Final price", moneyRM(finalPrice)]
    ];

    renderResultPanel("discount", rows);
    saveCurrentReport("discount", { finalPrice: moneyRM(finalPrice) });
  }

  function calculatePercentage() {
    const percentage = firstNumber(["percentage", "percent"]);
    const number = firstNumber(["number", "amount", "value"]);

    if (!Number.isFinite(percentage) || !Number.isFinite(number)) return;

    const answer = percentage / 100 * number;

    const rows = [
      ["Percentage", percentage + "%"],
      ["Number", String(number)],
      ["Result", money(answer)]
    ];

    renderResultPanel("percentage", rows);
    saveCurrentReport("percentage", { result: money(answer) });
  }

  function calculateCompound() {
    const principal = firstNumber(["principal", "compoundPrincipal", "amount"]);
    const rate = firstNumber(["rate", "compoundRate", "interest", "interestRate"]);
    const years = firstNumber(["years", "compoundYears", "time"]);
    const frequency = Number(firstValue(["frequency", "compoundFrequency"])) || 1;

    if (!Number.isFinite(principal) || !Number.isFinite(rate) || !Number.isFinite(years) || principal <= 0 || rate < 0 || years <= 0 || frequency <= 0) return;

    const futureValue = principal * Math.pow(1 + rate / 100 / frequency, frequency * years);
    const compoundInterest = futureValue - principal;

    const rows = [
      ["Principal", moneyRM(principal)],
      ["Annual interest rate", rate + "%"],
      ["Years", String(years)],
      ["Compounding frequency", String(frequency)],
      ["Future value", moneyRM(futureValue)],
      ["Compound interest", moneyRM(compoundInterest)]
    ];

    renderResultPanel("compound", rows);
    saveCurrentReport("compound", { futureValue: moneyRM(futureValue) });
  }

  function calculateLoanPayment(principal, annualRate, months) {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / months;

    return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  }

  function remainingBalance(principal, annualRate, months, paidMonths, extraMonthly) {
    const monthlyRate = annualRate / 100 / 12;
    const normalPayment = calculateLoanPayment(principal, annualRate, months);
    const payment = normalPayment + (Number(extraMonthly) || 0);

    if (monthlyRate === 0) {
      return Math.max(0, principal - payment * paidMonths);
    }

    return Math.max(0, principal * Math.pow(1 + monthlyRate, paidMonths) - payment * ((Math.pow(1 + monthlyRate, paidMonths) - 1) / monthlyRate));
  }

  function ensureMortgageOptionalSections() {
    if (getPageType() !== "loan") return;

    const calculator = $(".calculator");
    if (!calculator) return;

    let row = $(".loan-optional-row");
    if (!row) {
      row = document.createElement("div");
      row.className = "loan-optional-row";

      const calculateButton = $(".main-btn", calculator) || Array.from($$("button", calculator)).find(function (button) {
        return lower(button.textContent).includes("calculate");
      });

      if (calculateButton) calculateButton.insertAdjacentElement("beforebegin", row);
      else calculator.appendChild(row);
    }

    let optional = $(".optional-mortgage-costs");
    if (!optional) {
      optional = document.createElement("div");
      optional.className = "optional-mortgage-costs";
      optional.innerHTML =
        '<button type="button" class="optional-mortgage-toggle" aria-expanded="true">Optional costs</button>' +
        '<div class="optional-mortgage-content">' +
          '<label for="propertyTaxYearly">Property tax per year:</label>' +
          '<input type="number" id="propertyTaxYearly" placeholder="Optional">' +
          '<label for="homeInsuranceYearly">Home insurance per year:</label>' +
          '<input type="number" id="homeInsuranceYearly" placeholder="Optional">' +
          '<label for="otherMonthlyFees">Other monthly fees:</label>' +
          '<input type="number" id="otherMonthlyFees" placeholder="Optional">' +
        '</div>';
    }

    let early = $(".early-settlement-box");
    if (!early) {
      early = document.createElement("div");
      early.className = "early-settlement-box";
      early.innerHTML =
        '<button type="button" class="early-settlement-toggle" aria-expanded="true">Optional early settlement</button>' +
        '<div class="early-settlement-content">' +
          '<label for="earlySettlementMonth">Settle after month:</label>' +
          '<input type="number" id="earlySettlementMonth" placeholder="Optional">' +
          '<label for="extraMonthlyPayment">Extra monthly payment:</label>' +
          '<input type="number" id="extraMonthlyPayment" placeholder="Optional">' +
        '</div>';
    }

    if (!row.contains(optional)) row.appendChild(optional);
    if (!row.contains(early)) row.appendChild(early);

    const hoa = byId("hoaMonthly");
    const other = byId("otherMonthlyFees");
    if (hoa && other) {
      if (!other.value && hoa.value) other.value = hoa.value;
      const label = $('label[for="hoaMonthly"]');
      if (label) label.remove();
      hoa.remove();
    }
  }

  function calculateLoan() {
    ensureMortgageOptionalSections();

    const amount = firstNumber(["amount", "loanAmount", "loanPrincipal"]);
    const annualRate = firstNumber(["interest", "loanRate", "interestRate", "annualRate"]);
    const termInput = firstInput(["years", "loanYears", "loanTerm", "term"]);
    const rawTerm = termInput ? numberFromString(termInput.value) : NaN;

    if (!Number.isFinite(amount) || !Number.isFinite(annualRate) || !Number.isFinite(rawTerm) || amount <= 0 || annualRate < 0 || rawTerm <= 0) return;

    const label = termInput ? getInputLabel(termInput) : "";
    const isMonths = termInput && (termInput.dataset.termUnit === "months" || /month/i.test(label));
    const months = isMonths ? Math.round(rawTerm) : Math.round(rawTerm * 12);

    if (!Number.isFinite(months) || months <= 0) return;

    const baseMonthly = calculateLoanPayment(amount, annualRate, months);
    const taxMonthly = (firstNumber(["propertyTaxYearly"]) || 0) / 12;
    const insuranceMonthly = (firstNumber(["homeInsuranceYearly"]) || 0) / 12;
    const otherMonthly = firstNumber(["otherMonthlyFees", "hoaMonthly"]) || 0;
    const extraMonthly = firstNumber(["extraMonthlyPayment"]) || 0;
    const totalMonthly = baseMonthly + taxMonthly + insuranceMonthly + otherMonthly + extraMonthly;
    const totalPayment = baseMonthly * months;
    const totalInterest = totalPayment - amount;

    const rows = [
      ["Loan amount", moneyRM(amount)],
      ["Annual interest rate", annualRate.toFixed(2) + "%"],
      ["Loan term", months + " months"],
      ["Monthly payment", moneyRM(baseMonthly)],
      ["Property tax monthly", moneyRM(taxMonthly)],
      ["Home insurance monthly", moneyRM(insuranceMonthly)],
      ["Other monthly fees", moneyRM(otherMonthly)],
      ["Extra monthly payment", moneyRM(extraMonthly)],
      ["Total monthly payment", moneyRM(totalMonthly)],
      ["Total interest", moneyRM(totalInterest)],
      ["Total payment", moneyRM(totalPayment)]
    ];

    const settleMonth = firstNumber(["earlySettlementMonth"]);
    if (Number.isFinite(settleMonth) && settleMonth > 0) {
      const paidMonths = Math.min(Math.round(settleMonth), months);
      rows.push(["Estimated balance after month " + paidMonths, moneyRM(remainingBalance(amount, annualRate, months, paidMonths, extraMonthly))]);
    }

    const summary =
      '<div class="calculator-report-summary-boxes mortgage-result-summary">' +
        '<div class="calculator-report-summary-card calculator-report-monthly-card">' +
          '<div class="calculator-report-summary-label">Monthly payment</div>' +
          '<div class="calculator-report-summary-value">' + moneyRM(baseMonthly) + '</div>' +
        '</div>' +
        '<div class="calculator-report-summary-card calculator-report-interest-card">' +
          '<div class="calculator-report-summary-label">Total interest</div>' +
          '<div class="calculator-report-summary-value">' + moneyRM(totalInterest) + '</div>' +
        '</div>' +
        '<div class="calculator-report-summary-card calculator-report-total-card">' +
          '<div class="calculator-report-summary-label">Total payment</div>' +
          '<div class="calculator-report-summary-value">' + moneyRM(totalPayment) + '</div>' +
        '</div>' +
      '</div>';

    renderResultPanel("loan", rows, summary);
    saveCurrentReport("loan", {
      monthlyPayment: moneyRM(baseMonthly),
      totalInterest: moneyRM(totalInterest),
      totalPayment: moneyRM(totalPayment)
    });
  }

  function calculatePersonalLoan() {
    const amount = firstNumber(["amount", "loanAmount", "loanPrincipal"]);
    const annualRate = firstNumber(["interest", "loanRate", "interestRate", "annualRate"]);
    const termInput = firstInput(["years", "loanYears", "loanTerm", "term"]);
    const rawTerm = termInput ? numberFromString(termInput.value) : NaN;

    if (!Number.isFinite(amount) || !Number.isFinite(annualRate) || !Number.isFinite(rawTerm) || amount <= 0 || annualRate < 0 || rawTerm <= 0) return;

    const label = termInput ? getInputLabel(termInput) : "";
    const isMonths = termInput && (termInput.dataset.termUnit === "months" || /month/i.test(label));
    const months = isMonths ? Math.round(rawTerm) : Math.round(rawTerm * 12);

    if (!Number.isFinite(months) || months <= 0) return;

    const monthlyPayment = calculateLoanPayment(amount, annualRate, months);
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - amount;

    const rows = [
      ["Loan amount", moneyRM(amount)],
      ["Annual interest rate", annualRate.toFixed(2) + "%"],
      ["Loan term", months + " months"],
      ["Monthly payment", moneyRM(monthlyPayment)],
      ["Total interest", moneyRM(totalInterest)],
      ["Total payment", moneyRM(totalPayment)]
    ];

    const summary =
      '<div class="calculator-report-summary-boxes personal-loan-result-summary">' +
        '<div class="calculator-report-summary-card calculator-report-monthly-card">' +
          '<div class="calculator-report-summary-label">Monthly payment</div>' +
          '<div class="calculator-report-summary-value">' + moneyRM(monthlyPayment) + '</div>' +
        '</div>' +
        '<div class="calculator-report-summary-card calculator-report-interest-card">' +
          '<div class="calculator-report-summary-label">Total interest</div>' +
          '<div class="calculator-report-summary-value">' + moneyRM(totalInterest) + '</div>' +
        '</div>' +
        '<div class="calculator-report-summary-card calculator-report-total-card">' +
          '<div class="calculator-report-summary-label">Total payment</div>' +
          '<div class="calculator-report-summary-value">' + moneyRM(totalPayment) + '</div>' +
        '</div>' +
      '</div>';

    renderResultPanel("personalLoan", rows, summary);
    saveCurrentReport("personalLoan", {
      monthlyPayment: moneyRM(monthlyPayment),
      totalInterest: moneyRM(totalInterest),
      totalPayment: moneyRM(totalPayment)
    });
  }

  /* =====================================================
     REPORT PAGE
  ===================================================== */

  function tableRows(lines) {
    return (lines || []).map(function (line) {
      return "<tr><td>" + escapeHtml(line.label) + "</td><td>" + escapeHtml(line.value) + "</td></tr>";
    }).join("");
  }

  function cleanResultHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html || "";

    template.content.querySelectorAll("script, iframe, object, embed, link, meta, button, a").forEach(function (element) {
      element.remove();
    });

    template.content.querySelectorAll("*").forEach(function (element) {
      Array.from(element.attributes).forEach(function (attribute) {
        const name = attribute.name.toLowerCase();
        const value = String(attribute.value || "").trim().toLowerCase();
        if (name.startsWith("on") || value.startsWith("javascript:")) {
          element.removeAttribute(attribute.name);
        }
      });
    });

    return template.innerHTML;
  }

  function resultRowsToTable(rows) {
    return (
      '<div class="calculator-report-table-scroll age-report-result-table-wrap">' +
        '<table class="age-report-result-table">' +
          '<thead><tr><th>Result item</th><th>Details</th></tr></thead>' +
          '<tbody>' + tableRows(rows || []) + '</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  function ageReportFlowHtml(rows) {
    rows = Array.isArray(rows) ? rows : [];

    const groups = [
      {
        title: "Birth & calendar",
        note: "Where the age calculation starts.",
        match: /date range|day of week born|born date in islamic|born date in chinese/i
      },
      {
        title: "Current age",
        note: "Main age values for the selected date.",
        match: /exact age|normal age|asian age|age in .* year/i
      },
      {
        title: "Birthday & milestones",
        note: "Upcoming birthday and important age milestones.",
        match: /next birthday countdown|retirement|legal age|leap year age/i
      },
      {
        title: "Zodiac profile",
        note: "Western and Chinese zodiac details.",
        match: /western zodiac|chinese zodiac/i
      },
      {
        title: "Life time summary",
        note: "Estimated time already lived and slept.",
        match: /days spent alive|estimated sleep time/i
      },
      {
        title: "Space & moon view",
        note: "Age translated into planet years and moon cycles.",
        match: /age on other planets|moon cycles experienced/i
      }
    ];

    const used = new Set();

    function rowsForGroup(group) {
      return rows.filter(function (row, index) {
        if (!row || used.has(index)) return false;
        const label = String(row.label || "");
        if (!group.match.test(label)) return false;
        used.add(index);
        return true;
      });
    }

    function makeStep(group, groupRows, index) {
      if (!groupRows.length) return "";

      return (
        '<section class="age-report-flow-step">' +
          '<div class="age-report-flow-number">' + (index + 1) + '</div>' +
          '<div class="age-report-flow-content">' +
            '<h3>' + escapeHtml(group.title) + '</h3>' +
            '<p>' + escapeHtml(group.note) + '</p>' +
            '<div class="calculator-report-table-scroll">' +
              '<table class="age-report-flow-table">' +
                '<tbody>' + tableRows(groupRows) + '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>' +
        '</section>'
      );
    }

    let html = groups.map(function (group, index) {
      return makeStep(group, rowsForGroup(group), index);
    }).join("");

    const remaining = rows.filter(function (row, index) {
      return row && !used.has(index);
    });

    if (remaining.length) {
      html += makeStep({
        title: "Other details",
        note: "Additional age information.",
        match: /.*/
      }, remaining, groups.length);
    }

    return '<div class="age-report-flow">' + html + '</div>';
  }

  function reportResultHtml(report) {
    if (report && report.type === "age") {
      if (Array.isArray(report.resultLines) && report.resultLines.length) {
        return ageReportFlowHtml(report.resultLines);
      }

      if (report.metrics && Array.isArray(report.metrics.resultRows) && report.metrics.resultRows.length) {
        return ageReportFlowHtml(report.metrics.resultRows);
      }
    }

    return cleanResultHtml(report ? report.resultHtml : "");
  }

  function reportPageTitle(type) {
    return ({
      age: "Age Report",
      bmi: "BMI Report",
      loan: "Mortgage Report",
      personalLoan: "Personal Loan Report",
      discount: "Discount Report",
      percentage: "Percentage Report",
      compound: "Compound Interest Report"
    })[type] || "Calculator Report";
  }

  function reportSummaryFromMetrics(report) {
    if (!["loan", "personalLoan"].includes(report.type) || !report.metrics) return "";

    return (
      '<div class="calculator-report-summary-boxes">' +
        '<div class="calculator-report-summary-card calculator-report-monthly-card">' +
          '<div class="calculator-report-summary-label">Monthly payment</div>' +
          '<div class="calculator-report-summary-value">' + escapeHtml(report.metrics.monthlyPayment || "-") + '</div>' +
        '</div>' +
        '<div class="calculator-report-summary-card calculator-report-interest-card">' +
          '<div class="calculator-report-summary-label">Total interest</div>' +
          '<div class="calculator-report-summary-value">' + escapeHtml(report.metrics.totalInterest || "-") + '</div>' +
        '</div>' +
        '<div class="calculator-report-summary-card calculator-report-total-card">' +
          '<div class="calculator-report-summary-label">Total payment</div>' +
          '<div class="calculator-report-summary-value">' + escapeHtml(report.metrics.totalPayment || "-") + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderReportPage(report) {
    document.body.classList.add("calculator-report-view", "mortgage-report-clean-view");

    $$(
      ".calculator, .history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box, " +
      ".instruction-box, .pc-what-slot, .instruction-what-box, #pcHelpQuestionButton, #pcQuestionOverlayButton, " +
      "#universalLoanStyleOutput, #loanExternalOutput, #personalLoanExternalOutput, .calculator-clean-result"
    ).forEach(function (element) {
      element.style.setProperty("display", "none", "important");
    });

    const old = byId("calculatorReportPage");
    if (old) old.remove();

    const section = document.createElement("section");
    section.id = "calculatorReportPage";
    section.className = "calculator-report-page mortgage-fast-report-page";

    section.innerHTML =
      '<h1>' + escapeHtml(reportPageTitle(report.type)) + '</h1>' +
      '<p class="calculator-report-date"><strong>Generated:</strong> ' + escapeHtml(report.createdAt || "") + '</p>' +
      reportSummaryFromMetrics(report) +
      '<div class="calculator-report-card">' +
        '<h2>Inputs</h2>' +
        '<div class="calculator-report-table-scroll"><table><tbody>' + tableRows(report.inputLines) + '</tbody></table></div>' +
      '</div>' +
      '<div class="calculator-report-card">' +
        '<h2>Result</h2>' +
        '<div class="calculator-report-result">' + reportResultHtml(report) + '</div>' +
      '</div>' +
      '<div class="calculator-report-actions">' +
        '<button type="button" class="calculator-report-action-btn calculator-report-back-btn">Go back</button>' +
        '<button type="button" class="calculator-report-action-btn calculator-report-copy-btn">Copy report</button>' +
        '<button type="button" class="calculator-report-action-btn calculator-report-save-btn">Save report</button>' +
        '<button type="button" class="calculator-report-action-btn calculator-report-share-btn">Share report</button>' +
      '</div>';

    const main = $("main") || document.body;
    main.insertAdjacentElement("afterbegin", section);

    const backButton = $(".calculator-report-back-btn", section);
    if (backButton) {
      backButton.onclick = function () {
        window.location.href = window.location.href.split("#")[0];
      };
    }

    const copyButton = $(".calculator-report-copy-btn", section);
    if (copyButton) {
      copyButton.onclick = function () {
        copyText(cleanText(section.innerText), copyButton);
      };
    }

    const saveButton = $(".calculator-report-save-btn", section);
    if (saveButton) {
      saveButton.onclick = function () {
        saveReportFile(section, saveButton);
      };
    }

    const shareButton = $(".calculator-report-share-btn", section);
    if (shareButton) {
      shareButton.onclick = function () {
        shareReport(section, shareButton);
      };
    }
  }

  function openReportFromHash() {
    if (!window.location.hash.startsWith("#calc-report=")) return false;

    try {
      const report = JSON.parse(decodeBase64Url(window.location.hash.replace("#calc-report=", "")));
      renderReportPage(report);
      return true;
    } catch (error) {
      console.error("Could not open report", error);
      return false;
    }
  }

  function saveReportFile(section, button) {
    const html =
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Calculator Report</title>' +
      '<style>body{background:#dfeeff;font-family:Comic Sans MS,Comic Neue,cursive,sans-serif;padding:24px;color:#000}.report{max-width:1100px;margin:0 auto;padding:18px;background:#fff;border:5px solid #000;box-shadow:8px 8px 0 #000}table{width:100%;border-collapse:collapse}td,th{border:3px solid #000;padding:10px}h1,h2{text-align:center}</style>' +
      '</head><body><div class="report">' + section.innerHTML + '</div></body></html>';

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "calculator-report.html";
    document.body.appendChild(link);
    link.click();

    setTimeout(function () {
      URL.revokeObjectURL(url);
      link.remove();
    }, 500);

    setButtonState(button, "Saved!");
  }

  function shareReport(section, button) {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: "Calculator Report",
        text: cleanText(section.innerText).slice(0, 500),
        url: url
      }).catch(function () {
        copyText(url, button);
      });
    } else {
      copyText(url, button);
    }
  }

  /* =====================================================
     INSTRUCTIONS
  ===================================================== */

  const PAGE_DATA = {
    basic: {
      what: "It helps you do quick math calculations like addition, subtraction, multiplication, division, power, and square root.",
      how: "Enter numbers using the buttons, choose an operator, then press = to get the answer.",
      formula: "The calculator follows normal math order: brackets first, then powers, multiplication/division, then addition/subtraction.",
      example: "8 + 2 × 3 = 14 because multiplication is calculated before addition.",
      references: [["Order of operations", "Purplemath explains the normal order of operations.", "https://www.purplemath.com/modules/orderops.htm"]]
    },
    age: {
      what: "It calculates exact age, normal age, Asian age, birthday countdown, zodiac signs, retirement countdown, sleep estimate, planet age, days alive, moon cycles, and legal age.",
      how: "Select your birth date. The result updates automatically.",
      formula: "Exact age is calculated from birth date to the selected target date using years, months, days, hours, and minutes.",
      example: "A birth date of 15/01/2000 shows exact age, birthday countdown, zodiac, retirement countdown, planet ages, days alive, and moon cycles.",
      references: [["Age calculation", "Microsoft shows age calculation using today’s date and a birth date.", "https://support.microsoft.com/en-us/office/calculate-age-113d599f-5fea-448f-a4c3-268927911b37"]]
    },
    bmi: {
      what: "It calculates Body Mass Index and waist-to-height ratio. Age and gender are optional details included in the result/report.",
      how: "Choose SI or US units, enter weight and height, optionally enter waist, age, and gender. The result updates automatically.",
      formula: "SI: BMI = weight kg ÷ height m². US: BMI = weight lb ÷ height inch² × 703. Waist-to-height ratio = waist ÷ height.",
      example: "70 kg and 170 cm gives BMI = 24.22. A waist-to-height ratio below 0.5 is marked healthy.",
      references: [["CDC BMI formula", "CDC lists metric and US customary formulas for calculating BMI.", "https://www.cdc.gov/growth-chart-training/hcp/using-bmi/body-mass-index.html"]]
    },
    loan: {
      what: "It estimates mortgage monthly payment, interest, total payment, optional monthly home costs, and early settlement balance.",
      how: "Enter purchase price or mortgage amount, annual interest rate, loan term in months, and optional mortgage costs. The result updates automatically.",
      formula: "Monthly Payment = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ − 1), where n is the mortgage term in months.",
      example: "A 300,000 mortgage at 4% yearly for 360 months gives an estimated monthly payment using the amortization formula.",
      references: [["Mortgage formula", "Investopedia lists the mortgage payment formula using principal, rate, and months.", "https://www.investopedia.com/mortgage-calculator-5084794"]]
    },
    personalLoan: {
      what: "It estimates personal loan monthly payment, total interest, and total payment using the same cartoon report style as the mortgage calculator.",
      how: "Enter loan amount, annual interest rate, and loan term in months. The result updates automatically.",
      formula: "Monthly Payment = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ − 1), where n is the personal loan term in months.",
      example: "A 10,000 personal loan at 5% yearly for 60 months gives an estimated monthly payment using the amortization formula.",
      references: [["Loan amortization", "Investopedia explains amortized loans and fixed monthly payments.", "https://www.investopedia.com/terms/a/amortized_loan.asp"]]
    },
    discount: {
      what: "It calculates final price after discount and how much money you save.",
      how: "Enter original price and discount percentage. The result updates automatically.",
      formula: "Savings = original price × discount ÷ 100. Final price = original price − savings.",
      example: "If price is 100 and discount is 20%, savings = 20 and final price = 80.",
      references: [["Discount calculation", "Calculator.net explains percent-off discount calculation.", "https://www.calculator.net/discount-calculator.html"]]
    },
    percentage: {
      what: "It calculates a percentage of a number.",
      how: "Enter percentage value and number. The result updates automatically.",
      formula: "Result = percentage ÷ 100 × number.",
      example: "20% of 150 = 30.",
      references: [["Percentage meaning", "A percentage means a value out of 100.", "https://en.wikipedia.org/wiki/Percentage"]]
    },
    compound: {
      what: "It estimates how much money grows when interest is added repeatedly over time.",
      how: "Enter principal, annual interest rate, years, and compounding frequency. The result updates automatically.",
      formula: "A = P(1 + r/n)ⁿᵗ. Compound Interest = A − P.",
      example: "P = 1000, r = 5%, t = 10, n = 12 gives about 1,647.01 future value.",
      references: [["Compound interest formula", "Investopedia lists the compound interest formula as A = P(1 + r/n)^(nt).", "https://www.investopedia.com/articles/investing/020614/learn-simple-and-compound-interest.asp"]]
    }
  };

  function makeInfoBox(className, title, text) {
    const box = document.createElement("div");
    box.className = className;
    box.innerHTML = "<h3>" + escapeHtml(title) + "</h3><p>" + escapeHtml(text) + "</p>";
    return box;
  }

  function buildInstructionLayout() {
    const type = getPageType();
    const data = PAGE_DATA[type];
    const main = $("main");

    if (!main || !data || !$(".calculator", main) || main.classList.contains("calculator-box")) return;

    main.classList.add("has-instructions");
    $$(":scope > .instruction-box, :scope > .pc-what-slot", main).forEach(function (element) {
      element.remove();
    });

    const box = document.createElement("aside");
    box.className = "instruction-box";
    box.setAttribute("aria-label", "Instructions and references");

    box.appendChild(makeInfoBox("instruction-section instruction-what-box", "What does this calculator do?", data.what));

    const title = document.createElement("h2");
    title.className = "instruction-main-title";
    title.textContent = "Instructions";
    box.appendChild(title);

    box.appendChild(makeInfoBox("instruction-section instruction-how-box", "How to use it", data.how));
    box.appendChild(makeInfoBox("instruction-section instruction-formula-box", "Formula used", data.formula));
    box.appendChild(makeInfoBox("instruction-section instruction-example-box", "Example calculation", data.example));

    const referenceBox = document.createElement("section");
    referenceBox.className = "reference-box";
    referenceBox.innerHTML = '<h2 class="reference-main-title">References</h2><div class="reference-scroll"></div>';

    const scroll = $(".reference-scroll", referenceBox);
    data.references.forEach(function (item) {
      const card = document.createElement("div");
      card.className = "reference-card";
      card.innerHTML =
        '<h3>' + escapeHtml(item[0]) + '</h3>' +
        '<p>' + escapeHtml(item[1]) + '</p>' +
        '<a href="' + escapeHtml(item[2]) + '" target="_blank" rel="noopener noreferrer">Open source</a>';
      scroll.appendChild(card);
    });

    box.appendChild(referenceBox);
    main.appendChild(box);
  }

  /* =====================================================
     EVENTS / SETUP
  ===================================================== */

  function readyToCalculate(type) {
    if (type === "age") return !!firstValue(["birthdate"]);
    if (type === "bmi") return !!firstValue(["weight", "bmiWeight"]) && !!firstValue(["height", "bmiHeight"]);
    if (type === "loan" || type === "personalLoan") return !!firstValue(["amount", "loanAmount", "loanPrincipal"]) && !!firstValue(["interest", "loanRate", "interestRate", "annualRate"]) && !!firstValue(["years", "loanYears", "loanTerm", "term"]);
    if (type === "discount") return !!firstValue(["price", "originalPrice", "amount"]) && !!firstValue(["discount", "discountRate"]);
    if (type === "percentage") return !!firstValue(["percentage", "percent"]) && !!firstValue(["number", "amount", "value"]);
    if (type === "compound") return !!firstValue(["principal", "compoundPrincipal", "amount"]) && !!firstValue(["rate", "compoundRate", "interest", "interestRate"]) && !!firstValue(["years", "compoundYears", "time"]);
    return false;
  }

  function calculateByType(type) {
    if (type === "age") calculateAge();
    else if (type === "bmi") calculateBMI();
    else if (type === "loan") calculateLoan();
    else if (type === "personalLoan") calculatePersonalLoan();
    else if (type === "discount") calculateDiscount();
    else if (type === "percentage") calculatePercentage();
    else if (type === "compound") calculateCompound();
  }

  function scheduleAutoCalculate() {
    const type = getPageType();
    if (!isReportType(type)) return;

    clearTimeout(autoTimer);

    autoTimer = setTimeout(function () {
      if (!readyToCalculate(type) || autoRunning) return;

      autoRunning = true;

      try {
        calculateByType(type);
      } finally {
        setTimeout(function () {
          autoRunning = false;
        }, 120);
      }
    }, 250);
  }

  function isCalculateButton(button) {
    if (!button) return false;
    if (button.closest("#navbar")) return false;
    if (button.closest(".history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box")) return false;
    if (button.closest(".calculator-report-actions")) return false;

    const text = lower(button.textContent);
    const id = lower(button.id || "");
    const onclick = lower(button.getAttribute("onclick") || "");

    if (id === "unittogglebtn") return false;
    if (/clear|copy|save|share|back|optional|settlement/.test(text)) return false;

    return text.includes("calculate") || id.includes("calculate") || onclick.includes("calculate");
  }

  function hideCalculateButtons() {
    const type = getPageType();
    if (!isReportType(type)) return;

    $$(".calculator button, main button").forEach(function (button) {
      if (!isCalculateButton(button)) return;

      button.style.setProperty("display", "none", "important");
      button.setAttribute("aria-hidden", "true");
      button.tabIndex = -1;
    });
  }

  function setupNumberInputs() {
    $$("input[type='number']").forEach(function (input) {
      input.setAttribute("inputmode", "decimal");

      if (input.dataset.numberOnlyReady) return;
      input.dataset.numberOnlyReady = "true";

      input.addEventListener("keydown", function (event) {
        const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab", "Home", "End"];

        if (allowedKeys.includes(event.key)) return;
        if (event.ctrlKey || event.metaKey) return;
        if (/^[0-9]$/.test(event.key)) return;
        if (event.key === "." && !input.value.includes(".")) return;

        event.preventDefault();
      });

      input.addEventListener("input", function () {
        let value = input.value.replace(/[^0-9.]/g, "");
        const parts = value.split(".");

        if (parts.length > 2) {
          value = parts[0] + "." + parts.slice(1).join("");
        }

        input.value = value;
      });
    });
  }

  function setupAutoEvents() {
    document.addEventListener("input", function (event) {
      if (
        event.target.matches &&
        event.target.matches("input, select, textarea") &&
        event.target.id !== "display" &&
        !(event.target.closest && event.target.closest("#navbar, .site-search"))
      ) {
        scheduleAutoCalculate();
      }
    }, true);

    document.addEventListener("change", function (event) {
      if (
        event.target.matches &&
        event.target.matches("input, select, textarea") &&
        event.target.id !== "display" &&
        !(event.target.closest && event.target.closest("#navbar, .site-search"))
      ) {
        scheduleAutoCalculate();
      }
    }, true);

    document.addEventListener("click", function (event) {
      const link = event.target.closest("a");
      if (link && link.href && link.href.includes("#calc-report=")) {
        link.target = "_self";
        return;
      }

      const clear = event.target.closest("button.clear-btn, #clearCompoundHistoryBtn");
      if (clear) {
        const type = getPageType();
        if (isReportType(type)) {
          setTimeout(function () {
            clearReports(type);
          }, 0);
        }
      }
    }, true);
  }

  function setupScrollButton() {
    const scrollButton = byId("scrollTopBtn");
    if (!scrollButton) return;

    window.addEventListener("scroll", function () {
      scrollButton.style.display = window.scrollY > 200 ? "flex" : "none";
    }, { passive: true });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleMenu() {
    const navbar = byId("navbar");
    if (navbar) navbar.classList.toggle("open");
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  async function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        fallbackCopy(value);
      }

      setButtonState(button, "Copied!");
    } catch {
      try {
        fallbackCopy(value);
        setButtonState(button, "Copied!");
      } catch {
        setButtonState(button, "Failed");
      }
    }
  }

  function setButtonState(button, text) {
    if (!button) return;

    const old = button.dataset.originalText || button.textContent || "Copy";
    button.dataset.originalText = old;
    button.textContent = text;

    setTimeout(function () {
      button.textContent = old;
    }, 1100);
  }

  function copyHistoryItem(text, button) {
    copyText(text, button);
  }

  function installStyle() {
    if (byId("cleanCalculatorUnifiedStyle")) return;

    const style = document.createElement("style");
    style.id = "cleanCalculatorUnifiedStyle";
    style.textContent = `
      .calculator-report-history-item {
        display: grid !important;
        grid-template-columns: 1fr auto !important;
        gap: 10px !important;
        align-items: center !important;
      }

      .calculator-report-open-link {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 6px 10px !important;
        background: #d3fff9 !important;
        color: var(--black, #000) !important;
        border: 3px solid var(--black, #000) !important;
        box-shadow: 3px 3px 0 var(--black, #000) !important;
        text-decoration: none !important;
        font-weight: bold !important;
        white-space: nowrap !important;
      }

      .calculator-clean-result,
      .loan-external-output {
        width: min(900px, 96vw) !important;
        margin: 24px auto !important;
        display: block !important;
        visibility: visible !important;
      }

      .calculator-report-page {
        width: min(1100px, 96vw) !important;
        margin: 30px auto !important;
        padding: 18px !important;
        background: #fff !important;
        color: var(--black, #000) !important;
        border: 5px solid var(--black, #000) !important;
        box-shadow: 8px 8px 0 var(--black, #000) !important;
        box-sizing: border-box !important;
      }

      .calculator-report-page h1,
      .calculator-report-page h2 {
        text-align: center !important;
      }

      .calculator-report-card {
        margin: 18px 0 !important;
        padding: 14px !important;
        background: #f8f8f8 !important;
        border: 4px solid var(--black, #000) !important;
        box-shadow: 5px 5px 0 var(--black, #000) !important;
      }

      .calculator-report-page table {
        width: 100% !important;
        border-collapse: collapse !important;
      }

      .calculator-report-page th,
      .calculator-report-page td {
        padding: 10px !important;
        border: 3px solid var(--black, #000) !important;
        text-align: left !important;
      }

      .calculator-report-table-scroll,
      .calculator-report-result {
        overflow-x: auto !important;
      }

      .calculator-report-actions {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 14px !important;
        margin-top: 24px !important;
        padding-top: 18px !important;
        border-top: 4px solid var(--black, #000) !important;
      }

      .calculator-report-action-btn {
        min-height: 54px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 10px 14px !important;
        color: var(--black, #000) !important;
        border: 5px solid var(--black, #000) !important;
        box-shadow: 5px 5px 0 var(--black, #000) !important;
        font-family: inherit !important;
        font-size: 18px !important;
        font-weight: bold !important;
        text-align: center !important;
        text-decoration: none !important;
        cursor: pointer !important;
      }

      .calculator-report-back-btn { background: #fff4b8 !important; }
      .calculator-report-copy-btn { background: #ffd3d3 !important; }
      .calculator-report-save-btn { background: #b8ffb8 !important; }
      .calculator-report-share-btn { background: #d3fff9 !important; }

      .calculator-report-summary-boxes,
      .bmi-input-groups,
      .loan-optional-row {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 14px !important;
        margin: 18px 0 22px !important;
      }

      .bmi-input-groups,
      .loan-optional-row {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }

      .calculator-report-summary-card,
      .bmi-measurement-box,
      .bmi-profile-box {
        padding: 16px 12px !important;
        border: 5px solid var(--black, #000) !important;
        box-shadow: 6px 6px 0 var(--black, #000) !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }

      .bmi-measurement-box { background: #d3fff9 !important; }
      .bmi-profile-box { background: #fff4b8 !important; }
      .calculator-report-monthly-card { background: #d3fff9 !important; }
      .calculator-report-interest-card { background: #fff4b8 !important; }
      .calculator-report-total-card { background: #b8ffb8 !important; }
      .calculator-report-summary-label,
      .bmi-extra-title {
        font-weight: bold !important;
        margin-bottom: 8px !important;
      }

      .calculator-report-summary-value {
        font-size: 24px !important;
        font-weight: bold !important;
        overflow-wrap: break-word !important;
      }

      .bmi-input-groups label,
      .bmi-input-groups input,
      .bmi-input-groups select,
      .loan-optional-row label,
      .loan-optional-row input,
      .loan-optional-row select {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
      }

      .loan-optional-row .optional-mortgage-costs,
      .loan-optional-row .early-settlement-box {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }

      body.calculator-report-view #pcHelpQuestionButton,
      body.calculator-report-view #pcQuestionOverlayButton,
      body.calculator-report-view .pc-what-slot,
      body.calculator-report-view .instruction-box,
      body.calculator-report-view .instruction-what-box {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      .age-report-flow {
        display: grid !important;
        gap: 18px !important;
        margin: 4px 0 0 !important;
      }

      .age-report-flow-step {
        position: relative !important;
        display: grid !important;
        grid-template-columns: 58px 1fr !important;
        gap: 14px !important;
        align-items: stretch !important;
      }

      .age-report-flow-step:not(:last-child)::after {
        content: "↓" !important;
        position: absolute !important;
        left: 18px !important;
        bottom: -19px !important;
        width: 36px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 22px !important;
        font-weight: bold !important;
        color: var(--black, #000) !important;
        z-index: 2 !important;
      }

      .age-report-flow-number {
        width: 50px !important;
        height: 50px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #fff4b8 !important;
        border: 5px solid var(--black, #000) !important;
        box-shadow: 4px 4px 0 var(--black, #000) !important;
        font-size: 22px !important;
        font-weight: bold !important;
        box-sizing: border-box !important;
      }

      .age-report-flow-content {
        min-width: 0 !important;
        padding: 14px !important;
        background: #fff !important;
        border: 4px solid var(--black, #000) !important;
        box-shadow: 5px 5px 0 var(--black, #000) !important;
        box-sizing: border-box !important;
      }

      .age-report-flow-content h3 {
        margin: 0 0 6px !important;
        text-align: left !important;
        font-size: 20px !important;
        line-height: 1.2 !important;
      }

      .age-report-flow-content p {
        margin: 0 0 12px !important;
        font-weight: bold !important;
        opacity: 0.85 !important;
      }

      .age-report-flow-table td:first-child {
        width: 34% !important;
        background: #d3fff9 !important;
        font-weight: bold !important;
      }

      .age-report-flow-table td:last-child {
        background: #fff !important;
      }

      @media (max-width: 850px) {
        .calculator-report-history-item,
        .calculator-report-actions,
        .calculator-report-summary-boxes,
        .bmi-input-groups,
        .loan-optional-row {
          grid-template-columns: 1fr !important;
        }

        .calculator-report-open-link,
        .calculator-report-action-btn {
          width: 100% !important;
        }

        .calculator-report-action-btn {
          font-size: 16px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function init() {
    applyPageClass();
    installStyle();

    if (openReportFromHash()) return;

    buildInstructionLayout();
    setupNumberInputs();
    setupKeyboardSupport();
    setupAutoEvents();
    setupScrollButton();

    const type = getPageType();

    if (type === "age") ensureAgeTargetDateInput();
    if (type === "bmi") {
      ensureBMIProfileAndGroups();
      setBMIUnit("si");
    }
    if (type === "loan") ensureMortgageOptionalSections();
    if (type === "basic") showHistory();

    if (isReportType(type)) {
      hideCalculateButtons();
      renderReportHistory(type);
      setTimeout(hideCalculateButtons, 100);
      if (readyToCalculate(type)) {
        setTimeout(scheduleAutoCalculate, 250);
      }
    }
  }

  window.addEventListener("hashchange", function () {
    if (window.location.hash.startsWith("#calc-report=")) {
      openReportFromHash();
      return;
    }

    if (document.body.classList.contains("calculator-report-view")) {
      window.location.href = window.location.href.split("#")[0];
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.add = add;
  window.clearDisplay = clearDisplay;
  window.removeLast = removeLast;
  window.addFunction = addFunction;
  window.addPower = addPower;
  window.closeOpenBrackets = closeOpenBrackets;
  window.calculate = calculate;
  window.showHistory = showHistory;
  window.clearHistory = clearHistory;
  window.copyHistoryItem = copyHistoryItem;
  window.copyText = copyText;
  window.scrollToTop = scrollToTop;
  window.toggleMenu = toggleMenu;
  window.flashButton = flashButton;

  window.calculateAge = calculateAge;
  window.calculateBMI = calculateBMI;
  window.calculateBmi = calculateBMI;
  window.toggleBMIUnit = toggleBMIUnit;
  window.calculateLoan = calculateLoan;
  window.calculatePersonalLoan = calculatePersonalLoan;
  window.calculateDiscount = calculateDiscount;
  window.calculatePercentage = calculatePercentage;
  window.calculateCompound = calculateCompound;
  window.calculateCompoundInterest = calculateCompound;

  window.clearInputHistory = function (type) { clearReports(type || getPageType()); };
  window.clearAgeHistory = function () { clearReports("age"); };
  window.clearBMIHistory = function () { clearReports("bmi"); };
  window.clearLoanHistory = function () { clearReports("loan"); };
  window.clearPersonalLoanHistory = function () { clearReports("personalLoan"); };
  window.clearDiscountHistory = function () { clearReports("discount"); };
  window.clearPercentageHistory = function () { clearReports("percentage"); };
  window.clearCompoundHistory = function () { clearReports("compound"); };
})();

/* =====================================================
   SITE SEARCH: Calculator search bar in top menu
   - Inserts search bar to the right of Info dropdown
   - Searches all calculator pages
===================================================== */
(function () {
  "use strict";

  const CALCULATORS = [
    {
      title: "Basic Calculator",
      label: "basic",
      url: "basic-calculator.html",
      keywords: "basic calculator math arithmetic add subtract multiply divide scientific square root sin cos tan log"
    },
    {
      title: "Age Calculator",
      label: "age",
      url: "age-calculator.html",
      keywords: "age birthday birthdate retirement zodiac chinese zodiac sleep planet legal adult days alive moon cycle"
    },
    {
      title: "BMI Calculator",
      label: "bmi",
      url: "bmi-calculator.html",
      keywords: "bmi body mass index weight height waist health gender age waist to height ratio"
    },
    {
      title: "Mortgage Calculator",
      label: "mortgage",
      url: "mortgage-calculator.html",
      keywords: "mortgage home loan housing loan monthly payment interest property tax insurance early settlement"
    },
    {
      title: "Personal Loan Calculator",
      label: "personal loan",
      url: "personal-loan-calculator.html",
      keywords: "personal loan monthly payment interest borrowing repayment finance"
    },
    {
      title: "Discount Calculator",
      label: "discount",
      url: "discount-calculator.html",
      keywords: "discount sale price savings final price percent off coupon"
    },
    {
      title: "Compound Interest Calculator",
      label: "compound interest",
      url: "compound-interest-calculator.html",
      keywords: "compound interest investment savings future value principal rate frequency finance"
    },
    {
      title: "Percentage Calculator",
      label: "percentage",
      url: "percentage-calculator.html",
      keywords: "percentage percent of number ratio calculate percent value"
    }
  ];

  let activeIndex = -1;
  let currentMatches = [];

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function getScore(item, query) {
    const q = normalize(query);
    if (!q) return 0;

    const label = normalize(item.label);
    const title = normalize(item.title);
    const keywords = normalize(item.keywords);
    const haystack = title + " " + label + " " + keywords;

    if (label === q) return 100;
    if (title === q) return 95;
    if (label.startsWith(q)) return 90;
    if (title.startsWith(q)) return 85;
    if (haystack.includes(q)) return 70;

    const words = q.split(/\s+/).filter(Boolean);
    if (words.length && words.every(function (word) { return haystack.includes(word); })) {
      return 55;
    }

    return 0;
  }

  function findMatches(query) {
    return CALCULATORS
      .map(function (item) {
        return {
          item: item,
          score: getScore(item, query)
        };
      })
      .filter(function (entry) {
        return entry.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score || a.item.title.localeCompare(b.item.title);
      })
      .map(function (entry) {
        return entry.item;
      });
  }

  function goToCalculator(item) {
    if (!item || !item.url) return;
    window.location.href = item.url;
  }

  function closeResults(form) {
    const results = form ? form.querySelector(".site-search-results") : null;
    if (results) {
      results.hidden = true;
      results.innerHTML = "";
    }

    activeIndex = -1;
    currentMatches = [];
  }

  function setActiveResult(form) {
    const buttons = Array.from(form.querySelectorAll(".site-search-result-btn"));

    buttons.forEach(function (button, index) {
      const active = index === activeIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function renderResults(form, query) {
    const results = form.querySelector(".site-search-results");
    if (!results) return;

    currentMatches = findMatches(query);
    activeIndex = currentMatches.length ? 0 : -1;

    if (!normalize(query)) {
      closeResults(form);
      return;
    }

    if (!currentMatches.length) {
      results.hidden = false;
      results.innerHTML = '<li class="site-search-empty">No calculator found</li>';
      return;
    }

    results.hidden = false;
    results.innerHTML = currentMatches
      .slice(0, 8)
      .map(function (item, index) {
        return (
          '<li>' +
            '<button type="button" class="site-search-result-btn" data-search-index="' + index + '" role="option">' +
              item.title +
            '</button>' +
          '</li>'
        );
      })
      .join("");

    setActiveResult(form);
  }

  function buildSearchForm() {
    const form = document.createElement("form");
    form.className = "site-search";
    form.setAttribute("role", "search");
    form.setAttribute("autocomplete", "off");

    form.innerHTML =
      '<label class="site-search-label" for="calculatorSearchInput">Search calculator</label>' +
      '<div class="site-search-inner">' +
        '<input id="calculatorSearchInput" class="site-search-input" type="search" placeholder="search calculator" aria-label="Search calculator" aria-autocomplete="list" aria-controls="calculatorSearchResults">' +
        '<button type="submit" class="site-search-submit" aria-label="Open calculator search result">🔍</button>' +
      '</div>' +
      '<ul id="calculatorSearchResults" class="site-search-results" role="listbox" hidden></ul>';

    return form;
  }

  function setupSearchEvents(form) {
    const input = form.querySelector(".site-search-input");
    const results = form.querySelector(".site-search-results");

    if (!input || !results) return;

    input.addEventListener("keydown", function (event) {
      /* Keep search typing from triggering calculator keyboard shortcuts. */
      event.stopPropagation();
    }, true);

    input.addEventListener("keyup", function (event) {
      event.stopPropagation();
    }, true);

    input.addEventListener("input", function (event) {
      event.stopPropagation();
      renderResults(form, input.value);
    });

    input.addEventListener("focus", function () {
      if (normalize(input.value)) {
        renderResults(form, input.value);
      }
    });

    input.addEventListener("keydown", function (event) {
      if (!currentMatches.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        activeIndex = Math.min(activeIndex + 1, Math.min(currentMatches.length, 8) - 1);
        setActiveResult(form);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        setActiveResult(form);
      }

      if (event.key === "Escape") {
        closeResults(form);
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const matches = currentMatches.length ? currentMatches : findMatches(input.value);
      const selected = matches[activeIndex >= 0 ? activeIndex : 0];

      if (selected) {
        goToCalculator(selected);
      }
    });

    results.addEventListener("click", function (event) {
      const button = event.target.closest(".site-search-result-btn");
      if (!button) return;

      const index = Number(button.dataset.searchIndex);
      const item = currentMatches[index];

      goToCalculator(item);
    });

    document.addEventListener("click", function (event) {
      if (!form.contains(event.target)) {
        closeResults(form);
      }
    });
  }

  function installCalculatorSearch() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    if (navbar.querySelector(".site-search")) return;

    const form = buildSearchForm();
    const infoDropdown = navbar.querySelector(".about-dropdown");

    if (infoDropdown) {
      infoDropdown.insertAdjacentElement("afterend", form);
    } else {
      navbar.appendChild(form);
    }

    setupSearchEvents(form);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installCalculatorSearch);
  } else {
    installCalculatorSearch();
  }
})();

/* =====================================================
   BASIC CALCULATOR: Allow paste/type into answer box
   - Removes readonly from #display
   - Allows pasted numbers/operators/functions safely
   - Prevents double input from global keyboard handler
===================================================== */
(function () {
  "use strict";

  function isBasicPage() {
    return (
      document.body.classList.contains("basic-page") ||
      document.body.dataset.page === "basic" ||
      !!document.getElementById("display") ||
      !!document.querySelector(".basic-grid") ||
      !!document.querySelector(".scientific-grid")
    );
  }

  function getDisplay() {
    return document.getElementById("display");
  }

  function sanitizeExpression(value) {
    return String(value || "")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/π/gi, "Math.PI")
      .replace(/Math\.sqrt\s*\(/gi, "√(")
      .replace(/\bsqrt\s*\(/gi, "√(")
      .replace(/[^0-9+\-*/().,%\sA-Za-z√]/g, "")
      .replace(/\bpi\b/gi, "Math.PI")
      .replace(/\bans\b/gi, function () {
        return String(window.lastAnswer || "0");
      });
  }

  function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);

    input.value = before + text + after;

    const next = start + text.length;
    input.setSelectionRange(next, next);
  }

  function isAllowedTypingKey(event) {
    if (event.ctrlKey || event.metaKey) return true;

    const key = event.key;

    if (
      key === "Backspace" ||
      key === "Delete" ||
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "ArrowUp" ||
      key === "ArrowDown" ||
      key === "Tab" ||
      key === "Home" ||
      key === "End"
    ) {
      return true;
    }

    return /^[0-9+\-*/().,%]$/.test(key);
  }

  function setupBasicDisplayPaste() {
    if (!isBasicPage()) return;

    const display = getDisplay();
    if (!display) return;

    display.removeAttribute("readonly");
    display.readOnly = false;
    display.setAttribute("inputmode", "decimal");
    display.setAttribute("autocomplete", "off");
    display.setAttribute("spellcheck", "false");

    if (display.dataset.pasteReady === "true") return;
    display.dataset.pasteReady = "true";

    display.addEventListener("paste", function (event) {
      event.preventDefault();

      const clipboard = event.clipboardData || window.clipboardData;
      const pasted = clipboard ? clipboard.getData("text") : "";
      const clean = sanitizeExpression(pasted);

      if (clean) {
        insertAtCursor(display, clean);
      }
    });

    display.addEventListener("input", function () {
      const clean = sanitizeExpression(display.value);

      if (display.value !== clean) {
        const end = clean.length;
        display.value = clean;
        display.setSelectionRange(end, end);
      }
    });

    document.addEventListener(
      "keydown",
      function (event) {
        if (document.activeElement !== display) return;

        if (event.key === "Enter" || event.key === "=") {
          event.preventDefault();
          event.stopImmediatePropagation();

          if (typeof window.calculate === "function") {
            window.calculate();
          }

          return;
        }

        if (!isAllowedTypingKey(event)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }

        /*
          Stop the old global keyboard handler from adding the same number twice.
          Do not prevent default, so normal typing/paste/editing still works.
        */
        event.stopImmediatePropagation();
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupBasicDisplayPaste);
  } else {
    setupBasicDisplayPaste();
  }
})();

/* =====================================================
   INDEX: Interactive abacus
   - Click or drag beads to change each rod value
   - Number indicator appears above each rod
===================================================== */
(function () {
  "use strict";

  const ROD_COUNT = 7;
  const TOP_INACTIVE = 38;
  const TOP_ACTIVE = 72;
  const LOWER_ACTIVE_START = 124;
  const LOWER_INACTIVE_START = 162;
  const BEAD_GAP = 28;

  let digits = new Array(ROD_COUNT).fill(0);
  let pointerDown = false;

  function isIndexPage() {
    return (
      document.body.classList.contains("index-page") ||
      document.body.dataset.page === "index" ||
      !!document.getElementById("liveAbacus")
    );
  }

  function formatValue() {
    const raw = digits.join("").replace(/^0+(?=\d)/, "");
    const number = Number(raw || "0");

    if (!Number.isFinite(number)) return raw || "0";

    return number.toLocaleString("en-MY");
  }

  function updateValueText() {
    const text = document.getElementById("liveAbacusValueText");
    if (text) text.textContent = formatValue();
  }

  function setRodDigit(rod, digit) {
    const number = Math.max(0, Math.min(9, Number(digit) || 0));
    const rodIndex = Number(rod.dataset.rodIndex || "0");

    digits[rodIndex] = number;

    const topActive = number >= 5;
    const lowerCount = number % 5;

    const top = rod.querySelector(".abacus-top-bead");
    if (top) {
      top.style.top = (topActive ? TOP_ACTIVE : TOP_INACTIVE) + "px";
      top.classList.toggle("is-active", topActive);
      top.setAttribute("aria-pressed", topActive ? "true" : "false");
    }

    rod.querySelectorAll(".abacus-lower-bead").forEach(function (bead) {
      const index = Number(bead.dataset.index || "0");
      const active = index < lowerCount;

      bead.style.top =
        (active ? LOWER_ACTIVE_START + index * BEAD_GAP : LOWER_INACTIVE_START + index * BEAD_GAP) +
        "px";

      bead.classList.toggle("is-active", active);
      bead.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const digitLabel = rod.querySelector(".abacus-digit");
    if (digitLabel) digitLabel.textContent = String(number);

    const numberLabel = rod.querySelector(".abacus-rod-number");
    if (numberLabel) numberLabel.textContent = String(number);

    updateValueText();
  }

  function rodPlaceLabel(index) {
    const labels = ["M", "100K", "10K", "1K", "100", "10", "1"];
    return labels[index] || "1";
  }

  function buildRod(index) {
    const rod = document.createElement("div");
    rod.className = "abacus-rod";
    rod.dataset.rodIndex = String(index);

    const numberLabel = document.createElement("span");
    numberLabel.className = "abacus-rod-number";
    numberLabel.textContent = "0";
    rod.appendChild(numberLabel);

    const separator = document.createElement("div");
    separator.className = "abacus-separator";
    rod.appendChild(separator);

    const top = document.createElement("button");
    top.type = "button";
    top.className = "abacus-bead abacus-top-bead";
    top.dataset.kind = "top";
    top.setAttribute("aria-label", "Toggle top bead for " + rodPlaceLabel(index));
    rod.appendChild(top);

    for (let i = 0; i < 4; i += 1) {
      const bead = document.createElement("button");
      bead.type = "button";
      bead.className = "abacus-bead abacus-lower-bead";
      bead.dataset.kind = "lower";
      bead.dataset.index = String(i);
      bead.setAttribute("aria-label", "Set lower beads to " + (i + 1) + " for " + rodPlaceLabel(index));
      rod.appendChild(bead);
    }

    const label = document.createElement("span");
    label.className = "abacus-label";
    label.innerHTML = rodPlaceLabel(index) + '<span class="abacus-digit">0</span>';
    rod.appendChild(label);

    setRodDigit(rod, 0);
    return rod;
  }

  function handleBeadAction(bead) {
    const rod = bead.closest(".abacus-rod");
    if (!rod) return;

    const current = digits[Number(rod.dataset.rodIndex || "0")] || 0;
    const hasTop = current >= 5;
    const lower = current % 5;

    if (bead.dataset.kind === "top") {
      setRodDigit(rod, (hasTop ? 0 : 5) + lower);
      return;
    }

    const wanted = Number(bead.dataset.index || "0") + 1;
    const newLower = lower === wanted ? Math.max(0, wanted - 1) : wanted;
    setRodDigit(rod, (hasTop ? 5 : 0) + newLower);
  }

  function buildAbacus() {
    const abacus = document.getElementById("liveAbacus");
    if (!abacus || abacus.dataset.interactiveReady === "true") return;

    abacus.dataset.interactiveReady = "true";
    abacus.innerHTML = "";

    for (let i = 0; i < ROD_COUNT; i += 1) {
      abacus.appendChild(buildRod(i));
    }

    abacus.addEventListener("pointerdown", function (event) {
      const bead = event.target.closest(".abacus-bead");
      if (!bead) return;

      pointerDown = true;
      event.preventDefault();
      handleBeadAction(bead);
    });

    abacus.addEventListener("pointerover", function (event) {
      if (!pointerDown) return;
      const bead = event.target.closest(".abacus-bead");
      if (!bead) return;
      handleBeadAction(bead);
    });

    document.addEventListener("pointerup", function () {
      pointerDown = false;
    });

    abacus.addEventListener("click", function (event) {
      const bead = event.target.closest(".abacus-bead");
      if (!bead) return;
      event.preventDefault();
    });

    const reset = document.getElementById("liveAbacusReset");
    if (reset) {
      reset.addEventListener("click", function () {
        digits = new Array(ROD_COUNT).fill(0);
        document.querySelectorAll("#liveAbacus .abacus-rod").forEach(function (rod) {
          setRodDigit(rod, 0);
        });
      });
    }

    updateValueText();
  }

  function startInteractiveAbacus() {
    if (!isIndexPage()) return;
    buildAbacus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startInteractiveAbacus);
  } else {
    startInteractiveAbacus();
  }
})();


/* =====================================================
   INDEX FINAL: Clean Health/Finance card dropdown flow
   - Goes down first
   - Moves to the side only after screen-height limit
   - Removes empty boxes by building real columns
===================================================== */
(function () {
  "use strict";

  const ROW_HEIGHT = 54;
  const SCREEN_GAP = 18;

  function isIndexPage() {
    return (
      document.body.classList.contains("index-page") ||
      document.body.dataset.page === "index" ||
      /(^|\/)index\.html?$/i.test(window.location.pathname) ||
      !!document.querySelector(".calculator-box .calculator-grid")
    );
  }

  function getLinks(box) {
    return Array.from(box.querySelectorAll("a"));
  }

  function unwrapLinks(box) {
    const links = getLinks(box);
    box.innerHTML = "";
    links.forEach(function (link) {
      link.classList.remove("is-last-in-dropdown-column");
      box.appendChild(link);
    });
    return links;
  }

  function buildColumns(box, links, rowsPerColumn) {
    box.innerHTML = "";

    for (let i = 0; i < links.length; i += rowsPerColumn) {
      const column = document.createElement("div");
      column.className = "index-card-dropdown-column";

      links.slice(i, i + rowsPerColumn).forEach(function (link) {
        column.appendChild(link);
      });

      box.appendChild(column);
    }
  }

  function enhanceOneDropdown(card) {
    const box = card.querySelector(":scope > .group-links");
    if (!box) return;

    const links = unwrapLinks(box);
    if (!links.length) return;

    const rect = card.getBoundingClientRect();
    const availableDown = Math.max(ROW_HEIGHT, window.innerHeight - rect.bottom - SCREEN_GAP);
    const rowsPerColumn = Math.max(1, Math.min(links.length, Math.floor(availableDown / ROW_HEIGHT)));
    const columnCount = Math.ceil(links.length / rowsPerColumn);
    const cardWidth = Math.max(180, Math.round(rect.width + 10));
    const totalWidth = columnCount * cardWidth + Math.max(0, columnCount - 1) * 8;
    const shouldOpenLeft = rect.left + totalWidth > window.innerWidth - SCREEN_GAP;

    box.classList.add("index-card-dropdown-enhanced");
    box.classList.toggle("dropdown-opens-left", shouldOpenLeft);
    box.style.setProperty("--index-card-dropdown-column-width", cardWidth + "px");

    buildColumns(box, links, rowsPerColumn);
  }

  function enhanceIndexDropdowns() {
    if (!isIndexPage()) return;

    document
      .querySelectorAll(".calculator-box .group-card.health-card, .calculator-box .group-card.finance-card")
      .forEach(enhanceOneDropdown);
  }

  function start() {
    enhanceIndexDropdowns();

    window.addEventListener("resize", function () {
      setTimeout(enhanceIndexDropdowns, 80);
    });

    window.addEventListener("scroll", function () {
      setTimeout(enhanceIndexDropdowns, 80);
    }, { passive: true });

    document.addEventListener("mouseenter", function (event) {
      const card = event.target.closest && event.target.closest(".calculator-box .group-card");
      if (card) setTimeout(enhanceIndexDropdowns, 0);
    }, true);

    document.addEventListener("focusin", function (event) {
      const card = event.target.closest && event.target.closest(".calculator-box .group-card");
      if (card) setTimeout(enhanceIndexDropdowns, 0);
    }, true);

    setTimeout(enhanceIndexDropdowns, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

/* =====================================================
   SEARCH BAR: Stop calculator keyboard shortcuts while searching
   - Works for top search and side-menu search
===================================================== */
(function () {
  "use strict";

  function isSearchElement(el) {
    return !!(
      el &&
      el.closest &&
      el.closest(".site-search, .site-search-input, .site-search-results")
    );
  }

  function stopCalculatorKeys(event) {
    if (!isSearchElement(event.target)) return;
    event.stopPropagation();
  }

  function protectSearchBars() {
    document
      .querySelectorAll(".site-search, .site-search-input, .site-search-results")
      .forEach(function (el) {
        if (el.dataset.searchKeyboardProtected === "true") return;
        el.dataset.searchKeyboardProtected = "true";

        ["keydown", "keypress", "keyup"].forEach(function (type) {
          el.addEventListener(type, stopCalculatorKeys, true);
          el.addEventListener(type, stopCalculatorKeys, false);
        });
      });
  }

  function start() {
    protectSearchBars();
    setTimeout(protectSearchBars, 300);
    setTimeout(protectSearchBars, 1000);

    document.addEventListener("focusin", protectSearchBars, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   INDEX: Fix Health/Finance card dropdown links
   - Forces dropdown items to navigate when clicked
   - Keeps ctrl/cmd/middle-click behavior for new tabs
===================================================== */
(function () {
  "use strict";

  function isIndexDropdownLink(target) {
    return target && target.closest && target.closest("body.index-page .calculator-box .group-card .group-links a");
  }

  document.addEventListener(
    "click",
    function (event) {
      const link = isIndexDropdownLink(event.target);
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      /* Allow normal browser new-tab shortcuts. */
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      window.location.href = href;
    },
    true
  );
})();
