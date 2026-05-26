
/*
  Copyright © 2026 Hamdi. All rights reserved.
  Clean shared calculator script
  - Basic calculator stays as keypad calculator
  - All other calculators auto-calculate and save report-style history
*/
(function () {
  "use strict";

  const MAX_HISTORY_ITEMS = 50;
  const REPORT_TYPES = ["age", "bmi", "loan", "discount", "percentage", "compound"];
  let autoTimer = null;
  let isAutoRunning = false;

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.from((root || document).querySelectorAll(selector)); }
  function has(id) { return !!document.getElementById(id); }
  function byId(id) { return document.getElementById(id); }
  function lower(value) { return String(value || "").replace(/\s+/g, " ").trim().toLowerCase(); }
  function cleanText(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
  function pageTitle() { const h1 = $("h1"); return lower(h1 ? h1.textContent : ""); }
  function pathName() { return lower(window.location.pathname); }

  function safeGet(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch { return fallback; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } }
  function safeRemove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
  function loadArray(key) { try { const v = JSON.parse(safeGet(key, "[]")); return Array.isArray(v) ? v : []; } catch { return []; } }
  function saveArray(key, arr) { safeSet(key, JSON.stringify(arr.slice(-MAX_HISTORY_ITEMS))); }

  function numberFromString(value) {
    const n = Number(String(value || "").replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : NaN;
  }
  function numberValue(id) { const el = byId(id); return el ? numberFromString(el.value) : NaN; }
  function stringValue(id) { const el = byId(id); return el ? String(el.value || "").trim() : ""; }
  function firstInput(ids) { for (const id of ids) { const el = byId(id); if (el) return el; } return null; }
  function firstValue(ids) { for (const id of ids) { const v = stringValue(id); if (v) return v; } return ""; }
  function firstNumber(ids) { for (const id of ids) { const n = numberValue(id); if (Number.isFinite(n)) return n; } return NaN; }
  function money(value) { return Number(value).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function moneyRM(value) { const n = numberFromString(value); return Number.isFinite(n) ? "RM " + money(n) : (value || "-"); }
  function escapeHtml(value) { return String(value || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;"); }

  function getPageType() {
    const title = pageTitle();
    const path = pathName();
    if (has("display") || $(".basic-grid") || $(".scientific-grid") || title.includes("basic")) return "basic";
    if (path.includes("age") || has("birthdate") || has("ageHistoryList") || title.includes("age")) return "age";
    if (path.includes("bmi") || has("bmiHistoryList") || title.includes("bmi")) return "bmi";
    if (path.includes("loan") || path.includes("mortgage") || has("loanHistoryList") || has("loanResult") || title.includes("mortgage") || title.includes("loan")) return "loan";
    if (path.includes("discount") || has("discountHistoryList") || title.includes("discount")) return "discount";
    if (path.includes("percentage") || has("percentageHistoryList") || title.includes("percentage")) return "percentage";
    if (path.includes("compound") || has("compoundHistoryList") || title.includes("compound")) return "compound";
    return "";
  }
  function isReportType(type) { return REPORT_TYPES.includes(type); }
  function applyPageClass() {
    const type = getPageType();
    if (!type) return;
    ["basic-page","age-page","bmi-page","loan-page","discount-page","percentage-page","compound-page"].forEach(c => document.body.classList.remove(c));
    document.body.classList.add(type + "-page");
    document.body.dataset.page = type;
  }

  /* ================= BASIC CALCULATOR ================= */
  let calcHistory = loadArray("basicEquationHistory");
  let lastAnswer = Number(safeGet("lastAnswer", "0")) || 0;
  let lastBasicEquation = "";
  function getDisplay() { return byId("display"); }
  function clearError(display) { if (display && display.value === "Error") display.value = ""; }
  function add(value) {
    const display = getDisplay(); if (!display) return;
    clearError(display);
    const operators = ["+", "-", "*", "/"];
    const lastChar = display.value.slice(-1);
    if (value === "Ans") { display.value += String(lastAnswer); return; }
    if (value === "%") { display.value += "/100"; return; }
    if (operators.includes(value) && operators.includes(lastChar) && !(value === "-" && lastChar !== "-")) {
      display.value = display.value.slice(0, -1) + value; return;
    }
    display.value += value;
  }
  function clearDisplay() { const d = getDisplay(); if (d) d.value = ""; }
  function removeLast() { const d = getDisplay(); if (!d) return; if (d.value === "Error") { d.value = ""; return; } d.value = d.value.slice(0, -1); }
  const functionMap = { sin:"Math.sin(", cos:"Math.cos(", tan:"Math.tan(", log:"Math.log10(", ln:"Math.log(", sqrt:"Math.sqrt(" };
  function addFunction(func) {
    const d = getDisplay(); if (!d) return; clearError(d);
    const txt = functionMap[func]; if (!txt) return;
    if (/[0-9.)]$/.test(d.value)) d.value += "*" + txt; else d.value += txt;
  }
  function addPower() { const d = getDisplay(); if (!d) return; clearError(d); d.value += "**"; }
  function closeOpenBrackets(expression) { const open=(expression.match(/\(/g)||[]).length, close=(expression.match(/\)/g)||[]).length; return open>close ? expression+")".repeat(open-close) : expression; }
  function isSafeExpression(expression) {
    if (!/^[0-9+\-*/().,\sA-Za-z]+$/.test(expression)) return false;
    const words = expression.match(/[A-Za-z]+/g) || [];
    const allowed = new Set(["Math","sin","cos","tan","log","log10","sqrt","PI","E"]);
    return words.every(w => allowed.has(w));
  }
  function addBasicEquationHistory(equation) {
    const v = cleanText(equation); if (!v || v === "Error") return;
    if (calcHistory[calcHistory.length-1] !== v) { calcHistory.push(v); calcHistory = calcHistory.slice(-MAX_HISTORY_ITEMS); saveArray("basicEquationHistory", calcHistory); }
    showHistory();
  }
  function calculate() {
    const d = getDisplay(); if (!d) return;
    try {
      let expression = cleanText(d.value); if (!expression || expression === "Error") return;
      expression = expression.replace(/(\d)(Math\.)/g, "$1*$2").replace(/\)(Math\.)/g, ")*$1");
      lastBasicEquation = expression;
      expression = closeOpenBrackets(expression);
      if (!isSafeExpression(expression)) { d.value = "Error"; return; }
      const result = Function('"use strict"; return (' + expression + ')')();
      if (typeof result !== "number" || !Number.isFinite(result)) { d.value = "Error"; return; }
      const cleanResult = Number.isInteger(result) ? result : Number(result.toPrecision(12));
      d.value = String(cleanResult); lastAnswer = cleanResult; safeSet("lastAnswer", String(lastAnswer));
      addBasicEquationHistory(lastBasicEquation); renderBasicAnswer();
    } catch { d.value = "Error"; }
  }
  function showHistory() {
    const list = byId("historyList"); if (!list) return;
    const title = $(".history h3"); if (title) title.textContent = "History";
    calcHistory = loadArray("basicEquationHistory"); list.innerHTML = "";
    calcHistory.slice().reverse().forEach(eq => {
      const li = document.createElement("li"); li.className = "history-item basic-equation-history-item";
      const span = document.createElement("span"); span.className = "history-text"; span.textContent = "Eq: " + eq;
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "history-copy-btn"; btn.textContent = "copy"; btn.addEventListener("click", e => { e.stopPropagation(); copyText(eq, btn); });
      li.appendChild(span); li.appendChild(btn); list.appendChild(li);
    });
  }
  function clearHistory() { calcHistory = []; safeRemove("basicEquationHistory"); showHistory(); }
  function renderBasicAnswer() {
    if (getPageType() !== "basic") return;
    const d = getDisplay(); const answer = d ? cleanText(d.value) : ""; if (!answer || answer === "Error") return;
    const panel = getOrCreateOutputPanel("basic"); if (!panel) return;
    panel.className = "loan-style-output-panel basic-equal-output-panel calculator-clean-result";
    panel.innerHTML = '<div class="loan-output-top"><div class="loan-result-panel"><h2 class="loan-panel-title">Result</h2><div class="loan-result-body"><div class="basic-equal-result"><span class="basic-equal-symbol">=</span> <span class="basic-equal-answer">' + escapeHtml(answer) + '</span></div></div></div><div class="loan-copy-side"><button type="button" class="loan-copy-btn">Copy</button></div></div>';
    panel.hidden = false; panel.style.setProperty("display", "block", "important");
    const btn = panel.querySelector(".loan-copy-btn"); if (btn) btn.onclick = () => copyText(answer, btn);
  }
  function flashButton(buttonText) {
    const wanted = String(buttonText).trim().toUpperCase();
    $$(".buttons button, .ans-btn").forEach(btn => { if (btn.textContent.trim().toUpperCase() === wanted) { btn.classList.add("keyboard-active"); setTimeout(() => btn.classList.remove("keyboard-active"), 150); } });
  }
  function setupKeyboardSupport() {
    document.addEventListener("keydown", function (event) {
      if (getPageType() !== "basic") return;
      const d = getDisplay(); if (!d) return;
      const key = event.key, lowerKey = key.toLowerCase();
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
      if (lowerKey === "a") add("Ans");
    });
  }

  /* ================= SHARED OUTPUT / REPORTS ================= */
  function getOutputPanelId(type) { return type === "loan" ? "loanExternalOutput" : type === "basic" ? "universalLoanStyleOutput" : type + "ReportOutput"; }
  function getOrCreateOutputPanel(type) {
    const main = $("main.pc-calculator-layout") || $("main");
    const calculator = main ? $(".calculator", main) : null; if (!calculator) return null;
    const id = getOutputPanelId(type);
    let panel = byId(id);
    if (!panel) {
      panel = document.createElement("section"); panel.id = id; panel.className = "loan-style-output-panel calculator-clean-result"; panel.setAttribute("aria-label", "Calculator result");
      calculator.insertAdjacentElement("afterend", panel);
    }
    return panel;
  }
  function makeTable(rows) {
    return '<div class="loan-result-table-scroll"><table class="loan-result-table universal-loan-result-table"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>' +
      rows.map(r => "<tr><td>" + escapeHtml(r[0]) + "</td><td>" + escapeHtml(r[1]) + "</td></tr>").join("") +
      "</tbody></table></div>";
  }
  function copyTable(table, button) {
    if (!table) return;
    const text = Array.from(table.querySelectorAll("tr")).map(row => Array.from(row.querySelectorAll("th,td")).map(cell => cleanText(cell.textContent)).join("\t")).join("\n");
    copyText(text, button);
  }
  function renderResultPanel(type, rows, extraTopHtml) {
    const panel = getOrCreateOutputPanel(type); if (!panel) return null;
    panel.className = "loan-style-output-panel calculator-clean-result " + type + "-clean-result";
    panel.innerHTML = (extraTopHtml || "") + '<div class="loan-output-top"><div class="loan-result-panel"><h2 class="loan-panel-title">Result</h2><div class="loan-result-body">' + makeTable(rows) + '</div></div><div class="loan-copy-side"><button type="button" class="loan-copy-btn">Copy</button></div></div>';
    panel.hidden = false; panel.style.setProperty("display", "block", "important"); panel.style.setProperty("visibility", "visible", "important");
    const copyBtn = panel.querySelector(".loan-copy-btn"); if (copyBtn) copyBtn.onclick = () => copyTable(panel.querySelector("table"), copyBtn);
    ["#result", "#ageResult", "#bmiResult", "#loanResult", "#discountResult", "#percentageResult", "#compoundResult"].forEach(sel => { const old = $(sel); if (old) old.style.display = "none"; });
    return panel;
  }
  function getInputLabel(input) {
    if (!input) return "Input";
    if (input.id) { const label = $('label[for="' + input.id + '"]'); if (label) return cleanText(label.textContent.replace(/[:：]/g, "")); }
    const prev = input.previousElementSibling; if (prev && prev.tagName && lower(prev.tagName) === "label") return cleanText(prev.textContent.replace(/[:：]/g, ""));
    return cleanText(input.getAttribute("aria-label") || input.placeholder || input.name || input.id || "Input");
  }
  function getInputDisplayValue(input) {
    if (!input) return "";
    if (lower(input.tagName) === "select") { const opt = input.options[input.selectedIndex]; return cleanText(opt ? opt.textContent : input.value); }
    return cleanText(input.value);
  }
  function getFilledInputs(type) {
    const lines = [], used = new Set();
    function addInput(input) {
      if (!input) return;
      if (["hidden", "button", "submit", "reset"].includes(input.type)) return;
      if (input.id === "display") return;
      const key = input.id || input.name || getInputLabel(input); if (used.has(key)) return; used.add(key);
      const value = getInputDisplayValue(input); if (value) lines.push({ label: getInputLabel(input), value });
    }
    $$(".calculator input, .calculator select, .calculator textarea, .optional-mortgage-costs input, .optional-mortgage-costs select, .early-settlement-box input, .early-settlement-box select, .bmi-input-groups input, .bmi-input-groups select").forEach(addInput);
    return lines;
  }
  function reportKey(type) { return "calculatorReports_" + type; }
  function loadReports(type) { return loadArray(reportKey(type)); }
  function saveReports(type, reports) { saveArray(reportKey(type), reports); }
  function resultPanelHtml(type) {
    const panel = byId(getOutputPanelId(type)); if (!panel || panel.hidden) return "";
    const clone = panel.cloneNode(true);
    clone.querySelectorAll("script, iframe, object, embed, link, meta, button, a, .loan-copy-side, .loan-graph-copy-side, .calculator-report-actions").forEach(el => el.remove());
    return clone.innerHTML || clone.outerHTML || "";
  }
  function resultPanelText(type) { const panel = byId(getOutputPanelId(type)); return panel && !panel.hidden ? cleanText(panel.innerText || panel.textContent || "") : ""; }
  function shortLabel(type, report) {
    const lines = report.inputLines || [];
    const find = (pattern) => { const line = lines.find(item => pattern.test(item.label || "")); return line ? line.value : ""; };
    if (type === "age") return "Birthdate: " + (find(/birth/i) || "-");
    if (type === "bmi") return "BMI: " + ((report.metrics && report.metrics.bmi) || "report");
    if (type === "loan") return "Loan amount: " + moneyRM(find(/loan amount|purchase price|amount/i));
    if (type === "discount") return "Price: " + moneyRM(find(/price|amount/i));
    if (type === "percentage") return (find(/percentage|percent/i) || "-") + "% of " + (find(/number|amount|value/i) || "-");
    if (type === "compound") return "Principal: " + moneyRM(find(/principal|amount/i));
    return "Report";
  }
  function reportSignature(report) { return JSON.stringify({ inputs: report.inputLines, result: report.resultText }); }
  function saveCurrentReport(type, metrics) {
    if (!isReportType(type)) return;
    const html = resultPanelHtml(type), text = resultPanelText(type); if (!html || !text) return;
    const report = { type, id: type + "_" + Date.now() + "_" + Math.random().toString(36).slice(2,8), createdAt: new Date().toLocaleString(), inputLines: getFilledInputs(type), resultHtml: html, resultText: text, metrics: metrics || {} };
    report.label = shortLabel(type, report);
    const reports = loadReports(type); const last = reports[reports.length - 1];
    if (last && reportSignature(last) === reportSignature(report)) { renderReportHistory(type); return; }
    reports.push(report); saveReports(type, reports); renderReportHistory(type);
  }
  function encodeBase64Url(text) { const bytes = new TextEncoder().encode(text); let binary=""; bytes.forEach(b => binary += String.fromCharCode(b)); return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,""); }
  function decodeBase64Url(text) { const normal = String(text || "").replace(/-/g,"+").replace(/_/g,"/"); const padded = normal + "===".slice((normal.length + 3) % 4); const binary = atob(padded); const bytes = new Uint8Array(binary.length); for (let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i); return new TextDecoder().decode(bytes); }
  function reportHref(report) { return window.location.href.split("#")[0] + "#calc-report=" + encodeBase64Url(JSON.stringify(report)); }
  function getHistoryList(type) {
    const map = { age:"ageHistoryList", bmi:"bmiHistoryList", loan:"loanHistoryList", discount:"discountHistoryList", percentage:"percentageHistoryList", compound:"compoundHistoryList" };
    return byId(map[type]);
  }
  function renderReportHistory(type) {
    if (!isReportType(type)) return;
    const list = getHistoryList(type); if (!list) return;
    const box = list.closest(".history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box");
    const title = box ? $("h3", box) : null; if (title) title.textContent = "History";
    list.innerHTML = "";
    loadReports(type).slice().reverse().forEach(report => {
      const li = document.createElement("li"); li.className = "history-item calculator-report-history-item";
      const span = document.createElement("span"); span.className = "history-text calculator-report-history-label"; span.textContent = report.label || shortLabel(type, report);
      const link = document.createElement("a"); link.className = "calculator-report-open-link mortgage-fast-open-link"; link.textContent = "open report"; link.href = reportHref(report); link.target = "_self"; link.rel = "";
      li.appendChild(span); li.appendChild(link); list.appendChild(li);
    });
  }
  function clearReports(type) { safeRemove(reportKey(type)); renderReportHistory(type); const panel = byId(getOutputPanelId(type)); if (panel) panel.hidden = true; }

  /* ================= CALCULATORS ================= */
  function todayValueISO() { const d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function formatDateDMY(value) { const p=String(value||"").split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : value||""; }
  function ensureAgeTargetDateInput() {
    const birth = byId("birthdate"); if (!birth) return null;
    let target = byId("dateToCalculate");
    if (!target) {
      const label = document.createElement("label"); label.setAttribute("for","dateToCalculate"); label.textContent = "Date to calculate:";
      target = document.createElement("input"); target.type = "date"; target.id = "dateToCalculate"; target.setAttribute("aria-label","Date to calculate");
      birth.insertAdjacentElement("afterend", target); target.insertAdjacentElement("beforebegin", label);
    }
    if (!target.value) target.value = todayValueISO();
    return target;
  }
  function calculateNormalAgeBetweenDates(birthdate, targetDate) {
    if (!birthdate || !targetDate) return ""; const b = new Date(birthdate+"T00:00:00"), t = new Date(targetDate+"T00:00:00"); if (isNaN(b) || isNaN(t) || b > t) return "";
    let years = t.getFullYear() - b.getFullYear(); const birthday = new Date(t.getFullYear(), b.getMonth(), b.getDate()); if (t < birthday) years--; return years;
  }
  function calculateAsianAgeBetweenDates(birthdate, targetDate) { const by=Number(String(birthdate||"").split("-")[0]), ty=Number(String(targetDate||"").split("-")[0]); if (!by || !ty || by>ty) return ""; return ty - by + 1; }
  function calculateAge() {
    const birthdate = firstValue(["birthdate", "birthDate", "dob"]); const targetInput = ensureAgeTargetDateInput(); const targetDate = targetInput ? targetInput.value : todayValueISO(); if (!birthdate) return;
    const normal = calculateNormalAgeBetweenDates(birthdate, targetDate), asian = calculateAsianAgeBetweenDates(birthdate, targetDate); if (normal === "" || asian === "") return;
    const rows = [["Date range", formatDateDMY(birthdate)+" to "+formatDateDMY(targetDate)], ["Normal age", normal+" years old"], ["Asian age", asian+" years old"]];
    renderResultPanel("age", rows); saveCurrentReport("age", { normalAge: normal, asianAge: asian });
  }

  function ensureBMIProfileAndGroups() {
    if (getPageType() !== "bmi") return;
    const calculator = $(".calculator"); if (!calculator) return;
    const weight = byId("weight"), height = byId("height"), waist = byId("waist"); if (!weight || !height) return;

    if (!byId("bmiAge")) {
      const ageLabel = document.createElement("label"); ageLabel.id = "bmiAgeLabel"; ageLabel.setAttribute("for", "bmiAge"); ageLabel.textContent = "Age (optional):";
      const age = document.createElement("input"); age.type = "number"; age.id = "bmiAge"; age.placeholder = "Optional"; age.inputMode = "decimal";
      const genderLabel = document.createElement("label"); genderLabel.id = "bmiGenderLabel"; genderLabel.setAttribute("for", "bmiGender"); genderLabel.textContent = "Gender (optional):";
      const gender = document.createElement("select"); gender.id = "bmiGender"; gender.innerHTML = '<option value="">Optional</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>';
      calculator.insertBefore(gender, weight.parentNode ? weight : null);
      calculator.insertBefore(genderLabel, gender);
      calculator.insertBefore(age, genderLabel);
      calculator.insertBefore(ageLabel, age);
    }

    let row = $(".bmi-input-groups");
    if (!row) { row = document.createElement("div"); row.className = "bmi-input-groups"; const titleRow = $(".bmi-title-row"); (titleRow || calculator.firstElementChild || calculator).insertAdjacentElement(titleRow ? "afterend" : "beforebegin", row); }
    let measure = $(".bmi-measurement-box"); if (!measure) { measure = document.createElement("div"); measure.className = "bmi-measurement-box"; measure.innerHTML = '<div class="bmi-extra-title">Measurements</div>'; }
    let profile = $(".bmi-profile-box"); if (!profile) { profile = document.createElement("div"); profile.className = "bmi-profile-box"; profile.innerHTML = '<div class="bmi-extra-title">Profile</div>'; }
    row.appendChild(measure); row.appendChild(profile);
    ["weightLabel","weight","heightLabel","height","waistLabel","waist"].forEach(id => { const el = byId(id); if (el) measure.appendChild(el); });
    ["bmiAgeLabel","bmiAge","bmiGenderLabel","bmiGender"].forEach(id => { const el = byId(id); if (el) profile.appendChild(el); });
  }
  function toggleBMIUnit() {
    const button = byId("unitToggleBtn"); const current = button ? (button.dataset.currentUnit || "si") : (document.body.dataset.bmiUnit || "si"); const next = current === "si" ? "us" : "si";
    document.body.dataset.bmiUnit = next; if (button) { button.dataset.currentUnit = next; button.textContent = next === "si" ? "SI" : "US"; }
    const weightLabel = byId("weightLabel"), heightLabel = byId("heightLabel"), waistLabel = byId("waistLabel"), weight = byId("weight"), height = byId("height"), waist = byId("waist");
    if (next === "si") { if (weightLabel) weightLabel.textContent="Weight in kg:"; if (heightLabel) heightLabel.textContent="Height in cm:"; if (waistLabel) waistLabel.textContent="Waist circumference in cm:"; if (weight) weight.placeholder="Example: 70"; if (height) height.placeholder="Example: 170"; if (waist) waist.placeholder="Optional, Example: 80"; }
    else { if (weightLabel) weightLabel.textContent="Weight in lb:"; if (heightLabel) heightLabel.textContent="Height in inch:"; if (waistLabel) waistLabel.textContent="Waist circumference in inch:"; if (weight) weight.placeholder="Example: 154"; if (height) height.placeholder="Example: 67"; if (waist) waist.placeholder="Optional, Example: 32"; }
    scheduleAutoCalculate();
  }
  function ageRangeLabel(age) { if (!Number.isFinite(age) || age <= 0) return "Not provided"; if (age < 18) return "Under 18"; if (age < 65) return "Adult 18–64"; return "Senior 65+"; }
  function calculateBMI() {
    ensureBMIProfileAndGroups();
    const weight = firstNumber(["weight","bmiWeight"]), height = firstNumber(["height","bmiHeight"]), waist = firstNumber(["waist","bmiWaist"]), age = firstNumber(["bmiAge"]);
    const gender = firstValue(["bmiGender"]);
    if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) return;
    const button = byId("unitToggleBtn"); const unit = (button ? button.dataset.currentUnit : document.body.dataset.bmiUnit) || "si";
    let bmi, ratio = NaN;
    if (unit === "us") { bmi = 703 * weight / (height * height); if (Number.isFinite(waist) && waist > 0) ratio = waist / height; }
    else { const heightM = height / 100; bmi = weight / (heightM * heightM); if (Number.isFinite(waist) && waist > 0) ratio = waist / height; }
    let category = "Normal"; if (bmi < 18.5) category = "Underweight"; else if (bmi >= 25 && bmi < 30) category = "Overweight"; else if (bmi >= 30) category = "Obese";
    const rows = [["BMI", bmi.toFixed(2)], ["BMI category", category], ["Unit", unit === "us" ? "US" : "SI"], ["Age range", ageRangeLabel(age)], ["Gender", gender ? gender.charAt(0).toUpperCase()+gender.slice(1) : "Not provided"]];
    const metrics = { bmi: bmi.toFixed(2), category };
    if (Number.isFinite(ratio)) { const healthy = ratio < 0.5 ? "Healthy (< 0.5)" : "Higher risk (≥ 0.5)"; rows.push(["Waist-to-height ratio", ratio.toFixed(2)]); rows.push(["Waist-to-height status", healthy]); metrics.waistRatio = ratio.toFixed(2); metrics.waistStatus = healthy; }
    renderResultPanel("bmi", rows); saveCurrentReport("bmi", metrics);
  }

  function calculateDiscount() {
    const price = firstNumber(["price","originalPrice","amount"]), discount = firstNumber(["discount","discountRate"]);
    if (!Number.isFinite(price) || !Number.isFinite(discount) || price <= 0 || discount < 0 || discount > 100) return;
    const savings = price * discount / 100, finalPrice = price - savings;
    const rows = [["Original price", moneyRM(price)], ["Discount", discount + "%"], ["Savings", moneyRM(savings)], ["Final price", moneyRM(finalPrice)]];
    renderResultPanel("discount", rows); saveCurrentReport("discount", { finalPrice: moneyRM(finalPrice) });
  }
  function calculatePercentage() {
    const percentage = firstNumber(["percentage","percent"]), number = firstNumber(["number","amount","value"]);
    if (!Number.isFinite(percentage) || !Number.isFinite(number)) return;
    const answer = percentage / 100 * number;
    const rows = [["Percentage", percentage + "%"], ["Number", String(number)], ["Result", money(answer)]];
    renderResultPanel("percentage", rows); saveCurrentReport("percentage", { result: money(answer) });
  }
  function calculateCompound() {
    const principal = firstNumber(["principal","compoundPrincipal","amount"]), rate = firstNumber(["rate","compoundRate","interest","interestRate"]), years = firstNumber(["years","compoundYears","time"]), frequency = Number(firstValue(["frequency","compoundFrequency"])) || 1;
    if (!Number.isFinite(principal) || !Number.isFinite(rate) || !Number.isFinite(years) || principal <= 0 || rate < 0 || years <= 0 || frequency <= 0) return;
    const futureValue = principal * Math.pow(1 + rate / 100 / frequency, frequency * years), compoundInterest = futureValue - principal;
    const rows = [["Principal", moneyRM(principal)], ["Annual interest rate", rate + "%"], ["Years", String(years)], ["Compounding frequency", String(frequency)], ["Future value", moneyRM(futureValue)], ["Compound interest", moneyRM(compoundInterest)]];
    renderResultPanel("compound", rows); saveCurrentReport("compound", { futureValue: moneyRM(futureValue) });
  }

  function calculateLoanPayment(principal, annualRate, months) { const r = annualRate / 100 / 12; if (r === 0) return principal / months; return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1); }
  function remainingBalance(principal, annualRate, months, paidMonths) { const r = annualRate / 100 / 12, pmt = calculateLoanPayment(principal, annualRate, months); if (r === 0) return Math.max(0, principal - pmt * paidMonths); return Math.max(0, principal * Math.pow(1 + r, paidMonths) - pmt * ((Math.pow(1 + r, paidMonths) - 1) / r)); }
  function ensureMortgageOptionalSections() {
    if (getPageType() !== "loan") return;
    const calculator = $(".calculator"); if (!calculator) return;
    let row = $(".loan-optional-row"); if (!row) { row = document.createElement("div"); row.className = "loan-optional-row"; const btn = $(".main-btn", calculator) || Array.from($$("button", calculator)).find(b => lower(b.textContent).includes("calculate")); if (btn) btn.insertAdjacentElement("beforebegin", row); else calculator.appendChild(row); }
    let optional = $(".optional-mortgage-costs"); if (!optional) { optional = document.createElement("div"); optional.className = "optional-mortgage-costs"; optional.innerHTML = '<button type="button" class="optional-mortgage-toggle" aria-expanded="true">Optional costs</button><div class="optional-mortgage-content"><label for="propertyTaxYearly">Property tax per year:</label><input type="number" id="propertyTaxYearly" placeholder="Optional"><label for="homeInsuranceYearly">Home insurance per year:</label><input type="number" id="homeInsuranceYearly" placeholder="Optional"><label for="otherMonthlyFees">Other monthly fees:</label><input type="number" id="otherMonthlyFees" placeholder="Optional"></div>'; }
    let early = $(".early-settlement-box"); if (!early) { early = document.createElement("div"); early.className = "early-settlement-box"; early.innerHTML = '<button type="button" class="early-settlement-toggle" aria-expanded="true">Optional early settlement</button><div class="early-settlement-content"><label for="earlySettlementMonth">Settle after month:</label><input type="number" id="earlySettlementMonth" placeholder="Optional"><label for="extraMonthlyPayment">Extra monthly payment:</label><input type="number" id="extraMonthlyPayment" placeholder="Optional"></div>'; }
    row.appendChild(optional); row.appendChild(early);
    const hoa = byId("hoaMonthly"), other = byId("otherMonthlyFees"); if (hoa && other) { if (!other.value && hoa.value) other.value = hoa.value; const lab = $('label[for="hoaMonthly"]'); if (lab) lab.remove(); hoa.remove(); }
  }
  function calculateLoan() {
    ensureMortgageOptionalSections();
    const amount = firstNumber(["amount","loanAmount","loanPrincipal"]), rate = firstNumber(["interest","loanRate","interestRate","annualRate"]), termInput = firstInput(["years","loanYears","loanTerm","term"]);
    const termRaw = termInput ? numberFromString(termInput.value) : NaN;
    if (!Number.isFinite(amount) || !Number.isFinite(rate) || !Number.isFinite(termRaw) || amount <= 0 || rate < 0 || termRaw <= 0) return;
    const termIsMonths = termInput && (termInput.dataset.termUnit === "months" || /month/i.test(getInputLabel(termInput)));
    const months = termIsMonths ? Math.round(termRaw) : Math.round(termRaw * 12);
    const yearsDisplay = months / 12;
    const baseMonthly = calculateLoanPayment(amount, rate, months);
    const taxMonthly = (firstNumber(["propertyTaxYearly"]) || 0) / 12;
    const insuranceMonthly = (firstNumber(["homeInsuranceYearly"]) || 0) / 12;
    const otherMonthly = firstNumber(["otherMonthlyFees", "hoaMonthly"]) || 0;
    const extraMonthly = firstNumber(["extraMonthlyPayment"]) || 0;
    const totalMonthly = baseMonthly + taxMonthly + insuranceMonthly + otherMonthly + extraMonthly;
    const totalPayment = baseMonthly * months;
    const totalInterest = totalPayment - amount;
    const rows = [["Loan amount", moneyRM(amount)], ["Annual interest rate", rate.toFixed(2) + "%"], ["Loan term", months + " months"], ["Monthly payment", moneyRM(baseMonthly)], ["Property tax monthly", moneyRM(taxMonthly)], ["Home insurance monthly", moneyRM(insuranceMonthly)], ["Other monthly fees", moneyRM(otherMonthly)], ["Extra monthly payment", moneyRM(extraMonthly)], ["Total monthly payment", moneyRM(totalMonthly)], ["Total interest", moneyRM(totalInterest)], ["Total payment", moneyRM(totalPayment)]];
    const settleMonth = firstNumber(["earlySettlementMonth"]);
    if (Number.isFinite(settleMonth) && settleMonth > 0) rows.push(["Estimated balance after month " + Math.min(settleMonth, months), moneyRM(remainingBalance(amount, rate, months, Math.min(settleMonth, months)))]);
    const summary = '<div class="calculator-report-summary-boxes mortgage-result-summary"><div class="calculator-report-summary-card calculator-report-monthly-card"><div class="calculator-report-summary-label">Monthly payment</div><div class="calculator-report-summary-value">' + moneyRM(baseMonthly) + '</div></div><div class="calculator-report-summary-card calculator-report-interest-card"><div class="calculator-report-summary-label">Total interest</div><div class="calculator-report-summary-value">' + moneyRM(totalInterest) + '</div></div><div class="calculator-report-summary-card calculator-report-total-card"><div class="calculator-report-summary-label">Total payment</div><div class="calculator-report-summary-value">' + moneyRM(totalPayment) + '</div></div></div>';
    renderResultPanel("loan", rows, summary); saveCurrentReport("loan", { monthlyPayment: moneyRM(baseMonthly), totalInterest: moneyRM(totalInterest), totalPayment: moneyRM(totalPayment) });
  }

  /* ================= REPORT PAGE ================= */
  function tableRows(lines) { return (lines || []).map(line => "<tr><td>" + escapeHtml(line.label) + "</td><td>" + escapeHtml(line.value) + "</td></tr>").join(""); }
  function cleanResultHtml(html) { const t=document.createElement("template"); t.innerHTML=html||""; t.content.querySelectorAll("script,iframe,object,embed,link,meta,button,a").forEach(el=>el.remove()); t.content.querySelectorAll("*").forEach(el=>Array.from(el.attributes).forEach(attr=>{ const n=attr.name.toLowerCase(), v=String(attr.value||"").trim().toLowerCase(); if (n.startsWith("on") || v.startsWith("javascript:")) el.removeAttribute(attr.name); })); return t.innerHTML; }
  function reportPageTitle(type) { return ({age:"Age Report", bmi:"BMI Report", loan:"Mortgage Report", discount:"Discount Report", percentage:"Percentage Report", compound:"Compound Interest Report"})[type] || "Calculator Report"; }
  function reportSummaryFromMetrics(report) {
    if (report.type !== "loan" || !report.metrics) return "";
    return '<div class="calculator-report-summary-boxes"><div class="calculator-report-summary-card calculator-report-monthly-card"><div class="calculator-report-summary-label">Monthly payment</div><div class="calculator-report-summary-value">' + escapeHtml(report.metrics.monthlyPayment || "-") + '</div></div><div class="calculator-report-summary-card calculator-report-interest-card"><div class="calculator-report-summary-label">Total interest</div><div class="calculator-report-summary-value">' + escapeHtml(report.metrics.totalInterest || "-") + '</div></div><div class="calculator-report-summary-card calculator-report-total-card"><div class="calculator-report-summary-label">Total payment</div><div class="calculator-report-summary-value">' + escapeHtml(report.metrics.totalPayment || "-") + '</div></div></div>';
  }
  function renderReportPage(report) {
    document.body.classList.add("calculator-report-view", "mortgage-report-clean-view");
    $$(".calculator, .history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box, .instruction-box, .pc-what-slot, .instruction-what-box, #pcHelpQuestionButton, #pcQuestionOverlayButton, #universalLoanStyleOutput, #loanExternalOutput, .calculator-clean-result").forEach(el => { el.style.setProperty("display", "none", "important"); });
    const old = byId("calculatorReportPage"); if (old) old.remove();
    const section = document.createElement("section"); section.id = "calculatorReportPage"; section.className = "calculator-report-page mortgage-fast-report-page";
    section.innerHTML = '<h1>' + escapeHtml(reportPageTitle(report.type)) + '</h1><p class="calculator-report-date"><strong>Generated:</strong> ' + escapeHtml(report.createdAt || "") + '</p>' + reportSummaryFromMetrics(report) + '<div class="calculator-report-card"><h2>Inputs</h2><div class="calculator-report-table-scroll"><table><tbody>' + tableRows(report.inputLines) + '</tbody></table></div></div><div class="calculator-report-card"><h2>Result</h2><div class="calculator-report-result">' + cleanResultHtml(report.resultHtml) + '</div></div><div class="calculator-report-actions"><button type="button" class="calculator-report-action-btn calculator-report-back-btn">Go back</button><button type="button" class="calculator-report-action-btn calculator-report-copy-btn">Copy report</button><button type="button" class="calculator-report-action-btn calculator-report-save-btn">Save report</button><button type="button" class="calculator-report-action-btn calculator-report-share-btn">Share report</button></div>';
    const main = $("main") || document.body; main.insertAdjacentElement("afterbegin", section);
    $(".calculator-report-back-btn", section).onclick = () => { if (history.length > 1) history.back(); else window.location.href = window.location.href.split("#")[0]; };
    $(".calculator-report-copy-btn", section).onclick = function () { copyText(cleanText(section.innerText), this); };
    $(".calculator-report-save-btn", section).onclick = function () { saveReportFile(section, this); };
    $(".calculator-report-share-btn", section).onclick = function () { shareReport(section, this); };
  }
  function openReportFromHash() {
    if (!window.location.hash.startsWith("#calc-report=")) return false;
    try { const report = JSON.parse(decodeBase64Url(window.location.hash.replace("#calc-report=", ""))); renderReportPage(report); return true; }
    catch (e) { console.error("Could not open report", e); return false; }
  }
  function saveReportFile(section, button) {
    const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calculator Report</title><style>body{background:#dfeeff;font-family:Comic Sans MS,Comic Neue,cursive,sans-serif;padding:24px;color:#000}.report{max-width:1100px;margin:0 auto;padding:18px;background:#fff;border:5px solid #000;box-shadow:8px 8px 0 #000}table{width:100%;border-collapse:collapse}td,th{border:3px solid #000;padding:10px}h1,h2{text-align:center}</style></head><body><div class="report">' + section.innerHTML + '</div></body></html>';
    const blob = new Blob([html], { type:"text/html;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "calculator-report.html"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500); setButtonState(button, "Saved!");
  }
  function shareReport(section, button) { const url = window.location.href; if (navigator.share) navigator.share({ title:"Calculator Report", text: cleanText(section.innerText).slice(0,500), url }).catch(() => copyText(url, button)); else copyText(url, button); }

  /* ================= INSTRUCTIONS ================= */
  const PAGE_DATA = {
    basic: { what:"It helps you do quick math calculations like addition, subtraction, multiplication, division, power, and square root.", how:"Enter numbers using the buttons, choose an operator, then press = to get the answer.", formula:"The calculator follows normal math order: brackets first, then powers, multiplication/division, then addition/subtraction.", example:"8 + 2 × 3 = 14 because multiplication is calculated before addition.", references:[["Order of operations","Purplemath explains the normal order of operations.","https://www.purplemath.com/modules/orderops.htm"]] },
    age: { what:"It calculates normal age and Asian age from a selected birth date.", how:"Select your birth date. The result updates automatically.", formula:"Normal age is based on the date range. Asian age uses target year − birth year + 1.", example:"If someone was born in 2000 and the target year is 2026, Asian age is 27.", references:[["Age calculation","Microsoft shows age calculation using today’s date and a birth date.","https://support.microsoft.com/en-us/office/calculate-age-113d599f-5fea-448f-a4c3-268927911b37"]] },
    bmi: { what:"It calculates Body Mass Index and waist-to-height ratio. Age and gender are optional details included in the result/report.", how:"Choose SI or US units, enter weight and height, optionally enter waist, age, and gender. The result updates automatically.", formula:"SI: BMI = weight kg ÷ height m². US: BMI = weight lb ÷ height inch² × 703. Waist-to-height ratio = waist ÷ height.", example:"70 kg and 170 cm gives BMI = 24.22. A waist-to-height ratio below 0.5 is marked healthy.", references:[["CDC BMI formula","CDC lists metric and US customary formulas for calculating BMI.","https://www.cdc.gov/growth-chart-training/hcp/using-bmi/body-mass-index.html"]] },
    loan: { what:"It estimates mortgage or personal loan monthly payment, interest, total payment, and optional monthly costs.", how:"Enter loan amount, annual interest rate, loan term in months, and optional costs. The result updates automatically.", formula:"Monthly Payment = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ − 1), where n is the loan term in months.", example:"A 300,000 loan at 4% yearly for 360 months gives an estimated monthly payment using the amortization formula.", references:[["Mortgage formula","Investopedia lists the mortgage payment formula using principal, rate, and months.","https://www.investopedia.com/mortgage-calculator-5084794"]] },
    discount: { what:"It calculates final price after discount and how much money you save.", how:"Enter original price and discount percentage. The result updates automatically.", formula:"Savings = original price × discount ÷ 100. Final price = original price − savings.", example:"If price is 100 and discount is 20%, savings = 20 and final price = 80.", references:[["Discount calculation","Calculator.net explains percent-off discount calculation.","https://www.calculator.net/discount-calculator.html"]] },
    percentage: { what:"It calculates a percentage of a number.", how:"Enter percentage value and number. The result updates automatically.", formula:"Result = percentage ÷ 100 × number.", example:"20% of 150 = 30.", references:[["Percentage meaning","A percentage means a value out of 100.","https://en.wikipedia.org/wiki/Percentage"]] },
    compound: { what:"It estimates how much money grows when interest is added repeatedly over time.", how:"Enter principal, annual interest rate, years, and compounding frequency. The result updates automatically.", formula:"A = P(1 + r/n)ⁿᵗ. Compound Interest = A − P.", example:"P = 1000, r = 5%, t = 10, n = 12 gives about 1,647.01 future value.", references:[["Compound interest formula","Investopedia lists the compound interest formula as A = P(1 + r/n)^(nt).","https://www.investopedia.com/articles/investing/020614/learn-simple-and-compound-interest.asp"]] }
  };
  function makeInfoBox(className, title, text) { const box=document.createElement("div"); box.className=className; box.innerHTML="<h3>"+escapeHtml(title)+"</h3><p>"+escapeHtml(text)+"</p>"; return box; }
  function buildInstructionLayout() {
    const type = getPageType(); const data = PAGE_DATA[type]; const main = $("main"); if (!main || !data || !$(".calculator", main) || main.classList.contains("calculator-box")) return;
    main.classList.add("has-instructions"); $$(":scope > .instruction-box, :scope > .pc-what-slot", main).forEach(el => el.remove());
    const box = document.createElement("aside"); box.className = "instruction-box"; box.setAttribute("aria-label", "Instructions and references");
    box.appendChild(makeInfoBox("instruction-section instruction-what-box", "What does this calculator do?", data.what));
    const h2=document.createElement("h2"); h2.className="instruction-main-title"; h2.textContent="Instructions"; box.appendChild(h2);
    box.appendChild(makeInfoBox("instruction-section instruction-how-box", "How to use it", data.how)); box.appendChild(makeInfoBox("instruction-section instruction-formula-box", "Formula used", data.formula)); box.appendChild(makeInfoBox("instruction-section instruction-example-box", "Example calculation", data.example));
    const ref=document.createElement("section"); ref.className="reference-box"; ref.innerHTML='<h2 class="reference-main-title">References</h2><div class="reference-scroll"></div>'; const scroll=$(".reference-scroll", ref);
    data.references.forEach(item => { const card=document.createElement("div"); card.className="reference-card"; card.innerHTML='<h3>'+escapeHtml(item[0])+'</h3><p>'+escapeHtml(item[1])+'</p><a href="'+escapeHtml(item[2])+'" target="_blank" rel="noopener noreferrer">Open source</a>'; scroll.appendChild(card); });
    box.appendChild(ref); main.appendChild(box);
  }

  /* ================= EVENTS / SETUP ================= */
  function readyToCalculate(type) {
    if (type === "age") return !!firstValue(["birthdate"]);
    if (type === "bmi") return !!firstValue(["weight","bmiWeight"]) && !!firstValue(["height","bmiHeight"]);
    if (type === "loan") return !!firstValue(["amount","loanAmount","loanPrincipal"]) && !!firstValue(["interest","loanRate","interestRate","annualRate"]) && !!firstValue(["years","loanYears","loanTerm","term"]);
    if (type === "discount") return !!firstValue(["price","originalPrice","amount"]) && !!firstValue(["discount","discountRate"]);
    if (type === "percentage") return !!firstValue(["percentage","percent"]) && !!firstValue(["number","amount","value"]);
    if (type === "compound") return !!firstValue(["principal","compoundPrincipal","amount"]) && !!firstValue(["rate","compoundRate","interest","interestRate"]) && !!firstValue(["years","compoundYears","time"]);
    return false;
  }
  function calculateByType(type) { if (type==="age") calculateAge(); else if (type==="bmi") calculateBMI(); else if (type==="loan") calculateLoan(); else if (type==="discount") calculateDiscount(); else if (type==="percentage") calculatePercentage(); else if (type==="compound") calculateCompound(); }
  function scheduleAutoCalculate() { const type=getPageType(); if (!isReportType(type)) return; clearTimeout(autoTimer); autoTimer=setTimeout(() => { if (!readyToCalculate(type) || isAutoRunning) return; isAutoRunning=true; try { calculateByType(type); } finally { setTimeout(() => { isAutoRunning=false; }, 120); } }, 250); }
  function isCalculateButton(button) { if (!button || button.closest("#navbar") || button.closest(".history,.age-history-box,.bmi-history-box,.discount-history-box,.loan-history-box,.percentage-history-box,.compound-history-box") || button.closest(".calculator-report-actions")) return false; const text=lower(button.textContent), id=lower(button.id||""), onclick=lower(button.getAttribute("onclick")||""); if (id === "unittogglebtn") return false; if (/clear|copy|save|share|back|optional|settlement/.test(text)) return false; return text.includes("calculate") || id.includes("calculate") || onclick.includes("calculate"); }
  function hideCalculateButtons() { const type=getPageType(); if (!isReportType(type)) return; $$(".calculator button, main button").forEach(button => { if (isCalculateButton(button)) { button.style.setProperty("display","none","important"); button.setAttribute("aria-hidden","true"); button.tabIndex=-1; } }); }
  function setupNumberInputs() { $$('input[type="number"]').forEach(input => { input.setAttribute("inputmode","decimal"); if (input.dataset.numberOnlyReady) return; input.dataset.numberOnlyReady="true"; input.addEventListener("keydown", e => { const allowed=["Backspace","Delete","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Tab","Home","End"]; if (allowed.includes(e.key) || e.ctrlKey || e.metaKey || /^[0-9]$/.test(e.key)) return; if (e.key === "." && !input.value.includes(".")) return; e.preventDefault(); }); input.addEventListener("input", () => { let v=input.value.replace(/[^0-9.]/g,""); const parts=v.split("."); if (parts.length>2) v=parts[0]+"."+parts.slice(1).join(""); input.value=v; }); }); }
  function setupAutoEvents() {
    document.addEventListener("input", e => { if (e.target.matches && e.target.matches("input, select, textarea") && e.target.id !== "display") scheduleAutoCalculate(); }, true);
    document.addEventListener("change", e => { if (e.target.matches && e.target.matches("input, select, textarea") && e.target.id !== "display") scheduleAutoCalculate(); }, true);
    document.addEventListener("click", e => { const link=e.target.closest("a"); if (link && link.href && link.href.includes("#calc-report=")) { link.target="_self"; return; } const clear=e.target.closest("button.clear-btn,#clearCompoundHistoryBtn"); if (clear) { const type=getPageType(); if (isReportType(type)) setTimeout(() => clearReports(type), 0); } }, true);
  }
  function setupScrollButton() { const btn=byId("scrollTopBtn"); if (!btn) return; window.addEventListener("scroll", () => { btn.style.display = window.scrollY > 200 ? "flex" : "none"; }, { passive:true }); }
  function scrollToTop() { window.scrollTo({ top:0, behavior:"smooth" }); }
  function toggleMenu() { const nav=byId("navbar"); if (nav) nav.classList.toggle("open"); }
  function fallbackCopy(text) { const ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.left="-9999px"; ta.style.top="-9999px"; document.body.appendChild(ta); ta.focus(); ta.select(); document.execCommand("copy"); ta.remove(); }
  async function copyText(text, button) { const v=String(text||"").trim(); if (!v) return; try { if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(v); else fallbackCopy(v); setButtonState(button,"Copied!"); } catch { try { fallbackCopy(v); setButtonState(button,"Copied!"); } catch { setButtonState(button,"Failed"); } } }
  function setButtonState(button, text) { if (!button) return; const old=button.dataset.originalText || button.textContent || "Copy"; button.dataset.originalText=old; button.textContent=text; setTimeout(() => button.textContent=old, 1100); }
  function copyHistoryItem(text, button) { copyText(text, button); }

  function installStyle() {
    if (byId("cleanCalculatorUnifiedStyle")) return;
    const style=document.createElement("style"); style.id="cleanCalculatorUnifiedStyle"; style.textContent = `
      .calculator-report-history-item{display:grid!important;grid-template-columns:1fr auto!important;gap:10px!important;align-items:center!important}
      .calculator-report-open-link{display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:6px 10px!important;background:#d3fff9!important;color:var(--black,#000)!important;border:3px solid var(--black,#000)!important;box-shadow:3px 3px 0 var(--black,#000)!important;text-decoration:none!important;font-weight:bold!important;white-space:nowrap!important}
      .calculator-clean-result,.loan-external-output{width:min(900px,96vw)!important;margin:24px auto!important;display:block!important;visibility:visible!important}
      .calculator-report-page{width:min(1100px,96vw)!important;margin:30px auto!important;padding:18px!important;background:#fff!important;color:var(--black,#000)!important;border:5px solid var(--black,#000)!important;box-shadow:8px 8px 0 var(--black,#000)!important;box-sizing:border-box!important}
      .calculator-report-page h1,.calculator-report-page h2{text-align:center!important}.calculator-report-card{margin:18px 0!important;padding:14px!important;background:#f8f8f8!important;border:4px solid var(--black,#000)!important;box-shadow:5px 5px 0 var(--black,#000)!important}.calculator-report-page table{width:100%!important;border-collapse:collapse!important}.calculator-report-page th,.calculator-report-page td{padding:10px!important;border:3px solid var(--black,#000)!important;text-align:left!important}.calculator-report-table-scroll,.calculator-report-result{overflow-x:auto!important}
      .calculator-report-actions{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important;margin-top:24px!important;padding-top:18px!important;border-top:4px solid var(--black,#000)!important}.calculator-report-action-btn{min-height:54px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:10px 14px!important;color:var(--black,#000)!important;border:5px solid var(--black,#000)!important;box-shadow:5px 5px 0 var(--black,#000)!important;font-family:inherit!important;font-size:18px!important;font-weight:bold!important;text-align:center!important;text-decoration:none!important;cursor:pointer!important}.calculator-report-back-btn{background:#fff4b8!important}.calculator-report-copy-btn{background:#ffd3d3!important}.calculator-report-save-btn{background:#b8ffb8!important}.calculator-report-share-btn{background:#d3fff9!important}
      .calculator-report-summary-boxes,.bmi-input-groups,.loan-optional-row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important;margin:18px 0 22px!important}.bmi-input-groups,.loan-optional-row{grid-template-columns:repeat(2,minmax(0,1fr))!important}.calculator-report-summary-card,.bmi-measurement-box,.bmi-profile-box{padding:16px 12px!important;border:5px solid var(--black,#000)!important;box-shadow:6px 6px 0 var(--black,#000)!important;text-align:center!important;box-sizing:border-box!important}.bmi-measurement-box{background:#d3fff9!important}.bmi-profile-box{background:#fff4b8!important}.calculator-report-monthly-card{background:#d3fff9!important}.calculator-report-interest-card{background:#fff4b8!important}.calculator-report-total-card{background:#b8ffb8!important}.calculator-report-summary-label,.bmi-extra-title{font-weight:bold!important;margin-bottom:8px!important}.calculator-report-summary-value{font-size:24px!important;font-weight:bold!important;overflow-wrap:break-word!important}
      .bmi-input-groups label,.bmi-input-groups input,.bmi-input-groups select,.loan-optional-row label,.loan-optional-row input,.loan-optional-row select{width:100%!important;min-width:0!important;max-width:none!important}.loan-optional-row .optional-mortgage-costs,.loan-optional-row .early-settlement-box{width:100%!important;min-width:0!important;max-width:none!important;margin:0!important;box-sizing:border-box!important}
      body.calculator-report-view #pcHelpQuestionButton,body.calculator-report-view #pcQuestionOverlayButton,body.calculator-report-view .pc-what-slot,body.calculator-report-view .instruction-box,body.calculator-report-view .instruction-what-box{display:none!important;visibility:hidden!important;pointer-events:none!important}
      @media(max-width:850px){.calculator-report-history-item,.calculator-report-actions,.calculator-report-summary-boxes,.bmi-input-groups,.loan-optional-row{grid-template-columns:1fr!important}.calculator-report-open-link,.calculator-report-action-btn{width:100%!important}.calculator-report-action-btn{font-size:16px!important}}
    `; document.head.appendChild(style);
  }

  function init() {
    applyPageClass(); installStyle();
    if (openReportFromHash()) return;
    buildInstructionLayout(); setupNumberInputs(); setupKeyboardSupport(); setupAutoEvents(); setupScrollButton();
    const type=getPageType();
    if (type === "age") ensureAgeTargetDateInput();
    if (type === "bmi") { ensureBMIProfileAndGroups(); toggleBMIUnit(); toggleBMIUnit(); }
    if (type === "loan") ensureMortgageOptionalSections();
    if (type === "basic") showHistory();
    if (isReportType(type)) { hideCalculateButtons(); renderReportHistory(type); setTimeout(hideCalculateButtons, 100); if (readyToCalculate(type)) setTimeout(scheduleAutoCalculate, 250); }
  }
  window.addEventListener("hashchange", () => { if (window.location.hash.startsWith("#calc-report=")) { openReportFromHash(); return; } if (document.body.classList.contains("calculator-report-view")) window.location.href = window.location.href.split("#")[0]; });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  window.add=add; window.clearDisplay=clearDisplay; window.removeLast=removeLast; window.addFunction=addFunction; window.addPower=addPower; window.closeOpenBrackets=closeOpenBrackets; window.calculate=calculate; window.showHistory=showHistory; window.clearHistory=clearHistory; window.copyHistoryItem=copyHistoryItem; window.copyText=copyText; window.scrollToTop=scrollToTop; window.toggleMenu=toggleMenu; window.flashButton=flashButton;
  window.calculateAge=calculateAge; window.calculateBMI=calculateBMI; window.calculateBmi=calculateBMI; window.toggleBMIUnit=toggleBMIUnit; window.calculateLoan=calculateLoan; window.calculateDiscount=calculateDiscount; window.calculatePercentage=calculatePercentage; window.calculateCompound=calculateCompound; window.calculateCompoundInterest=calculateCompound;
  window.clearInputHistory=function(type){ clearReports(type || getPageType()); }; window.clearAgeHistory=function(){ clearReports("age"); }; window.clearBMIHistory=function(){ clearReports("bmi"); }; window.clearLoanHistory=function(){ clearReports("loan"); }; window.clearDiscountHistory=function(){ clearReports("discount"); }; window.clearPercentageHistory=function(){ clearReports("percentage"); }; window.clearCompoundHistory=function(){ clearReports("compound"); };
})();
