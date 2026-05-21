/* =====================================================
   REPAIRED + OPTIMIZED CALCULATOR SCRIPT
   - Removed duplicate functions
   - Fixed history copy button conflicts
   - Fixed left/right hand mode initialization
   - Fixed dropdown auto-close for <details> and class-based menus
   - Kept old global function names for existing HTML onclick="..."
===================================================== */

(function () {
  "use strict";

  /* =========================
     STORAGE HELPERS
  ========================= */

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
      // Ignore storage errors, for example private browsing restrictions.
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors.
    }
  }

  function loadHistory() {
    try {
      const saved = JSON.parse(safeGet("calcHistory", "[]"));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  let calcHistory = loadHistory();
  let lastAnswer = Number(safeGet("lastAnswer", "0")) || 0;
  let pageZoom = Number(safeGet("pageZoom", "1")) || 1;

  /* =========================
     SMALL HELPERS
  ========================= */

  const $ = function (selector, parent) {
    return (parent || document).querySelector(selector);
  };

  const $$ = function (selector, parent) {
    return Array.from((parent || document).querySelectorAll(selector));
  };

  function getDisplay() {
    return document.getElementById("display");
  }

  function clearError(display) {
    if (display && display.value === "Error") {
      display.value = "";
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setButtonState(button, text) {
    if (!button) return;
    const original = button.dataset.originalText || button.textContent || "Copy";
    button.dataset.originalText = original;
    button.textContent = text;

    setTimeout(function () {
      button.textContent = original;
    }, 1000);
  }

  /* =========================
     DISPLAY FUNCTIONS
  ========================= */

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

    // Replace repeated operators, but still allow a negative number after another operator.
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

  /* =========================
     MATH FUNCTIONS
  ========================= */

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
    // Allow calculator expressions only. This prevents typed JavaScript like alert(), document, window, etc.
    const allowedCharacters = /^[0-9+\-*/().,\sA-Za-z]+$/;
    if (!allowedCharacters.test(expression)) return false;

    const words = expression.match(/[A-Za-z]+/g) || [];
    const allowedWords = new Set(["Math", "sin", "cos", "tan", "log", "log10", "sqrt", "PI", "E"]);

    return words.every(function (word) {
      return allowedWords.has(word);
    });
  }

  function calculate() {
    const display = getDisplay();
    if (!display) return;

    try {
      let expression = display.value.trim();

      if (!expression || expression === "Error") return;

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
      saveHistory(expression, cleanResult);
    } catch {
      display.value = "Error";
    }
  }

  /* =========================
     HISTORY + COPY BUTTONS
  ========================= */

  function saveHistory(expression, result) {
    const item = expression + " = " + result;

    calcHistory.push(item);

    if (calcHistory.length > 50) {
      calcHistory = calcHistory.slice(-50);
    }

    safeSet("calcHistory", JSON.stringify(calcHistory));
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

      copyBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        copyHistoryItem(item, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      historyList.appendChild(li);
    });
  }

  function clearHistory() {
    calcHistory = [];
    safeRemove("calcHistory");
    showHistory();
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

      setButtonState(button, "Copied");
    } catch {
      try {
        fallbackCopy(value);
        setButtonState(button, "Copied");
      } catch {
        setButtonState(button, "Failed");
      }
    }
  }

  function fallbackCopy(text) {
    const tempInput = document.createElement("textarea");
    tempInput.value = text;
    tempInput.setAttribute("readonly", "");
    tempInput.style.position = "fixed";
    tempInput.style.left = "-9999px";
    tempInput.style.top = "-9999px";

    document.body.appendChild(tempInput);
    tempInput.focus();
    tempInput.select();
    tempInput.setSelectionRange(0, tempInput.value.length);

    const copied = document.execCommand("copy");
    document.body.removeChild(tempInput);

    if (!copied) {
      throw new Error("Copy failed");
    }
  }

  function copyHistoryItem(text, button) {
    copyText(text, button);
  }

  const resultIds = [
    "result",
    "bmiResult",
    "loanResult",
    "discountResult",
    "percentageResult"
  ];

  function setupResultCopyButtons() {
    resultIds.forEach(function (id) {
      const resultElement = document.getElementById(id);
      if (!resultElement) return;
      if (resultElement.closest(".result-copy-wrap")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "result-copy-wrap";

      resultElement.parentNode.insertBefore(wrapper, resultElement);
      wrapper.appendChild(resultElement);

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "result-copy-btn";
      copyBtn.textContent = "Copy";

      copyBtn.addEventListener("click", function () {
        copyText(resultElement.innerText || resultElement.textContent, copyBtn);
      });

      wrapper.appendChild(copyBtn);
    });
  }

  function setupHistoryCopyButtons() {
    const lists = [
      document.getElementById("ageHistoryList")
    ];

    lists.forEach(function (list) {
      if (!list) return;

      $$('li', list).forEach(function (li) {
        if (li.querySelector(".history-copy-btn")) return;

        const originalText = li.innerText.trim();
        if (!originalText) return;

        li.innerHTML = "";
        li.classList.add("history-item");

        const textSpan = document.createElement("span");
        textSpan.className = "history-text";
        textSpan.textContent = originalText;

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "history-copy-btn";
        copyBtn.textContent = "Copy";

        copyBtn.addEventListener("click", function (event) {
          event.stopPropagation();
          copyText(textSpan.innerText, copyBtn);
        });

        li.appendChild(textSpan);
        li.appendChild(copyBtn);
      });
    });
  }

  function watchCopyButtons() {
    const targets = [
      document.getElementById("ageHistoryList")
    ];

    targets.forEach(function (target) {
      if (!target || target.dataset.copyObserverReady === "true") return;

      const observer = new MutationObserver(function () {
        setupHistoryCopyButtons();
      });

      observer.observe(target, {
        childList: true,
        subtree: true
      });

      target.dataset.copyObserverReady = "true";
    });
  }

  /* =========================
     NAVBAR + SCROLL
  ========================= */

  function closeNavbar() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    navbar.classList.remove("open");

    if (window.scrollY > 80) {
      navbar.classList.add("scrolled");
    }
  }

  function updateNavbarOnScroll() {
    const navbar = document.getElementById("navbar");
    const menuIcon = document.getElementById("menuIcon");
    const scrollBtn = document.getElementById("scrollTopBtn");

    if (navbar) {
      if (window.scrollY > 80) {
        navbar.classList.add("scrolled");
        if (menuIcon) menuIcon.classList.add("show");
      } else {
        navbar.classList.remove("scrolled", "open");
        if (menuIcon) menuIcon.classList.remove("show");
      }
    }

    if (scrollBtn) {
      scrollBtn.style.display = window.scrollY > 200 ? "flex" : "none";
    }
  }

  function toggleMenu() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    const isOpen = navbar.classList.toggle("open");

    if (isOpen) {
      navbar.classList.remove("scrolled");
    } else if (window.scrollY > 80) {
      navbar.classList.add("scrolled");
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function setupNavbarEvents() {
    window.addEventListener("scroll", updateNavbarOnScroll, { passive: true });

    document.addEventListener("click", function (event) {
      const navbar = document.getElementById("navbar");
      const menuIcon = document.getElementById("menuIcon");

      if (!navbar) return;

      const clickedNavbar = navbar.contains(event.target);
      const clickedMenuIcon = menuIcon && menuIcon.contains(event.target);

      if (!clickedNavbar && !clickedMenuIcon) {
        closeNavbar();
      }
    });

    updateNavbarOnScroll();
  }

  /* =========================
     LEFT / RIGHT HAND MODE
  ========================= */

  function createHandToggleButton() {
    if (document.getElementById("handToggleBtn")) return;

    const button = document.createElement("button");
    button.id = "handToggleBtn";
    button.type = "button";
    button.textContent = "↔";
    button.title = "Switch left hand / right hand mode";
    button.setAttribute("aria-label", "Switch left hand or right hand mode");

    button.addEventListener("click", toggleHandMode);
    document.body.appendChild(button);
  }

  function applyHandMode() {
    const savedMode = safeGet("handMode", "right") === "left" ? "left" : "right";

    document.body.classList.remove("left-hand", "right-hand");
    document.body.classList.add(savedMode + "-hand");
  }

  function toggleHandMode() {
    const nextMode = document.body.classList.contains("left-hand") ? "right" : "left";
    safeSet("handMode", nextMode);
    applyHandMode();
  }

  const loadHandMode = applyHandMode;

  /* =========================
     PAGE RESIZE NAVIGATOR
  ========================= */

  function createResizeNavigator() {
    if (document.getElementById("resizeNavigator")) {
      applyPageZoom();
      return;
    }

    const box = document.createElement("div");
    box.id = "resizeNavigator";

    const minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.textContent = "−";
    minusBtn.setAttribute("aria-label", "Zoom out");
    minusBtn.addEventListener("click", zoomOutPage);

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.textContent = "100";
    resetBtn.setAttribute("aria-label", "Reset zoom");
    resetBtn.addEventListener("click", resetPageZoom);

    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.textContent = "+";
    plusBtn.setAttribute("aria-label", "Zoom in");
    plusBtn.addEventListener("click", zoomInPage);

    box.appendChild(minusBtn);
    box.appendChild(resetBtn);
    box.appendChild(plusBtn);

    document.body.appendChild(box);
    applyPageZoom();
  }

  function applyPageZoom() {
    pageZoom = clamp(Number(pageZoom) || 1, 0.6, 1);

    const pageParts = $$("#navbar, main, .calculator-box, .about-container");

    pageParts.forEach(function (part) {
      part.style.zoom = String(pageZoom);
    });

    const resetBtn = $("#resizeNavigator button:nth-child(2)");
    if (resetBtn) {
      resetBtn.textContent = String(Math.round(pageZoom * 100));
    }

    safeSet("pageZoom", String(pageZoom));
  }

  function zoomInPage() {
    pageZoom = Number(clamp(pageZoom + 0.1, 0.6, 1).toFixed(1));
    applyPageZoom();
  }

  function zoomOutPage() {
    pageZoom = Number(clamp(pageZoom - 0.1, 0.6, 1).toFixed(1));
    applyPageZoom();
  }

  function resetPageZoom() {
    pageZoom = 1;
    applyPageZoom();
  }

  /* =========================
     DROPDOWNS
     Supports both:
     1) <details class="nav-group">
     2) class-based menus using .open or .active
  ========================= */

  function isDetails(element) {
    return element && element.tagName && element.tagName.toLowerCase() === "details";
  }

  function closeDropdown(group) {
    if (!group) return;

    if (isDetails(group)) {
      group.open = false;
    }

    group.classList.remove("open", "active");
  }

  function openDropdown(group) {
    if (!group) return;

    const groups = $$(".nav-group, .group-card");

    groups.forEach(function (otherGroup) {
      if (otherGroup !== group) closeDropdown(otherGroup);
    });

    if (isDetails(group)) {
      group.open = true;
    }

    group.classList.add("open", "active");
  }

  function toggleDropdown(group) {
    if (!group) return;

    const isOpen = isDetails(group)
      ? group.open
      : group.classList.contains("open") || group.classList.contains("active");

    if (isOpen) {
      closeDropdown(group);
    } else {
      openDropdown(group);
    }
  }

  function setupDropdowns() {
    const groups = $$(".nav-group, .group-card");

    groups.forEach(function (group) {
      if (group.dataset.dropdownReady === "true") return;
      group.dataset.dropdownReady = "true";

      if (isDetails(group)) {
        group.addEventListener("toggle", function () {
          if (group.open) openDropdown(group);
        });
        return;
      }

      const trigger = $("summary, button, .nav-link, a", group) || group;

      trigger.addEventListener("click", function (event) {
        // Let normal links work when the group has no submenu.
        const hasSubmenu = !!$(".dropdown, .dropdown-menu, .submenu, ul", group);
        if (!hasSubmenu) return;

        event.preventDefault();
        event.stopPropagation();
        toggleDropdown(group);
      });
    });

    document.addEventListener("click", function (event) {
      groups.forEach(function (group) {
        if (!group.contains(event.target)) {
          closeDropdown(group);
        }
      });
    });
  }

  /* =========================
     KEYBOARD SUPPORT
  ========================= */

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

  /* =========================
     INIT
  ========================= */

  function init() {
    createHandToggleButton();
    applyHandMode();
    showHistory();
    setupResultCopyButtons();
    setupHistoryCopyButtons();
    watchCopyButtons();
    createResizeNavigator();
    setupDropdowns();
    setupNavbarEvents();
    setupKeyboardSupport();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* =========================
     GLOBAL EXPORTS
     Keeps existing HTML onclick="functionName()" working.
  ========================= */

  window.add = add;
  window.clearDisplay = clearDisplay;
  window.removeLast = removeLast;
  window.addFunction = addFunction;
  window.addPower = addPower;
  window.closeOpenBrackets = closeOpenBrackets;
  window.calculate = calculate;
  window.saveHistory = saveHistory;
  window.showHistory = showHistory;
  window.copyHistoryItem = copyHistoryItem;
  window.copyText = copyText;
  window.clearHistory = clearHistory;
  window.toggleMenu = toggleMenu;
  window.scrollToTop = scrollToTop;
  window.createHandToggleButton = createHandToggleButton;
  window.loadHandMode = loadHandMode;
  window.applyHandMode = applyHandMode;
  window.toggleHandMode = toggleHandMode;
  window.flashButton = flashButton;
  window.setupResultCopyButtons = setupResultCopyButtons;
  window.setupHistoryCopyButtons = setupHistoryCopyButtons;
  window.watchCopyButtons = watchCopyButtons;
  window.createResizeNavigator = createResizeNavigator;
  window.applyPageZoom = applyPageZoom;
  window.zoomInPage = zoomInPage;
  window.zoomOutPage = zoomOutPage;
  window.resetPageZoom = resetPageZoom;
  window.setupDropdowns = setupDropdowns;
})();


/* =========================
   PC SIDE MENU CLICK EXPAND
   Click the Calculator button to open/close its side submenu.
   Hover still works from CSS.
========================= */

document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  const calculatorDropdown = navbar.querySelector(":scope > .dropdown");
  if (!calculatorDropdown) return;

  const calculatorButton = calculatorDropdown.querySelector(".dropbtn");
  if (!calculatorButton) return;

  function isPcSideMenu() {
    return window.matchMedia("(min-width: 851px)").matches &&
      navbar.classList.contains("open");
  }

  calculatorButton.addEventListener("click", function (event) {
    if (!isPcSideMenu()) return;

    event.preventDefault();
    event.stopPropagation();

    calculatorDropdown.classList.toggle("menu-open");
  });

  document.addEventListener("click", function (event) {
    if (!calculatorDropdown.contains(event.target)) {
      calculatorDropdown.classList.remove("menu-open");
    }
  });

  window.addEventListener("resize", function () {
    calculatorDropdown.classList.remove("menu-open");
  });
});

/* =========================
   PC SIDE MENU CLICK EXPAND
========================= */

document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  const calculatorDropdown = navbar.querySelector(":scope > .dropdown");
  if (!calculatorDropdown) return;

  const calculatorButton = calculatorDropdown.querySelector(".dropbtn");
  if (!calculatorButton) return;

  function isPcSideMenu() {
    return window.matchMedia("(min-width: 851px)").matches &&
      navbar.classList.contains("open");
  }

  calculatorButton.addEventListener("click", function (event) {
    if (!isPcSideMenu()) return;

    event.preventDefault();
    event.stopPropagation();

    calculatorDropdown.classList.toggle("menu-open");
  });

  document.addEventListener("click", function (event) {
    if (!calculatorDropdown.contains(event.target)) {
      calculatorDropdown.classList.remove("menu-open");
    }
  });

  window.addEventListener("resize", function () {
    calculatorDropdown.classList.remove("menu-open");
  });
});

/* =====================================================
   TOP NAVBAR CHANGES TO MENU ICON ON SCROLL
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("navbar");
  const menuIcon = document.getElementById("menuIcon");

  if (!navbar || !menuIcon) return;

  function updateScrolledMenu() {
    if (window.scrollY > 90) {
      document.body.classList.add("menu-scrolled");
      navbar.classList.add("scrolled");
      menuIcon.classList.add("show");
    } else {
      document.body.classList.remove("menu-scrolled");
      navbar.classList.remove("scrolled");
      navbar.classList.remove("open");
      menuIcon.classList.remove("show");
    }
  }

  window.toggleMenu = function () {
    if (!document.body.classList.contains("menu-scrolled")) return;
    navbar.classList.toggle("open");
  };

  menuIcon.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    window.toggleMenu();
  });

  document.addEventListener("click", function (event) {
    if (
      document.body.classList.contains("menu-scrolled") &&
      !navbar.contains(event.target) &&
      !menuIcon.contains(event.target)
    ) {
      navbar.classList.remove("open");
    }
  });

  window.addEventListener("scroll", updateScrolledMenu);
  updateScrolledMenu();
});

/* =====================================================
   OPEN ALL DETAILS DROPDOWNS ON HOVER
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const hoverDropdowns = document.querySelectorAll(".nav-group, .group-card");

  hoverDropdowns.forEach(function (dropdown) {
    dropdown.addEventListener("mouseenter", function () {
      dropdown.open = true;
    });

    dropdown.addEventListener("mouseleave", function () {
      dropdown.open = false;
    });

    dropdown.addEventListener("focusin", function () {
      dropdown.open = true;
    });

    dropdown.addEventListener("focusout", function () {
      setTimeout(function () {
        if (!dropdown.contains(document.activeElement)) {
          dropdown.open = false;
        }
      }, 100);
    });
  });
});