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
        what: "It estimates monthly loan payment, total payment, and total interest.",
        how: "Enter loan amount, annual interest rate, and loan years. Then press calculate loan.",
        formula: "Monthly Payment = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1).",
        example: "A 10,000 loan at 5% yearly for 5 years gives an estimated monthly payment using the amortization formula.",
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

    if (type === "loan" || type === "age" || type === "basic") return;

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
          if (type !== "basic" && type !== "age") {
            addInputHistory(type);
          }

          if (type !== "age") {
            renderUniversalLoanStyleResult();
          }
        }, 150);

        if (type !== "age") {
          setTimeout(renderUniversalLoanStyleResult, 400);
        }
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;

      setTimeout(function () {
        const type = getPageType();

        if (type !== "basic" && type !== "age") {
          addInputHistory(type);
        }

        if (type !== "age") {
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
/* =====================================================
   BMI CALCULATOR: FINAL CLEAN UNIT + HISTORY + RESULT FIX
   - Uses the SI/US toggle button state
   - Stops guessing US from height > 3
   - History box shows input only with correct units
   - Result box shows point form:
     BMI / BMI status / W/H ratio / Condition
===================================================== */
(function () {
  "use strict";

  const HISTORY_KEY = "bmiInputHistoryFinalCleanV2";
  const UNIT_KEY = "bmiCurrentUnitFinalCleanV2";
  const MAX_ITEMS = 50;
  const PANEL_ID = "stableBmiOutput";

  function isBmiPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      title.includes("bmi") ||
      !!document.getElementById("bmiHistoryList") ||
      !!document.getElementById("bmiResult")
    );
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function getNumber(ids) {
    for (const id of ids) {
      const raw = getValue(id).replace(/,/g, "");
      const num = Number(raw);

      if (Number.isFinite(num)) return num;
    }

    return NaN;
  }

  function cleanUnit(value) {
    const text = String(value || "").trim().toUpperCase();

    if (text === "US" || text === "IMPERIAL") return "US";
    if (text === "SI" || text === "METRIC") return "SI";

    return "";
  }

  function getSavedUnit() {
    try {
      return localStorage.getItem(UNIT_KEY) === "US" ? "US" : "SI";
    } catch {
      return "SI";
    }
  }

  function saveUnit(unit) {
    const clean = unit === "US" ? "US" : "SI";

    try {
      localStorage.setItem(UNIT_KEY, clean);
    } catch {
      /* ignore */
    }

    document.body.dataset.bmiUnit = clean.toLowerCase();

    const btn = document.getElementById("unitToggleBtn");
    if (btn) {
      btn.dataset.currentUnit = clean;
    }

    return clean;
  }

  function getLabelTextForInput(id) {
    const input = document.getElementById(id);
    if (!input) return "";

    const label =
      document.querySelector('label[for="' + id + '"]') ||
      input.closest("label");

    const placeholder = input.getAttribute("placeholder") || "";

    return (
      (label ? label.textContent : "") + " " +
      placeholder + " " +
      input.name + " " +
      input.id
    ).toLowerCase();
  }

  function readUnitFromLabels() {
    const text = (
      getLabelTextForInput("weight") + " " +
      getLabelTextForInput("bmiWeight") + " " +
      getLabelTextForInput("height") + " " +
      getLabelTextForInput("bmiHeight") + " " +
      getLabelTextForInput("waist") + " " +
      getLabelTextForInput("waistSize") + " " +
      getLabelTextForInput("bmiWaist")
    ).toLowerCase();

    if (
      text.includes("lb") ||
      text.includes("lbs") ||
      text.includes("inch") ||
      text.includes("(in") ||
      text.includes(" in)")
    ) {
      return "US";
    }

    if (
      text.includes("kg") ||
      text.includes("cm") ||
      text.includes("meter") ||
      text.includes("metre") ||
      text.includes("(m") ||
      text.includes(" m)")
    ) {
      return "SI";
    }

    return "";
  }

  function readUnitFromControls() {
    const selectors = [
      "#unit",
      "#bmiUnit",
      "#bmiUnits",
      "#unitSelect",
      "select[name='unit']",
      "select[name='bmiUnit']",
      "input[name='unit']:checked",
      "input[name='bmiUnit']:checked"
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (!el) continue;

      let text = "";

      if (el.tagName && el.tagName.toLowerCase() === "select") {
        const option = el.options[el.selectedIndex];
        text = (
          el.value + " " +
          (option ? option.textContent : "")
        ).toLowerCase();
      } else {
        text = (
          el.value + " " +
          (el.dataset.unit || "") + " " +
          (el.dataset.currentUnit || "")
        ).toLowerCase();
      }

      if (
        text.includes("us") ||
        text.includes("imperial") ||
        text.includes("lb") ||
        text.includes("inch")
      ) {
        return "US";
      }

      if (
        text.includes("si") ||
        text.includes("metric") ||
        text.includes("kg") ||
        text.includes("cm") ||
        text.includes("meter") ||
        text.includes("metre")
      ) {
        return "SI";
      }
    }

    return "";
  }

  function readUnitFromBody() {
    const data = cleanUnit(document.body.dataset.bmiUnit);
    if (data) return data;

    if (
      document.body.classList.contains("us-unit") ||
      document.body.classList.contains("us-mode") ||
      document.body.classList.contains("imperial-unit")
    ) {
      return "US";
    }

    if (
      document.body.classList.contains("si-unit") ||
      document.body.classList.contains("si-mode") ||
      document.body.classList.contains("metric-unit")
    ) {
      return "SI";
    }

    return "";
  }

  function readUnitFromButtonAsCurrent() {
    const btn = document.getElementById("unitToggleBtn");
    if (!btn) return "";

    const fromData =
      cleanUnit(btn.dataset.currentUnit) ||
      cleanUnit(btn.dataset.unit) ||
      cleanUnit(btn.value);

    if (fromData) return fromData;

    const text = String(btn.textContent || "").trim().toLowerCase();

    if (text === "si" || text === "metric" || text === "si unit") return "SI";
    if (text === "us" || text === "imperial" || text === "us unit") return "US";

    if (text.includes("current si") || text.includes("si mode")) return "SI";
    if (text.includes("current us") || text.includes("us mode")) return "US";

    /*
      If the button says "switch to US", it means the CURRENT mode is SI.
      If the button says "switch to SI", it means the CURRENT mode is US.
    */
    if (text.includes("switch to us") || text.includes("change to us")) return "SI";
    if (text.includes("switch to si") || text.includes("change to si")) return "US";

    return "";
  }

  function detectCurrentUnit() {
    /*
      Priority:
      1. Labels/inputs after the page updates
      2. Real controls/selects/radios
      3. Body dataset/class
      4. SI/US button
      5. Saved state
      6. Default SI
    */
    return (
      readUnitFromLabels() ||
      readUnitFromControls() ||
      readUnitFromBody() ||
      readUnitFromButtonAsCurrent() ||
      getSavedUnit() ||
      "SI"
    );
  }

  function syncUnitFromPage() {
    return saveUnit(detectCurrentUnit());
  }

  function flipSavedUnit() {
    return saveUnit(getSavedUnit() === "US" ? "SI" : "US");
  }

  function syncAfterUnitButtonClick() {
    const before = getSavedUnit();

    setTimeout(function () {
      const detected = detectCurrentUnit();

      /*
        If the page gives a clear unit after the click, use it.
        If not, toggle the saved state once.
      */
      if (detected && detected !== before) {
        saveUnit(detected);
      } else if (!readUnitFromLabels() && !readUnitFromControls() && !readUnitFromBody()) {
        flipSavedUnit();
      } else {
        saveUnit(detected || before);
      }

      renderBmiHistory();
    }, 120);
  }

  function getUnitsForCurrentMode(weight, height, waist) {
    const unit = getSavedUnit();

    if (unit === "US") {
      return {
        unit: "US",
        weightUnit: "lb",
        heightUnit: "in",
        waistUnit: "in",
        weightForBmi: weight,
        heightForBmi: height,
        waistForRatio: waist,
        heightForRatio: height
      };
    }

    const heightUnit = height > 3 ? "cm" : "m";
    const waistUnit = Number.isFinite(waist) && waist > 3 ? "cm" : "m";

    const heightMeters = heightUnit === "cm" ? height / 100 : height;
    const waistMeters =
      Number.isFinite(waist) && waist > 0
        ? (waistUnit === "cm" ? waist / 100 : waist)
        : NaN;

    return {
      unit: "SI",
      weightUnit: "kg",
      heightUnit: heightUnit,
      waistUnit: waistUnit,
      weightForBmi: weight,
      heightForBmi: heightMeters,
      waistForRatio: waistMeters,
      heightForRatio: heightMeters
    };
  }

  function bmiStatus(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }

  function whCondition(ratio) {
    if (!Number.isFinite(ratio)) return "-";
    if (ratio < 0.4) return "Very low";
    if (ratio < 0.5) return "Healthy";
    if (ratio < 0.6) return "Moderate risk";
    return "High risk";
  }

  function getBmiData() {
    syncUnitFromPage();

    const weight = getNumber(["weight", "bmiWeight"]);
    const height = getNumber(["height", "bmiHeight"]);
    const waist = getNumber(["waist", "waistSize", "bmiWaist"]);

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(height) ||
      weight <= 0 ||
      height <= 0
    ) {
      return null;
    }

    const units = getUnitsForCurrentMode(weight, height, waist);

    let bmi;

    if (units.unit === "US") {
      bmi = 703 * weight / (height * height);
    } else {
      bmi = weight / (units.heightForBmi * units.heightForBmi);
    }

    const ratio =
      Number.isFinite(waist) && waist > 0
        ? units.waistForRatio / units.heightForRatio
        : NaN;

    return {
      weight: weight,
      height: height,
      waist: waist,
      unit: units.unit,
      weightUnit: units.weightUnit,
      heightUnit: units.heightUnit,
      waistUnit: units.waistUnit,
      bmi: bmi,
      bmiStatus: bmiStatus(bmi),
      whRatio: ratio,
      condition: whCondition(ratio)
    };
  }

  function loadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
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

  function copyTextFinal(text, button) {
    if (!text) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "copied";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(copied).catch(function () {
        fallbackCopyFinal(text);
        copied();
      });
    } else {
      fallbackCopyFinal(text);
      copied();
    }
  }

  function fallbackCopyFinal(text) {
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

  function renameBmiHistoryTitle() {
    const title =
      document.querySelector(".bmi-history-box .bmi-history-top h3") ||
      document.querySelector(".bmi-history-box h3");

    if (title) {
      title.textContent = "Input";
    }
  }

  function renderBmiHistory() {
    if (!isBmiPage()) return;

    const list = document.getElementById("bmiHistoryList");
    if (!list) return;

    renameBmiHistoryTitle();

    const history = loadHistory();

    list.innerHTML = "";

    history.slice().reverse().forEach(function (item) {
      const waistLine =
        item.waist && item.waist !== "-"
          ? "<br><strong>Waist:</strong> " + item.waist + " " + item.waistUnit
          : "";

      const copyValue =
        "Weight: " + item.weight + " " + item.weightUnit + "\n" +
        "Height: " + item.height + " " + item.heightUnit + "\n" +
        (item.waist && item.waist !== "-"
          ? "Waist: " + item.waist + " " + item.waistUnit + "\n"
          : "") +
        "Unit: " + item.unit;

      const li = document.createElement("li");
      li.className = "history-item bmi-input-unit-history-item";

      const text = document.createElement("span");
      text.className = "history-text";
      text.innerHTML =
        "<strong>Weight:</strong> " + item.weight + " " + item.weightUnit + "<br>" +
        "<strong>Height:</strong> " + item.height + " " + item.heightUnit +
        waistLine + "<br>" +
        "<strong>Unit:</strong> " + item.unit;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "history-copy-btn";
      copyBtn.textContent = "copy";

      copyBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        copyTextFinal(copyValue, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function addBmiHistory(data) {
    if (!data) return;

    const item = {
      weight: String(data.weight),
      height: String(data.height),
      waist: Number.isFinite(data.waist) && data.waist > 0 ? String(data.waist) : "-",
      unit: data.unit,
      weightUnit: data.weightUnit,
      heightUnit: data.heightUnit,
      waistUnit: data.waistUnit
    };

    const history = loadHistory();
    const last = history[history.length - 1];

    if (
      !last ||
      last.weight !== item.weight ||
      last.height !== item.height ||
      last.waist !== item.waist ||
      last.unit !== item.unit
    ) {
      history.push(item);
    }

    saveHistory(history);
    renderBmiHistory();
  }

  function getMain() {
    return document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
  }

  function getCalculator() {
    const main = getMain();
    return main ? main.querySelector(".calculator") : null;
  }

  function getOrCreateResultPanel() {
    const calculator = getCalculator();
    if (!calculator) return null;

    let panel = document.getElementById(PANEL_ID);

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

  function hideOldResultPanels() {
    const oldResult = document.getElementById("bmiResult") || document.getElementById("result");

    if (oldResult) {
      oldResult.style.display = "none";
    }

    const oldPanel = document.getElementById("universalLoanStyleOutput");

    if (oldPanel) {
      oldPanel.hidden = true;
      oldPanel.style.setProperty("display", "none", "important");
    }
  }

  function renderBmiResult(data) {
    const panel = getOrCreateResultPanel();
    if (!panel || !data) return;

    const body = panel.querySelector(".stable-result-body");
    if (!body) return;

    const ratioText = Number.isFinite(data.whRatio) ? data.whRatio.toFixed(2) : "-";

    body.innerHTML =
      '<ul class="bmi-point-result">' +
        '<li><strong>BMI:</strong> ' + data.bmi.toFixed(2) + '</li>' +
        '<li><strong>BMI status:</strong> ' + data.bmiStatus + '</li>' +
        '<li><strong>W/H ratio:</strong> ' + ratioText + '</li>' +
        '<li><strong>Condition:</strong> ' + data.condition + '</li>' +
      '</ul>';

    panel.hidden = false;
    hideOldResultPanels();

    const copyBtn = panel.querySelector(".stable-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        copyTextFinal(
          "• BMI: " + data.bmi.toFixed(2) + "\n" +
          "• BMI status: " + data.bmiStatus + "\n" +
          "• W/H ratio: " + ratioText + "\n" +
          "• Condition: " + data.condition,
          copyBtn
        );
      };
    }
  }

  function calculateBmiFinal() {
    if (!isBmiPage()) return;

    document.body.classList.add("bmi-page");
    document.body.dataset.page = "bmi";

    const data = getBmiData();
    const oldResult = document.getElementById("bmiResult") || document.getElementById("result");

    if (!data) {
      const panel = document.getElementById(PANEL_ID);
      if (panel) panel.hidden = true;

      if (oldResult) {
        oldResult.style.display = "block";
        oldResult.innerText = "Please enter valid weight and height.";
      }

      return;
    }

    if (oldResult) {
      oldResult.innerText =
        "BMI: " + data.bmi.toFixed(2) + "\n" +
        "BMI status: " + data.bmiStatus + "\n" +
        "W/H ratio: " + (Number.isFinite(data.whRatio) ? data.whRatio.toFixed(2) : "-") + "\n" +
        "Condition: " + data.condition;
      oldResult.style.display = "none";
    }

    addBmiHistory(data);
    renderBmiResult(data);
  }

  function clearBmiFinal() {
    try {
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem("bmiHistory");
      localStorage.removeItem("inputHistory_bmi");
      localStorage.removeItem("bmiInputHistoryOnlyFinal");
    } catch {
      /* ignore */
    }

    renderBmiHistory();

    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.hidden = true;

    const oldPanel = document.getElementById("universalLoanStyleOutput");
    if (oldPanel) {
      oldPanel.hidden = true;
      oldPanel.style.setProperty("display", "none", "important");
    }

    const oldResult = document.getElementById("bmiResult") || document.getElementById("result");
    if (oldResult) oldResult.innerText = "";
  }

  function startBmiFinalRepair() {
    if (!isBmiPage()) return;

    document.body.classList.add("bmi-page");
    document.body.dataset.page = "bmi";

    syncUnitFromPage();
    renameBmiHistoryTitle();
    renderBmiHistory();

    window.calculateBMI = calculateBmiFinal;
    window.calculateBmi = calculateBmiFinal;
    window.clearBMIHistory = clearBmiFinal;
    window.clearBmiHistory = clearBmiFinal;

    const btn = document.getElementById("unitToggleBtn");
    if (btn && btn.dataset.bmiFinalRepairReady !== "true") {
      btn.dataset.bmiFinalRepairReady = "true";

      btn.addEventListener("click", function () {
        syncAfterUnitButtonClick();
      }, true);
    }

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (button.id === "unitToggleBtn") {
          syncAfterUnitButtonClick();
          return;
        }

        if (
          text.includes("calculate") ||
          onclick.includes("calculateBMI") ||
          onclick.includes("calculateBmi")
        ) {
          setTimeout(calculateBmiFinal, 0);
          setTimeout(calculateBmiFinal, 250);
          setTimeout(calculateBmiFinal, 650);
          setTimeout(hideOldResultPanels, 900);
        }

        if (text.includes("clear")) {
          setTimeout(clearBmiFinal, 0);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(calculateBmiFinal, 0);
          setTimeout(calculateBmiFinal, 250);
          setTimeout(calculateBmiFinal, 650);
        }
      },
      true
    );

    setTimeout(function () {
      syncUnitFromPage();
      renderBmiHistory();
      hideOldResultPanels();
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBmiFinalRepair);
  } else {
    startBmiFinalRepair();
  }
})();
/* =====================================================
   BMI CALCULATOR: FINAL CLEAN UNIT + HISTORY + RESULT FIX
   - Uses #unitToggleBtn data-current-unit as the true unit
   - SI = kg / cm
   - US = lb / in
   - Stops old BMI scripts from adding duplicate kg/lb items
   - History box = input only
   - Result box = bullet/point form
===================================================== */
(function () {
  "use strict";

  const HISTORY_KEY = "bmiCleanInputHistoryFinal";
  const UNIT_KEY = "bmiCleanCurrentUnitFinal";
  const MAX_ITEMS = 50;

  function isBmiPage() {
    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      !!document.getElementById("bmiHistoryList") ||
      !!document.getElementById("bmiResult")
    );
  }

  function getInput(id) {
    return document.getElementById(id);
  }

  function getNumber(id) {
    const input = getInput(id);
    if (!input) return NaN;

    const value = String(input.value || "").replace(/,/g, "").trim();
    const number = Number(value);

    return Number.isFinite(number) ? number : NaN;
  }

  function getCurrentUnit() {
    const button = document.getElementById("unitToggleBtn");

    if (button && button.dataset.currentUnit) {
      return button.dataset.currentUnit.toLowerCase() === "us" ? "us" : "si";
    }

    const saved = localStorage.getItem(UNIT_KEY) || localStorage.getItem("bmiUnit") || "si";
    return String(saved).toLowerCase() === "us" ? "us" : "si";
  }

  function saveCurrentUnit(unit) {
    const clean = unit === "us" ? "us" : "si";

    localStorage.setItem(UNIT_KEY, clean);
    localStorage.setItem("bmiUnit", clean);

    document.body.dataset.bmiUnit = clean;

    const button = document.getElementById("unitToggleBtn");
    if (button) {
      button.dataset.currentUnit = clean;
      button.textContent = clean === "si" ? "SI" : "US";
      button.setAttribute("aria-label", "Current BMI unit: " + button.textContent);
    }
  }

  function applyUnitUI() {
    const unit = getCurrentUnit();

    const weightLabel = document.getElementById("weightLabel");
    const heightLabel = document.getElementById("heightLabel");
    const waistLabel = document.getElementById("waistLabel");

    const weight = document.getElementById("weight");
    const height = document.getElementById("height");
    const waist = document.getElementById("waist");

    if (unit === "si") {
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
      if (waist) waist.placeholder = "Optional, Example: 31";
    }

    saveCurrentUnit(unit);
  }

  function toggleBMIUnitFinal() {
    const current = getCurrentUnit();
    const next = current === "si" ? "us" : "si";

    saveCurrentUnit(next);
    applyUnitUI();

    ["weight", "height", "waist"].forEach(function (id) {
      const input = document.getElementById(id);
      if (input) input.value = "";
    });

    const result = document.getElementById("bmiResult");
    if (result) result.textContent = "";

    hideOldPanels();
  }

  function unitLabels() {
    const unit = getCurrentUnit();

    if (unit === "us") {
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

  function calculateBmiData() {
    const weight = getNumber("weight");
    const height = getNumber("height");
    const waist = getNumber("waist");
    const labels = unitLabels();

    if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
      return null;
    }

    let bmi;

    if (labels.unit === "US") {
      bmi = 703 * weight / (height * height);
    } else {
      const heightM = height / 100;
      bmi = weight / (heightM * heightM);
    }

    let status = "Normal";
    if (bmi < 18.5) status = "Underweight";
    else if (bmi < 25) status = "Healthy BMI";
    else if (bmi < 30) status = "Overweight";
    else status = "Obese";

    let whRatio = NaN;
    let condition = "-";

    if (Number.isFinite(waist) && waist > 0) {
      whRatio = waist / height;
      condition = whRatio < 0.5 ? "Healthy" : "Unhealthy";
    }

    return {
      weight: weight,
      height: height,
      waist: waist,
      unit: labels.unit,
      weightUnit: labels.weight,
      heightUnit: labels.height,
      waistUnit: labels.waist,
      bmi: bmi,
      status: status,
      whRatio: whRatio,
      condition: condition
    };
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
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_ITEMS)));
  }

  function removeOldBmiStorage() {
    localStorage.removeItem("bmiHistory");
    localStorage.removeItem("inputHistory_bmi");
    localStorage.removeItem("bmiInputHistoryOnlyFinal");
  }

  function addHistory(data) {
    if (!data) return;

    removeOldBmiStorage();

    const item = {
      weight: String(data.weight),
      height: String(data.height),
      waist: Number.isFinite(data.waist) && data.waist > 0 ? String(data.waist) : "-",
      unit: data.unit,
      weightUnit: data.weightUnit,
      heightUnit: data.heightUnit,
      waistUnit: data.waistUnit
    };

    const history = loadHistory();
    const last = history[history.length - 1];

    if (
      !last ||
      last.weight !== item.weight ||
      last.height !== item.height ||
      last.waist !== item.waist ||
      last.unit !== item.unit
    ) {
      history.push(item);
    }

    saveHistory(history);
  }

  function copyText(text, button) {
    if (!text) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "copied";

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

  function renderHistory() {
    const list = document.getElementById("bmiHistoryList");
    if (!list) return;

    const title =
      document.querySelector(".bmi-history-box .bmi-history-top h3") ||
      document.querySelector(".bmi-history-box h3");

    if (title) title.textContent = "Input";

    list.innerHTML = "";

    loadHistory().slice().reverse().forEach(function (item) {
      const waistLine =
        item.waist && item.waist !== "-"
          ? "<br><strong>Waist:</strong> " + item.waist + " " + item.waistUnit
          : "";

      const display =
        "<strong>Weight:</strong> " + item.weight + " " + item.weightUnit + "<br>" +
        "<strong>Height:</strong> " + item.height + " " + item.heightUnit +
        waistLine + "<br>" +
        "<strong>Unit:</strong> " + item.unit;

      const copyValue =
        "Weight: " + item.weight + " " + item.weightUnit + "\n" +
        "Height: " + item.height + " " + item.heightUnit + "\n" +
        (item.waist && item.waist !== "-"
          ? "Waist: " + item.waist + " " + item.waistUnit + "\n"
          : "") +
        "Unit: " + item.unit;

      const li = document.createElement("li");
      li.className = "history-item bmi-clean-history-item";

      const text = document.createElement("span");
      text.className = "history-text";
      text.innerHTML = display;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "history-copy-btn";
      copyBtn.textContent = "copy";

      copyBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        copyText(copyValue, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function getOrCreateResultPanel() {
    const main = document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
    const calculator = main ? main.querySelector(".calculator") : null;

    if (!calculator) return null;

    let panel = document.getElementById("stableBmiOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "stableBmiOutput";
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

  function hideOldPanels() {
    const oldPanel = document.getElementById("universalLoanStyleOutput");
    if (oldPanel) {
      oldPanel.hidden = true;
      oldPanel.style.setProperty("display", "none", "important");
    }

    const result = document.getElementById("bmiResult");
    if (result) {
      result.style.display = "none";
    }
  }

  function renderResult(data) {
    const panel = getOrCreateResultPanel();
    if (!panel || !data) return;

    const body = panel.querySelector(".stable-result-body");
    const copyBtn = panel.querySelector(".stable-copy-btn");

    const whText = Number.isFinite(data.whRatio) ? data.whRatio.toFixed(2) : "-";

    body.innerHTML =
      '<ul class="bmi-point-result">' +
        '<li><strong>BMI:</strong> ' + data.bmi.toFixed(2) + '</li>' +
        '<li><strong>BMI status:</strong> ' + data.status + '</li>' +
        '<li><strong>W/H ratio:</strong> ' + whText + '</li>' +
        '<li><strong>Condition:</strong> ' + data.condition + '</li>' +
      '</ul>';

    panel.hidden = false;
    hideOldPanels();

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        copyText(
          "• BMI: " + data.bmi.toFixed(2) + "\n" +
          "• BMI status: " + data.status + "\n" +
          "• W/H ratio: " + whText + "\n" +
          "• Condition: " + data.condition,
          copyBtn
        );
      };
    }
  }

  function calculateBMIFinal() {
    const data = calculateBmiData();
    const result = document.getElementById("bmiResult");

    if (!data) {
      if (result) {
        result.style.display = "block";
        result.textContent = "Please enter valid weight and height.";
      }

      const panel = document.getElementById("stableBmiOutput");
      if (panel) panel.hidden = true;

      return;
    }

    if (result) {
      result.textContent =
        "BMI: " + data.bmi.toFixed(2) + "\n" +
        "BMI status: " + data.status + "\n" +
        "W/H ratio: " + (Number.isFinite(data.whRatio) ? data.whRatio.toFixed(2) : "-") + "\n" +
        "Condition: " + data.condition;
      result.style.display = "none";
    }

    addHistory(data);
    renderHistory();
    renderResult(data);
  }

  function clearBMIHistoryFinal() {
    localStorage.removeItem(HISTORY_KEY);
    removeOldBmiStorage();

    renderHistory();

    const panel = document.getElementById("stableBmiOutput");
    if (panel) panel.hidden = true;

    const result = document.getElementById("bmiResult");
    if (result) result.textContent = "";

    hideOldPanels();
  }

  function blockOldBmiClicks(event) {
    const button = event.target.closest("button");
    if (!button || !isBmiPage()) return;

    const text = button.textContent.trim().toLowerCase();
    const onclick = button.getAttribute("onclick") || "";

    const isToggle = button.id === "unitToggleBtn" || onclick.includes("toggleBMIUnit");
    const isCalculate = onclick.includes("calculateBMI") || text.includes("calculate bmi");
    const isClear = onclick.includes("clearBMIHistory") || text.includes("clear");

    if (!isToggle && !isCalculate && !isClear) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (isToggle) {
      toggleBMIUnitFinal();
      return;
    }

    if (isCalculate) {
      calculateBMIFinal();
      setTimeout(function () {
        hideOldPanels();
        renderHistory();
      }, 250);
      return;
    }

    if (isClear) {
      clearBMIHistoryFinal();
    }
  }

  function startBmiCleanFinal() {
    if (!isBmiPage()) return;

    document.body.classList.add("bmi-page");
    document.body.dataset.page = "bmi";

    saveCurrentUnit(getCurrentUnit());
    applyUnitUI();
    removeOldBmiStorage();
    renderHistory();
    hideOldPanels();

    window.toggleBMIUnit = toggleBMIUnitFinal;
    window.calculateBMI = calculateBMIFinal;
    window.calculateBmi = calculateBMIFinal;
    window.clearBMIHistory = clearBMIHistoryFinal;
    window.clearBmiHistory = clearBMIHistoryFinal;

    document.addEventListener("click", blockOldBmiClicks, true);

    const list = document.getElementById("bmiHistoryList");
    if (list && list.dataset.bmiCleanObserverReady !== "true") {
      list.dataset.bmiCleanObserverReady = "true";

      const observer = new MutationObserver(function () {
        const text = list.textContent || "";

        if (
          text.includes("lb") && getCurrentUnit() === "si" ||
          text.includes("kg") && getCurrentUnit() === "us" ||
          text.includes("BMI status") ||
          text.includes("W/H ratio") ||
          text.includes("Condition") ||
          text.includes("→")
        ) {
          setTimeout(renderHistory, 0);
        }
      });

      observer.observe(list, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBmiCleanFinal);
  } else {
    startBmiCleanFinal();
  }
})();
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
   LOAN / MORTGAGE: Rename "Total monthly payment"
   to "Monthly payment"
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

  function renameLoanMonthlyLabels() {
    if (!isLoanPage()) return;

    const panel = document.getElementById("loanExternalOutput");
    if (!panel) return;

    panel.querySelectorAll("th, td").forEach(function (cell) {
      const text = cell.textContent.trim().toLowerCase();

      if (
        text === "total monthly payment" ||
        text === "total monthly" ||
        text === "total monthly payment by years"
      ) {
        cell.textContent = "Monthly payment";
      }
    });
  }

  function startRenameLoanMonthlyLabels() {
    if (!isLoanPage()) return;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateLoan")) {
          setTimeout(renameLoanMonthlyLabels, 0);
          setTimeout(renameLoanMonthlyLabels, 200);
          setTimeout(renameLoanMonthlyLabels, 600);
        }
      },
      true
    );

    const panel = document.getElementById("loanExternalOutput");

    if (panel && panel.dataset.monthlyLabelObserverReady !== "true") {
      panel.dataset.monthlyLabelObserverReady = "true";

      const observer = new MutationObserver(function () {
        setTimeout(renameLoanMonthlyLabels, 0);
      });

      observer.observe(panel, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    setTimeout(renameLoanMonthlyLabels, 300);
    setTimeout(renameLoanMonthlyLabels, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startRenameLoanMonthlyLabels);
  } else {
    startRenameLoanMonthlyLabels();
  }
})();
/* =====================================================
   LOAN CALCULATOR: POINT FORM RESULT ONLY
   - Removes result table
   - Removes graph
   - Shows result in point/bullet form
   - Keeps optional mortgage costs ignored for these loan-only values
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

  function calculateLoanPaymentFinal(principal, annualRate, years) {
    const months = years * 12;
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

  function getLoanPointPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;
    if (!calculator) return null;

    let panel = document.getElementById("loanExternalOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "loanExternalOutput";
      panel.className = "loan-external-output loan-point-output";
      panel.setAttribute("aria-label", "Loan result");
      calculator.insertAdjacentElement("afterend", panel);
    }

    panel.classList.add("loan-point-output");

    return panel;
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

  function renderLoanPointResult(amount, annualRate, years) {
    const panel = getLoanPointPanel();
    if (!panel) return;

    const monthlyPI = calculateLoanPaymentFinal(amount, annualRate, years);
    const fullPaymentValue = monthlyPI * years * 12;
    const fullLoanInterest = fullPaymentValue - amount;
    const yearlyInterest = fullLoanInterest / years;
    const yearlyPayment = monthlyPI * 12;

    panel.hidden = false;

    panel.innerHTML =
      '<div class="loan-output-top loan-point-top">' +
        '<div class="loan-result-panel loan-point-panel">' +
          '<h2 class="loan-panel-title">Result</h2>' +
          '<div class="loan-result-body">' +
            '<ul class="loan-point-result">' +
              '<li><strong>Principal + interest monthly:</strong> ' + money(monthlyPI) + '</li>' +
              '<li><strong>Yearly interest:</strong> ' + money(yearlyInterest) + '</li>' +
              '<li><strong>Yearly payment:</strong> ' + money(yearlyPayment) + '</li>' +
              '<li><strong>Full loan interest:</strong> ' + money(fullLoanInterest) + '</li>' +
              '<li><strong>Full payment value:</strong> ' + money(fullPaymentValue) + '</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="loan-copy-side">' +
          '<button type="button" class="loan-copy-btn">Copy</button>' +
        '</div>' +
      '</div>';

    const copyBtn = panel.querySelector(".loan-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        copyText(
          "• Principal + interest monthly: " + money(monthlyPI) + "\n" +
          "• Yearly interest: " + money(yearlyInterest) + "\n" +
          "• Yearly payment: " + money(yearlyPayment) + "\n" +
          "• Full loan interest: " + money(fullLoanInterest) + "\n" +
          "• Full payment value: " + money(fullPaymentValue),
          copyBtn
        );
      };
    }

    const result = document.getElementById("loanResult") || document.getElementById("result");

    if (result) {
      result.innerText =
        "Principal + interest monthly: " + money(monthlyPI) + "\n" +
        "Yearly interest: " + money(yearlyInterest) + "\n" +
        "Yearly payment: " + money(yearlyPayment) + "\n" +
        "Full loan interest: " + money(fullLoanInterest) + "\n" +
        "Full payment value: " + money(fullPaymentValue);

      result.style.display = "none";
    }
  }

  function calculateLoanPointOnly() {
    if (!isLoanPage()) return;

    const amount = getNumber(["amount", "loanAmount", "principal", "loanPrincipal"]);
    const annualRate = getNumber(["interest", "loanRate", "interestRate", "annualRate", "rate"]);
    const years = getNumber(["years", "loanYears", "loanTerm", "term"]);

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

      const panel = document.getElementById("loanExternalOutput");
      if (panel) panel.hidden = true;

      return;
    }

    renderLoanPointResult(amount, annualRate, years);
  }

  function startLoanPointOnlyResult() {
    if (!isLoanPage()) return;

    document.body.classList.add("loan-page");
    document.body.dataset.page = "loan";

    window.calculateLoan = calculateLoanPointOnly;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateLoan")) {
          setTimeout(calculateLoanPointOnly, 0);
          setTimeout(calculateLoanPointOnly, 150);
          setTimeout(calculateLoanPointOnly, 400);
        }

        if (text.includes("clear")) {
          const panel = document.getElementById("loanExternalOutput");
          if (panel) panel.hidden = true;
        }
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startLoanPointOnlyResult);
  } else {
    startLoanPointOnlyResult();
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
/* =====================================================
   BMI CALCULATOR: MORE DETAILED RESULT
   Adds:
   - BMI
   - BMI status
   - Asian BMI status
   - Healthy weight range
   - Weight difference
   - W/H ratio
   - W/H condition
   - Formula used
===================================================== */
(function () {
  "use strict";

  const PANEL_ID = "stableBmiOutput";

  function isBmiPage() {
    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      !!document.getElementById("bmiResult") ||
      !!document.getElementById("bmiHistoryList")
    );
  }

  function getNumber(id) {
    const input = document.getElementById(id);
    if (!input) return NaN;

    const value = Number(String(input.value || "").replace(/,/g, "").trim());
    return Number.isFinite(value) ? value : NaN;
  }

  function getCurrentUnit() {
    const btn = document.getElementById("unitToggleBtn");

    if (btn && btn.dataset.currentUnit) {
      return btn.dataset.currentUnit.toLowerCase() === "us" ? "us" : "si";
    }

    const saved = localStorage.getItem("bmiUnit") || document.body.dataset.bmiUnit || "si";
    return String(saved).toLowerCase() === "us" ? "us" : "si";
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function bmiStatusStandard(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Healthy weight";
    if (bmi < 30) return "Overweight";
    if (bmi < 35) return "Obesity class 1";
    if (bmi < 40) return "Obesity class 2";
    return "Obesity class 3";
  }

  function bmiStatusAsian(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 23) return "Normal";
    if (bmi < 27.5) return "Overweight";
    return "Obese";
  }

  function whCondition(ratio) {
    if (!Number.isFinite(ratio)) return "-";
    if (ratio < 0.4) return "Below healthy range";
    if (ratio < 0.5) return "Healthy";
    if (ratio < 0.6) return "Increased risk";
    return "High risk";
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
      panel.className = "stable-result-output bmi-point-output";
      panel.setAttribute("aria-label", "BMI detailed result");

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

  function calculateDetailedBMI() {
    if (!isBmiPage()) return;

    const unit = getCurrentUnit();
    const weight = getNumber("weight");
    const height = getNumber("height");
    const waist = getNumber("waist");

    const result = document.getElementById("bmiResult") || document.getElementById("result");
    const panel = getOrCreatePanel();

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(height) ||
      weight <= 0 ||
      height <= 0
    ) {
      if (result) {
        result.style.display = "block";
        result.textContent = "Please enter valid weight and height.";
      }

      if (panel) panel.hidden = true;
      return;
    }

    let bmi;
    let formulaUsed;
    let heightM;
    let healthyMinWeight;
    let healthyMaxWeight;
    let weightUnit;
    let heightUnit;
    let waistUnit;

    if (unit === "us") {
      bmi = 703 * weight / (height * height);
      formulaUsed = "BMI = weight lb ÷ height in² × 703";

      const heightIn = height;
      healthyMinWeight = 18.5 * heightIn * heightIn / 703;
      healthyMaxWeight = 24.9 * heightIn * heightIn / 703;

      weightUnit = "lb";
      heightUnit = "in";
      waistUnit = "in";
    } else {
      heightM = height / 100;
      bmi = weight / (heightM * heightM);
      formulaUsed = "BMI = weight kg ÷ height m²";

      healthyMinWeight = 18.5 * heightM * heightM;
      healthyMaxWeight = 24.9 * heightM * heightM;

      weightUnit = "kg";
      heightUnit = "cm";
      waistUnit = "cm";
    }

    let weightDifference = "Within healthy weight range";

    if (weight < healthyMinWeight) {
      weightDifference = "Need about " + money(healthyMinWeight - weight) + " " + weightUnit + " to reach healthy range";
    } else if (weight > healthyMaxWeight) {
      weightDifference = "Need about " + money(weight - healthyMaxWeight) + " " + weightUnit + " to reach healthy range";
    }

    const whRatio = Number.isFinite(waist) && waist > 0 ? waist / height : NaN;
    const whRatioText = Number.isFinite(whRatio) ? whRatio.toFixed(2) : "-";

    const standardStatus = bmiStatusStandard(bmi);
    const asianStatus = bmiStatusAsian(bmi);
    const whStatus = whCondition(whRatio);

    const resultText =
      "• BMI: " + bmi.toFixed(2) + "\n" +
      "• BMI status: " + standardStatus + "\n" +
      "• Asian BMI status: " + asianStatus + "\n" +
      "• Healthy weight range: " + money(healthyMinWeight) + " - " + money(healthyMaxWeight) + " " + weightUnit + "\n" +
      "• Weight difference: " + weightDifference + "\n" +
      "• W/H ratio: " + whRatioText + "\n" +
      "• W/H condition: " + whStatus + "\n" +
      "• Formula used: " + formulaUsed;

    if (result) {
      result.textContent = resultText;
      result.style.display = "none";
    }

    if (!panel) return;

    const body = panel.querySelector(".stable-result-body");
    const copyBtn = panel.querySelector(".stable-copy-btn");

    if (body) {
      body.innerHTML =
        '<ul class="bmi-point-result bmi-detailed-result">' +
          '<li><strong>BMI:</strong> ' + bmi.toFixed(2) + '</li>' +
          '<li><strong>BMI status:</strong> ' + standardStatus + '</li>' +
          '<li><strong>Asian BMI status:</strong> ' + asianStatus + '</li>' +
          '<li><strong>Healthy weight range:</strong> ' + money(healthyMinWeight) + ' - ' + money(healthyMaxWeight) + ' ' + weightUnit + '</li>' +
          '<li><strong>Weight difference:</strong> ' + weightDifference + '</li>' +
          '<li><strong>W/H ratio:</strong> ' + whRatioText + '</li>' +
          '<li><strong>W/H condition:</strong> ' + whStatus + '</li>' +
          '<li><strong>Formula used:</strong> ' + formulaUsed + '</li>' +
        '</ul>';
    }

    panel.hidden = false;

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyText(resultText, copyBtn);
      };
    }
  }

  function startDetailedBmiResult() {
    if (!isBmiPage()) return;

    window.calculateBMI = calculateDetailedBMI;
    window.calculateBmi = calculateDetailedBMI;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate bmi") || onclick.includes("calculateBMI")) {
          setTimeout(calculateDetailedBMI, 0);
          setTimeout(calculateDetailedBMI, 200);
          setTimeout(calculateDetailedBMI, 600);
        }
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startDetailedBmiResult);
  } else {
    startDetailedBmiResult();
  }
})();
/* =====================================================
   BMI CALCULATOR: KIDS / ADULT / OLDER / MEN / WOMEN / ASIAN
   Adds:
   - Age group selector
   - Sex selector
   - Asian / non-Asian selector
   - Detailed point-form result
===================================================== */
(function () {
  "use strict";

  const PANEL_ID = "stableBmiOutput";

  function isBmiPage() {
    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      !!document.getElementById("bmiResult") ||
      !!document.getElementById("bmiHistoryList")
    );
  }

  function getNumber(id) {
    const input = document.getElementById(id);
    if (!input) return NaN;

    const value = Number(String(input.value || "").replace(/,/g, "").trim());
    return Number.isFinite(value) ? value : NaN;
  }

  function getSelectValue(id, fallback) {
    const input = document.getElementById(id);
    return input ? String(input.value || fallback).trim() : fallback;
  }

  function getCurrentUnit() {
    const btn = document.getElementById("unitToggleBtn");

    if (btn && btn.dataset.currentUnit) {
      return btn.dataset.currentUnit.toLowerCase() === "us" ? "us" : "si";
    }

    const saved = localStorage.getItem("bmiUnit") || document.body.dataset.bmiUnit || "si";
    return String(saved).toLowerCase() === "us" ? "us" : "si";
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function addBmiDetailSelectors() {
    if (!isBmiPage()) return;

    const calculator = document.querySelector(".calculator");
    const weightInput = document.getElementById("weight");

    if (!calculator || !weightInput || document.getElementById("bmiAgeGroup")) return;

    const box = document.createElement("div");
    box.className = "bmi-extra-profile-box";

    box.innerHTML = `
      <h3 class="bmi-extra-title">User profile</h3>

      <label for="bmiAgeGroup">Age group:</label>
      <select id="bmiAgeGroup">
        <option value="adult">Adult, 20 - 64</option>
        <option value="child">Kid / teen, 2 - 19</option>
        <option value="older">Older adult, 65+</option>
      </select>

      <label for="bmiSex">Sex:</label>
      <select id="bmiSex">
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>

      <label for="bmiEthnicity">BMI cut-off:</label>
      <select id="bmiEthnicity">
        <option value="non-asian">Non-Asian / standard adult cut-off</option>
        <option value="asian">Asian cut-off</option>
      </select>
    `;

    weightInput.insertAdjacentElement("beforebegin", box);
  }

  function standardAdultStatus(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Healthy weight";
    if (bmi < 30) return "Overweight";
    if (bmi < 35) return "Obesity class 1";
    if (bmi < 40) return "Obesity class 2";
    return "Obesity class 3";
  }

  function asianAdultStatus(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 23) return "Normal";
    if (bmi < 27.5) return "Overweight";
    return "Obese";
  }

  function whCondition(ratio) {
    if (!Number.isFinite(ratio)) return "-";
    if (ratio < 0.4) return "Below healthy range";
    if (ratio < 0.5) return "Healthy";
    if (ratio < 0.6) return "Increased risk";
    return "High risk";
  }

  function waistStatus(waist, unit, sex) {
    if (!Number.isFinite(waist) || waist <= 0) return "-";

    if (sex === "female") {
      const limit = unit === "us" ? 35 : 88;
      return waist > limit ? "Above common female risk level" : "Below common female risk level";
    }

    if (sex === "male") {
      const limit = unit === "us" ? 40 : 102;
      return waist > limit ? "Above common male risk level" : "Below common male risk level";
    }

    return "Choose male or female for waist risk comparison";
  }

  function ageGroupNote(ageGroup) {
    if (ageGroup === "child") {
      return "For kids/teens, BMI should be interpreted using BMI-for-age percentile by age and sex.";
    }

    if (ageGroup === "older") {
      return "For older adults, BMI should be considered together with waist size, strength, health condition, and medical advice.";
    }

    return "Adult BMI category is suitable for most adults age 20 and older.";
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
      panel.className = "stable-result-output bmi-point-output";
      panel.setAttribute("aria-label", "BMI detailed result");

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

  function calculateInclusiveBMI() {
    if (!isBmiPage()) return;

    addBmiDetailSelectors();

    const unit = getCurrentUnit();
    const weight = getNumber("weight");
    const height = getNumber("height");
    const waist = getNumber("waist");

    const ageGroup = getSelectValue("bmiAgeGroup", "adult");
    const sex = getSelectValue("bmiSex", "male");
    const ethnicity = getSelectValue("bmiEthnicity", "non-asian");

    const result = document.getElementById("bmiResult") || document.getElementById("result");
    const panel = getOrCreatePanel();

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(height) ||
      weight <= 0 ||
      height <= 0
    ) {
      if (result) {
        result.style.display = "block";
        result.textContent = "Please enter valid weight and height.";
      }

      if (panel) panel.hidden = true;
      return;
    }

    let bmi;
    let formulaUsed;
    let healthyMinWeight;
    let healthyMaxWeight;
    let weightUnit;

    if (unit === "us") {
      bmi = 703 * weight / (height * height);
      formulaUsed = "BMI = weight lb ÷ height in² × 703";

      healthyMinWeight = 18.5 * height * height / 703;
      healthyMaxWeight = 24.9 * height * height / 703;

      weightUnit = "lb";
    } else {
      const heightM = height / 100;
      bmi = weight / (heightM * heightM);
      formulaUsed = "BMI = weight kg ÷ height m²";

      healthyMinWeight = 18.5 * heightM * heightM;
      healthyMaxWeight = 24.9 * heightM * heightM;

      weightUnit = "kg";
    }

    const standardStatus = standardAdultStatus(bmi);
    const asianStatus = asianAdultStatus(bmi);
    const selectedStatus = ethnicity === "asian" ? asianStatus : standardStatus;

    let weightDifference = "Within standard healthy adult weight range";

    if (weight < healthyMinWeight) {
      weightDifference = "Need about " + money(healthyMinWeight - weight) + " " + weightUnit + " to reach standard healthy adult range";
    } else if (weight > healthyMaxWeight) {
      weightDifference = "Need about " + money(weight - healthyMaxWeight) + " " + weightUnit + " to reach standard healthy adult range";
    }

    const whRatio = Number.isFinite(waist) && waist > 0 ? waist / height : NaN;
    const whRatioText = Number.isFinite(whRatio) ? whRatio.toFixed(2) : "-";
    const whStatus = whCondition(whRatio);
    const waistRisk = waistStatus(waist, unit, sex);
    const note = ageGroupNote(ageGroup);

    const kidStatus =
      ageGroup === "child"
        ? "Use BMI-for-age percentile; adult BMI status is shown only as a rough reference."
        : selectedStatus;

    const resultText =
      "• BMI: " + bmi.toFixed(2) + "\n" +
      "• Main status: " + kidStatus + "\n" +
      "• Standard adult status: " + standardStatus + "\n" +
      "• Asian adult status: " + asianStatus + "\n" +
      "• Healthy adult weight range: " + money(healthyMinWeight) + " - " + money(healthyMaxWeight) + " " + weightUnit + "\n" +
      "• Weight difference: " + weightDifference + "\n" +
      "• W/H ratio: " + whRatioText + "\n" +
      "• W/H condition: " + whStatus + "\n" +
      "• Waist risk by sex: " + waistRisk + "\n" +
      "• Age group note: " + note + "\n" +
      "• Formula used: " + formulaUsed;

    if (result) {
      result.textContent = resultText;
      result.style.display = "none";
    }

    if (!panel) return;

    const body = panel.querySelector(".stable-result-body");
    const copyBtn = panel.querySelector(".stable-copy-btn");

    if (body) {
      body.innerHTML =
        '<ul class="bmi-point-result bmi-detailed-result">' +
          '<li><strong>BMI:</strong> ' + bmi.toFixed(2) + '</li>' +
          '<li><strong>Main status:</strong> ' + kidStatus + '</li>' +
          '<li><strong>Standard adult status:</strong> ' + standardStatus + '</li>' +
          '<li><strong>Asian adult status:</strong> ' + asianStatus + '</li>' +
          '<li><strong>Healthy adult weight range:</strong> ' + money(healthyMinWeight) + ' - ' + money(healthyMaxWeight) + ' ' + weightUnit + '</li>' +
          '<li><strong>Weight difference:</strong> ' + weightDifference + '</li>' +
          '<li><strong>W/H ratio:</strong> ' + whRatioText + '</li>' +
          '<li><strong>W/H condition:</strong> ' + whStatus + '</li>' +
          '<li><strong>Waist risk by sex:</strong> ' + waistRisk + '</li>' +
          '<li><strong>Age group note:</strong> ' + note + '</li>' +
          '<li><strong>Formula used:</strong> ' + formulaUsed + '</li>' +
        '</ul>';
    }

    panel.hidden = false;

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyText(resultText, copyBtn);
      };
    }
  }

  function startInclusiveBmiCalculator() {
    if (!isBmiPage()) return;

    addBmiDetailSelectors();

    window.calculateBMI = calculateInclusiveBMI;
    window.calculateBmi = calculateInclusiveBMI;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate bmi") || onclick.includes("calculateBMI")) {
          setTimeout(calculateInclusiveBMI, 0);
          setTimeout(calculateInclusiveBMI, 200);
          setTimeout(calculateInclusiveBMI, 600);
        }
      },
      true
    );

    setTimeout(addBmiDetailSelectors, 300);
    setTimeout(addBmiDetailSelectors, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startInclusiveBmiCalculator);
  } else {
    startInclusiveBmiCalculator();
  }
})();
/* =====================================================
   BMI CALCULATOR: INCLUDE USER PROFILE IN INPUT HISTORY
   Adds age group, sex, and Asian/non-Asian cut-off to BMI input box
===================================================== */
(function () {
  "use strict";

  const HISTORY_KEY = "bmiCleanInputHistoryFinal";
  const MAX_ITEMS = 50;

  function isBmiPage() {
    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      !!document.getElementById("bmiHistoryList") ||
      !!document.getElementById("bmiResult")
    );
  }

  function getNumber(id) {
    const input = document.getElementById(id);
    if (!input) return NaN;

    const value = Number(String(input.value || "").replace(/,/g, "").trim());
    return Number.isFinite(value) ? value : NaN;
  }

  function getSelectedText(id, fallback) {
    const select = document.getElementById(id);
    if (!select) return fallback;

    const option = select.options[select.selectedIndex];
    return option ? option.textContent.trim() : fallback;
  }

  function getCurrentUnit() {
    const button = document.getElementById("unitToggleBtn");

    if (button && button.dataset.currentUnit) {
      return button.dataset.currentUnit.toLowerCase() === "us" ? "us" : "si";
    }

    const saved = localStorage.getItem("bmiUnit") || document.body.dataset.bmiUnit || "si";
    return String(saved).toLowerCase() === "us" ? "us" : "si";
  }

  function getUnits() {
    const unit = getCurrentUnit();

    if (unit === "us") {
      return {
        unit: "US",
        weightUnit: "lb",
        heightUnit: "in",
        waistUnit: "in"
      };
    }

    return {
      unit: "SI",
      weightUnit: "kg",
      heightUnit: "cm",
      waistUnit: "cm"
    };
  }

  function getProfile() {
    return {
      ageGroup: getSelectedText("bmiAgeGroup", "Adult, 20 - 64"),
      sex: getSelectedText("bmiSex", "Male"),
      cutoff: getSelectedText("bmiEthnicity", "Non-Asian / standard adult cut-off")
    };
  }

  function loadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
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

  function copyText(text, button) {
    if (!text) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "copied";

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

  function addBmiHistoryWithProfile() {
    if (!isBmiPage()) return;

    const weight = getNumber("weight");
    const height = getNumber("height");
    const waist = getNumber("waist");

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(height) ||
      weight <= 0 ||
      height <= 0
    ) {
      return;
    }

    const units = getUnits();
    const profile = getProfile();

    const item = {
      ageGroup: profile.ageGroup,
      sex: profile.sex,
      cutoff: profile.cutoff,

      weight: String(weight),
      height: String(height),
      waist: Number.isFinite(waist) && waist > 0 ? String(waist) : "-",

      unit: units.unit,
      weightUnit: units.weightUnit,
      heightUnit: units.heightUnit,
      waistUnit: units.waistUnit
    };

    const history = loadHistory();
    const last = history[history.length - 1];

    if (
      !last ||
      last.ageGroup !== item.ageGroup ||
      last.sex !== item.sex ||
      last.cutoff !== item.cutoff ||
      last.weight !== item.weight ||
      last.height !== item.height ||
      last.waist !== item.waist ||
      last.unit !== item.unit
    ) {
      history.push(item);
    }

    saveHistory(history);
    renderBmiHistoryWithProfile();
  }

  function normalizeItem(item) {
    const units = getUnits();

    return {
      ageGroup: item.ageGroup || "Adult, 20 - 64",
      sex: item.sex || "Male",
      cutoff: item.cutoff || "Non-Asian / standard adult cut-off",

      weight: item.weight || "-",
      height: item.height || "-",
      waist: item.waist || "-",

      unit: item.unit || units.unit,
      weightUnit: item.weightUnit || units.weightUnit,
      heightUnit: item.heightUnit || units.heightUnit,
      waistUnit: item.waistUnit || units.waistUnit
    };
  }

  function renderBmiHistoryWithProfile() {
    if (!isBmiPage()) return;

    const list = document.getElementById("bmiHistoryList");
    if (!list) return;

    const title =
      document.querySelector(".bmi-history-box .bmi-history-top h3") ||
      document.querySelector(".bmi-history-box h3");

    if (title) {
      title.textContent = "Input";
    }

    const history = loadHistory().map(normalizeItem);
    saveHistory(history);

    list.innerHTML = "";

    history.slice().reverse().forEach(function (item) {
      const waistLine =
        item.waist && item.waist !== "-"
          ? "<br><strong>Waist:</strong> " + item.waist + " " + item.waistUnit
          : "";

      const copyValue =
        "Age group: " + item.ageGroup + "\n" +
        "Sex: " + item.sex + "\n" +
        "BMI cut-off: " + item.cutoff + "\n" +
        "Weight: " + item.weight + " " + item.weightUnit + "\n" +
        "Height: " + item.height + " " + item.heightUnit + "\n" +
        (item.waist && item.waist !== "-"
          ? "Waist: " + item.waist + " " + item.waistUnit + "\n"
          : "") +
        "Unit: " + item.unit;

      const li = document.createElement("li");
      li.className = "history-item bmi-profile-history-item";

      const text = document.createElement("span");
      text.className = "history-text";
      text.innerHTML =
        "<strong>Age group:</strong> " + item.ageGroup + "<br>" +
        "<strong>Sex:</strong> " + item.sex + "<br>" +
        "<strong>BMI cut-off:</strong> " + item.cutoff + "<br>" +
        "<strong>Weight:</strong> " + item.weight + " " + item.weightUnit + "<br>" +
        "<strong>Height:</strong> " + item.height + " " + item.heightUnit +
        waistLine + "<br>" +
        "<strong>Unit:</strong> " + item.unit;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "history-copy-btn";
      copyBtn.textContent = "copy";

      copyBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        copyText(copyValue, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function clearBmiHistoryWithProfile() {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem("bmiHistory");
    localStorage.removeItem("inputHistory_bmi");
    localStorage.removeItem("bmiInputHistoryOnlyFinal");

    renderBmiHistoryWithProfile();
  }

  function startBmiProfileHistory() {
    if (!isBmiPage()) return;

    window.clearBMIHistory = clearBmiHistoryWithProfile;
    window.clearBmiHistory = clearBmiHistoryWithProfile;

    renderBmiHistoryWithProfile();

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate bmi") || onclick.includes("calculateBMI")) {
          setTimeout(addBmiHistoryWithProfile, 0);
          setTimeout(addBmiHistoryWithProfile, 250);
          setTimeout(renderBmiHistoryWithProfile, 600);
        }

        if (text.includes("clear")) {
          setTimeout(clearBmiHistoryWithProfile, 0);
        }
      },
      true
    );

    ["bmiAgeGroup", "bmiSex", "bmiEthnicity"].forEach(function (id) {
      const select = document.getElementById(id);

      if (select) {
        select.addEventListener("change", function () {
          setTimeout(renderBmiHistoryWithProfile, 0);
        });
      }
    });

    setTimeout(renderBmiHistoryWithProfile, 500);
    setTimeout(renderBmiHistoryWithProfile, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBmiProfileHistory);
  } else {
    startBmiProfileHistory();
  }
})();
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

      const observer = new MutationObserver(function () {
        removeBasicBottomResult();
      });

      observer.observe(main, {
        childList: true,
        subtree: true
      });
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
/* =====================================================
   BMI: INPUT HISTORY INCLUDE USER PROFILE
   - Age group
   - Sex
   - BMI cut-off
   - Weight / height / waist / unit
===================================================== */
(function () {
  "use strict";

  const HISTORY_KEY = "bmiCleanInputHistoryFinal";
  const MAX_ITEMS = 50;

  function isBmiPage() {
    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      !!document.getElementById("bmiHistoryList") ||
      !!document.getElementById("bmiResult")
    );
  }

  function getNumber(id) {
    const input = document.getElementById(id);
    if (!input) return NaN;

    const value = Number(String(input.value || "").replace(/,/g, "").trim());
    return Number.isFinite(value) ? value : NaN;
  }

  function getSelectedText(id, fallback) {
    const select = document.getElementById(id);
    if (!select) return fallback;

    const option = select.options[select.selectedIndex];
    return option ? option.textContent.trim() : fallback;
  }

  function getCurrentUnit() {
    const button = document.getElementById("unitToggleBtn");

    if (button && button.dataset.currentUnit) {
      return button.dataset.currentUnit.toLowerCase() === "us" ? "us" : "si";
    }

    const saved = localStorage.getItem("bmiUnit") || document.body.dataset.bmiUnit || "si";
    return String(saved).toLowerCase() === "us" ? "us" : "si";
  }

  function getUnits() {
    if (getCurrentUnit() === "us") {
      return {
        unit: "US",
        weightUnit: "lb",
        heightUnit: "in",
        waistUnit: "in"
      };
    }

    return {
      unit: "SI",
      weightUnit: "kg",
      heightUnit: "cm",
      waistUnit: "cm"
    };
  }

  function ensureBmiProfileBox() {
    if (!isBmiPage()) return;

    const weightInput = document.getElementById("weight");
    if (!weightInput || document.getElementById("bmiAgeGroup")) return;

    const box = document.createElement("div");
    box.className = "bmi-extra-profile-box";

    box.innerHTML = `
      <h3 class="bmi-extra-title">User profile</h3>

      <label for="bmiAgeGroup">Age group:</label>
      <select id="bmiAgeGroup">
        <option value="adult">Adult, 20 - 64</option>
        <option value="child">Kid / teen, 2 - 19</option>
        <option value="older">Older adult, 65+</option>
      </select>

      <label for="bmiSex">Sex:</label>
      <select id="bmiSex">
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>

      <label for="bmiEthnicity">BMI cut-off:</label>
      <select id="bmiEthnicity">
        <option value="non-asian">Non-Asian / standard adult cut-off</option>
        <option value="asian">Asian cut-off</option>
      </select>
    `;

    weightInput.insertAdjacentElement("beforebegin", box);
  }

  function getProfile() {
    ensureBmiProfileBox();

    return {
      ageGroup: getSelectedText("bmiAgeGroup", "Adult, 20 - 64"),
      sex: getSelectedText("bmiSex", "Male"),
      cutoff: getSelectedText("bmiEthnicity", "Non-Asian / standard adult cut-off")
    };
  }

  function loadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_ITEMS)));
  }

  function normalizeItem(item) {
    const units = getUnits();

    return {
      ageGroup: item.ageGroup || "Adult, 20 - 64",
      sex: item.sex || "Male",
      cutoff: item.cutoff || "Non-Asian / standard adult cut-off",

      weight: item.weight || "-",
      height: item.height || "-",
      waist: item.waist || "-",

      unit: item.unit || units.unit,
      weightUnit: item.weightUnit || units.weightUnit,
      heightUnit: item.heightUnit || units.heightUnit,
      waistUnit: item.waistUnit || units.waistUnit
    };
  }

  function copyText(text, button) {
    if (!text) return;

    function copied() {
      const old = button.textContent;
      button.textContent = "copied";

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

  function renderBmiProfileHistory() {
    if (!isBmiPage()) return;

    const list = document.getElementById("bmiHistoryList");
    if (!list) return;

    const title =
      document.querySelector(".bmi-history-box .bmi-history-top h3") ||
      document.querySelector(".bmi-history-box h3");

    if (title) {
      title.textContent = "Input";
    }

    const history = loadHistory().map(normalizeItem);
    saveHistory(history);

    list.innerHTML = "";

    history.slice().reverse().forEach(function (item) {
      const waistLine =
        item.waist && item.waist !== "-"
          ? "<br><strong>Waist:</strong> " + item.waist + " " + item.waistUnit
          : "";

      const copyValue =
        "Age group: " + item.ageGroup + "\n" +
        "Sex: " + item.sex + "\n" +
        "BMI cut-off: " + item.cutoff + "\n" +
        "Weight: " + item.weight + " " + item.weightUnit + "\n" +
        "Height: " + item.height + " " + item.heightUnit + "\n" +
        (item.waist && item.waist !== "-"
          ? "Waist: " + item.waist + " " + item.waistUnit + "\n"
          : "") +
        "Unit: " + item.unit;

      const li = document.createElement("li");
      li.className = "history-item bmi-profile-history-item";

      const text = document.createElement("span");
      text.className = "history-text";
      text.innerHTML =
        "<strong>Age group:</strong> " + item.ageGroup + "<br>" +
        "<strong>Sex:</strong> " + item.sex + "<br>" +
        "<strong>BMI cut-off:</strong> " + item.cutoff + "<br>" +
        "<strong>Weight:</strong> " + item.weight + " " + item.weightUnit + "<br>" +
        "<strong>Height:</strong> " + item.height + " " + item.heightUnit +
        waistLine + "<br>" +
        "<strong>Unit:</strong> " + item.unit;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "history-copy-btn";
      copyBtn.textContent = "copy";

      copyBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        copyText(copyValue, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function addBmiProfileHistory() {
    if (!isBmiPage()) return;

    const weight = getNumber("weight");
    const height = getNumber("height");
    const waist = getNumber("waist");

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(height) ||
      weight <= 0 ||
      height <= 0
    ) {
      return;
    }

    const units = getUnits();
    const profile = getProfile();

    const item = {
      ageGroup: profile.ageGroup,
      sex: profile.sex,
      cutoff: profile.cutoff,

      weight: String(weight),
      height: String(height),
      waist: Number.isFinite(waist) && waist > 0 ? String(waist) : "-",

      unit: units.unit,
      weightUnit: units.weightUnit,
      heightUnit: units.heightUnit,
      waistUnit: units.waistUnit
    };

    localStorage.removeItem("bmiHistory");
    localStorage.removeItem("inputHistory_bmi");
    localStorage.removeItem("bmiInputHistoryOnlyFinal");

    const history = loadHistory();
    const last = history[history.length - 1];

    if (
      !last ||
      last.ageGroup !== item.ageGroup ||
      last.sex !== item.sex ||
      last.cutoff !== item.cutoff ||
      last.weight !== item.weight ||
      last.height !== item.height ||
      last.waist !== item.waist ||
      last.unit !== item.unit
    ) {
      history.push(item);
    }

    saveHistory(history);
    renderBmiProfileHistory();
  }

  function clearBmiProfileHistory() {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem("bmiHistory");
    localStorage.removeItem("inputHistory_bmi");
    localStorage.removeItem("bmiInputHistoryOnlyFinal");

    renderBmiProfileHistory();
  }

  function startBmiProfileHistory() {
    if (!isBmiPage()) return;

    ensureBmiProfileBox();
    renderBmiProfileHistory();

    window.clearBMIHistory = clearBmiProfileHistory;
    window.clearBmiHistory = clearBmiProfileHistory;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate bmi") || onclick.includes("calculateBMI")) {
          setTimeout(addBmiProfileHistory, 0);
          setTimeout(addBmiProfileHistory, 250);
          setTimeout(renderBmiProfileHistory, 700);
        }

        if (text.includes("clear")) {
          setTimeout(clearBmiProfileHistory, 0);
        }
      },
      true
    );

    const list = document.getElementById("bmiHistoryList");

    if (list && list.dataset.bmiProfileObserverReady !== "true") {
      list.dataset.bmiProfileObserverReady = "true";

      const observer = new MutationObserver(function () {
        const text = list.textContent || "";

        if (
          text.includes("BMI:") ||
          text.includes("BMI status") ||
          text.includes("W/H ratio") ||
          !text.includes("Age group")
        ) {
          setTimeout(renderBmiProfileHistory, 0);
        }
      });

      observer.observe(list, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    setTimeout(renderBmiProfileHistory, 500);
    setTimeout(renderBmiProfileHistory, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBmiProfileHistory);
  } else {
    startBmiProfileHistory();
  }
})();
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

/* =====================================================
   BMI: FINAL USER PROFILE SEX OPTION FIX
   Keeps Sex as Male / Female only, even if old BMI profile code rebuilds it.
===================================================== */
(function () {
  "use strict";

  function isBmiPage() {
    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      !!document.getElementById("bmiResult") ||
      !!document.getElementById("bmiHistoryList")
    );
  }

  function fixBmiSexOptions() {
    if (!isBmiPage()) return;

    const sex = document.getElementById("bmiSex");
    if (!sex) return;

    const current = String(sex.value || "").toLowerCase();

    if (
      sex.options.length === 2 &&
      sex.options[0].value === "male" &&
      sex.options[1].value === "female"
    ) {
      return;
    }

    sex.innerHTML =
      '<option value="male">Male</option>' +
      '<option value="female">Female</option>';

    sex.value = current === "female" ? "female" : "male";
  }

  function startBmiSexFinalFix() {
    if (!isBmiPage()) return;

    fixBmiSexOptions();

    const calculator = document.querySelector(".calculator");

    if (calculator && calculator.dataset.bmiSexFinalFixReady !== "true") {
      calculator.dataset.bmiSexFinalFixReady = "true";

      const observer = new MutationObserver(function () {
        fixBmiSexOptions();
      });

      observer.observe(calculator, {
        childList: true,
        subtree: true
      });
    }

    setTimeout(fixBmiSexOptions, 300);
    setTimeout(fixBmiSexOptions, 900);
    setTimeout(fixBmiSexOptions, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBmiSexFinalFix);
  } else {
    startBmiSexFinalFix();
  }
})();

