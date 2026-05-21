/* =========================
   STORAGE
========================= */

let calcHistory = [];
let lastAnswer = 0;

try {
  calcHistory = JSON.parse(localStorage.getItem("calcHistory")) || [];
} catch {
  calcHistory = [];
}

try {
  lastAnswer = Number(localStorage.getItem("lastAnswer")) || 0;
} catch {
  lastAnswer = 0;
}

/* =========================
   DISPLAY FUNCTIONS
========================= */

function add(value) {
  const display = document.getElementById("display");
  if (!display) return;

  const operators = ["+", "-", "*", "/"];
  const lastChar = display.value.slice(-1);

  if (display.value === "Error") {
    display.value = "";
  }

  if (value === "Ans") {
    display.value += lastAnswer;
    return;
  }

  if (value === "%") {
    display.value += "/100";
    return;
  }

  if (operators.includes(value) && operators.includes(lastChar)) {
    display.value = display.value.slice(0, -1) + value;
  } else {
    display.value += value;
  }
}

function clearDisplay() {
  const display = document.getElementById("display");
  if (display) display.value = "";
}

function removeLast() {
  const display = document.getElementById("display");
  if (!display) return;

  if (display.value === "Error") {
    display.value = "";
    return;
  }

  display.value = display.value.slice(0, -1);
}

/* =========================
   MATH FUNCTIONS
========================= */

function addFunction(func) {
  const display = document.getElementById("display");
  if (!display) return;

  if (display.value === "Error") {
    display.value = "";
  }

  if (func === "sin") {
    display.value += "Math.sin(";
  } else if (func === "cos") {
    display.value += "Math.cos(";
  } else if (func === "tan") {
    display.value += "Math.tan(";
  } else if (func === "log") {
    display.value += "Math.log10(";
  } else if (func === "ln") {
    display.value += "Math.log(";
  } else if (func === "sqrt") {
    display.value += "Math.sqrt(";
  }
}

function addPower() {
  const display = document.getElementById("display");
  if (!display) return;

  if (display.value === "Error") {
    display.value = "";
  }

  display.value += "**";
}

function closeOpenBrackets(expression) {
  const open = (expression.match(/\(/g) || []).length;
  const close = (expression.match(/\)/g) || []).length;

  if (open > close) {
    return expression + ")".repeat(open - close);
  }

  return expression;
}

function calculate() {
  const display = document.getElementById("display");
  if (!display) return;

  try {
    let expression = display.value;

    if (expression.trim() === "" || expression === "Error") {
      return;
    }

    expression = closeOpenBrackets(expression);

    const result = Function('"use strict"; return (' + expression + ')')();

    if (!Number.isFinite(result)) {
      display.value = "Error";
      return;
    }

    display.value = result;

    lastAnswer = result;
    localStorage.setItem("lastAnswer", String(lastAnswer));

    saveHistory(expression, result);

  } catch {
    display.value = "Error";
  }
}

/* =========================
   HISTORY WITH COPY BUTTON
========================= */

function saveHistory(expression, result) {
  const item = expression + " = " + result;

  calcHistory.push(item);

  if (calcHistory.length > 50) {
    calcHistory.shift();
  }

  localStorage.setItem("calcHistory", JSON.stringify(calcHistory));
  showHistory();
}

function showHistory() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  historyList.innerHTML = "";

  calcHistory.slice().reverse().forEach(function (item) {
    const li = document.createElement("li");
    li.className = "history-item";

    const text = document.createElement("span");
    text.className = "history-text";
    text.textContent = item;

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "history-copy-btn";
    copyBtn.textContent = "copy";

    copyBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      copyHistoryItem(item, copyBtn);
    });

    li.appendChild(text);
    li.appendChild(copyBtn);
    historyList.appendChild(li);
  });
}

function copyHistoryItem(text, button) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(function () {
        showCopied(button);
      })
      .catch(function () {
        fallbackCopy(text, button);
      });
  } else {
    fallbackCopy(text, button);
  }
}

function fallbackCopy(text, button) {
  const tempInput = document.createElement("textarea");
  tempInput.value = text;
  tempInput.style.position = "fixed";
  tempInput.style.left = "-9999px";
  tempInput.style.top = "-9999px";

  document.body.appendChild(tempInput);
  tempInput.focus();
  tempInput.select();

  try {
    document.execCommand("copy");
    showCopied(button);
  } catch {
    button.textContent = "failed";

    setTimeout(function () {
      button.textContent = "copy";
    }, 1000);
  }

  document.body.removeChild(tempInput);
}

function showCopied(button) {
  button.textContent = "copied";

  setTimeout(function () {
    button.textContent = "copy";
  }, 1000);
}

function clearHistory() {
  calcHistory = [];
  localStorage.removeItem("calcHistory");

  const historyList = document.getElementById("historyList");

  if (historyList) {
    historyList.innerHTML = "";
  }
}

/* =========================
   NAVBAR + SCROLL
========================= */

window.addEventListener("scroll", function () {
  const navbar = document.getElementById("navbar");
  const menuIcon = document.getElementById("menuIcon");
  const scrollBtn = document.getElementById("scrollTopBtn");

  if (navbar && menuIcon) {
    if (window.scrollY > 80) {
      navbar.classList.add("scrolled");
      menuIcon.classList.add("show");
    } else {
      navbar.classList.remove("scrolled");
      navbar.classList.remove("open");
      menuIcon.classList.remove("show");
    }
  }

  if (scrollBtn) {
    scrollBtn.style.display = window.scrollY > 200 ? "flex" : "none";
  }
});

function toggleMenu() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  navbar.classList.toggle("open");

  if (navbar.classList.contains("open")) {
    navbar.classList.remove("scrolled");
  } else {
    navbar.classList.add("scrolled");
  }
}

document.addEventListener("click", function (event) {
  const navbar = document.getElementById("navbar");
  const menuIcon = document.getElementById("menuIcon");

  if (
    navbar &&
    menuIcon &&
    !navbar.contains(event.target) &&
    !menuIcon.contains(event.target)
  ) {
    navbar.classList.remove("open");

    if (window.scrollY > 80) {
      navbar.classList.add("scrolled");
    }
  }
});

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================
   LEFT / RIGHT HAND MODE
========================= */

function createHandToggleButton() {
  if (document.getElementById("handToggleBtn")) return;

  const button = document.createElement("button");

  button.id = "handToggleBtn";
  button.type = "button";
  button.innerText = "↔";
  button.title = "Switch left hand / right hand mode";
  button.onclick = toggleHandMode;

  document.body.appendChild(button);
}

function loadHandMode() {
  const savedMode = localStorage.getItem("handMode");

  document.body.classList.remove("left-hand", "right-hand");

  if (savedMode === "left") {
    document.body.classList.add("left-hand");
  } else {
    document.body.classList.add("right-hand");
  }
}

function toggleHandMode() {
  const isLeft = document.body.classList.contains("left-hand");

  document.body.classList.remove("left-hand", "right-hand");

  if (isLeft) {
    document.body.classList.add("right-hand");
    localStorage.setItem("handMode", "right");
  } else {
    document.body.classList.add("left-hand");
    localStorage.setItem("handMode", "left");
  }
}

/* =========================
   KEYBOARD SUPPORT
========================= */

document.addEventListener("keydown", function (event) {
  const display = document.getElementById("display");
  if (!display) return;

  const key = event.key;

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

  if (key === "+") {
    add("+");
    flashButton("+");
    return;
  }

  if (key === "-") {
    add("-");
    flashButton("−");
    return;
  }

  if (key === "*" || key.toLowerCase() === "x") {
    add("*");
    flashButton("×");
    return;
  }

  if (key === "/") {
    event.preventDefault();
    add("/");
    flashButton("÷");
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
    clearDisplay();
    flashButton("AC");
    return;
  }

  if (key === "^") {
    addPower();
    flashButton("xʸ");
    return;
  }

  if (key.toLowerCase() === "r") {
    addFunction("sqrt");
    flashButton("√");
    return;
  }

  if (key.toLowerCase() === "a") {
    add("Ans");
    flashButton("ANS");
    return;
  }
});

function flashButton(buttonText) {
  const buttons = document.querySelectorAll(".buttons button, .ans-btn");

  buttons.forEach(function (button) {
    if (button.textContent.trim().toUpperCase() === buttonText.toUpperCase()) {
      button.classList.add("keyboard-active");

      setTimeout(function () {
        button.classList.remove("keyboard-active");
      }, 150);
    }
  });
}

/* =========================
   PAGE LOAD
========================= */

document.addEventListener("DOMContentLoaded", function () {
  createHandToggleButton();
  loadHandMode();
  showHistory();
});

/* =========================
   FINAL HISTORY COPY BUTTON FIX
========================= */

function saveHistory(expression, result) {
  const item = expression + " = " + result;

  calcHistory.push(item);

  if (calcHistory.length > 50) {
    calcHistory.shift();
  }

  localStorage.setItem("calcHistory", JSON.stringify(calcHistory));

  showHistory();
}

function showHistory() {
  const historyList = document.getElementById("historyList");

  if (!historyList) return;

  historyList.innerHTML = "";

  calcHistory.slice().reverse().forEach(function (item) {
    const li = document.createElement("li");
    li.className = "history-item";

    const text = document.createElement("span");
    text.className = "history-text";
    text.textContent = item;

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "history-copy-btn";
    copyBtn.textContent = "Copy";

    copyBtn.onclick = function () {
      copyHistoryItem(item, copyBtn);
    };

    li.appendChild(text);
    li.appendChild(copyBtn);

    historyList.appendChild(li);
  });
}

function copyHistoryItem(text, button) {
  const tempInput = document.createElement("textarea");
  tempInput.value = text;
  document.body.appendChild(tempInput);

  tempInput.select();
  tempInput.setSelectionRange(0, 99999);

  document.execCommand("copy");

  document.body.removeChild(tempInput);

  button.textContent = "Copied";

  setTimeout(function () {
    button.textContent = "Copy";
  }, 1000);
}

document.addEventListener("DOMContentLoaded", function () {
  showHistory();
});

/* =========================
   COPY BUTTONS FOR ALL RESULTS + HISTORY
========================= */

const resultIds = [
  "result",
  "bmiResult",
  "loanResult",
  "discountResult",
  "percentageResult"
];

function copyText(text, button) {
  if (!text || text.trim() === "") return;

  const tempInput = document.createElement("textarea");
  tempInput.value = text;
  tempInput.style.position = "fixed";
  tempInput.style.left = "-9999px";
  tempInput.style.top = "-9999px";

  document.body.appendChild(tempInput);
  tempInput.focus();
  tempInput.select();

  try {
    document.execCommand("copy");
    button.textContent = "Copied";
  } catch {
    button.textContent = "Failed";
  }

  document.body.removeChild(tempInput);

  setTimeout(function () {
    button.textContent = "Copy";
  }, 1000);
}

/* Add copy button beside result text */
function setupResultCopyButtons() {
  resultIds.forEach(function (id) {
    const resultElement = document.getElementById(id);

    if (!resultElement) return;
    if (resultElement.parentElement.classList.contains("result-copy-wrap")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "result-copy-wrap";

    resultElement.parentNode.insertBefore(wrapper, resultElement);
    wrapper.appendChild(resultElement);

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "result-copy-btn";
    copyBtn.textContent = "Copy";

    copyBtn.onclick = function () {
      copyText(resultElement.innerText, copyBtn);
    };

    wrapper.appendChild(copyBtn);
  });
}

/* Add copy button to history/result list items */
function setupHistoryCopyButtons() {
  const lists = [
    document.getElementById("historyList"),
    document.getElementById("ageHistoryList")
  ];

  lists.forEach(function (list) {
    if (!list) return;

    list.querySelectorAll("li").forEach(function (li) {
      if (li.querySelector(".history-copy-btn")) return;

      const originalText = li.innerText;

      li.innerHTML = "";
      li.classList.add("history-item");

      const textSpan = document.createElement("span");
      textSpan.className = "history-text";
      textSpan.textContent = originalText;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "history-copy-btn";
      copyBtn.textContent = "Copy";

      copyBtn.onclick = function () {
        copyText(textSpan.innerText, copyBtn);
      };

      li.appendChild(textSpan);
      li.appendChild(copyBtn);
    });
  });
}

/* Watch history lists because new results are added after calculation */
function watchCopyButtons() {
  const targets = [
    document.getElementById("historyList"),
    document.getElementById("ageHistoryList")
  ];

  targets.forEach(function (target) {
    if (!target) return;

    const observer = new MutationObserver(function () {
      setupHistoryCopyButtons();
    });

    observer.observe(target, {
      childList: true,
      subtree: true
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  setupResultCopyButtons();
  setupHistoryCopyButtons();
  watchCopyButtons();
});

/* =========================
   PAGE RESIZE NAVIGATOR
========================= */

let pageZoom = Number(localStorage.getItem("pageZoom")) || 1;

if (pageZoom > 1) {
  pageZoom = 1;
}

function createResizeNavigator() {
  if (document.getElementById("resizeNavigator")) return;

  const box = document.createElement("div");
  box.id = "resizeNavigator";

  const plusBtn = document.createElement("button");
  plusBtn.type = "button";
  plusBtn.textContent = "+";
  plusBtn.onclick = zoomInPage;

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.textContent = "100";
  resetBtn.onclick = resetPageZoom;

  const minusBtn = document.createElement("button");
  minusBtn.type = "button";
  minusBtn.textContent = "−";
  minusBtn.onclick = zoomOutPage;

  box.appendChild(plusBtn);
  box.appendChild(resetBtn);
  box.appendChild(minusBtn);

  document.body.appendChild(box);

  applyPageZoom();
}

function applyPageZoom() {
  if (pageZoom > 1) pageZoom = 1;
  if (pageZoom < 0.6) pageZoom = 0.6;

  const pageParts = document.querySelectorAll(
    "#navbar, main, .calculator-box, .about-container"
  );

  pageParts.forEach(function (part) {
    part.style.zoom = pageZoom;
  });

  const resetBtn = document.querySelector("#resizeNavigator button:nth-child(2)");

  if (resetBtn) {
    resetBtn.textContent = Math.round(pageZoom * 100);
  }

  localStorage.setItem("pageZoom", String(pageZoom));
}

function zoomInPage() {
  if (pageZoom < 1) {
    pageZoom += 0.1;
    pageZoom = Number(pageZoom.toFixed(1));
    applyPageZoom();
  }
}

function zoomOutPage() {
  if (pageZoom > 0.6) {
    pageZoom -= 0.1;
    pageZoom = Number(pageZoom.toFixed(1));
    applyPageZoom();
  }
}

function resetPageZoom() {
  pageZoom = 1;
  applyPageZoom();
}

document.addEventListener("DOMContentLoaded", function () {
  createResizeNavigator();
});

/* =========================
   LEFT / RIGHT HAND MODE
========================= */

function createHandToggleButton() {
  if (document.getElementById("handToggleBtn")) return;

  const button = document.createElement("button");
  button.id = "handToggleBtn";
  button.type = "button";
  button.textContent = "↔";
  button.onclick = toggleHandMode;

  document.body.appendChild(button);
}

function applyHandMode() {
  const savedMode = localStorage.getItem("handMode") || "right";

  document.body.classList.remove("left-hand");
  document.body.classList.remove("right-hand");

  if (savedMode === "left") {
    document.body.classList.add("left-hand");
  } else {
    document.body.classList.add("right-hand");
  }
}

function toggleHandMode() {
  const isLeft = document.body.classList.contains("left-hand");

  if (isLeft) {
    localStorage.setItem("handMode", "right");
  } else {
    localStorage.setItem("handMode", "left");
  }

  applyHandMode();
}

document.addEventListener("DOMContentLoaded", function () {
  createHandToggleButton();
  applyHandMode();
});

/* =========================
   AUTO CLOSE OTHER DROPDOWNS
========================= */

document.addEventListener("DOMContentLoaded", function () {
  const dropdownGroups = document.querySelectorAll(".nav-group, .group-card");

  dropdownGroups.forEach(function (group) {
    group.addEventListener("toggle", function () {
      if (group.open) {
        dropdownGroups.forEach(function (otherGroup) {
          if (otherGroup !== group) {
            otherGroup.open = false;
          }
        });
      }
    });
  });

  document.addEventListener("click", function (event) {
    dropdownGroups.forEach(function (group) {
      if (!group.contains(event.target)) {
        group.open = false;
      }
    });
  });
});