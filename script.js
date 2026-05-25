/*
  Copyright © 2026 Hamdi. All rights reserved.
  Do not copy, modify, or redistribute without permission.

  SHARED SCRIPT ONLY
  - Calculator functions and page data
  - Result/history logic
  - No PC-only layout code
  - No phone-only menu code
*/

(function () {
  "use strict";

  const MAX_HISTORY_ITEMS = 50;

  /* =====================================================
     SAFE HELPERS
  ===================================================== */

  const $ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  const $$ = function (selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  };

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

  function setButtonState(button, text) {
    if (!button) return;

    const oldText = button.dataset.originalText || button.textContent || "Copy";
    button.dataset.originalText = oldText;
    button.textContent = text;

    setTimeout(function () {
      button.textContent = oldText;
    }, 1000);
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
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

  function numberValue(id) {
    const input = document.getElementById(id);
    return input ? Number(String(input.value || "").replace(/,/g, "").trim()) : NaN;
  }

  function stringValue(id) {
    const input = document.getElementById(id);
    return input ? String(input.value || "").trim() : "";
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
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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
    if (title.includes("loan") || document.body.classList.contains("loan-page") || document.getElementById("loanResult")) return "loan";
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

  function getResultElement() {
    const selectors = [
      "#result",
      "#ageResult",
      "#bmiResult",
      "#loanResult",
      "#discountResult",
      "#percentageResult",
      "#compoundResult"
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return null;
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

    if (functionMap[func]) {
      display.value += functionMap[func];
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
      renderUniversalLoanStyleResult();
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
    safeRemove("calcHistory");
    safeRemove("basicInputOutputHistory");
    showHistory();
  }

  function copyHistoryItem(text, button) {
    copyText(text, button);
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
     OTHER CALCULATOR FUNCTIONS
  ===================================================== */

  function calculateNormalAgeFromBirthdate(birthdateValue) {
    if (!birthdateValue) return "";

    const parts = birthdateValue.split("-");
    if (parts.length !== 3) return "";

    const birthYear = Number(parts[0]);
    const birthMonth = Number(parts[1]) - 1;
    const birthDay = Number(parts[2]);

    const today = new Date();
    const birthDate = new Date(birthYear, birthMonth, birthDay);

    if (birthDate > today) return "";

    let age = today.getFullYear() - birthYear;
    const birthdayThisYear = new Date(today.getFullYear(), birthMonth, birthDay);

    if (today < birthdayThisYear) age -= 1;

    return age;
  }

  function calculateAsianAgeFromBirthdate(birthdateValue) {
    if (!birthdateValue) return "";

    const birthYear = Number(birthdateValue.split("-")[0]);
    const currentYear = new Date().getFullYear();

    if (!birthYear || birthYear > currentYear) return "";

    return currentYear - birthYear + 1;
  }

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

  function getAgeResultPanel() {
    const main = document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById("stableBasicAgeOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "stableBasicAgeOutput";
      panel.className = "stable-result-output age-bullet-output age-final-range-output";
      panel.setAttribute("aria-label", "Age calculator result");

      panel.innerHTML =
        '<div class="stable-result-top">' +
          '<div class="stable-result-panel">' +
            '<h2 class="stable-result-title">Result</h2>' +
            '<div class="stable-result-body"></div>' +
          '</div>' +
          '<div class="stable-copy-side">' +
            '<button type="button" class="stable-copy-btn">Copy</button>' +
          '</div>' +
        '</div>';

      calculator.insertAdjacentElement("afterend", panel);
    }

    panel.classList.add("age-bullet-output", "age-final-range-output");

    return panel;
  }

  function hideOldAgePanels() {
    const universal = document.getElementById("universalLoanStyleOutput");
    if (universal) {
      universal.hidden = true;
      universal.style.setProperty("display", "none", "important");
      universal.style.setProperty("visibility", "hidden", "important");
      universal.style.setProperty("pointer-events", "none", "important");
    }

    const oldResult = document.getElementById("ageResult") || document.getElementById("result");
    if (oldResult) {
      oldResult.style.display = "none";
    }
  }

  function renderAgeDateRangeResult(birthdate, targetDate, normalAge, asianAge) {
    const panel = getAgeResultPanel();
    if (!panel) return;

    const dateRange = formatDateDMY(birthdate) + " to " + formatDateDMY(targetDate);
    const body = panel.querySelector(".stable-result-body");

    if (body) {
      body.innerHTML =
        '<ul class="age-bullet-result age-final-range-result">' +
          '<li><strong>Date range:</strong> ' + dateRange + '</li>' +
          '<li><strong>Normal age:</strong> ' + normalAge + ' years old</li>' +
          '<li><strong>Asian age:</strong> ' + asianAge + ' years old</li>' +
        '</ul>';
    }

    const copyBtn = panel.querySelector(".stable-copy-btn");
    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        copyText(
          "• Date range: " + dateRange + "\n" +
          "• Normal age: " + normalAge + " years old\n" +
          "• Asian age: " + asianAge + " years old",
          copyBtn
        );
      };
    }

    panel.hidden = false;
    panel.style.removeProperty("display");
    hideOldAgePanels();
  }

  function calculateAge() {
    const birthdate = firstValue(["birthdate", "birthDate", "dob"]);
    const targetInput = ensureAgeTargetDateInput();
    const result = document.getElementById("ageResult") || document.getElementById("result");

    if (!birthdate) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please select your birthdate.";
      }

      const panel = document.getElementById("stableBasicAgeOutput");
      if (panel) panel.hidden = true;
      return;
    }

    const targetDate = targetInput ? String(targetInput.value || "").trim() : todayValueISO();
    const normalAge = calculateNormalAgeBetweenDates(birthdate, targetDate);
    const asianAge = calculateAsianAgeBetweenDates(birthdate, targetDate);

    if (normalAge === "" || asianAge === "") {
      if (result) {
        result.style.display = "block";
        result.innerText = "Date to calculate must be after birthdate.";
      }

      const panel = document.getElementById("stableBasicAgeOutput");
      if (panel) panel.hidden = true;
      return;
    }

    if (result) {
      result.innerText =
        "Date range: " + formatDateDMY(birthdate) + " to " + formatDateDMY(targetDate) + "\n" +
        "Normal age: " + normalAge + " years old\n" +
        "Asian age: " + asianAge + " years old";
      result.style.display = "none";
    }

    addInputHistory("age");
    renderAgeDateRangeResult(birthdate, targetDate, normalAge, asianAge);
  }

  function calculateBMI() {
    const weight = firstNumber(["weight", "bmiWeight"]);
    const height = firstNumber(["height", "bmiHeight"]);
    const result = document.getElementById("bmiResult") || document.getElementById("result");

    if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
      if (result) result.innerText = "Please enter valid weight and height.";
      return;
    }

    const unit = (firstValue(["unit", "bmiUnit"]) || "metric").toLowerCase();
    let bmi;

    if (unit.includes("us") || unit.includes("imperial") || height > 3) {
      bmi = 703 * weight / (height * height);
    } else {
      bmi = weight / (height * height);
    }

    let category = "Normal";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 25 && bmi < 30) category = "Overweight";
    else if (bmi >= 30) category = "Obese";

    if (result) {
      result.innerText =
        "BMI: " + bmi.toFixed(2) + "\n" +
        "Category: " + category;
    }

    addInputHistory();
    renderUniversalLoanStyleResult();
  }

  function calculateDiscount() {
    const price = firstNumber(["price", "originalPrice", "amount"]);
    const discount = firstNumber(["discount", "discountRate", "percent"]);
    const result = document.getElementById("discountResult") || document.getElementById("result");

    if (!Number.isFinite(price) || !Number.isFinite(discount) || price <= 0 || discount < 0 || discount > 100) {
      if (result) result.innerText = "Please enter valid discount details.";
      return;
    }

    const savings = price * discount / 100;
    const finalPrice = price - savings;

    if (result) {
      result.innerText =
        "Savings: " + money(savings) + "\n" +
        "Final price: " + money(finalPrice);
    }

    addInputHistory();
    renderUniversalLoanStyleResult();
  }

  function calculatePercentage() {
    const percentage = firstNumber(["percentage", "percent"]);
    const number = firstNumber(["number", "amount", "value"]);
    const result = document.getElementById("percentageResult") || document.getElementById("result");

    if (!Number.isFinite(percentage) || !Number.isFinite(number)) {
      if (result) result.innerText = "Please enter valid percentage details.";
      return;
    }

    const answer = percentage / 100 * number;

    if (result) {
      result.innerText =
        "Percentage: " + percentage + "%\n" +
        "Number: " + number + "\n" +
        "Result: " + money(answer);
    }

    addInputHistory();
    renderUniversalLoanStyleResult();
  }

  function calculateCompound() {
    const principal = firstNumber(["principal", "compoundPrincipal", "amount"]);
    const rate = firstNumber(["rate", "compoundRate", "interest", "interestRate"]);
    const years = firstNumber(["years", "compoundYears", "time"]);
    const frequencyText = firstValue(["frequency", "compoundFrequency"]);
    const frequency = Number(frequencyText) || 1;
    const result = document.getElementById("compoundResult") || document.getElementById("result");

    if (!Number.isFinite(principal) || !Number.isFinite(rate) || !Number.isFinite(years) || principal <= 0 || rate < 0 || years <= 0 || frequency <= 0) {
      if (result) result.innerText = "Please enter valid compound interest details.";
      return;
    }

    const futureValue = principal * Math.pow(1 + rate / 100 / frequency, frequency * years);
    const compoundInterest = futureValue - principal;

    if (result) {
      result.innerText =
        "Future value: " + money(futureValue) + "\n" +
        "Compound interest: " + money(compoundInterest) + "\n" +
        "Principal: " + money(principal);
    }

    addInputHistory();
    renderUniversalLoanStyleResult();
  }

  function calculateLoanPayment(principal, annualRate, years) {
    const months = years * 12;
    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) return principal / months;

    return (
      principal *
      monthlyRate *
      Math.pow(1 + monthlyRate, months)
    ) / (
      Math.pow(1 + monthlyRate, months) - 1
    );
  }

  function buildLoanGraph(data) {
    if (!data.length) return "";

    const width = 420;
    const height = 250;
    const left = 54;
    const right = 24;
    const top = 26;
    const bottom = 48;

    const minYear = data[0].year;
    const maxYear = data[data.length - 1].year;
    const values = data.map(function (row) { return row.monthly; });
    const minValue = Math.min.apply(null, values);
    const maxValue = Math.max.apply(null, values);
    const yearRange = maxYear - minYear || 1;
    const valueRange = maxValue - minValue || 1;

    function x(year) {
      return left + ((year - minYear) / yearRange) * (width - left - right);
    }

    function y(value) {
      return top + ((maxValue - value) / valueRange) * (height - top - bottom);
    }

    const points = data.map(function (row) {
      return x(row.year) + "," + y(row.monthly);
    }).join(" ");

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(function (step) {
      const gridY = top + step * (height - top - bottom);
      const label = maxValue - step * valueRange;

      return (
        '<line x1="' + left + '" y1="' + gridY + '" x2="' + (width - right) + '" y2="' + gridY + '" class="loan-graph-grid"></line>' +
        '<text x="8" y="' + (gridY + 5) + '" class="loan-graph-value">' + money(label) + '</text>'
      );
    }).join("");

    const yearLabels = data.map(function (row) {
      if (data.length > 12 && row.year % 5 !== 0 && row.year !== minYear && row.year !== maxYear) return "";

      return '<text x="' + x(row.year) + '" y="' + (height - 18) + '" transform="rotate(-45 ' + x(row.year) + ' ' + (height - 18) + ')">' + row.year + '</text>';
    }).join("");

    const circles = data.map(function (row) {
      return '<circle cx="' + x(row.year) + '" cy="' + y(row.monthly) + '" r="5"></circle>';
    }).join("");

    return (
      '<svg class="loan-graph" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Monthly payment by years graph">' +
      gridLines +
      '<line x1="' + left + '" y1="' + (height - bottom) + '" x2="' + (width - right + 12) + '" y2="' + (height - bottom) + '" class="loan-graph-axis"></line>' +
      '<line x1="' + left + '" y1="' + (height - bottom) + '" x2="' + left + '" y2="' + (top - 14) + '" class="loan-graph-axis"></line>' +
      '<polyline points="' + points + '" class="loan-graph-line"></polyline>' +
      circles +
      yearLabels +
      '</svg>'
    );
  }

  function getLoanExternalPanel() {
    const main = document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById("loanExternalOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "loanExternalOutput";
      panel.className = "loan-external-output";
      panel.setAttribute("aria-label", "Loan result table and graph");
      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function renderLoanExternalOutput(principal, annualRate, years) {
    const panel = getLoanExternalPanel();
    if (!panel) return;

    const maxYears = Math.min(Math.floor(years), 60);
    const data = [];

    for (let year = 1; year <= maxYears; year += 1) {
      const monthly = calculateLoanPayment(principal, annualRate, year);
      const totalPayment = monthly * year * 12;
      const totalInterest = totalPayment - principal;

      data.push({
        year: year,
        monthly: monthly,
        totalInterest: totalInterest,
        totalPayment: totalPayment
      });
    }

    const rows = data.map(function (row) {
      return (
        "<tr>" +
        "<td>" + row.year + "</td>" +
        "<td>" + money(row.monthly) + "</td>" +
        "<td>" + money(row.totalInterest) + "</td>" +
        "<td>" + money(row.totalPayment) + "</td>" +
        "</tr>"
      );
    }).join("");

    panel.hidden = false;
    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +
          '<div class="loan-result-body">' +
            '<div class="loan-result-table-scroll">' +
              '<table class="loan-result-table">' +
                '<thead><tr><th>Years</th><th>Monthly Payment</th><th>Total Interest</th><th>Total Payment</th></tr></thead>' +
                '<tbody>' + rows + '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="loan-copy-side"><button type="button" class="loan-copy-btn">Copy</button></div>' +
      '</div>' +
      '<div class="loan-graph-row">' +
        '<div class="loan-graph-panel">' +
          '<h2 class="loan-panel-title">Graph</h2>' +
          '<div class="loan-graph-body">' + buildLoanGraph(data) + '</div>' +
        '</div>' +
        '<div class="loan-graph-copy-side"><button type="button" class="loan-graph-copy-btn">Copy</button></div>' +
      '</div>';

    const resultCopy = panel.querySelector(".loan-copy-btn");
    const graphCopy = panel.querySelector(".loan-graph-copy-btn");

    if (resultCopy) {
      resultCopy.addEventListener("click", function () {
        copyTable(panel.querySelector(".loan-result-table"), resultCopy);
      });
    }

    if (graphCopy) {
      graphCopy.addEventListener("click", function () {
        const text = "Years\tMonthly Payment\n" + data.map(function (row) {
          return row.year + "\t" + money(row.monthly);
        }).join("\n");

        copyText(text, graphCopy);
      });
    }
  }

  function calculateLoan() {
    const amount = firstNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = firstNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const years = firstNumber(["years", "loanYears", "loanTerm", "term"]);
    const result = document.getElementById("loanResult") || document.getElementById("result");

    if (!Number.isFinite(amount) || !Number.isFinite(annualRate) || !Number.isFinite(years) || amount <= 0 || annualRate < 0 || years <= 0) {
      if (result) result.innerText = "Please enter valid loan details.";
      return;
    }

    const monthly = calculateLoanPayment(amount, annualRate, years);
    const totalPayment = monthly * years * 12;
    const totalInterest = totalPayment - amount;

    if (result) {
      result.innerText =
        "Monthly payment: " + money(monthly) + "\n" +
        "Annual interest rate: " + annualRate.toFixed(2) + "%\n" +
        "Total interest: " + money(totalInterest) + "\n" +
        "Total payment: " + money(totalPayment);
      result.style.display = "none";
    }

    addInputHistory();
    renderLoanExternalOutput(amount, annualRate, years);
  }

  function showLoanHistory() {
    renderInputHistory("loan");
  }

  function clearLoanHistory() {
    clearInputHistory("loan");
    const result = document.getElementById("loanResult");
    if (result) result.innerText = "";

    const panel = document.getElementById("loanExternalOutput");
    if (panel) panel.hidden = true;
  }

  /* =====================================================
     INSTRUCTION + REFERENCES
  ===================================================== */

  function getPageData() {
    const type = getPageType();

    const data = {
      basic: {
        what: "It helps you do quick math calculations like addition, subtraction, multiplication, division, power, and square root.",
        how: "Enter numbers using the buttons, choose an operator, then press = to get the answer.",
        formula: "The calculator follows normal math order: brackets first, then powers, multiplication/division, then addition/subtraction.",
        example: "8 + 2 × 3 = 14 because multiplication is calculated before addition.",
        references: [
          ["Order of operations", "Purplemath explains the normal order of operations.", "https://www.purplemath.com/modules/orderops.htm"]
        ]
      },
      age: {
        what: "It calculates normal age and Asian age from a selected birth date.",
        how: "Select your birth date, then press calculate age.",
        formula: "Normal age is based on the difference between today and the birth date. Asian age uses current year − birth year + 1.",
        example: "If someone was born in 2000 and the current year is 2026, Asian age is 27.",
        references: [
          ["Age calculation", "Microsoft shows age calculation using today’s date and a birth date.", "https://support.microsoft.com/en-us/office/calculate-age-113d599f-5fea-448f-a4c3-268927911b37"]
        ]
      },
      bmi: {
        what: "It calculates Body Mass Index and can also check waist-to-height ratio.",
        how: "Choose SI or US units, enter weight and height, optionally enter waist size, then press calculate BMI.",
        formula: "SI: BMI = weight kg ÷ height m². US: BMI = weight lb ÷ height inch² × 703.",
        example: "70 kg and 1.70 m gives BMI = 70 ÷ 1.70² = 24.22.",
        references: [
          ["CDC BMI formula", "CDC lists metric and US customary formulas for calculating BMI.", "https://www.cdc.gov/growth-chart-training/hcp/using-bmi/body-mass-index.html"]
        ]
      },
      loan: {
        what: "It estimates mortgage or personal loan monthly payment, interest, total payment, and remaining balance.",
        how: "Enter loan amount or purchase price, annual interest rate, and loan term in months. Then press calculate loan.",
        formula: "Monthly Payment = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where n is the loan term in months.",
        example: "A 10,000 loan at 5% yearly for 60 months gives an estimated monthly payment using the amortization formula.",
        references: [
          ["Loan amortization", "Chase explains fixed-payment amortized loan calculations.", "https://www.chase.com/personal/mortgage/education/financing-a-home/loan-amortization"],
          ["Mortgage formula", "Investopedia lists the mortgage payment formula using principal, rate, and months.", "https://www.investopedia.com/mortgage-calculator-5084794"]
        ]
      },
      discount: {
        what: "It calculates final price after discount and how much money you save.",
        how: "Enter the original price and discount percentage, then press calculate discount.",
        formula: "Savings = original price × discount ÷ 100. Final price = original price − savings.",
        example: "If price is 100 and discount is 20%, savings = 20 and final price = 80.",
        references: [
          ["Discount calculation", "Calculator.net explains percent-off discount calculation.", "https://www.calculator.net/discount-calculator.html"],
          ["Discount meaning", "Cambridge Dictionary defines discount as a reduction in price.", "https://dictionary.cambridge.org/dictionary/english/discount"]
        ]
      },
      percentage: {
        what: "It calculates a percentage of a number.",
        how: "Enter the percentage value and the number, then press calculate percentage.",
        formula: "Result = percentage ÷ 100 × number.",
        example: "20% of 150 = 20 ÷ 100 × 150 = 30.",
        references: [
          ["Percentage meaning", "A percentage means a value out of 100.", "https://en.wikipedia.org/wiki/Percentage"],
          ["Percentage formula", "CalculatorSoup lists common percentage formulas.", "https://www.calculatorsoup.com/calculators/math/percentage.php"]
        ]
      },
      compound: {
        what: "It estimates how much your money can grow when interest is added repeatedly over time.",
        how: "Enter principal amount, annual interest rate, time in years, and compounding frequency. Then press calculate compound interest.",
        formula: "A = P(1 + r/n)ⁿᵗ. Compound Interest = A − P.",
        example: "P = 1000, r = 5%, t = 10 years, n = 12 gives about 1,647.01 future value and 647.01 compound interest.",
        references: [
          ["Compound interest formula", "Investopedia lists the compound interest formula as A = P(1 + r/n)^(nt).", "https://www.investopedia.com/articles/investing/020614/learn-simple-and-compound-interest.asp"]
        ]
      }
    };

    return data[type] || null;
  }

  function makeInfoBox(className, title, text) {
    const box = document.createElement("div");
    box.className = className;

    const h3 = document.createElement("h3");
    h3.textContent = title;

    const p = document.createElement("p");
    p.textContent = text;

    box.appendChild(h3);
    box.appendChild(p);

    return box;
  }

  function makeReferenceCard(item) {
    const card = document.createElement("div");
    card.className = "reference-card";

    const h3 = document.createElement("h3");
    h3.textContent = item[0];

    const p = document.createElement("p");
    p.textContent = item[1];

    const a = document.createElement("a");
    a.href = item[2];
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Open source";

    card.appendChild(h3);
    card.appendChild(p);
    card.appendChild(a);

    return card;
  }

  function buildInstructionLayout() {
    const main = document.querySelector("main");
    if (!main || !isCalculatorPage()) return;

    if (main.classList.contains("calculator-box")) return;

    const data = getPageData();
    if (!data) return;

    main.classList.add("has-instructions");

    main.querySelectorAll(":scope > .instruction-box, :scope > .pc-what-slot").forEach(function (item) {
      item.remove();
    });

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

    data.references.forEach(function (item) {
      referenceScroll.appendChild(makeReferenceCard(item));
    });

    referenceBox.appendChild(referenceTitle);
    referenceBox.appendChild(referenceScroll);
    instructionBox.appendChild(referenceBox);
    main.appendChild(instructionBox);
  }

  /* =====================================================
     INPUT HISTORY FOR NON-BASIC PAGES
  ===================================================== */

  function getHistoryList(type) {
    const map = {
      age: "ageHistoryList",
      bmi: "bmiHistoryList",
      loan: "loanHistoryList",
      discount: "discountHistoryList",
      percentage: "percentageHistoryList",
      compound: "compoundHistoryList"
    };

    return document.getElementById(map[type]);
  }

  function inputHistoryKey(type) {
    return "inputHistory_" + type;
  }

  function getInputHistoryText(type) {
    if (type === "age") {
      const birthdate = firstValue(["birthdate", "birthDate", "dob"]);
      const targetInput = ensureAgeTargetDateInput();
      const targetDate = targetInput ? String(targetInput.value || "").trim() : todayValueISO();

      return birthdate ? formatDateDMY(birthdate) + " to " + formatDateDMY(targetDate) : "";
    }

    if (type === "loan") {
      const amount = firstValue(["amount", "loanAmount", "principal", "loanPrincipal"]);
      const interest = firstValue(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
      const years = firstValue(["years", "loanYears", "loanTerm", "term"]);

      if (!amount && !interest && !years) return "";

      return "Loan amount: " + (amount || "-") + " | Interest rate: " + (interest || "-") + "% | Years: " + (years || "-");
    }

    if (type === "compound") {
      const principal = firstValue(["principal", "compoundPrincipal", "amount"]);
      const rate = firstValue(["rate", "compoundRate", "interest", "interestRate"]);
      const years = firstValue(["years", "compoundYears", "time"]);
      const frequency = firstValue(["frequency", "compoundFrequency"]);

      return "Principal: " + (principal || "-") + " | Interest rate: " + (rate || "-") + "% | Years: " + (years || "-") + (frequency ? " | Frequency: " + frequency : "");
    }

    const calculator = document.querySelector(".calculator");
    if (!calculator) return "";

    return $$("input, select, textarea", calculator)
      .filter(function (input) {
        return input.type !== "hidden" && input.id !== "display";
      })
      .map(function (input) {
        const label = input.id ? document.querySelector('label[for="' + input.id + '"]') : null;
        const name = label ? label.textContent.replace(/[:：]/g, "").trim() : (input.name || input.id || "Input");
        const value = input.value || "";

        return value ? name + ": " + value : "";
      })
      .filter(Boolean)
      .join(" | ");
  }

  function renderInputHistory(type) {
    if (!type || type === "basic") return;

    const list = getHistoryList(type);
    if (!list) return;

    const history = safeLoadArray(inputHistoryKey(type));
    list.innerHTML = "";

    history.slice().reverse().forEach(function (item) {
      const li = document.createElement("li");
      li.className = "history-item input-history-item";

      const text = document.createElement("span");
      text.className = "history-text";
      text.textContent = item;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "history-copy-btn";
      copyBtn.textContent = "copy";

      copyBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        copyText(item, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function addInputHistory(type) {
    type = type || getPageType();

    if (!type || type === "basic") return;

    const list = getHistoryList(type);
    if (!list) return;

    const item = getInputHistoryText(type);
    if (!item) return;

    const history = safeLoadArray(inputHistoryKey(type));
    const last = history[history.length - 1];

    if (last !== item) {
      history.push(item);
      safeSaveArray(inputHistoryKey(type), history);
    }

    renderInputHistory(type);
  }

  function clearInputHistory(type) {
    type = type || getPageType();

    if (type === "basic") {
      clearHistory();
      return;
    }

    safeRemove(inputHistoryKey(type));
    renderInputHistory(type);
  }

  /* =====================================================
     LOAN-STYLE RESULT TABLE FOR ALL NON-LOAN PAGES
  ===================================================== */

  function textToRows(text) {
    return String(text || "")
      .split(/\n|\|/g)
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean)
      .map(function (line) {
        const parts = line.split(":");

        if (parts.length >= 2) {
          return [parts.shift().trim(), parts.join(":").trim()];
        }

        return ["Result", line];
      });
  }

  function buildRows(type, resultText) {
    if (type === "basic") {
      const display = stringValue("display");
      return [["Result", display || resultText || "-"]];
    }

    if (type === "age") {
      const birthdate = firstValue(["birthdate", "birthDate", "dob"]);
      const targetInput = ensureAgeTargetDateInput();
      const targetDate = targetInput ? String(targetInput.value || "").trim() : todayValueISO();

      const normalAge = calculateNormalAgeBetweenDates(birthdate, targetDate);
      const asianAge = calculateAsianAgeBetweenDates(birthdate, targetDate);

      if (!birthdate || normalAge === "" || asianAge === "") return [];

      return [
        ["Date range", formatDateDMY(birthdate) + " to " + formatDateDMY(targetDate)],
        ["Normal age", normalAge + " years old"],
        ["Asian age", asianAge + " years old"]
      ];
    }

    if (type === "compound") {
      const rows = [
        ["Principal", firstValue(["principal", "compoundPrincipal", "amount"]) || "-"],
        ["Interest rate", (firstValue(["rate", "compoundRate", "interest", "interestRate"]) || "-") + "%"],
        ["Years", firstValue(["years", "compoundYears", "time"]) || "-"],
        ["Frequency", firstValue(["frequency", "compoundFrequency"]) || "-"]
      ];

      return rows.concat(textToRows(resultText));
    }

    return textToRows(resultText);
  }

  function getUniversalOutputPanel() {
    const main = document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
    const calculator = main ? main.querySelector(".calculator") : null;
    if (!main || !calculator) return null;

    let panel = document.getElementById("universalLoanStyleOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "universalLoanStyleOutput";
      panel.className = "loan-style-output-panel";
      panel.setAttribute("aria-label", "Calculator result table");

      panel.innerHTML =
        '<div class="loan-output-top">' +
          '<div class="loan-result-panel">' +
            '<h2 class="loan-panel-title">Result</h2>' +
            '<div class="loan-result-body"></div>' +
          '</div>' +
          '<div class="loan-copy-side"><button type="button" class="loan-copy-btn">Copy</button></div>' +
        '</div>';

      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function makeLoanStyleTable(rows) {
    return (
      '<div class="loan-result-table-scroll">' +
        '<table class="loan-result-table universal-loan-result-table">' +
          '<thead><tr><th>Item</th><th>Value</th></tr></thead>' +
          '<tbody>' +
            rows.map(function (row) {
              return "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td></tr>";
            }).join("") +
          '</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  function copyTable(table, button) {
    if (!table) return;

    const text = Array.from(table.querySelectorAll("tr"))
      .map(function (row) {
        return Array.from(row.querySelectorAll("th, td"))
          .map(function (cell) {
            return cell.textContent.trim();
          })
          .join("\t");
      })
      .join("\n");

    copyText(text, button);
  }

  function renderUniversalLoanStyleResult() {
    if (!isCalculatorPage()) return;

    const type = getPageType();

    if (type === "loan" || type === "age" || type === "basic" || type === "bmi") return;

    const result = getResultElement();
    const panel = getUniversalOutputPanel();
    if (!panel) return;

    let resultText = result ? (result.innerText || result.textContent || "") : "";

    if (type === "basic" && !resultText) {
      resultText = stringValue("display");
    }

    if (!String(resultText).trim()) {
      panel.hidden = true;
      return;
    }

    const rows = buildRows(type, resultText);

    if (!rows.length) {
      panel.hidden = true;
      return;
    }

    const body = panel.querySelector(".loan-result-body");
    const copyBtn = panel.querySelector(".loan-copy-btn");

    if (!body || !copyBtn) return;

    body.innerHTML = makeLoanStyleTable(rows);
    panel.hidden = false;

    if (result) result.style.display = "none";

    copyBtn.onclick = function () {
      if (type === "basic") {
        copyText(stringValue("display"), copyBtn);
      } else {
        copyTable(panel.querySelector(".loan-result-table"), copyBtn);
      }
    };
  }

  /* =====================================================
     SHARED UI
  ===================================================== */

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

  function setupActionHooks() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest("button");
      if (!button) return;

      const text = button.textContent.trim().toLowerCase();
      const type = getPageType();

      if (text.includes("clear")) {
        setTimeout(function () {
          clearInputHistory(type);
        }, 0);
        return;
      }

      if (
        text === "=" ||
        text.includes("calculate") ||
        text.includes("loan") ||
        text.includes("age") ||
        text.includes("bmi") ||
        text.includes("discount") ||
        text.includes("percentage") ||
        text.includes("compound")
      ) {
        setTimeout(function () {
          /*
            Age has its own result panel and already adds its input history
            inside calculateAge(). Do not run the universal loan-style
            result system for Age, because that is what brought back the
            old "Birthdate / Date to calculate" result.
          */
          if (type !== "basic" && type !== "age" && type !== "bmi") {
            addInputHistory(type);
          }

          if (type !== "age" && type !== "bmi") {
            renderUniversalLoanStyleResult();
          }
        }, 150);

        if (type !== "age" && type !== "bmi") {
          setTimeout(renderUniversalLoanStyleResult, 400);
        }
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;

      setTimeout(function () {
        const type = getPageType();

        if (type !== "basic" && type !== "age" && type !== "bmi") {
          addInputHistory(type);
        }

        if (type !== "age" && type !== "bmi") {
          renderUniversalLoanStyleResult();
        }
      }, 150);
    });
  }

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
    buildInstructionLayout();
    setupNumberInputs();
    setupKeyboardSupport();
    setupActionHooks();
    setupScrollButton();

    if (getPageType() === "age") {
      ensureAgeTargetDateInput();
      hideOldAgePanels();
    }

    if (getPageType() === "basic") showHistory();
    else renderInputHistory(getPageType());

    setTimeout(renderUniversalLoanStyleResult, 250);
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
  window.calculateLoan = calculateLoan;
  window.calculateDiscount = calculateDiscount;
  window.calculatePercentage = calculatePercentage;
  window.calculateCompound = calculateCompound;
  window.calculateCompoundInterest = calculateCompound;

  window.showLoanHistory = showLoanHistory;
  window.clearLoanHistory = clearLoanHistory;

  window.renderUniversalLoanStyleResult = renderUniversalLoanStyleResult;
})();
/* =====================================================
   BASIC CALCULATOR ONLY: result shows "= answer"
   No table for basic calculator result
===================================================== */
(function () {
  "use strict";

  function isBasicPage() {
    return (
      document.body.classList.contains("basic-page") ||
      document.body.dataset.page === "basic" ||
      !!document.getElementById("display")
    );
  }

  function getAnswer() {
    const display = document.getElementById("display");
    return display ? String(display.value || "").trim() : "";
  }

  function getOrCreateBasicResultPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;

    if (!main || !calculator) return null;

    let panel = document.getElementById("universalLoanStyleOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "universalLoanStyleOutput";
      panel.className = "loan-style-output-panel basic-equal-output-panel";
      panel.setAttribute("aria-label", "Basic calculator result");

      panel.innerHTML = `
        <div class="loan-output-top">
          <div class="loan-result-panel">
            <h2 class="loan-panel-title">Result</h2>
            <div class="loan-result-body"></div>
          </div>

          <div class="loan-copy-side">
            <button type="button" class="loan-copy-btn">Copy</button>
          </div>
        </div>
      `;

      calculator.insertAdjacentElement("afterend", panel);
    }

    panel.classList.add("basic-equal-output-panel");

    return panel;
  }

  function renderBasicEqualAnswer() {
    if (!isBasicPage()) return;

    const answer = getAnswer();
    const panel = getOrCreateBasicResultPanel();

    if (!panel) return;

    if (!answer || answer === "Error") {
      panel.hidden = true;
      return;
    }

    const body = panel.querySelector(".loan-result-body");
    if (!body) return;

    body.innerHTML = `
      <div class="basic-equal-result">
        <span class="basic-equal-symbol">=</span>
        <span class="basic-equal-answer">${answer}</span>
      </div>
    `;

    panel.hidden = false;
  }

  function copyBasicAnswer(button) {
    const answer = getAnswer();

    if (!answer || answer === "Error") return;

    function copied() {
      const oldText = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = oldText;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(answer).then(copied).catch(function () {
        fallbackCopy(answer);
        copied();
      });
    } else {
      fallbackCopy(answer);
      copied();
    }
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

  function fixBasicCopyButton() {
    if (!isBasicPage()) return;

    const panel = document.getElementById("universalLoanStyleOutput");
    if (!panel) return;

    const button = panel.querySelector(".loan-copy-btn");
    if (!button || button.dataset.basicEqualNoTableCopyReady === "true") return;

    button.dataset.basicEqualNoTableCopyReady = "true";

    button.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        copyBasicAnswer(button);
      },
      true
    );
  }

  function afterCalculate() {
    setTimeout(renderBasicEqualAnswer, 0);
    setTimeout(renderBasicEqualAnswer, 150);
    setTimeout(renderBasicEqualAnswer, 400);
    setTimeout(fixBasicCopyButton, 450);
  }

  function startBasicEqualNoTable() {
    if (!isBasicPage()) return;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim();

        if (text === "=") {
          afterCalculate();
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter" || event.key === "=") {
          afterCalculate();
        }
      },
      true
    );

    setTimeout(fixBasicCopyButton, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBasicEqualNoTable);
  } else {
    startBasicEqualNoTable();
  }
})();
/* =====================================================
   BASIC CALCULATOR: FIX NUMBER × SQUARE ROOT
   Example:
   2 then √ then 9 = 2 * Math.sqrt(9)
===================================================== */
(function () {
  "use strict";

  function isBasicPage() {
    return (
      document.body.classList.contains("basic-page") ||
      document.body.dataset.page === "basic" ||
      !!document.getElementById("display")
    );
  }

  function getDisplay() {
    return document.getElementById("display");
  }

  function needsMultiplyBeforeFunction(value) {
    if (!value) return false;

    const lastChar = value.slice(-1);

    return /[0-9.)]/.test(lastChar);
  }

  function clearError(display) {
    if (display && display.value === "Error") {
      display.value = "";
    }
  }

  /* Override old addFunction */
  window.addFunction = function (func) {
    if (!isBasicPage()) return;

    const display = getDisplay();
    if (!display) return;

    clearError(display);

    const functions = {
      sqrt: "Math.sqrt(",
      sin: "Math.sin(",
      cos: "Math.cos(",
      tan: "Math.tan(",
      log: "Math.log10(",
      ln: "Math.log("
    };

    const functionText = functions[func];
    if (!functionText) return;

    if (needsMultiplyBeforeFunction(display.value)) {
      display.value += "*" + functionText;
    } else {
      display.value += functionText;
    }
  };

  /*
    Extra safety:
    If old display already became 2Math.sqrt(9),
    convert it to 2*Math.sqrt(9) before calculate.
  */
  const oldCalculate = window.calculate;

  window.calculate = function () {
    if (isBasicPage()) {
      const display = getDisplay();

      if (display && display.value) {
        display.value = display.value
          .replace(/(\d)(Math\.sqrt\()/g, "$1*$2")
          .replace(/(\d)(Math\.sin\()/g, "$1*$2")
          .replace(/(\d)(Math\.cos\()/g, "$1*$2")
          .replace(/(\d)(Math\.tan\()/g, "$1*$2")
          .replace(/(\d)(Math\.log10\()/g, "$1*$2")
          .replace(/(\d)(Math\.log\()/g, "$1*$2")
          .replace(/\)(Math\.sqrt\()/g, ")*$1")
          .replace(/\)(Math\.sin\()/g, ")*$1")
          .replace(/\)(Math\.cos\()/g, ")*$1")
          .replace(/\)(Math\.tan\()/g, ")*$1")
          .replace(/\)(Math\.log10\()/g, ")*$1")
          .replace(/\)(Math\.log\()/g, ")*$1");
      }
    }

    if (typeof oldCalculate === "function") {
      return oldCalculate();
    }
  };
})();
/* Removed old BMI overlay block: BMI CALCULATOR: FINAL CLEAN UNIT + HISTORY + RESULT FIX - Uses the SI/US toggle button state - Stops guessing US from he */
/* Removed old BMI overlay block: BMI CALCULATOR: FINAL CLEAN UNIT + HISTORY + RESULT FIX - Uses #unitToggleBtn data-current-unit as the true unit - SI =  */
/* =====================================================
   LOAN / MORTGAGE OPTIONAL COSTS
   - Adds optional property tax, insurance, and HOA/fees
   - Base payment uses amortized loan formula
   - Total monthly payment includes optional mortgage costs
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      title.includes("loan") ||
      !!document.getElementById("loanResult")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());
      if (Number.isFinite(value)) return value;
    }

    return NaN;
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function addOptionalMortgageInputs() {
    if (!isLoanPage()) return;

    const calculator = document.querySelector(".calculator");
    if (!calculator) return;

    if (document.getElementById("propertyTaxYearly")) return;

    const calculateBtn =
      calculator.querySelector("button.main-btn") ||
      Array.from(calculator.querySelectorAll("button")).find(function (btn) {
        return btn.textContent.toLowerCase().includes("calculate");
      });

    const wrapper = document.createElement("div");
    wrapper.className = "optional-mortgage-costs";

    wrapper.innerHTML = `
      <h3 class="optional-mortgage-title">Optional mortgage costs</h3>

      <label for="propertyTaxYearly">Property tax per year:</label>
      <input type="number" id="propertyTaxYearly" placeholder="Optional, example: 1200">

      <label for="homeInsuranceYearly">Home insurance per year:</label>
      <input type="number" id="homeInsuranceYearly" placeholder="Optional, example: 600">

      <label for="hoaMonthly">HOA / other fees per month:</label>
      <input type="number" id="hoaMonthly" placeholder="Optional, example: 100">

      <p class="optional-mortgage-note">
        Leave these empty if you only want principal and interest.
      </p>
    `;

    if (calculateBtn) {
      calculateBtn.insertAdjacentElement("beforebegin", wrapper);
    } else {
      calculator.appendChild(wrapper);
    }
  }

  function calculateLoanPayment(principal, annualRate, years) {
    const months = years * 12;
    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) return principal / months;

    return (
      principal *
      monthlyRate *
      Math.pow(1 + monthlyRate, months)
    ) / (
      Math.pow(1 + monthlyRate, months) - 1
    );
  }

  function getLoanExternalPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById("loanExternalOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "loanExternalOutput";
      panel.className = "loan-external-output";
      panel.setAttribute("aria-label", "Loan result table and graph");
      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function buildLoanGraph(data) {
    if (!data.length) return "";

    const width = 520;
    const height = 280;
    const left = 70;
    const right = 28;
    const top = 28;
    const bottom = 52;

    const minYear = data[0].year;
    const maxYear = data[data.length - 1].year;
    const values = data.map(function (row) {
      return row.totalMonthly;
    });

    const minValue = Math.min.apply(null, values);
    const maxValue = Math.max.apply(null, values);
    const yearRange = maxYear - minYear || 1;
    const valueRange = maxValue - minValue || 1;

    function x(year) {
      return left + ((year - minYear) / yearRange) * (width - left - right);
    }

    function y(value) {
      return top + ((maxValue - value) / valueRange) * (height - top - bottom);
    }

    const points = data.map(function (row) {
      return x(row.year) + "," + y(row.totalMonthly);
    }).join(" ");

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(function (step) {
      const gridY = top + step * (height - top - bottom);
      const label = maxValue - step * valueRange;

      return (
        '<line x1="' + left + '" y1="' + gridY + '" x2="' + (width - right) + '" y2="' + gridY + '" class="loan-graph-grid"></line>' +
        '<text x="8" y="' + (gridY + 5) + '" class="loan-graph-value">' + money(label) + '</text>'
      );
    }).join("");

    const yearLabels = data.map(function (row) {
      if (data.length > 12 && row.year % 5 !== 0 && row.year !== minYear && row.year !== maxYear) return "";

      return '<text x="' + x(row.year) + '" y="' + (height - 18) + '" transform="rotate(-45 ' + x(row.year) + ' ' + (height - 18) + ')">' + row.year + '</text>';
    }).join("");

    const circles = data.map(function (row) {
      return '<circle cx="' + x(row.year) + '" cy="' + y(row.totalMonthly) + '" r="5"></circle>';
    }).join("");

    return (
      '<svg class="loan-graph" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Total monthly payment by years graph">' +
        gridLines +
        '<line x1="' + left + '" y1="' + (height - bottom) + '" x2="' + (width - right + 12) + '" y2="' + (height - bottom) + '" class="loan-graph-axis"></line>' +
        '<line x1="' + left + '" y1="' + (height - bottom) + '" x2="' + left + '" y2="' + (top - 14) + '" class="loan-graph-axis"></line>' +
        '<polyline points="' + points + '" class="loan-graph-line"></polyline>' +
        circles +
        yearLabels +
      '</svg>'
    );
  }

  function renderMortgageLoanOutput(amount, annualRate, years, taxYearly, insuranceYearly, hoaMonthly) {
    const panel = getLoanExternalPanel();
    if (!panel) return;

    const monthlyTax = taxYearly / 12;
    const monthlyInsurance = insuranceYearly / 12;
    const monthlyExtras = monthlyTax + monthlyInsurance + hoaMonthly;

    const maxYears = Math.min(Math.floor(years), 60);
    const data = [];

    for (let year = 1; year <= maxYears; year += 1) {
      const principalInterest = calculateLoanPayment(amount, annualRate, year);
      const totalMonthly = principalInterest + monthlyExtras;
      const baseTotalPayment = principalInterest * year * 12;
      const totalInterest = baseTotalPayment - amount;
      const totalWithExtras = totalMonthly * year * 12;

      data.push({
        year: year,
        principalInterest: principalInterest,
        monthlyTax: monthlyTax,
        monthlyInsurance: monthlyInsurance,
        hoaMonthly: hoaMonthly,
        totalMonthly: totalMonthly,
        totalInterest: totalInterest,
        totalWithExtras: totalWithExtras
      });
    }

    const selectedMonthlyPI = calculateLoanPayment(amount, annualRate, years);
    const selectedTotalMonthly = selectedMonthlyPI + monthlyExtras;
    const selectedTotalPayment = selectedMonthlyPI * years * 12;
    const selectedTotalInterest = selectedTotalPayment - amount;
    const selectedTotalWithExtras = selectedTotalMonthly * years * 12;

    const summaryRows = `
      <tr><td>Principal + interest monthly</td><td>${money(selectedMonthlyPI)}</td></tr>
      <tr><td>Property tax monthly</td><td>${money(monthlyTax)}</td></tr>
      <tr><td>Home insurance monthly</td><td>${money(monthlyInsurance)}</td></tr>
      <tr><td>HOA / other monthly fees</td><td>${money(hoaMonthly)}</td></tr>
      <tr><td>Total monthly payment</td><td>${money(selectedTotalMonthly)}</td></tr>
      <tr><td>Total interest</td><td>${money(selectedTotalInterest)}</td></tr>
      <tr><td>Total payment with optional costs</td><td>${money(selectedTotalWithExtras)}</td></tr>
    `;

    const comparisonRows = data.map(function (row) {
      return (
        "<tr>" +
          "<td>" + row.year + "</td>" +
          "<td>" + money(row.principalInterest) + "</td>" +
          "<td>" + money(row.monthlyTax) + "</td>" +
          "<td>" + money(row.monthlyInsurance) + "</td>" +
          "<td>" + money(row.hoaMonthly) + "</td>" +
          "<td>" + money(row.totalMonthly) + "</td>" +
          "<td>" + money(row.totalInterest) + "</td>" +
          "<td>" + money(row.totalWithExtras) + "</td>" +
        "</tr>"
      );
    }).join("");

    panel.hidden = false;

    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +
          '<div class="loan-result-body">' +
            '<div class="loan-result-table-scroll">' +
              '<table class="loan-result-table mortgage-summary-table">' +
                '<thead><tr><th>Item</th><th>Value</th></tr></thead>' +
                '<tbody>' + summaryRows + '</tbody>' +
              '</table>' +
            '</div>' +
            '<div class="loan-result-table-scroll mortgage-comparison-scroll">' +
              '<table class="loan-result-table mortgage-comparison-table">' +
                '<thead>' +
                  '<tr>' +
                    '<th>Years</th>' +
                    '<th>Principal + Interest</th>' +
                    '<th>Tax Monthly</th>' +
                    '<th>Insurance Monthly</th>' +
                    '<th>HOA / Fees</th>' +
                    '<th>Total Monthly</th>' +
                    '<th>Total Interest</th>' +
                    '<th>Total With Optional Costs</th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody>' + comparisonRows + '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="loan-copy-side"><button type="button" class="loan-copy-btn">Copy</button></div>' +
      '</div>' +
      '<div class="loan-graph-row">' +
        '<div class="loan-graph-panel">' +
          '<h2 class="loan-panel-title">Graph</h2>' +
          '<div class="loan-graph-body">' + buildLoanGraph(data) + '</div>' +
        '</div>' +
        '<div class="loan-graph-copy-side"><button type="button" class="loan-graph-copy-btn">Copy</button></div>' +
      '</div>' +
      '<p class="mortgage-note">Note: Optional mortgage costs are estimates. Real mortgage payments may also include other charges depending on your lender, location, and loan type.</p>';

    const resultCopy = panel.querySelector(".loan-copy-btn");
    const graphCopy = panel.querySelector(".loan-graph-copy-btn");

    if (resultCopy) {
      resultCopy.onclick = function () {
        const text =
          "Item\tValue\n" +
          "Principal + interest monthly\t" + money(selectedMonthlyPI) + "\n" +
          "Property tax monthly\t" + money(monthlyTax) + "\n" +
          "Home insurance monthly\t" + money(monthlyInsurance) + "\n" +
          "HOA / other monthly fees\t" + money(hoaMonthly) + "\n" +
          "Total monthly payment\t" + money(selectedTotalMonthly) + "\n" +
          "Total interest\t" + money(selectedTotalInterest) + "\n" +
          "Total payment with optional costs\t" + money(selectedTotalWithExtras);

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          textarea.remove();
        }

        const old = resultCopy.textContent;
        resultCopy.textContent = "Copied!";
        setTimeout(function () {
          resultCopy.textContent = old;
        }, 1000);
      };
    }

    if (graphCopy) {
      graphCopy.onclick = function () {
        const text =
          "Years\tTotal Monthly Payment\n" +
          data.map(function (row) {
            return row.year + "\t" + money(row.totalMonthly);
          }).join("\n");

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text);
        }

        const old = graphCopy.textContent;
        graphCopy.textContent = "Copied!";
        setTimeout(function () {
          graphCopy.textContent = old;
        }, 1000);
      };
    }
  }

  function calculateLoanWithOptionalMortgageCosts() {
    if (!isLoanPage()) return;

    const amount = getNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = getNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const years = getNumber(["years", "loanYears", "loanTerm", "term"]);

    const taxYearly = getNumber(["propertyTaxYearly"]);
    const insuranceYearly = getNumber(["homeInsuranceYearly"]);
    const hoaMonthly = getNumber(["hoaMonthly"]);

    const cleanTax = Number.isFinite(taxYearly) && taxYearly > 0 ? taxYearly : 0;
    const cleanInsurance = Number.isFinite(insuranceYearly) && insuranceYearly > 0 ? insuranceYearly : 0;
    const cleanHoa = Number.isFinite(hoaMonthly) && hoaMonthly > 0 ? hoaMonthly : 0;

    const result = document.getElementById("loanResult") || document.getElementById("result");

    if (
      !Number.isFinite(amount) ||
      !Number.isFinite(annualRate) ||
      !Number.isFinite(years) ||
      amount <= 0 ||
      annualRate < 0 ||
      years <= 0
    ) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid loan details.";
      }

      return;
    }

    const monthlyPI = calculateLoanPayment(amount, annualRate, years);
    const totalMonthly = monthlyPI + cleanTax / 12 + cleanInsurance / 12 + cleanHoa;
    const totalPayment = monthlyPI * years * 12;
    const totalInterest = totalPayment - amount;

    if (result) {
      result.innerText =
        "Principal + interest monthly: " + money(monthlyPI) + "\n" +
        "Total monthly payment: " + money(totalMonthly) + "\n" +
        "Total interest: " + money(totalInterest);
      result.style.display = "none";
    }

    renderMortgageLoanOutput(amount, annualRate, years, cleanTax, cleanInsurance, cleanHoa);
  }

  function startOptionalMortgageCosts() {
    if (!isLoanPage()) return;

    document.body.classList.add("loan-page");
    document.body.dataset.page = "loan";

    addOptionalMortgageInputs();

    window.calculateLoan = calculateLoanWithOptionalMortgageCosts;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateLoan")) {
          setTimeout(calculateLoanWithOptionalMortgageCosts, 0);
          setTimeout(calculateLoanWithOptionalMortgageCosts, 150);
        }
      },
      true
    );

    setTimeout(addOptionalMortgageInputs, 300);
    setTimeout(addOptionalMortgageInputs, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startOptionalMortgageCosts);
  } else {
    startOptionalMortgageCosts();
  }
})();
/* =====================================================
   LOAN: OPTIONAL MORTGAGE COSTS EXPAND / CLOSE BOX
   - Closed by default
   - Click title to open
   - Click again to close
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      !!document.getElementById("loanResult")
    );
  }

  function hasMortgageValue(box) {
    return Array.from(box.querySelectorAll("input")).some(function (input) {
      return String(input.value || "").trim() !== "";
    });
  }

  function setupOptionalMortgageToggle() {
    if (!isLoanPage()) return;

    const box = document.querySelector(".optional-mortgage-costs");
    if (!box || box.dataset.expandReady === "true") return;

    box.dataset.expandReady = "true";

    const oldTitle = box.querySelector(".optional-mortgage-title");
    const titleText = oldTitle ? oldTitle.textContent.trim() : "Optional mortgage costs";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "optional-mortgage-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = `<span>${titleText}</span><span class="optional-mortgage-arrow">▼</span>`;

    const content = document.createElement("div");
    content.className = "optional-mortgage-content";

    Array.from(box.childNodes).forEach(function (node) {
      if (node !== oldTitle) {
        content.appendChild(node);
      }
    });

    box.innerHTML = "";
    box.appendChild(toggle);
    box.appendChild(content);

    function setOpen(open) {
      box.classList.toggle("is-open", open);
      box.classList.toggle("is-closed", !open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");

      const arrow = toggle.querySelector(".optional-mortgage-arrow");
      if (arrow) arrow.textContent = open ? "▲" : "▼";
    }

    setOpen(hasMortgageValue(box));

    toggle.addEventListener("click", function () {
      setOpen(!box.classList.contains("is-open"));
    });
  }

  function start() {
    if (!isLoanPage()) return;

    setupOptionalMortgageToggle();

    setTimeout(setupOptionalMortgageToggle, 300);
    setTimeout(setupOptionalMortgageToggle, 900);
    setTimeout(setupOptionalMortgageToggle, 1500);

    document.addEventListener("click", function () {
      setTimeout(setupOptionalMortgageToggle, 0);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   LOAN: REMOVE "MORTGAGE" AND "HOA" TEXT
   - Optional mortgage costs -> Optional costs
   - HOA / other fees per month -> Other monthly fees
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      !!document.getElementById("loanResult")
    );
  }

  function cleanOptionalCostText() {
    if (!isLoanPage()) return;

    const box = document.querySelector(".optional-mortgage-costs");
    if (!box) return;

    const title =
      box.querySelector(".optional-mortgage-title") ||
      box.querySelector(".optional-mortgage-toggle span:first-child");

    if (title) {
      title.textContent = "Optional costs";
    }

    const labels = box.querySelectorAll("label");

    labels.forEach(function (label) {
      const text = label.textContent.trim().toLowerCase();

      if (text.includes("hoa")) {
        label.textContent = "Other monthly fees:";
      }
    });

    const note = box.querySelector(".optional-mortgage-note");

    if (note) {
      note.textContent = "Leave these empty if you only want the basic loan payment.";
    }
  }

  function startCleanOptionalCostText() {
    if (!isLoanPage()) return;

    cleanOptionalCostText();

    setTimeout(cleanOptionalCostText, 300);
    setTimeout(cleanOptionalCostText, 900);
    setTimeout(cleanOptionalCostText, 1500);

    document.addEventListener("click", function () {
      setTimeout(cleanOptionalCostText, 0);
      setTimeout(cleanOptionalCostText, 200);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCleanOptionalCostText);
  } else {
    startCleanOptionalCostText();
  }
})();
/* =====================================================
   ALL CALCULATOR PAGES: History title -> Input
===================================================== */
(function () {
  "use strict";

  function renameHistoryToInput() {
    const titles = document.querySelectorAll(
      ".history h3, " +
      ".age-history-box h3, " +
      ".bmi-history-box h3, " +
      ".loan-history-box h3, " +
      ".discount-history-box h3, " +
      ".percentage-history-box h3, " +
      ".compound-history-box h3"
    );

    titles.forEach(function (title) {
      if (title.textContent.trim().toLowerCase() === "history") {
        title.textContent = "Input";
      }
    });
  }

  function start() {
    renameHistoryToInput();

    setTimeout(renameHistoryToInput, 300);
    setTimeout(renameHistoryToInput, 900);
    setTimeout(renameHistoryToInput, 1500);

    document.addEventListener("click", function () {
      setTimeout(renameHistoryToInput, 0);
      setTimeout(renameHistoryToInput, 200);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* Removed old BMI overlay block: BMI CALCULATOR: MORE DETAILED RESULT Adds: - BMI - BMI status - Asian BMI status - Healthy weight range - Weight differe */
/* Removed old BMI overlay block: BMI CALCULATOR: KIDS / ADULT / OLDER / MEN / WOMEN / ASIAN Adds: - Age group selector - Sex selector - Asian / non-Asian */
/* Removed old BMI overlay block: BMI CALCULATOR: INCLUDE USER PROFILE IN INPUT HISTORY Adds age group, sex, and Asian/non-Asian cut-off to BMI input box */
/* =====================================================
   BASIC CALCULATOR: REMOVE BOTTOM RESULT BOX
   - Removes bottom result panel
   - Removes side copy button
   - Keeps answer only inside calculator display
===================================================== */
(function () {
  "use strict";

  function isBasicPage() {
    return (
      document.body.classList.contains("basic-page") ||
      document.body.dataset.page === "basic" ||
      !!document.getElementById("display")
    );
  }

  function removeBasicBottomResult() {
    if (!isBasicPage()) return;

    const panels = [
      document.getElementById("universalLoanStyleOutput"),
      document.getElementById("stableBasicAgeOutput")
    ];

    panels.forEach(function (panel) {
      if (panel) {
        panel.remove();
      }
    });
  }

  function startRemoveBasicBottomResult() {
    if (!isBasicPage()) return;

    document.body.classList.add("basic-page");
    document.body.dataset.page = "basic";

    removeBasicBottomResult();

    document.addEventListener(
      "click",
      function () {
        setTimeout(removeBasicBottomResult, 0);
        setTimeout(removeBasicBottomResult, 150);
        setTimeout(removeBasicBottomResult, 500);
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter" || event.key === "=") {
          setTimeout(removeBasicBottomResult, 0);
          setTimeout(removeBasicBottomResult, 150);
          setTimeout(removeBasicBottomResult, 500);
        }
      },
      true
    );

    const main = document.querySelector("main");

    if (main && main.dataset.basicResultRemoveObserver !== "true") {
      main.dataset.basicResultRemoveObserver = "true";
      /* Background MutationObserver removed to stop loading loops. */
    }

    setTimeout(removeBasicBottomResult, 300);
    setTimeout(removeBasicBottomResult, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startRemoveBasicBottomResult);
  } else {
    startRemoveBasicBottomResult();
  }
})();
/* Removed old BMI overlay block: BMI: INPUT HISTORY INCLUDE USER PROFILE - Age group - Sex - BMI cut-off - Weight / height / waist / unit */
/* =====================================================
   BASIC CALCULATOR: SHOW √ SYMBOL IN DISPLAY + HISTORY
   - Calculator display shows √(
   - History input shows √(
   - Calculation still works by converting √( to Math.sqrt(
   - Example: 2√9 style becomes 2*√(9)
===================================================== */
(function () {
  "use strict";

  function isBasicPage() {
    return (
      document.body.classList.contains("basic-page") ||
      document.body.dataset.page === "basic" ||
      !!document.getElementById("display")
    );
  }

  function getDisplay() {
    return document.getElementById("display");
  }

  function needsMultiplyBeforeFunction(value) {
    if (!value) return false;

    const lastChar = value.slice(-1);
    return /[0-9.)]/.test(lastChar);
  }

  function toPrettyExpression(value) {
    return String(value || "")
      .replace(/Math\.sqrt\(/g, "√(");
  }

  function toJsExpression(value) {
    return String(value || "")
      .replace(/√\(/g, "Math.sqrt(")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-");
  }

  function normalizeDisplaySqrtSymbol() {
    if (!isBasicPage()) return;

    const display = getDisplay();
    if (!display) return;

    if (display.value.includes("Math.sqrt(")) {
      display.value = toPrettyExpression(display.value);
    }
  }

  function loadBasicHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem("basicEquationHistory") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "copied";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(copied).catch(function () {
        fallbackCopy(value);
        copied();
      });
    } else {
      fallbackCopy(value);
      copied();
    }
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

  function renderPrettyBasicHistory() {
    if (!isBasicPage()) return;

    const list = document.getElementById("historyList");
    if (!list) return;

    const title = document.querySelector(".history h3");
    if (title) {
      title.textContent = "Input";
    }

    const history = loadBasicHistory();

    list.innerHTML = "";

    history.slice().reverse().forEach(function (equation) {
      const prettyEquation = toPrettyExpression(equation);

      const li = document.createElement("li");
      li.className = "history-item basic-equation-history-item";

      const text = document.createElement("span");
      text.className = "history-text";
      text.textContent = "Eq: " + prettyEquation;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "history-copy-btn";
      copyBtn.textContent = "copy";

      copyBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        copyText(prettyEquation, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  /* Override square root button behavior */
  window.addFunction = function (func) {
    if (!isBasicPage()) return;

    const display = getDisplay();
    if (!display) return;

    if (display.value === "Error") {
      display.value = "";
    }

    if (func === "sqrt") {
      if (needsMultiplyBeforeFunction(display.value)) {
        display.value += "*√(";
      } else {
        display.value += "√(";
      }

      return;
    }

    const functionMap = {
      sin: "Math.sin(",
      cos: "Math.cos(",
      tan: "Math.tan(",
      log: "Math.log10(",
      ln: "Math.log("
    };

    if (functionMap[func]) {
      if (needsMultiplyBeforeFunction(display.value)) {
        display.value += "*" + functionMap[func];
      } else {
        display.value += functionMap[func];
      }
    }
  };

  /* Override calculate so √ still calculates correctly */
  const oldCalculate = window.calculate;

  window.calculate = function () {
    if (!isBasicPage()) {
      if (typeof oldCalculate === "function") {
        return oldCalculate();
      }

      return;
    }

    const display = getDisplay();
    if (!display) return;

    const prettyBeforeCalculate = display.value;

    display.value = toJsExpression(prettyBeforeCalculate);

    if (typeof oldCalculate === "function") {
      oldCalculate();
    }

    setTimeout(renderPrettyBasicHistory, 0);
    setTimeout(renderPrettyBasicHistory, 200);
    setTimeout(normalizeDisplaySqrtSymbol, 300);
  };

  /* Keyboard R should also use √ instead of Math.sqrt */
  document.addEventListener(
    "keydown",
    function (event) {
      if (!isBasicPage()) return;

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        window.addFunction("sqrt");
      }
    },
    true
  );

  function startBasicSqrtSymbolFix() {
    if (!isBasicPage()) return;

    normalizeDisplaySqrtSymbol();
    renderPrettyBasicHistory();

    document.addEventListener(
      "click",
      function () {
        setTimeout(normalizeDisplaySqrtSymbol, 0);
        setTimeout(renderPrettyBasicHistory, 150);
        setTimeout(renderPrettyBasicHistory, 500);
      },
      true
    );

    setTimeout(normalizeDisplaySqrtSymbol, 300);
    setTimeout(renderPrettyBasicHistory, 300);
    setTimeout(renderPrettyBasicHistory, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBasicSqrtSymbolFix);
  } else {
    startBasicSqrtSymbolFix();
  }
})();

/* Removed old BMI overlay block: BMI: FINAL USER PROFILE SEX OPTION FIX Keeps Sex as Male / Female only, even if old BMI profile code rebuilds it. */
/* =====================================================
   AGE CALCULATOR: Remove "Date range:" text from result
   Keeps only: dd/mm/yyyy to dd/mm/yyyy
===================================================== */
(function () {
  "use strict";

  function isAgePage() {
    return (
      document.body.classList.contains("age-page") ||
      document.body.dataset.page === "age" ||
      !!document.getElementById("birthdate")
    );
  }

  function formatDateDMY(value) {
    const parts = String(value || "").split("-");
    if (parts.length !== 3) return value || "";
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function getDateRangeText() {
    const birthdate = document.getElementById("birthdate");
    const target = document.getElementById("dateToCalculate");

    if (!birthdate || !birthdate.value) return "";

    const targetValue = target && target.value ? target.value : "";

    if (!targetValue) {
      return formatDateDMY(birthdate.value);
    }

    return formatDateDMY(birthdate.value) + " to " + formatDateDMY(targetValue);
  }

  function copyText(text, button) {
    if (!text) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(copied).catch(function () {
        fallbackCopy(text);
        copied();
      });
    } else {
      fallbackCopy(text);
      copied();
    }
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

  function removeAgeDateRangeLabel() {
    if (!isAgePage()) return;

    const panel = document.getElementById("stableBasicAgeOutput");
    if (!panel) return;

    const list =
      panel.querySelector(".age-final-range-result") ||
      panel.querySelector(".age-bullet-result");

    if (!list) return;

    const items = Array.from(list.querySelectorAll("li"));
    if (!items.length) return;

    const dateRange = getDateRangeText();

    if (dateRange) {
      items[0].innerHTML = "<strong>" + dateRange + "</strong>";
    } else {
      items[0].textContent = items[0].textContent.replace(/^Date range:\s*/i, "");
    }

    const copyBtn = panel.querySelector(".stable-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        const copyValue = Array.from(list.querySelectorAll("li"))
          .map(function (li) {
            return "• " + li.textContent.trim();
          })
          .join("\n");

        copyText(copyValue, copyBtn);
      };
    }

    const hiddenResult = document.getElementById("result") || document.getElementById("ageResult");

    if (hiddenResult && hiddenResult.textContent.includes("Date range:")) {
      hiddenResult.textContent = hiddenResult.textContent.replace(/^Date range:\s*/m, "");
    }
  }

  function start() {
    if (!isAgePage()) return;

    removeAgeDateRangeLabel();

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateAge")) {
          setTimeout(removeAgeDateRangeLabel, 0);
          setTimeout(removeAgeDateRangeLabel, 150);
          setTimeout(removeAgeDateRangeLabel, 500);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(removeAgeDateRangeLabel, 150);
          setTimeout(removeAgeDateRangeLabel, 500);
        }
      },
      true
    );

    setTimeout(removeAgeDateRangeLabel, 500);
    setTimeout(removeAgeDateRangeLabel, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* Removed old BMI overlay block: BMI RESULT: Change W/H ratio to Waist/Height ratio - Shows waist/height in fraction format in result box - Also updates  */
/* =====================================================
   DISCOUNT CALCULATOR: Result box point form
   - Removes table result for discount page
   - Shows result as bullet / point form
===================================================== */
(function () {
  "use strict";

  const PANEL_ID = "stableDiscountOutput";

  function isDiscountPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("discount-page") ||
      document.body.dataset.page === "discount" ||
      title.includes("discount") ||
      !!document.getElementById("discountResult")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());
      if (Number.isFinite(value)) return value;
    }

    return NaN;
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function getOrCreatePanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById(PANEL_ID);

    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.className = "stable-result-output discount-point-output";
      panel.setAttribute("aria-label", "Discount calculator result");

      panel.innerHTML =
        '<div class="stable-result-top">' +
          '<div class="stable-result-panel">' +
            '<h2 class="stable-result-title">Result</h2>' +
            '<div class="stable-result-body"></div>' +
          '</div>' +
          '<div class="stable-copy-side">' +
            '<button type="button" class="stable-copy-btn">Copy</button>' +
          '</div>' +
        '</div>';

      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function hideOldDiscountTable() {
    const oldPanel = document.getElementById("universalLoanStyleOutput");

    if (oldPanel) {
      oldPanel.hidden = true;
      oldPanel.style.setProperty("display", "none", "important");
      oldPanel.style.setProperty("visibility", "hidden", "important");
      oldPanel.style.setProperty("pointer-events", "none", "important");
    }

    const result = document.getElementById("discountResult") || document.getElementById("result");

    if (result) {
      result.style.display = "none";
    }
  }

  function copyText(text, button) {
    if (!text) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(copied).catch(function () {
        fallbackCopy(text);
        copied();
      });
    } else {
      fallbackCopy(text);
      copied();
    }
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

  function renderDiscountPointResult() {
    if (!isDiscountPage()) return;

    const price = getNumber(["price", "originalPrice", "amount"]);
    const discount = getNumber(["discount", "discountRate", "percent"]);

    const panel = getOrCreatePanel();
    if (!panel) return;

    if (
      !Number.isFinite(price) ||
      !Number.isFinite(discount) ||
      price <= 0 ||
      discount < 0 ||
      discount > 100
    ) {
      panel.hidden = true;
      return;
    }

    const savings = price * discount / 100;
    const finalPrice = price - savings;

    const resultText =
      "• Original price: " + money(price) + "\n" +
      "• Discount: " + discount + "%\n" +
      "• Savings: " + money(savings) + "\n" +
      "• Final price: " + money(finalPrice);

    const body = panel.querySelector(".stable-result-body");

    if (body) {
      body.innerHTML =
        '<ul class="discount-point-result">' +
          '<li><strong>Original price:</strong> ' + money(price) + '</li>' +
          '<li><strong>Discount:</strong> ' + discount + '%</li>' +
          '<li><strong>Savings:</strong> ' + money(savings) + '</li>' +
          '<li><strong>Final price:</strong> ' + money(finalPrice) + '</li>' +
        '</ul>';
    }

    panel.hidden = false;

    const copyBtn = panel.querySelector(".stable-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyText(resultText, copyBtn);
      };
    }

    hideOldDiscountTable();
  }

  function startDiscountPointResult() {
    if (!isDiscountPage()) return;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateDiscount")) {
          setTimeout(renderDiscountPointResult, 0);
          setTimeout(renderDiscountPointResult, 200);
          setTimeout(renderDiscountPointResult, 600);
          setTimeout(renderDiscountPointResult, 1000);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(renderDiscountPointResult, 200);
          setTimeout(renderDiscountPointResult, 600);
        }
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startDiscountPointResult);
  } else {
    startDiscountPointResult();
  }
})();
/* =====================================================
   LOAN PAGE: Rename to Mortgage / Personal Loan Calculator
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      title.includes("loan") ||
      title.includes("mortgage") ||
      !!document.getElementById("loanResult") ||
      window.location.pathname.includes("loan-calculator")
    );
  }

  function renameLoanCalculator() {
    if (!isLoanPage()) return;

    document.body.classList.add("loan-page");
    document.body.dataset.page = "loan";

    document.title = "Mortgage / Personal Loan Calculator";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Free mortgage and personal loan calculator for monthly payment, interest, down payment, and total repayment."
      );
    }

    const h1 = document.querySelector(".calculator h1");
    if (h1) {
      h1.textContent = "Mortgage / Personal Loan Calculator";
    }

    const subtitle = document.querySelector(".calculator .subtitle");
    if (subtitle) {
      subtitle.textContent = "Calculate mortgage or personal loan payment using reducing-balance interest.";
    }

    document.querySelectorAll('a[href="loan-calculator.html"]').forEach(function (link) {
      link.textContent = "mortgage / personal loan";
    });

    const whatBox = document.querySelector(".instruction-what-box p");
    if (whatBox) {
      whatBox.textContent =
        "It estimates mortgage or personal loan payment, total interest, total payment, down payment, and optional costs.";
    }

    const howBox = document.querySelector(".instruction-how-box p");
    if (howBox) {
      howBox.textContent =
        "Enter the loan amount or purchase price, interest rate, years, and optional costs. Then press calculate.";
    }
  }

  function start() {
    renameLoanCalculator();

    setTimeout(renameLoanCalculator, 300);
    setTimeout(renameLoanCalculator, 900);
    setTimeout(renameLoanCalculator, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   SAFE LOAN MONTHS MODE
   Mortgage / Personal Loan Calculator
   - Loan term input uses months directly
   - Adds Down payment inside Optional costs
   - Optional cost items included in Loan Input history if not empty
   - Result keeps only:
     Monthly payment / Full loan interest / Full payment value
   - No MutationObserver loop, so the loan page will not keep loading
===================================================== */
(function () {
  "use strict";

  const HISTORY_KEY = "inputHistory_loan";
  const MAX_ITEMS = 50;

  function isLoanPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      title.includes("loan") ||
      title.includes("mortgage") ||
      window.location.pathname.includes("loan-calculator") ||
      !!document.getElementById("loanResult") ||
      !!document.getElementById("loanHistoryList")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());

      if (Number.isFinite(value)) {
        return value;
      }
    }

    return NaN;
  }

  function getValue(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = String(input.value || "").trim();

      if (value !== "") {
        return value;
      }
    }

    return "";
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.setAttribute("readonly", "");

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    function copied() {
      const old = button ? button.textContent : "";
      if (button) button.textContent = "Copied!";

      setTimeout(function () {
        if (button) button.textContent = old || "Copy";
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(copied).catch(function () {
        fallbackCopy(value);
        copied();
      });
    } else {
      fallbackCopy(value);
      copied();
    }
  }

  function findCalculateButton() {
    const calculator = document.querySelector(".calculator");
    if (!calculator) return null;

    return (
      calculator.querySelector("button.main-btn") ||
      Array.from(calculator.querySelectorAll("button")).find(function (button) {
        return button.textContent.trim().toLowerCase().includes("calculate");
      }) ||
      null
    );
  }

  function updateLoanLabelsToMonths() {
    if (!isLoanPage()) return;

    document.body.classList.add("loan-page");
    document.body.dataset.page = "loan";

    document.title = "Mortgage / Personal Loan Calculator";

    const pageTitle = document.querySelector(".calculator h1");
    if (pageTitle) {
      pageTitle.textContent = "Mortgage / Personal Loan Calculator";
    }

    const subtitle = document.querySelector(".calculator .subtitle");
    if (subtitle) {
      subtitle.textContent = "Estimate your monthly payment, full loan interest, and full payment value.";
    }

    const termInput =
      document.getElementById("years") ||
      document.getElementById("loanYears") ||
      document.getElementById("loanTerm") ||
      document.getElementById("term");

    if (termInput) {
      const label =
        termInput.id ? document.querySelector('label[for="' + termInput.id + '"]') : null;

      if (label) {
        label.textContent = "Loan term in months:";
      }

      termInput.placeholder = "Example: 360";
      termInput.setAttribute("aria-label", "Loan term in months");
      termInput.dataset.termUnit = "months";
    }

    const amountInput =
      document.getElementById("amount") ||
      document.getElementById("loanAmount") ||
      document.getElementById("principal") ||
      document.getElementById("loanPrincipal");

    if (amountInput) {
      const amountLabel =
        amountInput.id ? document.querySelector('label[for="' + amountInput.id + '"]') : null;

      if (amountLabel) {
        amountLabel.textContent = "Loan amount / purchase price:";
      }
    }

    const calculateButton = findCalculateButton();
    if (calculateButton) {
      calculateButton.textContent = "calculate loan";
    }

    document.querySelectorAll('a[href="loan-calculator.html"]').forEach(function (link) {
      if (link.textContent.trim().toLowerCase() === "loan") {
        link.textContent = "mortgage / personal loan";
      }
    });

    const whatText = document.querySelector(".instruction-what-box p");
    if (whatText) {
      whatText.textContent =
        "It estimates mortgage or personal loan monthly payment, full loan interest, and full payment value.";
    }

    const howText = document.querySelector(".instruction-how-box p");
    if (howText) {
      howText.textContent =
        "Enter the loan amount or purchase price, annual interest rate, loan term in months, and optional costs. Then press calculate loan.";
    }

    const formulaText = document.querySelector(".instruction-formula-box p");
    if (formulaText) {
      formulaText.textContent =
        "Monthly Payment = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where n is the number of months.";
    }

    const exampleText = document.querySelector(".instruction-example-box p");
    if (exampleText) {
      exampleText.textContent =
        "A 10,000 loan at 5% yearly for 24 months gives an estimated monthly payment using the amortization formula.";
    }
  }

  function ensureOptionalCostBox() {
    if (!isLoanPage()) return null;

    const calculator = document.querySelector(".calculator");
    if (!calculator) return null;

    let box = document.querySelector(".optional-mortgage-costs");

    if (!box) {
      box = document.createElement("div");
      box.className = "optional-mortgage-costs";

      box.innerHTML =
        '<button type="button" class="optional-mortgage-toggle" aria-expanded="false">Optional costs</button>' +
        '<div class="optional-mortgage-content" hidden></div>';

      const calculateButton = findCalculateButton();

      if (calculateButton) {
        calculateButton.insertAdjacentElement("beforebegin", box);
      } else {
        calculator.appendChild(box);
      }
    }

    let content =
      box.querySelector(".optional-mortgage-content") ||
      box.querySelector(".optional-cost-content");

    if (!content) {
      content = document.createElement("div");
      content.className = "optional-mortgage-content";
      box.appendChild(content);
    }

    const toggle = box.querySelector(".optional-mortgage-toggle");

    if (toggle && toggle.dataset.loanOptionalToggleReady !== "true") {
      toggle.dataset.loanOptionalToggleReady = "true";

      toggle.addEventListener("click", function (event) {
        event.preventDefault();

        const isHidden = content.hidden || content.style.display === "none";

        content.hidden = !isHidden;
        content.style.display = isHidden ? "block" : "none";
        toggle.setAttribute("aria-expanded", isHidden ? "true" : "false");
      });
    }

    return box;
  }

  function appendOptionalInput(content, id, labelText, placeholder) {
    if (document.getElementById(id)) return;

    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = "number";
    input.id = id;
    input.placeholder = placeholder;
    input.setAttribute("inputmode", "decimal");

    content.appendChild(label);
    content.appendChild(input);
  }

  function ensureOptionalCostInputs() {
    const box = ensureOptionalCostBox();
    if (!box) return;

    const content =
      box.querySelector(".optional-mortgage-content") ||
      box;

    if (!document.getElementById("downPayment")) {
      const label = document.createElement("label");
      label.setAttribute("for", "downPayment");
      label.textContent = "Down payment:";

      const input = document.createElement("input");
      input.type = "number";
      input.id = "downPayment";
      input.placeholder = "Optional, example: 8000";
      input.setAttribute("inputmode", "decimal");

      content.insertBefore(input, content.firstChild);
      content.insertBefore(label, input);
    }

    appendOptionalInput(content, "propertyTaxYearly", "Property tax yearly:", "Optional");
    appendOptionalInput(content, "homeInsuranceYearly", "Home insurance yearly:", "Optional");
    appendOptionalInput(content, "otherMonthlyFees", "Other monthly fees:", "Optional");
  }

  function calculateMonthlyPaymentFromMonths(principal, annualRate, months) {
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

  function optionalMonthlyCost() {
    const propertyTaxYearly = getNumber(["propertyTaxYearly"]);
    const insuranceYearly = getNumber(["homeInsuranceYearly"]);
    const otherMonthly = getNumber(["otherMonthlyFees", "hoaMonthly"]);

    return (
      (Number.isFinite(propertyTaxYearly) && propertyTaxYearly > 0 ? propertyTaxYearly / 12 : 0) +
      (Number.isFinite(insuranceYearly) && insuranceYearly > 0 ? insuranceYearly / 12 : 0) +
      (Number.isFinite(otherMonthly) && otherMonthly > 0 ? otherMonthly : 0)
    );
  }

  function getLoanPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById("loanExternalOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "loanExternalOutput";
      panel.className = "loan-external-output";
      panel.setAttribute("aria-label", "Loan result");

      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function hideOldLoanOutputs() {
    const result = document.getElementById("loanResult") || document.getElementById("result");
    if (result) {
      result.style.display = "none";
    }

    const universal = document.getElementById("universalLoanStyleOutput");
    if (universal) {
      universal.hidden = true;
      universal.style.setProperty("display", "none", "important");
      universal.style.setProperty("visibility", "hidden", "important");
      universal.style.setProperty("pointer-events", "none", "important");
    }
  }

  function renderLoanMonthsResult() {
    if (!isLoanPage()) return;

    updateLoanLabelsToMonths();
    ensureOptionalCostInputs();

    const purchasePrice = getNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = getNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const months = getNumber(["years", "loanYears", "loanTerm", "term"]);
    const downPaymentRaw = getNumber(["downPayment", "loanDownPayment"]);

    const result = document.getElementById("loanResult") || document.getElementById("result");
    const panel = getLoanPanel();

    if (!panel) return;

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(annualRate) ||
      !Number.isFinite(months) ||
      purchasePrice <= 0 ||
      annualRate < 0 ||
      months <= 0
    ) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid loan details.";
      }

      panel.hidden = true;
      return;
    }

    const downPayment =
      Number.isFinite(downPaymentRaw) && downPaymentRaw > 0
        ? downPaymentRaw
        : 0;

    if (downPayment >= purchasePrice) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Down payment must be less than the loan amount / purchase price.";
      }

      panel.hidden = true;
      return;
    }

    const amountBorrowed = purchasePrice - downPayment;
    const optionalCostMonthly = optionalMonthlyCost();

    const principalInterestMonthly = calculateMonthlyPaymentFromMonths(
      amountBorrowed,
      annualRate,
      months
    );

    const monthlyPayment = principalInterestMonthly + optionalCostMonthly;
    const totalLoanPayment = principalInterestMonthly * months;
    const fullLoanInterest = totalLoanPayment - amountBorrowed;
    const totalOptionalCosts = optionalCostMonthly * months;
    const fullPaymentValue = downPayment + totalLoanPayment + totalOptionalCosts;

    const resultText =
      "• Monthly payment: " + money(monthlyPayment) + "\n" +
      "• Full loan interest: " + money(fullLoanInterest) + "\n" +
      "• Full payment value: " + money(fullPaymentValue);

    panel.hidden = false;
    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +
          '<div class="loan-result-body">' +
            '<ul class="loan-point-result loan-months-result">' +
              '<li><strong>Monthly payment:</strong> ' + money(monthlyPayment) + '</li>' +
              '<li><strong>Full loan interest:</strong> ' + money(fullLoanInterest) + '</li>' +
              '<li><strong>Full payment value:</strong> ' + money(fullPaymentValue) + '</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="loan-copy-side">' +
          '<button type="button" class="loan-copy-btn">Copy</button>' +
        '</div>' +
      '</div>';

    hideOldLoanOutputs();

    const copyBtn = panel.querySelector(".loan-copy-btn");
    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        copyText(resultText, copyBtn);
      };
    }

    addLoanHistoryWithMonths();
  }

  function getInputLabel(input) {
    if (!input) return "Optional cost";

    const label =
      input.id ? document.querySelector('label[for="' + input.id + '"]') : null;

    if (label) {
      return label.textContent.replace(/[:：]/g, "").trim();
    }

    return input.name || input.id || "Optional cost";
  }

  function getOptionalCostHistoryLines() {
    const box = document.querySelector(".optional-mortgage-costs");
    if (!box) return [];

    const lines = [];
    const used = new Set();

    box.querySelectorAll("input, select, textarea").forEach(function (input) {
      if (!input || input.type === "hidden") return;

      const id = input.id || input.name || "";
      if (used.has(id)) return;
      used.add(id);

      const value = String(input.value || "").trim();
      if (value === "") return;

      lines.push(getInputLabel(input) + ": " + value);
    });

    return lines;
  }

  function buildLoanHistoryItem() {
    const amount = getValue(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const interest = getValue(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const months = getValue(["years", "loanYears", "loanTerm", "term"]);

    const lines = [];

    if (amount) lines.push("Loan amount / purchase price: " + amount);
    if (interest) lines.push("Annual interest rate: " + interest + "%");
    if (months) lines.push("Loan term in months: " + months);

    getOptionalCostHistoryLines().forEach(function (line) {
      lines.push(line);
    });

    return lines.join(" | ");
  }

  function loadLoanHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      const items = Array.isArray(value) ? value : [];

      return items.filter(function (item) {
        return !/\|\s*Years\s*:/i.test(String(item)) &&
               !/Loan amount:\s*.*\|\s*Interest rate:\s*.*\|\s*Years:/i.test(String(item));
      });
    } catch {
      return [];
    }
  }

  function saveLoanHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_ITEMS)));
    } catch {
      /* ignore */
    }
  }

  function renderLoanHistoryMonths() {
    if (!isLoanPage()) return;

    const list = document.getElementById("loanHistoryList");
    if (!list) return;

    const title =
      document.querySelector(".loan-history-box .loan-history-top h3") ||
      document.querySelector(".loan-history-box h3");

    if (title) {
      title.textContent = "Input";
    }

    const history = loadLoanHistory();
    saveLoanHistory(history);

    /*
      Only rebuild when the content actually changed.
      This prevents continuous loading / repaint loops.
    */
    const nextHtml = history.slice().reverse().map(function (item) {
      return (
        '<li class="history-item loan-input-history-item">' +
          '<span class="history-text"></span>' +
          '<button type="button" class="history-copy-btn">copy</button>' +
        '</li>'
      );
    }).join("");

    if (list.dataset.loanHistoryCount !== String(history.length)) {
      list.dataset.loanHistoryCount = String(history.length);
      list.innerHTML = nextHtml;

      Array.from(list.querySelectorAll(".history-item")).forEach(function (li, index) {
        const item = history.slice().reverse()[index];
        const text = li.querySelector(".history-text");
        const copyBtn = li.querySelector(".history-copy-btn");

        if (text) text.textContent = item;

        if (copyBtn) {
          copyBtn.onclick = function (event) {
            event.stopPropagation();
            copyText(item, copyBtn);
          };
        }
      });
    } else {
      Array.from(list.querySelectorAll(".history-item")).forEach(function (li, index) {
        const item = history.slice().reverse()[index];
        const text = li.querySelector(".history-text");
        const copyBtn = li.querySelector(".history-copy-btn");

        if (text && text.textContent !== item) {
          text.textContent = item;
        }

        if (copyBtn && copyBtn.dataset.loanCopyReady !== "true") {
          copyBtn.dataset.loanCopyReady = "true";
          copyBtn.onclick = function (event) {
            event.stopPropagation();
            copyText(item, copyBtn);
          };
        }
      });
    }
  }

  function addLoanHistoryWithMonths() {
    if (!isLoanPage()) return;

    const item = buildLoanHistoryItem();
    if (!item) return;

    const history = loadLoanHistory();
    const last = history[history.length - 1];

    if (last !== item) {
      history.push(item);
    }

    saveLoanHistory(history);
    renderLoanHistoryMonths();
  }

  function clearLoanHistoryMonths() {
    try {
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem("loanHistory");
      localStorage.removeItem("loanInputHistory");
    } catch {
      /* ignore */
    }

    const list = document.getElementById("loanHistoryList");
    if (list) {
      list.dataset.loanHistoryCount = "";
      list.innerHTML = "";
    }

    const panel = document.getElementById("loanExternalOutput");
    if (panel) {
      panel.hidden = true;
    }

    const result = document.getElementById("loanResult") || document.getElementById("result");
    if (result) {
      result.textContent = "";
    }
  }

  function startLoanMonthsMode() {
    if (!isLoanPage()) return;

    updateLoanLabelsToMonths();
    ensureOptionalCostInputs();
    renderLoanHistoryMonths();

    window.calculateLoan = renderLoanMonthsResult;
    window.clearLoanHistory = clearLoanHistoryMonths;
    window.showLoanHistory = renderLoanHistoryMonths;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateLoan")) {
          setTimeout(renderLoanMonthsResult, 0);
          setTimeout(renderLoanMonthsResult, 250);
        }

        if (text.includes("clear")) {
          setTimeout(clearLoanHistoryMonths, 0);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(renderLoanMonthsResult, 250);
        }
      },
      true
    );

    /*
      Important:
      No MutationObserver here. The old version watched <main> and then
      changed the history list inside the observer, which could make the
      loan page keep loading.
    */
    setTimeout(updateLoanLabelsToMonths, 300);
    setTimeout(ensureOptionalCostInputs, 500);
    setTimeout(renderLoanHistoryMonths, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startLoanMonthsMode);
  } else {
    startLoanMonthsMode();
  }
})();

/* =====================================================
   DISCOUNT CALCULATOR: Bottom result box like other pages
   - Result appears in external box below calculator
   - Point form result
   - Copy button included
   - Hides old table/result output
===================================================== */
(function () {
  "use strict";

  const PANEL_ID = "stableDiscountOutput";

  function isDiscountPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("discount-page") ||
      document.body.dataset.page === "discount" ||
      title.includes("discount") ||
      window.location.pathname.includes("discount-calculator") ||
      !!document.getElementById("discountResult") ||
      !!document.getElementById("discountHistoryList")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());

      if (Number.isFinite(value)) {
        return value;
      }
    }

    return NaN;
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function getDiscountPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById(PANEL_ID);

    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.className = "stable-result-output discount-result-output";
      panel.setAttribute("aria-label", "Discount calculator result");

      panel.innerHTML =
        '<div class="stable-result-top">' +
          '<div class="stable-result-panel">' +
            '<h2 class="stable-result-title">Result</h2>' +
            '<div class="stable-result-body"></div>' +
          '</div>' +
          '<div class="stable-copy-side">' +
            '<button type="button" class="stable-copy-btn">Copy</button>' +
          '</div>' +
        '</div>';

      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function hideOldDiscountOutputs() {
    const oldUniversal = document.getElementById("universalLoanStyleOutput");

    if (oldUniversal) {
      oldUniversal.hidden = true;
      oldUniversal.style.setProperty("display", "none", "important");
      oldUniversal.style.setProperty("visibility", "hidden", "important");
      oldUniversal.style.setProperty("pointer-events", "none", "important");
    }

    const result =
      document.getElementById("discountResult") ||
      document.getElementById("result");

    if (result) {
      result.style.display = "none";
    }
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(copied).catch(function () {
        fallbackCopy(value);
        copied();
      });
    } else {
      fallbackCopy(value);
      copied();
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.setAttribute("readonly", "");

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  function renderDiscountResultBox() {
    if (!isDiscountPage()) return;

    document.body.classList.add("discount-page");
    document.body.dataset.page = "discount";

    const price = getNumber(["price", "originalPrice", "amount"]);
    const discount = getNumber(["discount", "discountRate", "percent"]);

    const panel = getDiscountPanel();
    const result =
      document.getElementById("discountResult") ||
      document.getElementById("result");

    if (!panel) return;

    if (
      !Number.isFinite(price) ||
      !Number.isFinite(discount) ||
      price <= 0 ||
      discount < 0 ||
      discount > 100
    ) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid discount details.";
      }

      panel.hidden = true;
      hideOldDiscountOutputs();
      return;
    }

    const savings = price * discount / 100;
    const finalPrice = price - savings;

    const resultText =
      "• Original price: " + money(price) + "\n" +
      "• Discount: " + discount + "%\n" +
      "• Savings: " + money(savings) + "\n" +
      "• Final price: " + money(finalPrice);

    const body = panel.querySelector(".stable-result-body");

    if (body) {
      body.innerHTML =
        '<ul class="discount-point-result">' +
          '<li><strong>Original price:</strong> ' + money(price) + '</li>' +
          '<li><strong>Discount:</strong> ' + discount + '%</li>' +
          '<li><strong>Savings:</strong> ' + money(savings) + '</li>' +
          '<li><strong>Final price:</strong> ' + money(finalPrice) + '</li>' +
        '</ul>';
    }

    panel.hidden = false;
    panel.style.removeProperty("display");

    const copyBtn = panel.querySelector(".stable-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        copyText(resultText, copyBtn);
      };
    }

    hideOldDiscountOutputs();
  }

  function startDiscountResultBox() {
    if (!isDiscountPage()) return;

    window.calculateDiscount = renderDiscountResultBox;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateDiscount")) {
          setTimeout(renderDiscountResultBox, 0);
          setTimeout(renderDiscountResultBox, 250);
          setTimeout(renderDiscountResultBox, 700);
          setTimeout(renderDiscountResultBox, 1200);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(renderDiscountResultBox, 250);
          setTimeout(renderDiscountResultBox, 700);
        }
      },
      true
    );

    setTimeout(hideOldDiscountOutputs, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startDiscountResultBox);
  } else {
    startDiscountResultBox();
  }
})();

/* =====================================================
   FINAL HARD FIX: Mortgage term is MONTHS, not YEARS
   - This final assignment guarantees onclick="calculateLoan()"
     uses months directly.
   - No background click listeners.
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      window.location.pathname.includes("loan-calculator") ||
      !!document.getElementById("loanResult") ||
      !!document.getElementById("loanHistoryList")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());
      if (Number.isFinite(value)) return value;
    }

    return NaN;
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function monthlyPayment(principal, annualRate, months) {
    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
      return principal / months;
    }

    return (
      principal * monthlyRate * Math.pow(1 + monthlyRate, months)
    ) / (
      Math.pow(1 + monthlyRate, months) - 1
    );
  }

  function optionalMonthlyCost() {
    const propertyTaxYearly = getNumber(["propertyTaxYearly"]);
    const insuranceYearly = getNumber(["homeInsuranceYearly"]);
    const otherMonthly = getNumber(["otherMonthlyFees", "hoaMonthly"]);

    return (
      (Number.isFinite(propertyTaxYearly) && propertyTaxYearly > 0 ? propertyTaxYearly / 12 : 0) +
      (Number.isFinite(insuranceYearly) && insuranceYearly > 0 ? insuranceYearly / 12 : 0) +
      (Number.isFinite(otherMonthly) && otherMonthly > 0 ? otherMonthly : 0)
    );
  }

  function getLoanPanel() {
    const main = document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById("loanExternalOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "loanExternalOutput";
      panel.className = "loan-external-output";
      panel.setAttribute("aria-label", "Loan result");
      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "Copied!";
      setTimeout(function () { button.textContent = old; }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(copied).catch(function () { copied(); });
    }
  }

  function finalCalculateLoanMonths() {
    if (!isLoanPage()) return;

    const purchasePrice = getNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = getNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const months = getNumber(["years", "loanYears", "loanTerm", "term"]);
    const downPaymentRaw = getNumber(["downPayment", "loanDownPayment"]);

    const result = document.getElementById("loanResult") || document.getElementById("result");
    const panel = getLoanPanel();
    if (!panel) return;

    if (!Number.isFinite(purchasePrice) || !Number.isFinite(annualRate) || !Number.isFinite(months) || purchasePrice <= 0 || annualRate < 0 || months <= 0) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid loan details.";
      }
      panel.hidden = true;
      return;
    }

    const downPayment = Number.isFinite(downPaymentRaw) && downPaymentRaw > 0 ? downPaymentRaw : 0;

    if (downPayment >= purchasePrice) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Down payment must be less than the loan amount / purchase price.";
      }
      panel.hidden = true;
      return;
    }

    const amountBorrowed = purchasePrice - downPayment;
    const extraMonthly = optionalMonthlyCost();
    const principalInterestMonthly = monthlyPayment(amountBorrowed, annualRate, months);
    const finalMonthlyPayment = principalInterestMonthly + extraMonthly;
    const fullLoanInterest = principalInterestMonthly * months - amountBorrowed;
    const fullPaymentValue = downPayment + principalInterestMonthly * months + extraMonthly * months;

    const resultText =
      "• Monthly payment: " + money(finalMonthlyPayment) + "\n" +
      "• Full loan interest: " + money(fullLoanInterest) + "\n" +
      "• Full payment value: " + money(fullPaymentValue);

    panel.hidden = false;
    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +
          '<div class="loan-result-body">' +
            '<ul class="loan-point-result loan-months-result">' +
              '<li><strong>Monthly payment:</strong> ' + money(finalMonthlyPayment) + '</li>' +
              '<li><strong>Full loan interest:</strong> ' + money(fullLoanInterest) + '</li>' +
              '<li><strong>Full payment value:</strong> ' + money(fullPaymentValue) + '</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="loan-copy-side"><button type="button" class="loan-copy-btn">Copy</button></div>' +
      '</div>';

    if (result) result.style.display = "none";

    const copyBtn = panel.querySelector(".loan-copy-btn");
    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyText(resultText, copyBtn);
      };
    }
  }

  function labelMonths() {
    const termInput = document.getElementById("years") || document.getElementById("loanYears") || document.getElementById("loanTerm") || document.getElementById("term");
    if (!termInput) return;

    const label = termInput.id ? document.querySelector('label[for="' + termInput.id + '"]') : null;
    if (label) label.textContent = "Loan term in months:";
    termInput.placeholder = "Example: 360";
    termInput.dataset.termUnit = "months";
  }

  function start() {
    if (!isLoanPage()) return;
    labelMonths();
    window.calculateLoan = finalCalculateLoanMonths;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

/* =====================================================
   MORTGAGE / PERSONAL LOAN: Result + yearly table
   - Uses loan term as months
   - Keeps point form result
   - Adds table beside point form:
     Year / Monthly payment / Monthly interest rate / Total payment
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      title.includes("loan") ||
      title.includes("mortgage") ||
      window.location.pathname.includes("loan-calculator") ||
      !!document.getElementById("loanResult")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());
      if (Number.isFinite(value)) return value;
    }

    return NaN;
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function calculateMonthlyPayment(principal, annualRate, months) {
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
    const propertyTaxYearly = getNumber(["propertyTaxYearly"]);
    const insuranceYearly = getNumber(["homeInsuranceYearly"]);
    const otherMonthly = getNumber(["otherMonthlyFees", "hoaMonthly"]);

    const propertyTaxMonthly =
      Number.isFinite(propertyTaxYearly) && propertyTaxYearly > 0
        ? propertyTaxYearly / 12
        : 0;

    const insuranceMonthly =
      Number.isFinite(insuranceYearly) && insuranceYearly > 0
        ? insuranceYearly / 12
        : 0;

    const otherMonthlyCost =
      Number.isFinite(otherMonthly) && otherMonthly > 0
        ? otherMonthly
        : 0;

    return propertyTaxMonthly + insuranceMonthly + otherMonthlyCost;
  }

  function getLoanPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById("loanExternalOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "loanExternalOutput";
      panel.className = "loan-external-output";
      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function hideOldLoanOutputs() {
    const result = document.getElementById("loanResult") || document.getElementById("result");
    if (result) {
      result.style.display = "none";
    }

    const universal = document.getElementById("universalLoanStyleOutput");
    if (universal) {
      universal.hidden = true;
      universal.style.setProperty("display", "none", "important");
      universal.style.setProperty("visibility", "hidden", "important");
      universal.style.setProperty("pointer-events", "none", "important");
    }
  }

  function copyText(text, button) {
    if (!text) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(copied).catch(function () {
        fallbackCopy(text);
        copied();
      });
    } else {
      fallbackCopy(text);
      copied();
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.setAttribute("readonly", "");

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  function buildYearTableRows(monthlyPayment, monthlyInterestRate, months) {
    const fullYears = Math.ceil(months / 12);
    let rows = "";

    for (let year = 1; year <= fullYears; year += 1) {
      const monthsPaid = Math.min(year * 12, months);
      const totalPaid = monthlyPayment * monthsPaid;

      rows +=
        "<tr>" +
          "<td>" + year + "</td>" +
          "<td>" + money(monthlyPayment) + "</td>" +
          "<td>" + monthlyInterestRate.toFixed(4) + "%</td>" +
          "<td>" + money(totalPaid) + "</td>" +
        "</tr>";
    }

    return rows;
  }

  function renderMortgageResultWithYearTable() {
    if (!isLoanPage()) return;

    document.body.classList.add("loan-page");
    document.body.dataset.page = "loan";

    const purchasePrice = getNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = getNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const months = getNumber(["years", "loanYears", "loanTerm", "term"]);
    const downPaymentRaw = getNumber(["downPayment", "loanDownPayment"]);

    const result = document.getElementById("loanResult") || document.getElementById("result");
    const panel = getLoanPanel();

    if (!panel) return;

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(annualRate) ||
      !Number.isFinite(months) ||
      purchasePrice <= 0 ||
      annualRate < 0 ||
      months <= 0
    ) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid loan details.";
      }

      panel.hidden = true;
      return;
    }

    const downPayment =
      Number.isFinite(downPaymentRaw) && downPaymentRaw > 0
        ? downPaymentRaw
        : 0;

    if (downPayment >= purchasePrice) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Down payment must be less than the loan amount / purchase price.";
      }

      panel.hidden = true;
      return;
    }

    const amountBorrowed = purchasePrice - downPayment;
    const optionalMonthlyCost = getOptionalMonthlyCost();

    const principalInterestMonthly = calculateMonthlyPayment(
      amountBorrowed,
      annualRate,
      months
    );

    const monthlyPayment = principalInterestMonthly + optionalMonthlyCost;
    const monthlyInterestRate = annualRate / 12;

    const totalLoanPayment = principalInterestMonthly * months;
    const fullLoanInterest = totalLoanPayment - amountBorrowed;
    const totalOptionalCosts = optionalMonthlyCost * months;
    const fullPaymentValue = downPayment + totalLoanPayment + totalOptionalCosts;

    const tableRows = buildYearTableRows(monthlyPayment, monthlyInterestRate, months);

    const copyValue =
      "• Monthly payment: " + money(monthlyPayment) + "\n" +
      "• Full loan interest: " + money(fullLoanInterest) + "\n" +
      "• Full payment value: " + money(fullPaymentValue) + "\n\n" +
      "Year\tMonthly payment\tMonthly interest rate\tTotal payment\n" +
      Array.from({ length: Math.ceil(months / 12) }, function (_, index) {
        const year = index + 1;
        const monthsPaid = Math.min(year * 12, months);
        return (
          year + "\t" +
          money(monthlyPayment) + "\t" +
          monthlyInterestRate.toFixed(4) + "%\t" +
          money(monthlyPayment * monthsPaid)
        );
      }).join("\n");

    panel.hidden = false;
    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +

          '<div class="loan-result-body mortgage-result-with-table">' +

            '<div class="mortgage-point-box">' +
              '<ul class="loan-point-result">' +
                '<li><strong>Monthly payment:</strong> ' + money(monthlyPayment) + '</li>' +
                '<li><strong>Full loan interest:</strong> ' + money(fullLoanInterest) + '</li>' +
                '<li><strong>Full payment value:</strong> ' + money(fullPaymentValue) + '</li>' +
              '</ul>' +
            '</div>' +

            '<div class="mortgage-year-table-box">' +
              '<h3>Yearly payment table</h3>' +
              '<div class="mortgage-year-table-scroll">' +
                '<table class="mortgage-year-table">' +
                  '<thead>' +
                    '<tr>' +
                      '<th>Year</th>' +
                      '<th>Monthly payment</th>' +
                      '<th>Monthly interest rate</th>' +
                      '<th>Total payment</th>' +
                    '</tr>' +
                  '</thead>' +
                  '<tbody>' + tableRows + '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +

          '</div>' +
        '</div>' +

        '<div class="loan-copy-side">' +
          '<button type="button" class="loan-copy-btn">Copy</button>' +
        '</div>' +
      '</div>';

    hideOldLoanOutputs();

    const copyBtn = panel.querySelector(".loan-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        copyText(copyValue, copyBtn);
      };
    }
  }

  function startMortgageYearTable() {
    if (!isLoanPage()) return;

    window.calculateLoan = renderMortgageResultWithYearTable;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateLoan")) {
          setTimeout(renderMortgageResultWithYearTable, 0);
          setTimeout(renderMortgageResultWithYearTable, 250);
          setTimeout(renderMortgageResultWithYearTable, 700);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(renderMortgageResultWithYearTable, 250);
          setTimeout(renderMortgageResultWithYearTable, 700);
        }
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startMortgageYearTable);
  } else {
    startMortgageYearTable();
  }
})();
/* =====================================================
   MORTGAGE / PERSONAL LOAN: Table-only result
   - Removes point form result box
   - Uses loan term as months
   - Shows important mortgage values against year
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      title.includes("loan") ||
      title.includes("mortgage") ||
      window.location.pathname.includes("loan-calculator") ||
      !!document.getElementById("loanResult")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());
      if (Number.isFinite(value)) return value;
    }

    return NaN;
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function calculateMonthlyPayment(principal, annualRate, months) {
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
    const propertyTaxYearly = getNumber(["propertyTaxYearly"]);
    const insuranceYearly = getNumber(["homeInsuranceYearly"]);
    const otherMonthly = getNumber(["otherMonthlyFees", "hoaMonthly"]);

    return (
      (Number.isFinite(propertyTaxYearly) && propertyTaxYearly > 0 ? propertyTaxYearly / 12 : 0) +
      (Number.isFinite(insuranceYearly) && insuranceYearly > 0 ? insuranceYearly / 12 : 0) +
      (Number.isFinite(otherMonthly) && otherMonthly > 0 ? otherMonthly : 0)
    );
  }

  function getLoanPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById("loanExternalOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "loanExternalOutput";
      panel.className = "loan-external-output";
      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function hideOldLoanOutputs() {
    const result = document.getElementById("loanResult") || document.getElementById("result");

    if (result) {
      result.style.display = "none";
    }

    const universal = document.getElementById("universalLoanStyleOutput");

    if (universal) {
      universal.hidden = true;
      universal.style.setProperty("display", "none", "important");
      universal.style.setProperty("visibility", "hidden", "important");
      universal.style.setProperty("pointer-events", "none", "important");
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.setAttribute("readonly", "");

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(copied).catch(function () {
        fallbackCopy(value);
        copied();
      });
    } else {
      fallbackCopy(value);
      copied();
    }
  }

  function buildYearlyMortgageRows(amountBorrowed, annualRate, months, principalInterestMonthly, optionalMonthlyCost) {
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = principalInterestMonthly + optionalMonthlyCost;

    let balance = amountBorrowed;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let totalPaid = 0;

    const rows = [];
    const fullYears = Math.ceil(months / 12);

    for (let year = 1; year <= fullYears; year += 1) {
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;
      let yearlyOptional = 0;
      let yearlyPayment = 0;

      const startMonth = (year - 1) * 12 + 1;
      const endMonth = Math.min(year * 12, months);

      for (let month = startMonth; month <= endMonth; month += 1) {
        const interestThisMonth = balance * monthlyRate;
        let principalThisMonth = principalInterestMonthly - interestThisMonth;

        if (principalThisMonth > balance) {
          principalThisMonth = balance;
        }

        balance -= principalThisMonth;

        if (balance < 0.01) {
          balance = 0;
        }

        yearlyPrincipal += principalThisMonth;
        yearlyInterest += interestThisMonth;
        yearlyOptional += optionalMonthlyCost;
        yearlyPayment += monthlyPayment;
      }

      totalPrincipalPaid += yearlyPrincipal;
      totalInterestPaid += yearlyInterest;
      totalPaid += yearlyPayment;

      rows.push({
        year: year,
        monthlyPayment: monthlyPayment,
        monthlyInterestRate: annualRate / 12,
        yearlyPayment: yearlyPayment,
        principalPaid: yearlyPrincipal,
        interestPaid: yearlyInterest,
        optionalCost: yearlyOptional,
        totalPayment: totalPaid,
        totalInterestPaid: totalInterestPaid,
        remainingBalance: balance
      });
    }

    return rows;
  }

  function renderMortgageTableOnlyResult() {
    if (!isLoanPage()) return;

    document.body.classList.add("loan-page");
    document.body.dataset.page = "loan";

    const purchasePrice = getNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = getNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const months = getNumber(["years", "loanYears", "loanTerm", "term"]);
    const downPaymentRaw = getNumber(["downPayment", "loanDownPayment"]);

    const result = document.getElementById("loanResult") || document.getElementById("result");
    const panel = getLoanPanel();

    if (!panel) return;

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(annualRate) ||
      !Number.isFinite(months) ||
      purchasePrice <= 0 ||
      annualRate < 0 ||
      months <= 0
    ) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid loan details.";
      }

      panel.hidden = true;
      return;
    }

    const downPayment =
      Number.isFinite(downPaymentRaw) && downPaymentRaw > 0
        ? downPaymentRaw
        : 0;

    if (downPayment >= purchasePrice) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Down payment must be less than the loan amount / purchase price.";
      }

      panel.hidden = true;
      return;
    }

    const amountBorrowed = purchasePrice - downPayment;
    const optionalMonthlyCost = getOptionalMonthlyCost();

    const principalInterestMonthly = calculateMonthlyPayment(
      amountBorrowed,
      annualRate,
      months
    );

    const rows = buildYearlyMortgageRows(
      amountBorrowed,
      annualRate,
      months,
      principalInterestMonthly,
      optionalMonthlyCost
    );

    const tableRows = rows.map(function (row) {
      return (
        "<tr>" +
          "<td>" + row.year + "</td>" +
          "<td>" + money(row.monthlyPayment) + "</td>" +
          "<td>" + row.monthlyInterestRate.toFixed(4) + "%</td>" +
          "<td>" + money(row.yearlyPayment) + "</td>" +
          "<td>" + money(row.principalPaid) + "</td>" +
          "<td>" + money(row.interestPaid) + "</td>" +
          "<td>" + money(row.optionalCost) + "</td>" +
          "<td>" + money(row.totalPayment) + "</td>" +
          "<td>" + money(row.totalInterestPaid) + "</td>" +
          "<td>" + money(row.remainingBalance) + "</td>" +
        "</tr>"
      );
    }).join("");

    const copyValue =
      "Year\tMonthly payment\tMonthly interest rate\tYearly payment\tPrincipal paid\tInterest paid\tOptional costs\tTotal payment\tTotal interest\tRemaining balance\n" +
      rows.map(function (row) {
        return (
          row.year + "\t" +
          money(row.monthlyPayment) + "\t" +
          row.monthlyInterestRate.toFixed(4) + "%\t" +
          money(row.yearlyPayment) + "\t" +
          money(row.principalPaid) + "\t" +
          money(row.interestPaid) + "\t" +
          money(row.optionalCost) + "\t" +
          money(row.totalPayment) + "\t" +
          money(row.totalInterestPaid) + "\t" +
          money(row.remainingBalance)
        );
      }).join("\n");

    panel.hidden = false;

    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel mortgage-table-only-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +

          '<div class="loan-result-body mortgage-result-table-only">' +
            '<div class="mortgage-year-table-box mortgage-single-table-box">' +
              '<h3>Mortgage yearly table</h3>' +

              '<div class="mortgage-year-table-scroll">' +
                '<table class="mortgage-year-table mortgage-important-table">' +
                  '<thead>' +
                    '<tr>' +
                      '<th>Year</th>' +
                      '<th>Monthly payment</th>' +
                      '<th>Monthly interest rate</th>' +
                      '<th>Yearly payment</th>' +
                      '<th>Principal paid</th>' +
                      '<th>Interest paid</th>' +
                      '<th>Optional costs</th>' +
                      '<th>Total payment</th>' +
                      '<th>Total interest</th>' +
                      '<th>Remaining balance</th>' +
                    '</tr>' +
                  '</thead>' +
                  '<tbody>' + tableRows + '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="loan-copy-side">' +
          '<button type="button" class="loan-copy-btn">Copy</button>' +
        '</div>' +
      '</div>';

    hideOldLoanOutputs();

    const copyBtn = panel.querySelector(".loan-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        copyText(copyValue, copyBtn);
      };
    }
  }

  function startMortgageTableOnly() {
    if (!isLoanPage()) return;

    window.calculateLoan = renderMortgageTableOnlyResult;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateLoan")) {
          setTimeout(renderMortgageTableOnlyResult, 0);
          setTimeout(renderMortgageTableOnlyResult, 250);
          setTimeout(renderMortgageTableOnlyResult, 700);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(renderMortgageTableOnlyResult, 250);
          setTimeout(renderMortgageTableOnlyResult, 700);
        }
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startMortgageTableOnly);
  } else {
    startMortgageTableOnly();
  }
})();
/* =====================================================
   MORTGAGE / PERSONAL LOAN: Summary values + cleaner table
   - Summary above table:
     Monthly payment / Monthly interest / Yearly payment
   - Table removes:
     Monthly payment / Monthly interest rate / Yearly payment / Optional costs
   - Uses loan term as months
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      title.includes("loan") ||
      title.includes("mortgage") ||
      window.location.pathname.includes("loan-calculator") ||
      !!document.getElementById("loanResult")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());
      if (Number.isFinite(value)) return value;
    }

    return NaN;
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function calculateMonthlyPayment(principal, annualRate, months) {
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
    const propertyTaxYearly = getNumber(["propertyTaxYearly"]);
    const insuranceYearly = getNumber(["homeInsuranceYearly"]);
    const otherMonthly = getNumber(["otherMonthlyFees", "hoaMonthly"]);

    return (
      (Number.isFinite(propertyTaxYearly) && propertyTaxYearly > 0 ? propertyTaxYearly / 12 : 0) +
      (Number.isFinite(insuranceYearly) && insuranceYearly > 0 ? insuranceYearly / 12 : 0) +
      (Number.isFinite(otherMonthly) && otherMonthly > 0 ? otherMonthly : 0)
    );
  }

  function getLoanPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById("loanExternalOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "loanExternalOutput";
      panel.className = "loan-external-output";
      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function hideOldLoanOutputs() {
    const result = document.getElementById("loanResult") || document.getElementById("result");

    if (result) {
      result.style.display = "none";
    }

    const universal = document.getElementById("universalLoanStyleOutput");

    if (universal) {
      universal.hidden = true;
      universal.style.setProperty("display", "none", "important");
      universal.style.setProperty("visibility", "hidden", "important");
      universal.style.setProperty("pointer-events", "none", "important");
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.setAttribute("readonly", "");

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(copied).catch(function () {
        fallbackCopy(value);
        copied();
      });
    } else {
      fallbackCopy(value);
      copied();
    }
  }

  function buildYearRows(amountBorrowed, annualRate, months, principalInterestMonthly, optionalMonthlyCost) {
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = principalInterestMonthly + optionalMonthlyCost;

    let balance = amountBorrowed;
    let totalInterestPaid = 0;
    let totalPaid = 0;

    const rows = [];
    const fullYears = Math.ceil(months / 12);

    for (let year = 1; year <= fullYears; year += 1) {
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;

      const startMonth = (year - 1) * 12 + 1;
      const endMonth = Math.min(year * 12, months);

      for (let month = startMonth; month <= endMonth; month += 1) {
        const interestThisMonth = balance * monthlyRate;
        let principalThisMonth = principalInterestMonthly - interestThisMonth;

        if (principalThisMonth > balance) {
          principalThisMonth = balance;
        }

        balance -= principalThisMonth;

        if (balance < 0.01) {
          balance = 0;
        }

        yearlyPrincipal += principalThisMonth;
        yearlyInterest += interestThisMonth;
      }

      const monthsInThisYear = endMonth - startMonth + 1;
      const yearlyPayment = monthlyPayment * monthsInThisYear;

      totalInterestPaid += yearlyInterest;
      totalPaid += yearlyPayment;

      rows.push({
        year: year,
        principalPaid: yearlyPrincipal,
        interestPaid: yearlyInterest,
        totalPayment: totalPaid,
        totalInterestPaid: totalInterestPaid,
        remainingBalance: balance
      });
    }

    return rows;
  }

  function renderMortgageSummaryAndTable() {
    if (!isLoanPage()) return;

    const purchasePrice = getNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = getNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const months = getNumber(["years", "loanYears", "loanTerm", "term"]);
    const downPaymentRaw = getNumber(["downPayment", "loanDownPayment"]);

    const result = document.getElementById("loanResult") || document.getElementById("result");
    const panel = getLoanPanel();

    if (!panel) return;

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(annualRate) ||
      !Number.isFinite(months) ||
      purchasePrice <= 0 ||
      annualRate < 0 ||
      months <= 0
    ) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid loan details.";
      }

      panel.hidden = true;
      return;
    }

    const downPayment =
      Number.isFinite(downPaymentRaw) && downPaymentRaw > 0
        ? downPaymentRaw
        : 0;

    if (downPayment >= purchasePrice) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Down payment must be less than the loan amount / purchase price.";
      }

      panel.hidden = true;
      return;
    }

    const amountBorrowed = purchasePrice - downPayment;
    const optionalMonthlyCost = getOptionalMonthlyCost();

    const principalInterestMonthly = calculateMonthlyPayment(
      amountBorrowed,
      annualRate,
      months
    );

    const monthlyPayment = principalInterestMonthly + optionalMonthlyCost;

    /*
      Mortgage interest changes as balance goes down.
      This summary shows the first-month interest value.
      The yearly table still shows yearly interest paid.
    */
    const firstMonthInterest = amountBorrowed * (annualRate / 100 / 12);
    const yearlyPaymentValue = monthlyPayment * Math.min(12, months);

    const rows = buildYearRows(
      amountBorrowed,
      annualRate,
      months,
      principalInterestMonthly,
      optionalMonthlyCost
    );

    const tableRows = rows.map(function (row) {
      return (
        "<tr>" +
          "<td>" + row.year + "</td>" +
          "<td>" + money(row.principalPaid) + "</td>" +
          "<td>" + money(row.interestPaid) + "</td>" +
          "<td>" + money(row.totalPayment) + "</td>" +
          "<td>" + money(row.totalInterestPaid) + "</td>" +
          "<td>" + money(row.remainingBalance) + "</td>" +
        "</tr>"
      );
    }).join("");

    const copyValue =
      "Monthly payment: " + money(monthlyPayment) + "\n" +
      "Monthly interest: " + money(firstMonthInterest) + "\n" +
      "Yearly payment: " + money(yearlyPaymentValue) + "\n\n" +
      "Year\tPrincipal paid\tInterest paid\tTotal payment\tTotal interest\tRemaining balance\n" +
      rows.map(function (row) {
        return (
          row.year + "\t" +
          money(row.principalPaid) + "\t" +
          money(row.interestPaid) + "\t" +
          money(row.totalPayment) + "\t" +
          money(row.totalInterestPaid) + "\t" +
          money(row.remainingBalance)
        );
      }).join("\n");

    panel.hidden = false;

    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel mortgage-table-only-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +

          '<div class="mortgage-summary-row">' +
            '<div class="mortgage-summary-card">' +
              '<span>Monthly payment</span>' +
              '<strong>' + money(monthlyPayment) + '</strong>' +
            '</div>' +

            '<div class="mortgage-summary-card">' +
              '<span>Monthly interest</span>' +
              '<strong>' + money(firstMonthInterest) + '</strong>' +
            '</div>' +

            '<div class="mortgage-summary-card">' +
              '<span>Yearly payment</span>' +
              '<strong>' + money(yearlyPaymentValue) + '</strong>' +
            '</div>' +
          '</div>' +

          '<div class="loan-result-body mortgage-result-table-only">' +
            '<div class="mortgage-year-table-box mortgage-single-table-box">' +
              '<h3>Mortgage yearly table</h3>' +

              '<div class="mortgage-year-table-scroll">' +
                '<table class="mortgage-year-table mortgage-important-table">' +
                  '<thead>' +
                    '<tr>' +
                      '<th>Year</th>' +
                      '<th>Principal paid</th>' +
                      '<th>Interest paid</th>' +
                      '<th>Total payment</th>' +
                      '<th>Total interest</th>' +
                      '<th>Remaining balance</th>' +
                    '</tr>' +
                  '</thead>' +
                  '<tbody>' + tableRows + '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="loan-copy-side">' +
          '<button type="button" class="loan-copy-btn">Copy</button>' +
        '</div>' +
      '</div>';

    hideOldLoanOutputs();

    const copyBtn = panel.querySelector(".loan-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyText(copyValue, copyBtn);
      };
    }
  }

  function start() {
    if (!isLoanPage()) return;

    window.calculateLoan = renderMortgageSummaryAndTable;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateLoan")) {
          setTimeout(renderMortgageSummaryAndTable, 0);
          setTimeout(renderMortgageSummaryAndTable, 250);
          setTimeout(renderMortgageSummaryAndTable, 700);
          setTimeout(renderMortgageSummaryAndTable, 1200);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(renderMortgageSummaryAndTable, 250);
          setTimeout(renderMortgageSummaryAndTable, 700);
          setTimeout(renderMortgageSummaryAndTable, 1200);
        }
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

/* =====================================================
   MORTGAGE RESULT TABLE: Monthly if term is under 13 months
   - 1 to 12 months = monthly table
   - 13+ months = yearly table
   - Uses loan term input as months
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      title.includes("loan") ||
      title.includes("mortgage") ||
      window.location.pathname.includes("loan-calculator") ||
      !!document.getElementById("loanResult")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());
      if (Number.isFinite(value)) return value;
    }

    return NaN;
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function calculateMonthlyPayment(principal, annualRate, months) {
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
    const propertyTaxYearly = getNumber(["propertyTaxYearly"]);
    const insuranceYearly = getNumber(["homeInsuranceYearly"]);
    const otherMonthly = getNumber(["otherMonthlyFees", "hoaMonthly"]);

    return (
      (Number.isFinite(propertyTaxYearly) && propertyTaxYearly > 0 ? propertyTaxYearly / 12 : 0) +
      (Number.isFinite(insuranceYearly) && insuranceYearly > 0 ? insuranceYearly / 12 : 0) +
      (Number.isFinite(otherMonthly) && otherMonthly > 0 ? otherMonthly : 0)
    );
  }

  function getLoanPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById("loanExternalOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "loanExternalOutput";
      panel.className = "loan-external-output";
      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function hideOldLoanOutputs() {
    const result = document.getElementById("loanResult") || document.getElementById("result");

    if (result) {
      result.style.display = "none";
    }

    const universal = document.getElementById("universalLoanStyleOutput");

    if (universal) {
      universal.hidden = true;
      universal.style.setProperty("display", "none", "important");
      universal.style.setProperty("visibility", "hidden", "important");
      universal.style.setProperty("pointer-events", "none", "important");
    }
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(copied).catch(function () {
        fallbackCopy(value);
        copied();
      });
    } else {
      fallbackCopy(value);
      copied();
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.setAttribute("readonly", "");

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  function buildMonthlyRows(amountBorrowed, annualRate, months, principalInterestMonthly, optionalMonthlyCost) {
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = principalInterestMonthly + optionalMonthlyCost;

    let balance = amountBorrowed;
    let totalInterestPaid = 0;
    let totalPaid = 0;

    const rows = [];

    for (let month = 1; month <= months; month += 1) {
      const interestThisMonth = balance * monthlyRate;
      let principalThisMonth = principalInterestMonthly - interestThisMonth;

      if (principalThisMonth > balance) {
        principalThisMonth = balance;
      }

      balance -= principalThisMonth;

      if (balance < 0.01) {
        balance = 0;
      }

      totalInterestPaid += interestThisMonth;
      totalPaid += monthlyPayment;

      rows.push({
        label: month,
        principalPaid: principalThisMonth,
        interestPaid: interestThisMonth,
        totalPayment: totalPaid,
        totalInterestPaid: totalInterestPaid,
        remainingBalance: balance
      });
    }

    return rows;
  }

  function buildYearRows(amountBorrowed, annualRate, months, principalInterestMonthly, optionalMonthlyCost) {
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = principalInterestMonthly + optionalMonthlyCost;

    let balance = amountBorrowed;
    let totalInterestPaid = 0;
    let totalPaid = 0;

    const rows = [];
    const fullYears = Math.ceil(months / 12);

    for (let year = 1; year <= fullYears; year += 1) {
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;

      const startMonth = (year - 1) * 12 + 1;
      const endMonth = Math.min(year * 12, months);

      for (let month = startMonth; month <= endMonth; month += 1) {
        const interestThisMonth = balance * monthlyRate;
        let principalThisMonth = principalInterestMonthly - interestThisMonth;

        if (principalThisMonth > balance) {
          principalThisMonth = balance;
        }

        balance -= principalThisMonth;

        if (balance < 0.01) {
          balance = 0;
        }

        yearlyPrincipal += principalThisMonth;
        yearlyInterest += interestThisMonth;
      }

      const monthsInThisYear = endMonth - startMonth + 1;
      const yearlyPayment = monthlyPayment * monthsInThisYear;

      totalInterestPaid += yearlyInterest;
      totalPaid += yearlyPayment;

      rows.push({
        label: year,
        principalPaid: yearlyPrincipal,
        interestPaid: yearlyInterest,
        totalPayment: totalPaid,
        totalInterestPaid: totalInterestPaid,
        remainingBalance: balance
      });
    }

    return rows;
  }

  function renderMortgageMonthlyOrYearlyTable() {
    if (!isLoanPage()) return;

    const purchasePrice = getNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = getNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const months = getNumber(["years", "loanYears", "loanTerm", "term"]);
    const downPaymentRaw = getNumber(["downPayment", "loanDownPayment"]);

    const result = document.getElementById("loanResult") || document.getElementById("result");
    const panel = getLoanPanel();

    if (!panel) return;

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(annualRate) ||
      !Number.isFinite(months) ||
      purchasePrice <= 0 ||
      annualRate < 0 ||
      months <= 0
    ) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid loan details.";
      }

      panel.hidden = true;
      return;
    }

    const downPayment =
      Number.isFinite(downPaymentRaw) && downPaymentRaw > 0
        ? downPaymentRaw
        : 0;

    if (downPayment >= purchasePrice) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Down payment must be less than the loan amount / purchase price.";
      }

      panel.hidden = true;
      return;
    }

    const amountBorrowed = purchasePrice - downPayment;
    const optionalMonthlyCost = getOptionalMonthlyCost();

    const principalInterestMonthly = calculateMonthlyPayment(
      amountBorrowed,
      annualRate,
      months
    );

    const monthlyPayment = principalInterestMonthly + optionalMonthlyCost;
    const firstMonthInterest = amountBorrowed * (annualRate / 100 / 12);
    const yearlyPaymentValue = monthlyPayment * Math.min(12, months);

    const useMonthlyTable = months < 13;

    const rows = useMonthlyTable
      ? buildMonthlyRows(amountBorrowed, annualRate, months, principalInterestMonthly, optionalMonthlyCost)
      : buildYearRows(amountBorrowed, annualRate, months, principalInterestMonthly, optionalMonthlyCost);

    const firstColumnTitle = useMonthlyTable ? "Month" : "Year";
    const tableTitle = useMonthlyTable ? "Mortgage monthly table" : "Mortgage yearly table";

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

    const copyValue =
      "Monthly payment: " + money(monthlyPayment) + "\n" +
      "Monthly interest: " + money(firstMonthInterest) + "\n" +
      "Yearly payment: " + money(yearlyPaymentValue) + "\n\n" +
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

    panel.hidden = false;

    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel mortgage-table-only-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +

          '<div class="mortgage-summary-row">' +
            '<div class="mortgage-summary-card">' +
              '<span>Monthly payment</span>' +
              '<strong>' + money(monthlyPayment) + '</strong>' +
            '</div>' +

            '<div class="mortgage-summary-card">' +
              '<span>Monthly interest</span>' +
              '<strong>' + money(firstMonthInterest) + '</strong>' +
            '</div>' +

            '<div class="mortgage-summary-card">' +
              '<span>Yearly payment</span>' +
              '<strong>' + money(yearlyPaymentValue) + '</strong>' +
            '</div>' +
          '</div>' +

          '<div class="loan-result-body mortgage-result-table-only">' +
            '<div class="mortgage-year-table-box mortgage-single-table-box">' +
              '<h3>' + tableTitle + '</h3>' +

              '<div class="mortgage-year-table-scroll">' +
                '<table class="mortgage-year-table mortgage-important-table">' +
                  '<thead>' +
                    '<tr>' +
                      '<th>' + firstColumnTitle + '</th>' +
                      '<th>Principal paid</th>' +
                      '<th>Interest paid</th>' +
                      '<th>Total payment</th>' +
                      '<th>Total interest</th>' +
                      '<th>Remaining balance</th>' +
                    '</tr>' +
                  '</thead>' +
                  '<tbody>' + tableRows + '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="loan-copy-side">' +
          '<button type="button" class="loan-copy-btn">Copy</button>' +
        '</div>' +
      '</div>';

    hideOldLoanOutputs();

    const copyBtn = panel.querySelector(".loan-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyText(copyValue, copyBtn);
      };
    }
  }

  function start() {
    if (!isLoanPage()) return;

    window.calculateLoan = renderMortgageMonthlyOrYearlyTable;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateLoan")) {
          setTimeout(renderMortgageMonthlyOrYearlyTable, 0);
          setTimeout(renderMortgageMonthlyOrYearlyTable, 250);
          setTimeout(renderMortgageMonthlyOrYearlyTable, 700);
          setTimeout(renderMortgageMonthlyOrYearlyTable, 1200);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(renderMortgageMonthlyOrYearlyTable, 250);
          setTimeout(renderMortgageMonthlyOrYearlyTable, 700);
          setTimeout(renderMortgageMonthlyOrYearlyTable, 1200);
        }
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* Removed old BMI overlay block: BMI RESULT: Change W/H ratio to Waist/Height fraction ratio */
/* =====================================================
   COMPOUND INTEREST: Item row vs Year column table
   - Removes current universal result table
   - New table:
     Item rows, Year columns
===================================================== */
(function () {
  "use strict";

  const PANEL_ID = "compoundYearMatrixOutput";

  function isCompoundPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("compound-page") ||
      document.body.dataset.page === "compound" ||
      title.includes("compound") ||
      window.location.pathname.includes("compound-interest-calculator") ||
      !!document.getElementById("compoundResult")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());
      if (Number.isFinite(value)) return value;
    }

    return NaN;
  }

  function getValue(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = String(input.value || "").trim();
      if (value) return value;
    }

    return "";
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function getPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById(PANEL_ID);

    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.className = "loan-style-output-panel compound-year-matrix-output";
      panel.setAttribute("aria-label", "Compound interest result table");

      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function hideOldCompoundOutputs() {
    const universal = document.getElementById("universalLoanStyleOutput");
    if (universal) {
      universal.hidden = true;
      universal.style.setProperty("display", "none", "important");
      universal.style.setProperty("visibility", "hidden", "important");
      universal.style.setProperty("pointer-events", "none", "important");
    }

    const result =
      document.getElementById("compoundResult") ||
      document.getElementById("result");

    if (result) {
      result.style.display = "none";
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.setAttribute("readonly", "");

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(copied).catch(function () {
        fallbackCopy(value);
        copied();
      });
    } else {
      fallbackCopy(value);
      copied();
    }
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

  function renderCompoundYearMatrix() {
    if (!isCompoundPage()) return;

    document.body.classList.add("compound-page");
    document.body.dataset.page = "compound";

    const principal = getNumber(["principal", "compoundPrincipal", "amount"]);
    const rate = getNumber(["rate", "compoundRate", "interest", "interestRate"]);
    const years = getNumber(["years", "compoundYears", "time"]);
    const frequencyRaw = getValue(["frequency", "compoundFrequency"]);
    const frequency = Number(frequencyRaw) || 1;

    const result =
      document.getElementById("compoundResult") ||
      document.getElementById("result");

    const panel = getPanel();
    if (!panel) return;

    if (
      !Number.isFinite(principal) ||
      !Number.isFinite(rate) ||
      !Number.isFinite(years) ||
      principal <= 0 ||
      rate < 0 ||
      years <= 0 ||
      frequency <= 0
    ) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid compound interest details.";
      }

      panel.hidden = true;
      return;
    }

    const yearPoints = buildYearPoints(years);

    const values = yearPoints.map(function (year) {
      const futureValue = principal * Math.pow(1 + rate / 100 / frequency, frequency * year);
      const previousYear = Math.max(0, year - 1);
      const previousValue = principal * Math.pow(1 + rate / 100 / frequency, frequency * previousYear);

      return {
        year: year,
        principal: principal,
        interestThisYear: futureValue - previousValue,
        totalInterest: futureValue - principal,
        futureValue: futureValue
      };
    });

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

    const finalValue = values.length ? values[values.length - 1].futureValue : principal;
    const finalInterest = finalValue - principal;

    const copyValue =
      "Item\t" + values.map(function (item) { return "Year " + item.year; }).join("\t") + "\n" +
      "Principal\t" + values.map(function (item) { return money(item.principal); }).join("\t") + "\n" +
      "Interest this year\t" + values.map(function (item) { return money(item.interestThisYear); }).join("\t") + "\n" +
      "Total interest\t" + values.map(function (item) { return money(item.totalInterest); }).join("\t") + "\n" +
      "Future value\t" + values.map(function (item) { return money(item.futureValue); }).join("\t");

    panel.hidden = false;

    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel compound-year-result-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +

          '<div class="compound-summary-row">' +
            '<div class="compound-summary-card">' +
              '<span>Future value</span>' +
              '<strong>' + money(finalValue) + '</strong>' +
            '</div>' +

            '<div class="compound-summary-card">' +
              '<span>Compound interest</span>' +
              '<strong>' + money(finalInterest) + '</strong>' +
            '</div>' +

            '<div class="compound-summary-card">' +
              '<span>Principal</span>' +
              '<strong>' + money(principal) + '</strong>' +
            '</div>' +
          '</div>' +

          '<div class="loan-result-body compound-year-table-body">' +
            '<div class="compound-year-table-box">' +
              '<h3>Compound interest by year</h3>' +

              '<div class="compound-year-table-scroll">' +
                '<table class="compound-year-matrix-table">' +
                  '<thead>' +
                    '<tr>' +
                      '<th>Item</th>' +
                      headers +
                    '</tr>' +
                  '</thead>' +
                  '<tbody>' +
                    row("Principal", "principal") +
                    row("Interest this year", "interestThisYear") +
                    row("Total interest", "totalInterest") +
                    row("Future value", "futureValue") +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="loan-copy-side">' +
          '<button type="button" class="loan-copy-btn">Copy</button>' +
        '</div>' +
      '</div>';

    hideOldCompoundOutputs();

    const copyBtn = panel.querySelector(".loan-copy-btn");
    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyText(copyValue, copyBtn);
      };
    }
  }

  function start() {
    if (!isCompoundPage()) return;

    window.calculateCompound = renderCompoundYearMatrix;
    window.calculateCompoundInterest = renderCompoundYearMatrix;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateCompound")) {
          setTimeout(renderCompoundYearMatrix, 0);
          setTimeout(renderCompoundYearMatrix, 250);
          setTimeout(renderCompoundYearMatrix, 700);
          setTimeout(renderCompoundYearMatrix, 1200);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(renderCompoundYearMatrix, 250);
          setTimeout(renderCompoundYearMatrix, 700);
        }
      },
      true
    );

    setTimeout(hideOldCompoundOutputs, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   COMPOUND INTEREST: Monthly / Weekly / Daily additional money
   - Adds optional additional money input
   - Adds contribution frequency: monthly / weekly / daily
   - Replaces old compound result table
   - New table: item row vs year column
===================================================== */
(function () {
  "use strict";

  const PANEL_ID = "compoundYearMatrixOutput";

  function isCompoundPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("compound-page") ||
      document.body.dataset.page === "compound" ||
      title.includes("compound") ||
      window.location.pathname.includes("compound-interest-calculator") ||
      !!document.getElementById("compoundResult")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());
      if (Number.isFinite(value)) return value;
    }

    return NaN;
  }

  function getValue(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = String(input.value || "").trim();
      if (value) return value;
    }

    return "";
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function getCompoundingPerYear(value) {
    const text = String(value || "").trim().toLowerCase();

    if (text === "daily") return 365;
    if (text === "weekly") return 52;
    if (text === "monthly") return 12;
    if (text === "quarterly") return 4;
    if (text === "yearly" || text === "annually" || text === "annual") return 1;

    const number = Number(text);
    return Number.isFinite(number) && number > 0 ? number : 1;
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

  function ensureAdditionalMoneyInputs() {
    if (!isCompoundPage()) return;

    const calculator = document.querySelector(".calculator");
    if (!calculator) return;

    const calculateBtn =
      calculator.querySelector("button.main-btn") ||
      Array.from(calculator.querySelectorAll("button")).find(function (button) {
        return button.textContent.trim().toLowerCase().includes("calculate");
      });

    if (!calculateBtn) return;

    if (!document.getElementById("additionalMoney")) {
      const label = document.createElement("label");
      label.setAttribute("for", "additionalMoney");
      label.textContent = "Additional money:";

      const input = document.createElement("input");
      input.type = "number";
      input.id = "additionalMoney";
      input.placeholder = "Optional, example: 100";
      input.setAttribute("inputmode", "decimal");

      calculateBtn.insertAdjacentElement("beforebegin", input);
      input.insertAdjacentElement("beforebegin", label);
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

      calculateBtn.insertAdjacentElement("beforebegin", select);
      select.insertAdjacentElement("beforebegin", label);
    }
  }

  function getPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById(PANEL_ID);

    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.className = "loan-style-output-panel compound-year-matrix-output";
      panel.setAttribute("aria-label", "Compound interest result table");

      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function hideOldCompoundOutputs() {
    const universal = document.getElementById("universalLoanStyleOutput");

    if (universal) {
      universal.hidden = true;
      universal.style.setProperty("display", "none", "important");
      universal.style.setProperty("visibility", "hidden", "important");
      universal.style.setProperty("pointer-events", "none", "important");
    }

    const result =
      document.getElementById("compoundResult") ||
      document.getElementById("result");

    if (result) {
      result.style.display = "none";
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.setAttribute("readonly", "");

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(copied).catch(function () {
        fallbackCopy(value);
        copied();
      });
    } else {
      fallbackCopy(value);
      copied();
    }
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

  function calculateYearValue(principal, annualRate, compoundPerYear, year, contribution, contributionPerYear) {
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

  function renderCompoundWithContributionFrequency() {
    if (!isCompoundPage()) return;

    document.body.classList.add("compound-page");
    document.body.dataset.page = "compound";

    ensureAdditionalMoneyInputs();

    const principal = getNumber(["principal", "compoundPrincipal", "amount"]);
    const rate = getNumber(["rate", "compoundRate", "interest", "interestRate"]);
    const years = getNumber(["years", "compoundYears", "time"]);

    const frequencyRaw = getValue(["frequency", "compoundFrequency"]);
    const compoundPerYear = getCompoundingPerYear(frequencyRaw);

    const additionalRaw = getNumber(["additionalMoney"]);
    const additionalMoney =
      Number.isFinite(additionalRaw) && additionalRaw > 0
        ? additionalRaw
        : 0;

    const contributionFrequency = getValue(["additionalMoneyFrequency"]) || "monthly";
    const contributionPerYear = getContributionPerYear(contributionFrequency);
    const contributionLabel = getContributionLabel(contributionFrequency);

    const result =
      document.getElementById("compoundResult") ||
      document.getElementById("result");

    const panel = getPanel();
    if (!panel) return;

    if (
      !Number.isFinite(principal) ||
      !Number.isFinite(rate) ||
      !Number.isFinite(years) ||
      principal <= 0 ||
      rate < 0 ||
      years <= 0 ||
      compoundPerYear <= 0
    ) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid compound interest details.";
      }

      panel.hidden = true;
      return;
    }

    const yearPoints = buildYearPoints(years);

    const values = yearPoints.map(function (year) {
      return calculateYearValue(
        principal,
        rate,
        compoundPerYear,
        year,
        additionalMoney,
        contributionPerYear
      );
    });

    const finalItem = values[values.length - 1];
    const finalValue = finalItem ? finalItem.futureValue : principal;
    const finalInterest = finalItem ? finalItem.interestEarned : 0;
    const finalTotalAdded = finalItem ? finalItem.totalMoneyAdded : principal;

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

    const copyValue =
      "Additional money: " + money(additionalMoney) + " " + contributionLabel.toLowerCase() + "\n\n" +
      "Item\t" + values.map(function (item) { return "Year " + item.year; }).join("\t") + "\n" +
      "Principal\t" + values.map(function (item) { return money(item.principal); }).join("\t") + "\n" +
      "Additional money\t" + values.map(function (item) { return money(item.additionalMoney); }).join("\t") + "\n" +
      "Total money added\t" + values.map(function (item) { return money(item.totalMoneyAdded); }).join("\t") + "\n" +
      "Interest earned\t" + values.map(function (item) { return money(item.interestEarned); }).join("\t") + "\n" +
      "Future value\t" + values.map(function (item) { return money(item.futureValue); }).join("\t");

    panel.hidden = false;

    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel compound-year-result-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +

          '<div class="compound-summary-row">' +
            '<div class="compound-summary-card">' +
              '<span>Future value</span>' +
              '<strong>' + money(finalValue) + '</strong>' +
            '</div>' +

            '<div class="compound-summary-card">' +
              '<span>Interest earned</span>' +
              '<strong>' + money(finalInterest) + '</strong>' +
            '</div>' +

            '<div class="compound-summary-card">' +
              '<span>Total money added</span>' +
              '<strong>' + money(finalTotalAdded) + '</strong>' +
            '</div>' +
          '</div>' +

          '<p class="compound-contribution-note">' +
            '<strong>Additional money:</strong> ' + money(additionalMoney) + ' ' + contributionLabel.toLowerCase() +
          '</p>' +

          '<div class="loan-result-body compound-year-table-body">' +
            '<div class="compound-year-table-box">' +
              '<h3>Compound interest by year</h3>' +

              '<div class="compound-year-table-scroll">' +
                '<table class="compound-year-matrix-table">' +
                  '<thead>' +
                    '<tr>' +
                      '<th>Item</th>' +
                      headers +
                    '</tr>' +
                  '</thead>' +
                  '<tbody>' +
                    row("Principal", "principal") +
                    row("Additional money", "additionalMoney") +
                    row("Total money added", "totalMoneyAdded") +
                    row("Interest earned", "interestEarned") +
                    row("Future value", "futureValue") +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="loan-copy-side">' +
          '<button type="button" class="loan-copy-btn">Copy</button>' +
        '</div>' +
      '</div>';

    hideOldCompoundOutputs();

    const copyBtn = panel.querySelector(".loan-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyText(copyValue, copyBtn);
      };
    }
  }

  function start() {
    if (!isCompoundPage()) return;

    ensureAdditionalMoneyInputs();

    window.calculateCompound = renderCompoundWithContributionFrequency;
    window.calculateCompoundInterest = renderCompoundWithContributionFrequency;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateCompound")) {
          setTimeout(renderCompoundWithContributionFrequency, 0);
          setTimeout(renderCompoundWithContributionFrequency, 250);
          setTimeout(renderCompoundWithContributionFrequency, 700);
          setTimeout(renderCompoundWithContributionFrequency, 1300);
          setTimeout(renderCompoundWithContributionFrequency, 1800);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(renderCompoundWithContributionFrequency, 250);
          setTimeout(renderCompoundWithContributionFrequency, 700);
          setTimeout(renderCompoundWithContributionFrequency, 1300);
        }
      },
      true
    );

    setTimeout(ensureAdditionalMoneyInputs, 300);
    setTimeout(hideOldCompoundOutputs, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   MORTGAGE RESULT SUMMARY: Total interest + Total payment
   - Changes "Monthly interest" to "Total interest"
   - Changes "Yearly payment" to "Total payment"
   - Reads final values from the result table
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      window.location.pathname.includes("loan-calculator") ||
      !!document.getElementById("loanResult")
    );
  }

  function updateMortgageSummaryCards() {
    if (!isLoanPage()) return;

    const panel = document.getElementById("loanExternalOutput");
    if (!panel) return;

    const cards = panel.querySelectorAll(".mortgage-summary-card");
    const table = panel.querySelector(".mortgage-important-table");
    if (cards.length < 3 || !table) return;

    const bodyRows = table.querySelectorAll("tbody tr");
    if (!bodyRows.length) return;

    const lastRow = bodyRows[bodyRows.length - 1];
    const cells = lastRow.querySelectorAll("td");

    /*
      Current table columns:
      0 = Year / Month
      1 = Principal paid
      2 = Interest paid
      3 = Total payment
      4 = Total interest
      5 = Remaining balance
    */
    const totalPayment = cells[3] ? cells[3].textContent.trim() : "";
    const totalInterest = cells[4] ? cells[4].textContent.trim() : "";

    const secondLabel = cards[1].querySelector("span");
    const secondValue = cards[1].querySelector("strong");

    const thirdLabel = cards[2].querySelector("span");
    const thirdValue = cards[2].querySelector("strong");

    if (secondLabel) secondLabel.textContent = "Total interest";
    if (secondValue && totalInterest) secondValue.textContent = totalInterest;

    if (thirdLabel) thirdLabel.textContent = "Total payment";
    if (thirdValue && totalPayment) thirdValue.textContent = totalPayment;

    const copyBtn = panel.querySelector(".loan-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        const summaryText =
          "Monthly payment: " + (cards[0].querySelector("strong")?.textContent.trim() || "") + "\n" +
          "Total interest: " + totalInterest + "\n" +
          "Total payment: " + totalPayment + "\n\n";

        const tableText = Array.from(table.querySelectorAll("tr"))
          .map(function (row) {
            return Array.from(row.querySelectorAll("th, td"))
              .map(function (cell) {
                return cell.textContent.trim();
              })
              .join("\t");
          })
          .join("\n");

        const copyValue = summaryText + tableText;

        function copied() {
          const old = copyBtn.textContent;
          copyBtn.textContent = "Copied!";

          setTimeout(function () {
            copyBtn.textContent = old;
          }, 1000);
        }

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(copyValue).then(copied);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = copyValue;
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          textarea.style.top = "-9999px";

          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand("copy");
          textarea.remove();

          copied();
        }
      };
    }
  }

  function runAfterCalculate() {
    setTimeout(updateMortgageSummaryCards, 0);
    setTimeout(updateMortgageSummaryCards, 250);
    setTimeout(updateMortgageSummaryCards, 700);
    setTimeout(updateMortgageSummaryCards, 1200);
  }

  function start() {
    if (!isLoanPage()) return;

    runAfterCalculate();

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateLoan")) {
          runAfterCalculate();
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          runAfterCalculate();
        }
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   MORTGAGE: Optional early settlement box beside Optional costs
   - Adds:
     Extra monthly payment
     One-time extra payment
     One-time payment after month
   - Creates a separate expandable box
   - No MutationObserver, no loading loop
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      window.location.pathname.includes("loan-calculator") ||
      !!document.getElementById("loanResult")
    );
  }

  function findCalculateButton() {
    const calculator = document.querySelector(".calculator");
    if (!calculator) return null;

    return (
      calculator.querySelector("button.main-btn") ||
      Array.from(calculator.querySelectorAll("button")).find(function (button) {
        return button.textContent.trim().toLowerCase().includes("calculate");
      }) ||
      null
    );
  }

  function ensureOptionalRow() {
    const calculator = document.querySelector(".calculator");
    const calculateBtn = findCalculateButton();

    if (!calculator || !calculateBtn) return null;

    let row = document.querySelector(".loan-optional-row");

    if (!row) {
      row = document.createElement("div");
      row.className = "loan-optional-row";
      calculateBtn.insertAdjacentElement("beforebegin", row);
    }

    return row;
  }

  function ensureOptionalCostInsideRow(row) {
    let optionalCostBox = document.querySelector(".optional-mortgage-costs");

    if (!optionalCostBox) {
      optionalCostBox = document.createElement("div");
      optionalCostBox.className = "optional-mortgage-costs";
      optionalCostBox.innerHTML =
        '<button type="button" class="optional-mortgage-toggle" aria-expanded="false">Optional costs</button>' +
        '<div class="optional-mortgage-content" hidden></div>';
    }

    if (optionalCostBox.parentElement !== row) {
      row.appendChild(optionalCostBox);
    }

    return optionalCostBox;
  }

  function ensureEarlySettlementBox(row) {
    let box = document.querySelector(".early-settlement-box");

    if (!box) {
      box = document.createElement("div");
      box.className = "early-settlement-box";

      box.innerHTML =
        '<button type="button" class="early-settlement-toggle" aria-expanded="false">Optional early settlement</button>' +
        '<div class="early-settlement-content" hidden>' +

          '<label for="extraMonthlyPayment">Extra monthly payment:</label>' +
          '<input type="number" id="extraMonthlyPayment" placeholder="Optional, example: 200" inputmode="decimal">' +

          '<label for="oneTimeExtraPayment">One-time extra payment:</label>' +
          '<input type="number" id="oneTimeExtraPayment" placeholder="Optional, example: 5000" inputmode="decimal">' +

          '<label for="oneTimePaymentMonth">One-time payment after month:</label>' +
          '<input type="number" id="oneTimePaymentMonth" placeholder="Optional, example: 24" inputmode="decimal">' +

        '</div>';
    }

    if (box.parentElement !== row) {
      row.appendChild(box);
    }

    return box;
  }

  function setupToggle(buttonSelector, contentSelector) {
    const button = document.querySelector(buttonSelector);
    const content = document.querySelector(contentSelector);

    if (!button || !content) return;
    if (button.dataset.toggleReady === "true") return;

    button.dataset.toggleReady = "true";

    button.addEventListener("click", function (event) {
      event.preventDefault();

      const isHidden = content.hidden || content.style.display === "none";

      content.hidden = !isHidden;
      content.style.display = isHidden ? "block" : "none";
      button.setAttribute("aria-expanded", isHidden ? "true" : "false");
    });
  }

  function fixDuplicateEarlySettlementInputs() {
    const ids = [
      "extraMonthlyPayment",
      "oneTimeExtraPayment",
      "oneTimePaymentMonth"
    ];

    ids.forEach(function (id) {
      const items = Array.from(document.querySelectorAll("#" + id));

      items.slice(1).forEach(function (input) {
        const label = document.querySelector('label[for="' + id + '"]');
        if (label && label.parentElement === input.parentElement) {
          label.remove();
        }

        input.remove();
      });
    });
  }

  function addEarlySettlementBox() {
    if (!isLoanPage()) return;

    const row = ensureOptionalRow();
    if (!row) return;

    ensureOptionalCostInsideRow(row);
    ensureEarlySettlementBox(row);

    setupToggle(".optional-mortgage-toggle", ".optional-mortgage-content");
    setupToggle(".early-settlement-toggle", ".early-settlement-content");

    fixDuplicateEarlySettlementInputs();
  }

  function start() {
    addEarlySettlementBox();

    setTimeout(addEarlySettlementBox, 200);
    setTimeout(addEarlySettlementBox, 700);
    setTimeout(addEarlySettlementBox, 1400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   MORTGAGE EARLY SETTLEMENT:
   - Change "One-time payment after month" to "Yearly lump sum"
   - Include early settlement values in calculation
   - Extra monthly payment = paid every month
   - One-time extra payment = paid once in month 1
   - Yearly lump sum = paid every 12th month
   - Stops table when loan is fully settled
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      window.location.pathname.includes("loan-calculator") ||
      !!document.getElementById("loanResult")
    );
  }

  function getNumber(ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = Number(String(input.value || "").replace(/,/g, "").trim());
      if (Number.isFinite(value)) return value;
    }

    return NaN;
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function positive(value) {
    return Number.isFinite(value) && value > 0 ? value : 0;
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
    const propertyTaxYearly = getNumber(["propertyTaxYearly"]);
    const insuranceYearly = getNumber(["homeInsuranceYearly"]);
    const otherMonthly = getNumber(["otherMonthlyFees", "hoaMonthly"]);

    return (
      positive(propertyTaxYearly) / 12 +
      positive(insuranceYearly) / 12 +
      positive(otherMonthly)
    );
  }

  function getLoanPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById("loanExternalOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "loanExternalOutput";
      panel.className = "loan-external-output";
      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function relabelYearlyLumpSumInput() {
    if (!isLoanPage()) return;

    const oldInput = document.getElementById("oneTimePaymentMonth");
    const newInput = document.getElementById("yearlyLumpSumPayment");

    if (oldInput && !newInput) {
      oldInput.id = "yearlyLumpSumPayment";
      oldInput.placeholder = "Optional, example: 5000";

      const oldLabel =
        document.querySelector('label[for="oneTimePaymentMonth"]') ||
        oldInput.previousElementSibling;

      if (oldLabel && oldLabel.tagName && oldLabel.tagName.toLowerCase() === "label") {
        oldLabel.setAttribute("for", "yearlyLumpSumPayment");
        oldLabel.textContent = "Yearly lump sum:";
      }
    }

    const finalInput = document.getElementById("yearlyLumpSumPayment");
    const finalLabel = document.querySelector('label[for="yearlyLumpSumPayment"]');

    if (finalInput) {
      finalInput.placeholder = "Optional, example: 5000";
      finalInput.setAttribute("inputmode", "decimal");
    }

    if (finalLabel) {
      finalLabel.textContent = "Yearly lump sum:";
    }
  }

  function hideOldLoanOutputs() {
    const result = document.getElementById("loanResult") || document.getElementById("result");

    if (result) {
      result.style.display = "none";
    }

    const universal = document.getElementById("universalLoanStyleOutput");

    if (universal) {
      universal.hidden = true;
      universal.style.setProperty("display", "none", "important");
      universal.style.setProperty("visibility", "hidden", "important");
      universal.style.setProperty("pointer-events", "none", "important");
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.setAttribute("readonly", "");

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(copied).catch(function () {
        fallbackCopy(value);
        copied();
      });
    } else {
      fallbackCopy(value);
      copied();
    }
  }

  function buildEarlySettlementMonthlyRows(amountBorrowed, annualRate, months, normalMonthlyPayment, optionalMonthlyCost, extraMonthlyPayment, oneTimeExtraPayment, yearlyLumpSum) {
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

      if (month === 1) {
        extraThisMonth += oneTimeExtraPayment;
      }

      if (month % 12 === 0) {
        extraThisMonth += yearlyLumpSum;
      }

      let principalThisMonth = normalPrincipal + extraThisMonth;

      if (principalThisMonth > balance) {
        principalThisMonth = balance;
      }

      balance -= principalThisMonth;

      if (balance < 0.01) {
        balance = 0;
      }

      const actualPaymentThisMonth =
        principalThisMonth + interestThisMonth + optionalMonthlyCost;

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

  function groupRowsByYear(monthRows) {
    const yearRows = [];

    for (let i = 0; i < monthRows.length; i += 12) {
      const group = monthRows.slice(i, i + 12);
      const last = group[group.length - 1];

      yearRows.push({
        label: yearRows.length + 1,
        principalPaid: group.reduce(function (sum, row) {
          return sum + row.principalPaid;
        }, 0),
        interestPaid: group.reduce(function (sum, row) {
          return sum + row.interestPaid;
        }, 0),
        totalPayment: last.totalPayment,
        totalInterestPaid: last.totalInterestPaid,
        remainingBalance: last.remainingBalance
      });
    }

    return yearRows;
  }

  function renderMortgageWithYearlyLumpSum() {
    if (!isLoanPage()) return;

    relabelYearlyLumpSumInput();

    const purchasePrice = getNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = getNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const months = getNumber(["years", "loanYears", "loanTerm", "term"]);
    const downPayment = positive(getNumber(["downPayment", "loanDownPayment"]));

    const extraMonthlyPayment = positive(getNumber(["extraMonthlyPayment"]));
    const oneTimeExtraPayment = positive(getNumber(["oneTimeExtraPayment"]));
    const yearlyLumpSum = positive(getNumber(["yearlyLumpSumPayment", "oneTimePaymentMonth"]));

    const result = document.getElementById("loanResult") || document.getElementById("result");
    const panel = getLoanPanel();

    if (!panel) return;

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(annualRate) ||
      !Number.isFinite(months) ||
      purchasePrice <= 0 ||
      annualRate < 0 ||
      months <= 0
    ) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid loan details.";
      }

      panel.hidden = true;
      return;
    }

    if (downPayment >= purchasePrice) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Down payment must be less than the loan amount / purchase price.";
      }

      panel.hidden = true;
      return;
    }

    const amountBorrowed = purchasePrice - downPayment;
    const optionalMonthlyCost = getOptionalMonthlyCost();

    const normalMonthlyPayment = calculateNormalMonthlyPayment(
      amountBorrowed,
      annualRate,
      months
    );

    const monthlyRows = buildEarlySettlementMonthlyRows(
      amountBorrowed,
      annualRate,
      months,
      normalMonthlyPayment,
      optionalMonthlyCost,
      extraMonthlyPayment,
      oneTimeExtraPayment,
      yearlyLumpSum
    );

    const useMonthlyTable = months < 13;
    const rows = useMonthlyTable ? monthlyRows.map(function (row) {
      return {
        label: row.month,
        principalPaid: row.principalPaid,
        interestPaid: row.interestPaid,
        totalPayment: row.totalPayment,
        totalInterestPaid: row.totalInterestPaid,
        remainingBalance: row.remainingBalance
      };
    }) : groupRowsByYear(monthlyRows);

    const finalRow = monthlyRows[monthlyRows.length - 1];
    const totalInterest = finalRow ? finalRow.totalInterestPaid : 0;
    const totalPayment = finalRow ? finalRow.totalPayment : 0;
    const settlementMonths = monthlyRows.length;

    const firstColumnTitle = useMonthlyTable ? "Month" : "Year";
    const tableTitle = useMonthlyTable ? "Mortgage monthly table" : "Mortgage yearly table";

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

    const settlementText =
      settlementMonths < months
        ? '<p class="mortgage-settlement-note"><strong>Settled after:</strong> ' + settlementMonths + ' months</p>'
        : "";

    const copyValue =
      "Monthly payment: " + money(normalMonthlyPayment + optionalMonthlyCost) + "\n" +
      "Total interest: " + money(totalInterest) + "\n" +
      "Total payment: " + money(totalPayment) + "\n" +
      "Extra monthly payment: " + money(extraMonthlyPayment) + "\n" +
      "One-time extra payment: " + money(oneTimeExtraPayment) + "\n" +
      "Yearly lump sum: " + money(yearlyLumpSum) + "\n" +
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

    panel.hidden = false;

    panel.innerHTML =
      '<div class="loan-output-top">' +
        '<div class="loan-result-panel mortgage-table-only-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +

          '<div class="mortgage-summary-row">' +
            '<div class="mortgage-summary-card">' +
              '<span>Monthly payment</span>' +
              '<strong>' + money(normalMonthlyPayment + optionalMonthlyCost) + '</strong>' +
            '</div>' +

            '<div class="mortgage-summary-card">' +
              '<span>Total interest</span>' +
              '<strong>' + money(totalInterest) + '</strong>' +
            '</div>' +

            '<div class="mortgage-summary-card">' +
              '<span>Total payment</span>' +
              '<strong>' + money(totalPayment) + '</strong>' +
            '</div>' +
          '</div>' +

          settlementText +

          '<div class="loan-result-body mortgage-result-table-only">' +
            '<div class="mortgage-year-table-box mortgage-single-table-box">' +
              '<h3>' + tableTitle + '</h3>' +

              '<div class="mortgage-year-table-scroll">' +
                '<table class="mortgage-year-table mortgage-important-table">' +
                  '<thead>' +
                    '<tr>' +
                      '<th>' + firstColumnTitle + '</th>' +
                      '<th>Principal paid</th>' +
                      '<th>Interest paid</th>' +
                      '<th>Total payment</th>' +
                      '<th>Total interest</th>' +
                      '<th>Remaining balance</th>' +
                    '</tr>' +
                  '</thead>' +
                  '<tbody>' + tableRows + '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="loan-copy-side">' +
          '<button type="button" class="loan-copy-btn">Copy</button>' +
        '</div>' +
      '</div>';

    hideOldLoanOutputs();

    const copyBtn = panel.querySelector(".loan-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyText(copyValue, copyBtn);
      };
    }
  }

  function start() {
    if (!isLoanPage()) return;

    relabelYearlyLumpSumInput();

    window.calculateLoan = renderMortgageWithYearlyLumpSum;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (
          text.includes("optional") ||
          text.includes("calculate") ||
          onclick.includes("calculateLoan")
        ) {
          setTimeout(relabelYearlyLumpSumInput, 0);
          setTimeout(renderMortgageWithYearlyLumpSum, 250);
          setTimeout(renderMortgageWithYearlyLumpSum, 700);
          setTimeout(renderMortgageWithYearlyLumpSum, 1200);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(renderMortgageWithYearlyLumpSum, 250);
          setTimeout(renderMortgageWithYearlyLumpSum, 700);
        }
      },
      true
    );

    setTimeout(relabelYearlyLumpSumInput, 300);
    setTimeout(relabelYearlyLumpSumInput, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

/* =====================================================
   BMI CALCULATOR: SINGLE CLEAN FINAL SYSTEM
   - Replaces old slow overlay BMI blocks
   - One history system only
   - History shows every BMI input
   - Result uses Waist/Height fraction label
   - No MutationObserver
===================================================== */
(function () {
  "use strict";

  const HISTORY_KEY = "bmiCleanHistoryUnifiedV1";
  const UNIT_KEY = "bmiCleanUnitUnifiedV1";
  const MAX_ITEMS = 50;
  const PANEL_ID = "stableBmiOutput";

  function isBmiPage() {
    const title = document.querySelector("h1")
      ? document.querySelector("h1").textContent.trim().toLowerCase()
      : "";

    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      title.includes("bmi") ||
      !!document.getElementById("bmiResult") ||
      !!document.getElementById("bmiHistoryList")
    );
  }

  function getInput(id) {
    return document.getElementById(id);
  }

  function getValue(id) {
    const input = getInput(id);
    return input ? String(input.value || "").trim() : "";
  }

  function getNumber(id) {
    const raw = getValue(id).replace(/,/g, "");
    const number = Number(raw);
    return Number.isFinite(number) ? number : NaN;
  }

  function escapeHTML(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function loadHistory() {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(history) ? history : [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_ITEMS)));
    } catch {
      /* ignore */
    }
  }

  function removeOldBmiStorage() {
    [
      "bmiHistory",
      "inputHistory_bmi",
      "bmiInputHistoryOnlyFinal",
      "bmiInputHistoryFinalCleanV2",
      "bmiCleanInputHistoryFinal",
      "bmiCleanInputHistoryFinalV2",
      "bmiProfileInputHistory",
      "bmiProfileHistory",
      "bmiHistoryWithProfile"
    ].forEach(function (key) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    });
  }

  function getCurrentUnit() {
    const button = getInput("unitToggleBtn");

    if (button && button.dataset.currentUnit) {
      return button.dataset.currentUnit.toLowerCase() === "us" ? "us" : "si";
    }

    const bodyUnit = document.body.dataset.bmiUnit;
    if (bodyUnit) {
      return String(bodyUnit).toLowerCase() === "us" ? "us" : "si";
    }

    try {
      const saved =
        localStorage.getItem(UNIT_KEY) ||
        localStorage.getItem("bmiUnit") ||
        localStorage.getItem("bmiCleanCurrentUnitFinal") ||
        localStorage.getItem("bmiCurrentUnitFinalCleanV2");

      if (saved) {
        return String(saved).toLowerCase() === "us" ? "us" : "si";
      }
    } catch {
      /* ignore */
    }

    return "si";
  }

  function saveCurrentUnit(unit) {
    const clean = unit === "us" ? "us" : "si";

    try {
      localStorage.setItem(UNIT_KEY, clean);
      localStorage.setItem("bmiUnit", clean);
    } catch {
      /* ignore */
    }

    document.body.dataset.bmiUnit = clean;

    const button = getInput("unitToggleBtn");
    if (button) {
      button.dataset.currentUnit = clean;
      button.textContent = clean === "si" ? "SI" : "US";
      button.setAttribute("aria-label", "Current BMI unit: " + (clean === "si" ? "SI" : "US"));
    }

    return clean;
  }

  function unitLabels() {
    if (getCurrentUnit() === "us") {
      return {
        unit: "US",
        weight: "lb",
        height: "in",
        waist: "in"
      };
    }

    return {
      unit: "SI",
      weight: "kg",
      height: "cm",
      waist: "cm"
    };
  }

  function applyUnitUI() {
    const labels = unitLabels();
    const unit = getCurrentUnit();

    const weightLabel = getInput("weightLabel");
    const heightLabel = getInput("heightLabel");
    const waistLabel = getInput("waistLabel");

    if (weightLabel) weightLabel.textContent = "Weight in " + labels.weight + ":";
    if (heightLabel) heightLabel.textContent = unit === "us" ? "Height in inch:" : "Height in cm:";
    if (waistLabel) waistLabel.textContent = "Waist circumference in " + labels.waist + ":";

    const weight = getInput("weight");
    const height = getInput("height");
    const waist = getInput("waist");

    if (unit === "us") {
      if (weight) weight.placeholder = "Example: 154";
      if (height) height.placeholder = "Example: 67";
      if (waist) waist.placeholder = "Optional, Example: 31";
    } else {
      if (weight) weight.placeholder = "Example: 70";
      if (height) height.placeholder = "Example: 170";
      if (waist) waist.placeholder = "Optional, Example: 80";
    }
  }

  function toggleBMIUnitClean() {
    const next = getCurrentUnit() === "us" ? "si" : "us";

    saveCurrentUnit(next);
    applyUnitUI();

    const result = getInput("bmiResult") || getInput("result");
    if (result) result.textContent = "";

    const panel = getInput(PANEL_ID);
    if (panel) panel.hidden = true;
  }

  function ensureProfileBox() {
    const calculator = document.querySelector(".calculator");
    const weightInput = getInput("weight");

    if (!calculator || !weightInput) return;

    let box = document.querySelector(".bmi-extra-profile-box");

    if (!box) {
      box = document.createElement("div");
      box.className = "bmi-extra-profile-box";
      weightInput.insertAdjacentElement("beforebegin", box);
    }

    if (!getInput("bmiAgeGroup")) {
      const label = document.createElement("label");
      label.setAttribute("for", "bmiAgeGroup");
      label.textContent = "Age group:";

      const select = document.createElement("select");
      select.id = "bmiAgeGroup";
      select.innerHTML =
        '<option value="adult">Adult, 20 - 64</option>' +
        '<option value="child">Kid / teen, 2 - 19</option>' +
        '<option value="older">Older adult, 65+</option>';

      box.appendChild(label);
      box.appendChild(select);
    }

    if (!getInput("bmiSex")) {
      const label = document.createElement("label");
      label.setAttribute("for", "bmiSex");
      label.textContent = "Sex:";

      const select = document.createElement("select");
      select.id = "bmiSex";
      select.innerHTML =
        '<option value="male">Male</option>' +
        '<option value="female">Female</option>';

      box.appendChild(label);
      box.appendChild(select);
    } else {
      const sex = getInput("bmiSex");
      const current = String(sex.value || "").toLowerCase();
      sex.innerHTML =
        '<option value="male">Male</option>' +
        '<option value="female">Female</option>';
      sex.value = current === "female" ? "female" : "male";
    }

    if (!getInput("bmiEthnicity")) {
      const label = document.createElement("label");
      label.setAttribute("for", "bmiEthnicity");
      label.textContent = "BMI cut-off:";

      const select = document.createElement("select");
      select.id = "bmiEthnicity";
      select.innerHTML =
        '<option value="standard">Non-Asian / standard adult cut-off</option>' +
        '<option value="asian">Asian adult cut-off</option>';

      box.appendChild(label);
      box.appendChild(select);
    }
  }

  function selectedText(id, fallback) {
    const select = getInput(id);
    if (!select || !select.options || select.selectedIndex < 0) return fallback;

    const option = select.options[select.selectedIndex];
    return option ? option.textContent.trim() : fallback;
  }

  function getProfile() {
    return {
      ageGroup: selectedText("bmiAgeGroup", "Adult, 20 - 64"),
      sex: selectedText("bmiSex", "Male"),
      cutoff: selectedText("bmiEthnicity", "Non-Asian / standard adult cut-off"),
      cutoffValue: getValue("bmiEthnicity") || "standard"
    };
  }

  function standardStatus(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Healthy weight";
    if (bmi < 30) return "Overweight";
    if (bmi < 35) return "Obesity class 1";
    if (bmi < 40) return "Obesity class 2";
    return "Obesity class 3";
  }

  function asianStatus(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 23) return "Normal";
    if (bmi < 27.5) return "Overweight";
    return "Obese";
  }

  function chosenStatus(bmi, profile) {
    if (String(profile.cutoffValue).toLowerCase() === "asian") return asianStatus(bmi);
    return standardStatus(bmi);
  }

  function waistHeightCondition(ratio) {
    if (!Number.isFinite(ratio)) return "-";
    if (ratio < 0.4) return "Below healthy range";
    if (ratio < 0.5) return "Healthy";
    if (ratio < 0.6) return "Increased risk";
    return "High risk";
  }

  function fractionLabelHTML() {
    return (
      '<span class="bmi-waist-height-fraction" aria-label="Waist divided by height">' +
        '<span class="bmi-waist-height-top">Waist</span>' +
        '<span class="bmi-waist-height-line"></span>' +
        '<span class="bmi-waist-height-bottom">Height</span>' +
      '</span> ratio'
    );
  }

  function calculateBmiData() {
    const labels = unitLabels();
    const profile = getProfile();

    const weight = getNumber("weight");
    const height = getNumber("height");
    const waist = getNumber("waist");

    if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
      return null;
    }

    let bmi;
    let heightForHealthyRangeMeters;
    let ratio = NaN;

    if (labels.unit === "US") {
      bmi = 703 * weight / (height * height);
      heightForHealthyRangeMeters = height * 0.0254;

      if (Number.isFinite(waist) && waist > 0) {
        ratio = waist / height;
      }
    } else {
      const heightM = height / 100;
      bmi = weight / (heightM * heightM);
      heightForHealthyRangeMeters = heightM;

      if (Number.isFinite(waist) && waist > 0) {
        ratio = waist / height;
      }
    }

    const status = chosenStatus(bmi, profile);

    let lowBmi = 18.5;
    let highBmi = profile.cutoffValue === "asian" ? 22.9 : 24.9;

    const healthyLowKg = lowBmi * heightForHealthyRangeMeters * heightForHealthyRangeMeters;
    const healthyHighKg = highBmi * heightForHealthyRangeMeters * heightForHealthyRangeMeters;

    const healthyLow = labels.unit === "US" ? healthyLowKg * 2.2046226218 : healthyLowKg;
    const healthyHigh = labels.unit === "US" ? healthyHighKg * 2.2046226218 : healthyHighKg;

    let weightDifference = 0;

    if (weight < healthyLow) {
      weightDifference = healthyLow - weight;
    } else if (weight > healthyHigh) {
      weightDifference = weight - healthyHigh;
    }

    return {
      unit: labels.unit,
      weightUnit: labels.weight,
      heightUnit: labels.height,
      waistUnit: labels.waist,
      weight: weight,
      height: height,
      waist: waist,
      ageGroup: profile.ageGroup,
      sex: profile.sex,
      cutoff: profile.cutoff,
      bmi: bmi,
      status: status,
      healthyLow: healthyLow,
      healthyHigh: healthyHigh,
      weightDifference: weightDifference,
      waistHeightRatio: ratio,
      waistHeightCondition: waistHeightCondition(ratio)
    };
  }

  function historyItem(data) {
    return {
      unit: data.unit,
      ageGroup: data.ageGroup,
      sex: data.sex,
      cutoff: data.cutoff,
      weight: String(data.weight),
      height: String(data.height),
      waist: Number.isFinite(data.waist) && data.waist > 0 ? String(data.waist) : "-",
      weightUnit: data.weightUnit,
      heightUnit: data.heightUnit,
      waistUnit: data.waistUnit
    };
  }

  function historyKey(item) {
    return [
      item.unit,
      item.ageGroup,
      item.sex,
      item.cutoff,
      item.weight,
      item.height,
      item.waist
    ].join("|");
  }

  function addBmiHistory(data) {
    removeOldBmiStorage();

    const item = historyItem(data);
    const history = loadHistory();

    if (!history.length || historyKey(history[history.length - 1]) !== historyKey(item)) {
      history.push(item);
      saveHistory(history);
    }

    renderBmiHistory();
  }

  function renderBmiHistory() {
    if (!isBmiPage()) return;

    const list = getInput("bmiHistoryList");
    if (!list) return;

    const title =
      document.querySelector(".bmi-history-top h3") ||
      document.querySelector(".bmi-history-box h3");

    if (title) title.textContent = "Input";

    list.innerHTML = "";

    loadHistory().slice().reverse().forEach(function (item) {
      const li = document.createElement("li");
      li.className = "history-item bmi-input-history-item";

      const lines = [
        "Unit: " + item.unit,
        "Age group: " + item.ageGroup,
        "Sex: " + item.sex,
        "BMI cut-off: " + item.cutoff,
        "Weight: " + item.weight + " " + item.weightUnit,
        "Height: " + item.height + " " + item.heightUnit,
        "Waist: " + item.waist + (item.waist === "-" ? "" : " " + item.waistUnit)
      ];

      const text = document.createElement("span");
      text.className = "history-text";
      text.innerHTML = lines.map(escapeHTML).join("<br>");

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "history-copy-btn";
      copyBtn.textContent = "copy";

      copyBtn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyText(lines.join("\n"), copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function getResultPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = getInput(PANEL_ID);

    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.className = "stable-result-output bmi-point-output";
      panel.setAttribute("aria-label", "BMI calculator result");

      panel.innerHTML =
        '<div class="stable-result-top">' +
          '<div class="stable-result-panel">' +
            '<h2 class="stable-result-title">Result</h2>' +
            '<div class="stable-result-body"></div>' +
          '</div>' +
          '<div class="stable-copy-side">' +
            '<button type="button" class="stable-copy-btn">Copy</button>' +
          '</div>' +
        '</div>';

      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function hideOldBmiOutputs() {
    const universal = getInput("universalLoanStyleOutput");

    if (universal) {
      universal.hidden = true;
      universal.style.setProperty("display", "none", "important");
      universal.style.setProperty("visibility", "hidden", "important");
      universal.style.setProperty("pointer-events", "none", "important");
    }

    const result = getInput("bmiResult") || getInput("result");

    if (result) {
      result.style.display = "none";
    }
  }

  function renderBmiResult(data) {
    const panel = getResultPanel();
    if (!panel) return;

    const body = panel.querySelector(".stable-result-body");
    const copyBtn = panel.querySelector(".stable-copy-btn");

    const hasWaist = Number.isFinite(data.waistHeightRatio);

    const ratioHTML = hasWaist ? data.waistHeightRatio.toFixed(2) : "-";
    const ratioText = hasWaist ? data.waistHeightRatio.toFixed(2) : "-";

    const items = [
      ["BMI", data.bmi.toFixed(2)],
      ["BMI status", data.status],
      ["Age group", data.ageGroup],
      ["Sex", data.sex],
      ["BMI cut-off", data.cutoff],
      ["Healthy weight range", money(data.healthyLow) + " - " + money(data.healthyHigh) + " " + data.weightUnit],
      ["Weight difference", data.weightDifference > 0 ? money(data.weightDifference) + " " + data.weightUnit : "Inside healthy range"],
      ["__FRACTION__", ratioHTML],
      ["Waist/height condition", data.waistHeightCondition]
    ];

    if (body) {
      body.innerHTML =
        '<ul class="bmi-point-result bmi-detailed-result">' +
          items.map(function (item) {
            if (item[0] === "__FRACTION__") {
              return '<li><strong>' + fractionLabelHTML() + ':</strong> ' + escapeHTML(item[1]) + '</li>';
            }

            return '<li><strong>' + escapeHTML(item[0]) + ':</strong> ' + escapeHTML(item[1]) + '</li>';
          }).join("") +
        '</ul>';
    }

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        const copyValue =
          "• BMI: " + data.bmi.toFixed(2) + "\n" +
          "• BMI status: " + data.status + "\n" +
          "• Age group: " + data.ageGroup + "\n" +
          "• Sex: " + data.sex + "\n" +
          "• BMI cut-off: " + data.cutoff + "\n" +
          "• Healthy weight range: " + money(data.healthyLow) + " - " + money(data.healthyHigh) + " " + data.weightUnit + "\n" +
          "• Weight difference: " + (data.weightDifference > 0 ? money(data.weightDifference) + " " + data.weightUnit : "Inside healthy range") + "\n" +
          "• Waist/height ratio: " + ratioText + "\n" +
          "• Waist/height condition: " + data.waistHeightCondition;

        copyText(copyValue, copyBtn);
      };
    }

    panel.hidden = false;
    panel.style.removeProperty("display");
    hideOldBmiOutputs();
  }

  function calculateBmiClean() {
    if (!isBmiPage()) return;

    ensureProfileBox();
    applyUnitUI();

    const result = getInput("bmiResult") || getInput("result");
    const data = calculateBmiData();
    const panel = getInput(PANEL_ID);

    if (!data) {
      if (result) {
        result.style.display = "block";
        result.textContent = "Please enter valid BMI details.";
      }

      if (panel) panel.hidden = true;
      return;
    }

    addBmiHistory(data);
    renderBmiResult(data);
  }

  function clearBmiHistoryClean() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }

    removeOldBmiStorage();
    renderBmiHistory();

    const panel = getInput(PANEL_ID);
    if (panel) panel.hidden = true;

    const result = getInput("bmiResult") || getInput("result");
    if (result) result.textContent = "";
  }

  function startBmiCleanSystem() {
    if (!isBmiPage()) return;

    document.body.classList.add("bmi-page");
    document.body.dataset.page = "bmi";

    saveCurrentUnit(getCurrentUnit());
    ensureProfileBox();
    applyUnitUI();
    removeOldBmiStorage();
    renderBmiHistory();
    hideOldBmiOutputs();

    window.calculateBMI = calculateBmiClean;
    window.calculateBmi = calculateBmiClean;
    window.toggleBMIUnit = toggleBMIUnitClean;
    window.clearBMIHistory = clearBmiHistoryClean;
    window.clearBmiHistory = clearBmiHistoryClean;

    const unitButton = getInput("unitToggleBtn");
    if (unitButton && unitButton.dataset.bmiCleanToggleReady !== "true") {
      unitButton.dataset.bmiCleanToggleReady = "true";
      unitButton.onclick = function (event) {
        event.preventDefault();
        toggleBMIUnitClean();
      };
    }

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate bmi") || onclick.includes("calculateBMI")) {
          setTimeout(calculateBmiClean, 0);
        }

        if (text.includes("clear")) {
          setTimeout(clearBmiHistoryClean, 0);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(calculateBmiClean, 0);
        }
      },
      true
    );

    ["bmiAgeGroup", "bmiSex", "bmiEthnicity"].forEach(function (id) {
      const select = getInput(id);
      if (select && select.dataset.bmiCleanChangeReady !== "true") {
        select.dataset.bmiCleanChangeReady = "true";
        select.addEventListener("change", function () {
          renderBmiHistory();
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBmiCleanSystem);
  } else {
    startBmiCleanSystem();
  }
})();

