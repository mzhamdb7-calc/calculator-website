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

  function calculateAge() {
    const birthdate = firstValue(["birthdate", "birthDate", "dob"]);
    const result = document.getElementById("ageResult") || document.getElementById("result");

    if (!birthdate) {
      if (result) result.innerText = "Please select your birthdate.";
      return;
    }

    const normalAge = calculateNormalAgeFromBirthdate(birthdate);
    const asianAge = calculateAsianAgeFromBirthdate(birthdate);

    if (normalAge === "" || asianAge === "") {
      if (result) result.innerText = "Birthdate cannot be after today.";
      return;
    }

    if (result) {
      result.innerText =
        "Birthdate: " + birthdate + "\n" +
        "Normal age: " + normalAge + " years old\n" +
        "Asian age: " + asianAge + " years old";
    }

    addInputHistory();
    renderUniversalLoanStyleResult();
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
      return birthdate ? "Birthdate: " + birthdate : "";
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
      const normalAge = calculateNormalAgeFromBirthdate(birthdate);
      const asianAge = calculateAsianAgeFromBirthdate(birthdate);

      if (!birthdate || normalAge === "" || asianAge === "") return [];

      return [
        ["Birthdate", birthdate],
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

    if (type === "loan") return;

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
          if (type !== "basic") addInputHistory(type);
          renderUniversalLoanStyleResult();
        }, 150);

        setTimeout(renderUniversalLoanStyleResult, 400);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;

      setTimeout(function () {
        const type = getPageType();
        if (type !== "basic") addInputHistory(type);
        renderUniversalLoanStyleResult();
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
    buildInstructionLayout();
    setupNumberInputs();
    setupKeyboardSupport();
    setupActionHooks();
    setupScrollButton();

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
   AGE CALCULATOR: add "Date to calculate" input
   If empty, automatically use today's date
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

  function todayValue() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
  }

  function getDateInputValue(id) {
    const input = document.getElementById(id);
    return input ? String(input.value || "").trim() : "";
  }

  function addDateToCalculateInput() {
    if (!isAgePage()) return;

    const birthdateInput = document.getElementById("birthdate");
    if (!birthdateInput) return;

    if (document.getElementById("dateToCalculate")) return;

    const label = document.createElement("label");
    label.setAttribute("for", "dateToCalculate");
    label.textContent = "Date to calculate";

    const input = document.createElement("input");
    input.type = "date";
    input.id = "dateToCalculate";
    input.setAttribute("aria-label", "Date to calculate");
    input.value = todayValue();

    birthdateInput.insertAdjacentElement("afterend", input);
    input.insertAdjacentElement("beforebegin", label);
  }

  function calculateNormalAge(birthdateValue, calculateDateValue) {
    const birth = new Date(birthdateValue + "T00:00:00");
    const target = new Date(calculateDateValue + "T00:00:00");

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

    return years + " years old";
  }

  function calculateAsianAge(birthdateValue, calculateDateValue) {
    const birthYear = Number(birthdateValue.split("-")[0]);
    const targetYear = Number(calculateDateValue.split("-")[0]);

    if (!birthYear || !targetYear || birthYear > targetYear) return "";

    return targetYear - birthYear + 1 + " years old";
  }

  function ensureAgeResultElement() {
    let result = document.getElementById("ageResult");

    if (!result) {
      const calculator = document.querySelector(".calculator");

      if (!calculator) return null;

      result = document.createElement("h2");
      result.id = "ageResult";
      calculator.appendChild(result);
    }

    return result;
  }

  function getOrCreateAgeOutputPanel() {
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main");

    const calculator = main ? main.querySelector(".calculator") : null;

    if (!main || !calculator) return null;

    let panel = document.getElementById("universalLoanStyleOutput");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "universalLoanStyleOutput";
      panel.className = "loan-style-output-panel";
      panel.setAttribute("aria-label", "Age result table");

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

    return panel;
  }

  function makeAgeTable(birthdate, calculateDate, normalAge, asianAge) {
    return `
      <div class="loan-result-table-scroll">
        <table class="loan-result-table universal-loan-result-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Value</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Birthdate</td>
              <td>${birthdate}</td>
            </tr>

            <tr>
              <td>Date to calculate</td>
              <td>${calculateDate}</td>
            </tr>

            <tr>
              <td>Normal age</td>
              <td>${normalAge}</td>
            </tr>

            <tr>
              <td>Asian age</td>
              <td>${asianAge}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function copyAgeTable(panel, button) {
    const table = panel.querySelector("table");
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

    if (!text) return;

    function copied() {
      const oldText = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = oldText;
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

  function setupAgeCopyButton(panel) {
    const button = panel.querySelector(".loan-copy-btn");
    if (!button || button.dataset.ageDateTableCopyReady === "true") return;

    button.dataset.ageDateTableCopyReady = "true";

    button.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        copyAgeTable(panel, button);
      },
      true
    );
  }

  function calculateAgeWithTargetDate() {
    if (!isAgePage()) return;

    const birthdate = getDateInputValue("birthdate");
    const dateToCalculateInput = document.getElementById("dateToCalculate");
    const result = ensureAgeResultElement();
    const panel = getOrCreateAgeOutputPanel();

    if (!result || !panel) return;

    if (!birthdate) {
      result.innerText = "Please select your birthdate.";
      panel.hidden = true;
      return;
    }

    if (dateToCalculateInput && !dateToCalculateInput.value) {
      dateToCalculateInput.value = todayValue();
    }

    const calculateDate = getDateInputValue("dateToCalculate") || todayValue();

    const normalAge = calculateNormalAge(birthdate, calculateDate);
    const asianAge = calculateAsianAge(birthdate, calculateDate);

    if (!normalAge || !asianAge) {
      result.innerText = "Date to calculate must be after birthdate.";
      panel.hidden = true;
      return;
    }

    result.innerText =
      "Birthdate: " + birthdate + "\n" +
      "Date to calculate: " + calculateDate + "\n" +
      "Normal age: " + normalAge + "\n" +
      "Asian age: " + asianAge;

    result.style.display = "none";

    const body = panel.querySelector(".loan-result-body");
    if (body) {
      body.innerHTML = makeAgeTable(birthdate, calculateDate, normalAge, asianAge);
    }

    panel.hidden = false;
    setupAgeCopyButton(panel);
  }

  function startAgeDateToCalculate() {
    if (!isAgePage()) return;

    document.body.classList.add("age-page");
    document.body.dataset.page = "age";

    addDateToCalculateInput();

    const dateToCalculateInput = document.getElementById("dateToCalculate");
    if (dateToCalculateInput && !dateToCalculateInput.value) {
      dateToCalculateInput.value = todayValue();
    }

    window.calculateAge = calculateAgeWithTargetDate;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateAge")) {
          setTimeout(calculateAgeWithTargetDate, 0);
          setTimeout(calculateAgeWithTargetDate, 150);
        }
      },
      true
    );

    setTimeout(addDateToCalculateInput, 300);
    setTimeout(addDateToCalculateInput, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAgeDateToCalculate);
  } else {
    startAgeDateToCalculate();
  }
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
   BASIC + AGE: STABLE RESULT PANEL FIX
   Fixes result bar appearing for 1 second then disappearing
   - Basic result: = answer, no table
   - Age result: stable result table
===================================================== */
(function () {
  "use strict";

  const PANEL_ID = "stableBasicAgeOutput";

  function getPageType() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    if (title.includes("basic") || document.getElementById("display")) return "basic";
    if (title.includes("age") || document.getElementById("birthdate")) return "age";

    return "";
  }

  function todayValue() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getMain() {
    return document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
  }

  function getCalculator() {
    const main = getMain();
    return main ? main.querySelector(".calculator") : null;
  }

  function markPage() {
    const type = getPageType();

    if (type === "basic") {
      document.body.classList.add("basic-page", "stable-result-page");
      document.body.dataset.page = "basic";
    }

    if (type === "age") {
      document.body.classList.add("age-page", "stable-result-page");
      document.body.dataset.page = "age";
    }
  }

  function hideOldUniversalPanel() {
    const type = getPageType();
    if (type !== "basic" && type !== "age") return;

    const oldPanel = document.getElementById("universalLoanStyleOutput");

    if (oldPanel) {
      oldPanel.hidden = true;
      oldPanel.style.setProperty("display", "none", "important");
    }
  }

  function getStablePanel() {
    const calculator = getCalculator();
    if (!calculator) return null;

    let panel = document.getElementById(PANEL_ID);

    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.className = "stable-result-output";
      panel.setAttribute("aria-label", "Stable calculator result");

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

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  function setupCopy(panel, textGetter) {
    const button = panel.querySelector(".stable-copy-btn");
    if (!button) return;

    button.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();

      copyText(textGetter(), button);
    };
  }

  function renderBasicStableResult() {
    const display = document.getElementById("display");
    if (!display) return;

    const answer = String(display.value || "").trim();
    const panel = getStablePanel();

    if (!panel) return;

    if (!answer || answer === "Error") {
      panel.hidden = true;
      return;
    }

    const body = panel.querySelector(".stable-result-body");
    if (!body) return;

    body.innerHTML =
      '<div class="basic-stable-equal-result">' +
        '<span class="basic-stable-equal-symbol">=</span>' +
        '<span class="basic-stable-equal-answer">' + escapeHtml(answer) + '</span>' +
      '</div>';

    panel.hidden = false;

    setupCopy(panel, function () {
      return answer;
    });
  }

  function ensureDateToCalculateInput() {
    const birthdate = document.getElementById("birthdate");
    if (!birthdate) return null;

    let target = document.getElementById("dateToCalculate");

    if (!target) {
      const label = document.createElement("label");
      label.setAttribute("for", "dateToCalculate");
      label.textContent = "Date to calculate:";

      target = document.createElement("input");
      target.type = "date";
      target.id = "dateToCalculate";
      target.setAttribute("aria-label", "Date to calculate");

      birthdate.insertAdjacentElement("afterend", target);
      target.insertAdjacentElement("beforebegin", label);
    }

    if (!target.value) {
      target.value = todayValue();
    }

    return target;
  }

  function calculateNormalAge(birthdateValue, targetValue) {
    const birth = new Date(birthdateValue + "T00:00:00");
    const target = new Date(targetValue + "T00:00:00");

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

  function calculateAsianAge(birthdateValue, targetValue) {
    const birthYear = Number(birthdateValue.split("-")[0]);
    const targetYear = Number(targetValue.split("-")[0]);

    if (!birthYear || !targetYear || birthYear > targetYear) return "";

    return targetYear - birthYear + 1;
  }

  function renderAgeStableResult() {
    const birthdateInput = document.getElementById("birthdate");
    const targetInput = ensureDateToCalculateInput();
    const panel = getStablePanel();

    if (!birthdateInput || !targetInput || !panel) return;

    const birthdate = String(birthdateInput.value || "").trim();

    if (!birthdate) {
      panel.hidden = true;
      return;
    }

    if (!targetInput.value) {
      targetInput.value = todayValue();
    }

    const targetDate = String(targetInput.value || "").trim();
    const normalAge = calculateNormalAge(birthdate, targetDate);
    const asianAge = calculateAsianAge(birthdate, targetDate);

    if (normalAge === "" || asianAge === "") {
      panel.hidden = true;
      return;
    }

    const body = panel.querySelector(".stable-result-body");
    if (!body) return;

    body.innerHTML =
      '<div class="loan-result-table-scroll">' +
        '<table class="loan-result-table stable-age-result-table">' +
          '<thead>' +
            '<tr><th>Item</th><th>Value</th></tr>' +
          '</thead>' +
          '<tbody>' +
            '<tr><td>Birthdate</td><td>' + escapeHtml(birthdate) + '</td></tr>' +
            '<tr><td>Date to calculate</td><td>' + escapeHtml(targetDate) + '</td></tr>' +
            '<tr><td>Normal age</td><td>' + normalAge + ' years old</td></tr>' +
            '<tr><td>Asian age</td><td>' + asianAge + ' years old</td></tr>' +
          '</tbody>' +
        '</table>' +
      '</div>';

    panel.hidden = false;

    setupCopy(panel, function () {
      return (
        "Item\tValue\n" +
        "Birthdate\t" + birthdate + "\n" +
        "Date to calculate\t" + targetDate + "\n" +
        "Normal age\t" + normalAge + " years old\n" +
        "Asian age\t" + asianAge + " years old"
      );
    });

    const result = document.getElementById("result") || document.getElementById("ageResult");
    if (result) {
      result.style.display = "none";
    }
  }

  function renderStableResult() {
    const type = getPageType();

    if (type !== "basic" && type !== "age") return;

    markPage();
    hideOldUniversalPanel();

    if (type === "basic") {
      renderBasicStableResult();
    }

    if (type === "age") {
      renderAgeStableResult();
    }
  }

  function startStableResultFix() {
    const type = getPageType();
    if (type !== "basic" && type !== "age") return;

    markPage();

    if (type === "age") {
      ensureDateToCalculateInput();
    }

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();

        if (
          text === "=" ||
          text.includes("calculate") ||
          text.includes("age")
        ) {
          setTimeout(renderStableResult, 0);
          setTimeout(renderStableResult, 200);
          setTimeout(renderStableResult, 500);
          setTimeout(renderStableResult, 900);
        }

        if (text.includes("clear") || text === "ac") {
          const panel = document.getElementById(PANEL_ID);
          if (panel) panel.hidden = true;

          hideOldUniversalPanel();
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter" || event.key === "=") {
          setTimeout(renderStableResult, 0);
          setTimeout(renderStableResult, 200);
          setTimeout(renderStableResult, 500);
          setTimeout(renderStableResult, 900);
        }
      },
      true
    );

    setTimeout(hideOldUniversalPanel, 300);
    setTimeout(renderStableResult, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startStableResultFix);
  } else {
    startStableResultFix();
  }
})();
/* =====================================================
   AGE CALCULATOR ONLY: result in bullet form
   Replaces age result table with bullet list
===================================================== */
(function () {
  "use strict";

  const PANEL_ID = "stableBasicAgeOutput";

  function isAgePage() {
    return (
      document.body.classList.contains("age-page") ||
      document.body.dataset.page === "age" ||
      !!document.getElementById("birthdate")
    );
  }

  function todayValue() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getMain() {
    return document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
  }

  function getCalculator() {
    const main = getMain();
    return main ? main.querySelector(".calculator") : null;
  }

  function ensureDateToCalculateInput() {
    const birthdate = document.getElementById("birthdate");
    if (!birthdate) return null;

    let target = document.getElementById("dateToCalculate");

    if (!target) {
      const label = document.createElement("label");
      label.setAttribute("for", "dateToCalculate");
      label.textContent = "Date to calculate:";

      target = document.createElement("input");
      target.type = "date";
      target.id = "dateToCalculate";
      target.setAttribute("aria-label", "Date to calculate");

      birthdate.insertAdjacentElement("afterend", target);
      target.insertAdjacentElement("beforebegin", label);
    }

    if (!target.value) {
      target.value = todayValue();
    }

    return target;
  }

  function calculateNormalAge(birthdateValue, targetValue) {
    const birth = new Date(birthdateValue + "T00:00:00");
    const target = new Date(targetValue + "T00:00:00");

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

  function calculateAsianAge(birthdateValue, targetValue) {
    const birthYear = Number(birthdateValue.split("-")[0]);
    const targetYear = Number(targetValue.split("-")[0]);

    if (!birthYear || !targetYear || birthYear > targetYear) return "";

    return targetYear - birthYear + 1;
  }

  function getOrCreateAgeBulletPanel() {
    const calculator = getCalculator();
    if (!calculator) return null;

    let panel = document.getElementById(PANEL_ID);

    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.className = "stable-result-output age-bullet-output";
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

    panel.classList.add("age-bullet-output");

    return panel;
  }

  function hideOldAgePanels() {
    const oldPanel = document.getElementById("universalLoanStyleOutput");

    if (oldPanel) {
      oldPanel.hidden = true;
      oldPanel.style.setProperty("display", "none", "important");
    }

    const result = document.getElementById("result") || document.getElementById("ageResult");

    if (result) {
      result.style.display = "none";
    }
  }

  function copyText(text, button) {
    if (!text) return;

    function copied() {
      const oldText = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = oldText;
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

  function renderAgeBulletResult() {
    if (!isAgePage()) return;

    document.body.classList.add("age-page", "stable-result-page");
    document.body.dataset.page = "age";

    const birthdateInput = document.getElementById("birthdate");
    const targetInput = ensureDateToCalculateInput();
    const panel = getOrCreateAgeBulletPanel();

    if (!birthdateInput || !targetInput || !panel) return;

    const birthdate = String(birthdateInput.value || "").trim();

    if (!birthdate) {
      panel.hidden = true;
      return;
    }

    if (!targetInput.value) {
      targetInput.value = todayValue();
    }

    const targetDate = String(targetInput.value || "").trim();

    const normalAge = calculateNormalAge(birthdate, targetDate);
    const asianAge = calculateAsianAge(birthdate, targetDate);

    if (normalAge === "" || asianAge === "") {
      panel.hidden = true;
      return;
    }

    hideOldAgePanels();

    const body = panel.querySelector(".stable-result-body");
    if (!body) return;

    body.innerHTML =
      '<ul class="age-bullet-result">' +
        '<li><strong>Birthdate:</strong> ' + escapeHtml(birthdate) + '</li>' +
        '<li><strong>Date to calculate:</strong> ' + escapeHtml(targetDate) + '</li>' +
        '<li><strong>Normal age:</strong> ' + normalAge + ' years old</li>' +
        '<li><strong>Asian age:</strong> ' + asianAge + ' years old</li>' +
      '</ul>';

    panel.hidden = false;

    const copyBtn = panel.querySelector(".stable-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        copyText(
          "• Birthdate: " + birthdate + "\n" +
          "• Date to calculate: " + targetDate + "\n" +
          "• Normal age: " + normalAge + " years old\n" +
          "• Asian age: " + asianAge + " years old",
          copyBtn
        );
      };
    }
  }

  function startAgeBulletResult() {
    if (!isAgePage()) return;

    ensureDateToCalculateInput();

    /*
      This overrides older calculateAge code.
      Important: remove old inline script from age-calculator.html if it still exists.
    */
    window.calculateAge = function () {
      renderAgeBulletResult();
    };

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || onclick.includes("calculateAge")) {
          setTimeout(renderAgeBulletResult, 0);
          setTimeout(renderAgeBulletResult, 200);
          setTimeout(renderAgeBulletResult, 600);
          setTimeout(renderAgeBulletResult, 1000);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          setTimeout(renderAgeBulletResult, 0);
          setTimeout(renderAgeBulletResult, 200);
          setTimeout(renderAgeBulletResult, 600);
        }
      },
      true
    );

    setTimeout(hideOldAgePanels, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAgeBulletResult);
  } else {
    startAgeBulletResult();
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
   BMI CALCULATOR: INPUT HISTORY + POINT RESULT FORM
   - History title = Input
   - History removes BMI / BMI status / W/H ratio / condition
   - Result box uses bullet/point form
===================================================== */
(function () {
  "use strict";

  const HISTORY_KEY = "bmiInputHistoryOnlyFinal";
  const MAX_ITEMS = 50;
  const PANEL_ID = "stableBmiOutput";

  function isBmiPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      title.includes("bmi") ||
      !!document.getElementById("bmiResult")
    );
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function getNumber(ids) {
    for (const id of ids) {
      const value = getValue(id).replace(/,/g, "");
      const num = Number(value);

      if (Number.isFinite(num)) {
        return num;
      }
    }

    return NaN;
  }

  function getText(ids) {
    for (const id of ids) {
      const value = getValue(id);

      if (value) return value;
    }

    return "";
  }

  function getUnitText() {
    const unit =
      getText(["unit", "bmiUnit", "bmiUnits", "unitSelect"]) ||
      document.body.dataset.bmiUnit ||
      "";

    return unit.toLowerCase();
  }

  function isUsUnit(weight, height) {
    const unit = getUnitText();

    return (
      unit.includes("us") ||
      unit.includes("imperial") ||
      unit.includes("lb") ||
      unit.includes("inch") ||
      height > 3
    );
  }

  function calculateBmiStatus(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }

  function calculateWhCondition(ratio) {
    if (!Number.isFinite(ratio)) return "-";

    if (ratio < 0.4) return "Very low";
    if (ratio < 0.5) return "Healthy";
    if (ratio < 0.6) return "Moderate risk";
    return "High risk";
  }

  function getBmiInputs() {
    const weight = getNumber(["weight", "bmiWeight"]);
    const height = getNumber(["height", "bmiHeight"]);
    const waist = getNumber(["waist", "waistSize", "bmiWaist"]);

    return {
      weight: weight,
      height: height,
      waist: waist,
      usUnit: isUsUnit(weight, height)
    };
  }

  function calculateBmiData() {
    const data = getBmiInputs();

    if (
      !Number.isFinite(data.weight) ||
      !Number.isFinite(data.height) ||
      data.weight <= 0 ||
      data.height <= 0
    ) {
      return null;
    }

    let bmi;

    if (data.usUnit) {
      bmi = 703 * data.weight / (data.height * data.height);
    } else {
      bmi = data.weight / (data.height * data.height);
    }

    let whRatio = NaN;

    if (Number.isFinite(data.waist) && data.waist > 0) {
      whRatio = data.waist / data.height;
    }

    return {
      weight: data.weight,
      height: data.height,
      waist: data.waist,
      unitLabel: data.usUnit ? "US" : "SI",
      bmi: bmi,
      bmiStatus: calculateBmiStatus(bmi),
      whRatio: whRatio,
      condition: calculateWhCondition(whRatio)
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

    function done() {
      const old = button.textContent;
      button.textContent = "copied";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
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

  function renameHistoryTitle() {
    const title =
      document.querySelector(".bmi-history-box .bmi-history-top h3") ||
      document.querySelector(".bmi-history-box h3");

    if (title) {
      title.textContent = "Input";
    }
  }

  function renderBmiInputHistory() {
    if (!isBmiPage()) return;

    const list = document.getElementById("bmiHistoryList");
    if (!list) return;

    const history = loadHistory();

    list.innerHTML = "";

    history.slice().reverse().forEach(function (item) {
      const waistText =
        item.waist && item.waist !== "-"
          ? "<br><strong>Waist:</strong> " + item.waist
          : "";

      const copyValue =
        "Weight: " + item.weight + "\n" +
        "Height: " + item.height + "\n" +
        (item.waist && item.waist !== "-" ? "Waist: " + item.waist + "\n" : "") +
        "Unit: " + item.unit;

      const li = document.createElement("li");
      li.className = "history-item bmi-input-only-history-item";

      const text = document.createElement("span");
      text.className = "history-text";
      text.innerHTML =
        "<strong>Weight:</strong> " + item.weight + "<br>" +
        "<strong>Height:</strong> " + item.height +
        waistText + "<br>" +
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

  function addBmiInputHistory(data) {
    if (!data) return;

    const history = loadHistory();

    const item = {
      weight: String(data.weight),
      height: String(data.height),
      waist: Number.isFinite(data.waist) ? String(data.waist) : "-",
      unit: data.unitLabel
    };

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
    renderBmiInputHistory();
  }

  function clearBmiInputHistory() {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem("bmiHistory");
    localStorage.removeItem("inputHistory_bmi");

    renderBmiInputHistory();

    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.hidden = true;

    const oldPanel = document.getElementById("universalLoanStyleOutput");
    if (oldPanel) oldPanel.hidden = true;
  }

  function getMain() {
    return document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
  }

  function getCalculator() {
    const main = getMain();
    return main ? main.querySelector(".calculator") : null;
  }

  function getOrCreateBmiResultPanel() {
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

  function hideOldBmiResult() {
    const result = document.getElementById("bmiResult") || document.getElementById("result");

    if (result) {
      result.style.display = "none";
    }

    const oldPanel = document.getElementById("universalLoanStyleOutput");

    if (oldPanel) {
      oldPanel.hidden = true;
      oldPanel.style.setProperty("display", "none", "important");
    }
  }

  function renderBmiPointResult(data) {
    if (!data) return;

    const panel = getOrCreateBmiResultPanel();
    if (!panel) return;

    const body = panel.querySelector(".stable-result-body");
    if (!body) return;

    const whRatioText = Number.isFinite(data.whRatio)
      ? data.whRatio.toFixed(2)
      : "-";

    body.innerHTML =
      '<ul class="bmi-point-result">' +
        '<li><strong>BMI:</strong> ' + data.bmi.toFixed(2) + '</li>' +
        '<li><strong>BMI status:</strong> ' + data.bmiStatus + '</li>' +
        '<li><strong>W/H ratio:</strong> ' + whRatioText + '</li>' +
        '<li><strong>Condition:</strong> ' + data.condition + '</li>' +
      '</ul>';

    panel.hidden = false;
    hideOldBmiResult();

    const copyBtn = panel.querySelector(".stable-copy-btn");

    if (copyBtn) {
      copyBtn.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        copyText(
          "• BMI: " + data.bmi.toFixed(2) + "\n" +
          "• BMI status: " + data.bmiStatus + "\n" +
          "• W/H ratio: " + whRatioText + "\n" +
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

    renameHistoryTitle();

    const data = calculateBmiData();
    const result = document.getElementById("bmiResult") || document.getElementById("result");

    if (!data) {
      if (result) {
        result.style.display = "block";
        result.innerText = "Please enter valid weight and height.";
      }

      const panel = document.getElementById(PANEL_ID);
      if (panel) panel.hidden = true;

      return;
    }

    if (result) {
      result.innerText =
        "BMI: " + data.bmi.toFixed(2) + "\n" +
        "BMI status: " + data.bmiStatus + "\n" +
        "W/H ratio: " + (Number.isFinite(data.whRatio) ? data.whRatio.toFixed(2) : "-") + "\n" +
        "Condition: " + data.condition;
      result.style.display = "none";
    }

    addBmiInputHistory(data);
    renderBmiPointResult(data);
  }

  function startBmiInputAndResultFix() {
    if (!isBmiPage()) return;

    document.body.classList.add("bmi-page");
    document.body.dataset.page = "bmi";

    renameHistoryTitle();
    renderBmiInputHistory();

    window.calculateBMI = calculateBmiFinal;
    window.clearBMIHistory = clearBmiInputHistory;
    window.clearBmiHistory = clearBmiInputHistory;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || text.includes("bmi") || onclick.includes("calculateBMI")) {
          setTimeout(calculateBmiFinal, 0);
          setTimeout(calculateBmiFinal, 200);
          setTimeout(calculateBmiFinal, 600);
        }

        if (text.includes("clear")) {
          setTimeout(clearBmiInputHistory, 0);
          setTimeout(clearBmiInputHistory, 200);
        }
      },
      true
    );

    setTimeout(renameHistoryTitle, 300);
    setTimeout(renderBmiInputHistory, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBmiInputAndResultFix);
  } else {
    startBmiInputAndResultFix();
  }
})();
/* =====================================================
   BMI CALCULATOR: INPUT HISTORY WITH UNITS
   - Weight includes kg/lb
   - Height includes m/in
   - Waist includes m/in
   - History title remains Input
===================================================== */
(function () {
  "use strict";

  const HISTORY_KEY = "bmiInputHistoryOnlyFinal";
  const MAX_ITEMS = 50;

  function isBmiPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      title.includes("bmi") ||
      !!document.getElementById("bmiResult")
    );
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function getNumber(ids) {
    for (const id of ids) {
      const value = getValue(id).replace(/,/g, "");
      const num = Number(value);

      if (Number.isFinite(num)) return num;
    }

    return NaN;
  }

  function getText(ids) {
    for (const id of ids) {
      const value = getValue(id);
      if (value) return value;
    }

    return "";
  }

  function getUnitText() {
    return (
      getText(["unit", "bmiUnit", "bmiUnits", "unitSelect"]) ||
      document.body.dataset.bmiUnit ||
      ""
    ).toLowerCase();
  }

  function isUsUnit(weight, height) {
    const unit = getUnitText();

    return (
      unit.includes("us") ||
      unit.includes("imperial") ||
      unit.includes("lb") ||
      unit.includes("inch") ||
      height > 3
    );
  }

  function getUnitLabels(data) {
    if (data.usUnit) {
      return {
        weight: "lb",
        height: "in",
        waist: "in",
        unit: "US"
      };
    }

    return {
      weight: "kg",
      height: "m",
      waist: "m",
      unit: "SI"
    };
  }

  function getBmiInputData() {
    const weight = getNumber(["weight", "bmiWeight"]);
    const height = getNumber(["height", "bmiHeight"]);
    const waist = getNumber(["waist", "waistSize", "bmiWaist"]);

    const data = {
      weight: weight,
      height: height,
      waist: waist,
      usUnit: isUsUnit(weight, height)
    };

    data.units = getUnitLabels(data);

    return data;
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

    function done() {
      const old = button.textContent;
      button.textContent = "copied";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
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

  function renameBmiHistoryTitle() {
    const title =
      document.querySelector(".bmi-history-box .bmi-history-top h3") ||
      document.querySelector(".bmi-history-box h3");

    if (title) {
      title.textContent = "Input";
    }
  }

  function renderBmiInputHistoryWithUnits() {
    if (!isBmiPage()) return;

    const list = document.getElementById("bmiHistoryList");
    if (!list) return;

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
        copyText(copyValue, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function addBmiInputHistoryWithUnits() {
    if (!isBmiPage()) return;

    const data = getBmiInputData();

    if (
      !Number.isFinite(data.weight) ||
      !Number.isFinite(data.height) ||
      data.weight <= 0 ||
      data.height <= 0
    ) {
      return;
    }

    const item = {
      weight: String(data.weight),
      height: String(data.height),
      waist: Number.isFinite(data.waist) && data.waist > 0 ? String(data.waist) : "-",
      weightUnit: data.units.weight,
      heightUnit: data.units.height,
      waistUnit: data.units.waist,
      unit: data.units.unit
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
    renderBmiInputHistoryWithUnits();
  }

  function clearBmiInputHistoryWithUnits() {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem("bmiHistory");
    localStorage.removeItem("inputHistory_bmi");

    renderBmiInputHistoryWithUnits();

    const panel = document.getElementById("stableBmiOutput");
    if (panel) panel.hidden = true;

    const oldPanel = document.getElementById("universalLoanStyleOutput");
    if (oldPanel) oldPanel.hidden = true;
  }

  function startBmiInputUnitsHistory() {
    if (!isBmiPage()) return;

    document.body.classList.add("bmi-page");
    document.body.dataset.page = "bmi";

    renameBmiHistoryTitle();
    renderBmiInputHistoryWithUnits();

    window.clearBMIHistory = clearBmiInputHistoryWithUnits;
    window.clearBmiHistory = clearBmiInputHistoryWithUnits;

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || text.includes("bmi") || onclick.includes("calculateBMI")) {
          setTimeout(addBmiInputHistoryWithUnits, 0);
          setTimeout(addBmiInputHistoryWithUnits, 200);
          setTimeout(renderBmiInputHistoryWithUnits, 600);
        }

        if (text.includes("clear")) {
          setTimeout(clearBmiInputHistoryWithUnits, 0);
          setTimeout(clearBmiInputHistoryWithUnits, 200);
        }
      },
      true
    );

    setTimeout(renameBmiHistoryTitle, 300);
    setTimeout(renderBmiInputHistoryWithUnits, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBmiInputUnitsHistory);
  } else {
    startBmiInputUnitsHistory();
  }
})();
/* =====================================================
   BMI CALCULATOR: FIX UNDEFINED UNITS IN INPUT HISTORY
   - Removes "undefined" from history box
   - Adds default unit labels to old saved history
===================================================== */
(function () {
  "use strict";

  const HISTORY_KEY = "bmiInputHistoryOnlyFinal";

  function isBmiPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      title.includes("bmi") ||
      !!document.getElementById("bmiHistoryList")
    );
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function getCurrentUnitType() {
    const unitText =
      getValue("unit") ||
      getValue("bmiUnit") ||
      getValue("bmiUnits") ||
      getValue("unitSelect") ||
      document.body.dataset.bmiUnit ||
      "";

    const lower = unitText.toLowerCase();

    if (
      lower.includes("us") ||
      lower.includes("imperial") ||
      lower.includes("lb") ||
      lower.includes("inch")
    ) {
      return "US";
    }

    return "SI";
  }

  function unitLabels(unit) {
    if (unit === "US") {
      return {
        weightUnit: "lb",
        heightUnit: "in",
        waistUnit: "in",
        unit: "US"
      };
    }

    return {
      weightUnit: "kg",
      heightUnit: "m",
      waistUnit: "m",
      unit: "SI"
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
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-50)));
    } catch {
      /* ignore */
    }
  }

  function normalizeHistoryItem(item) {
    const fallbackUnit = item && item.unit ? item.unit : getCurrentUnitType();
    const labels = unitLabels(fallbackUnit);

    return {
      weight: item && item.weight ? item.weight : "-",
      height: item && item.height ? item.height : "-",
      waist: item && item.waist ? item.waist : "-",

      weightUnit: item && item.weightUnit ? item.weightUnit : labels.weightUnit,
      heightUnit: item && item.heightUnit ? item.heightUnit : labels.heightUnit,
      waistUnit: item && item.waistUnit ? item.waistUnit : labels.waistUnit,
      unit: item && item.unit ? item.unit : labels.unit
    };
  }

  function copyText(text, button) {
    if (!text) return;

    function done() {
      const old = button.textContent;
      button.textContent = "copied";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
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

  function renderFixedBmiHistory() {
    if (!isBmiPage()) return;

    const list = document.getElementById("bmiHistoryList");
    if (!list) return;

    const title =
      document.querySelector(".bmi-history-box .bmi-history-top h3") ||
      document.querySelector(".bmi-history-box h3");

    if (title) {
      title.textContent = "Input";
    }

    const history = loadHistory().map(normalizeHistoryItem);
    saveHistory(history);

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
        copyText(copyValue, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function startFixUndefinedBmiUnits() {
    if (!isBmiPage()) return;

    renderFixedBmiHistory();

    document.addEventListener(
      "click",
      function () {
        setTimeout(renderFixedBmiHistory, 300);
        setTimeout(renderFixedBmiHistory, 800);
      },
      true
    );

    setTimeout(renderFixedBmiHistory, 500);
    setTimeout(renderFixedBmiHistory, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startFixUndefinedBmiUnits);
  } else {
    startFixUndefinedBmiUnits();
  }
})();
/* =====================================================
   BMI CALCULATOR: FIX SI + US UNITS IN INPUT HISTORY
   - Does not assume height > 3 means US
   - SI supports kg / cm or kg / m
   - US supports lb / in
===================================================== */
(function () {
  "use strict";

  const HISTORY_KEY = "bmiInputHistoryOnlyFinal";
  const MAX_ITEMS = 50;

  function isBmiPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      title.includes("bmi") ||
      !!document.getElementById("bmiHistoryList")
    );
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function getNumber(ids) {
    for (const id of ids) {
      const value = getValue(id).replace(/,/g, "");
      const num = Number(value);

      if (Number.isFinite(num)) return num;
    }

    return NaN;
  }

  function pageText() {
    const calculator = document.querySelector(".calculator");
    return calculator ? calculator.textContent.toLowerCase() : "";
  }

  function getBmiUnitType() {
    const explicitUnit = (
      getValue("unit") + " " +
      getValue("bmiUnit") + " " +
      getValue("bmiUnits") + " " +
      getValue("unitSelect") + " " +
      (document.body.dataset.bmiUnit || "") + " " +
      pageText()
    ).toLowerCase();

    if (
      explicitUnit.includes("us") ||
      explicitUnit.includes("imperial") ||
      explicitUnit.includes("lb") ||
      explicitUnit.includes("inch") ||
      explicitUnit.includes(" in")
    ) {
      return "US";
    }

    if (
      explicitUnit.includes("si") ||
      explicitUnit.includes("metric") ||
      explicitUnit.includes("kg") ||
      explicitUnit.includes("cm") ||
      explicitUnit.includes("meter") ||
      explicitUnit.includes("metre")
    ) {
      return "SI";
    }

    return "SI";
  }

  function getUnitLabels(weight, height, waist) {
    const unitType = getBmiUnitType();

    if (unitType === "US") {
      return {
        weightUnit: "lb",
        heightUnit: "in",
        waistUnit: "in",
        unit: "US"
      };
    }

    return {
      weightUnit: "kg",
      heightUnit: height > 3 ? "cm" : "m",
      waistUnit: waist > 3 ? "cm" : "m",
      unit: "SI"
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

    function done() {
      const old = button.textContent;
      button.textContent = "copied";

      setTimeout(function () {
        button.textContent = old;
      }, 1000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
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

  function normalizeHistoryItem(item) {
    const weight = item && item.weight ? item.weight : "-";
    const height = item && item.height ? item.height : "-";
    const waist = item && item.waist ? item.waist : "-";

    const labels = getUnitLabels(Number(weight), Number(height), Number(waist));

    return {
      weight: weight,
      height: height,
      waist: waist,
      weightUnit: item && item.weightUnit && item.weightUnit !== "undefined" ? item.weightUnit : labels.weightUnit,
      heightUnit: item && item.heightUnit && item.heightUnit !== "undefined" ? item.heightUnit : labels.heightUnit,
      waistUnit: item && item.waistUnit && item.waistUnit !== "undefined" ? item.waistUnit : labels.waistUnit,
      unit: item && item.unit && item.unit !== "undefined" ? item.unit : labels.unit
    };
  }

  function addBmiInputHistoryWithCorrectUnits() {
    if (!isBmiPage()) return;

    const weight = getNumber(["weight", "bmiWeight"]);
    const height = getNumber(["height", "bmiHeight"]);
    const waist = getNumber(["waist", "waistSize", "bmiWaist"]);

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(height) ||
      weight <= 0 ||
      height <= 0
    ) {
      return;
    }

    const labels = getUnitLabels(weight, height, waist);

    const item = {
      weight: String(weight),
      height: String(height),
      waist: Number.isFinite(waist) && waist > 0 ? String(waist) : "-",
      weightUnit: labels.weightUnit,
      heightUnit: labels.heightUnit,
      waistUnit: labels.waistUnit,
      unit: labels.unit
    };

    const history = loadHistory().map(normalizeHistoryItem);
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
    renderBmiInputHistoryCorrectUnits();
  }

  function renderBmiInputHistoryCorrectUnits() {
    if (!isBmiPage()) return;

    const list = document.getElementById("bmiHistoryList");
    if (!list) return;

    const title =
      document.querySelector(".bmi-history-box .bmi-history-top h3") ||
      document.querySelector(".bmi-history-box h3");

    if (title) {
      title.textContent = "Input";
    }

    const history = loadHistory().map(normalizeHistoryItem);
    saveHistory(history);

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
        copyText(copyValue, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function clearBmiInputHistoryCorrectUnits() {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem("bmiHistory");
    localStorage.removeItem("inputHistory_bmi");

    renderBmiInputHistoryCorrectUnits();
  }

  function startBmiCorrectUnits() {
    if (!isBmiPage()) return;

    document.body.classList.add("bmi-page");
    document.body.dataset.page = "bmi";

    window.clearBMIHistory = clearBmiInputHistoryCorrectUnits;
    window.clearBmiHistory = clearBmiInputHistoryCorrectUnits;

    renderBmiInputHistoryCorrectUnits();

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (text.includes("calculate") || text.includes("bmi") || onclick.includes("calculateBMI")) {
          setTimeout(addBmiInputHistoryWithCorrectUnits, 0);
          setTimeout(addBmiInputHistoryWithCorrectUnits, 200);
          setTimeout(renderBmiInputHistoryCorrectUnits, 600);
        }

        if (text.includes("clear")) {
          setTimeout(clearBmiInputHistoryCorrectUnits, 0);
        }
      },
      true
    );

    setTimeout(renderBmiInputHistoryCorrectUnits, 500);
    setTimeout(renderBmiInputHistoryCorrectUnits, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBmiCorrectUnits);
  } else {
    startBmiCorrectUnits();
  }
})();
/* =====================================================
   BMI CALCULATOR: USE SI/US BUTTON AS UNIT INDICATOR
   - Reads #unitToggleBtn
   - If current mode is SI: kg / cm
   - If current mode is US: lb / in
   - Fixes wrong US unit in BMI input history
===================================================== */
(function () {
  "use strict";

  const HISTORY_KEY = "bmiInputHistoryOnlyFinal";
  const MAX_ITEMS = 50;

  function isBmiPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    return (
      document.body.classList.contains("bmi-page") ||
      document.body.dataset.page === "bmi" ||
      title.includes("bmi") ||
      !!document.getElementById("bmiHistoryList")
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

  function getButtonText() {
    const btn = document.getElementById("unitToggleBtn");
    if (!btn) return "";

    return (
      btn.textContent + " " +
      btn.value + " " +
      (btn.dataset.unit || "") + " " +
      (btn.dataset.currentUnit || "") + " " +
      (btn.getAttribute("aria-label") || "")
    ).toLowerCase();
  }

  function getCurrentBmiUnit() {
    const btn = document.getElementById("unitToggleBtn");

    if (btn) {
      const text = getButtonText();

      /*
        If your button shows CURRENT mode:
        SI = SI mode
        US = US mode
      */
      if (text.trim() === "si" || text.includes("current si") || text.includes("mode si")) {
        return "SI";
      }

      if (text.trim() === "us" || text.includes("current us") || text.includes("mode us")) {
        return "US";
      }

      /*
        If your button says "Switch to US",
        current mode is SI.
      */
      if (text.includes("switch to us") || text.includes("change to us")) {
        return "SI";
      }

      /*
        If your button says "Switch to SI",
        current mode is US.
      */
      if (text.includes("switch to si") || text.includes("change to si")) {
        return "US";
      }

      /*
        If button contains only one clear unit word.
      */
      if (text.includes("si") && !text.includes("us")) {
        return "SI";
      }

      if (text.includes("us") && !text.includes("si")) {
        return "US";
      }

      /*
        Class fallback.
      */
      if (
        btn.classList.contains("si") ||
        btn.classList.contains("si-mode") ||
        btn.classList.contains("metric")
      ) {
        return "SI";
      }

      if (
        btn.classList.contains("us") ||
        btn.classList.contains("us-mode") ||
        btn.classList.contains("imperial")
      ) {
        return "US";
      }
    }

    /*
      Body fallback.
    */
    if (
      document.body.classList.contains("us-unit") ||
      document.body.classList.contains("us-mode") ||
      document.body.dataset.bmiUnit === "us"
    ) {
      return "US";
    }

    return "SI";
  }

  function getUnits() {
    const currentUnit = getCurrentBmiUnit();

    if (currentUnit === "US") {
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

  function normalizeItem(item) {
    const units = getUnits();

    return {
      weight: item && item.weight ? item.weight : "-",
      height: item && item.height ? item.height : "-",
      waist: item && item.waist ? item.waist : "-",
      unit: item && item.unit && item.unit !== "undefined" ? item.unit : units.unit,
      weightUnit: item && item.weightUnit && item.weightUnit !== "undefined" ? item.weightUnit : units.weightUnit,
      heightUnit: item && item.heightUnit && item.heightUnit !== "undefined" ? item.heightUnit : units.heightUnit,
      waistUnit: item && item.waistUnit && item.waistUnit !== "undefined" ? item.waistUnit : units.waistUnit
    };
  }

  function renderBmiHistoryUsingButtonUnit() {
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
        copyText(copyValue, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function addBmiHistoryUsingButtonUnit() {
    if (!isBmiPage()) return;

    const weight = getNumber(["weight", "bmiWeight"]);
    const height = getNumber(["height", "bmiHeight"]);
    const waist = getNumber(["waist", "waistSize", "bmiWaist"]);

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(height) ||
      weight <= 0 ||
      height <= 0
    ) {
      return;
    }

    const units = getUnits();

    const item = {
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
      last.weight !== item.weight ||
      last.height !== item.height ||
      last.waist !== item.waist ||
      last.unit !== item.unit
    ) {
      history.push(item);
    }

    saveHistory(history);
    renderBmiHistoryUsingButtonUnit();
  }

  function clearBmiHistoryUsingButtonUnit() {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem("bmiHistory");
    localStorage.removeItem("inputHistory_bmi");

    renderBmiHistoryUsingButtonUnit();
  }

  function startBmiButtonUnitHistory() {
    if (!isBmiPage()) return;

    document.body.classList.add("bmi-page");
    document.body.dataset.page = "bmi";

    window.clearBMIHistory = clearBmiHistoryUsingButtonUnit;
    window.clearBmiHistory = clearBmiHistoryUsingButtonUnit;

    renderBmiHistoryUsingButtonUnit();

    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button");
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const onclick = button.getAttribute("onclick") || "";

        if (
          text.includes("calculate") ||
          onclick.includes("calculateBMI")
        ) {
          setTimeout(addBmiHistoryUsingButtonUnit, 0);
          setTimeout(addBmiHistoryUsingButtonUnit, 200);
          setTimeout(renderBmiHistoryUsingButtonUnit, 600);
        }

        if (button.id === "unitToggleBtn") {
          setTimeout(renderBmiHistoryUsingButtonUnit, 100);
          setTimeout(renderBmiHistoryUsingButtonUnit, 400);
        }

        if (text.includes("clear")) {
          setTimeout(clearBmiHistoryUsingButtonUnit, 0);
        }
      },
      true
    );

    setTimeout(renderBmiHistoryUsingButtonUnit, 500);
    setTimeout(renderBmiHistoryUsingButtonUnit, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBmiButtonUnitHistory);
  } else {
    startBmiButtonUnitHistory();
  }
})();