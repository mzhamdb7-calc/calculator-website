/*
  Copyright © 2026 Hamdi. All rights reserved.
  Clean shared script rebuilt to avoid duplicate rendering.
  - Basic calculator remains keypad/history based.
  - All other calculator pages auto-calculate and use report-style history.
*/
(function () {
  "use strict";

  const MAX_HISTORY_ITEMS = 50;
  const REPORT_VERSION = "clean_v1";
  const AUTO_DELAY = 220;
  let autoTimer = null;
  let isAutoCalculating = false;

  const PAGE_CLASSES = [
    "basic-page",
    "age-page",
    "bmi-page",
    "loan-page",
    "discount-page",
    "percentage-page",
    "compound-page"
  ];

  const HISTORY_LIST_IDS = {
    age: "ageHistoryList",
    bmi: "bmiHistoryList",
    loan: "loanHistoryList",
    discount: "discountHistoryList",
    percentage: "percentageHistoryList",
    compound: "compoundHistoryList"
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function lower(value) {
    return cleanText(value).toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  }

  function safeRemove(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }

  function safeLoadArray(key) {
    try {
      const value = JSON.parse(safeGet(key, "[]"));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function safeSaveArray(key, value) {
    safeSet(key, JSON.stringify(value.slice(-MAX_HISTORY_ITEMS)));
  }

  function numberValue(id) {
    const input = document.getElementById(id);
    if (!input) return NaN;
    const value = Number(String(input.value || "").replace(/,/g, "").trim());
    return Number.isFinite(value) ? value : NaN;
  }

  function stringValue(id) {
    const input = document.getElementById(id);
    return input ? String(input.value || "").trim() : "";
  }

  function firstInput(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (input) return input;
    }
    return null;
  }

  function firstValue(ids) {
    const input = firstInput(ids);
    return input ? String(input.value || "").trim() : "";
  }

  function firstNumber(ids) {
    for (const id of ids) {
      const value = numberValue(id);
      if (Number.isFinite(value)) return value;
    }
    return NaN;
  }

  function money(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";
    return number.toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function moneyRM(value) {
    const raw = String(value ?? "").replace(/[^\d.-]/g, "");
    if (!raw) return "-";
    const number = Number(raw);
    if (!Number.isFinite(number)) return "-";
    return "RM " + money(number);
  }

  function has(id) {
    return !!document.getElementById(id);
  }

  function pageTitleText() {
    const h1 = document.querySelector("h1");
    return lower(h1 ? h1.textContent : "");
  }

  function currentPath() {
    return lower(window.location.pathname);
  }

  function getPageType() {
    const bodyType = document.body.dataset.page || "";
    const title = pageTitleText();
    const path = currentPath();

    if (bodyType === "basic" || has("display") || $(".basic-grid") || $(".scientific-grid") || title.includes("basic")) return "basic";
    if (bodyType === "age" || has("birthdate") || has("ageResult") || title.includes("age")) return "age";
    if (bodyType === "bmi" || has("bmiResult") || has("bmiHistoryList") || title.includes("bmi")) return "bmi";
    if (bodyType === "loan" || has("loanResult") || has("loanHistoryList") || path.includes("loan-calculator") || path.includes("mortgage") || title.includes("mortgage") || title.includes("loan")) return "loan";
    if (bodyType === "discount" || has("discountResult") || has("discountHistoryList") || title.includes("discount")) return "discount";
    if (bodyType === "percentage" || has("percentageResult") || has("percentageHistoryList") || title.includes("percentage")) return "percentage";
    if (bodyType === "compound" || has("compoundResult") || has("compoundHistoryList") || title.includes("compound")) return "compound";
    return "";
  }

  function isReportType(type) {
    return ["age", "bmi", "loan", "discount", "percentage", "compound"].includes(type);
  }

  function applyPageClass() {
    const type = getPageType();
    if (!type) return;
    PAGE_CLASSES.forEach(function (className) { document.body.classList.remove(className); });
    document.body.classList.add(type + "-page");
    document.body.dataset.page = type;
  }

  function isCalculatorPage() {
    const main = document.querySelector("main");
    if (!main) return false;
    if (document.body.classList.contains("index-page") || document.body.classList.contains("about-page") || document.body.classList.contains("privacy-page") || document.body.classList.contains("contact-page") || document.body.classList.contains("info-page")) return false;
    return !!main.querySelector(".calculator");
  }

  function setButtonState(button, text) {
    if (!button) return;
    const oldText = button.dataset.originalText || button.textContent || "Copy";
    button.dataset.originalText = oldText;
    button.textContent = text;
    setTimeout(function () { button.textContent = oldText; }, 1100);
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = String(text || "");
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(function () {
        setButtonState(button, "Copied!");
      }).catch(function () {
        fallbackCopy(value);
        setButtonState(button, "Copied!");
      });
    } else {
      fallbackCopy(value);
      setButtonState(button, "Copied!");
    }
  }

  /* =====================================================
     Basic calculator
  ===================================================== */

  let calcHistory = safeLoadArray("basicEquationHistory");
  let lastAnswer = Number(safeGet("lastAnswer", "0")) || 0;
  let lastBasicEquation = "";

  function getDisplay() {
    return document.getElementById("display");
  }

  function clearError(display) {
    if (display && display.value === "Error") display.value = "";
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

    if (operators.includes(value) && operators.includes(lastChar) && !(value === "-" && lastChar !== "-")) {
      display.value = display.value.slice(0, -1) + value;
      return;
    }

    display.value += value;
  }

  function clearDisplay() {
    const display = getDisplay();
    if (display) display.value = "";
    renderBasicEqualAnswer();
  }

  function removeLast() {
    const display = getDisplay();
    if (!display) return;
    if (display.value === "Error") display.value = "";
    else display.value = display.value.slice(0, -1);
    renderBasicEqualAnswer();
  }

  function addFunction(func) {
    const display = getDisplay();
    if (!display) return;
    clearError(display);

    const map = {
      sin: "Math.sin(",
      cos: "Math.cos(",
      tan: "Math.tan(",
      log: "Math.log10(",
      ln: "Math.log(",
      sqrt: "Math.sqrt("
    };

    const functionText = map[func];
    if (!functionText) return;

    if (/[0-9.)]$/.test(display.value)) display.value += "*" + functionText;
    else display.value += functionText;
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
    const allowedCharacters = /^[0-9+\-*/().,\sA-Za-z]+$/;
    if (!allowedCharacters.test(expression)) return false;
    const words = expression.match(/[A-Za-z]+/g) || [];
    const allowedWords = new Set(["Math", "sin", "cos", "tan", "log", "log10", "sqrt", "PI", "E"]);
    return words.every(function (word) { return allowedWords.has(word); });
  }

  function addBasicEquationHistory(equation) {
    const value = String(equation || "").trim();
    if (!value || value === "Error") return;
    const last = calcHistory[calcHistory.length - 1];
    if (last !== value) {
      calcHistory.push(value);
      calcHistory = calcHistory.slice(-MAX_HISTORY_ITEMS);
      safeSaveArray("basicEquationHistory", calcHistory);
    }
    showHistory();
  }

  function calculate() {
    const display = getDisplay();
    if (!display) return;

    try {
      let expression = display.value.trim();
      if (!expression || expression === "Error") return;

      expression = expression
        .replace(/(\d)(Math\.sqrt\()/g, "$1*$2")
        .replace(/(\d)(Math\.sin\()/g, "$1*$2")
        .replace(/(\d)(Math\.cos\()/g, "$1*$2")
        .replace(/(\d)(Math\.tan\()/g, "$1*$2")
        .replace(/(\d)(Math\.log10\()/g, "$1*$2")
        .replace(/(\d)(Math\.log\()/g, "$1*$2");

      lastBasicEquation = expression;
      expression = closeOpenBrackets(expression);

      if (!isSafeExpression(expression)) {
        display.value = "Error";
        renderBasicEqualAnswer();
        return;
      }

      const result = Function('"use strict"; return (' + expression + ')')();
      if (typeof result !== "number" || !Number.isFinite(result)) {
        display.value = "Error";
        renderBasicEqualAnswer();
        return;
      }

      const cleanResult = Number.isInteger(result) ? result : Number(result.toPrecision(12));
      display.value = String(cleanResult);
      lastAnswer = cleanResult;
      safeSet("lastAnswer", String(lastAnswer));
      addBasicEquationHistory(lastBasicEquation);
      renderBasicEqualAnswer();
    } catch {
      display.value = "Error";
      renderBasicEqualAnswer();
    }
  }

  function showHistory() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;
    const title = document.querySelector(".history h3");
    if (title) title.textContent = "History";
    calcHistory = safeLoadArray("basicEquationHistory");
    historyList.innerHTML = "";
    calcHistory.slice().reverse().forEach(function (equation) {
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
      historyList.appendChild(li);
    });
  }

  function clearHistory() {
    calcHistory = [];
    safeRemove("basicEquationHistory");
    safeRemove("calcHistory");
    safeRemove("basicInputOutputHistory");
    showHistory();
  }

  function renderBasicEqualAnswer() {
    if (getPageType() !== "basic") return;
    const answer = stringValue("display");
    const main = document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return;

    let panel = document.getElementById("universalLoanStyleOutput");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "universalLoanStyleOutput";
      panel.className = "loan-style-output-panel basic-equal-output-panel";
      panel.setAttribute("aria-label", "Basic calculator result");
      panel.innerHTML = '<div class="loan-output-top"><div class="loan-result-panel"><h2 class="loan-panel-title">Result</h2><div class="loan-result-body"></div></div><div class="loan-copy-side"><button type="button" class="loan-copy-btn">Copy</button></div></div>';
      calculator.insertAdjacentElement("afterend", panel);
    }

    if (!answer || answer === "Error") {
      panel.hidden = true;
      return;
    }

    const body = panel.querySelector(".loan-result-body");
    const copyBtn = panel.querySelector(".loan-copy-btn");
    if (body) {
      body.innerHTML = '<div class="basic-equal-result"><span class="basic-equal-symbol">=</span><span class="basic-equal-answer">' + escapeHtml(answer) + '</span></div>';
    }
    if (copyBtn) {
      copyBtn.onclick = function () { copyText(answer, copyBtn); };
    }
    panel.hidden = false;
  }

  function copyHistoryItem(text, button) {
    copyText(text, button);
  }

  function flashButton(buttonText) {
    const wanted = String(buttonText).trim().toUpperCase();
    const aliases = { "-": ["-", "−"], "*": ["*", "×", "X"], "/": ["/", "÷"], "ANS": ["ANS", "Ans"] };
    const allowedTexts = aliases[wanted] || [wanted];
    $$(".buttons button, .ans-btn").forEach(function (button) {
      const actual = button.textContent.trim().toUpperCase();
      if (allowedTexts.map(function (item) { return item.toUpperCase(); }).includes(actual)) {
        button.classList.add("keyboard-active");
        setTimeout(function () { button.classList.remove("keyboard-active"); }, 150);
      }
    });
  }

  function setupKeyboardSupport() {
    document.addEventListener("keydown", function (event) {
      if (getPageType() !== "basic") return;
      const display = getDisplay();
      if (!display) return;
      const key = event.key;
      const lowerKey = key.toLowerCase();

      if (/^[0-9]$/.test(key)) { add(key); flashButton(key); return; }
      if (key === ".") { add("."); flashButton("."); return; }
      if (["+", "-"].includes(key)) { add(key); flashButton(key); return; }
      if (key === "*" || lowerKey === "x") { add("*"); flashButton("*"); return; }
      if (key === "/") { event.preventDefault(); add("/"); flashButton("/"); return; }
      if (key === "Enter" || key === "=") { event.preventDefault(); calculate(); flashButton("="); return; }
      if (key === "Backspace") { event.preventDefault(); removeLast(); flashButton("←"); return; }
      if (key === "Delete" || key === "Escape") { event.preventDefault(); clearDisplay(); flashButton("AC"); return; }
      if (key === "^") { addPower(); flashButton("xʸ"); return; }
      if (lowerKey === "r") { addFunction("sqrt"); flashButton("√"); return; }
      if (lowerKey === "a") { add("Ans"); flashButton("ANS"); }
    });
  }

  /* =====================================================
     Shared result panels and reports
  ===================================================== */

  function getMainAndCalculator() {
    const main = document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
    const calculator = main ? main.querySelector(".calculator") : null;
    return { main: main, calculator: calculator };
  }

  function getReportKey(type) {
    return "calculatorReportHistory_" + type + "_" + REPORT_VERSION;
  }

  function loadReports(type) {
    return safeLoadArray(getReportKey(type));
  }

  function saveReports(type, reports) {
    safeSaveArray(getReportKey(type), reports);
  }

  function clearReports(type) {
    if (!isReportType(type)) return;
    safeRemove(getReportKey(type));
    ["inputHistory_" + type, type + "History", type + "InputHistory", type + "InputOutputHistory"].forEach(safeRemove);
    renderReportHistory(type);
    const panel = getOutputPanel(type, false);
    if (panel) panel.hidden = true;
  }

  function getHistoryList(type) {
    return document.getElementById(HISTORY_LIST_IDS[type] || "");
  }

  function getOutputPanel(type, create) {
    const parts = getMainAndCalculator();
    if (!parts.calculator) return null;

    const id = type === "loan" ? "loanExternalOutput" : "universalLoanStyleOutput";
    let panel = document.getElementById(id);

    if (!panel && create) {
      panel = document.createElement("section");
      panel.id = id;
      panel.className = type === "loan" ? "loan-external-output" : "loan-style-output-panel";
      panel.setAttribute("aria-label", "Calculator result table");
      parts.calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function makeTable(rows) {
    return '<div class="loan-result-table-scroll"><table class="loan-result-table universal-loan-result-table"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>' + rows.map(function (row) {
      return "<tr><td>" + escapeHtml(row[0]) + "</td><td>" + escapeHtml(row[1]) + "</td></tr>";
    }).join("") + "</tbody></table></div>";
  }

  function copyTable(table, button) {
    if (!table) return;
    const text = Array.from(table.querySelectorAll("tr")).map(function (row) {
      return Array.from(row.querySelectorAll("th, td")).map(function (cell) {
        return cleanText(cell.textContent);
      }).join("\t");
    }).join("\n");
    copyText(text, button);
  }

  function renderStandardResult(type, rows) {
    const panel = getOutputPanel(type, true);
    if (!panel) return null;

    panel.classList.add("calculator-clean-result", type + "-clean-result");
    panel.innerHTML = '<div class="loan-output-top"><div class="loan-result-panel"><h2 class="loan-panel-title">Result</h2><div class="loan-result-body">' + makeTable(rows) + '</div></div><div class="loan-copy-side"><button type="button" class="loan-copy-btn">Copy</button></div></div>';
    panel.hidden = false;

    const copyBtn = panel.querySelector(".loan-copy-btn");
    if (copyBtn) copyBtn.onclick = function () { copyTable(panel.querySelector("table"), copyBtn); };

    ["#result", "#ageResult", "#bmiResult", "#discountResult", "#percentageResult", "#compoundResult"].forEach(function (selector) {
      const old = document.querySelector(selector);
      if (old) old.style.display = "none";
    });

    return panel;
  }

  function getInputLabel(input) {
    if (!input) return "Input";
    if (input.id) {
      const label = document.querySelector('label[for="' + input.id + '"]');
      if (label) return cleanText(label.textContent.replace(/[:：]/g, ""));
    }
    const previous = input.previousElementSibling;
    if (previous && previous.tagName && previous.tagName.toLowerCase() === "label") return cleanText(previous.textContent.replace(/[:：]/g, ""));
    return cleanText(input.getAttribute("aria-label") || input.placeholder || input.name || input.id || "Input");
  }

  function getInputDisplayValue(input) {
    if (!input) return "";
    if (input.tagName && input.tagName.toLowerCase() === "select") {
      const option = input.options[input.selectedIndex];
      return cleanText(option ? option.textContent : input.value);
    }
    return cleanText(input.value);
  }

  function getFilledInputs(type) {
    const used = new Set();
    const lines = [];

    function addInput(input) {
      if (!input) return;
      if (["hidden", "button", "submit", "reset"].includes(input.type)) return;
      if (input.id === "display") return;
      const key = input.id || input.name || getInputLabel(input);
      if (used.has(key)) return;
      used.add(key);
      const value = getInputDisplayValue(input);
      if (value) lines.push({ label: getInputLabel(input), value: value });
    }

    if (type === "loan") {
      [firstInput(["amount", "loanAmount", "principal", "loanPrincipal"]), firstInput(["interest", "loanRate", "interestRate", "annualRate", "rate"]), firstInput(["years", "loanYears", "loanTerm", "term"]), firstInput(["propertyTaxYearly"]), firstInput(["homeInsuranceYearly"]), firstInput(["otherMonthlyFees"]), firstInput(["earlySettlementMonth"]), firstInput(["extraMonthlyPayment"])].forEach(addInput);
    }

    $$(".calculator input, .calculator select, .calculator textarea, .optional-mortgage-costs input, .optional-mortgage-costs select, .early-settlement-box input, .early-settlement-box select").forEach(addInput);
    return lines;
  }

  function resultPanelHtml(type) {
    const panel = getOutputPanel(type, false);
    if (!panel || panel.hidden) return "";
    const clone = panel.cloneNode(true);
    clone.querySelectorAll("script, iframe, object, embed, link, meta, button, .loan-copy-side, .loan-graph-copy-side, .calculator-report-actions").forEach(function (el) { el.remove(); });
    return clone.innerHTML || clone.outerHTML || "";
  }

  function resultPanelText(type) {
    const panel = getOutputPanel(type, false);
    if (!panel || panel.hidden) return "";
    return cleanText(panel.innerText || panel.textContent || "");
  }

  function shortLabel(type, report) {
    const lines = report.inputLines || [];
    function find(pattern) {
      const line = lines.find(function (item) { return pattern.test(item.label || ""); });
      return line ? line.value : "";
    }

    if (type === "age") return "Birthdate: " + (find(/birth/i) || "-");
    if (type === "bmi") return "BMI: " + (report.metrics && report.metrics.bmi ? report.metrics.bmi : "report");
    if (type === "loan") return "Loan amount: " + moneyRM(find(/loan amount|purchase price|amount/i));
    if (type === "discount") return "Price: " + moneyRM(find(/price|amount/i));
    if (type === "percentage") return (find(/percentage|percent/i) || "-") + "% of " + (find(/number|amount|value/i) || "-");
    if (type === "compound") return "Principal: " + moneyRM(find(/principal|amount/i));
    return "Report";
  }

  function reportSignature(report) {
    return JSON.stringify({ type: report.type, inputs: report.inputLines, result: report.resultText });
  }

  function saveCurrentReport(type, metrics) {
    if (!isReportType(type)) return;
    const resultHtml = resultPanelHtml(type);
    const resultText = resultPanelText(type);
    if (!resultHtml || !resultText) return;

    const report = {
      type: type,
      id: type + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      createdAt: new Date().toLocaleString(),
      inputLines: getFilledInputs(type),
      resultHtml: resultHtml,
      resultText: resultText,
      metrics: metrics || {}
    };
    report.label = shortLabel(type, report);

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
    bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeBase64Url(text) {
    const normal = String(text || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normal + "===".slice((normal.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function reportHref(report) {
    return window.location.href.split("#")[0] + "#calc-report=" + encodeBase64Url(JSON.stringify(report));
  }

  function renderReportHistory(type) {
    if (!isReportType(type)) return;
    const list = getHistoryList(type);
    if (!list) return;
    const box = list.closest(".history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box");
    const title = box ? box.querySelector("h3") : null;
    if (title) title.textContent = "History";
    list.innerHTML = "";
    loadReports(type).slice().reverse().forEach(function (report) {
      const li = document.createElement("li");
      li.className = "history-item calculator-report-history-item";
      const label = document.createElement("span");
      label.className = "history-text calculator-report-history-label";
      label.textContent = report.label || shortLabel(type, report);
      const link = document.createElement("a");
      link.className = "calculator-report-open-link mortgage-fast-open-link";
      link.textContent = "open report";
      link.href = reportHref(report);
      link.target = "_self";
      link.rel = "";
      li.appendChild(label);
      li.appendChild(link);
      list.appendChild(li);
    });
  }

  /* =====================================================
     Date and page calculations
  ===================================================== */

  function todayValueISO() {
    const today = new Date();
    return today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  }

  function formatDateDMY(value) {
    const parts = String(value || "").split("-");
    if (parts.length !== 3) return value || "";
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function ensureAgeTargetDateInput() {
    const birthdateInput = document.getElementById("birthdate");
    if (!birthdateInput) return null;
    let targetInput = document.getElementById("dateToCalculate");
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

  function calculateNormalAgeBetweenDates(birthdateValue, targetDateValue) {
    if (!birthdateValue || !targetDateValue) return "";
    const birth = new Date(birthdateValue + "T00:00:00");
    const target = new Date(targetDateValue + "T00:00:00");
    if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime()) || birth > target) return "";
    let years = target.getFullYear() - birth.getFullYear();
    const birthdayThisYear = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
    if (target < birthdayThisYear) years -= 1;
    return years;
  }

  function calculateAsianAgeBetweenDates(birthdateValue, targetDateValue) {
    if (!birthdateValue || !targetDateValue) return "";
    const birthYear = Number(String(birthdateValue).split("-")[0]);
    const targetYear = Number(String(targetDateValue).split("-")[0]);
    if (!birthYear || !targetYear || birthYear > targetYear) return "";
    return targetYear - birthYear + 1;
  }

  function calculateAge() {
    const birthdate = firstValue(["birthdate", "birthDate", "dob"]);
    const targetInput = ensureAgeTargetDateInput();
    const targetDate = targetInput ? targetInput.value : todayValueISO();
    if (!birthdate) return;
    const normalAge = calculateNormalAgeBetweenDates(birthdate, targetDate);
    const asianAge = calculateAsianAgeBetweenDates(birthdate, targetDate);
    if (normalAge === "" || asianAge === "") return;
    const rows = [
      ["Date range", formatDateDMY(birthdate) + " to " + formatDateDMY(targetDate)],
      ["Normal age", normalAge + " years old"],
      ["Asian age", asianAge + " years old"]
    ];
    renderStandardResult("age", rows);
    saveCurrentReport("age", { normalAge: normalAge, asianAge: asianAge });
  }

  function toggleBMIUnit() {
    const button = document.getElementById("unitToggleBtn");
    const current = button ? (button.dataset.currentUnit || "si") : (document.body.dataset.bmiUnit || "si");
    const next = current === "si" ? "us" : "si";
    document.body.dataset.bmiUnit = next;
    if (button) {
      button.dataset.currentUnit = next;
      button.textContent = next === "si" ? "SI" : "US";
    }
    const weightLabel = document.getElementById("weightLabel");
    const heightLabel = document.getElementById("heightLabel");
    const waistLabel = document.getElementById("waistLabel");
    const weight = document.getElementById("weight");
    const height = document.getElementById("height");
    const waist = document.getElementById("waist");
    if (next === "si") {
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
    scheduleAutoCalculate();
  }

  function calculateBMI() {
    const weight = firstNumber(["weight", "bmiWeight"]);
    const height = firstNumber(["height", "bmiHeight"]);
    const waist = firstNumber(["waist", "bmiWaist"]);
    if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) return;
    const unit = (document.getElementById("unitToggleBtn") ? document.getElementById("unitToggleBtn").dataset.currentUnit : document.body.dataset.bmiUnit) || "si";
    let bmi;
    let heightForRatio;
    if (unit === "us") {
      bmi = 703 * weight / (height * height);
      heightForRatio = height;
    } else {
      const heightM = height / 100;
      bmi = weight / (heightM * heightM);
      heightForRatio = height;
    }
    let category = "Normal";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 25 && bmi < 30) category = "Overweight";
    else if (bmi >= 30) category = "Obese";
    const rows = [["BMI", bmi.toFixed(2)], ["Category", category], ["Unit", unit === "us" ? "US" : "SI"]];
    if (Number.isFinite(waist) && waist > 0) {
      const ratio = waist / heightForRatio;
      rows.push(["Waist-to-height ratio", ratio.toFixed(2)]);
    }
    renderStandardResult("bmi", rows);
    saveCurrentReport("bmi", { bmi: bmi.toFixed(2), category: category });
  }

  function calculateDiscount() {
    const price = firstNumber(["price", "originalPrice", "amount"]);
    const discount = firstNumber(["discount", "discountRate"]);
    if (!Number.isFinite(price) || !Number.isFinite(discount) || price <= 0 || discount < 0 || discount > 100) return;
    const savings = price * discount / 100;
    const finalPrice = price - savings;
    const rows = [["Original price", moneyRM(price)], ["Discount", discount + "%"], ["Savings", moneyRM(savings)], ["Final price", moneyRM(finalPrice)]];
    renderStandardResult("discount", rows);
    saveCurrentReport("discount", { finalPrice: money(finalPrice) });
  }

  function calculatePercentage() {
    const percentage = firstNumber(["percentage", "percent"]);
    const number = firstNumber(["number", "amount", "value"]);
    if (!Number.isFinite(percentage) || !Number.isFinite(number)) return;
    const answer = percentage / 100 * number;
    const rows = [["Percentage", percentage + "%"], ["Number", String(number)], ["Result", money(answer)]];
    renderStandardResult("percentage", rows);
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
    const rows = [["Principal", moneyRM(principal)], ["Annual interest rate", rate + "%"], ["Years", String(years)], ["Compounding frequency", String(frequency)], ["Future value", moneyRM(futureValue)], ["Compound interest", moneyRM(compoundInterest)]];
    renderStandardResult("compound", rows);
    saveCurrentReport("compound", { futureValue: money(futureValue) });
  }

  function calculateLoanPayment(principal, annualRate, months) {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / months;
    return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  }

  function remainingBalance(principal, annualRate, months, paidMonths) {
    const monthlyRate = annualRate / 100 / 12;
    const payment = calculateLoanPayment(principal, annualRate, months);
    if (monthlyRate === 0) return Math.max(0, principal - payment * paidMonths);
    return principal * Math.pow(1 + monthlyRate, paidMonths) - payment * ((Math.pow(1 + monthlyRate, paidMonths) - 1) / monthlyRate);
  }

  function ensureMortgageOptionalSections() {
    if (getPageType() !== "loan") return;
    const calculator = document.querySelector(".calculator");
    if (!calculator) return;

    let row = document.querySelector(".loan-optional-row");
    if (!row) {
      row = document.createElement("div");
      row.className = "loan-optional-row";
      const button = calculator.querySelector(".main-btn") || Array.from(calculator.querySelectorAll("button")).find(function (btn) { return lower(btn.textContent).includes("calculate"); });
      if (button) button.insertAdjacentElement("beforebegin", row);
      else calculator.appendChild(row);
    }

    let optional = document.querySelector(".optional-mortgage-costs");
    if (!optional) {
      optional = document.createElement("div");
      optional.className = "optional-mortgage-costs is-open";
      optional.innerHTML = '<button type="button" class="optional-mortgage-toggle" aria-expanded="true"><span>Optional costs</span><span class="optional-mortgage-arrow">▲</span></button><div class="optional-mortgage-content"><label for="propertyTaxYearly">Property tax per year:</label><input type="number" id="propertyTaxYearly" placeholder="Optional"><label for="homeInsuranceYearly">Home insurance per year:</label><input type="number" id="homeInsuranceYearly" placeholder="Optional"><label for="otherMonthlyFees">Other monthly fees:</label><input type="number" id="otherMonthlyFees" placeholder="Optional"><p class="optional-mortgage-note">Leave empty if not needed.</p></div>';
    }

    let early = document.querySelector(".early-settlement-box");
    if (!early) {
      early = document.createElement("div");
      early.className = "early-settlement-box is-open";
      early.innerHTML = '<button type="button" class="early-settlement-toggle" aria-expanded="true"><span>Optional early settlement</span></button><div class="early-settlement-content"><label for="earlySettlementMonth">Settle after month:</label><input type="number" id="earlySettlementMonth" placeholder="Optional"><label for="extraMonthlyPayment">Extra monthly payment:</label><input type="number" id="extraMonthlyPayment" placeholder="Optional"></div>';
    }

    if (!row.contains(optional)) row.appendChild(optional);
    if (!row.contains(early)) row.appendChild(early);

    [optional.querySelector(".optional-mortgage-toggle"), early.querySelector(".early-settlement-toggle")].forEach(function (button) {
      if (!button || button.dataset.toggleReady === "true") return;
      button.dataset.toggleReady = "true";
      button.addEventListener("click", function (event) {
        event.preventDefault();
        const box = button.closest(".optional-mortgage-costs, .early-settlement-box");
        if (!box) return;
        const open = !box.classList.contains("is-open");
        box.classList.toggle("is-open", open);
        box.classList.toggle("is-closed", !open);
        button.setAttribute("aria-expanded", open ? "true" : "false");
        const arrow = button.querySelector(".optional-mortgage-arrow");
        if (arrow) arrow.textContent = open ? "▲" : "▼";
      });
    });
  }

  function calculateLoan() {
    ensureMortgageOptionalSections();
    const amount = firstNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = firstNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const termMonths = firstNumber(["years", "loanYears", "loanTerm", "term"]);
    if (!Number.isFinite(amount) || !Number.isFinite(annualRate) || !Number.isFinite(termMonths) || amount <= 0 || annualRate < 0 || termMonths <= 0) return;

    const propertyTaxYearly = firstNumber(["propertyTaxYearly"]);
    const insuranceYearly = firstNumber(["homeInsuranceYearly"]);
    const otherMonthly = firstNumber(["otherMonthlyFees", "hoaMonthly"]);
    const earlyMonth = firstNumber(["earlySettlementMonth"]);
    const extraMonthly = firstNumber(["extraMonthlyPayment"]);

    const taxMonthly = Number.isFinite(propertyTaxYearly) ? propertyTaxYearly / 12 : 0;
    const insuranceMonthly = Number.isFinite(insuranceYearly) ? insuranceYearly / 12 : 0;
    const feesMonthly = Number.isFinite(otherMonthly) ? otherMonthly : 0;
    const extras = taxMonthly + insuranceMonthly + feesMonthly;
    const baseMonthly = calculateLoanPayment(amount, annualRate, termMonths);
    const totalMonthly = baseMonthly + extras;
    const totalBasePayment = baseMonthly * termMonths;
    const totalPayment = totalMonthly * termMonths;
    const totalInterest = totalBasePayment - amount;

    const rows = [
      ["Loan amount", moneyRM(amount)],
      ["Annual interest rate", annualRate + "%"],
      ["Loan term", termMonths + " months"],
      ["Monthly payment", moneyRM(baseMonthly)],
      ["Optional monthly costs", moneyRM(extras)],
      ["Total monthly payment", moneyRM(totalMonthly)],
      ["Total interest", moneyRM(totalInterest)],
      ["Total payment", moneyRM(totalPayment)]
    ];

    if (Number.isFinite(earlyMonth) && earlyMonth > 0 && earlyMonth < termMonths) {
      const balance = remainingBalance(amount, annualRate, termMonths, earlyMonth);
      rows.push(["Estimated balance at early settlement", moneyRM(balance)]);
    }

    if (Number.isFinite(extraMonthly) && extraMonthly > 0) {
      rows.push(["Extra monthly payment", moneyRM(extraMonthly)]);
    }

    const panel = getOutputPanel("loan", true);
    if (!panel) return;

    let yearlyRows = "";
    const years = Math.ceil(termMonths / 12);
    for (let year = 1; year <= Math.min(years, 60); year += 1) {
      const monthsAtYear = Math.min(year * 12, termMonths);
      const paidBase = baseMonthly * monthsAtYear;
      const paidTotal = totalMonthly * monthsAtYear;
      const balance = Math.max(0, remainingBalance(amount, annualRate, termMonths, monthsAtYear));
      yearlyRows += "<tr><td>" + year + "</td><td>" + moneyRM(totalMonthly) + "</td><td>" + moneyRM(paidBase - (amount - balance)) + "</td><td>" + moneyRM(paidTotal) + "</td><td>" + moneyRM(balance) + "</td></tr>";
    }

    panel.classList.add("calculator-clean-result", "loan-clean-result");
    panel.innerHTML = '<div class="loan-output-top"><div class="loan-result-panel"><h2 class="loan-panel-title">Result</h2><div class="loan-result-body">' + makeTable(rows) + '</div></div><div class="loan-copy-side"><button type="button" class="loan-copy-btn">Copy</button></div></div><div class="loan-result-panel loan-yearly-panel"><h2 class="loan-panel-title">Payment table</h2><div class="loan-result-table-scroll"><table class="loan-result-table"><thead><tr><th>Year</th><th>Monthly Payment</th><th>Total Interest</th><th>Total Payment</th><th>Balance</th></tr></thead><tbody>' + yearlyRows + '</tbody></table></div></div>';
    panel.hidden = false;
    const result = document.getElementById("loanResult");
    if (result) result.style.display = "none";
    const copyBtn = panel.querySelector(".loan-copy-btn");
    if (copyBtn) copyBtn.onclick = function () { copyTable(panel.querySelector("table"), copyBtn); };
    saveCurrentReport("loan", { monthly: money(totalMonthly), totalInterest: money(totalInterest), totalPayment: money(totalPayment) });
  }

  /* =====================================================
     Instructions
  ===================================================== */

  function pageData(type) {
    const data = {
      basic: {
        what: "It helps you do quick math calculations like addition, subtraction, multiplication, division, powers, and square roots.",
        how: "Enter numbers using the buttons, choose an operator, then press = to get the answer.",
        formula: "The calculator follows normal math order: brackets first, then powers, multiplication/division, then addition/subtraction.",
        example: "8 + 2 × 3 = 14 because multiplication is calculated before addition.",
        references: [["Order of operations", "Purplemath explains the normal order of operations.", "https://www.purplemath.com/modules/orderops.htm"]]
      },
      age: {
        what: "It calculates normal age and Asian age from a selected birth date.",
        how: "Select your birth date. The result updates automatically.",
        formula: "Normal age is based on the difference between the target date and birth date. Asian age uses target year − birth year + 1.",
        example: "If someone was born in 2000 and the target year is 2026, Asian age is 27.",
        references: [["Age calculation", "Microsoft shows age calculation using today’s date and a birth date.", "https://support.microsoft.com/en-us/office/calculate-age-113d599f-5fea-448f-a4c3-268927911b37"]]
      },
      bmi: {
        what: "It calculates Body Mass Index and can also check waist-to-height ratio.",
        how: "Choose SI or US units, enter weight and height, and optionally enter waist size. The result updates automatically.",
        formula: "SI: BMI = weight kg ÷ height m². US: BMI = weight lb ÷ height inch² × 703.",
        example: "70 kg and 170 cm gives BMI = 70 ÷ 1.70² = 24.22.",
        references: [["CDC BMI formula", "CDC lists metric and US customary formulas for calculating BMI.", "https://www.cdc.gov/growth-chart-training/hcp/using-bmi/body-mass-index.html"]]
      },
      loan: {
        what: "It estimates mortgage or personal loan monthly payment, interest, total payment, and remaining balance.",
        how: "Enter loan amount or purchase price, annual interest rate, and loan term in months. The result updates automatically.",
        formula: "Monthly Payment = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where n is the loan term in months.",
        example: "A 300,000 loan at 4% yearly for 360 months gives an estimated monthly payment using the amortization formula.",
        references: [["Loan amortization", "Chase explains fixed-payment amortized loan calculations.", "https://www.chase.com/personal/mortgage/education/financing-a-home/loan-amortization"], ["Mortgage formula", "Investopedia lists the mortgage payment formula using principal, rate, and months.", "https://www.investopedia.com/mortgage-calculator-5084794"]]
      },
      discount: {
        what: "It calculates final price after discount and how much money you save.",
        how: "Enter the original price and discount percentage. The result updates automatically.",
        formula: "Savings = original price × discount ÷ 100. Final price = original price − savings.",
        example: "If price is 100 and discount is 20%, savings = 20 and final price = 80.",
        references: [["Discount calculation", "Calculator.net explains percent-off discount calculation.", "https://www.calculator.net/discount-calculator.html"]]
      },
      percentage: {
        what: "It calculates a percentage of a number.",
        how: "Enter the percentage value and the number. The result updates automatically.",
        formula: "Result = percentage ÷ 100 × number.",
        example: "20% of 150 = 30.",
        references: [["Percentage formula", "CalculatorSoup lists common percentage formulas.", "https://www.calculatorsoup.com/calculators/math/percentage.php"]]
      },
      compound: {
        what: "It estimates how much money can grow when interest is added repeatedly over time.",
        how: "Enter principal amount, annual interest rate, time in years, and compounding frequency. The result updates automatically.",
        formula: "A = P(1 + r/n)ⁿᵗ. Compound Interest = A − P.",
        example: "P = 1000, r = 5%, t = 10 years, n = 12 gives about 1,647.01 future value.",
        references: [["Compound interest formula", "Investopedia lists the compound interest formula as A = P(1 + r/n)^(nt).", "https://www.investopedia.com/articles/investing/020614/learn-simple-and-compound-interest.asp"]]
      }
    };
    return data[type] || null;
  }

  function makeInfoBox(className, title, text) {
    const box = document.createElement("div");
    box.className = className;
    box.innerHTML = "<h3>" + escapeHtml(title) + "</h3><p>" + escapeHtml(text) + "</p>";
    return box;
  }

  function makeReferenceCard(item) {
    const card = document.createElement("div");
    card.className = "reference-card";
    const a = document.createElement("a");
    a.href = item[2];
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Open source";
    card.innerHTML = "<h3>" + escapeHtml(item[0]) + "</h3><p>" + escapeHtml(item[1]) + "</p>";
    card.appendChild(a);
    return card;
  }

  function buildInstructionLayout() {
    const main = document.querySelector("main");
    if (!main || !isCalculatorPage() || main.classList.contains("calculator-box")) return;
    const type = getPageType();
    const data = pageData(type);
    if (!data) return;

    main.classList.add("has-instructions");
    main.querySelectorAll(":scope > .instruction-box, :scope > .pc-what-slot").forEach(function (item) { item.remove(); });

    const instructionBox = document.createElement("aside");
    instructionBox.className = "instruction-box";
    instructionBox.setAttribute("aria-label", "Instructions and references");
    instructionBox.appendChild(makeInfoBox("instruction-section instruction-what-box", "What does this calculator do?", data.what));

    const instructionTitle = document.createElement("h2");
    instructionTitle.className = "instruction-main-title";
    instructionTitle.textContent = "Instructions";
    instructionBox.appendChild(instructionTitle);
    instructionBox.appendChild(makeInfoBox("instruction-section instruction-how-box", "How to use it", data.how));
    instructionBox.appendChild(makeInfoBox("instruction-section instruction-formula-box", "Formula used", data.formula));
    instructionBox.appendChild(makeInfoBox("instruction-section instruction-example-box", "Example calculation", data.example));

    const referenceBox = document.createElement("section");
    referenceBox.className = "reference-box";
    referenceBox.setAttribute("aria-label", "References");
    const referenceTitle = document.createElement("h2");
    referenceTitle.className = "reference-main-title";
    referenceTitle.textContent = "References";
    const referenceScroll = document.createElement("div");
    referenceScroll.className = "reference-scroll";
    data.references.forEach(function (item) { referenceScroll.appendChild(makeReferenceCard(item)); });
    referenceBox.appendChild(referenceTitle);
    referenceBox.appendChild(referenceScroll);
    instructionBox.appendChild(referenceBox);
    main.appendChild(instructionBox);
  }

  /* =====================================================
     Report pages
  ===================================================== */

  function tableRows(lines) {
    return (lines || []).map(function (line) {
      return "<tr><td>" + escapeHtml(line.label) + "</td><td>" + escapeHtml(line.value) + "</td></tr>";
    }).join("");
  }

  function cleanResultHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html || "";
    template.content.querySelectorAll("script, iframe, object, embed, link, meta, button, .loan-copy-side, .loan-graph-copy-side, .calculator-report-actions").forEach(function (el) { el.remove(); });
    template.content.querySelectorAll("*").forEach(function (el) {
      Array.from(el.attributes).forEach(function (attr) {
        const name = attr.name.toLowerCase();
        const value = String(attr.value || "").toLowerCase().trim();
        if (name.startsWith("on") || value.startsWith("javascript:")) el.removeAttribute(attr.name);
      });
    });
    return template.innerHTML;
  }

  function reportPageTitle(type) {
    return ({ age: "Age Report", bmi: "BMI Report", loan: "Mortgage Report", discount: "Discount Report", percentage: "Percentage Report", compound: "Compound Interest Report" })[type] || "Calculator Report";
  }

  function reportText(report) {
    const inputText = (report.inputLines || []).map(function (line) { return line.label + ": " + line.value; }).join("\n");
    return reportPageTitle(report.type) + "\nGenerated: " + (report.createdAt || "") + "\n\nInputs\n" + inputText + "\n\nResult\n" + cleanText(report.resultText || "");
  }

  function mortgageSummaryBoxes(report) {
    if (!report || report.type !== "loan") return "";
    const m = report.metrics || {};
    const monthly = m.monthly ? moneyRM(m.monthly) : "-";
    const interest = m.totalInterest ? moneyRM(m.totalInterest) : "-";
    const total = m.totalPayment ? moneyRM(m.totalPayment) : "-";
    return '<div class="calculator-report-summary-boxes"><div class="calculator-report-summary-card calculator-report-monthly-card"><div>Monthly payment</div><strong>' + escapeHtml(monthly) + '</strong></div><div class="calculator-report-summary-card calculator-report-interest-card"><div>Total interest</div><strong>' + escapeHtml(interest) + '</strong></div><div class="calculator-report-summary-card calculator-report-total-card"><div>Total payment</div><strong>' + escapeHtml(total) + '</strong></div></div>';
  }

  function saveReportFile(report, button) {
    const html = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>" + escapeHtml(reportPageTitle(report.type)) + "</title><style>body{background:#dfeeff;color:#000;font-family:'Comic Sans MS','Comic Neue',cursive,sans-serif;padding:24px}.report{max-width:1100px;margin:0 auto;padding:18px;background:#fff;border:5px solid #000;box-shadow:8px 8px 0 #000}h1,h2{text-align:center}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{padding:10px;border:3px solid #000;text-align:left}</style></head><body><div class=\"report\"><h1>" + escapeHtml(reportPageTitle(report.type)) + "</h1><p><strong>Generated:</strong> " + escapeHtml(report.createdAt || "") + "</p><h2>Inputs</h2><table><tbody>" + tableRows(report.inputLines) + "</tbody></table><h2>Result</h2>" + cleanResultHtml(report.resultHtml || "") + "</div></body></html>";
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date();
    const fileDate = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
    link.href = url;
    link.download = (report.type || "calculator") + "-report-" + fileDate + ".html";
    document.body.appendChild(link);
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); link.remove(); }, 500);
    setButtonState(button, "Saved!");
  }

  function shareReport(report, button) {
    const url = window.location.href;
    const title = reportPageTitle(report.type);
    const text = reportText(report).slice(0, 500);
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function () { copyText(url, button); });
    } else {
      copyText(url, button);
    }
  }

  function goBackToCalculator() {
    const cleanUrl = window.location.href.split("#")[0];
    if (window.history.length > 1) {
      window.history.back();
      setTimeout(function () {
        if (window.location.hash.startsWith("#calc-report=")) window.location.href = cleanUrl;
      }, 300);
    } else {
      window.location.href = cleanUrl;
    }
  }

  function renderReportPage(report) {
    if (!report || !isReportType(report.type)) return;
    PAGE_CLASSES.forEach(function (className) { document.body.classList.remove(className); });
    document.body.classList.add(report.type + "-page", "calculator-report-view", "mortgage-report-clean-view");
    document.body.dataset.page = report.type;
    document.body.classList.remove("pc-help-overlay-open");

    $$(".calculator, .history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box, .instruction-box, .pc-what-slot, .instruction-what-box, #pcHelpQuestionButton, #pcQuestionOverlayButton, #loanExternalOutput, #universalLoanStyleOutput").forEach(function (el) {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
      el.style.setProperty("pointer-events", "none", "important");
    });

    const old = document.getElementById("calculatorUnifiedReportPage");
    if (old) old.remove();

    const section = document.createElement("section");
    section.id = "calculatorUnifiedReportPage";
    section.className = "calculator-unified-report-page mortgage-fast-report-page";
    section.innerHTML =
      "<h1>" + escapeHtml(reportPageTitle(report.type)) + "</h1>" +
      '<p class="calculator-report-date"><strong>Generated:</strong> ' + escapeHtml(report.createdAt || "") + "</p>" +
      mortgageSummaryBoxes(report) +
      '<div class="calculator-report-card"><h2>Inputs</h2><div class="calculator-report-table-scroll"><table><tbody>' + tableRows(report.inputLines) + "</tbody></table></div></div>" +
      '<div class="calculator-report-card"><h2>Result</h2><div class="calculator-report-result">' + cleanResultHtml(report.resultHtml || "") + "</div></div>" +
      '<div class="calculator-report-actions">' +
        '<button type="button" class="calculator-report-action-btn calculator-report-back-btn">Go back</button>' +
        '<button type="button" class="calculator-report-action-btn calculator-report-copy-btn">Copy report</button>' +
        '<button type="button" class="calculator-report-action-btn calculator-report-save-btn">Save report</button>' +
        '<button type="button" class="calculator-report-action-btn calculator-report-share-btn">Share report</button>' +
      "</div>";

    const main = document.querySelector("main") || document.body;
    main.insertAdjacentElement("afterbegin", section);

    const backBtn = section.querySelector(".calculator-report-back-btn");
    const copyBtn = section.querySelector(".calculator-report-copy-btn");
    const saveBtn = section.querySelector(".calculator-report-save-btn");
    const shareBtn = section.querySelector(".calculator-report-share-btn");
    if (backBtn) backBtn.onclick = goBackToCalculator;
    if (copyBtn) copyBtn.onclick = function () { copyText(reportText(report), copyBtn); };
    if (saveBtn) saveBtn.onclick = function () { saveReportFile(report, saveBtn); };
    if (shareBtn) shareBtn.onclick = function () { shareReport(report, shareBtn); };
  }

  function openReportFromHash() {
    if (!window.location.hash.startsWith("#calc-report=")) return false;
    try {
      const encoded = window.location.hash.replace("#calc-report=", "");
      const report = JSON.parse(decodeBase64Url(encoded));
      renderReportPage(report);
      return true;
    } catch (error) {
      console.error("Could not open report", error);
      return false;
    }
  }

  /* =====================================================
     Auto-calculate and UI setup
  ===================================================== */

  function readyToCalculate(type) {
    if (type === "age") return !!firstValue(["birthdate", "birthDate", "dob"]);
    if (type === "bmi") return !!firstValue(["weight", "bmiWeight"]) && !!firstValue(["height", "bmiHeight"]);
    if (type === "loan") return !!firstValue(["amount", "loanAmount", "principal", "loanPrincipal"]) && !!firstValue(["interest", "loanRate", "interestRate", "annualRate", "rate"]) && !!firstValue(["years", "loanYears", "loanTerm", "term"]);
    if (type === "discount") return !!firstValue(["price", "originalPrice", "amount"]) && !!firstValue(["discount", "discountRate"]);
    if (type === "percentage") return !!firstValue(["percentage", "percent"]) && !!firstValue(["number", "amount", "value"]);
    if (type === "compound") return !!firstValue(["principal", "compoundPrincipal", "amount"]) && !!firstValue(["rate", "compoundRate", "interest", "interestRate"]) && !!firstValue(["years", "compoundYears", "time"]);
    return false;
  }

  function calculateByType(type) {
    if (type === "age") calculateAge();
    else if (type === "bmi") calculateBMI();
    else if (type === "loan") calculateLoan();
    else if (type === "discount") calculateDiscount();
    else if (type === "percentage") calculatePercentage();
    else if (type === "compound") calculateCompound();
  }

  function scheduleAutoCalculate() {
    const type = getPageType();
    if (!isReportType(type)) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(function () {
      if (!readyToCalculate(type) || isAutoCalculating) return;
      isAutoCalculating = true;
      try { calculateByType(type); } finally { setTimeout(function () { isAutoCalculating = false; }, 80); }
    }, AUTO_DELAY);
  }

  function isCalculateButton(button) {
    if (!button) return false;
    if (button.closest("#navbar")) return false;
    if (button.closest(".history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box")) return false;
    if (button.closest(".calculator-report-actions")) return false;
    const text = lower(button.textContent);
    const onclick = lower(button.getAttribute("onclick") || "");
    const id = lower(button.id || "");
    if (id === "unittogglebtn") return false;
    if (text.includes("clear") || text.includes("copy") || text.includes("save") || text.includes("share") || text.includes("back") || text.includes("optional") || text.includes("settlement")) return false;
    return text.includes("calculate") || onclick.includes("calculate") || id.includes("calculate");
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
    $$('input[type="number"]').forEach(function (input) {
      input.setAttribute("inputmode", "decimal");
      if (input.dataset.numberOnlyReady === "true") return;
      input.dataset.numberOnlyReady = "true";
      input.addEventListener("keydown", function (event) {
        const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab", "Home", "End"];
        if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey || /^[0-9]$/.test(event.key)) return;
        if (event.key === "." && !input.value.includes(".")) return;
        event.preventDefault();
      });
      input.addEventListener("input", function () {
        let value = input.value.replace(/[^0-9.]/g, "");
        const parts = value.split(".");
        if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
        input.value = value;
      });
    });
  }

  function setupAutoEvents() {
    document.addEventListener("input", function (event) {
      if (!event.target.matches || !event.target.matches("input, select, textarea")) return;
      if (event.target.id === "display") return;
      scheduleAutoCalculate();
    }, true);

    document.addEventListener("change", function (event) {
      if (!event.target.matches || !event.target.matches("input, select, textarea")) return;
      if (event.target.id === "display") return;
      scheduleAutoCalculate();
    }, true);

    document.addEventListener("click", function (event) {
      const link = event.target.closest("a");
      if (link && link.href && link.href.includes("#calc-report=")) {
        link.target = "_self";
        return;
      }
      const clearButton = event.target.closest("button.clear-btn, #clearCompoundHistoryBtn");
      if (clearButton) {
        const type = getPageType();
        if (isReportType(type)) setTimeout(function () { clearReports(type); }, 0);
      }
    }, true);
  }

  function setupScrollButton() {
    const scrollBtn = document.getElementById("scrollTopBtn");
    if (!scrollBtn) return;
    window.addEventListener("scroll", function () {
      scrollBtn.style.display = window.scrollY > 200 ? "flex" : "none";
    }, { passive: true });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleMenu() {
    const navbar = document.getElementById("navbar");
    if (navbar) navbar.classList.toggle("open");
  }

  function installCleanStyle() {
    if (document.getElementById("cleanReportSystemStyle")) return;
    const style = document.createElement("style");
    style.id = "cleanReportSystemStyle";
    style.textContent = `
      .calculator-report-history-item { grid-template-columns: 1fr auto !important; align-items: center !important; }
      .calculator-report-open-link { display:inline-flex !important; align-items:center !important; justify-content:center !important; padding:6px 10px !important; background:#d3fff9 !important; color:var(--black) !important; border:3px solid var(--black) !important; box-shadow:3px 3px 0 var(--black) !important; text-decoration:none !important; font-weight:bold !important; white-space:nowrap !important; }
      .calculator-unified-report-page { width:min(1100px,96vw) !important; margin:30px auto !important; padding:18px !important; background:#fff !important; color:var(--black) !important; border:5px solid var(--black) !important; box-shadow:8px 8px 0 var(--black) !important; box-sizing:border-box !important; }
      .calculator-unified-report-page h1, .calculator-unified-report-page h2 { text-align:center !important; margin-bottom:12px !important; }
      .calculator-report-date { text-align:center !important; margin-bottom:18px !important; }
      .calculator-report-card { margin:18px 0 !important; padding:14px !important; background:#f8f8f8 !important; border:4px solid var(--black) !important; box-shadow:5px 5px 0 var(--black) !important; }
      .calculator-report-table-scroll, .calculator-report-result { overflow-x:auto !important; width:100% !important; }
      .calculator-unified-report-page table { width:100% !important; border-collapse:collapse !important; }
      .calculator-unified-report-page th, .calculator-unified-report-page td { padding:10px !important; border:3px solid var(--black) !important; text-align:left !important; }
      .calculator-report-actions { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:14px !important; margin-top:24px !important; padding-top:18px !important; border-top:4px solid var(--black) !important; }
      .calculator-report-action-btn { min-height:54px !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; padding:10px 14px !important; color:var(--black) !important; border:5px solid var(--black) !important; box-shadow:5px 5px 0 var(--black) !important; font-family:inherit !important; font-size:18px !important; font-weight:bold !important; line-height:1.1 !important; text-align:center !important; text-decoration:none !important; cursor:pointer !important; }
      .calculator-report-action-btn:hover { transform:translate(-3px,-3px) rotate(-1deg) !important; box-shadow:8px 8px 0 var(--black) !important; }
      .calculator-report-back-btn { background:#fff4b8 !important; }
      .calculator-report-copy-btn { background:#ffd3d3 !important; }
      .calculator-report-save-btn { background:#b8ffb8 !important; }
      .calculator-report-share-btn { background:#d3fff9 !important; }
      .calculator-report-summary-boxes { display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:14px !important; margin:20px 0 24px !important; }
      .calculator-report-summary-card { padding:16px 12px !important; border:5px solid var(--black) !important; box-shadow:6px 6px 0 var(--black) !important; text-align:center !important; font-weight:bold !important; }
      .calculator-report-monthly-card { background:#d3fff9 !important; }
      .calculator-report-interest-card { background:#fff4b8 !important; }
      .calculator-report-total-card { background:#b8ffb8 !important; }
      @media (max-width:850px) { .calculator-report-history-item, .calculator-report-actions, .calculator-report-summary-boxes { grid-template-columns:1fr !important; } .calculator-report-open-link, .calculator-report-action-btn { width:100% !important; } }
    `;
    document.head.appendChild(style);
  }

  function init() {
    applyPageClass();
    installCleanStyle();
    if (openReportFromHash()) return;
    buildInstructionLayout();
    setupNumberInputs();
    setupKeyboardSupport();
    setupAutoEvents();
    setupScrollButton();

    const type = getPageType();
    if (type === "age") ensureAgeTargetDateInput();
    if (type === "loan") ensureMortgageOptionalSections();
    if (type === "basic") showHistory();
    if (isReportType(type)) {
      hideCalculateButtons();
      renderReportHistory(type);
      setTimeout(hideCalculateButtons, 150);
      if (readyToCalculate(type)) setTimeout(scheduleAutoCalculate, 250);
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.add = add;
  window.clearDisplay = clearDisplay;
  window.removeLast = removeLast;
  window.addFunction = addFunction;
  window.addPower = addPower;
  window.closeOpenBrackets = closeOpenBrackets;
  window.calculate = calculate;
  window.saveHistory = function (expression) { addBasicEquationHistory(expression); };
  window.showHistory = showHistory;
  window.copyHistoryItem = copyHistoryItem;
  window.copyText = copyText;
  window.clearHistory = clearHistory;
  window.scrollToTop = scrollToTop;
  window.toggleMenu = toggleMenu;
  window.flashButton = flashButton;

  window.calculateAge = calculateAge;
  window.calculateBMI = calculateBMI;
  window.calculateBmi = calculateBMI;
  window.toggleBMIUnit = toggleBMIUnit;
  window.calculateLoan = calculateLoan;
  window.calculateDiscount = calculateDiscount;
  window.calculatePercentage = calculatePercentage;
  window.calculateCompound = calculateCompound;
  window.calculateCompoundInterest = calculateCompound;

  window.clearAgeHistory = function () { clearReports("age"); };
  window.clearBMIHistory = function () { clearReports("bmi"); };
  window.clearBmiHistory = function () { clearReports("bmi"); };
  window.clearLoanHistory = function () { clearReports("loan"); };
  window.clearDiscountHistory = function () { clearReports("discount"); };
  window.clearPercentageHistory = function () { clearReports("percentage"); };
  window.clearCompoundHistory = function () { clearReports("compound"); };
  window.clearInputHistory = clearReports;
})();
