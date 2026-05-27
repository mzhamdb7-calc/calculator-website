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

  function makeAgeResultGroups(rows) {
    rows = Array.isArray(rows) ? rows : [];

    const groups = [
      {
        key: "birth",
        title: "Birth & calendar",
        match: /name|date range|day of week born|born date in islamic|born date in chinese/i
      },
      {
        key: "age",
        title: "Current age",
        match: /exact age|normal age|asian age|age in .* year|days old|seconds old/i
      },
      {
        key: "milestone",
        title: "Birthday & milestones",
        match: /next birthday countdown|next age live countdown|seconds to next age|retirement|legal age|leap year age/i
      },
      {
        key: "life",
        title: "Life summary",
        match: /days spent alive|estimated sleep time|breaths taken|heartbeats lived/i
      },
      {
        key: "zodiac",
        title: "Zodiac",
        match: /western zodiac|chinese zodiac/i
      },
      {
        key: "history",
        title: "Famous birthdays & historical event",
        match: /famous person|famous celebrity|famous sports star|famous historical figure|historical event/i
      },
      {
        key: "space",
        title: "Space & moon",
        match: /age on other planets|moon cycles experienced/i
      }
    ];

    const used = new Set();

    function rowLabel(row) {
      return String((Array.isArray(row) ? row[0] : row.label) || "");
    }

    function rowValue(row) {
      return String((Array.isArray(row) ? row[1] : row.value) || "");
    }

    function makeGroup(group, groupRows) {
      if (!groupRows.length) return "";

      return (
        '<section class="age-result-group-box age-result-group-' + group.key + '">' +
          '<h3>' + escapeHtml(group.title) + '</h3>' +
          '<ul class="age-point-result-list">' +
            groupRows.map(function (row) {
              return (
                '<li>' +
                  '<strong>' + escapeHtml(rowLabel(row)) + ':</strong> ' +
                  '<span>' + escapeHtml(rowValue(row)) + '</span>' +
                '</li>'
              );
            }).join("") +
          '</ul>' +
        '</section>'
      );
    }

    let html = groups.map(function (group) {
      const groupRows = rows.filter(function (row, index) {
        if (!row || used.has(index)) return false;
        if (!group.match.test(rowLabel(row))) return false;
        used.add(index);
        return true;
      });

      return makeGroup(group, groupRows);
    }).join("");

    const otherRows = rows.filter(function (row, index) {
      return row && !used.has(index);
    });

    if (otherRows.length) {
      html += makeGroup({ key: "other", title: "Other details" }, otherRows);
    }

    return '<div class="age-result-group-grid">' + html + '</div>';
  }

  function makePointList(rows) {
    return (
      '<div class="age-point-result-box">' +
        makeAgeResultGroups(rows) +
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

  function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    setTimeout(function () {
      URL.revokeObjectURL(url);
      link.remove();
    }, 500);
  }

  function dateFileStamp() {
    const now = new Date();
    return now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");
  }

  function renderResultPanel(type, rows, extraTopHtml) {
    /*
      Do not recreate live result boxes while a report page is open.
      Age online updates can return after the report opens, which caused
      an extra live Age result box to appear below the report.
    */
    if (document.body.classList.contains("calculator-report-view")) {
      return null;
    }

    const panel = getOrCreateOutputPanel(type);
    if (!panel) return null;

    const isAgeResult = type === "age";
    const isBmiResult = type === "bmi";
    const resultHtml = isAgeResult ? makePointList(rows) : (isBmiResult ? makeBmiResultGroups(rows) : makeTable(rows));

    panel.className = "loan-style-output-panel calculator-clean-result " + type + "-clean-result" + (isAgeResult ? " age-point-output" : "") + (isBmiResult ? " bmi-box-output" : "");

    if (isAgeResult) {
      panel.innerHTML =
        '<div class="loan-output-top age-result-shell">' +
          '<div class="loan-result-panel age-result-main-box">' +
            '<h2 class="loan-panel-title age-result-title">Result</h2>' +
            (extraTopHtml || "") +
            '<div class="loan-result-body age-result-body">' + resultHtml + '</div>' +
            '<div class="age-result-actions">' +
              '<button type="button" class="age-result-action-btn age-copy-btn">Copy</button>' +
              '<button type="button" class="age-result-action-btn age-save-btn">Save</button>' +
              '<button type="button" class="age-result-action-btn age-share-btn">Share</button>' +
              '<button type="button" class="age-result-action-btn age-report-btn">Report</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    } else if (isBmiResult) {
      panel.innerHTML =
        '<div class="loan-output-top bmi-result-shell">' +
          '<div class="loan-result-panel bmi-result-main-box">' +
            '<h2 class="loan-panel-title bmi-result-title">Result</h2>' +
            '<div class="loan-result-body bmi-result-body">' + resultHtml + '</div>' +
            '<div class="bmi-result-actions">' +
              '<button type="button" class="bmi-result-action-btn bmi-copy-btn">Copy</button>' +
              '<button type="button" class="bmi-result-action-btn bmi-save-btn">Save</button>' +
              '<button type="button" class="bmi-result-action-btn bmi-share-btn">Share</button>' +
              '<button type="button" class="bmi-result-action-btn bmi-report-btn">Report</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    } else {
      panel.innerHTML =
        (extraTopHtml || "") +
        '<div class="loan-output-top universal-result-shell">' +
          '<div class="loan-result-panel universal-result-main-box">' +
            '<h2 class="loan-panel-title">Result</h2>' +
            '<div class="loan-result-body">' + resultHtml + '</div>' +
            '<div class="universal-result-actions">' +
              '<button type="button" class="universal-result-action-btn loan-copy-btn">Copy</button>' +
              '<button type="button" class="universal-result-action-btn loan-save-btn">Save</button>' +
              '<button type="button" class="universal-result-action-btn loan-share-btn">Share</button>' +
              '<button type="button" class="universal-result-action-btn loan-report-btn">Report</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    panel.hidden = false;
    panel.style.setProperty("display", "block", "important");
    panel.style.setProperty("visibility", "visible", "important");

    if (isAgeResult) {
      const ageText = rowsToPlainText(rows);
      const copyBtn = panel.querySelector(".age-copy-btn");
      const saveBtn = panel.querySelector(".age-save-btn");
      const shareBtn = panel.querySelector(".age-share-btn");
      const reportBtn = panel.querySelector(".age-report-btn");

      if (copyBtn) {
        copyBtn.onclick = function () {
          copyText(ageText, copyBtn);
        };
      }

      if (saveBtn) {
        saveBtn.onclick = function () {
          downloadTextFile("age-result-" + dateFileStamp() + ".txt", "Age Calculator Result\n\n" + ageText);
          setButtonState(saveBtn, "Saved!");
        };
      }

      if (shareBtn) {
        shareBtn.onclick = function () {
          const shareData = {
            title: "Age Calculator Result",
            text: ageText
          };

          if (navigator.share) {
            navigator.share(shareData).catch(function () {
              copyText(ageText, shareBtn);
            });
          } else {
            copyText(ageText, shareBtn);
          }
        };
      }

      if (reportBtn) {
        reportBtn.onclick = function () {
          openLatestCalculatorReport("age", reportBtn);
        };
      }
    } else if (isBmiResult) {
      const bmiText = rowsToPlainText(rows);
      const copyBtn = panel.querySelector(".bmi-copy-btn");
      const saveBtn = panel.querySelector(".bmi-save-btn");
      const shareBtn = panel.querySelector(".bmi-share-btn");
      const reportBtn = panel.querySelector(".bmi-report-btn");

      if (copyBtn) {
        copyBtn.onclick = function () {
          copyText(bmiText, copyBtn);
        };
      }

      if (saveBtn) {
        saveBtn.onclick = function () {
          downloadTextFile("bmi-result-" + dateFileStamp() + ".txt", "BMI Calculator Result\n\n" + bmiText);
          setButtonState(saveBtn, "Saved!");
        };
      }

      if (shareBtn) {
        shareBtn.onclick = function () {
          const shareData = {
            title: "BMI Calculator Result",
            text: bmiText
          };

          if (navigator.share) {
            navigator.share(shareData).catch(function () {
              copyText(bmiText, shareBtn);
            });
          } else {
            copyText(bmiText, shareBtn);
          }
        };
      }

      if (reportBtn) {
        reportBtn.onclick = function () {
          openLatestCalculatorReport("bmi", reportBtn);
        };
      }
    } else {
      const resultText = rowsToPlainText(rows);
      const copyBtn = panel.querySelector(".loan-copy-btn");
      const saveBtn = panel.querySelector(".loan-save-btn");
      const shareBtn = panel.querySelector(".loan-share-btn");
      const reportBtn = panel.querySelector(".loan-report-btn");

      if (copyBtn) {
        copyBtn.onclick = function () {
          copyTable(panel.querySelector("table"), copyBtn);
        };
      }

      if (saveBtn) {
        saveBtn.onclick = function () {
          downloadTextFile(type + "-result-" + dateFileStamp() + ".txt", resultText);
          setButtonState(saveBtn, "Saved!");
        };
      }

      if (shareBtn) {
        shareBtn.onclick = function () {
          const shareData = {
            title: "Calculator Result",
            text: resultText
          };

          if (navigator.share) {
            navigator.share(shareData).catch(function () {
              copyText(resultText, shareBtn);
            });
          } else {
            copyText(resultText, shareBtn);
          }
        };
      }

      if (reportBtn) {
        reportBtn.onclick = function () {
          openLatestCalculatorReport(type, reportBtn);
        };
      }
    }

    hideNativeResultElements(type);
    return panel;
  }

  function makeBmiResultGroups(rows) {
    rows = Array.isArray(rows) ? rows : [];

    function rowLabel(row) {
      return String((Array.isArray(row) ? row[0] : row.label) || "");
    }

    function rowValue(row) {
      return String((Array.isArray(row) ? row[1] : row.value) || "");
    }

    function findRow(pattern) {
      return rows.find(function (row) {
        return pattern.test(rowLabel(row));
      });
    }

    function makeHighlight(pattern, title, className) {
      const row = findRow(pattern);
      if (!row) return "";

      return (
        '<section class="bmi-highlight-card ' + className + '">' +
          '<div class="bmi-highlight-label">' + escapeHtml(title) + '</div>' +
          '<div class="bmi-highlight-value">' + escapeHtml(rowValue(row)) + '</div>' +
        '</section>'
      );
    }

    function makeHighlightValueOnly(pattern, className) {
      const row = findRow(pattern);
      if (!row) return "";

      return (
        '<section class="bmi-highlight-card bmi-highlight-value-only ' + className + '">' +
          '<div class="bmi-highlight-value">' + escapeHtml(rowValue(row)) + '</div>' +
        '</section>'
      );
    }

    const highlightHtml =
      '<div class="bmi-highlight-grid">' +
        makeHighlight(/^BMI$/i, "BMI", "bmi-highlight-bmi") +
        makeHighlightValueOnly(/^BMI category$/i, "bmi-highlight-category") +
        makeHighlightValueOnly(/^Difference to healthy range$/i, "bmi-highlight-difference") +
      '</div>';

    const highlightPatterns = [/^BMI$/i, /^BMI category$/i, /^Difference to healthy range$/i];
    const groups = [
      {
        key: "health",
        title: "Health overview",
        match: /Healthy weight range|Health risk|Waist-to-height ratio|Waist-to-height status|Neck circumference|Wrist size|Shoulder width|Hip circumference/i
      },
      {
        key: "calorie",
        title: "Calories & body fat",
        match: /Calories\/day|Body fat estimate|Body type comment|Frame size|Fat distribution|Body shape|Somatotype tendency|Suggested exercise|Suggested foods|Physique \/ body type/i
      },
      {
        key: "goal",
        title: "Goal timeline",
        match: /Goal timeline|Healthy\?|Best|Target weight|Time goal/i
      },
      {
        key: "profile",
        title: "Profile used",
        match: /Unit|Name|Age range|Gender|Activity level/i
      }
    ];

    const used = new Set();

    function makeGroup(group, groupRows) {
      if (!groupRows.length) return "";

      return (
        '<section class="bmi-result-group-box bmi-result-group-' + group.key + '">' +
          '<h3>' + escapeHtml(group.title) + '</h3>' +
          '<ul class="bmi-point-result-list">' +
            groupRows.map(function (row) {
              return (
                '<li>' +
                  '<strong>' + escapeHtml(rowLabel(row)) + ':</strong> ' +
                  '<span>' + escapeHtml(rowValue(row)) + '</span>' +
                '</li>'
              );
            }).join("") +
          '</ul>' +
        '</section>'
      );
    }

    const groupHtml = groups.map(function (group) {
      const groupRows = rows.filter(function (row, index) {
        if (!row || used.has(index)) return false;
        if (highlightPatterns.some(function (pattern) { return pattern.test(rowLabel(row)); })) return false;
        if (!group.match.test(rowLabel(row))) return false;
        used.add(index);
        return true;
      });

      return makeGroup(group, groupRows);
    }).join("");

    const otherRows = rows.filter(function (row, index) {
      if (!row || used.has(index)) return false;
      return !highlightPatterns.some(function (pattern) { return pattern.test(rowLabel(row)); });
    });

    const otherHtml = otherRows.length ? makeGroup({ key: "other", title: "Other details" }, otherRows) : "";

    return '<div class="bmi-result-box">' + highlightHtml + '<div class="bmi-result-group-grid">' + groupHtml + otherHtml + '</div></div>';
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

    if (last && JSON.stringify(last.inputLines || []) === JSON.stringify(report.inputLines || [])) {
      reports[reports.length - 1] = report;
      saveReports(type, reports);
      renderReportHistory(type);
      return;
    }

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

  function ensureAgeNameInput() {
    const birthdateInput = byId("birthdate");
    if (!birthdateInput || byId("ageName")) return;

    const label = document.createElement("label");
    label.setAttribute("for", "ageName");
    label.textContent = "Name (optional):";

    const input = document.createElement("input");
    input.type = "text";
    input.id = "ageName";
    input.placeholder = "Optional";
    input.setAttribute("autocomplete", "name");

    birthdateInput.insertAdjacentElement("beforebegin", input);
    input.insertAdjacentElement("beforebegin", label);
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

  function formatLargeNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) return "-";

    return Math.round(number).toLocaleString("en-US");
  }

  function totalSecondsBetween(startDate, endDate) {
    if (!startDate || !endDate || endDate < startDate) return 0;
    return Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  }

  function estimatedBreathsText(totalSeconds) {
    const breaths = totalSeconds / 60 * 16;
    return formatLargeNumber(breaths) + " breaths (estimated 16 breaths/minute)";
  }

  function estimatedHeartbeatsText(totalSeconds) {
    const beats = totalSeconds / 60 * 70;
    return formatLargeNumber(beats) + " heartbeats (estimated 70 bpm)";
  }

  function birthdayForYear(birthDate, year) {
    let birthday = new Date(
      year,
      birthDate.getMonth(),
      birthDate.getDate(),
      birthDate.getHours(),
      birthDate.getMinutes(),
      birthDate.getSeconds(),
      birthDate.getMilliseconds()
    );

    if (birthDate.getMonth() === 1 && birthDate.getDate() === 29 && !isLeapYear(year)) {
      birthday = new Date(year, 2, 1, birthDate.getHours(), birthDate.getMinutes(), birthDate.getSeconds(), birthDate.getMilliseconds());
    }

    return birthday;
  }

  function nextAgeCountdownData(birthDate) {
    if (!birthDate) return null;

    const now = new Date();
    let upcomingAge = now.getFullYear() - birthDate.getFullYear();
    let next = birthdayForYear(birthDate, birthDate.getFullYear() + upcomingAge);

    if (next <= now) {
      upcomingAge += 1;
      next = birthdayForYear(birthDate, birthDate.getFullYear() + upcomingAge);
    }

    const seconds = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));

    return { upcomingAge, seconds, nextDate: next };
  }

  function ageLiveCountdownHtml(birthdateValue) {
    const safeBirthdate = escapeHtml(String(birthdateValue || ""));

    return (
      '<div class="age-live-countdown" data-birthdate="' + safeBirthdate + '">' +
        '<span class="age-live-countdown-line"><strong data-age-countdown-line>-- second to -- years old</strong></span>' +
      '</div>'
    );
  }

  let ageLiveCountdownTimer = null;

  function updateAgeLiveCountdowns() {
    $$(".age-live-countdown[data-birthdate]").forEach(function (box) {
      const birthdateValue = box.getAttribute("data-birthdate");
      const birthDate = parseDateInput(birthdateValue, false);
      const data = nextAgeCountdownData(birthDate);

      if (!data) return;

      const lineEl = box.querySelector("[data-age-countdown-line]");

      if (lineEl) {
        lineEl.textContent = formatLargeNumber(data.seconds) + " second to " + data.upcomingAge + " years old";
      }
    });
  }

  function startAgeLiveCountdown() {
    updateAgeLiveCountdowns();

    if (ageLiveCountdownTimer) return;

    ageLiveCountdownTimer = setInterval(updateAgeLiveCountdowns, 1000);
  }

  function famousBirthdayFallback(month, day) {
    const key = String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");

    /*
      Famous person priority:
      1) Muslim icons first
      2) Christian icons second
      3) No Hindu / Buddhist / Sikh / Jewish / other-religion fallback names
    */
    const muslimList = {
      "01-01": ["Ibn Khaldun", "Muhammad Ali Jinnah", "Omar Khayyam"],
      "01-08": ["Abd al-Rahman al-Sufi", "Ibn al-Haytham", "Malala Yousafzai"],
      "01-15": ["Nasser al-Din Shah Qajar", "Ibn Battuta", "Al-Farabi"],
      "02-12": ["Nur ad-Din Zengi", "Ibn Sina", "Fatima al-Fihri"],
      "03-14": ["Harun al-Rashid", "Al-Biruni", "Ibn Rushd"],
      "04-15": ["Süleyman the Magnificent", "Mimar Sinan", "Ibn Arabi"],
      "05-05": ["Salahuddin al-Ayyubi", "Muhammad Iqbal", "Al-Khwarizmi"],
      "06-01": ["Abu Bakr al-Siddiq", "Umar ibn al-Khattab", "Uthman ibn Affan"],
      "07-24": ["Mehmed II", "Tipu Sultan", "Al-Ghazali"],
      "08-04": ["Rumi", "Ibn Taymiyyah", "Aisha bint Abi Bakr"],
      "09-04": ["Al-Masudi", "Ibn Hazm", "Averroes"],
      "10-28": ["Shah Waliullah Dehlawi", "Tariq ibn Ziyad", "Abd al-Qadir al-Jazairi"],
      "11-30": ["Anwar Sadat", "Ibn Jubayr", "Ahmad Sirhindi"],
      "12-25": ["Muhammad Ali", "Muhammad Asad", "Al-Idrisi"]
    };

    const christianBackup = {
      "01-01": ["Basil of Caesarea", "Fulgentius of Ruspe", "Zygmunt Gorazdowski"],
      "01-08": ["Lawrence Giustiniani", "Severinus of Noricum", "Apollinaris Claudius"],
      "01-15": ["Arnold Janssen", "Paul of Thebes", "Maurus"],
      "02-12": ["Charles Lwanga", "Benedict Biscop", "Ethelwald of Lindisfarne"],
      "03-14": ["Matilda of Ringelheim", "Pauline of Thuringia", "Leobinus"],
      "04-15": ["Damien of Molokai", "Paternus of Avranches", "Hunna of Alsace"],
      "05-05": ["Augustine of Canterbury", "Nunzio Sulprizio", "Avertinus"],
      "06-01": ["Justin Martyr", "Simeon of Trier", "Wistan"],
      "07-24": ["Christina the Astonishing", "Declan of Ardmore", "Charbel Makhlouf"],
      "08-04": ["John Vianney", "Aristarchus of Thessalonica", "Euphronius of Tours"],
      "09-04": ["Rosalia", "Cuthbert of Lindisfarne", "Marinus"],
      "10-28": ["Simon the Zealot", "Jude the Apostle", "Alfred the Great"],
      "11-30": ["Andrew the Apostle", "Tugdual", "Joseph Marchand"],
      "12-25": ["Anastasia of Sirmium", "Eugenia of Rome", "Peter Nolasco"]
    };

    return muslimList[key] || christianBackup[key] || ["Ibn Sina", "Al-Khwarizmi", "Salahuddin al-Ayyubi"];
  }

  function extractBirthPersonName(item) {
    if (!item) return "";

    if (Array.isArray(item.pages) && item.pages.length) {
      const page = item.pages[0];
      if (page.normalizedtitle) return page.normalizedtitle;
      if (page.title) return String(page.title).replace(/_/g, " ");
    }

    return String(item.text || "").split(",")[0].replace(/^\d+\s*[–-]\s*/, "").trim();
  }

  function famousDescription(item) {
    return String((item && item.text) || "").toLowerCase();
  }

  function pickFamousBirthdayPeople(items) {
    items = Array.isArray(items) ? items : [];

    /*
      Online famous-person filter:
      - Muslim icon terms are checked first.
      - Christian icon terms are checked second.
      - Hindu and other-religion terms are blocked.
      This avoids using broad "famous people" data that may include other religions.
    */
    const blockedReligionPattern = /hindu|hinduism|buddhist|buddhism|sikh|sikhism|jain|jainism|shinto|taoist|taoism|zoroastrian|zoroastrianism|bah[aā]'?i|baha'i|bahai|pagan|polytheist|judaism|jewish|rabbi|kabbalah/i;

    const muslimPattern = /muslim|islam|islamic|caliph|sultan|imam|qadi|sheikh|shaykh|muhaddith|mufassir|faqih|sufi|ottoman|abbasid|umayyad|ayyubid|mamluk|mughal|al-andalus|andalusian|ibn|al-|bint|abu|abd|salahuddin|saladin|khwarizmi|biruni|sina|rushd|ghazali|farabi|khaldun|rumi|iqbal|jinnah|tariq ibn ziyad|fatima al-fihri|malala/i;

    const christianPattern = /christian|christianity|catholic|orthodox|protestant|anglican|lutheran|calvinist|methodist|baptist|pope|saint|st\.|apostle|bishop|priest|pastor|monk|nun|missionary|church|theologian|martyr|reformer|archbishop|cardinal|evangelist/i;

    function isBlocked(item) {
      const desc = famousDescription(item);
      return blockedReligionPattern.test(desc);
    }

    function pickByPattern(pattern, used) {
      const found = items.find(function (item) {
        const name = extractBirthPersonName(item);
        const desc = famousDescription(item);

        if (!name || used.has(name)) return false;
        if (isBlocked(item)) return false;

        return pattern.test(desc);
      });

      if (!found) return "";

      const name = extractBirthPersonName(found);
      used.add(name);
      return name;
    }

    const used = new Set();

    const picked = [
      pickByPattern(muslimPattern, used),
      pickByPattern(muslimPattern, used),
      pickByPattern(muslimPattern, used)
    ];

    for (let i = 0; i < picked.length; i += 1) {
      if (!picked[i]) picked[i] = pickByPattern(christianPattern, used);
    }

    return {
      celebrity: picked[0] || "Not found",
      sports: picked[1] || "Not found",
      historical: picked[2] || "Not found"
    };
  }

  function famousBirthdayRows(month, day) {
    const fallback = famousBirthdayFallback(month, day);

    return [
      ["Famous person", fallback[0]],
      ["Famous person", fallback[1]],
      ["Famous person", fallback[2]]
    ];
  }

  function historicalEventFallback(month, day) {
    const key = String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");

    /*
      Age Calculator historical event now focuses only on Islamic events.
    */
    const list = {
      "01-01": "630 - The Conquest of Makkah occurred around the 8th year after Hijrah, a major event in Islamic history.",
      "01-08": "1198 - Ibn Rushd, a major Muslim philosopher and scholar, died in Marrakesh.",
      "02-10": "1258 - The Siege of Baghdad ended, marking a major turning point in Islamic civilization.",
      "03-03": "1924 - The Ottoman Caliphate was abolished, ending a major institution in modern Islamic history.",
      "03-11": "1917 - British forces entered Baghdad during World War I, affecting the modern Muslim world.",
      "04-02": "1453 - Ottoman Sultan Mehmed II began the final campaign that led to the conquest of Constantinople.",
      "04-29": "711 - Muslim forces entered Iberia, beginning centuries of Islamic rule in Al-Andalus.",
      "05-29": "1453 - Constantinople was conquered by the Ottoman Empire under Sultan Mehmed II.",
      "06-08": "632 - Prophet Muhammad passed away in Madinah according to widely cited historical tradition.",
      "07-02": "1187 - The Battle of Hattin began, leading to Salahuddin's recovery of Jerusalem.",
      "07-04": "1187 - Salahuddin defeated the Crusader army at the Battle of Hattin.",
      "07-15": "1099 - Jerusalem fell to the First Crusade, a major event in Islamic and Crusader history.",
      "09-23": "622 - The Hijrah to Madinah marks the beginning of the Islamic calendar era.",
      "10-02": "1187 - Salahuddin recovered Jerusalem after the Battle of Hattin.",
      "10-29": "1923 - The Republic of Turkey was proclaimed after the Ottoman era.",
      "12-17": "1273 - Jalal al-Din Rumi, the famous Muslim poet and scholar, died in Konya."
    };

    return list[key] || "No matching Islamic historical event found for this date yet.";
  }

  function isRelevantAgeHistoricalEvent(item) {
    const text = String((item && item.text) || "").toLowerCase();
    const year = Number(item && item.year);

    if (!text) return false;

    /*
      Online event filter: Islamic events only.
      Prefer events related to Islam, Muslim civilization, caliphates, sultanates,
      Islamic scholars, major Islamic cities, and major Islamic historical eras.
    */
    return /islam|islamic|muslim|muhammad|prophet|quran|qur'an|caliph|caliphate|umayyad|abbasid|fatimid|ayyubid|mamluk|ottoman|seljuk|sultan|sultanate|emir|emirate|hijra|hijrah|mecca|makkah|medina|madinah|baghdad|damascus|cairo|cordoba|al-andalus|andalus|jerusalem|salahuddin|saladin|rumi|ibn|al-|imam|mosque|kaaba|ka'aba|hajj|ramadan|sharia|madrasa/i.test(text);
  }

  function extractHistoricalEventText(item) {
    if (!item) return "";

    const year = item.year ? String(item.year) + " - " : "";
    const text = String(item.text || "").trim();

    return text ? year + text : "";
  }

  function updateHistoricalEventOnline(month, day, rows, metricsBuilder) {
    if (!window.fetch) return;

    const url = "https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/" + month + "/" + day;

    fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error("Historical event API unavailable");
        return response.json();
      })
      .then(function (data) {
        const events = Array.isArray(data.events) ? data.events : [];
        const focusedEvent = events.find(isRelevantAgeHistoricalEvent);
        const eventText = extractHistoricalEventText(focusedEvent);

        if (!eventText) return;

        rows.forEach(function (row) {
          if (row[0] === "Historical event on this day") row[1] = eventText;
        });

        const metrics = typeof metricsBuilder === "function" ? metricsBuilder(rows) : {
          resultRows: rows.map(function (row) { return { label: row[0], value: row[1] }; })
        };

        renderResultPanel("age", rows, ageLiveCountdownHtml(metrics.birthdate || ""));
        startAgeLiveCountdown();
        saveCurrentReport("age", metrics);
      })
      .catch(function () {
        /* Keep offline fallback event. */
      });
  }

  function updateFamousBirthdayRowsOnline(month, day, rows, metricsBuilder) {
    if (!window.fetch) return;

    const url = "https://en.wikipedia.org/api/rest_v1/feed/onthisday/births/" + month + "/" + day;

    fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error("Birthday API unavailable");
        return response.json();
      })
      .then(function (data) {
        const picked = pickFamousBirthdayPeople(data.births || []);
        const famousPeople = [picked.celebrity, picked.sports, picked.historical].filter(function (name) {
          return name && name !== "Not found";
        });

        let famousIndex = 0;
        rows.forEach(function (row) {
          if (row[0] !== "Famous person") return;
          if (!famousPeople[famousIndex]) return;

          row[1] = famousPeople[famousIndex];
          famousIndex += 1;
        });

        const metrics = typeof metricsBuilder === "function" ? metricsBuilder(rows) : {
          resultRows: rows.map(function (row) { return { label: row[0], value: row[1] }; })
        };

        renderResultPanel("age", rows, ageLiveCountdownHtml(metrics.birthdate || ""));
        startAgeLiveCountdown();
        saveCurrentReport("age", metrics);
      })
      .catch(function () {
        /* Keep offline fallback values. */
      });
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
    ensureAgeNameInput();

    const name = firstValue(["ageName", "name", "personName"]);
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
    const totalAliveSeconds = totalSecondsBetween(birthDate, targetDate);
    const chineseAnimal = chineseZodiac(year);
    const nextAgeData = nextAgeCountdownData(birthDate);
    const secondsToNextAge = nextAgeData ? formatLargeNumber(nextAgeData.seconds) + " second to " + nextAgeData.upcomingAge + " years old" : "-";

    const rows = [
      ["Name", name || "-"],
      ["Date range", formatDateDMY(birthdate) + " to " + formatDateDMY(targetValue)],
      ["Day of week born", weekday],
      ["Born date in Islamic calendar", formatIntlDate(birthDate, "en-GB-u-ca-islamic")],
      ["Born date in Chinese calendar", formatIntlDate(birthDate, "en-GB-u-ca-chinese")],

      ["Exact age", exactText],
      ["Normal age", exact.years + " years old"],
      ["Asian age", asianAge + " years old"],
      ["Age in " + chineseAnimal + " year", String(exact.years)],
      ["Days old", totalAliveDays.toLocaleString()],
      ["Seconds old", formatLargeNumber(totalAliveSeconds)],

      ["Next birthday countdown", nextBirthdayCountdown(birthDate)],
      ["Next age live countdown", secondsToNextAge],
      ["Retirement", countdownToAge(birthDate, targetDate, 60, "retirement")],
      ["Legal age", countdownToAge(birthDate, targetDate, 18, "legal adult age")],
      ["Leap year age", leapBirthdayInfo(birthDate, targetDate)],

      ["Estimated sleep time", estimatedSleepText(totalAliveDays)],
      ["Breaths taken", estimatedBreathsText(totalAliveSeconds)],
      ["Heartbeats lived", estimatedHeartbeatsText(totalAliveSeconds)],
      ["Days spent alive", totalAliveDays.toLocaleString()],

      ["Western zodiac", westernZodiac(month, day)],
      ["Chinese zodiac", chineseAnimal]
    ].concat(famousBirthdayRows(month, day)).concat([
      ["Historical event on this day", historicalEventFallback(month, day)],
      ["Age on other planets", planetAgeText(totalAliveDays)],
      ["Moon cycles experienced", moonCycleText(totalAliveDays)]
    ]);

    function ageMetrics(currentRows) {
      return {
        birthdate: birthdate,
        name: name,
        exactAge: exactText,
        normalAge: exact.years,
        asianAge: asianAge,
        resultRows: currentRows.map(function (row) {
          return {
            label: row[0],
            value: row[1]
          };
        })
      };
    }

    renderResultPanel("age", rows, ageLiveCountdownHtml(birthdate));
    startAgeLiveCountdown();
    saveCurrentReport("age", ageMetrics(rows));
    updateFamousBirthdayRowsOnline(month, day, rows, ageMetrics);
    updateHistoricalEventOnline(month, day, rows, ageMetrics);
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

    function makeLabel(id, forId, text) {
      let label = byId(id);
      if (!label) {
        label = document.createElement("label");
        label.id = id;
      }
      label.setAttribute("for", forId);
      label.textContent = text;
      return label;
    }

    function makeNumberInput(id, placeholder) {
      let input = byId(id);
      if (!input) {
        input = document.createElement("input");
        input.type = "number";
        input.id = id;
        input.placeholder = placeholder;
        input.inputMode = "decimal";
      }
      return input;
    }

    function makeTextInput(id, placeholder) {
      let input = byId(id);
      if (!input) {
        input = document.createElement("input");
        input.type = "text";
        input.id = id;
        input.placeholder = placeholder;
        input.autocomplete = "name";
      }
      return input;
    }

    function makeSelect(id, html, defaultValue) {
      let select = byId(id);
      const previousValue = select ? String(select.value || "") : "";

      if (select && select.tagName && select.tagName.toLowerCase() !== "select") {
        const old = select;
        select = document.createElement("select");
        select.id = id;
        old.replaceWith(select);
      }

      if (!select) {
        select = document.createElement("select");
        select.id = id;
      }

      select.innerHTML = html;

      const values = Array.from(select.options).map(function (option) {
        return option.value;
      });

      if (previousValue && values.includes(previousValue)) {
        select.value = previousValue;
      } else if (defaultValue && values.includes(defaultValue)) {
        select.value = defaultValue;
      }

      return select;
    }

    const nameLabel = makeLabel("bmiNameLabel", "bmiName", "Name:");
    const name = makeTextInput("bmiName", "Optional");

    const ageLabel = makeLabel("bmiAgeLabel", "bmiAge", "Age:");
    const age = makeNumberInput("bmiAge", "Optional, example: 30");

    const genderLabel = makeLabel("bmiGenderLabel", "bmiGender", "Gender:");
    const gender = makeSelect("bmiGender", '<option value="male">Male</option><option value="female">Female</option>', "male");

    const activityLabel = makeLabel("bmiActivityLabel", "bmiActivityLevel", "Activity level:");
    const activity = makeSelect("bmiActivityLevel", '<option value="sedentary">Sedentary</option><option value="light">Light activity</option><option value="moderate">Moderate activity</option><option value="active">Active</option><option value="veryActive">Very active</option>', "moderate");

    const timeGoalLabel = makeLabel("bmiTimeGoalLabel", "bmiTimeGoalAmount", "Time goal:");
    const timeGoalAmount = makeNumberInput("bmiTimeGoalAmount", "Example: 12");
    timeGoalAmount.min = "1";
    timeGoalAmount.step = "1";
    const timeGoal = makeSelect("bmiTimeGoal", '<option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>', "weekly");

    const targetWeightLabel = makeLabel("bmiTargetWeightLabel", "bmiTargetWeight", "Target weight:");
    const targetWeight = makeNumberInput("bmiTargetWeight", "Optional");

    const neckLabel = makeLabel("bmiNeckLabel", "bmiNeck", "Neck circumference:");
    const neck = makeNumberInput("bmiNeck", "Optional");

    const wristLabel = makeLabel("bmiWristLabel", "bmiWrist", "Wrist size:");
    const wrist = makeNumberInput("bmiWrist", "Optional");

    const shoulderLabel = makeLabel("bmiShoulderLabel", "bmiShoulder", "Shoulder width:");
    const shoulder = makeNumberInput("bmiShoulder", "Optional");

    const hipLabel = makeLabel("bmiHipLabel", "bmiHip", "Hip circumference:");
    const hip = makeNumberInput("bmiHip", "Optional");

    [nameLabel, name, ageLabel, age, genderLabel, gender, activityLabel, activity, timeGoalLabel, timeGoalAmount, timeGoal, targetWeightLabel, targetWeight, neckLabel, neck, wristLabel, wrist, shoulderLabel, shoulder, hipLabel, hip].forEach(function (el) {
      if (!el.parentElement) calculator.insertBefore(el, weight);
    });

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

    let bodyBox = $(".bmi-body-box");
    if (!bodyBox) {
      bodyBox = document.createElement("div");
      bodyBox.className = "bmi-body-box bmi-input-group-box";
      bodyBox.innerHTML = '<div class="bmi-extra-title">Body details</div>';
    }

    let goalBox = $(".bmi-goal-box");
    if (!goalBox) {
      goalBox = document.createElement("div");
      goalBox.className = "bmi-goal-box bmi-input-group-box";
      goalBox.innerHTML = '<div class="bmi-extra-title">Activity & goal</div>';
    }

    let optionalBox = $(".bmi-optional-box");
    if (!optionalBox) {
      optionalBox = document.createElement("div");
      optionalBox.className = "bmi-optional-box bmi-input-group-box";
      optionalBox.innerHTML = '<div class="bmi-extra-title">Optional target</div>';
    }

    if (!row.contains(bodyBox)) row.appendChild(bodyBox);
    if (!row.contains(goalBox)) row.appendChild(goalBox);
    if (!row.contains(optionalBox)) row.appendChild(optionalBox);

    ["bmiNameLabel", "bmiName", "heightLabel", "height", "weightLabel", "weight", "bmiAgeLabel", "bmiAge", "bmiGenderLabel", "bmiGender"].forEach(function (id) {
      const element = byId(id);
      if (element) bodyBox.appendChild(element);
    });

    ["bmiActivityLabel", "bmiActivityLevel", "bmiTimeGoalLabel"].forEach(function (id) {
      const element = byId(id);
      if (element) goalBox.appendChild(element);
    });

    let timeGoalWrap = byId("bmiTimeGoalWrapper");
    if (!timeGoalWrap) {
      timeGoalWrap = document.createElement("div");
      timeGoalWrap.id = "bmiTimeGoalWrapper";
      timeGoalWrap.className = "bmi-time-goal-row";
    }

    if (!goalBox.contains(timeGoalWrap)) goalBox.appendChild(timeGoalWrap);
    ["bmiTimeGoalAmount", "bmiTimeGoal"].forEach(function (id) {
      const element = byId(id);
      if (element) timeGoalWrap.appendChild(element);
    });

    ["bmiTargetWeightLabel", "bmiTargetWeight", "waistLabel", "waist", "bmiNeckLabel", "bmiNeck", "bmiWristLabel", "bmiWrist", "bmiShoulderLabel", "bmiShoulder", "bmiHipLabel", "bmiHip"].forEach(function (id) {
      const element = byId(id);
      if (element) optionalBox.appendChild(element);
    });

    ["bmiFrameLabel", ""].forEach(function (id) {
      const element = byId(id);
      if (element) element.remove();
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
    const neckLabel = byId("bmiNeckLabel");
    const wristLabel = byId("bmiWristLabel");
    const shoulderLabel = byId("bmiShoulderLabel");
    const hipLabel = byId("bmiHipLabel");
    const targetWeightLabel = byId("bmiTargetWeightLabel");
    const weight = byId("weight");
    const height = byId("height");
    const waist = byId("waist");
    const neck = byId("bmiNeck");
    const wrist = byId("bmiWrist");
    const shoulder = byId("bmiShoulder");
    const hip = byId("bmiHip");
    const targetWeight = byId("bmiTargetWeight");

    if (normalized === "si") {
      if (weightLabel) weightLabel.textContent = "Weight in kg:";
      if (heightLabel) heightLabel.textContent = "Height in cm:";
      if (waistLabel) waistLabel.textContent = "Waist circumference in cm:";
      if (neckLabel) neckLabel.textContent = "Neck circumference in cm:";
      if (wristLabel) wristLabel.textContent = "Wrist size in cm:";
      if (shoulderLabel) shoulderLabel.textContent = "Shoulder width in cm:";
      if (hipLabel) hipLabel.textContent = "Hip circumference in cm:";
      if (targetWeightLabel) targetWeightLabel.textContent = "Target weight in kg:";
      if (weight) weight.placeholder = "Example: 70";
      if (height) height.placeholder = "Example: 170";
      if (waist) waist.placeholder = "Optional, Example: 80";
      if (neck) neck.placeholder = "Optional, Example: 38";
      if (wrist) wrist.placeholder = "Optional, Example: 16";
      if (shoulder) shoulder.placeholder = "Optional, Example: 46";
      if (hip) hip.placeholder = "Optional, Example: 95";
      if (targetWeight) targetWeight.placeholder = "Optional, Example: 65";
    } else {
      if (weightLabel) weightLabel.textContent = "Weight in lb:";
      if (heightLabel) heightLabel.textContent = "Height in inch:";
      if (waistLabel) waistLabel.textContent = "Waist circumference in inch:";
      if (neckLabel) neckLabel.textContent = "Neck circumference in inch:";
      if (wristLabel) wristLabel.textContent = "Wrist size in inch:";
      if (shoulderLabel) shoulderLabel.textContent = "Shoulder width in inch:";
      if (hipLabel) hipLabel.textContent = "Hip circumference in inch:";
      if (targetWeightLabel) targetWeightLabel.textContent = "Target weight in lb:";
      if (weight) weight.placeholder = "Example: 154";
      if (height) height.placeholder = "Example: 67";
      if (waist) waist.placeholder = "Optional, Example: 32";
      if (neck) neck.placeholder = "Optional, Example: 15";
      if (wrist) wrist.placeholder = "Optional, Example: 6.3";
      if (shoulder) shoulder.placeholder = "Optional, Example: 18";
      if (hip) hip.placeholder = "Optional, Example: 38";
      if (targetWeight) targetWeight.placeholder = "Optional, Example: 143";
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

    const name = firstValue(["bmiName"]);
    const weight = firstNumber(["weight", "bmiWeight"]);
    const height = firstNumber(["height", "bmiHeight"]);
    const waist = firstNumber(["waist", "bmiWaist"]);
    const neck = firstNumber(["bmiNeck"]);
    const wrist = firstNumber(["bmiWrist"]);
    const shoulder = firstNumber(["bmiShoulder"]);
    const hip = firstNumber(["bmiHip"]);
    const age = firstNumber(["bmiAge"]);
    const gender = firstValue(["bmiGender"]) || "male";
    const activity = firstValue(["bmiActivityLevel"]) || "moderate";
    const timeGoalAmount = firstNumber(["bmiTimeGoalAmount"]);
    const timeGoal = firstValue(["bmiTimeGoal"]) || "weekly";
    const targetWeight = firstNumber(["bmiTargetWeight"]);

    if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) return;

    const button = byId("unitToggleBtn");
    const unit = (button ? button.dataset.currentUnit : document.body.dataset.bmiUnit) || "si";
    let bmi;
    let ratio = NaN;
    let weightKg;
    let heightCm;
    let displayUnit;

    if (unit === "us") {
      bmi = 703 * weight / (height * height);
      if (Number.isFinite(waist) && waist > 0) ratio = waist / height;
      weightKg = weight * 0.45359237;
      heightCm = height * 2.54;
      displayUnit = "lb";
    } else {
      const heightM = height / 100;
      bmi = weight / (heightM * heightM);
      if (Number.isFinite(waist) && waist > 0) ratio = waist / height;
      weightKg = weight;
      heightCm = height;
      displayUnit = "kg";
    }

    let category = "Normal";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 25 && bmi < 30) category = "Overweight";
    else if (bmi >= 30) category = "Obese";

    function displayWeightFromKg(kg) {
      const value = unit === "us" ? kg / 0.45359237 : kg;
      return value.toFixed(1) + " " + displayUnit;
    }

    const heightM = heightCm / 100;
    const healthyMinKg = 18.5 * heightM * heightM;
    const healthyMaxKg = 24.9 * heightM * heightM;
    const healthyRange = displayWeightFromKg(healthyMinKg) + " – " + displayWeightFromKg(healthyMaxKg);

    let differenceText = "Inside healthy range";
    if (weightKg < healthyMinKg) {
      differenceText = "Gain about " + displayWeightFromKg(healthyMinKg - weightKg) + " to enter healthy range";
    } else if (weightKg > healthyMaxKg) {
      differenceText = "Lose about " + displayWeightFromKg(weightKg - healthyMaxKg) + " to enter healthy range";
    }

    const activityLabels = {
      sedentary: "Sedentary",
      light: "Light activity",
      moderate: "Moderate activity",
      active: "Active",
      veryActive: "Very active"
    };

    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };

    let caloriesMaintainText = "Enter age to estimate calories/day";
    let caloriesGainText = "Enter age to estimate calories/day";
    let caloriesLossText = "Enter age to estimate calories/day";
    if (Number.isFinite(age) && age > 0) {
      const maleBmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
      const femaleBmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
      let bmr = (maleBmr + femaleBmr) / 2;
      if (gender === "male") bmr = maleBmr;
      if (gender === "female") bmr = femaleBmr;

      const maintenanceCalories = Math.round(bmr * (activityFactors[activity] || activityFactors.moderate));
      const gainCalories = maintenanceCalories + 500;
      const lossCalories = Math.max(1200, maintenanceCalories - 500);

      caloriesMaintainText = maintenanceCalories.toLocaleString("en-US") + " calories/day to maintain weight";
      caloriesGainText = gainCalories.toLocaleString("en-US") + " calories/day to add weight";
      caloriesLossText = lossCalories.toLocaleString("en-US") + " calories/day to lose weight";
    }

    function measurementDisplay(value) {
      if (!Number.isFinite(value) || value <= 0) return "Not provided";
      return value + (unit === "us" ? " inch" : " cm");
    }

    function toCm(value) {
      if (!Number.isFinite(value) || value <= 0) return NaN;
      return unit === "us" ? value * 2.54 : value;
    }

    function frameSizeFromWrist(wristCm, heightCmValue) {
      if (!Number.isFinite(wristCm) || wristCm <= 0) {
        return "Not provided";
      }

      const wristHeightRatio = wristCm / heightCmValue;

      if (gender === "female") {
        if (wristHeightRatio < 0.086) return "Small frame";
        if (wristHeightRatio <= 0.094) return "Medium frame";
        return "Large frame";
      }

      if (wristHeightRatio < 0.095) return "Small frame";
      if (wristHeightRatio <= 0.104) return "Medium frame";
      return "Large frame";
    }

    function fatDistributionText(waistCm, hipCm, ratioValue) {
      const waistHipRatio = Number.isFinite(waistCm) && Number.isFinite(hipCm) && hipCm > 0 ? waistCm / hipCm : NaN;

      if (Number.isFinite(waistHipRatio)) {
        const higherCentral = gender === "male" ? waistHipRatio >= 0.9 : waistHipRatio >= 0.85;
        return (higherCentral ? "Central / abdominal fat pattern" : "Lower central-fat pattern") +
          " (waist-to-hip ratio " + waistHipRatio.toFixed(2) + ")";
      }

      if (Number.isFinite(ratioValue)) {
        return ratioValue >= 0.5 ? "Central-body-fat risk pattern from waist-to-height ratio" : "Lower central-fat pattern from waist-to-height ratio";
      }

      return "Add waist and hip to estimate fat distribution";
    }

    function bodyShapeText(shoulderCm, waistCm, hipCm) {
      if (!Number.isFinite(shoulderCm) || !Number.isFinite(waistCm) || !Number.isFinite(hipCm) || waistCm <= 0 || hipCm <= 0) {
        return "Add shoulder, waist, and hip to estimate body shape";
      }

      if (shoulderCm >= hipCm * 1.08 && waistCm <= shoulderCm * 0.78) return "Inverted triangle / V-shape";
      if (hipCm >= shoulderCm * 1.08 && waistCm <= hipCm * 0.78) return "Pear / lower-body dominant shape";
      if (Math.abs(shoulderCm - hipCm) <= Math.max(4, hipCm * 0.06) && waistCm <= Math.min(shoulderCm, hipCm) * 0.78) return "Hourglass / balanced shape";
      if (waistCm >= Math.min(shoulderCm, hipCm) * 0.9) return "Apple / midsection-dominant shape";
      return "Rectangle / straight balanced shape";
    }

    function somatotypeTendencyText(bmiValue, bodyFatValue, frameSize, shoulderCm, hipCm) {
      const broadShoulders = Number.isFinite(shoulderCm) && Number.isFinite(hipCm) && shoulderCm > hipCm * 1.05;

      if (bmiValue < 18.5 && (frameSize === "Small frame" || frameSize === "Not provided")) return "Ectomorph tendency";
      if (Number.isFinite(bodyFatValue) && bodyFatValue >= (gender === "male" ? 25 : 32)) return "Endomorph tendency";
      if (bmiValue >= 25 && broadShoulders && frameSize !== "Small frame") return "Mesomorph tendency";
      if (frameSize === "Large frame" && broadShoulders) return "Mesomorph tendency";
      if (bmiValue >= 25) return "Endomorph tendency";
      return "Balanced mixed tendency";
    }

    function bodyTypeCommentText(frameSize, shapeText, somatotypeText, bodyFatValue) {
      let base = frameSize !== "Not provided" ? frameSize.replace(" frame", "") + " frame" : "Frame size not fully known";

      if (/ectomorph/i.test(somatotypeText)) base = "Lean frame";
      if (/mesomorph/i.test(somatotypeText)) base = "Athletic / solid frame";
      if (/endomorph/i.test(somatotypeText)) base = "Softer / higher-storage frame";

      if (Number.isFinite(bodyFatValue)) {
        if (bodyFatValue < (gender === "male" ? 14 : 22)) return base + " with lean body-fat estimate";
        if (bodyFatValue >= (gender === "male" ? 25 : 32)) return base + " with higher body-fat estimate";
      }

      if (/central|apple/i.test(shapeText)) return base + " with more midsection focus";
      return base;
    }

    function bodyTypeExerciseSuggestion(somatotypeText, shapeText, fatText, categoryText) {
      const central = /central|abdominal|apple|midsection/i.test(String(fatText) + " " + String(shapeText));

      if (/ectomorph/i.test(somatotypeText)) {
        return "Strength training 3–4 days/week, progressive overload, compound lifts, light cardio, and enough rest for muscle gain.";
      }

      if (/mesomorph/i.test(somatotypeText)) {
        return "Balanced plan: strength training 3 days/week, cardio 2 days/week, mobility work, and sports or circuits for conditioning.";
      }

      if (/endomorph/i.test(somatotypeText) || central || /overweight|obese/i.test(categoryText)) {
        return "Low-impact cardio 3–5 days/week, full-body resistance training 2–3 days/week, daily walking, and core stability work.";
      }

      return "General fitness: full-body strength 2–3 days/week, brisk walking or cycling, stretching, and gradual weekly progression.";
    }

    function bodyTypeFoodSuggestion(somatotypeText, shapeText, fatText, categoryText) {
      const central = /central|abdominal|apple|midsection/i.test(String(fatText) + " " + String(shapeText));

      if (/ectomorph/i.test(somatotypeText)) {
        return "Focus on calorie-dense healthy foods: rice/oats/potatoes, eggs/fish/chicken/tempeh, milk/yogurt, nuts, olive oil, and regular protein meals.";
      }

      if (/mesomorph/i.test(somatotypeText)) {
        return "Use balanced plates: lean protein, rice/potato/whole grains, vegetables, fruit, healthy fats, and limit sugary drinks.";
      }

      if (/endomorph/i.test(somatotypeText) || central || /overweight|obese/i.test(categoryText)) {
        return "Prioritize high-protein and high-fiber meals: fish/chicken/eggs/tofu, vegetables, beans, fruit, water, and reduce fried food, sweets, and sweet drinks.";
      }

      return "Choose simple balanced meals: protein each meal, vegetables, whole carbohydrates, fruit, water, and controlled snack portions.";
    }

    const waistCm = toCm(waist);
    const neckCm = toCm(neck);
    const wristCm = toCm(wrist);
    const shoulderCm = toCm(shoulder);
    const hipCm = toCm(hip);
    const calculatedFrameSize = frameSizeFromWrist(wristCm, heightCm);

    let bodyFatNumber = NaN;
    let bodyFatText = "Enter age and gender to estimate body fat";
    const waistForNavy = unit === "us" ? waist : waist / 2.54;
    const neckForNavy = unit === "us" ? neck : neck / 2.54;
    const heightForNavy = unit === "us" ? height : height / 2.54;

    if (
      Number.isFinite(waistForNavy) &&
      Number.isFinite(neckForNavy) &&
      Number.isFinite(heightForNavy) &&
      waistForNavy > neckForNavy &&
      neckForNavy > 0 &&
      heightForNavy > 0
    ) {
      if (gender === "male") {
        bodyFatNumber = 86.010 * Math.log10(waistForNavy - neckForNavy) - 70.041 * Math.log10(heightForNavy) + 36.76;
        bodyFatText = Math.max(0, bodyFatNumber).toFixed(1) + "% estimated body fat using waist + neck";
      } else {
        bodyFatText = "For female Navy body-fat estimate, hip circumference is normally needed; showing BMI-age estimate instead";
      }
    }

    if (!Number.isFinite(bodyFatNumber) && Number.isFinite(age) && age > 0 && gender) {
      const sexValue = gender === "male" ? 1 : (gender === "female" ? 0 : 0.5);
      bodyFatNumber = 1.2 * bmi + 0.23 * age - 10.8 * sexValue - 5.4;
      bodyFatText = Math.max(0, bodyFatNumber).toFixed(1) + "% estimated body fat";
    }

    const fatDistribution = fatDistributionText(waistCm, hipCm, ratio);
    const bodyShape = bodyShapeText(shoulderCm, waistCm, hipCm);
    const somatotypeTendency = somatotypeTendencyText(bmi, bodyFatNumber, calculatedFrameSize, shoulderCm, hipCm);
    const bodyTypeComment = bodyTypeCommentText(calculatedFrameSize, bodyShape, somatotypeTendency, bodyFatNumber);
    const suggestedExercise = bodyTypeExerciseSuggestion(somatotypeTendency, bodyShape, fatDistribution, category);
    const suggestedFoods = bodyTypeFoodSuggestion(somatotypeTendency, bodyShape, fatDistribution, category);
    const physiqueText = bodyTypeComment;

    const timeGoalLabels = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly"
    };

    function goalUnitText(amount, unitValue) {
      const cleanAmount = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : "";
      if (!cleanAmount) return timeGoalLabels[unitValue] || "Weekly";
      const label = unitValue === "daily" ? "day" : (unitValue === "monthly" ? "month" : "week");
      return cleanAmount + " " + label + (cleanAmount === 1 ? "" : "s");
    }

    function goalWeeksFromInput(amount, unitValue) {
      if (!Number.isFinite(amount) || amount <= 0) return NaN;
      if (unitValue === "daily") return amount / 7;
      if (unitValue === "monthly") return amount * 4.345;
      return amount;
    }

    function weeklyGoalHealthText(perWeekKg, targetKg, diffKg) {
      if (!Number.isFinite(perWeekKg) || perWeekKg <= 0) {
        return "Enter target weight and time goal to check if the weekly change is healthy";
      }

      const weeklyText = displayWeightFromKg(perWeekKg) + " per week";
      const isSafePace = perWeekKg <= 1;
      const targetInHealthyRange = Number.isFinite(targetKg) && targetKg >= healthyMinKg && targetKg <= healthyMaxKg;
      const isReduction = diffKg < 0;

      if (!isSafePace) {
        return weeklyText + " is not healthy";
      }

      if (isReduction && targetInHealthyRange) {
        return weeklyText + " is healthy and the target weight lands in the healthy BMI range";
      }

      if (isReduction && !targetInHealthyRange && Number.isFinite(targetKg) && targetKg > healthyMaxKg) {
        return weeklyText + " is a safe pace, but the target is still above the healthy BMI range";
      }

      if (Number.isFinite(targetKg) && targetKg < healthyMinKg) {
        return weeklyText + " may not be healthy because the target is below the healthy BMI range";
      }

      return weeklyText + " is within a safer pace";
    }

    function bestWeeklyGoalText(diffKg) {
      if (!Number.isFinite(diffKg) || Math.abs(diffKg) < 0.05) {
        return "Already at target weight";
      }

      const action = diffKg < 0 ? "loss" : "gain";

      return (
        "Easy: " + displayWeightFromKg(0.25) + "/week " + action + ", " +
        "Ideal: " + displayWeightFromKg(0.5) + "/week " + action + ", " +
        "Hardest safe: " + displayWeightFromKg(1) + "/week " + action
      );
    }

    let goalTimeline = "Enter target weight and time goal to estimate goal timeline";
    let goalHealthyText = "Enter target weight and time goal to check if it is healthy";
    let goalBestText = "Enter target weight to see easy, ideal, and hardest safe options";

    if (Number.isFinite(targetWeight) && targetWeight > 0) {
      const targetKg = unit === "us" ? targetWeight * 0.45359237 : targetWeight;
      const diffKg = targetKg - weightKg;
      const direction = diffKg < 0 ? "lose" : "gain";
      const diffAbsKg = Math.abs(diffKg);
      const availableWeeks = goalWeeksFromInput(timeGoalAmount, timeGoal);

      goalBestText = bestWeeklyGoalText(diffKg);

      if (diffAbsKg < 0.05) {
        goalTimeline = "Already at target weight";
        goalHealthyText = "Already at target weight";
      } else if (Number.isFinite(availableWeeks) && availableWeeks > 0) {
        const perWeekKg = diffAbsKg / availableWeeks;

        goalTimeline = "To " + direction + " " + displayWeightFromKg(diffAbsKg) + " in " + goalUnitText(timeGoalAmount, timeGoal) + ", aim for about " + displayWeightFromKg(perWeekKg) + " per week.";
        goalHealthyText = weeklyGoalHealthText(perWeekKg, targetKg, diffKg);
      } else {
        const recommendedWeeks = Math.max(1, Math.ceil(diffAbsKg / 0.5));
        const perWeekText = displayWeightFromKg(0.5);

        if (timeGoal === "daily") {
          goalTimeline = "About " + (recommendedWeeks * 7) + " days to " + direction + " " + displayWeightFromKg(diffAbsKg) + " at ~" + perWeekText + "/week.";
        } else if (timeGoal === "monthly") {
          goalTimeline = "About " + Math.max(1, Math.ceil(recommendedWeeks / 4.345)) + " months to " + direction + " " + displayWeightFromKg(diffAbsKg) + " at ~" + perWeekText + "/week.";
        } else {
          goalTimeline = "About " + recommendedWeeks + " weeks to " + direction + " " + displayWeightFromKg(diffAbsKg) + " at ~" + perWeekText + "/week.";
        }

        goalHealthyText = weeklyGoalHealthText(0.5, targetKg, diffKg);
      }
    }

    let waistStatus = "Enter waist to check";
    if (Number.isFinite(ratio)) {
      waistStatus = ratio < 0.5 ? "Healthy" : "Higher risk";
    }

    let healthRisk = "Average risk — use BMI with waist-to-height ratio for a better view";
    if (category === "Normal" && (!Number.isFinite(ratio) || ratio < 0.5)) {
      healthRisk = "Lower risk range";
    }
    if (category === "Underweight") {
      healthRisk = "Possible risks: low energy, nutrient deficiency, weaker immunity, and bone health concerns";
    }
    if (category === "Overweight") {
      healthRisk = "Possible risks: higher blood pressure, insulin resistance, fatty liver, joint strain, and higher cholesterol";
    }
    if (category === "Obese") {
      healthRisk = "Possible risks: type 2 diabetes, high blood pressure, heart disease, sleep apnea, fatty liver, and joint problems";
    }
    if (Number.isFinite(ratio) && ratio >= 0.5) {
      healthRisk += "; waist-to-height ratio suggests higher central-body-fat risk";
    }
    if (calculatedFrameSize === "Large frame" && (category === "Overweight" || category === "Obese")) {
      healthRisk += "; larger frame may explain some weight, but health risk still depends on waist and body-fat pattern";
    }

    const rows = [
      ["BMI", bmi.toFixed(2)],
      ["BMI category", category],
      ["Healthy weight range", healthyRange],
      ["Difference to healthy range", differenceText],
      ["Calories/day to maintain", caloriesMaintainText],
      ["Calories/day to add weight", caloriesGainText],
      ["Calories/day to lose weight", caloriesLossText],
      ["Body fat estimate", bodyFatText],
      ["Body type comment", bodyTypeComment],
      ["Frame size", calculatedFrameSize],
      ["Fat distribution", fatDistribution],
      ["Body shape", bodyShape],
      ["Somatotype tendency", somatotypeTendency],
      ["Suggested exercise", suggestedExercise],
      ["Suggested foods", suggestedFoods],
      ["Goal timeline", goalTimeline],
      ["Healthy?", goalHealthyText],
      ["Best", goalBestText],
      ["Waist-to-height ratio", Number.isFinite(ratio) ? ratio.toFixed(2) : "Not provided"],
      ["Waist-to-height status", waistStatus],
      ["Neck circumference", measurementDisplay(neck)],
      ["Wrist size", measurementDisplay(wrist)],
      ["Shoulder width", measurementDisplay(shoulder)],
      ["Hip circumference", measurementDisplay(hip)],
      ["Health risk", healthRisk],
      ["Unit", unit === "us" ? "US" : "SI"],
      ["Name", name || "Not provided"],
      ["Age range", ageRangeLabel(age)],
      ["Gender", genderLabel(gender)],
      ["Activity level", activityLabels[activity] || "Moderate activity"],
      ["Target weight", Number.isFinite(targetWeight) && targetWeight > 0 ? targetWeight + " " + displayUnit : "Not provided"],
      ["Time goal", goalUnitText(timeGoalAmount, timeGoal)]
    ];

    const metrics = {
      bmi: bmi.toFixed(2),
      category: category,
      healthyRange: healthyRange,
      healthRisk: healthRisk,
      calories: caloriesMaintainText,
      caloriesMaintain: caloriesMaintainText,
      caloriesGain: caloriesGainText,
      caloriesLoss: caloriesLossText,
      bodyFat: bodyFatText,
      physique: physiqueText,
      frameSize: calculatedFrameSize,
      fatDistribution: fatDistribution,
      bodyShape: bodyShape,
      somatotypeTendency: somatotypeTendency,
      bodyTypeComment: bodyTypeComment,
      suggestedExercise: suggestedExercise,
      suggestedFoods: suggestedFoods,
      goalTimeline: goalTimeline,
      name: name || "",
      resultRows: rows.map(function (row) {
        return { label: row[0], value: row[1] };
      })
    };

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


  function localTodayIsoDate() {
    const now = new Date();
    return now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");
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

    /*
      Keep optional mortgage sections in the new two-column layout.
      Previously, every auto-calculate moved these boxes back into the old
      .loan-optional-row, making them look like they disappeared while typing.
    */
    const mortgageLayout = document.querySelector(".mortgage-two-column-input-layout");
    const mortgageLeftColumn = mortgageLayout ? mortgageLayout.querySelector(".mortgage-left-input-column") : null;
    const mortgageRightColumn = mortgageLayout ? mortgageLayout.querySelector(".mortgage-right-input-column") : null;

    if (mortgageLeftColumn && mortgageRightColumn) {
      if (optional.parentElement !== mortgageLeftColumn) mortgageLeftColumn.appendChild(optional);
      if (early.parentElement !== mortgageRightColumn) mortgageRightColumn.appendChild(early);
    } else {
      if (!row.contains(optional)) row.appendChild(optional);
      if (!row.contains(early)) row.appendChild(early);
    }

    const hoa = byId("hoaMonthly");
    const other = byId("otherMonthlyFees");
    if (hoa && other) {
      if (!other.value && hoa.value) other.value = hoa.value;
      const label = $('label[for="hoaMonthly"]');
      if (label) label.remove();
      hoa.remove();
    }
  }

  function mortgageFormatPercent(value) {
    if (!Number.isFinite(value)) return "-";
    return (Math.round(value * 100) / 100).toFixed(2) + "%";
  }

  function mortgageSafeMoney(value) {
    if (!Number.isFinite(value)) return "-";
    return moneyRM(value);
  }

  function mortgagePayoffSchedule(principal, annualRate, months, extraMonthly) {
    const monthlyRate = annualRate / 100 / 12;
    const basePayment = calculateLoanPayment(principal, annualRate, months);
    const extra = Math.max(0, Number(extraMonthly) || 0);
    const payment = basePayment + extra;

    let balance = principal;
    let totalInterest = 0;
    let payoffMonths = 0;
    let yearPrincipal = 0;
    let yearInterest = 0;
    const yearly = [];

    for (let month = 1; month <= months && balance > 0.005; month += 1) {
      const interestPaid = monthlyRate === 0 ? 0 : balance * monthlyRate;
      let principalPaid = payment - interestPaid;

      if (principalPaid <= 0) {
        principalPaid = 0;
      }

      if (principalPaid > balance) {
        principalPaid = balance;
      }

      balance = Math.max(0, balance - principalPaid);
      totalInterest += interestPaid;
      yearPrincipal += principalPaid;
      yearInterest += interestPaid;
      payoffMonths = month;

      if (month % 12 === 0 || balance <= 0.005 || month === months) {
        yearly.push({
          year: Math.ceil(month / 12),
          principal: yearPrincipal,
          interest: yearInterest,
          balance: balance
        });
        yearPrincipal = 0;
        yearInterest = 0;
      }
    }

    return {
      basePayment: basePayment,
      paymentWithExtra: payment,
      totalInterest: totalInterest,
      totalPaid: principal + totalInterest,
      payoffMonths: payoffMonths,
      yearly: yearly
    };
  }

  function mortgageSimpleBarChart(items, valueKey) {
    /*
      Kept this function name so existing mortgage code still works,
      but the visual output is now a line graph instead of a bar chart.
    */
    items = Array.isArray(items) ? items : [];

    const values = items.map(function (item) {
      return Number(item[valueKey]) || 0;
    });

    const width = 520;
    const height = 220;
    const padLeft = 54;
    const padRight = 24;
    const padTop = 24;
    const padBottom = 46;
    const chartWidth = width - padLeft - padRight;
    const chartHeight = height - padTop - padBottom;
    const max = Math.max.apply(Math, values.concat([1]));
    const min = Math.min.apply(Math, values.concat([0]));
    const range = Math.max(1, max - min);

    function xAt(index) {
      if (items.length <= 1) return padLeft + chartWidth / 2;
      return padLeft + (index / (items.length - 1)) * chartWidth;
    }

    function yAt(value) {
      return padTop + chartHeight - ((value - min) / range) * chartHeight;
    }

    const points = values.map(function (value, index) {
      return xAt(index).toFixed(2) + "," + yAt(value).toFixed(2);
    }).join(" ");

    const dots = items.map(function (item, index) {
      const value = values[index];
      const x = xAt(index);
      const y = yAt(value);
      return (
        '<g class="mortgage-line-point">' +
          '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="5"></circle>' +
          '<text x="' + x.toFixed(2) + '" y="' + (height - 18) + '" text-anchor="middle">' + escapeHtml(item.label || "") + '</text>' +
          '<text x="' + x.toFixed(2) + '" y="' + Math.max(12, y - 10).toFixed(2) + '" text-anchor="middle">' + escapeHtml(item.display || moneyRM(value)) + '</text>' +
        '</g>'
      );
    }).join("");

    return (
      '<div class="mortgage-line-chart-wrap">' +
        '<svg class="mortgage-line-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Mortgage line graph">' +
          '<line class="mortgage-line-axis" x1="' + padLeft + '" y1="' + (padTop + chartHeight) + '" x2="' + (padLeft + chartWidth) + '" y2="' + (padTop + chartHeight) + '"></line>' +
          '<line class="mortgage-line-axis" x1="' + padLeft + '" y1="' + padTop + '" x2="' + padLeft + '" y2="' + (padTop + chartHeight) + '"></line>' +
          '<polyline class="mortgage-line-path" points="' + points + '"></polyline>' +
          dots +
        '</svg>' +
      '</div>'
    );
  }

  function mortgageAmortizationLineChart(yearly) {
    yearly = Array.isArray(yearly) ? yearly : [];

    const items = yearly.slice(0, 40).map(function (row) {
      return {
        label: "Y" + row.year,
        balance: Number(row.balance) || 0,
        display: moneyRM(row.balance)
      };
    });

    if (!items.length) {
      return '<p class="mortgage-chart-empty">Enter loan details to see amortization line graph.</p>';
    }

    return mortgageSimpleBarChart(items, "balance");
  }

  function mortgageTable(headers, rows, className) {
    return (
      '<div class="mortgage-advanced-table-scroll">' +
        '<table class="mortgage-advanced-table ' + (className || "") + '">' +
          '<thead><tr>' + headers.map(function (header) {
            return '<th>' + escapeHtml(header) + '</th>';
          }).join("") + '</tr></thead>' +
          '<tbody>' + rows.map(function (row) {
            return '<tr>' + row.map(function (cell) {
              return '<td>' + escapeHtml(cell) + '</td>';
            }).join("") + '</tr>';
          }).join("") + '</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  function mortgageImpactRows(homePrice, annualRate, months, currentDownPayment) {
    const percents = [0, 10, 20, 30];

    if (currentDownPayment > 0 && homePrice > 0) {
      const currentPercent = Math.round((currentDownPayment / homePrice) * 1000) / 10;
      if (!percents.includes(currentPercent)) percents.push(currentPercent);
    }

    return percents
      .filter(function (percent, index, arr) { return arr.indexOf(percent) === index; })
      .sort(function (a, b) { return a - b; })
      .map(function (percent) {
        const dp = homePrice * percent / 100;
        const principal = Math.max(0, homePrice - dp);
        const monthly = principal > 0 ? calculateLoanPayment(principal, annualRate, months) : 0;
        const totalInterest = principal > 0 ? (monthly * months - principal) : 0;

        return [
          percent + "%",
          moneyRM(dp),
          moneyRM(principal),
          moneyRM(monthly),
          moneyRM(totalInterest)
        ];
      });
  }


  function renderMortgageAdvancedResultPanel(resultHtml) {
    const panel = getOrCreateOutputPanel("loan");
    if (!panel) return null;

    panel.className = "loan-style-output-panel calculator-clean-result loan-clean-result mortgage-modern-result-panel";
    panel.innerHTML =
      '<div class="mortgage-modern-result-shell">' +
        '<h2 class="loan-panel-title mortgage-modern-result-title">Result</h2>' +
        (resultHtml || "") +
        '<div class="mortgage-result-actions mortgage-result-actions-final" aria-label="Mortgage result actions">' +
          '<button type="button" class="mortgage-result-action-btn mortgage-result-copy-btn">Copy</button>' +
          '<button type="button" class="mortgage-result-action-btn mortgage-result-save-btn">Save</button>' +
          '<button type="button" class="mortgage-result-action-btn mortgage-result-share-btn">Share</button>' +
          '<button type="button" class="mortgage-result-action-btn mortgage-result-report-btn">Report</button>' +
        '</div>' +
      '</div>';

    const copyBtn = panel.querySelector(".mortgage-result-copy-btn");
    const saveBtn = panel.querySelector(".mortgage-result-save-btn");
    const shareBtn = panel.querySelector(".mortgage-result-share-btn");
    const reportBtn = panel.querySelector(".mortgage-result-report-btn");

    if (copyBtn) {
      copyBtn.onclick = function () {
        copyText(cleanText(panel.innerText), copyBtn);
      };
    }

    if (saveBtn) {
      saveBtn.onclick = function () {
        downloadTextFile("mortgage-result-" + dateFileStamp() + ".txt", cleanText(panel.innerText));
      };
    }

    if (shareBtn) {
      shareBtn.onclick = function () {
        const text = cleanText(panel.innerText);

        if (navigator.share) {
          navigator.share({
            title: "Mortgage result",
            text: text
          }).catch(function () {
            copyText(text, shareBtn);
          });
        } else {
          copyText(text, shareBtn);
        }
      };
    }

    if (reportBtn) {
      reportBtn.onclick = function () {
        openLatestCalculatorReport("loan", reportBtn);
      };
    }

    panel.hidden = false;
    panel.style.setProperty("display", "block", "important");
    panel.style.setProperty("visibility", "visible", "important");

    hideNativeResultElements("loan");
    return panel;
  }

  function calculateLoan() {
    ensureMortgageOptionalSections();

    const homeNameInput = byId("homeName");
    const homeName = homeNameInput ? String(homeNameInput.value || "").trim() : "";
    const homePrice = firstNumber(["amount", "loanAmount", "loanPrincipal"]);
    const downPayment = Math.max(0, firstNumber(["downPayment"]) || 0);
    const principal = Number.isFinite(homePrice) ? Math.max(0, homePrice - downPayment) : NaN;
    const annualRate = firstNumber(["interest", "loanRate", "interestRate", "annualRate"]);
    const termInput = firstInput(["years", "loanYears", "loanTerm", "term"]);
    const rawTerm = termInput ? numberFromString(termInput.value) : NaN;

    if (!Number.isFinite(homePrice) || !Number.isFinite(principal) || !Number.isFinite(annualRate) || !Number.isFinite(rawTerm) || homePrice <= 0 || principal <= 0 || annualRate < 0 || rawTerm <= 0) return;

    const label = termInput ? getInputLabel(termInput) : "";
    const isMonths = termInput && (termInput.dataset.termUnit === "months" || /month/i.test(label));
    const months = isMonths ? Math.round(rawTerm) : Math.round(rawTerm * 12);

    if (!Number.isFinite(months) || months <= 0) return;

    const startDateInput = byId("startDate");
    if (startDateInput && !startDateInput.value) {
      startDateInput.value = localTodayIsoDate();
    }
    const startDate = startDateInput && startDateInput.value ? startDateInput.value : localTodayIsoDate();
    const taxMonthly = (firstNumber(["propertyTaxYearly"]) || 0) / 12;
    const insuranceMonthly = (firstNumber(["homeInsuranceYearly"]) || 0) / 12;
    const otherMonthly = firstNumber(["otherMonthlyFees", "hoaMonthly"]) || 0;
    const extraMonthly = firstNumber(["extraMonthlyPayment"]) || 0;
    const incomeMonthly = firstNumber(["incomeMonthly", "monthlyIncome", "income"]) || 0;

    const baseMonthly = calculateLoanPayment(principal, annualRate, months);
    const principalInterestValue = baseMonthly * months;
    const baseTotalInterest = principalInterestValue - principal;
    const totalMonthly = baseMonthly + taxMonthly + insuranceMonthly + otherMonthly + extraMonthly;
    const affordRatio = 0.28;
    const requiredIncome = totalMonthly / affordRatio;
    const affordability = incomeMonthly > 0
      ? (totalMonthly <= incomeMonthly * affordRatio ? "Yes, based on 28% of monthly income" : "No, estimated payment is above 28% of income")
      : "Add monthly income to check affordability";

    const schedule = mortgagePayoffSchedule(principal, annualRate, months, extraMonthly);
    const noExtraSchedule = mortgagePayoffSchedule(principal, annualRate, months, 0);
    const extraPaidApprox = Math.max(0, extraMonthly) * Math.max(0, schedule.payoffMonths);
    const interestSaved = Math.max(0, noExtraSchedule.totalInterest - schedule.totalInterest);

    const noDownMonthly = calculateLoanPayment(homePrice, annualRate, months);
    const monthlySavingsFromDownPayment = Math.max(0, noDownMonthly - baseMonthly);
    const breakEvenMonths = downPayment > 0 && monthlySavingsFromDownPayment > 0
      ? Math.ceil(downPayment / monthlySavingsFromDownPayment)
      : null;
    const breakEvenText = breakEvenMonths
      ? breakEvenMonths + " months (about " + (breakEvenMonths / 12).toFixed(1) + " years)"
      : "Not available without down payment savings";

    const yearlyRows = schedule.yearly.map(function (row) {
      return [
        "Year " + row.year,
        moneyRM(row.principal),
        moneyRM(row.interest),
        moneyRM(row.balance)
      ];
    });

    const interestChartItems = [-2, -1, 0, 1, 2].map(function (change) {
      const rate = Math.max(0, annualRate + change);
      const monthly = calculateLoanPayment(principal, rate, months);
      return {
        label: mortgageFormatPercent(rate),
        monthly: monthly,
        display: moneyRM(monthly) + "/mo"
      };
    });

    const comparisonYears = [15, 20, 25, 30].filter(function (year, index, arr) {
      return arr.indexOf(year) === index;
    });
    const yearCompareItems = comparisonYears.map(function (year) {
      const compareMonths = year * 12;
      const monthly = calculateLoanPayment(principal, annualRate, compareMonths);
      return {
        label: year + " years",
        monthly: monthly,
        display: moneyRM(monthly) + "/mo"
      };
    });

    const downPaymentRows = mortgageImpactRows(homePrice, annualRate, months, downPayment);

    const rows = [
      ["Home name", homeName || "Not provided"],
      ["Home price", moneyRM(homePrice)],
      ["Down payment", moneyRM(downPayment)],
      ["Mortgage principal", moneyRM(principal)],
      ["Annual interest rate", annualRate.toFixed(2) + "%"],
      ["Loan term", months + " months (" + (months / 12).toFixed(1) + " years)"],
      ["Start date", startDate],
      ["Principal + interest value", moneyRM(principalInterestValue)],
      ["Monthly principal + interest", moneyRM(baseMonthly)],
      ["Total interest", moneyRM(baseTotalInterest)],
      ["Property tax monthly", moneyRM(taxMonthly)],
      ["Insurance monthly", moneyRM(insuranceMonthly)],
      ["Other monthly fee", moneyRM(otherMonthly)],
      ["Extra monthly payment", moneyRM(extraMonthly)],
      ["Estimated total monthly payment", moneyRM(totalMonthly)],
      ["Is this house affordable?", affordability],
      ["Income needed to afford this", moneyRM(requiredIncome) + "/month"],
      ["How much I am paying extra", moneyRM(extraPaidApprox) + " over estimated payoff"],
      ["Interest saved with extra payment", moneyRM(interestSaved)],
      ["Estimated payoff time with extra", schedule.payoffMonths + " months"],
      ["Break even time", breakEvenText]
    ];

    const settleMonth = firstNumber(["earlySettlementMonth"]);
    if (Number.isFinite(settleMonth) && settleMonth > 0) {
      const paidMonths = Math.min(Math.round(settleMonth), months);
      rows.push(["Estimated balance after month " + paidMonths, moneyRM(remainingBalance(principal, annualRate, months, paidMonths, extraMonthly))]);
    }

    const normalPayoffYears = (noExtraSchedule.payoffMonths / 12).toFixed(1);
    const extraPayoffYears = (schedule.payoffMonths / 12).toFixed(1);
    const monthsSaved = Math.max(0, noExtraSchedule.payoffMonths - schedule.payoffMonths);
    const yearlyPaymentTotal = totalMonthly * 12;
    const loanToValue = homePrice > 0 ? (principal / homePrice) * 100 : 0;
    const downPaymentPercent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
    const costToIncomePercent = incomeMonthly > 0 ? (totalMonthly / incomeMonthly) * 100 : 0;
    const inflationRate = 3;
    const yearsFloat = months / 12;
    const inflationAdjustedTotal = principalInterestValue / Math.pow(1 + inflationRate / 100, yearsFloat);
    const assumedRent = Number.isFinite(currentMonthlyRent) ? currentMonthlyRent : totalMonthly * 0.75;
    const rentSourceText = Number.isFinite(currentMonthlyRent) ? "Entered current rent" : "Assumed comparable rent at 75% of buy monthly cost";
    const buyVsRentGap = totalMonthly - assumedRent;
    const flexiSuggestedExtra = extraMonthly > 0 ? extraMonthly : Math.min(500, Math.max(100, baseMonthly * 0.05));
    const flexiScenario = mortgagePayoffSchedule(principal, annualRate, months, flexiSuggestedExtra);
    const islamicMonthly = baseMonthly;
    const islamicTotalProfit = Math.max(0, islamicMonthly * months - principal);
    const islamicTotalSalePrice = principal + islamicTotalProfit;
    const conventionalTotalRepayment = baseMonthly * months;
    const conventionalInterestAmount = Math.max(0, conventionalTotalRepayment - principal);
    const islamicDifferenceAmount = islamicTotalSalePrice - conventionalTotalRepayment;
    const islamicDifferenceText =
      Math.abs(islamicDifferenceAmount) < 1
        ? "Same estimate here because the same entered rate and term are used for comparison."
        : (islamicDifferenceAmount > 0
          ? moneyRM(islamicDifferenceAmount) + " higher than the conventional estimate using the same assumptions."
          : moneyRM(Math.abs(islamicDifferenceAmount)) + " lower than the conventional estimate using the same assumptions.");

    const comparisonRows = [
      ["Current loan", annualRate.toFixed(2) + "%", months + " months", moneyRM(baseMonthly), moneyRM(baseTotalInterest)],
      ["Rate +1%", (annualRate + 1).toFixed(2) + "%", months + " months", moneyRM(calculateLoanPayment(principal, annualRate + 1, months)), moneyRM(calculateLoanPayment(principal, annualRate + 1, months) * months - principal)],
      ["Rate -1%", Math.max(0, annualRate - 1).toFixed(2) + "%", months + " months", moneyRM(calculateLoanPayment(principal, Math.max(0, annualRate - 1), months)), moneyRM(calculateLoanPayment(principal, Math.max(0, annualRate - 1), months) * months - principal)]
    ];

    const loanYearRows = yearCompareItems.map(function (item) {
      const years = Number(String(item.label).replace(/[^\d.]/g, "")) || 0;
      const compareMonths = years * 12;
      const monthly = calculateLoanPayment(principal, annualRate, compareMonths);
      return [item.label, moneyRM(monthly), moneyRM(monthly * compareMonths - principal), moneyRM(monthly * compareMonths)];
    });

    const summary =
      '<div class="mortgage-modern-output">' +
        '<section class="mortgage-modern-section mortgage-breakdown-section">' +
          '<h3>Monthly payment breakdown</h3>' +
          mortgageTable(["Payment part", "Monthly value"], [
            ["Principal + interest", moneyRM(baseMonthly)],
            ["Property tax", moneyRM(taxMonthly)],
            ["Insurance", moneyRM(insuranceMonthly)],
            ["Other monthly fee", moneyRM(otherMonthly)],
            ["Extra monthly payment", moneyRM(extraMonthly)],
            ["Estimated total monthly payment", moneyRM(totalMonthly)]
          ], "mortgage-modern-table") +
        '</section>' +

        '<section class="mortgage-modern-section mortgage-affordability-section">' +
          '<h3>Affordability analysis</h3>' +
          mortgageTable(["Check", "Result"], [
            ["Is this house affordable?", affordability],
            ["Monthly income entered", incomeMonthly > 0 ? moneyRM(incomeMonthly) : "Not provided"],
            ["Income needed to afford this", moneyRM(requiredIncome) + "/month"],
            ["Payment to income ratio", incomeMonthly > 0 ? costToIncomePercent.toFixed(1) + "%" : "Add income to calculate"],
            ["Rule used", "Payment should stay around 28% of monthly income"]
          ], "mortgage-modern-table") +
        '</section>' +

        '<section class="mortgage-modern-section mortgage-insights-section">' +
          '<h3>Loan insights</h3>' +
          mortgageTable(["Insight", "Value"], [
            ["Home price", moneyRM(homePrice)],
            ["Down payment", moneyRM(downPayment) + " (" + downPaymentPercent.toFixed(1) + "%)"],
            ["Loan principal", moneyRM(principal)],
            ["Loan-to-value", loanToValue.toFixed(1) + "%"],
            ["Principal + interest value", moneyRM(principalInterestValue)],
            ["Total interest", moneyRM(baseTotalInterest)],
            ["Yearly payment estimate", moneyRM(yearlyPaymentTotal)]
          ], "mortgage-modern-table") +
        '</section>' +

        '<section class="mortgage-modern-section mortgage-extra-section">' +
          '<h3>Extra payment analysis</h3>' +
          mortgageTable(["Extra payment item", "Result"], [
            ["Extra monthly payment", moneyRM(extraMonthly)],
            ["Approx extra paid", moneyRM(extraPaidApprox)],
            ["Interest saved", moneyRM(interestSaved)],
            ["Normal payoff time", noExtraSchedule.payoffMonths + " months (" + normalPayoffYears + " years)"],
            ["Payoff time with extra", schedule.payoffMonths + " months (" + extraPayoffYears + " years)"],
            ["Time saved", monthsSaved + " months"]
          ], "mortgage-modern-table") +
        '</section>' +

        '<section class="mortgage-modern-section mortgage-comparison-section">' +
          '<h3>Comparison scenario</h3>' +
          mortgageTable(["Scenario", "Rate", "Term", "Monthly P+I", "Total interest"], comparisonRows, "mortgage-modern-table") +
          mortgageTable(["Loan term", "Monthly P+I", "Total interest", "Total P+I"], loanYearRows, "mortgage-modern-table mortgage-loan-years-table") +
        '</section>' +

        '<section class="mortgage-modern-section mortgage-visual-section">' +
          '<h3>Graph and visualizations</h3>' +
          '<div class="mortgage-modern-graph-grid">' +
            '<div><h4>Different interest rates</h4>' + mortgageSimpleBarChart(interestChartItems, "monthly") + '</div>' +
            '<div><h4>Different loan years</h4>' + mortgageSimpleBarChart(yearCompareItems, "monthly") + '</div>' +
            '<div><h4>Amortization balance</h4>' + mortgageAmortizationLineChart(schedule.yearly) + '</div>' +
          '</div>' +
        '</section>' +

        '<section class="mortgage-modern-section mortgage-amortization-section">' +
          '<h3>Amortization schedule</h3>' +
          mortgageTable(["Year", "Principal paid", "Interest paid", "Remaining balance"], yearlyRows, "mortgage-modern-table mortgage-year-table") +
        '</section>' +

        '<section class="mortgage-modern-section mortgage-smart-section">' +
          '<h3>Smart insight</h3>' +
          mortgageTable(["Smart insight", "Meaning"], [
            ["Break-even time", breakEvenText],
            ["Best quick improvement", extraMonthly > 0 ? "Your extra payment is reducing interest and payoff time." : "Try adding a small extra monthly payment to reduce interest."],
            ["Main cost driver", baseTotalInterest > principal * 0.5 ? "Interest is a major part of total cost." : "Principal is the main part of total cost."],
            ["Affordability note", affordability]
          ], "mortgage-modern-table") +
        '</section>' +

        '<section class="mortgage-modern-section mortgage-inflation-section">' +
          '<h3>Inflation adjusted analysis</h3>' +
          mortgageTable(["Inflation item", "Estimate"], [
            ["Assumed inflation", inflationRate.toFixed(1) + "% per year"],
            ["Years assumed", yearsFloat.toFixed(1) + " years"],
            ["Nominal principal + interest", moneyRM(principalInterestValue)],
            ["Inflation-adjusted equivalent", moneyRM(inflationAdjustedTotal)],
            ["Long-term effect", "Future payments may feel cheaper if income rises with inflation."]
          ], "mortgage-modern-table") +
        '</section>' +

        '<section class="mortgage-modern-section mortgage-rentbuy-section">' +
          '<h3>Rent buy analysis</h3>' +
          mortgageTable(["Rent vs buy item", "Estimate"], [
            ["Estimated buy monthly cost", moneyRM(totalMonthly)],
            ["Rent used in analysis", moneyRM(assumedRent) + "/month"],
            ["Rent source", rentSourceText],
            ["Buy minus rent difference", moneyRM(buyVsRentGap) + "/month"],
            ["Simple guidance", buyVsRentGap <= 0 ? "Buying is cheaper than rent used in the analysis." : "Buying costs more monthly than rent, but may build ownership equity."]
          ], "mortgage-modern-table") +
        '</section>' +

        '<section class="mortgage-modern-section mortgage-flexi-section">' +
          '<h3>Flexi loan analysis</h3>' +
          mortgageTable(["Flexi loan item", "Estimate"], [
            ["Flexible extra payment tested", moneyRM(flexiSuggestedExtra) + "/month"],
            ["Estimated payoff time", flexiScenario.payoffMonths + " months"],
            ["Estimated interest saved", moneyRM(Math.max(0, noExtraSchedule.totalInterest - flexiScenario.totalInterest))],
            ["Flexi loan note", "A flexi loan can help if extra deposits reduce principal or interest calculation."]
          ], "mortgage-modern-table") +
        '</section>' +


      '</div>';

    renderMortgageAdvancedResultPanel(summary);
    saveCurrentReport("loan", {
      monthlyPayment: moneyRM(baseMonthly),
      totalInterest: moneyRM(baseTotalInterest),
      totalPayment: moneyRM(principalInterestValue),
      affordability: affordability,
      incomeNeeded: moneyRM(requiredIncome),
      breakEvenTime: breakEvenText
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
        match: /name|date range|day of week born|born date in islamic|born date in chinese/i
      },
      {
        title: "Current age",
        note: "Main age values for the selected date.",
        match: /exact age|normal age|asian age|age in .* year|days old|seconds old/i
      },
      {
        title: "Birthday & milestones",
        note: "Upcoming birthday and important age milestones.",
        match: /next birthday countdown|next age live countdown|seconds to next age|retirement|legal age|leap year age/i
      },
      {
        title: "Life summary",
        note: "Estimated time already lived, slept, breathed, and heartbeats.",
        match: /days spent alive|estimated sleep time|breaths taken|heartbeats lived/i
      },
      {
        title: "Zodiac",
        note: "Western and Chinese zodiac details.",
        match: /western zodiac|chinese zodiac/i
      },
      {
        title: "Famous birthdays & historical event",
        note: "People and events connected to the same month and day.",
        match: /famous person|famous celebrity|famous sports star|famous historical figure|historical event/i
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

  function bmiReportFlowHtml(rows) {
    rows = Array.isArray(rows) ? rows : [];

    function label(row) {
      return String((Array.isArray(row) ? row[0] : row.label) || "");
    }

    function value(row) {
      return String((Array.isArray(row) ? row[1] : row.value) || "");
    }

    function tableRowsFor(groupRows) {
      return groupRows.map(function (row) {
        return (
          "<tr>" +
            "<th>" + escapeHtml(label(row)) + "</th>" +
            "<td>" + escapeHtml(value(row)) + "</td>" +
          "</tr>"
        );
      }).join("");
    }

    const groups = [
      {
        title: "1. BMI summary",
        note: "Main BMI reading and category.",
        match: /^BMI$|^BMI category$|^Difference to healthy range$/i
      },
      {
        title: "2. Health overview",
        note: "Healthy range, waist check, and risk summary.",
        match: /Healthy weight range|Health risk|Waist-to-height ratio|Waist-to-height status|Neck circumference|Wrist size|Shoulder width|Hip circumference/i
      },
      {
        title: "3. Calories & body composition",
        note: "Daily calorie estimate and body fat estimate.",
        match: /Calories\/day|Body fat estimate|Body type comment|Frame size|Fat distribution|Body shape|Somatotype tendency|Suggested exercise|Suggested foods|Physique \/ body type/i
      },
      {
        title: "4. Goal planning",
        note: "Target weight and estimated timeline.",
        match: /Goal timeline|Healthy\?|Best|Target weight|Time goal/i
      },
      {
        title: "5. Input profile",
        note: "Profile details used for the calculation.",
        match: /Unit|Name|Age range|Gender|Activity level/i
      }
    ];

    const used = new Set();

    function groupRows(group) {
      return rows.filter(function (row, index) {
        if (!row || used.has(index)) return false;
        if (!group.match.test(label(row))) return false;
        used.add(index);
        return true;
      });
    }

    function makeStep(group, groupRows) {
      if (!groupRows.length) return "";

      return (
        '<section class="bmi-report-flow-step">' +
          '<div class="bmi-report-flow-head">' +
            '<h3>' + escapeHtml(group.title) + '</h3>' +
            '<p>' + escapeHtml(group.note) + '</p>' +
          '</div>' +
          '<div class="calculator-report-table-scroll">' +
            '<table class="bmi-report-flow-table">' +
              '<tbody>' + tableRowsFor(groupRows) + '</tbody>' +
            '</table>' +
          '</div>' +
        '</section>'
      );
    }

    let html = groups.map(function (group) {
      return makeStep(group, groupRows(group));
    }).join("");

    const remaining = rows.filter(function (row, index) {
      return row && !used.has(index);
    });

    if (remaining.length) {
      html += makeStep({
        title: "6. Other details",
        note: "Additional BMI information.",
        match: /.*/
      }, remaining);
    }

    return '<div class="bmi-report-flow">' + html + '</div>';
  }

  function mortgageReportResultHtml(report) {
    const template = document.createElement("template");
    template.innerHTML = cleanResultHtml(report ? report.resultHtml : "");

    /*
      Live mortgage result panel already has its own Result title and outer result shell.
      The report page also has a Result card/title, so remove the inner duplicate.
    */
    template.content.querySelectorAll(".mortgage-modern-result-title, .loan-panel-title").forEach(function (title) {
      if (/^result$/i.test(cleanText(title.textContent))) {
        title.remove();
      }
    });

    const shell = template.content.querySelector(".mortgage-modern-result-shell");
    if (shell) {
      return shell.innerHTML;
    }

    return template.innerHTML;
  }

  function reportResultHtml(report) {
    if (report && report.type === "loan") {
      return mortgageReportResultHtml(report);
    }

    if (report && report.type === "age") {
      if (Array.isArray(report.resultLines) && report.resultLines.length) {
        return ageReportFlowHtml(report.resultLines);
      }

      if (report.metrics && Array.isArray(report.metrics.resultRows) && report.metrics.resultRows.length) {
        return ageReportFlowHtml(report.metrics.resultRows);
      }
    }

    if (report && report.type === "bmi") {
      if (Array.isArray(report.resultLines) && report.resultLines.length) {
        return bmiReportFlowHtml(report.resultLines);
      }

      if (report.metrics && Array.isArray(report.metrics.resultRows) && report.metrics.resultRows.length) {
        return bmiReportFlowHtml(report.metrics.resultRows);
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
      "#universalLoanStyleOutput, #loanExternalOutput, #personalLoanExternalOutput, .calculator-clean-result, .age-clean-result, .age-point-output, #ageResult"
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


  function getCalculatorFaqs(type) {
    const faqs = {
      basic: [
        ["Can I paste numbers into the display?", "Yes. You can paste a number or expression into the display, then press Enter or = to calculate."],
        ["Does it follow normal math order?", "Yes. Brackets and powers are handled before multiplication, division, addition, and subtraction."],
        ["Can I use square root?", "Yes. Use the square root button or paste a square-root expression supported by the calculator."]
      ],
      age: [
        ["Why is exact age different from normal age?", "Exact age breaks your age into years, months, days, hours, and minutes. Normal age usually counts full completed years only."],
        ["What does next birthday countdown mean?", "It shows how much time is left until your next birthday or upcoming age."],
        ["Are famous birthdays and historical events exact?", "They are helpful reference items based on the selected date, but they should be treated as general information."]
      ],
      bmi: [
        ["Is BMI a diagnosis?", "No. BMI is a screening estimate. It does not replace advice from a doctor or health professional."],
        ["Why add waist-to-height ratio?", "Waist-to-height ratio gives extra context about body fat distribution and possible health risk."],
        ["What does goal timeline mean?", "It estimates how fast you may need to lose or gain weight based on your target weight and selected time goal."]
      ],
      loan: [
        ["Is this a mortgage approval result?", "No. It is an estimate only. Banks may use credit score, debt commitments, income proof, property type, and other rules."],
        ["What is included in monthly payment?", "The calculator can include principal, interest, property tax, insurance, other monthly fees, and extra payments when provided."],
        ["Why do results change when I add extra payment?", "Extra payment can reduce remaining principal faster, which may reduce total interest and shorten the payoff time."]
      ],
      personalLoan: [
        ["Is this the bank’s final monthly payment?", "No. It is an estimate. The real payment may include bank fees, insurance, taxes, or different interest rules."],
        ["What loan details are needed?", "Loan amount, interest rate, and loan term are the main inputs needed for the estimate."],
        ["What does total interest mean?", "It is the estimated interest paid over the full loan term if payments follow the schedule."]
      ],
      discount: [
        ["What is final price?", "Final price is the original price minus the discount amount."],
        ["What is savings?", "Savings is the amount removed from the original price by the discount."],
        ["Can I use this for sale items?", "Yes. Enter the original price and discount percentage to estimate the sale price."]
      ],
      percentage: [
        ["What does percentage of a number mean?", "It means finding a part of a number based on a value out of 100."],
        ["Example: what is 20% of 150?", "20% of 150 is 30 because 20 ÷ 100 × 150 = 30."],
        ["Can I use decimals?", "Yes. Decimal percentages and decimal numbers can be used."]
      ],
      compound: [
        ["What is compound interest?", "Compound interest means interest is added to the balance, then future interest is calculated on the new larger balance."],
        ["What does compounding frequency mean?", "It means how often interest is added, such as yearly, monthly, or daily."],
        ["Why is compound interest different from simple interest?", "Simple interest is calculated only on the original principal. Compound interest grows on both principal and accumulated interest."]
      ]
    };

    return faqs[type] || [];
  }

  function makeFaqBox(type) {
    const items = getCalculatorFaqs(type);
    const box = document.createElement("section");
    box.className = "instruction-section instruction-faq-box";
    box.innerHTML = "<h3>FAQs</h3>";

    if (!items.length) {
      box.innerHTML += "<p>No FAQs available for this calculator yet.</p>";
      return box;
    }

    const list = document.createElement("div");
    list.className = "calculator-faq-list";

    items.forEach(function (item, index) {
      const details = document.createElement("details");
      details.className = "calculator-faq-item";
      if (index === 0) details.open = true;

      const summary = document.createElement("summary");
      summary.textContent = item[0];

      const answer = document.createElement("p");
      answer.textContent = item[1];

      details.appendChild(summary);
      details.appendChild(answer);
      list.appendChild(details);
    });

    box.appendChild(list);
    return box;
  }

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
    box.appendChild(makeFaqBox(type));

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
    }, 2000);
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
        !(event.target.closest && event.target.closest("#navbar, .site-search, .clean-nav-search"))
      ) {
        scheduleAutoCalculate();
      }
    }, true);

    document.addEventListener("change", function (event) {
      if (
        event.target.matches &&
        event.target.matches("input, select, textarea") &&
        event.target.id !== "display" &&
        !(event.target.closest && event.target.closest("#navbar, .site-search, .clean-nav-search"))
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

    if (type === "age") {
      ensureAgeNameInput();
      ensureAgeTargetDateInput();
    }
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


  function openLatestCalculatorReport(type, button) {
    if (!isReportType(type)) return false;

    const reports = loadReports(type);
    const report = reports && reports.length ? reports[reports.length - 1] : null;

    if (!report) {
      if (button) setButtonState(button, "Calculate first");
      return false;
    }

    window.location.href = reportHref(report);
    return true;
  }

  window.openLatestCalculatorReport = openLatestCalculatorReport;

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

    let chatLink = navbar.querySelector(".nav-chat-link");
    if (!chatLink) {
      chatLink = document.createElement("a");
      chatLink.href = "chatting.html";
      chatLink.className = "nav-chat-link";
      chatLink.textContent = "chatting";
    }

    let inlineWrap = navbar.querySelector(".nav-chat-search-inline");
    if (!inlineWrap) {
      inlineWrap = document.createElement("div");
      inlineWrap.className = "nav-chat-search-inline";

      if (infoDropdown) {
        infoDropdown.insertAdjacentElement("afterend", inlineWrap);
      } else {
        navbar.appendChild(inlineWrap);
      }
    }

    inlineWrap.appendChild(chatLink);
    inlineWrap.appendChild(form);

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
    label.innerHTML =
      '<span class="abacus-place-label">' + rodPlaceLabel(index) + '</span>' +
      '<span class="abacus-digit">0</span>';
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
   INDEX: Robust card dropdown links + search keyboard safety
   - Health/Finance dropdown links navigate normally
   - Search inputs never trigger calculator keyboard shortcuts
===================================================== */
(function () {
  "use strict";

  function isSearchTarget(target) {
    return !!(
      target &&
      target.closest &&
      target.closest(".site-search, .site-search-input, .site-search-box, .navbar-search, .search-bar, input[type='search']")
    );
  }

  ["keydown", "keypress", "keyup"].forEach(function (eventName) {
    document.addEventListener(eventName, function (event) {
      if (!isSearchTarget(event.target)) return;
      event.stopPropagation();
    }, true);
  });

  document.addEventListener("click", function (event) {
    var link = event.target && event.target.closest && event.target.closest("body.index-page .index-dropdown-card .group-links a");
    if (!link) return;

    var href = link.getAttribute("href");
    if (!href || href === "#") return;

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1) {
      return;
    }

    event.preventDefault();
    window.location.assign(href);
  }, true);
})();

/* =====================================================
   FINAL BMI / AGE RESULT LAYOUT POLISH
   - Centers Age next-age countdown
   - Makes BMI input/result boxes full-width and grouped
===================================================== */
(function () {
  "use strict";

  function installFinalAgeBmiStyle() {
    if (document.getElementById("finalAgeBmiResultStyle")) return;

    var style = document.createElement("style");
    style.id = "finalAgeBmiResultStyle";
    style.textContent = `
      body.age-page .age-live-countdown {
        width: 100% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        margin: 10px auto 16px !important;
      }

      body.age-page .age-live-countdown-line,
      body.age-page .age-live-countdown-line strong {
        width: 100% !important;
        display: block !important;
        text-align: center !important;
      }

      body.bmi-page .bmi-input-groups {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 16px !important;
        align-items: stretch !important;
        margin: 16px 0 22px !important;
        box-sizing: border-box !important;
      }

      body.bmi-page .bmi-input-group-box,
      body.bmi-page .bmi-body-box,
      body.bmi-page .bmi-goal-box,
      body.bmi-page .bmi-optional-box {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 16px 12px !important;
        color: var(--black, #000) !important;
        border: 5px solid var(--black, #000) !important;
        box-shadow: 6px 6px 0 var(--black, #000) !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }

      body.bmi-page .bmi-body-box { background: #d3fff9 !important; }
      body.bmi-page .bmi-goal-box { background: #fff4b8 !important; }
      body.bmi-page .bmi-optional-box { background: #b8ffb8 !important; }

      body.bmi-page .bmi-input-groups label,
      body.bmi-page .bmi-input-groups input,
      body.bmi-page .bmi-input-groups select {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        display: block !important;
        box-sizing: border-box !important;
      }

      body.bmi-page .bmi-input-groups label {
        margin: 0 0 7px !important;
        font-weight: bold !important;
        text-align: center !important;
      }

      body.bmi-page .bmi-input-groups input,
      body.bmi-page .bmi-input-groups select {
        margin: 0 0 14px !important;
      }

      body.bmi-page .bmi-extra-title {
        margin: 0 0 12px !important;
        font-weight: bold !important;
        text-align: center !important;
      }

      body.bmi-page .bmi-time-goal-row {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) minmax(120px, 0.7fr) !important;
        gap: 10px !important;
        align-items: center !important;
        margin: 0 0 14px !important;
        box-sizing: border-box !important;
      }

      body.bmi-page .bmi-time-goal-row input,
      body.bmi-page .bmi-time-goal-row select {
        margin: 0 !important;
        height: 52px !important;
      }

      body.bmi-page main.bmi-calculator-container > #bmiReportOutput,
      body.bmi-page main.pc-calculator-layout > #bmiReportOutput {
        grid-column: 1 / 3 !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        overflow: visible !important;
        box-sizing: border-box !important;
      }

      body.bmi-page #bmiReportOutput[hidden] {
        display: none !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-shell {
        width: 100% !important;
        display: block !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-main-box {
        width: 100% !important;
        margin: 0 !important;
        padding: 18px !important;
        background: #fff !important;
        border: 5px solid var(--black, #000) !important;
        box-shadow: 8px 8px 0 var(--black, #000) !important;
        box-sizing: border-box !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-title {
        text-align: center !important;
        margin: 0 0 16px !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-group-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 14px !important;
        width: 100% !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-group-box {
        padding: 14px !important;
        background: #f8f8f8 !important;
        border: 4px solid var(--black, #000) !important;
        box-shadow: 5px 5px 0 var(--black, #000) !important;
        box-sizing: border-box !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-group-box h3 {
        margin: 0 0 10px !important;
        text-align: center !important;
      }

      body.bmi-page #bmiReportOutput .bmi-point-result-list {
        margin: 0 !important;
        padding-left: 20px !important;
        text-align: left !important;
      }

      body.bmi-page #bmiReportOutput .bmi-point-result-list li {
        margin: 0 0 8px !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-actions {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 12px !important;
        margin-top: 18px !important;
        padding-top: 16px !important;
        border-top: 4px solid var(--black, #000) !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-action-btn {
        min-height: 52px !important;
        padding: 10px 14px !important;
        color: var(--black, #000) !important;
        border: 4px solid var(--black, #000) !important;
        box-shadow: 4px 4px 0 var(--black, #000) !important;
        font-family: inherit !important;
        font-weight: bold !important;
        cursor: pointer !important;
      }

      body.bmi-page #bmiReportOutput .bmi-copy-btn { background: #ffd3d3 !important; }
      body.bmi-page #bmiReportOutput .bmi-save-btn { background: #b8ffb8 !important; }
      body.bmi-page #bmiReportOutput .bmi-share-btn { background: #d3fff9 !important; }

      @media (max-width: 850px) {
        body.bmi-page .bmi-input-groups,
        body.bmi-page #bmiReportOutput .bmi-result-group-grid,
        body.bmi-page #bmiReportOutput .bmi-result-actions {
          grid-template-columns: 1fr !important;
        }

        body.bmi-page main.bmi-calculator-container > #bmiReportOutput,
        body.bmi-page main.pc-calculator-layout > #bmiReportOutput {
          grid-column: auto !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installFinalAgeBmiStyle);
  } else {
    installFinalAgeBmiStyle();
  }
})();

/* =====================================================
   BMI FINAL REQUEST POLISH
   - Male/Female only select handled in JS above
   - Daily/Weekly/Monthly time goal
   - Colorful cartoon BMI result cards
===================================================== */
(function () {
  "use strict";

  function installBmiCartoonResultStyle() {
    if (document.getElementById("bmiCartoonResultFinalStyle")) return;

    const style = document.createElement("style");
    style.id = "bmiCartoonResultFinalStyle";
    style.textContent = `
      body.bmi-page #bmiReportOutput .bmi-result-main-box {
        background: #fff7df !important;
        border: 5px solid var(--black, #000) !important;
        box-shadow: 9px 9px 0 var(--black, #000) !important;
      }

      body.bmi-page #bmiReportOutput .bmi-highlight-grid {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 14px !important;
        margin: 0 0 18px !important;
        box-sizing: border-box !important;
      }

      body.bmi-page #bmiReportOutput .bmi-highlight-card {
        min-width: 0 !important;
        padding: 16px 12px !important;
        color: var(--black, #000) !important;
        border: 5px solid var(--black, #000) !important;
        box-shadow: 6px 6px 0 var(--black, #000) !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }

      body.bmi-page #bmiReportOutput .bmi-highlight-bmi {
        background: #d3fff9 !important;
      }

      body.bmi-page #bmiReportOutput .bmi-highlight-category {
        background: #fff4b8 !important;
      }

      body.bmi-page #bmiReportOutput .bmi-highlight-difference {
        background: #ffd3d3 !important;
      }

      body.bmi-page #bmiReportOutput .bmi-highlight-label {
        margin-bottom: 8px !important;
        font-weight: bold !important;
        line-height: 1.2 !important;
      }

      body.bmi-page #bmiReportOutput .bmi-highlight-value {
        font-size: 24px !important;
        line-height: 1.15 !important;
        font-weight: bold !important;
        overflow-wrap: break-word !important;
      }

      body.bmi-page #bmiReportOutput .bmi-highlight-value-only .bmi-highlight-value {
        margin-top: 0 !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-group-health {
        background: #e7f0ff !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-group-calorie {
        background: #ffe4f2 !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-group-goal {
        background: #e6ffd8 !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-group-profile {
        background: #f0e6ff !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-group-other {
        background: #f8f8f8 !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-group-box {
        border-radius: 0 !important;
      }

      body.bmi-page #bmiReportOutput .bmi-result-actions {
        background: #fff !important;
        border-top: 5px solid var(--black, #000) !important;
      }

      @media (max-width: 850px) {
        body.bmi-page #bmiReportOutput .bmi-highlight-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installBmiCartoonResultStyle);
  } else {
    installBmiCartoonResultStyle();
  }
})();


/* =====================================================
   BMI FINAL LAYOUT CLEANUP
   - Hide BMI category and difference from visible result box
   - Body details beside stacked Activity and Optional Target boxes
===================================================== */
(function () {
  "use strict";

  function installBmiFinalLayoutCleanup() {
    if (document.getElementById("bmiFinalLayoutCleanupStyle")) return;

    const style = document.createElement("style");
    style.id = "bmiFinalLayoutCleanupStyle";
    style.textContent = `
      body.bmi-page .bmi-input-groups {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr) !important;
        grid-template-areas:
          "body goal"
          "body optional" !important;
        gap: 16px !important;
        align-items: stretch !important;
      }

      body.bmi-page .bmi-body-box {
        grid-area: body !important;
      }

      body.bmi-page .bmi-goal-box {
        grid-area: goal !important;
      }

      body.bmi-page .bmi-optional-box {
        grid-area: optional !important;
      }

      body.bmi-page #bmiReportOutput .bmi-highlight-grid,
      body.bmi-page #bmiReportOutput .bmi-highlight-grid-single {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        max-width: none !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }

      body.bmi-page #bmiReportOutput .bmi-highlight-value-only .bmi-highlight-label {
        display: none !important;
      }

      body.bmi-page #bmiReportOutput .bmi-highlight-category,
      body.bmi-page #bmiReportOutput .bmi-highlight-difference {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
      }

      @media (max-width: 850px) {
        body.bmi-page .bmi-input-groups {
          grid-template-columns: 1fr !important;
          grid-template-areas:
            "body"
            "goal"
            "optional" !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installBmiFinalLayoutCleanup);
  } else {
    installBmiFinalLayoutCleanup();
  }
})();


/* =====================================================
   BMI TYPING FIX: Wait while typing + keep input focused
   - Prevents BMI result refresh from stealing focus after first number
   - Calculates after user stops typing instead of every keystroke
===================================================== */
(function () {
  "use strict";

  let bmiTypingTimer = null;
  let bmiComposing = false;

  function isBmiPage() {
    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      !!document.getElementById("bmiResult") ||
      (!!document.getElementById("weight") && !!document.getElementById("height"))
    );
  }

  function isBmiInput(el) {
    if (!el || !isBmiPage()) return false;

    return [
      "bmiName",
      "name",
      "weight",
      "height",
      "waist",
      "bmiAge",
      "age",
      "gender",
      "sex",
      "activityLevel",
      "bmiActivityLevel",
      "timeGoal",
      "timeGoalValue",
      "timeGoalUnit",
      "targetWeight",
      "targetWaist",
      "bmiNeck",
      "bmiWrist",
      "bmiShoulder",
      "bmiHip"
    ].includes(el.id);
  }

  function valueOf(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function readyForBmi() {
    return valueOf("weight") !== "" && valueOf("height") !== "";
  }

  function saveFocusState() {
    const el = document.activeElement;

    if (!isBmiInput(el)) return null;

    return {
      id: el.id,
      start: typeof el.selectionStart === "number" ? el.selectionStart : null,
      end: typeof el.selectionEnd === "number" ? el.selectionEnd : null
    };
  }

  function restoreFocusState(state) {
    if (!state || !state.id) return;

    const el = document.getElementById(state.id);
    if (!el) return;

    if (document.activeElement !== el) {
      el.focus({ preventScroll: true });
    }

    if (
      state.start !== null &&
      state.end !== null &&
      typeof el.setSelectionRange === "function"
    ) {
      try {
        el.setSelectionRange(state.start, state.end);
      } catch {
        /* number inputs may not allow selection range */
      }
    }
  }

  function runBmiAfterTyping() {
    if (!isBmiPage()) return;
    if (!readyForBmi()) return;
    if (bmiComposing) return;

    const focusState = saveFocusState();

    try {
      if (typeof window.calculateBMI === "function") {
        window.calculateBMI();
      } else if (typeof window.calculateBmi === "function") {
        window.calculateBmi();
      }
    } catch (error) {
      console.error("BMI delayed auto calculate error:", error);
    }

    setTimeout(function () {
      restoreFocusState(focusState);
    }, 0);
  }

  function scheduleBmiAfterTyping(event) {
    if (!isBmiInput(event.target)) return;

    clearTimeout(bmiTypingTimer);

    /*
      Wait enough time for the user to finish typing multi-digit values.
      Example: typing 170 will not calculate after only "1".
    */
    bmiTypingTimer = setTimeout(runBmiAfterTyping, 2000);
  }

  function startBmiTypingFix() {
    if (!isBmiPage()) return;

    document.addEventListener("compositionstart", function (event) {
      if (isBmiInput(event.target)) bmiComposing = true;
    }, true);

    document.addEventListener("compositionend", function (event) {
      if (!isBmiInput(event.target)) return;
      bmiComposing = false;
      scheduleBmiAfterTyping(event);
    }, true);

    document.addEventListener("input", scheduleBmiAfterTyping, true);
    document.addEventListener("change", scheduleBmiAfterTyping, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBmiTypingFix);
  } else {
    startBmiTypingFix();
  }
})();


/* =====================================================
   MORTGAGE: Optional cost + early settlement dropdowns
   - Makes both sections collapsible
   - Adds arrow state: ▼ closed / ▲ open
   - Mortgage page only
===================================================== */
(function () {
  "use strict";

  function text(el) {
    return String(el ? el.textContent || "" : "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isMortgagePage() {
    const title = text(document.querySelector("h1"));
    const path = window.location.pathname.toLowerCase();

    return (
      path.includes("mortgage") ||
      path.includes("loan-calculator") ||
      title.includes("mortgage") ||
      !!document.getElementById("loanResult") ||
      !!document.getElementById("loanHistoryList") ||
      !!document.getElementById("otherMonthlyFees") ||
      !!document.getElementById("downPayment") ||
      !!document.getElementById("propertyTaxYearly") ||
      !!document.querySelector(".optional-mortgage-costs") ||
      !!document.querySelector(".early-settlement-box")
    );
  }

  function ensureId(el, prefix) {
    if (!el.id) {
      el.id = prefix + "-" + Math.random().toString(36).slice(2, 8);
    }

    return el.id;
  }

  function getDirectChildrenAfterToggle(box, toggle) {
    return Array.from(box.children).filter(function (child) {
      return child !== toggle;
    });
  }

  function wrapDropdownContent(box, toggle, contentClass) {
    let content = box.querySelector(":scope > ." + contentClass);

    if (!content) {
      content = document.createElement("div");
      content.className = contentClass;

      getDirectChildrenAfterToggle(box, toggle).forEach(function (child) {
        content.appendChild(child);
      });

      box.appendChild(content);
    }

    return content;
  }

  function setDropdownState(box, toggle, content, open) {
    box.classList.toggle("mortgage-dropdown-open", open);
    box.classList.toggle("mortgage-dropdown-closed", !open);

    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    content.hidden = !open;
  }

  function setupDropdown(box, options) {
    if (!box) return;

    const titleText = options.title;
    const toggleClass = options.toggleClass;
    const contentClass = options.contentClass;

    let toggle = box.querySelector(":scope > ." + toggleClass);

    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = toggleClass + " mortgage-dropdown-toggle";
      toggle.textContent = titleText;
      box.insertAdjacentElement("afterbegin", toggle);
    } else {
      toggle.classList.add("mortgage-dropdown-toggle");
      if (!text(toggle).replace(/[▼▲]/g, "").trim()) {
        toggle.textContent = titleText;
      }
    }

    const content = wrapDropdownContent(box, toggle, contentClass);
    const contentId = ensureId(content, contentClass);

    toggle.setAttribute("aria-controls", contentId);

    if (!box.dataset.mortgageDropdownReady) {
      box.dataset.mortgageDropdownReady = "yes";
      setDropdownState(box, toggle, content, false);

      toggle.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        setDropdownState(box, toggle, content, !isOpen);
      });
    }
  }

  function setupMortgageDropdowns() {
    if (!isMortgagePage()) return;

    document.body.classList.add("loan-page");

    setupDropdown(document.querySelector(".optional-mortgage-costs"), {
      title: "Optional costs",
      toggleClass: "optional-mortgage-toggle",
      contentClass: "optional-mortgage-content"
    });

    setupDropdown(document.querySelector(".early-settlement-box"), {
      title: "Optional early settlement",
      toggleClass: "early-settlement-toggle",
      contentClass: "early-settlement-content"
    });
  }

  function start() {
    setupMortgageDropdowns();

    setTimeout(setupMortgageDropdowns, 300);
    setTimeout(setupMortgageDropdowns, 900);
    setTimeout(setupMortgageDropdowns, 1600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   MORTGAGE INPUT LAYOUT: Costs below home, extra below loan
   - Left column: Home details + Optional costs
   - Right column: Loan details + Extra payment / settlement
===================================================== */
(function () {
  "use strict";

  function text(el) {
    return String(el ? el.textContent || "" : "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isMortgagePage() {
    const title = text(document.querySelector("h1"));
    const path = window.location.pathname.toLowerCase();

    return (
      path.includes("mortgage") ||
      title.includes("mortgage") ||
      !!document.getElementById("loanResult") ||
      !!document.querySelector(".mortgage-home-box") ||
      !!document.querySelector(".mortgage-loan-box") ||
      !!document.querySelector(".optional-mortgage-costs") ||
      !!document.querySelector(".early-settlement-box")
    );
  }

  function findBoxByTitle(patterns) {
    const boxes = Array.from(document.querySelectorAll(
      ".mortgage-input-box, .mortgage-home-box, .mortgage-loan-box, .optional-mortgage-costs, .early-settlement-box, .loan-optional-row > *"
    ));

    return boxes.find(function (box) {
      const title = text(box.querySelector(".bmi-extra-title, .mortgage-box-title, h2, h3, button, .optional-mortgage-toggle, .early-settlement-toggle") || box);
      return patterns.some(function (pattern) {
        return pattern.test(title);
      });
    }) || null;
  }

  function getHomeBox() {
    return (
      document.querySelector(".mortgage-home-box") ||
      document.querySelector(".mortgage-home-details-box") ||
      findBoxByTitle([/home details/, /property details/, /home info/])
    );
  }

  function getLoanBox() {
    return (
      document.querySelector(".mortgage-loan-box") ||
      document.querySelector(".mortgage-loan-details-box") ||
      findBoxByTitle([/loan details/, /financing details/, /loan info/])
    );
  }

  function getOptionalCostBox() {
    return (
      document.querySelector(".optional-mortgage-costs") ||
      findBoxByTitle([/optional costs/, /property tax/, /insurance/, /monthly fee/])
    );
  }

  function getExtraSettlementBox() {
    return (
      document.querySelector(".early-settlement-box") ||
      document.querySelector(".mortgage-extra-payment-box") ||
      findBoxByTitle([/extra payment/, /early settlement/, /settlement/])
    );
  }

  function moveTo(parent, child) {
    if (!parent || !child) return;

    if (child.parentElement !== parent) {
      parent.appendChild(child);
    }
  }

  function organizeMortgageInputs() {
    if (!isMortgagePage()) return;

    const calculator = document.querySelector(".calculator");
    if (!calculator) return;

    const homeBox = getHomeBox();
    const loanBox = getLoanBox();
    const optionalCostBox = getOptionalCostBox();
    const extraSettlementBox = getExtraSettlementBox();

    if (!homeBox && !loanBox && !optionalCostBox && !extraSettlementBox) return;

    let layout = document.querySelector(".mortgage-two-column-input-layout");

    if (!layout) {
      layout = document.createElement("div");
      layout.className = "mortgage-two-column-input-layout";

      const firstBox = homeBox || loanBox || optionalCostBox || extraSettlementBox;
      if (firstBox && firstBox.parentElement) {
        firstBox.parentElement.insertBefore(layout, firstBox);
      } else {
        calculator.appendChild(layout);
      }
    }

    let leftCol = layout.querySelector(".mortgage-left-input-column");
    let rightCol = layout.querySelector(".mortgage-right-input-column");

    if (!leftCol) {
      leftCol = document.createElement("div");
      leftCol.className = "mortgage-left-input-column";
      layout.appendChild(leftCol);
    }

    if (!rightCol) {
      rightCol = document.createElement("div");
      rightCol.className = "mortgage-right-input-column";
      layout.appendChild(rightCol);
    }

    moveTo(leftCol, homeBox);
    moveTo(leftCol, optionalCostBox);

    moveTo(rightCol, loanBox);
    moveTo(rightCol, extraSettlementBox);

    if (optionalCostBox) {
      optionalCostBox.classList.add("mortgage-box-under-home");
    }

    if (extraSettlementBox) {
      extraSettlementBox.classList.add("mortgage-box-under-loan");
    }
  }

  function start() {
    organizeMortgageInputs();

    /*
      Existing mortgage scripts may create dropdown boxes after page load,
      so run a few delayed passes without using a continuous observer.
    */
    setTimeout(organizeMortgageInputs, 200);
    setTimeout(organizeMortgageInputs, 700);
    setTimeout(organizeMortgageInputs, 1400);
    setTimeout(organizeMortgageInputs, 2400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   MORTGAGE: Remove old result-table box + side copy button
   - Hides/removes the older result box that contains the table
   - Removes the copy button beside that old result box
   - Keeps the newer mortgage output/report sections untouched
===================================================== */
(function () {
  "use strict";

  function text(el) {
    return String(el ? el.textContent || "" : "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isMortgagePage() {
    const title = text(document.querySelector("h1"));
    const path = window.location.pathname.toLowerCase();

    return (
      path.includes("mortgage") ||
      title.includes("mortgage") ||
      !!document.getElementById("loanResult") ||
      !!document.getElementById("loanExternalOutput") ||
      !!document.querySelector(".mortgage-output-panel")
    );
  }

  function isOldMortgageResultBox(el) {
    if (!el) return false;

    const hasTable = !!el.querySelector("table");
    const content = text(el);

    if (!hasTable) return false;

    return (
      content.includes("monthly payment") ||
      content.includes("principal") ||
      content.includes("interest") ||
      content.includes("remaining balance") ||
      content.includes("total payment")
    );
  }

  function removeOldMortgageResultBox() {
    if (!isMortgagePage()) return;

    /*
      The older mortgage result box usually lives in #loanResult or #loanExternalOutput.
      Newer mortgage sections use their own mortgage output panels, so this targets the old
      table result area only.
    */
    [
      document.getElementById("loanResult"),
      document.getElementById("loanExternalOutput"),
      document.getElementById("universalLoanStyleOutput")
    ].forEach(function (box) {
      if (!box) return;

      if (box.classList.contains("mortgage-modern-result-panel") || box.querySelector(".mortgage-modern-output")) {
        box.hidden = false;
        box.style.setProperty("display", "block", "important");
        box.style.setProperty("visibility", "visible", "important");
        box.removeAttribute("aria-hidden");
        return;
      }

      if (isOldMortgageResultBox(box)) {
        box.innerHTML = "";
        box.style.setProperty("display", "none", "important");
        box.setAttribute("aria-hidden", "true");
      }
    });

    /*
      Remove side copy buttons beside the old result area only.
    */
    document
      .querySelectorAll(
        ".loan-copy-side, " +
        ".mortgage-old-copy-button, " +
        "#loanResultCopyButton, " +
        "#copyLoanResult, " +
        "#loanCopyButton"
      )
      .forEach(function (button) {
        button.remove();
      });

    /*
      Some versions place a plain copy button next to the old result box.
    */
    document.querySelectorAll("button").forEach(function (button) {
      const btnText = text(button);
      if (btnText !== "copy" && btnText !== "copy result") return;

      const parent = button.parentElement;
      if (!parent) return;

      if (
        parent.querySelector("#loanResult") ||
        parent.querySelector("#loanExternalOutput") ||
        parent.className.toString().toLowerCase().includes("loan-result") ||
        parent.className.toString().toLowerCase().includes("mortgage-result")
      ) {
        button.remove();
      }
    });
  }

  function start() {
    removeOldMortgageResultBox();

    setTimeout(removeOldMortgageResultBox, 200);
    setTimeout(removeOldMortgageResultBox, 700);
    setTimeout(removeOldMortgageResultBox, 1400);

    document.addEventListener("input", function () {
      setTimeout(removeOldMortgageResultBox, 350);
      setTimeout(removeOldMortgageResultBox, 900);
    }, true);

    document.addEventListener("change", function () {
      setTimeout(removeOldMortgageResultBox, 350);
      setTimeout(removeOldMortgageResultBox, 900);
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   MORTGAGE ONLY: Mark mortgage page for width repair
===================================================== */
(function () {
  "use strict";

  function isMortgagePage() {
    const title = String(document.querySelector("h1")?.textContent || "").toLowerCase();
    const path = window.location.pathname.toLowerCase();

    return (
      path.includes("mortgage") ||
      title.includes("mortgage") ||
      !!document.getElementById("loanResult") ||
      !!document.getElementById("loanHistoryList") ||
      !!document.querySelector(".mortgage-two-column-input-layout")
    );
  }

  function markMortgagePage() {
    if (!isMortgagePage()) return;

    document.body.classList.add("mortgage-page");
    document.body.classList.add("loan-page");

    const layout = document.querySelector(".mortgage-two-column-input-layout");
    if (layout) {
      layout.style.width = "100%";
      layout.style.maxWidth = "100%";
      layout.style.boxSizing = "border-box";
    }

    document
      .querySelectorAll(
        ".mortgage-left-input-column, .mortgage-right-input-column, " +
        ".mortgage-input-box, .mortgage-home-box, .mortgage-loan-box, " +
        ".optional-mortgage-costs, .early-settlement-box"
      )
      .forEach(function (el) {
        el.style.width = "100%";
        el.style.maxWidth = "100%";
        el.style.boxSizing = "border-box";
      });
  }

  function start() {
    markMortgagePage();
    setTimeout(markMortgagePage, 200);
    setTimeout(markMortgagePage, 700);
    setTimeout(markMortgagePage, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   MORTGAGE ONLY: Force real width classes/inline cleanup
   - Removes old narrow inline widths from mortgage boxes only
===================================================== */
(function () {
  "use strict";

  function isMortgagePage() {
    const title = String(document.querySelector("h1")?.textContent || "").toLowerCase();
    const path = window.location.pathname.toLowerCase();

    return (
      path.includes("mortgage") ||
      title.includes("mortgage") ||
      !!document.getElementById("loanResult") ||
      !!document.getElementById("loanHistoryList") ||
      !!document.querySelector(".mortgage-two-column-input-layout")
    );
  }

  function cleanMortgageWidths() {
    if (!isMortgagePage()) return;

    document.body.classList.add("mortgage-page");
    document.body.classList.add("loan-page");

    const selector = [
      ".mortgage-two-column-input-layout",
      ".mortgage-left-input-column",
      ".mortgage-right-input-column",
      ".mortgage-input-box",
      ".mortgage-home-box",
      ".mortgage-loan-box",
      ".mortgage-home-details-box",
      ".mortgage-loan-details-box",
      ".optional-mortgage-costs",
      ".early-settlement-box",
      ".optional-mortgage-toggle",
      ".early-settlement-toggle",
      ".optional-mortgage-content",
      ".early-settlement-content"
    ].join(",");

    document.querySelectorAll(selector).forEach(function (el) {
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("max-width", "none", "important");
      el.style.setProperty("min-width", "0", "important");
      el.style.setProperty("box-sizing", "border-box", "important");
    });

    document
      .querySelectorAll(
        ".mortgage-input-box input, .mortgage-input-box select, " +
        ".mortgage-home-box input, .mortgage-home-box select, " +
        ".mortgage-loan-box input, .mortgage-loan-box select, " +
        ".mortgage-home-details-box input, .mortgage-home-details-box select, " +
        ".mortgage-loan-details-box input, .mortgage-loan-details-box select, " +
        ".optional-mortgage-content input, .optional-mortgage-content select, " +
        ".early-settlement-content input, .early-settlement-content select"
      )
      .forEach(function (el) {
        el.style.setProperty("width", "100%", "important");
        el.style.setProperty("max-width", "100%", "important");
        el.style.setProperty("min-width", "0", "important");
        el.style.setProperty("box-sizing", "border-box", "important");
      });
  }

  function start() {
    cleanMortgageWidths();

    setTimeout(cleanMortgageWidths, 100);
    setTimeout(cleanMortgageWidths, 400);
    setTimeout(cleanMortgageWidths, 900);
    setTimeout(cleanMortgageWidths, 1800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   MORTGAGE ONLY: Escape old input grid wrapper
   - Fixes squeezed/narrow mortgage input boxes
   - The previous layout wrapper was being inserted inside the old grid,
     so it only occupied one narrow grid column.
===================================================== */
(function () {
  "use strict";

  function isMortgagePage() {
    const title = String(document.querySelector("h1")?.textContent || "").toLowerCase();
    const path = window.location.pathname.toLowerCase();

    return (
      path.includes("mortgage") ||
      title.includes("mortgage") ||
      !!document.querySelector(".mortgage-input-grid") ||
      !!document.querySelector(".mortgage-two-column-input-layout")
    );
  }

  function fixMortgageGridWrapper() {
    if (!isMortgagePage()) return;

    document.body.classList.add("mortgage-page", "loan-page");

    const layout = document.querySelector(".mortgage-two-column-input-layout");
    const oldGrid = document.querySelector(".mortgage-input-grid");
    const calculator = document.querySelector(".calculator");

    if (!layout || !oldGrid || !calculator) return;

    /*
      If the new layout is inside the old .mortgage-input-grid,
      the old grid squeezes it into one column. Move it outside.
    */
    if (oldGrid.contains(layout)) {
      oldGrid.insertAdjacentElement("beforebegin", layout);
    }

    /*
      After the boxes are moved, the old grid should be empty/unused.
      Hide it so it cannot reserve space or affect widths.
    */
    if (!oldGrid.querySelector(".mortgage-input-box")) {
      oldGrid.style.setProperty("display", "none", "important");
      oldGrid.setAttribute("aria-hidden", "true");
    }

    layout.style.setProperty("width", "100%", "important");
    layout.style.setProperty("max-width", "100%", "important");
    layout.style.setProperty("box-sizing", "border-box", "important");

    document
      .querySelectorAll(
        ".mortgage-left-input-column, .mortgage-right-input-column, " +
        ".mortgage-left-input-column > *, .mortgage-right-input-column > *"
      )
      .forEach(function (el) {
        el.style.setProperty("width", "100%", "important");
        el.style.setProperty("max-width", "100%", "important");
        el.style.setProperty("min-width", "0", "important");
        el.style.setProperty("box-sizing", "border-box", "important");
      });
  }

  function start() {
    fixMortgageGridWrapper();

    /*
      Older mortgage organizers run a few delayed passes.
      Run after them so the wrapper stays outside the old grid.
    */
    setTimeout(fixMortgageGridWrapper, 250);
    setTimeout(fixMortgageGridWrapper, 800);
    setTimeout(fixMortgageGridWrapper, 1600);
    setTimeout(fixMortgageGridWrapper, 2600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   MORTGAGE: Keep optional dropdowns visible after input
   - Safety pass for auto-calculate / delayed layout scripts
===================================================== */
(function () {
  "use strict";

  function isMortgagePage() {
    const title = String(document.querySelector("h1")?.textContent || "").toLowerCase();
    const path = window.location.pathname.toLowerCase();

    return (
      path.includes("mortgage") ||
      title.includes("mortgage") ||
      !!document.querySelector(".mortgage-two-column-input-layout")
    );
  }

  function keepMortgageOptionalVisible() {
    if (!isMortgagePage()) return;

    const layout = document.querySelector(".mortgage-two-column-input-layout");
    const left = layout ? layout.querySelector(".mortgage-left-input-column") : null;
    const right = layout ? layout.querySelector(".mortgage-right-input-column") : null;

    const optional = document.querySelector(".optional-mortgage-costs");
    const early = document.querySelector(".early-settlement-box");

    if (left && optional && optional.parentElement !== left) {
      left.appendChild(optional);
    }

    if (right && early && early.parentElement !== right) {
      right.appendChild(early);
    }

    [optional, early].forEach(function (box) {
      if (!box) return;
      box.style.setProperty("display", "block", "important");
      box.style.setProperty("visibility", "visible", "important");
      box.style.setProperty("opacity", "1", "important");
    });
  }

  function start() {
    keepMortgageOptionalVisible();

    setTimeout(keepMortgageOptionalVisible, 150);
    setTimeout(keepMortgageOptionalVisible, 600);
    setTimeout(keepMortgageOptionalVisible, 1200);

    document.addEventListener("input", function () {
      setTimeout(keepMortgageOptionalVisible, 50);
      setTimeout(keepMortgageOptionalVisible, 350);
    }, true);

    document.addEventListener("change", function () {
      setTimeout(keepMortgageOptionalVisible, 50);
      setTimeout(keepMortgageOptionalVisible, 350);
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   MORTGAGE: Keep modern result box visible
   - Fixes hidden bottom result caused by old table-removal CSS/JS
===================================================== */
(function () {
  "use strict";

  function revealMortgageModernResult() {
    const panel = document.getElementById("loanExternalOutput");

    if (!panel || !panel.classList.contains("mortgage-modern-result-panel")) return;

    panel.hidden = false;
    panel.style.setProperty("display", "block", "important");
    panel.style.setProperty("visibility", "visible", "important");
    panel.style.setProperty("opacity", "1", "important");
    panel.removeAttribute("aria-hidden");
  }

  function start() {
    revealMortgageModernResult();

    setTimeout(revealMortgageModernResult, 100);
    setTimeout(revealMortgageModernResult, 500);
    setTimeout(revealMortgageModernResult, 1100);

    document.addEventListener("input", function () {
      setTimeout(revealMortgageModernResult, 400);
      setTimeout(revealMortgageModernResult, 900);
    }, true);

    document.addEventListener("change", function () {
      setTimeout(revealMortgageModernResult, 400);
      setTimeout(revealMortgageModernResult, 900);
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   AGE REPORT: Prevent duplicate live result below report
   - Stops delayed Age online updates from showing a second result box
===================================================== */
(function () {
  "use strict";

  function hideAgeLiveResultDuringReport() {
    if (!document.body.classList.contains("calculator-report-view")) return;

    document
      .querySelectorAll(".age-clean-result, .age-point-output, #ageResult")
      .forEach(function (el) {
        if (el.closest("#calculatorReportPage")) return;
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.setAttribute("aria-hidden", "true");
      });
  }

  function start() {
    hideAgeLiveResultDuringReport();

    setTimeout(hideAgeLiveResultDuringReport, 100);
    setTimeout(hideAgeLiveResultDuringReport, 500);
    setTimeout(hideAgeLiveResultDuringReport, 1200);
    setTimeout(hideAgeLiveResultDuringReport, 2200);

    window.addEventListener("hashchange", function () {
      setTimeout(hideAgeLiveResultDuringReport, 100);
      setTimeout(hideAgeLiveResultDuringReport, 700);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   MORTGAGE: Auto-fill start date with today's date
===================================================== */
(function () {
  "use strict";

  function todayIso() {
    const now = new Date();
    return now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");
  }

  function isMortgagePage() {
    const title = String(document.querySelector("h1")?.textContent || "").toLowerCase();
    const path = window.location.pathname.toLowerCase();

    return (
      path.includes("mortgage") ||
      title.includes("mortgage") ||
      !!document.getElementById("startDate") ||
      !!document.querySelector(".mortgage-two-column-input-layout")
    );
  }

  function fillStartDate() {
    if (!isMortgagePage()) return;

    const input = document.getElementById("startDate");
    if (input && !input.value) {
      input.value = todayIso();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fillStartDate);
  } else {
    fillStartDate();
  }

  setTimeout(fillStartDate, 300);
  setTimeout(fillStartDate, 1000);
})();


/* =====================================================
   FULL NAV REBUILD: Clean top menu + clean side/open menu
   - Replaces old navbar contents from scratch
   - Removes old weird gaps / wrapped search / broken chat placement
   - Keeps calculator dropdown, info dropdown, chatting, and search
===================================================== */
(function () {
  "use strict";

  const calculators = [
    { title: "basic", url: "basic-calculator.html" },
    { title: "scientific", url: "scientific-calculator.html" },
    { title: "percentage", url: "percentage-calculator.html" },
    { title: "unit converter", url: "unit-converter-calculator.html" },

    { title: "age", url: "age-calculator.html" },
    { title: "bmi", url: "bmi-calculator.html" },

    { title: "salary", url: "salary-calculator.html" },
    { title: "gaji penjawat awam", url: "gaji-penjawat-awam-calculator.html" },
    { title: "tax", url: "tax-calculator.html" },
    { title: "currency converter", url: "currency-converter.html" },
    { title: "discount", url: "discount-calculator.html" },
    { title: "inflation", url: "inflation-calculator.html" },
    { title: "compound interest", url: "compound-interest-calculator.html" },

    { title: "mortgage", url: "mortgage-calculator.html" },
    { title: "personal loan", url: "personal-loan-calculator.html" },
    { title: "loan comparison", url: "loan-comparison-calculator.html" },
    { title: "debt payoff", url: "debt-payoff-calculator.html" },
    { title: "credit card payoff", url: "credit-card-payoff-calculator.html" },
    { title: "credit card interest", url: "credit-card-interest-calculator.html" },

    { title: "rental yield", url: "rental-yield-calculator.html" },
    { title: "fuel cost", url: "fuel-cost-calculator.html" }
  ];

  function normalize(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function closeAllDropdowns(nav) {
    nav.querySelectorAll(".clean-nav-dropdown.is-open").forEach(function (dropdown) {
      dropdown.classList.remove("is-open");
      const button = dropdown.querySelector(".clean-nav-button");
      if (button) button.setAttribute("aria-expanded", "false");
    });
  }

  function buildNavHtml() {
    return (
      '<div class="clean-nav-inner">' +
        '<a class="clean-nav-link" href="index.html">home</a>' +

        '<div class="clean-nav-dropdown clean-calculator-dropdown">' +
          '<button type="button" class="clean-nav-link clean-nav-button" aria-expanded="false">calculator <span aria-hidden="true">▼</span></button>' +
          '<div class="clean-nav-dropdown-panel clean-calculator-panel">' +

            '<div class="clean-nav-submenu clean-general-submenu">' +
              '<button type="button" class="clean-nav-panel-row clean-nav-submenu-button">general tools <span aria-hidden="true">▶</span></button>' +
              '<div class="clean-nav-submenu-panel">' +
                '<a href="basic-calculator.html">basic calculator</a>' +
                '<a href="scientific-calculator.html">scientific calculator</a>' +
                '<a href="percentage-calculator.html">percentage calculator</a>' +
                '<a href="unit-converter-calculator.html">unit converter</a>' +
              '</div>' +
            '</div>' +

            '<div class="clean-nav-submenu clean-health-submenu">' +
              '<button type="button" class="clean-nav-panel-row clean-nav-submenu-button">health & age <span aria-hidden="true">▶</span></button>' +
              '<div class="clean-nav-submenu-panel">' +
                '<a href="age-calculator.html">age calculator</a>' +
                '<a href="bmi-calculator.html">bmi calculator</a>' +
              '</div>' +
            '</div>' +

            '<div class="clean-nav-submenu clean-money-submenu">' +
              '<button type="button" class="clean-nav-panel-row clean-nav-submenu-button">money & income <span aria-hidden="true">▶</span></button>' +
              '<div class="clean-nav-submenu-panel">' +
                '<a href="salary-calculator.html">salary calculator</a>' +
                '<a href="gaji-penjawat-awam-calculator.html">gaji penjawat awam</a>' +
                '<a href="tax-calculator.html">tax calculator</a>' +
                '<a href="currency-converter.html">currency converter</a>' +
                '<a href="discount-calculator.html">discount calculator</a>' +
                '<a href="inflation-calculator.html">inflation calculator</a>' +
                '<a href="compound-interest-calculator.html">compound interest</a>' +
              '</div>' +
            '</div>' +

            '<div class="clean-nav-submenu clean-loan-submenu">' +
              '<button type="button" class="clean-nav-panel-row clean-nav-submenu-button">loans & debt <span aria-hidden="true">▶</span></button>' +
              '<div class="clean-nav-submenu-panel">' +
                '<a href="mortgage-calculator.html">mortgage calculator</a>' +
                '<a href="personal-loan-calculator.html">personal loan</a>' +
                '<a href="loan-comparison-calculator.html">loan comparison</a>' +
                '<a href="debt-payoff-calculator.html">debt payoff</a>' +
                '<a href="credit-card-payoff-calculator.html">credit card payoff</a>' +
                '<a href="credit-card-interest-calculator.html">credit card interest</a>' +
              '</div>' +
            '</div>' +

            '<div class="clean-nav-submenu clean-property-submenu">' +
              '<button type="button" class="clean-nav-panel-row clean-nav-submenu-button">property & travel <span aria-hidden="true">▶</span></button>' +
              '<div class="clean-nav-submenu-panel">' +
                '<a href="rental-yield-calculator.html">rental yield</a>' +
                '<a href="fuel-cost-calculator.html">fuel cost</a>' +
              '</div>' +
            '</div>' +

          '</div>' +
        '</div>' +

        '<div class="clean-nav-dropdown clean-info-dropdown">' +
          '<button type="button" class="clean-nav-link clean-nav-button" aria-expanded="false">info <span aria-hidden="true">▼</span></button>' +
          '<div class="clean-nav-dropdown-panel clean-info-panel">' +
            '<a href="about.html">about</a>' +
            '<a href="FAQS.html">FAQs</a>' +
            '<a href="privacy-policy.html">privacy policy</a>' +
            '<a href="contact.html">contact</a>' +
          '</div>' +
        '</div>' +

        '<a class="clean-nav-link clean-chat-link" href="chatting.html">chatting</a>' +

        '<form class="clean-nav-search" role="search" autocomplete="off">' +
          '<label class="clean-nav-search-label" for="cleanCalculatorSearchInput">Search calculator</label>' +
          '<input id="cleanCalculatorSearchInput" class="clean-nav-search-input" type="search" placeholder="search calculator" aria-label="Search calculator">' +
          '<button type="submit" class="clean-nav-search-button" aria-label="Search">🔍</button>' +
          '<ul class="clean-nav-search-results" hidden></ul>' +
        '</form>' +
      '</div>'
    );
  }

  function setupDropdowns(nav) {
    const dropdowns = Array.from(nav.querySelectorAll(".clean-nav-dropdown"));
    const submenus = Array.from(nav.querySelectorAll(".clean-nav-submenu"));
    let closeTimer = null;

    function clearCloseTimer() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function setDropdownOpen(dropdown, open) {
      const button = dropdown.querySelector(".clean-nav-button");
      dropdown.classList.toggle("is-open", !!open);
      if (button) button.setAttribute("aria-expanded", open ? "true" : "false");

      if (!open) {
        dropdown.querySelectorAll(".clean-nav-submenu.is-open").forEach(function (submenu) {
          submenu.classList.remove("is-open");
        });
      }
    }

    function closeAllDropdownsExcept(except) {
      dropdowns.forEach(function (dropdown) {
        if (dropdown !== except) setDropdownOpen(dropdown, false);
      });
    }

    function closeSubmenusExcept(submenu) {
      const parentPanel = submenu ? submenu.closest(".clean-nav-dropdown-panel") : null;

      submenus.forEach(function (item) {
        if (item === submenu) return;

        /*
          Close siblings in the same calculator panel when hovering/clicking
          another category. This stops multiple flyout boxes from staying open.
        */
        if (!parentPanel || item.closest(".clean-nav-dropdown-panel") === parentPanel) {
          item.classList.remove("is-open");
        }
      });
    }

    function openDropdown(dropdown) {
      clearCloseTimer();
      closeAllDropdownsExcept(dropdown);
      setDropdownOpen(dropdown, true);
    }

    function closeEverything() {
      dropdowns.forEach(function (dropdown) {
        setDropdownOpen(dropdown, false);
      });

      submenus.forEach(function (submenu) {
        submenu.classList.remove("is-open");
      });
    }

    dropdowns.forEach(function (dropdown) {
      const button = dropdown.querySelector(".clean-nav-button");
      if (!button) return;

      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        const isOpen = dropdown.classList.contains("is-open");
        closeAllDropdownsExcept(dropdown);
        setDropdownOpen(dropdown, !isOpen);
      });

      dropdown.addEventListener("mouseenter", function () {
        openDropdown(dropdown);
      });

      dropdown.addEventListener("focusin", function () {
        openDropdown(dropdown);
      });
    });

    submenus.forEach(function (submenu) {
      const button = submenu.querySelector(".clean-nav-submenu-button");
      if (!button) return;

      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        const isOpen = submenu.classList.contains("is-open");
        closeSubmenusExcept(submenu);
        submenu.classList.toggle("is-open", !isOpen);
      });

      submenu.addEventListener("mouseenter", function () {
        clearCloseTimer();
        closeSubmenusExcept(submenu);
        submenu.classList.add("is-open");
      });

      submenu.addEventListener("focusin", function () {
        clearCloseTimer();
        closeSubmenusExcept(submenu);
        submenu.classList.add("is-open");
      });
    });

    nav.addEventListener("mouseenter", clearCloseTimer);

    nav.addEventListener("mouseleave", function () {
      clearCloseTimer();
      closeTimer = setTimeout(function () {
        if (!nav.matches(":hover") && !nav.contains(document.activeElement)) {
          closeEverything();
        }
      }, 450);
    });

    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target)) {
        closeEverything();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeEverything();
      }
    });
  }

  function setupSearch(nav) {
    const form = nav.querySelector(".clean-nav-search");
    const input = nav.querySelector(".clean-nav-search-input");
    const results = nav.querySelector(".clean-nav-search-results");

    if (!form || !input || !results) return;

    function hideResults() {
      results.hidden = true;
      results.innerHTML = "";
    }

    function matchesFor(query) {
      const q = normalize(query);
      if (!q) return [];

      return calculators.filter(function (item) {
        return normalize(item.title).includes(q);
      });
    }

    function renderResults() {
      const matches = matchesFor(input.value);

      if (!normalize(input.value)) {
        hideResults();
        return;
      }

      results.hidden = false;

      if (!matches.length) {
        results.innerHTML = '<li class="clean-nav-search-empty">No calculator found</li>';
        return;
      }

      results.innerHTML = matches.slice(0, 8).map(function (item) {
        return (
          '<li>' +
            '<button type="button" class="clean-nav-search-result" data-url="' + item.url + '">' +
              item.title +
            '</button>' +
          '</li>'
        );
      }).join("");
    }

    input.addEventListener("keydown", function (event) {
      event.stopPropagation();

      if (event.key === "Escape") {
        hideResults();
      }
    }, true);

    input.addEventListener("keyup", function (event) {
      event.stopPropagation();
    }, true);

    input.addEventListener("input", function (event) {
      event.stopPropagation();
      renderResults();
    });

    input.addEventListener("focus", function () {
      renderResults();
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const matches = matchesFor(input.value);

      if (matches.length) {
        window.location.href = matches[0].url;
      }
    });

    results.addEventListener("click", function (event) {
      const button = event.target.closest(".clean-nav-search-result");
      if (!button) return;

      const url = button.getAttribute("data-url");
      if (url) window.location.href = url;
    });

    document.addEventListener("click", function (event) {
      if (!form.contains(event.target)) {
        hideResults();
      }
    });
  }

  function rebuildNav() {
    const nav = document.getElementById("navbar");
    if (!nav || nav.dataset.cleanRebuilt === "true") return;

    nav.dataset.cleanRebuilt = "true";
    nav.className = "clean-navbar";
    nav.innerHTML = buildNavHtml();

    setupDropdowns(nav);
    setupSearch(nav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", rebuildNav);
  } else {
    rebuildNav();
  }
})();


/* =====================================================
   AGE RESULT: Strong duplicate render guard
   - Keeps only one live Age result box
   - Hides live Age result while report page is open
   - Removes duplicate result shells caused by delayed online updates
===================================================== */
(function () {
  "use strict";

  function isAgePanel(el) {
    return !!(
      el &&
      (
        el.classList.contains("age-clean-result") ||
        el.classList.contains("age-point-output") ||
        el.id === "ageResult"
      )
    );
  }

  function dedupeAgeResults() {
    const panels = Array.from(document.querySelectorAll(".age-clean-result, .age-point-output, #ageResult"))
      .filter(function (el) {
        return isAgePanel(el) && !el.closest("#calculatorReportPage");
      });

    if (document.body.classList.contains("calculator-report-view")) {
      panels.forEach(function (el) {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.setAttribute("aria-hidden", "true");
      });
      return;
    }

    if (panels.length <= 1) return;

    const main = panels.find(function (el) {
      return el.id === "ageExternalOutput";
    }) || panels[0];

    panels.forEach(function (el) {
      if (el === main) return;
      el.remove();
    });

    main.style.removeProperty("display");
    main.style.removeProperty("visibility");
    main.removeAttribute("aria-hidden");
  }

  function start() {
    dedupeAgeResults();

    setTimeout(dedupeAgeResults, 80);
    setTimeout(dedupeAgeResults, 300);
    setTimeout(dedupeAgeResults, 900);
    setTimeout(dedupeAgeResults, 1800);

    document.addEventListener("input", function () {
      setTimeout(dedupeAgeResults, 300);
      setTimeout(dedupeAgeResults, 900);
    }, true);

    document.addEventListener("change", function () {
      setTimeout(dedupeAgeResults, 300);
      setTimeout(dedupeAgeResults, 900);
    }, true);

    window.addEventListener("hashchange", function () {
      setTimeout(dedupeAgeResults, 120);
      setTimeout(dedupeAgeResults, 700);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   GLOBAL RESULT: Double-render cleanup for all calculators
   - Keeps one live result panel per calculator
   - Prevents delayed async updates from creating duplicate boxes
===================================================== */
(function () {
  "use strict";

  const resultGroups = [
    { key: "age", keepId: "ageReportOutput", selector: "#ageReportOutput, .age-clean-result, .age-point-output, #ageResult" },
    { key: "bmi", keepId: "bmiReportOutput", selector: "#bmiReportOutput, .bmi-clean-result, .bmi-box-output, #bmiResult" },
    { key: "loan", keepId: "loanExternalOutput", selector: "#loanExternalOutput, .loan-clean-result, .mortgage-modern-result-panel, #loanResult" },
    { key: "personalLoan", keepId: "personalLoanExternalOutput", selector: "#personalLoanExternalOutput, .personalLoan-clean-result, #personalLoanResult" },
    { key: "discount", keepId: "discountReportOutput", selector: "#discountReportOutput, .discount-clean-result, #discountResult" },
    { key: "percentage", keepId: "percentageReportOutput", selector: "#percentageReportOutput, .percentage-clean-result, #percentageResult" },
    { key: "compound", keepId: "compoundReportOutput", selector: "#compoundReportOutput, .compound-clean-result, #compoundResult" }
  ];

  function isReportView() {
    return document.body.classList.contains("calculator-report-view") || !!document.getElementById("calculatorReportPage");
  }

  function hideLiveResultsDuringReport() {
    if (!isReportView()) return;

    document
      .querySelectorAll(".calculator-clean-result, .loan-style-output-panel, .mortgage-modern-result-panel")
      .forEach(function (panel) {
        if (panel.closest("#calculatorReportPage")) return;

        panel.style.setProperty("display", "none", "important");
        panel.style.setProperty("visibility", "hidden", "important");
        panel.setAttribute("aria-hidden", "true");
      });
  }

  function cleanupGroup(group) {
    let panels = Array.from(document.querySelectorAll(group.selector)).filter(function (panel) {
      return panel && !panel.closest("#calculatorReportPage");
    });

    if (!panels.length) return;

    /*
      Prefer the expected output id if it exists, otherwise keep the newest panel.
      Remove or hide the rest to prevent duplicate render.
    */
    const preferred = document.getElementById(group.keepId);
    const keep = preferred && panels.includes(preferred) ? preferred : panels[panels.length - 1];

    panels.forEach(function (panel) {
      if (panel === keep) return;

      if (panel.id && panel.id !== group.keepId) {
        panel.style.setProperty("display", "none", "important");
        panel.style.setProperty("visibility", "hidden", "important");
        panel.setAttribute("aria-hidden", "true");
      } else {
        panel.remove();
      }
    });

    if (!isReportView()) {
      keep.style.removeProperty("display");
      keep.style.removeProperty("visibility");
      keep.removeAttribute("aria-hidden");
    }
  }

  function cleanupResults() {
    hideLiveResultsDuringReport();

    if (isReportView()) return;

    resultGroups.forEach(cleanupGroup);
  }

  function start() {
    cleanupResults();

    setTimeout(cleanupResults, 100);
    setTimeout(cleanupResults, 500);
    setTimeout(cleanupResults, 1200);
    setTimeout(cleanupResults, 2400);

    document.addEventListener("input", function () {
      setTimeout(cleanupResults, 2100);
      setTimeout(cleanupResults, 2600);
    }, true);

    document.addEventListener("change", function () {
      setTimeout(cleanupResults, 2100);
      setTimeout(cleanupResults, 2600);
    }, true);

    window.addEventListener("hashchange", function () {
      setTimeout(cleanupResults, 100);
      setTimeout(cleanupResults, 800);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   GLOBAL RESULT: final duplicate render cleanup
   - Keeps one live result panel per page
   - Hides live panels on report pages
===================================================== */
(function () {
  "use strict";

  const pageResultSelectors = [
    ["ageReportOutput", "#ageReportOutput, .age-clean-result, .age-point-output, #ageResult"],
    ["bmiReportOutput", "#bmiReportOutput, .bmi-clean-result, .bmi-box-output, #bmiResult"],
    ["loanExternalOutput", "#loanExternalOutput, .loan-clean-result, .mortgage-modern-result-panel, #loanResult"],
    ["personalLoanExternalOutput", "#personalLoanExternalOutput, .personalLoan-clean-result, #personalLoanResult"],
    ["discountReportOutput", "#discountReportOutput, .discount-clean-result, #discountResult"],
    ["percentageReportOutput", "#percentageReportOutput, .percentage-clean-result, #percentageResult"],
    ["compoundReportOutput", "#compoundReportOutput, .compound-clean-result, #compoundResult"]
  ];

  function inReportView() {
    return document.body.classList.contains("calculator-report-view") || !!document.getElementById("calculatorReportPage");
  }

  function cleanupOne(keepId, selector) {
    const panels = Array.from(document.querySelectorAll(selector)).filter(function (el) {
      return el && !el.closest("#calculatorReportPage");
    });

    if (!panels.length) return;

    if (inReportView()) {
      panels.forEach(function (el) {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.setAttribute("aria-hidden", "true");
      });
      return;
    }

    const preferred = document.getElementById(keepId);
    const keep = preferred && panels.includes(preferred) ? preferred : panels[panels.length - 1];

    panels.forEach(function (el) {
      if (el === keep) return;

      if (el.id && el.id !== keepId) {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.setAttribute("aria-hidden", "true");
      } else {
        el.remove();
      }
    });

    keep.style.removeProperty("display");
    keep.style.removeProperty("visibility");
    keep.removeAttribute("aria-hidden");
  }

  function cleanupAllResults() {
    pageResultSelectors.forEach(function (pair) {
      cleanupOne(pair[0], pair[1]);
    });
  }

  function start() {
    cleanupAllResults();

    [100, 500, 1200, 2200, 3200].forEach(function (delay) {
      setTimeout(cleanupAllResults, delay);
    });

    document.addEventListener("input", function () {
      setTimeout(cleanupAllResults, 2200);
      setTimeout(cleanupAllResults, 3000);
    }, true);

    document.addEventListener("change", function () {
      setTimeout(cleanupAllResults, 2200);
      setTimeout(cleanupAllResults, 3000);
    }, true);

    window.addEventListener("hashchange", function () {
      setTimeout(cleanupAllResults, 100);
      setTimeout(cleanupAllResults, 800);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   EXTRA CALCULATORS PACK
   - Salary, credit card payoff, loan comparison, debt payoff,
     tax estimator, gaji penjawat awam, inflation, rental yield,
     fuel cost, credit-card interest, scientific, unit, currency.
===================================================== */
(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function n(id) {
    const el = $(id);
    if (!el) return NaN;
    const value = String(el.value || "").replace(/,/g, "").trim();
    return value === "" ? NaN : Number(value);
  }

  function val(id) {
    const el = $(id);
    return el ? String(el.value || "").trim() : "";
  }

  function money(value, prefix) {
    const p = prefix || "RM";
    if (!Number.isFinite(value)) return "Not available";
    return p + " " + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  function num(value, digits) {
    if (!Number.isFinite(value)) return "Not available";
    return value.toLocaleString("en-US", { maximumFractionDigits: digits == null ? 2 : digits });
  }

  function getResultBox() {
    return $("extraCalcResult");
  }

  function table(title, rows) {
    return (
      '<div class="extra-result-card">' +
        '<h2>' + title + '</h2>' +
        '<table class="extra-result-table"><tbody>' +
        rows.map(function (row) {
          return '<tr><th>' + row[0] + '</th><td>' + row[1] + '</td></tr>';
        }).join("") +
        '</tbody></table>' +
      '</div>'
    );
  }

  function extraPlainText(title, rows, note) {
    const lines = [title];

    (rows || []).forEach(function (row) {
      lines.push(row[0] + ": " + row[1]);
    });

    if (note) lines.push("Note: " + note);

    return lines.join("\n");
  }

  function extraDownloadTextFile(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    setTimeout(function () {
      URL.revokeObjectURL(url);
      link.remove();
    }, 0);
  }

  function extraDateStamp() {
    const d = new Date();

    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
      String(d.getHours()).padStart(2, "0"),
      String(d.getMinutes()).padStart(2, "0")
    ].join("-");
  }

  function extraSetButton(button, text) {
    if (!button) return;

    const oldText = button.textContent;
    button.textContent = text;

    setTimeout(function () {
      button.textContent = oldText;
    }, 1200);
  }

  function extraCopyText(text, button) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        extraSetButton(button, "Copied!");
      }).catch(function () {
        extraFallbackCopy(text, button);
      });
    } else {
      extraFallbackCopy(text, button);
    }
  }

  function extraFallbackCopy(text, button) {
    const area = document.createElement("textarea");

    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";

    document.body.appendChild(area);
    area.select();

    try {
      document.execCommand("copy");
      extraSetButton(button, "Copied!");
    } catch (error) {
      extraSetButton(button, "Copy failed");
    }

    area.remove();
  }

  function extraOpenReport(title, rows, note) {
    const old = document.getElementById("extraCalculatorReportPage");
    if (old) old.remove();

    document.body.classList.add("calculator-report-view");

    document.querySelectorAll("main, .calculator, .extra-calculator-layout, #extraCalcResult").forEach(function (element) {
      element.style.setProperty("display", "none", "important");
    });

    const section = document.createElement("section");
    section.id = "extraCalculatorReportPage";
    section.className = "calculator-report-page mortgage-fast-report-page extra-calculator-report-page";

    section.innerHTML =
      '<h1>' + title + '</h1>' +
      '<p class="calculator-report-date"><strong>Generated:</strong> ' + new Date().toLocaleString() + '</p>' +
      '<div class="calculator-report-card">' +
        '<h2>Result</h2>' +
        table(title, rows) +
        (note ? '<p class="extra-result-note">' + note + '</p>' : '') +
      '</div>' +
      '<div class="calculator-report-actions">' +
        '<button type="button" class="calculator-report-action-btn extra-report-back-btn">Go back</button>' +
        '<button type="button" class="calculator-report-action-btn extra-report-copy-btn">Copy report</button>' +
        '<button type="button" class="calculator-report-action-btn extra-report-save-btn">Save report</button>' +
        '<button type="button" class="calculator-report-action-btn extra-report-share-btn">Share report</button>' +
      '</div>';

    document.body.appendChild(section);

    const text = extraPlainText(title, rows, note);

    const back = section.querySelector(".extra-report-back-btn");
    const copy = section.querySelector(".extra-report-copy-btn");
    const save = section.querySelector(".extra-report-save-btn");
    const share = section.querySelector(".extra-report-share-btn");

    if (back) {
      back.onclick = function () {
        section.remove();
        document.body.classList.remove("calculator-report-view");
        document.querySelectorAll("main, .calculator, .extra-calculator-layout, #extraCalcResult").forEach(function (element) {
          element.style.removeProperty("display");
        });
      };
    }

    if (copy) copy.onclick = function () { extraCopyText(text, copy); };
    if (save) save.onclick = function () { extraDownloadTextFile("calculator-report-" + extraDateStamp() + ".txt", text); extraSetButton(save, "Saved!"); };
    if (share) {
      share.onclick = function () {
        if (navigator.share) {
          navigator.share({ title: title, text: text }).catch(function () { extraCopyText(text, share); });
        } else {
          extraCopyText(text, share);
        }
      };
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function extraWireActions(box, title, rows, note) {
    const text = extraPlainText(title, rows, note);
    const copy = box.querySelector(".extra-result-copy-btn");
    const save = box.querySelector(".extra-result-save-btn");
    const share = box.querySelector(".extra-result-share-btn");
    const report = box.querySelector(".extra-result-report-btn");

    if (copy) copy.onclick = function () { extraCopyText(text, copy); };
    if (save) save.onclick = function () { extraDownloadTextFile("calculator-result-" + extraDateStamp() + ".txt", text); extraSetButton(save, "Saved!"); };
    if (share) {
      share.onclick = function () {
        if (navigator.share) {
          navigator.share({ title: title, text: text }).catch(function () { extraCopyText(text, share); });
        } else {
          extraCopyText(text, share);
        }
      };
    }
    if (report) report.onclick = function () { extraOpenReport(title, rows, note); };
  }

  function extraActionButtons() {
    return (
      '<div class="extra-result-actions">' +
        '<button type="button" class="extra-result-action-btn extra-result-copy-btn">Copy</button>' +
        '<button type="button" class="extra-result-action-btn extra-result-save-btn">Save</button>' +
        '<button type="button" class="extra-result-action-btn extra-result-share-btn">Share</button>' +
        '<button type="button" class="extra-result-action-btn extra-result-report-btn">Report</button>' +
      '</div>'
    );
  }

  function show(title, rows, note) {
    const box = getResultBox();
    if (!box) return;

    box.innerHTML = table(title, rows) + (note ? '<p class="extra-result-note">' + note + '</p>' : "") + extraActionButtons();
    box.hidden = false;

    extraWireActions(box, title, rows, note);
  }

  function loanPayment(principal, annualRate, months) {
    if (!Number.isFinite(principal) || !Number.isFinite(annualRate) || !Number.isFinite(months) || principal <= 0 || months <= 0) return NaN;
    const r = annualRate / 100 / 12;
    if (r === 0) return principal / months;
    return principal * r / (1 - Math.pow(1 + r, -months));
  }

  window.calculateSalaryExtra = function () {
    const gross = n("salaryGross");
    const epfRate = n("salaryEpfRate");
    const socso = n("salarySocso");
    const tax = n("salaryTax");
    const other = n("salaryOther");
    if (!Number.isFinite(gross) || gross <= 0) return;

    const epf = gross * ((Number.isFinite(epfRate) ? epfRate : 11) / 100);
    const totalDeduct = epf + (Number.isFinite(socso) ? socso : 0) + (Number.isFinite(tax) ? tax : 0) + (Number.isFinite(other) ? other : 0);
    const net = gross - totalDeduct;

    show("Salary result", [
      ["Gross monthly salary", money(gross)],
      ["EPF deduction", money(epf)],
      ["Other deductions", money(totalDeduct - epf)],
      ["Net monthly salary", money(net)],
      ["Estimated net yearly", money(net * 12)]
    ]);
  };

  window.calculateCreditCardPayoffExtra = function () {
    const balance = n("ccBalance");
    const apr = n("ccApr");
    const payment = n("ccPayment");
    if (!Number.isFinite(balance) || !Number.isFinite(apr) || !Number.isFinite(payment) || balance <= 0 || payment <= 0) return;

    let bal = balance;
    let totalInterest = 0;
    let months = 0;
    const monthlyRate = apr / 100 / 12;

    while (bal > 0.01 && months < 1200) {
      const interest = bal * monthlyRate;
      totalInterest += interest;
      bal += interest;

      if (payment <= interest && monthlyRate > 0) {
        show("Credit card payoff result", [
          ["Balance", money(balance)],
          ["Monthly interest", money(interest)],
          ["Monthly payment", money(payment)],
          ["Status", "Payment is too low to reduce the balance"]
        ], "Increase the monthly payment to pay off the card.");
        return;
      }

      bal -= payment;
      months += 1;
    }

    show("Credit card payoff result", [
      ["Months to pay off", months + " months"],
      ["Years to pay off", (months / 12).toFixed(1) + " years"],
      ["Total interest", money(totalInterest)],
      ["Total paid", money(balance + totalInterest)]
    ]);
  };

  window.calculateLoanComparisonExtra = function () {
    const amount = n("loanCompareAmount");
    const rateA = n("loanCompareRateA");
    const termA = n("loanCompareTermA");
    const rateB = n("loanCompareRateB");
    const termB = n("loanCompareTermB");
    if (![amount, rateA, termA, rateB, termB].every(Number.isFinite)) return;

    const monthsA = termA * 12;
    const monthsB = termB * 12;
    const payA = loanPayment(amount, rateA, monthsA);
    const payB = loanPayment(amount, rateB, monthsB);
    const totalA = payA * monthsA;
    const totalB = payB * monthsB;

    show("Loan comparison result", [
      ["Loan A monthly payment", money(payA)],
      ["Loan A total interest", money(totalA - amount)],
      ["Loan A total paid", money(totalA)],
      ["Loan B monthly payment", money(payB)],
      ["Loan B total interest", money(totalB - amount)],
      ["Loan B total paid", money(totalB)],
      ["Lower total cost", totalA <= totalB ? "Loan A" : "Loan B"],
      ["Difference", money(Math.abs(totalA - totalB))]
    ]);
  };

  window.calculateDebtPayoffExtra = function () {
    const debt = n("debtTotal");
    const apr = n("debtApr");
    const payment = n("debtPayment");
    const extra = n("debtExtra");
    if (![debt, apr, payment].every(Number.isFinite) || debt <= 0 || payment <= 0) return;

    const monthlyPayment = payment + (Number.isFinite(extra) ? extra : 0);
    let bal = debt;
    let totalInterest = 0;
    let months = 0;
    const rate = apr / 100 / 12;

    while (bal > 0.01 && months < 1200) {
      const interest = bal * rate;
      totalInterest += interest;
      bal += interest;

      if (monthlyPayment <= interest && rate > 0) {
        show("Debt payoff result", [
          ["Monthly interest", money(interest)],
          ["Monthly payment", money(monthlyPayment)],
          ["Status", "Payment is too low to reduce debt"]
        ]);
        return;
      }

      bal -= monthlyPayment;
      months += 1;
    }

    show("Debt payoff result", [
      ["Total debt", money(debt)],
      ["Monthly payment used", money(monthlyPayment)],
      ["Months to debt free", months + " months"],
      ["Years to debt free", (months / 12).toFixed(1) + " years"],
      ["Total interest", money(totalInterest)]
    ]);
  };

  window.calculateTaxExtra = function () {
    const income = n("taxAnnualIncome");
    const relief = n("taxRelief");
    const rate = n("taxRate");
    if (!Number.isFinite(income) || income <= 0) return;

    const taxable = Math.max(0, income - (Number.isFinite(relief) ? relief : 0));
    const tax = taxable * ((Number.isFinite(rate) ? rate : 10) / 100);

    show("Tax estimator result", [
      ["Annual income", money(income)],
      ["Relief / deduction", money(Number.isFinite(relief) ? relief : 0)],
      ["Estimated taxable income", money(taxable)],
      ["Tax rate used", (Number.isFinite(rate) ? rate : 10).toFixed(2) + "%"],
      ["Estimated tax", money(tax)],
      ["Estimated monthly tax", money(tax / 12)]
    ], "This is a simple estimator using your entered rate. It is not official tax advice.");
  };

  window.calculateGajiPenjawatAwamExtra = function () {
    const basic = n("gajiBasic");
    const fixed = n("gajiFixedAllowance");
    const cola = n("gajiCola");
    const other = n("gajiOtherAllowance");
    const deductions = n("gajiDeductions");
    if (!Number.isFinite(basic) || basic <= 0) return;

    const allowance = (Number.isFinite(fixed) ? fixed : 0) + (Number.isFinite(cola) ? cola : 0) + (Number.isFinite(other) ? other : 0);
    const gross = basic + allowance;
    const net = gross - (Number.isFinite(deductions) ? deductions : 0);

    show("Gaji penjawat awam result", [
      ["Gaji pokok", money(basic)],
      ["Jumlah elaun", money(allowance)],
      ["Gaji kasar", money(gross)],
      ["Potongan", money(Number.isFinite(deductions) ? deductions : 0)],
      ["Anggaran gaji bersih", money(net)]
    ], "Masukkan nilai elaun dan potongan sendiri mengikut slip gaji anda.");
  };

  window.calculateInflationExtra = function () {
    const amount = n("inflationAmount");
    const rate = n("inflationRate");
    const years = n("inflationYears");
    if (![amount, rate, years].every(Number.isFinite)) return;

    const future = amount * Math.pow(1 + rate / 100, years);
    const loss = amount / Math.pow(1 + rate / 100, years);

    show("Inflation result", [
      ["Today amount", money(amount)],
      ["Inflation rate", rate.toFixed(2) + "%"],
      ["Years", years],
      ["Future cost estimate", money(future)],
      ["Today buying power after period", money(loss)]
    ]);
  };

  window.calculateRentalYieldExtra = function () {
    const price = n("rentalPropertyPrice");
    const rent = n("rentalMonthlyRent");
    const expenses = n("rentalAnnualExpenses");
    if (!Number.isFinite(price) || !Number.isFinite(rent) || price <= 0) return;

    const annualRent = rent * 12;
    const grossYield = annualRent / price * 100;
    const netYield = (annualRent - (Number.isFinite(expenses) ? expenses : 0)) / price * 100;

    show("Rental yield result", [
      ["Property price", money(price)],
      ["Annual rent", money(annualRent)],
      ["Annual expenses", money(Number.isFinite(expenses) ? expenses : 0)],
      ["Gross rental yield", grossYield.toFixed(2) + "%"],
      ["Net rental yield", netYield.toFixed(2) + "%"]
    ]);
  };

  window.calculateFuelCostExtra = function () {
    const distance = n("fuelDistance");
    const efficiency = n("fuelEfficiency");
    const price = n("fuelPrice");
    const people = n("fuelPeople");
    if (![distance, efficiency, price].every(Number.isFinite) || efficiency <= 0) return;

    const liters = distance / 100 * efficiency;
    const total = liters * price;
    const perPerson = total / (Number.isFinite(people) && people > 0 ? people : 1);

    show("Fuel cost result", [
      ["Distance", num(distance) + " km"],
      ["Fuel needed", num(liters) + " L"],
      ["Total fuel cost", money(total)],
      ["Cost per person", money(perPerson)]
    ]);
  };

  window.calculateCreditCardInterestExtra = function () {
    const balance = n("ccInterestBalance");
    const apr = n("ccInterestApr");
    const days = n("ccInterestDays");
    const payment = n("ccInterestPayment");
    if (![balance, apr, days].every(Number.isFinite)) return;

    const afterPayment = Math.max(0, balance - (Number.isFinite(payment) ? payment : 0));
    const interest = afterPayment * (apr / 100) * (days / 365);

    show("Credit card interest result", [
      ["Starting balance", money(balance)],
      ["Payment", money(Number.isFinite(payment) ? payment : 0)],
      ["Balance used", money(afterPayment)],
      ["APR", apr.toFixed(2) + "%"],
      ["Days", days],
      ["Estimated interest", money(interest)]
    ]);
  };

  window.calculateScientificExtra = function () {
    const expression = val("scientificExpression");
    if (!expression) return;

    const safe = expression
      .replace(/\^/g, "**")
      .replace(/\bsin\(/gi, "Math.sin(")
      .replace(/\bcos\(/gi, "Math.cos(")
      .replace(/\btan\(/gi, "Math.tan(")
      .replace(/\bsqrt\(/gi, "Math.sqrt(")
      .replace(/\blog\(/gi, "Math.log10(")
      .replace(/\bln\(/gi, "Math.log(")
      .replace(/\bpi\b/gi, "Math.PI")
      .replace(/\be\b/g, "Math.E");

    if (!/^[0-9+\-*/().,\s*MathPIEqrtcosinlag]+$/i.test(safe)) {
      show("Scientific result", [["Error", "Expression contains unsupported characters"]]);
      return;
    }

    try {
      const result = Function('"use strict"; return (' + safe + ');')();
      show("Scientific result", [
        ["Expression", expression],
        ["Result", num(Number(result), 10)]
      ]);
    } catch (error) {
      show("Scientific result", [["Error", "Cannot calculate this expression"]]);
    }
  };

  const unitFactors = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254 },
    weight: { kg: 1, g: 0.001, lb: 0.45359237, oz: 0.0283495 },
    volume: { liter: 1, ml: 0.001, gallon: 3.78541, cup: 0.236588 }
  };

  function convertTemperature(value, from, to) {
    let c = value;
    if (from === "f") c = (value - 32) * 5 / 9;
    if (from === "k") c = value - 273.15;
    if (to === "f") return c * 9 / 5 + 32;
    if (to === "k") return c + 273.15;
    return c;
  }

  window.calculateUnitConverterExtra = function () {
    const type = val("unitType");
    const value = n("unitValue");
    const from = val("unitFrom");
    const to = val("unitTo");
    if (!Number.isFinite(value) || !type || !from || !to) return;

    let result;
    if (type === "temperature") {
      result = convertTemperature(value, from, to);
    } else {
      const factors = unitFactors[type] || {};
      result = value * factors[from] / factors[to];
    }

    show("Unit converter result", [
      ["Value", num(value) + " " + from],
      ["Converted", num(result, 6) + " " + to]
    ]);
  };

  window.calculateCurrencyConverterExtra = function () {
    const amount = n("currencyAmount");
    const from = val("currencyFrom").toUpperCase() || "FROM";
    const to = val("currencyTo").toUpperCase() || "TO";
    const rate = n("currencyRate");
    if (!Number.isFinite(amount) || !Number.isFinite(rate)) return;

    show("Currency converter result", [
      ["Amount", num(amount) + " " + from],
      ["Exchange rate used", "1 " + from + " = " + num(rate, 6) + " " + to],
      ["Converted amount", num(amount * rate, 2) + " " + to]
    ], "This static GitHub Pages converter uses the exchange rate you enter manually.");
  };

  const pageMap = {
    salary: window.calculateSalaryExtra,
    creditCardPayoff: window.calculateCreditCardPayoffExtra,
    loanComparison: window.calculateLoanComparisonExtra,
    debtPayoff: window.calculateDebtPayoffExtra,
    tax: window.calculateTaxExtra,
    gajiPenjawatAwam: window.calculateGajiPenjawatAwamExtra,
    inflation: window.calculateInflationExtra,
    rentalYield: window.calculateRentalYieldExtra,
    fuelCost: window.calculateFuelCostExtra,
    creditCardInterest: window.calculateCreditCardInterestExtra,
    scientific: window.calculateScientificExtra,
    unitConverter: window.calculateUnitConverterExtra,
    currencyConverter: window.calculateCurrencyConverterExtra
  };

  function pageType() {
    return document.body ? document.body.dataset.page : "";
  }

  function start() {
    const fn = pageMap[pageType()];
    if (!fn) return;

    let timer = null;
    document.addEventListener("input", function (event) {
      if (!event.target.closest(".extra-calculator-box")) return;
      clearTimeout(timer);
      timer = setTimeout(fn, 2000);
    }, true);

    document.addEventListener("change", function (event) {
      if (!event.target.closest(".extra-calculator-box")) return;
      clearTimeout(timer);
      timer = setTimeout(fn, 400);
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   EXTRA PAGES: ? help button toggle
===================================================== */
(function () {
  "use strict";

  function setupExtraHelpButton() {
    const button = document.querySelector(".extra-help-question-button");
    const panel = document.querySelector(".extra-help-panel");

    if (!button || !panel || button.dataset.ready === "true") return;

    button.dataset.ready = "true";
    panel.hidden = true;

    function setOpen(open) {
      panel.hidden = !open;
      document.body.classList.toggle("extra-help-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    }

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(panel.hidden);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });

    document.addEventListener("click", function (event) {
      if (panel.hidden) return;
      if (panel.contains(event.target) || button.contains(event.target)) return;
      setOpen(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupExtraHelpButton);
  } else {
    setupExtraHelpButton();
  }
})();


/* =====================================================
   FINAL REPAIR: reliable menu + auto-calculate/result rescue
===================================================== */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function closeMenus(nav, exceptDropdown, exceptSubmenu) {
    qsa(".clean-nav-dropdown.is-open", nav).forEach(function (item) {
      if (item !== exceptDropdown) {
        item.classList.remove("is-open");
        const button = item.querySelector(".clean-nav-button");
        if (button) button.setAttribute("aria-expanded", "false");
        qsa(".clean-nav-submenu.is-open", item).forEach(function (sub) {
          sub.classList.remove("is-open");
        });
      }
    });

    qsa(".clean-nav-submenu.is-open", nav).forEach(function (item) {
      if (item !== exceptSubmenu && (!exceptSubmenu || item.closest(".clean-nav-dropdown-panel") === exceptSubmenu.closest(".clean-nav-dropdown-panel"))) {
        item.classList.remove("is-open");
      }
    });
  }

  function setupReliableMenus() {
    const nav = document.getElementById("navbar");
    if (!nav || nav.dataset.finalMenuRepair === "true") return;

    nav.dataset.finalMenuRepair = "true";

    nav.addEventListener("click", function (event) {
      const dropdownButton = event.target.closest(".clean-nav-button");
      const submenuButton = event.target.closest(".clean-nav-submenu-button");

      if (dropdownButton && nav.contains(dropdownButton)) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const dropdown = dropdownButton.closest(".clean-nav-dropdown");
        const wasOpen = dropdown.classList.contains("is-open");

        closeMenus(nav, dropdown, null);
        dropdown.classList.toggle("is-open", !wasOpen);
        dropdownButton.setAttribute("aria-expanded", !wasOpen ? "true" : "false");
        return;
      }

      if (submenuButton && nav.contains(submenuButton)) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const submenu = submenuButton.closest(".clean-nav-submenu");
        const wasOpen = submenu.classList.contains("is-open");
        const parentDropdown = submenu.closest(".clean-nav-dropdown");

        if (parentDropdown) {
          parentDropdown.classList.add("is-open");
          const parentButton = parentDropdown.querySelector(".clean-nav-button");
          if (parentButton) parentButton.setAttribute("aria-expanded", "true");
        }

        closeMenus(nav, parentDropdown, submenu);
        submenu.classList.toggle("is-open", !wasOpen);
      }
    }, true);

    nav.addEventListener("pointerover", function (event) {
      const submenu = event.target.closest(".clean-nav-submenu");
      const dropdown = event.target.closest(".clean-nav-dropdown");

      if (submenu && nav.contains(submenu)) {
        const parentDropdown = submenu.closest(".clean-nav-dropdown");
        closeMenus(nav, parentDropdown, submenu);
        if (parentDropdown) {
          parentDropdown.classList.add("is-open");
          const parentButton = parentDropdown.querySelector(".clean-nav-button");
          if (parentButton) parentButton.setAttribute("aria-expanded", "true");
        }
        submenu.classList.add("is-open");
        return;
      }

      if (dropdown && nav.contains(dropdown)) {
        closeMenus(nav, dropdown, null);
        dropdown.classList.add("is-open");
        const button = dropdown.querySelector(".clean-nav-button");
        if (button) button.setAttribute("aria-expanded", "true");
      }
    }, true);

    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target)) {
        closeMenus(nav, null, null);
      }
    }, true);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenus(nav, null, null);
      }
    });
  }

  function detectCalculatorPage() {
    const path = (location.pathname || "").toLowerCase();
    if (path.includes("age-calculator")) return "age";
    if (path.includes("bmi-calculator")) return "bmi";
    if (path.includes("mortgage-calculator")) return "loan";
    if (path.includes("personal-loan-calculator")) return "personalLoan";
    if (path.includes("discount-calculator")) return "discount";
    if (path.includes("percentage-calculator")) return "percentage";
    if (path.includes("compound-interest-calculator")) return "compound";
    if (path.includes("basic-calculator")) return "basic";
    if (path.includes("salary-calculator")) return "salary";
    if (path.includes("credit-card-payoff-calculator")) return "creditCardPayoff";
    if (path.includes("loan-comparison-calculator")) return "loanComparison";
    if (path.includes("debt-payoff-calculator")) return "debtPayoff";
    if (path.includes("tax-calculator")) return "tax";
    if (path.includes("gaji-penjawat-awam-calculator")) return "gajiPenjawatAwam";
    if (path.includes("inflation-calculator")) return "inflation";
    if (path.includes("rental-yield-calculator")) return "rentalYield";
    if (path.includes("fuel-cost-calculator")) return "fuelCost";
    if (path.includes("credit-card-interest-calculator")) return "creditCardInterest";
    if (path.includes("scientific-calculator")) return "scientific";
    if (path.includes("unit-converter-calculator")) return "unitConverter";
    if (path.includes("currency-converter")) return "currencyConverter";
    return "";
  }

  function hasValue(ids) {
    return ids.some(function (id) {
      const el = document.getElementById(id);
      return el && String(el.value || "").trim() !== "";
    });
  }

  function readyForAuto(type) {
    if (type === "age") return hasValue(["birthdate"]);
    if (type === "bmi") return hasValue(["weight", "height", "bmiWeight", "bmiHeight"]);
    if (type === "loan") return hasValue(["amount"]) && hasValue(["interest"]) && hasValue(["years"]);
    if (type === "personalLoan") return hasValue(["personalLoanAmount"]) || hasValue(["amount", "loanAmount"]);
    if (type === "discount") return hasValue(["price", "originalPrice", "amount"]) && hasValue(["discount", "discountRate"]);
    if (type === "percentage") return hasValue(["percentage", "percent"]) && hasValue(["number", "amount", "value"]);
    if (type === "compound") return hasValue(["principal", "compoundPrincipal", "amount"]) && hasValue(["rate", "compoundRate", "interest", "interestRate"]);
    if (type === "basic") return false;
    return true;
  }

  function callCalculator(type) {
    const map = {
      age: "calculateAge",
      bmi: "calculateBMI",
      loan: "calculateLoan",
      personalLoan: "calculatePersonalLoan",
      discount: "calculateDiscount",
      percentage: "calculatePercentage",
      compound: "calculateCompound",
      salary: "calculateSalaryExtra",
      creditCardPayoff: "calculateCreditCardPayoffExtra",
      loanComparison: "calculateLoanComparisonExtra",
      debtPayoff: "calculateDebtPayoffExtra",
      tax: "calculateTaxExtra",
      gajiPenjawatAwam: "calculateGajiPenjawatAwamExtra",
      inflation: "calculateInflationExtra",
      rentalYield: "calculateRentalYieldExtra",
      fuelCost: "calculateFuelCostExtra",
      creditCardInterest: "calculateCreditCardInterestExtra",
      scientific: "calculateScientificExtra",
      unitConverter: "calculateUnitConverterExtra",
      currencyConverter: "calculateCurrencyConverterExtra"
    };

    const fnName = map[type];
    if (fnName && typeof window[fnName] === "function") {
      try {
        window[fnName]();
      } catch (error) {
        console.warn("Auto-calculate repair failed:", error);
      }
    }
  }

  function unhideResults() {
    if (document.body.classList.contains("calculator-report-view")) return;

    qsa(
      ".calculator-clean-result, .loan-style-output-panel, .mortgage-modern-result-panel, " +
      "#ageResult, #bmiResult, #loanResult, #personalLoanResult, #discountResult, #percentageResult, #compoundResult, #extraCalcResult"
    ).forEach(function (el) {
      if (!el.closest("#calculatorReportPage")) {
        el.style.removeProperty("display");
        el.style.removeProperty("visibility");
        el.removeAttribute("aria-hidden");
      }
    });
  }

  function setupAutoCalculateRepair() {
    if (document.body.dataset.autoCalcRepair === "true") return;
    document.body.dataset.autoCalcRepair = "true";

    let timer = null;

    function schedule(event) {
      const target = event && event.target;
      if (!target) return;
      if (target.closest("#navbar, #menuIcon, #scrollTopBtn, .site-search, .clean-nav-search")) return;
      if (!target.matches("input, select, textarea")) return;

      const type = detectCalculatorPage();
      if (!type || !readyForAuto(type)) return;

      clearTimeout(timer);
      timer = setTimeout(function () {
        callCalculator(type);
        setTimeout(unhideResults, 80);
        setTimeout(unhideResults, 350);
      }, 2000);
    }

    document.addEventListener("input", schedule, true);
    document.addEventListener("change", schedule, true);
    setTimeout(unhideResults, 300);
    setTimeout(unhideResults, 1200);
  }

  ready(function () {
    setupReliableMenus();
    setupAutoCalculateRepair();
  });
})();

