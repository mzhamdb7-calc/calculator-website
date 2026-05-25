/*
  Copyright © 2026 Hamdi. All rights reserved.
  Clean shared script:
  - Basic calculator stays manual with = and history.
  - All other calculators auto-calculate when inputs change.
  - Non-basic calculate buttons and history boxes are removed from the HTML.
  - No MutationObserver and no hidden button/history overlay code.
*/

(function () {
  "use strict";

  const MAX_HISTORY_ITEMS = 50;
  const AUTO_DELAY = 450;

  let autoTimer = null;
  let isAutoCalculating = false;
  let lastAutoSignature = "";

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
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

    const raw = String(input.value || "").replace(/,/g, "").trim();
    if (raw === "") return NaN;

    return Number(raw);
  }

  function stringValue(id) {
    const input = document.getElementById(id);
    return input ? String(input.value || "").trim() : "";
  }

  function firstNumber(ids) {
    for (const id of ids) {
      const value = numberValue(id);
      if (Number.isFinite(value)) return value;
    }

    return NaN;
  }

  function firstValue(ids) {
    for (const id of ids) {
      const value = stringValue(id);
      if (value) return value;
    }

    return "";
  }

  function positive(value) {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
    textarea.setSelectionRange(0, textarea.value.length);

    document.execCommand("copy");
    textarea.remove();
  }

  function setButtonState(button, text) {
    if (!button) return;

    const oldText = button.dataset.originalText || button.textContent || "Copy";
    button.dataset.originalText = oldText;
    button.textContent = text;

    setTimeout(function () {
      button.textContent = oldText;
    }, 1000);
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

  function getPageTitle() {
    const h1 = document.querySelector("h1");
    return h1 ? h1.textContent.trim().toLowerCase() : "";
  }

  function getPageType() {
    const title = getPageTitle();

    if (title.includes("basic") || document.getElementById("display")) return "basic";
    if (title.includes("age") || document.getElementById("birthdate")) return "age";
    if (title.includes("bmi") || document.getElementById("bmiResult")) return "bmi";
    if (title.includes("loan") || title.includes("mortgage") || document.body.classList.contains("loan-page") || document.getElementById("loanResult")) return "loan";
    if (title.includes("discount") || document.getElementById("discountResult")) return "discount";
    if (title.includes("percentage") || document.getElementById("percentageResult")) return "percentage";
    if (title.includes("compound") || document.getElementById("compoundResult")) return "compound";

    return "";
  }

  function applyPageBodyClass() {
    const type = getPageType();
    if (!type) return;

    document.body.dataset.page = type;
    document.body.classList.add(type + "-page");

    const main = document.querySelector("main");
    if (main && type !== "basic") {
      main.classList.add("no-history-layout");
    }
  }

  function isCalculatorPage() {
    const main = document.querySelector("main");
    if (!main) return false;

    if (
      document.body.classList.contains("index-page") ||
      document.body.classList.contains("about-page") ||
      document.body.classList.contains("privacy-page") ||
      document.body.classList.contains("contact-page") ||
      document.body.classList.contains("info-page")
    ) {
      return false;
    }

    return !!main.querySelector(".calculator");
  }

  function getCalculator() {
    const main = document.querySelector("main");
    return main ? main.querySelector(".calculator") : null;
  }

  function removeNonBasicCalculateButtons() {
    const type = getPageType();
    if (!type || type === "basic") return;

    const calculator = getCalculator();
    if (!calculator) return;

    $$("button", calculator).forEach(function (button) {
      const text = button.textContent.trim().toLowerCase();
      const onclick = button.getAttribute("onclick") || "";
      const id = String(button.id || "").toLowerCase();

      if (
        button.classList.contains("main-btn") ||
        onclick.includes("calculate") ||
        id.includes("calculate") ||
        text.includes("calculate")
      ) {
        button.remove();
      }
    });
  }

  function removeNonBasicHistoryBoxes() {
    const type = getPageType();
    if (!type || type === "basic") return;

    $$(".age-history-box, .bmi-history-box, .loan-history-box, .discount-history-box, .percentage-history-box, .compound-history-box")
      .forEach(function (box) {
        box.remove();
      });
  }

  function setupNumberInputs() {
    $$('input[type="number"]').forEach(function (input) {
      input.setAttribute("inputmode", "decimal");

      if (input.dataset.numberOnlyReady === "true") return;
      input.dataset.numberOnlyReady = "true";

      input.addEventListener("keydown", function (event) {
        const allowedKeys = [
          "Backspace",
          "Delete",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Tab",
          "Home",
          "End"
        ];

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

  /* =====================================================
     BASIC CALCULATOR
  ===================================================== */

  let calcHistory = safeLoadArray("basicEquationHistory");
  let lastAnswer = Number(safeGet("lastAnswer", "0")) || 0;
  let lastBasicEquation = "";

  function getDisplay() {
    return document.getElementById("display");
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
    sqrt: "Math.sqrt("
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
    const allowedCharacters = /^[0-9+\-*/().,\sA-Za-z]+$/;
    if (!allowedCharacters.test(expression)) return false;

    const words = expression.match(/[A-Za-z]+/g) || [];
    const allowedWords = new Set(["Math", "sin", "cos", "tan", "log", "log10", "sqrt", "PI", "E"]);

    return words.every(function (word) {
      return allowedWords.has(word);
    });
  }

  function displayExpressionForUser(expression) {
    return String(expression || "")
      .replace(/Math\.sqrt\(/g, "√(")
      .replace(/Math\.sin\(/g, "sin(")
      .replace(/Math\.cos\(/g, "cos(")
      .replace(/Math\.tan\(/g, "tan(")
      .replace(/Math\.log10\(/g, "log(")
      .replace(/Math\.log\(/g, "ln(")
      .replace(/\*\*/g, "^")
      .replace(/\*/g, "×")
      .replace(/\//g, "÷");
  }

  function addBasicEquationHistory(equation) {
    const value = String(equation || "").trim();
    if (!value || value === "Error") return;

    const userText = displayExpressionForUser(value);
    const last = calcHistory[calcHistory.length - 1];

    if (last !== userText) {
      calcHistory.push(userText);
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
        .replace(/√\(/g, "Math.sqrt(")
        .replace(/×/g, "*")
        .replace(/÷/g, "/");

      expression = expression
        .replace(/(\d)(Math\.sqrt\()/g, "$1*$2")
        .replace(/\)(Math\.sqrt\()/g, ")*$1");

      lastBasicEquation = expression;
      expression = closeOpenBrackets(expression);

      if (!isSafeExpression(expression)) {
        display.value = "Error";
        return;
      }

      const result = Function('"use strict"; return (' + expression + ')')();

      if (typeof result !== "number" || !Number.isFinite(result)) {
        display.value = "Error";
        return;
      }

      const cleanResult = Number.isInteger(result) ? result : Number(result.toPrecision(12));

      display.value = String(cleanResult);
      lastAnswer = cleanResult;
      safeSet("lastAnswer", String(lastAnswer));

      addBasicEquationHistory(lastBasicEquation);
    } catch {
      display.value = "Error";
    }
  }

  function showHistory() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    const title = document.querySelector(".history h3");
    if (title) title.textContent = "Input";

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
    showHistory();
  }

  function flashButton(buttonText) {
    const wanted = String(buttonText).trim().toUpperCase();
    const aliases = {
      "-": ["-", "−"],
      "*": ["*", "×", "X"],
      "/": ["/", "÷"],
      "ANS": ["ANS", "Ans"]
    };

    const allowedTexts = aliases[wanted] || [wanted];

    $$(".buttons button, .ans-btn").forEach(function (button) {
      const actual = button.textContent.trim().toUpperCase();

      if (allowedTexts.map(function (text) { return text.toUpperCase(); }).includes(actual)) {
        button.classList.add("keyboard-active");

        setTimeout(function () {
          button.classList.remove("keyboard-active");
        }, 150);
      }
    });
  }

  function setupKeyboardSupport() {
    document.addEventListener("keydown", function (event) {
      const display = getDisplay();
      if (!display) return;

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
     RESULT PANELS
  ===================================================== */

  function getOrCreatePanel(id, className, ariaLabel) {
    const main = document.querySelector("main");
    const calculator = getCalculator();

    if (!main || !calculator) return null;

    let panel = document.getElementById(id);

    if (!panel) {
      panel = document.createElement("section");
      panel.id = id;
      panel.className = className || "";
      panel.setAttribute("aria-label", ariaLabel || "Calculator result");

      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function renderPointPanel(id, className, rows, copyTextValue) {
    const panel = getOrCreatePanel(id, className, "Calculator result");
    if (!panel) return;

    if (!rows || !rows.length) {
      panel.hidden = true;
      return;
    }

    panel.hidden = false;
    panel.innerHTML =
      '<div class="loan-output-top stable-result-top">' +
        '<div class="loan-result-panel stable-result-panel">' +
          '<h2 class="loan-panel-title stable-result-title">Result</h2>' +
          '<div class="loan-result-body stable-result-body">' +
            '<ul class="auto-point-result">' +
              rows.map(function (row) {
                return '<li><strong>' + row[0] + ':</strong> ' + row[1] + '</li>';
              }).join("") +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="loan-copy-side stable-copy-side">' +
          '<button type="button" class="loan-copy-btn stable-copy-btn">Copy</button>' +
        '</div>' +
      '</div>';

    const button = panel.querySelector(".loan-copy-btn");
    if (button) {
      button.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        copyText(copyTextValue || rows.map(function (row) {
          return row[0].replace(/<[^>]+>/g, "") + ": " + row[1].replace(/<[^>]+>/g, "");
        }).join("\n"), button);
      };
    }
  }

  function renderTablePanel(id, className, title, summaryHtml, tableHtml, copyTextValue) {
    const panel = getOrCreatePanel(id, className, "Calculator result");
    if (!panel) return;

    panel.hidden = false;
    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +
          (summaryHtml || "") +
          '<div class="loan-result-body">' +
            tableHtml +
          '</div>' +
        '</div>' +
        '<div class="loan-copy-side">' +
          '<button type="button" class="loan-copy-btn">Copy</button>' +
        '</div>' +
      '</div>';

    const button = panel.querySelector(".loan-copy-btn");
    if (button) {
      button.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyText(copyTextValue, button);
      };
    }
  }

  function hideNativeResult(ids) {
    ids.forEach(function (id) {
      const result = document.getElementById(id);
      if (result) {
        result.style.display = "none";
      }
    });
  }

  /* =====================================================
     AGE
  ===================================================== */

  function todayValueISO() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
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

    if (!targetInput.value) {
      targetInput.value = todayValueISO();
    }

    return targetInput;
  }

  function calculateNormalAgeBetweenDates(birthdateValue, targetDateValue) {
    if (!birthdateValue || !targetDateValue) return "";

    const birth = new Date(birthdateValue + "T00:00:00");
    const target = new Date(targetDateValue + "T00:00:00");

    if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime())) return "";
    if (birth > target) return "";

    let years = target.getFullYear() - birth.getFullYear();

    const birthdayThisYear = new Date(
      target.getFullYear(),
      birth.getMonth(),
      birth.getDate()
    );

    if (target < birthdayThisYear) {
      years -= 1;
    }

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
    const targetDate = targetInput ? String(targetInput.value || "").trim() : todayValueISO();

    if (!birthdate) return;

    const normalAge = calculateNormalAgeBetweenDates(birthdate, targetDate);
    const asianAge = calculateAsianAgeBetweenDates(birthdate, targetDate);

    if (normalAge === "" || asianAge === "") {
      renderPointPanel("stableBasicAgeOutput", "stable-result-output age-bullet-output age-final-range-output", [
        ["Message", "Date to calculate must be after birthdate."]
      ]);
      return;
    }

    const dateRange = formatDateDMY(birthdate) + " to " + formatDateDMY(targetDate);

    renderPointPanel("stableBasicAgeOutput", "stable-result-output age-bullet-output age-final-range-output", [
      ["Date range", escapeHTML(dateRange)],
      ["Normal age", normalAge + " years old"],
      ["Asian age", asianAge + " years old"]
    ], "Date range: " + dateRange + "\nNormal age: " + normalAge + " years old\nAsian age: " + asianAge + " years old");

    hideNativeResult(["result", "ageResult"]);
  }

  /* =====================================================
     BMI
  ===================================================== */

  function getBmiUnit() {
    const button = document.getElementById("unitToggleBtn");
    const saved = document.body.dataset.bmiUnit;

    if (button && button.dataset.currentUnit) {
      return button.dataset.currentUnit.toUpperCase() === "US" ? "US" : "SI";
    }

    if (saved) {
      return saved.toUpperCase() === "US" ? "US" : "SI";
    }

    return "SI";
  }

  function setBmiUnit(unit) {
    const clean = unit === "US" ? "US" : "SI";
    const button = document.getElementById("unitToggleBtn");

    document.body.dataset.bmiUnit = clean.toLowerCase();

    if (button) {
      button.dataset.currentUnit = clean.toLowerCase();
      button.textContent = clean;
    }

    const weightLabel = document.getElementById("weightLabel") || document.querySelector('label[for="weight"]');
    const heightLabel = document.getElementById("heightLabel") || document.querySelector('label[for="height"]');
    const waistLabel = document.getElementById("waistLabel") || document.querySelector('label[for="waist"]');

    const weight = document.getElementById("weight");
    const height = document.getElementById("height");
    const waist = document.getElementById("waist");

    if (clean === "US") {
      if (weightLabel) weightLabel.textContent = "Weight in lbs:";
      if (heightLabel) heightLabel.textContent = "Height in inches:";
      if (waistLabel) waistLabel.textContent = "Waist circumference in inches:";
      if (weight) weight.placeholder = "Example: 154";
      if (height) height.placeholder = "Example: 67";
      if (waist) waist.placeholder = "Optional, Example: 32";
    } else {
      if (weightLabel) weightLabel.textContent = "Weight in kg:";
      if (heightLabel) heightLabel.textContent = "Height in cm:";
      if (waistLabel) waistLabel.textContent = "Waist circumference in cm:";
      if (weight) weight.placeholder = "Example: 70";
      if (height) height.placeholder = "Example: 170";
      if (waist) waist.placeholder = "Optional, Example: 80";
    }
  }

  function toggleBMIUnit() {
    setBmiUnit(getBmiUnit() === "SI" ? "US" : "SI");
    scheduleAutoCalculate();
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }

  function waistHeightFractionLabel() {
    return (
      '<span class="bmi-waist-height-fraction" aria-label="Waist divided by height">' +
        '<span class="bmi-waist-height-top">Waist</span>' +
        '<span class="bmi-waist-height-line"></span>' +
        '<span class="bmi-waist-height-bottom">Height</span>' +
      '</span> ratio'
    );
  }

  function calculateBMI() {
    const weight = firstNumber(["weight", "bmiWeight"]);
    const height = firstNumber(["height", "bmiHeight"]);
    const waist = firstNumber(["waist", "bmiWaist", "waistSize"]);

    if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) return;

    const unit = getBmiUnit();
    let bmi;

    if (unit === "US") {
      bmi = 703 * weight / (height * height);
    } else {
      const heightM = height > 3 ? height / 100 : height;
      bmi = weight / (heightM * heightM);
    }

    const rows = [
      ["BMI", bmi.toFixed(2)],
      ["BMI status", bmiCategory(bmi)]
    ];

    let copyValue =
      "BMI: " + bmi.toFixed(2) + "\n" +
      "BMI status: " + bmiCategory(bmi);

    if (Number.isFinite(waist) && waist > 0) {
      const ratio = waist / height;
      let condition = "Healthy range";
      if (ratio >= 0.5 && ratio < 0.6) condition = "Increased risk";
      else if (ratio >= 0.6) condition = "High risk";

      rows.push([waistHeightFractionLabel(), ratio.toFixed(2)]);
      rows.push(["Condition", condition]);

      copyValue += "\nWaist/height ratio: " + ratio.toFixed(2) + "\nCondition: " + condition;
    }

    renderPointPanel("stableBmiOutput", "stable-result-output bmi-final-output", rows, copyValue);
    hideNativeResult(["bmiResult", "result"]);
  }

  /* =====================================================
     DISCOUNT + PERCENTAGE
  ===================================================== */

  function calculateDiscount() {
    const price = firstNumber(["price", "originalPrice", "amount"]);
    const discount = firstNumber(["discount", "discountRate"]);

    if (!Number.isFinite(price) || !Number.isFinite(discount) || price <= 0 || discount < 0 || discount > 100) return;

    const savings = price * discount / 100;
    const finalPrice = price - savings;

    renderPointPanel("stableDiscountOutput", "stable-result-output discount-result-output", [
      ["Original price", money(price)],
      ["Discount", discount + "%"],
      ["Savings", money(savings)],
      ["Final price", money(finalPrice)]
    ], "Original price: " + money(price) + "\nDiscount: " + discount + "%\nSavings: " + money(savings) + "\nFinal price: " + money(finalPrice));

    hideNativeResult(["discountResult", "result"]);
  }

  function calculatePercentage() {
    const percentage = firstNumber(["percentage", "percent"]);
    const number = firstNumber(["number", "amount", "value"]);

    if (!Number.isFinite(percentage) || !Number.isFinite(number)) return;

    const answer = percentage / 100 * number;

    renderPointPanel("stablePercentageOutput", "stable-result-output percentage-result-output", [
      ["Percentage", percentage + "%"],
      ["Number", money(number)],
      ["Result", money(answer)]
    ], "Percentage: " + percentage + "%\nNumber: " + money(number) + "\nResult: " + money(answer));

    hideNativeResult(["percentageResult", "result"]);
  }

  /* =====================================================
     LOAN / MORTGAGE
  ===================================================== */

  function ensureLoanOptionalBoxes() {
    if (getPageType() !== "loan") return;

    const calculator = getCalculator();
    if (!calculator) return;

    let row = calculator.querySelector(".loan-optional-row");

    if (!row) {
      row = document.createElement("div");
      row.className = "loan-optional-row";
      const result = document.getElementById("loanResult");
      if (result) result.insertAdjacentElement("beforebegin", row);
      else calculator.appendChild(row);
    }

    if (!document.getElementById("optionalMortgageCostsBox")) {
      const box = document.createElement("div");
      box.id = "optionalMortgageCostsBox";
      box.className = "optional-mortgage-costs";
      box.innerHTML =
        '<button type="button" class="optional-mortgage-toggle" aria-expanded="false">Optional costs</button>' +
        '<div class="optional-mortgage-content" hidden>' +
          '<label for="propertyTaxYearly">Property tax yearly:</label>' +
          '<input type="number" id="propertyTaxYearly" placeholder="Optional, example: 1200" inputmode="decimal">' +
          '<label for="homeInsuranceYearly">Insurance yearly:</label>' +
          '<input type="number" id="homeInsuranceYearly" placeholder="Optional, example: 800" inputmode="decimal">' +
          '<label for="otherMonthlyFees">Other monthly fees:</label>' +
          '<input type="number" id="otherMonthlyFees" placeholder="Optional, example: 100" inputmode="decimal">' +
        '</div>';
      row.appendChild(box);
    }

    if (!document.getElementById("earlySettlementBox")) {
      const box = document.createElement("div");
      box.id = "earlySettlementBox";
      box.className = "early-settlement-box";
      box.innerHTML =
        '<button type="button" class="early-settlement-toggle" aria-expanded="false">Optional early settlement</button>' +
        '<div class="early-settlement-content" hidden>' +
          '<label for="extraMonthlyPayment">Extra monthly payment:</label>' +
          '<input type="number" id="extraMonthlyPayment" placeholder="Optional, example: 200" inputmode="decimal">' +
          '<label for="oneTimeExtraPayment">One-time extra payment:</label>' +
          '<input type="number" id="oneTimeExtraPayment" placeholder="Optional, example: 5000" inputmode="decimal">' +
          '<label for="yearlyLumpSumPayment">Yearly lump sum:</label>' +
          '<input type="number" id="yearlyLumpSumPayment" placeholder="Optional, example: 5000" inputmode="decimal">' +
        '</div>';
      row.appendChild(box);
    }

    setupToggle(".optional-mortgage-toggle", ".optional-mortgage-content");
    setupToggle(".early-settlement-toggle", ".early-settlement-content");
    setupNumberInputs();
  }

  function setupToggle(buttonSelector, contentSelector) {
    const button = document.querySelector(buttonSelector);
    const content = document.querySelector(contentSelector);

    if (!button || !content || button.dataset.cleanToggleReady === "true") return;

    button.dataset.cleanToggleReady = "true";

    button.addEventListener("click", function (event) {
      event.preventDefault();

      const open = content.hidden;
      content.hidden = !open;
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function calculateNormalMonthlyPayment(principal, annualRate, months) {
    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
      return principal / months;
    }

    return (
      principal *
      monthlyRate *
      Math.pow(1 + monthlyRate, months)
    ) / (
      Math.pow(1 + monthlyRate, months) - 1
    );
  }

  function getOptionalMonthlyCost() {
    const propertyTaxYearly = firstNumber(["propertyTaxYearly"]);
    const insuranceYearly = firstNumber(["homeInsuranceYearly"]);
    const otherMonthly = firstNumber(["otherMonthlyFees"]);

    return positive(propertyTaxYearly) / 12 + positive(insuranceYearly) / 12 + positive(otherMonthly);
  }

  function buildLoanMonthlyRows(amountBorrowed, annualRate, months, normalMonthlyPayment, optionalMonthlyCost, extraMonthlyPayment, oneTimeExtraPayment, yearlyLumpSum) {
    const monthlyRate = annualRate / 100 / 12;

    let balance = amountBorrowed;
    let totalInterestPaid = 0;
    let totalPaid = 0;

    const rows = [];

    for (let month = 1; month <= months && balance > 0; month += 1) {
      const interestThisMonth = balance * monthlyRate;

      let normalPrincipal = normalMonthlyPayment - interestThisMonth;
      if (normalPrincipal < 0) normalPrincipal = 0;

      let extraThisMonth = extraMonthlyPayment;
      if (month === 1) extraThisMonth += oneTimeExtraPayment;
      if (month % 12 === 0) extraThisMonth += yearlyLumpSum;

      let principalThisMonth = normalPrincipal + extraThisMonth;
      if (principalThisMonth > balance) principalThisMonth = balance;

      balance -= principalThisMonth;
      if (balance < 0.01) balance = 0;

      const actualPaymentThisMonth = principalThisMonth + interestThisMonth + optionalMonthlyCost;

      totalInterestPaid += interestThisMonth;
      totalPaid += actualPaymentThisMonth;

      rows.push({
        month: month,
        principalPaid: principalThisMonth,
        interestPaid: interestThisMonth,
        totalPayment: totalPaid,
        totalInterestPaid: totalInterestPaid,
        remainingBalance: balance
      });
    }

    return rows;
  }

  function groupLoanRowsByYear(monthRows) {
    const yearRows = [];

    for (let i = 0; i < monthRows.length; i += 12) {
      const group = monthRows.slice(i, i + 12);
      const last = group[group.length - 1];

      yearRows.push({
        label: yearRows.length + 1,
        principalPaid: group.reduce(function (sum, row) { return sum + row.principalPaid; }, 0),
        interestPaid: group.reduce(function (sum, row) { return sum + row.interestPaid; }, 0),
        totalPayment: last.totalPayment,
        totalInterestPaid: last.totalInterestPaid,
        remainingBalance: last.remainingBalance
      });
    }

    return yearRows;
  }

  function calculateLoan() {
    ensureLoanOptionalBoxes();

    const purchasePrice = firstNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = firstNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const months = firstNumber(["years", "loanYears", "loanTerm", "term"]);
    const downPayment = positive(firstNumber(["downPayment", "loanDownPayment"]));

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(annualRate) ||
      !Number.isFinite(months) ||
      purchasePrice <= 0 ||
      annualRate < 0 ||
      months <= 0 ||
      downPayment >= purchasePrice
    ) {
      return;
    }

    const amountBorrowed = purchasePrice - downPayment;
    const optionalMonthlyCost = getOptionalMonthlyCost();

    const extraMonthlyPayment = positive(firstNumber(["extraMonthlyPayment"]));
    const oneTimeExtraPayment = positive(firstNumber(["oneTimeExtraPayment"]));
    const yearlyLumpSum = positive(firstNumber(["yearlyLumpSumPayment"]));

    const normalMonthlyPayment = calculateNormalMonthlyPayment(amountBorrowed, annualRate, months);

    const monthlyRows = buildLoanMonthlyRows(
      amountBorrowed,
      annualRate,
      months,
      normalMonthlyPayment,
      optionalMonthlyCost,
      extraMonthlyPayment,
      oneTimeExtraPayment,
      yearlyLumpSum
    );

    if (!monthlyRows.length) return;

    const useMonthlyTable = months < 13;
    const rows = useMonthlyTable
      ? monthlyRows.map(function (row) {
          return {
            label: row.month,
            principalPaid: row.principalPaid,
            interestPaid: row.interestPaid,
            totalPayment: row.totalPayment,
            totalInterestPaid: row.totalInterestPaid,
            remainingBalance: row.remainingBalance
          };
        })
      : groupLoanRowsByYear(monthlyRows);

    const finalRow = monthlyRows[monthlyRows.length - 1];
    const totalInterest = finalRow.totalInterestPaid;
    const totalPayment = finalRow.totalPayment;
    const settlementMonths = monthlyRows.length;

    const firstColumnTitle = useMonthlyTable ? "Month" : "Year";
    const tableTitle = useMonthlyTable ? "Mortgage monthly table" : "Mortgage yearly table";

    const summaryHtml =
      '<div class="mortgage-summary-row">' +
        '<div class="mortgage-summary-card"><span>Monthly payment</span><strong>' + money(normalMonthlyPayment + optionalMonthlyCost) + '</strong></div>' +
        '<div class="mortgage-summary-card"><span>Total interest</span><strong>' + money(totalInterest) + '</strong></div>' +
        '<div class="mortgage-summary-card"><span>Total payment</span><strong>' + money(totalPayment) + '</strong></div>' +
      '</div>' +
      (settlementMonths < months ? '<p class="mortgage-settlement-note"><strong>Settled after:</strong> ' + settlementMonths + ' months</p>' : "");

    const tableRows = rows.map(function (row) {
      return (
        "<tr>" +
          "<td>" + row.label + "</td>" +
          "<td>" + money(row.principalPaid) + "</td>" +
          "<td>" + money(row.interestPaid) + "</td>" +
          "<td>" + money(row.totalPayment) + "</td>" +
          "<td>" + money(row.totalInterestPaid) + "</td>" +
          "<td>" + money(row.remainingBalance) + "</td>" +
        "</tr>"
      );
    }).join("");

    const tableHtml =
      '<div class="mortgage-year-table-box mortgage-single-table-box">' +
        '<h3>' + tableTitle + '</h3>' +
        '<div class="mortgage-year-table-scroll">' +
          '<table class="mortgage-year-table mortgage-important-table">' +
            '<thead><tr>' +
              '<th>' + firstColumnTitle + '</th>' +
              '<th>Principal paid</th>' +
              '<th>Interest paid</th>' +
              '<th>Total payment</th>' +
              '<th>Total interest</th>' +
              '<th>Remaining balance</th>' +
            '</tr></thead>' +
            '<tbody>' + tableRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    const copyValue =
      "Monthly payment: " + money(normalMonthlyPayment + optionalMonthlyCost) + "\n" +
      "Total interest: " + money(totalInterest) + "\n" +
      "Total payment: " + money(totalPayment) + "\n" +
      "Settled after: " + settlementMonths + " months\n\n" +
      firstColumnTitle + "\tPrincipal paid\tInterest paid\tTotal payment\tTotal interest\tRemaining balance\n" +
      rows.map(function (row) {
        return (
          row.label + "\t" +
          money(row.principalPaid) + "\t" +
          money(row.interestPaid) + "\t" +
          money(row.totalPayment) + "\t" +
          money(row.totalInterestPaid) + "\t" +
          money(row.remainingBalance)
        );
      }).join("\n");

    renderTablePanel("loanExternalOutput", "loan-external-output", "Result", summaryHtml, tableHtml, copyValue);
    hideNativeResult(["loanResult", "result"]);
  }

  /* =====================================================
     COMPOUND
  ===================================================== */

  function ensureCompoundContributionInputs() {
    if (getPageType() !== "compound") return;

    const calculator = getCalculator();
    if (!calculator) return;

    if (!document.getElementById("additionalMoney")) {
      const label = document.createElement("label");
      label.setAttribute("for", "additionalMoney");
      label.textContent = "Additional money:";

      const input = document.createElement("input");
      input.type = "number";
      input.id = "additionalMoney";
      input.placeholder = "Optional, example: 100";
      input.setAttribute("inputmode", "decimal");

      const result = document.getElementById("compoundResult");
      if (result) {
        result.insertAdjacentElement("beforebegin", input);
        input.insertAdjacentElement("beforebegin", label);
      }
    }

    if (!document.getElementById("additionalMoneyFrequency")) {
      const label = document.createElement("label");
      label.setAttribute("for", "additionalMoneyFrequency");
      label.textContent = "Add money every:";

      const select = document.createElement("select");
      select.id = "additionalMoneyFrequency";
      select.innerHTML =
        '<option value="monthly">Monthly</option>' +
        '<option value="weekly">Weekly</option>' +
        '<option value="daily">Daily</option>';

      const result = document.getElementById("compoundResult");
      if (result) {
        result.insertAdjacentElement("beforebegin", select);
        select.insertAdjacentElement("beforebegin", label);
      }
    }

    setupNumberInputs();
  }

  function getContributionPerYear(value) {
    const text = String(value || "").trim().toLowerCase();

    if (text === "daily") return 365;
    if (text === "weekly") return 52;

    return 12;
  }

  function getContributionLabel(value) {
    const text = String(value || "").trim().toLowerCase();

    if (text === "daily") return "Daily";
    if (text === "weekly") return "Weekly";

    return "Monthly";
  }

  function buildYearPoints(years) {
    const fullYears = Math.floor(years);
    const points = [];

    for (let year = 1; year <= fullYears; year += 1) {
      points.push(year);
    }

    if (years > 0 && !Number.isInteger(years)) {
      points.push(years);
    }

    return points.slice(0, 60);
  }

  function calculateCompoundYearValue(principal, annualRate, compoundPerYear, year, contribution, contributionPerYear) {
    const nominalRate = annualRate / 100;

    const effectiveAnnualRate =
      compoundPerYear > 0
        ? Math.pow(1 + nominalRate / compoundPerYear, compoundPerYear) - 1
        : nominalRate;

    const contributionPeriodRate =
      Math.pow(1 + effectiveAnnualRate, 1 / contributionPerYear) - 1;

    const periods = Math.floor(year * contributionPerYear);
    const principalValue = principal * Math.pow(1 + effectiveAnnualRate, year);

    let contributionValue = 0;

    if (contribution > 0 && periods > 0) {
      if (contributionPeriodRate === 0) {
        contributionValue = contribution * periods;
      } else {
        contributionValue =
          contribution *
          ((Math.pow(1 + contributionPeriodRate, periods) - 1) / contributionPeriodRate);
      }
    }

    const additionalMoney = contribution * periods;
    const totalMoneyAdded = principal + additionalMoney;
    const futureValue = principalValue + contributionValue;
    const interestEarned = futureValue - totalMoneyAdded;

    return {
      year: year,
      principal: principal,
      additionalMoney: additionalMoney,
      totalMoneyAdded: totalMoneyAdded,
      interestEarned: interestEarned,
      futureValue: futureValue
    };
  }

  function calculateCompound() {
    ensureCompoundContributionInputs();

    const principal = firstNumber(["principal", "compoundPrincipal", "amount"]);
    const rate = firstNumber(["rate", "compoundRate", "interest", "interestRate"]);
    const years = firstNumber(["years", "compoundYears", "time"]);
    const frequency = firstNumber(["frequency", "compoundFrequency"]) || 1;
    const additionalRaw = firstNumber(["additionalMoney"]);
    const additionalMoney = positive(additionalRaw);
    const contributionFrequency = firstValue(["additionalMoneyFrequency"]) || "monthly";
    const contributionPerYear = getContributionPerYear(contributionFrequency);
    const contributionLabel = getContributionLabel(contributionFrequency);

    if (
      !Number.isFinite(principal) ||
      !Number.isFinite(rate) ||
      !Number.isFinite(years) ||
      principal <= 0 ||
      rate < 0 ||
      years <= 0 ||
      frequency <= 0
    ) {
      return;
    }

    const yearPoints = buildYearPoints(years);
    if (!yearPoints.length) return;

    const values = yearPoints.map(function (year) {
      return calculateCompoundYearValue(
        principal,
        rate,
        frequency,
        year,
        additionalMoney,
        contributionPerYear
      );
    });

    const finalItem = values[values.length - 1];
    const headers = values.map(function (item) {
      return "<th>Year " + item.year + "</th>";
    }).join("");

    function row(label, key) {
      return (
        "<tr>" +
          "<th>" + label + "</th>" +
          values.map(function (item) {
            return "<td>" + money(item[key]) + "</td>";
          }).join("") +
        "</tr>"
      );
    }

    const summaryHtml =
      '<div class="compound-summary-row">' +
        '<div class="compound-summary-card"><span>Future value</span><strong>' + money(finalItem.futureValue) + '</strong></div>' +
        '<div class="compound-summary-card"><span>Interest earned</span><strong>' + money(finalItem.interestEarned) + '</strong></div>' +
        '<div class="compound-summary-card"><span>Total money added</span><strong>' + money(finalItem.totalMoneyAdded) + '</strong></div>' +
      '</div>' +
      '<p class="compound-contribution-note"><strong>Additional money:</strong> ' + money(additionalMoney) + ' ' + contributionLabel.toLowerCase() + '</p>';

    const tableHtml =
      '<div class="compound-year-table-box">' +
        '<h3>Compound interest by year</h3>' +
        '<div class="compound-year-table-scroll">' +
          '<table class="compound-year-matrix-table">' +
            '<thead><tr><th>Item</th>' + headers + '</tr></thead>' +
            '<tbody>' +
              row("Principal", "principal") +
              row("Additional money", "additionalMoney") +
              row("Total money added", "totalMoneyAdded") +
              row("Interest earned", "interestEarned") +
              row("Future value", "futureValue") +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    const copyValue =
      "Additional money: " + money(additionalMoney) + " " + contributionLabel.toLowerCase() + "\n\n" +
      "Item\t" + values.map(function (item) { return "Year " + item.year; }).join("\t") + "\n" +
      "Principal\t" + values.map(function (item) { return money(item.principal); }).join("\t") + "\n" +
      "Additional money\t" + values.map(function (item) { return money(item.additionalMoney); }).join("\t") + "\n" +
      "Total money added\t" + values.map(function (item) { return money(item.totalMoneyAdded); }).join("\t") + "\n" +
      "Interest earned\t" + values.map(function (item) { return money(item.interestEarned); }).join("\t") + "\n" +
      "Future value\t" + values.map(function (item) { return money(item.futureValue); }).join("\t");

    renderTablePanel("compoundYearMatrixOutput", "loan-style-output-panel compound-year-matrix-output", "Result", summaryHtml, tableHtml, copyValue);
    hideNativeResult(["compoundResult", "result"]);
  }

  /* =====================================================
     INSTRUCTIONS
  ===================================================== */

  function getPageData() {
    const type = getPageType();

    const data = {
      age: {
        what: "It calculates normal age and Asian age from a selected birth date.",
        how: "Select your birth date. The result updates automatically.",
        formula: "Normal age is based on the difference between the target date and birth date. Asian age uses target year − birth year + 1.",
        example: "If someone was born in 2000 and the target year is 2026, Asian age is 27."
      },
      bmi: {
        what: "It calculates Body Mass Index and can also check waist-to-height ratio.",
        how: "Choose SI or US units, enter weight and height, optionally enter waist size. The result updates automatically.",
        formula: "SI: BMI = weight kg ÷ height m². US: BMI = weight lb ÷ height inch² × 703.",
        example: "70 kg and 1.70 m gives BMI = 24.22."
      },
      loan: {
        what: "It estimates mortgage or personal loan monthly payment, interest, total payment, and remaining balance.",
        how: "Enter loan amount, annual interest rate, and loan term in months. The result updates automatically.",
        formula: "Monthly Payment = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where n is the loan term in months.",
        example: "A 10,000 loan at 5% yearly for 60 months gives an estimated monthly payment."
      },
      discount: {
        what: "It calculates final price after discount and how much money you save.",
        how: "Enter the original price and discount percentage. The result updates automatically.",
        formula: "Savings = original price × discount ÷ 100. Final price = original price − savings.",
        example: "If price is 100 and discount is 20%, savings = 20 and final price = 80."
      },
      percentage: {
        what: "It calculates a percentage of a number.",
        how: "Enter the percentage value and the number. The result updates automatically.",
        formula: "Result = percentage ÷ 100 × number.",
        example: "20% of 150 = 30."
      },
      compound: {
        what: "It estimates how much your money can grow when interest is added repeatedly over time.",
        how: "Enter principal amount, annual interest rate, time in years, and compounding frequency. The result updates automatically.",
        formula: "A = P(1 + r/n)ⁿᵗ.",
        example: "P = 1000, r = 5%, t = 10 years, n = 12 gives about 1,647.01 future value."
      }
    };

    return data[type] || null;
  }

  function buildInstructionLayout() {
    const main = document.querySelector("main");
    if (!main || !isCalculatorPage()) return;
    if (getPageType() === "basic") return;

    if (main.querySelector(":scope > .instruction-box")) return;

    const data = getPageData();
    if (!data) return;

    main.classList.add("has-instructions");

    const box = document.createElement("aside");
    box.className = "instruction-box";
    box.setAttribute("aria-label", "Instructions and references");

    box.innerHTML =
      '<div class="instruction-section instruction-what-box"><h3>What does this calculator do?</h3><p>' + escapeHTML(data.what) + '</p></div>' +
      '<h2 class="instruction-main-title">Instructions</h2>' +
      '<div class="instruction-section instruction-how-box"><h3>How to use it</h3><p>' + escapeHTML(data.how) + '</p></div>' +
      '<div class="instruction-section instruction-formula-box"><h3>Formula used</h3><p>' + escapeHTML(data.formula) + '</p></div>' +
      '<div class="instruction-section instruction-example-box"><h3>Example calculation</h3><p>' + escapeHTML(data.example) + '</p></div>';

    main.appendChild(box);
  }

  /* =====================================================
     AUTO CALCULATE
  ===================================================== */

  function hasValue(ids) {
    return firstValue(ids) !== "";
  }

  function isReadyToCalculate(type) {
    if (type === "basic" || !type) return false;

    if (type === "age") {
      return hasValue(["birthdate", "birthDate", "dob"]);
    }

    if (type === "bmi") {
      return hasValue(["weight", "bmiWeight"]) && hasValue(["height", "bmiHeight"]);
    }

    if (type === "loan") {
      return (
        hasValue(["amount", "loanAmount", "principal", "loanPrincipal"]) &&
        hasValue(["interest", "loanRate", "interestRate", "annualRate", "rate"]) &&
        hasValue(["years", "loanYears", "loanTerm", "term"])
      );
    }

    if (type === "discount") {
      return hasValue(["price", "originalPrice", "amount"]) && hasValue(["discount", "discountRate"]);
    }

    if (type === "percentage") {
      return hasValue(["percentage", "percent"]) && hasValue(["number", "amount", "value"]);
    }

    if (type === "compound") {
      return (
        hasValue(["principal", "compoundPrincipal", "amount"]) &&
        hasValue(["rate", "compoundRate", "interest", "interestRate"]) &&
        hasValue(["years", "compoundYears", "time"])
      );
    }

    return false;
  }

  function getCalculateFunction(type) {
    if (type === "age") return calculateAge;
    if (type === "bmi") return calculateBMI;
    if (type === "loan") return calculateLoan;
    if (type === "discount") return calculateDiscount;
    if (type === "percentage") return calculatePercentage;
    if (type === "compound") return calculateCompound;

    return null;
  }

  function currentInputSignature() {
    const calculator = getCalculator();
    if (!calculator) return "";

    return $$("input, select, textarea", calculator)
      .filter(function (input) {
        return input.type !== "hidden" && input.id !== "display";
      })
      .map(function (input) {
        return (input.id || input.name || "") + "=" + String(input.value || "");
      })
      .join("&");
  }

  function runAutoCalculate(force) {
    const type = getPageType();
    if (type === "basic" || !type) return;

    if (!isReadyToCalculate(type)) return;

    const signature = currentInputSignature();
    if (!force && signature === lastAutoSignature) return;

    const fn = getCalculateFunction(type);
    if (typeof fn !== "function") return;

    if (isAutoCalculating) return;

    isAutoCalculating = true;
    lastAutoSignature = signature;

    try {
      fn();
    } finally {
      setTimeout(function () {
        isAutoCalculating = false;
      }, 80);
    }
  }

  function scheduleAutoCalculate(force) {
    clearTimeout(autoTimer);

    autoTimer = setTimeout(function () {
      runAutoCalculate(!!force);
    }, AUTO_DELAY);
  }

  function setupAutoCalculate() {
    const type = getPageType();
    if (type === "basic" || !type) return;

    document.addEventListener("input", function (event) {
      const target = event.target;
      if (!target || !target.closest || !target.closest(".calculator")) return;

      scheduleAutoCalculate(false);
    }, true);

    document.addEventListener("change", function (event) {
      const target = event.target;
      if (!target || !target.closest || !target.closest(".calculator")) return;

      scheduleAutoCalculate(true);
    }, true);

    setTimeout(function () {
      runAutoCalculate(true);
    }, 700);
  }

  /* =====================================================
     SHARED UI
  ===================================================== */

  function setupScrollButton() {
    const scrollBtn = document.getElementById("scrollTopBtn");
    if (!scrollBtn) return;

    window.addEventListener("scroll", function () {
      scrollBtn.style.display = window.scrollY > 200 ? "flex" : "none";
    }, { passive: true });
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function toggleMenu() {
    const navbar = document.getElementById("navbar");
    if (navbar) navbar.classList.toggle("open");
  }

  function init() {
    applyPageBodyClass();
    removeNonBasicHistoryBoxes();
    removeNonBasicCalculateButtons();
    setupNumberInputs();
    setupKeyboardSupport();
    setupScrollButton();

    if (getPageType() === "basic") {
      showHistory();
    } else {
      ensureAgeTargetDateInput();
      ensureLoanOptionalBoxes();
      ensureCompoundContributionInputs();
      buildInstructionLayout();
      setupAutoCalculate();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* =====================================================
     GLOBAL EXPORTS
  ===================================================== */

  window.add = add;
  window.clearDisplay = clearDisplay;
  window.removeLast = removeLast;
  window.addFunction = addFunction;
  window.addPower = addPower;
  window.calculate = calculate;
  window.showHistory = showHistory;
  window.clearHistory = clearHistory;
  window.copyText = copyText;
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
})();
