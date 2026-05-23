
/*
  Copyright © 2026 Hamdi. All rights reserved.
  Do not copy, modify, or redistribute without permission.
*/

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
/* =====================================================
   HOUSE ICON HOVER EXPANDS MENU
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("navbar");
  const menuIcon = document.getElementById("menuIcon");

  if (!navbar || !menuIcon) return;

  let closeTimer;

  function isPastTopMenu() {
    return window.scrollY > 90;
  }

  function openMenu() {
    if (!isPastTopMenu()) return;

    document.body.classList.add("menu-scrolled");
    navbar.classList.add("scrolled");
    navbar.classList.add("open");
    menuIcon.classList.add("show");
  }

  function closeMenuSoon() {
    clearTimeout(closeTimer);

    closeTimer = setTimeout(function () {
      if (!navbar.matches(":hover") && !menuIcon.matches(":hover")) {
        navbar.classList.remove("open");
      }
    }, 180);
  }

  function updateScrollMenu() {
    if (isPastTopMenu()) {
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

  menuIcon.addEventListener("mouseenter", openMenu);
  menuIcon.addEventListener("mouseleave", closeMenuSoon);

  navbar.addEventListener("mouseenter", function () {
    clearTimeout(closeTimer);
  });

  navbar.addEventListener("mouseleave", closeMenuSoon);

  menuIcon.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (!isPastTopMenu()) return;

    document.body.classList.add("menu-scrolled");
    navbar.classList.add("scrolled");
    menuIcon.classList.add("show");
    navbar.classList.toggle("open");
  });

  document.addEventListener("click", function (event) {
    if (!navbar.contains(event.target) && !menuIcon.contains(event.target)) {
      navbar.classList.remove("open");
    }
  });

  window.addEventListener("scroll", updateScrollMenu);
  updateScrollMenu();
});
/* =====================================================
   PC: HOME ICON HOVER OPENS LEFT SIDE MENU
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("navbar");
  const menuIcon = document.getElementById("menuIcon");

  if (!navbar || !menuIcon) return;

  let closeTimer;

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function isPastTopMenu() {
    return window.scrollY > 90;
  }

  function showIconAfterScroll() {
    if (isPastTopMenu()) {
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

  function openSideMenu() {
    if (!isPc() || !isPastTopMenu()) return;

    clearTimeout(closeTimer);

    document.body.classList.add("menu-scrolled");
    navbar.classList.add("scrolled");
    navbar.classList.add("open");
    menuIcon.classList.add("show");
  }

  function closeSideMenuSoon() {
    clearTimeout(closeTimer);

    closeTimer = setTimeout(function () {
      if (!navbar.matches(":hover") && !menuIcon.matches(":hover")) {
        navbar.classList.remove("open");
      }
    }, 180);
  }

  menuIcon.addEventListener("mouseenter", openSideMenu);
  navbar.addEventListener("mouseenter", function () {
    clearTimeout(closeTimer);
  });

  menuIcon.addEventListener("mouseleave", closeSideMenuSoon);
  navbar.addEventListener("mouseleave", closeSideMenuSoon);

  menuIcon.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (!isPastTopMenu()) return;

    navbar.classList.toggle("open");
  });

  window.addEventListener("scroll", showIconAfterScroll);
  showIconAfterScroll();
});
/* =====================================================
   PC: MENU BUTTON HOVER OPENS LEFT SIDE MENU
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("navbar");
  const menuIcon = document.getElementById("menuIcon");

  if (!navbar || !menuIcon) return;

  let closeTimer;

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function isPastTopMenu() {
    return window.scrollY > 90;
  }

  function updateMenuIcon() {
    if (isPastTopMenu()) {
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

  function openMenu() {
    if (!isPc() || !isPastTopMenu()) return;

    clearTimeout(closeTimer);

    document.body.classList.add("menu-scrolled");
    navbar.classList.add("scrolled");
    navbar.classList.add("open");
    menuIcon.classList.add("show");
  }

  function closeMenuSoon() {
    clearTimeout(closeTimer);

    closeTimer = setTimeout(function () {
      if (!navbar.matches(":hover") && !menuIcon.matches(":hover")) {
        navbar.classList.remove("open");
      }
    }, 180);
  }

  menuIcon.addEventListener("mouseenter", openMenu);
  menuIcon.addEventListener("mouseleave", closeMenuSoon);

  navbar.addEventListener("mouseenter", function () {
    clearTimeout(closeTimer);
  });

  navbar.addEventListener("mouseleave", closeMenuSoon);

  menuIcon.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (!isPastTopMenu()) return;

    navbar.classList.toggle("open");
  });

  window.addEventListener("scroll", updateMenuIcon);
  updateMenuIcon();
});

/* =====================================================
   FINAL MENU SCROLL + HOVER SYSTEM
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("navbar");
  const menuIcon = document.getElementById("menuIcon");

  if (!navbar || !menuIcon) return;

  let closeTimer;

  function isPastTopMenu() {
    return window.scrollY > 90;
  }

  function updateMenuIcon() {
    if (isPastTopMenu()) {
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

  function openMenu() {
    if (!isPastTopMenu()) return;

    clearTimeout(closeTimer);

    document.body.classList.add("menu-scrolled");
    navbar.classList.add("scrolled");
    navbar.classList.add("open");
    menuIcon.classList.add("show");
  }

  function closeMenuSoon() {
    clearTimeout(closeTimer);

    closeTimer = setTimeout(function () {
      if (!navbar.matches(":hover") && !menuIcon.matches(":hover")) {
        navbar.classList.remove("open");
      }
    }, 180);
  }

  menuIcon.addEventListener("mouseenter", openMenu);
  menuIcon.addEventListener("mouseleave", closeMenuSoon);

  navbar.addEventListener("mouseenter", function () {
    clearTimeout(closeTimer);
  });

  navbar.addEventListener("mouseleave", closeMenuSoon);

  menuIcon.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (!isPastTopMenu()) return;

    navbar.classList.toggle("open");
  });

  document.addEventListener("click", function (event) {
    if (!navbar.contains(event.target) && !menuIcon.contains(event.target)) {
      navbar.classList.remove("open");
    }
  });

  window.addEventListener("scroll", updateMenuIcon);
  updateMenuIcon();
});

/* Restrict all calculator number inputs to numbers only */
document.addEventListener("DOMContentLoaded", function () {
  const numberInputs = document.querySelectorAll('input[type="number"]');

  numberInputs.forEach(function (input) {
    input.setAttribute("inputmode", "decimal");

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
      let value = input.value;

      value = value.replace(/[^0-9.]/g, "");

      const parts = value.split(".");
      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("");
      }

      input.value = value;
    });

    input.addEventListener("paste", function (event) {
      event.preventDefault();

      const pastedText = (event.clipboardData || window.clipboardData).getData("text");
      let cleanedText = pastedText.replace(/[^0-9.]/g, "");

      const parts = cleanedText.split(".");
      if (parts.length > 2) {
        cleanedText = parts[0] + "." + parts.slice(1).join("");
      }

      input.value = cleanedText;
      input.dispatchEvent(new Event("input"));
    });
  });
});

/* =====================================================
   MASTER INSTRUCTION + REFERENCES + PC SIDE LAYOUT
   One system only:
   PC left: What + Result/History
   PC center: Calculator
   PC right: Instructions + References
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function getPageTitle() {
    const h1 = document.querySelector("h1");
    return h1 ? h1.textContent.trim().toLowerCase() : "";
  }

  function getPageData() {
    const title = getPageTitle();

    if (title.includes("basic")) {
      return {
        what: "It helps you do quick math calculations like addition, subtraction, multiplication, division, power, and square root.",
        how: "Enter numbers using the buttons, choose an operator, then press = to get the answer.",
        formula: "The calculator follows normal math order: brackets first, then powers, multiplication/division, then addition/subtraction.",
        example: "8 + 2 × 3 = 14 because multiplication is calculated before addition.",
        references: [
          ["Order of operations", "Purplemath explains the normal order of operations.", "https://www.purplemath.com/modules/orderops.htm"]
        ]
      };
    }

    if (title.includes("age")) {
      return {
        what: "It calculates normal age and Asian age from a selected birth date.",
        how: "Select your birth date, then press calculate age.",
        formula: "Normal age is based on the difference between today and the birth date. Asian age uses current year − birth year + 1.",
        example: "If someone was born in 2000 and the current year is 2026, Asian age is 27.",
        references: [
          ["Age calculation", "Microsoft shows age calculation using today’s date and a birth date.", "https://support.microsoft.com/en-us/office/calculate-age-113d599f-5fea-448f-a4c3-268927911b37"]
        ]
      };
    }

    if (title.includes("bmi")) {
      return {
        what: "It calculates Body Mass Index and can also check waist-to-height ratio.",
        how: "Choose SI or US units, enter weight and height, optionally enter waist size, then press calculate BMI.",
        formula: "SI: BMI = weight kg ÷ height m². US: BMI = weight lb ÷ height inch² × 703.",
        example: "70 kg and 1.70 m gives BMI = 70 ÷ 1.70² = 24.22.",
        references: [
          ["CDC BMI formula", "CDC lists metric and US customary formulas for calculating BMI.", "https://www.cdc.gov/growth-chart-training/hcp/using-bmi/body-mass-index.html"]
        ]
      };
    }

    if (title.includes("loan")) {
      return {
        what: "It estimates monthly loan payment, total payment, and total interest.",
        how: "Enter loan amount, annual interest rate, and loan years. Then press calculate loan.",
        formula: "Monthly Payment = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1).",
        example: "A 10,000 loan at 5% yearly for 5 years gives an estimated monthly payment using the amortization formula.",
        references: [
          ["Loan amortization", "Chase explains fixed-payment amortized loan calculations.", "https://www.chase.com/personal/mortgage/education/financing-a-home/loan-amortization"],
          ["Mortgage formula", "Investopedia lists the mortgage payment formula using principal, rate, and months.", "https://www.investopedia.com/mortgage-calculator-5084794"]
        ]
      };
    }

    if (title.includes("discount")) {
      return {
        what: "It calculates final price after discount and how much money you save.",
        how: "Enter the original price and discount percentage, then press calculate discount.",
        formula: "Savings = original price × discount ÷ 100. Final price = original price − savings.",
        example: "If price is 100 and discount is 20%, savings = 20 and final price = 80.",
        references: [
          ["Discount calculation", "Calculator.net explains percent-off discount calculation.", "https://www.calculator.net/discount-calculator.html"],
          ["Discount meaning", "Cambridge Dictionary defines discount as a reduction in price.", "https://dictionary.cambridge.org/dictionary/english/discount"]
        ]
      };
    }

    if (title.includes("percentage")) {
      return {
        what: "It calculates a percentage of a number.",
        how: "Enter the percentage value and the number, then press calculate percentage.",
        formula: "Result = percentage ÷ 100 × number.",
        example: "20% of 150 = 20 ÷ 100 × 150 = 30.",
        references: [
          ["Percentage meaning", "A percentage means a value out of 100.", "https://en.wikipedia.org/wiki/Percentage"],
          ["Percentage formula", "CalculatorSoup lists common percentage formulas.", "https://www.calculatorsoup.com/calculators/math/percentage.php"]
        ]
      };
    }

    if (title.includes("compound")) {
      return {
        what: "It estimates how much your money can grow when interest is added repeatedly over time.",
        how: "Enter principal amount, annual interest rate, time in years, and compounding frequency. Then press calculate compound interest.",
        formula: "A = P(1 + r/n)ⁿᵗ. Compound Interest = A − P.",
        example: "P = 1000, r = 5%, t = 10 years, n = 12 gives about 1,647.01 future value and 647.01 compound interest.",
        references: [
          ["Compound interest formula", "Investopedia lists the compound interest formula as A = P(1 + r/n)^(nt).", "https://www.investopedia.com/articles/investing/020614/learn-simple-and-compound-interest.asp"]
        ]
      };
    }

    return null;
  }

  function makeBox(className, title, text) {
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

  function getLeftBox(main) {
    return (
      main.querySelector(":scope > .history") ||
      main.querySelector(":scope > .age-history-box") ||
      main.querySelector(":scope > .bmi-history-box") ||
      main.querySelector(":scope > .discount-history-box") ||
      main.querySelector(":scope > .loan-history-box") ||
      main.querySelector(":scope > .percentage-history-box") ||
      main.querySelector(":scope > .compound-history-box")
    );
  }

  function syncWhatBox() {
    document.querySelectorAll("main.has-instructions").forEach(function (main) {
      const instructionBox = main.querySelector(":scope > .instruction-box");
      if (!instructionBox) return;

      let whatBox =
        main.querySelector(":scope > .pc-what-slot .instruction-what-box") ||
        instructionBox.querySelector(":scope > .instruction-what-box");

      if (!whatBox) return;

      const leftBox = getLeftBox(main);
      if (!leftBox) return;

      let slot = main.querySelector(":scope > .pc-what-slot");

      if (isPc()) {
        if (!slot) {
          slot = document.createElement("aside");
          slot.className = "pc-what-slot";
          slot.setAttribute("aria-label", "What this calculator does");
          main.insertBefore(slot, leftBox);
        }

        if (!slot.contains(whatBox)) {
          slot.appendChild(whatBox);
        }
      } else {
        const title = instructionBox.querySelector(".instruction-main-title");

        if (title && !instructionBox.contains(whatBox)) {
          instructionBox.insertBefore(whatBox, title);
        }

        if (slot && !slot.children.length) {
          slot.remove();
        }
      }
    });
  }

  function buildInstructionLayout() {
    const main = document.querySelector("main");
    if (!main) return;

    if (main.classList.contains("calculator-box")) {
      main.querySelectorAll(":scope > .instruction-box, :scope > .pc-what-slot").forEach(function (el) {
        el.remove();
      });
      main.classList.remove("has-instructions");
      return;
    }

    const data = getPageData();
    if (!data) return;

    main.classList.add("has-instructions");

    main.querySelectorAll(":scope > .instruction-box, :scope > .pc-what-slot").forEach(function (el) {
      el.remove();
    });

    const instructionBox = document.createElement("aside");
    instructionBox.className = "instruction-box";
    instructionBox.setAttribute("aria-label", "Instructions");

    instructionBox.appendChild(
      makeBox("instruction-section instruction-what-box", "What does this calculator do?", data.what)
    );

    const instructionTitle = document.createElement("h2");
    instructionTitle.className = "instruction-main-title";
    instructionTitle.textContent = "Instructions";
    instructionBox.appendChild(instructionTitle);

    instructionBox.appendChild(makeBox("instruction-section instruction-how-box", "How to use it", data.how));
    instructionBox.appendChild(makeBox("instruction-section instruction-formula-box", "Formula used", data.formula));
    instructionBox.appendChild(makeBox("instruction-section instruction-example-box", "Example calculation", data.example));

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
    syncWhatBox();
  }

  function start() {
    buildInstructionLayout();
    window.addEventListener("resize", syncWhatBox);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


/* =====================================================
   LATEST PC ORIENTATION FOR CALCULATOR PAGES ONLY
   Excludes index/about/privacy/contact
   LEFT: What + Result/History
   CENTER: Calculator
   RIGHT: Instructions + References
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function isExcludedPage(main) {
    return (
      main.classList.contains("calculator-box") ||
      document.body.classList.contains("about-page") ||
      document.body.classList.contains("privacy-page") ||
      document.body.classList.contains("contact-page") ||
      document.body.classList.contains("info-page")
    );
  }

  function getLeftBox(main) {
    return (
      main.querySelector(":scope > .history") ||
      main.querySelector(":scope > .age-history-box") ||
      main.querySelector(":scope > .bmi-history-box") ||
      main.querySelector(":scope > .discount-history-box") ||
      main.querySelector(":scope > .loan-history-box") ||
      main.querySelector(":scope > .percentage-history-box") ||
      main.querySelector(":scope > .compound-history-box")
    );
  }

  function syncPcOrientation() {
    document.querySelectorAll("main.has-instructions").forEach(function (main) {
      if (isExcludedPage(main)) return;

      const instructionBox = main.querySelector(":scope > .instruction-box");
      const leftBox = getLeftBox(main);

      if (!instructionBox || !leftBox) return;

      let whatBox =
        main.querySelector(":scope > .pc-what-slot .instruction-what-box") ||
        instructionBox.querySelector(":scope > .instruction-what-box");

      if (!whatBox) return;

      /* remove duplicate What boxes */
      main.querySelectorAll(".instruction-what-box").forEach(function (box) {
        if (box !== whatBox) {
          box.remove();
        }
      });

      let slot = main.querySelector(":scope > .pc-what-slot");

      if (isPc()) {
        if (!slot) {
          slot = document.createElement("aside");
          slot.className = "pc-what-slot";
          slot.setAttribute("aria-label", "What this calculator does");
          main.insertBefore(slot, leftBox);
        }

        if (!slot.contains(whatBox)) {
          slot.appendChild(whatBox);
        }
      } else {
        const title =
          instructionBox.querySelector(":scope > .instruction-main-title") ||
          instructionBox.querySelector(":scope > h2");

        if (title && !instructionBox.contains(whatBox)) {
          instructionBox.insertBefore(whatBox, title);
        }

        if (slot && slot.children.length === 0) {
          slot.remove();
        }
      }
    });
  }

  function start() {
    syncPcOrientation();
    window.addEventListener("resize", syncPcOrientation);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

/* =====================================================
   PC ORIENTATION ONLY FOR REAL CALCULATOR PAGES
   Does not affect index/about/privacy/contact
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function getCalculatorMain() {
    return document.querySelector(
      "main.calculator-container.has-instructions, " +
      "main.age-calculator-container.has-instructions, " +
      "main.bmi-calculator-container.has-instructions, " +
      "main.discount-calculator-container.has-instructions, " +
      "main.loan-calculator-container.has-instructions, " +
      "main.percentage-calculator-container.has-instructions, " +
      "main.compound-calculator-container.has-instructions, " +
      "main.compound-interest-container.has-instructions"
    );
  }

  function getLeftBox(main) {
    return (
      main.querySelector(":scope > .history") ||
      main.querySelector(":scope > .age-history-box") ||
      main.querySelector(":scope > .bmi-history-box") ||
      main.querySelector(":scope > .discount-history-box") ||
      main.querySelector(":scope > .loan-history-box") ||
      main.querySelector(":scope > .percentage-history-box") ||
      main.querySelector(":scope > .compound-history-box")
    );
  }

  function syncPcCalculatorOrientation() {
    const main = getCalculatorMain();
    if (!main) return;

    const instructionBox = main.querySelector(":scope > .instruction-box");
    const leftBox = getLeftBox(main);

    if (!instructionBox || !leftBox) return;

    let whatBox =
      main.querySelector(":scope > .pc-what-slot .instruction-what-box") ||
      instructionBox.querySelector(":scope > .instruction-what-box");

    if (!whatBox) return;

    main.querySelectorAll(".instruction-what-box").forEach(function (box) {
      if (box !== whatBox) box.remove();
    });

    let slot = main.querySelector(":scope > .pc-what-slot");

    if (isPc()) {
      if (!slot) {
        slot = document.createElement("aside");
        slot.className = "pc-what-slot";
        slot.setAttribute("aria-label", "What this calculator does");
        main.insertBefore(slot, leftBox);
      }

      if (!slot.contains(whatBox)) {
        slot.appendChild(whatBox);
      }
    } else {
      const title =
        instructionBox.querySelector(":scope > .instruction-main-title") ||
        instructionBox.querySelector(":scope > h2");

      if (title && !instructionBox.contains(whatBox)) {
        instructionBox.insertBefore(whatBox, title);
      }

      if (slot && slot.children.length === 0) {
        slot.remove();
      }
    }
  }

  function start() {
    syncPcCalculatorOrientation();
    window.addEventListener("resize", syncPcCalculatorOrientation);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   PC CALCULATOR PAGE LAYOUT ONLY
   Excludes index/about/privacy/contact
   Moves What box above Result/History on PC only
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function isRealCalculatorPage(main) {
    if (!main) return false;

    if (main.classList.contains("calculator-box")) return false;

    if (
      document.body.classList.contains("about-page") ||
      document.body.classList.contains("privacy-page") ||
      document.body.classList.contains("contact-page") ||
      document.body.classList.contains("info-page")
    ) {
      return false;
    }

    return !!(
      main.querySelector(":scope > .calculator") &&
      main.querySelector(":scope > .instruction-box") &&
      (
        main.querySelector(":scope > .history") ||
        main.querySelector(":scope > .age-history-box") ||
        main.querySelector(":scope > .bmi-history-box") ||
        main.querySelector(":scope > .discount-history-box") ||
        main.querySelector(":scope > .loan-history-box") ||
        main.querySelector(":scope > .percentage-history-box") ||
        main.querySelector(":scope > .compound-history-box")
      )
    );
  }

  function getLeftBox(main) {
    return (
      main.querySelector(":scope > .history") ||
      main.querySelector(":scope > .age-history-box") ||
      main.querySelector(":scope > .bmi-history-box") ||
      main.querySelector(":scope > .discount-history-box") ||
      main.querySelector(":scope > .loan-history-box") ||
      main.querySelector(":scope > .percentage-history-box") ||
      main.querySelector(":scope > .compound-history-box")
    );
  }

  function syncPcCalculatorLayout() {
    document.querySelectorAll("main").forEach(function (main) {
      if (!isRealCalculatorPage(main)) {
        main.classList.remove("pc-calculator-layout");
        return;
      }

      const instructionBox = main.querySelector(":scope > .instruction-box");
      const leftBox = getLeftBox(main);

      if (!instructionBox || !leftBox) return;

      main.classList.add("pc-calculator-layout");

      let whatBox =
        main.querySelector(":scope > .pc-what-slot .instruction-what-box") ||
        instructionBox.querySelector(":scope > .instruction-what-box");

      if (!whatBox) return;

      main.querySelectorAll(".instruction-what-box").forEach(function (box) {
        if (box !== whatBox) {
          box.remove();
        }
      });

      let slot = main.querySelector(":scope > .pc-what-slot");

      if (isPc()) {
        if (!slot) {
          slot = document.createElement("aside");
          slot.className = "pc-what-slot";
          slot.setAttribute("aria-label", "What this calculator does");
          main.insertBefore(slot, leftBox);
        }

        if (!slot.contains(whatBox)) {
          slot.appendChild(whatBox);
        }
      } else {
        const title =
          instructionBox.querySelector(":scope > .instruction-main-title") ||
          instructionBox.querySelector(":scope > h2");

        if (title && !instructionBox.contains(whatBox)) {
          instructionBox.insertBefore(whatBox, title);
        }

        if (slot && slot.children.length === 0) {
          slot.remove();
        }
      }
    });
  }

  function start() {
    syncPcCalculatorLayout();
    window.addEventListener("resize", syncPcCalculatorLayout);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   LOAN PAGE: yearly comparison table
   Monthly Payment / Total Interest / Total Payment vs Years
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.toLowerCase() : "";

    return (
      title.includes("loan") ||
      document.body.classList.contains("loan-page") ||
      !!document.getElementById("loanResult")
    );
  }

  function cleanNumber(value) {
    return Number(String(value || "").replace(/,/g, "").trim());
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function findInputByLabel(pattern) {
    const labels = Array.from(document.querySelectorAll("label"));

    for (const label of labels) {
      if (!pattern.test(label.textContent || "")) continue;

      const id = label.getAttribute("for");

      if (id) {
        const input = document.getElementById(id);
        if (input) return input;
      }

      const next = label.nextElementSibling;
      if (next && /input|select/i.test(next.tagName)) return next;
    }

    return null;
  }

  function findLoanInputs() {
    const amountInput =
      document.getElementById("loanAmount") ||
      document.getElementById("amount") ||
      document.getElementById("principal") ||
      document.getElementById("loanPrincipal") ||
      findInputByLabel(/loan amount|amount|principal/i);

    const rateInput =
      document.getElementById("loanRate") ||
      document.getElementById("interestRate") ||
      document.getElementById("annualRate") ||
      document.getElementById("rate") ||
      findInputByLabel(/interest|rate/i);

    const yearsInput =
      document.getElementById("loanYears") ||
      document.getElementById("years") ||
      document.getElementById("loanTerm") ||
      document.getElementById("term") ||
      findInputByLabel(/year|term|period/i);

    return {
      amountInput,
      rateInput,
      yearsInput
    };
  }

  function monthlyPayment(principal, annualRate, years) {
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

  function getTableWrap() {
    let wrap = document.getElementById("loanYearTableWrap");

    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "loanYearTableWrap";
      wrap.className = "loan-year-table-wrap";

      const result = document.getElementById("loanResult");
      const calculator = document.querySelector(".calculator");

      if (result) {
        result.insertAdjacentElement("afterend", wrap);
      } else if (calculator) {
        calculator.appendChild(wrap);
      }
    }

    return wrap;
  }

  function renderLoanYearTable() {
    if (!isLoanPage()) return;

    const inputs = findLoanInputs();
    const wrap = getTableWrap();

    if (!inputs.amountInput || !inputs.rateInput || !inputs.yearsInput) {
      wrap.innerHTML = "";
      return;
    }

    const principal = cleanNumber(inputs.amountInput.value);
    const annualRate = cleanNumber(inputs.rateInput.value);
    const inputYears = cleanNumber(inputs.yearsInput.value);

    if (
      !Number.isFinite(principal) ||
      !Number.isFinite(annualRate) ||
      !Number.isFinite(inputYears) ||
      principal <= 0 ||
      annualRate < 0 ||
      inputYears <= 0
    ) {
      wrap.innerHTML = "";
      return;
    }

    const maxYears = Math.min(Math.floor(inputYears), 60);

    let rows = "";

    for (let year = 1; year <= maxYears; year += 1) {
      const monthly = monthlyPayment(principal, annualRate, year);
      const totalPayment = monthly * year * 12;
      const totalInterest = totalPayment - principal;

      rows += `
        <tr>
          <td>${year}</td>
          <td>${money(monthly)}</td>
          <td>${money(totalInterest)}</td>
          <td>${money(totalPayment)}</td>
        </tr>
      `;
    }

    wrap.innerHTML = `
      <h3>Loan Comparison by Years</h3>

      <div class="loan-year-table-scroll">
        <table class="loan-year-table">
          <thead>
            <tr>
              <th>Years</th>
              <th>Monthly Payment</th>
              <th>Total Interest</th>
              <th>Total Payment</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  function startLoanYearTable() {
    if (!isLoanPage()) return;

    const calculator = document.querySelector(".calculator");
    if (!calculator) return;

    calculator.addEventListener("click", function (event) {
      const button = event.target.closest("button");
      if (!button) return;

      const text = button.textContent.toLowerCase();

      if (text.includes("calculate") || text.includes("loan")) {
        setTimeout(renderLoanYearTable, 0);
        setTimeout(renderLoanYearTable, 120);
      }
    });

    calculator.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        setTimeout(renderLoanYearTable, 0);
        setTimeout(renderLoanYearTable, 120);
      }
    });

    renderLoanYearTable();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startLoanYearTable);
  } else {
    startLoanYearTable();
  }
})();
/* =====================================================
   LOAN PAGE: result table + graph below calculator
   PC layout: table and graph outside calculator box
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.toLowerCase() : "";

    return (
      title.includes("loan") ||
      document.body.classList.contains("loan-page") ||
      !!document.getElementById("loanResult")
    );
  }

  function cleanNumber(value) {
    return Number(String(value || "").replace(/,/g, "").trim());
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function findInputByLabel(pattern) {
    const labels = Array.from(document.querySelectorAll("label"));

    for (const label of labels) {
      if (!pattern.test(label.textContent || "")) continue;

      const id = label.getAttribute("for");

      if (id) {
        const input = document.getElementById(id);
        if (input) return input;
      }

      const next = label.nextElementSibling;
      if (next && /input|select/i.test(next.tagName)) return next;
    }

    return null;
  }

  function findLoanInputs() {
    return {
      amountInput:
        document.getElementById("loanAmount") ||
        document.getElementById("amount") ||
        document.getElementById("principal") ||
        document.getElementById("loanPrincipal") ||
        findInputByLabel(/loan amount|amount|principal/i),

      rateInput:
        document.getElementById("loanRate") ||
        document.getElementById("interestRate") ||
        document.getElementById("annualRate") ||
        document.getElementById("rate") ||
        findInputByLabel(/interest|rate/i),

      yearsInput:
        document.getElementById("loanYears") ||
        document.getElementById("years") ||
        document.getElementById("loanTerm") ||
        document.getElementById("term") ||
        findInputByLabel(/year|term|period/i)
    };
  }

  function calculateMonthlyPayment(principal, annualRate, years) {
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

  function getLoanOutputPanel() {
    const calculator = document.querySelector(".calculator");
    if (!calculator) return null;

    let panel = document.getElementById("loanOutputPanel");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "loanOutputPanel";
      panel.className = "loan-output-panel";
      panel.setAttribute("aria-label", "Loan result table and graph");

      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function buildGraph(data) {
    if (!data.length) return "";

    const width = 360;
    const height = 240;
    const paddingLeft = 46;
    const paddingRight = 22;
    const paddingTop = 26;
    const paddingBottom = 46;

    const minYear = data[0].year;
    const maxYear = data[data.length - 1].year;

    const values = data.map(function (row) {
      return row.monthly;
    });

    const minValue = Math.min.apply(null, values);
    const maxValue = Math.max.apply(null, values);

    const safeValueRange = maxValue - minValue || 1;
    const safeYearRange = maxYear - minYear || 1;

    function x(year) {
      return paddingLeft + ((year - minYear) / safeYearRange) * (width - paddingLeft - paddingRight);
    }

    function y(value) {
      return paddingTop + ((maxValue - value) / safeValueRange) * (height - paddingTop - paddingBottom);
    }

    const points = data.map(function (row) {
      return x(row.year) + "," + y(row.monthly);
    }).join(" ");

    const circles = data.map(function (row) {
      return `
        <circle cx="${x(row.year)}" cy="${y(row.monthly)}" r="5"></circle>
      `;
    }).join("");

    const yearLabels = data.map(function (row) {
      if (data.length > 12 && row.year % 5 !== 0 && row.year !== minYear && row.year !== maxYear) {
        return "";
      }

      return `
        <text x="${x(row.year)}" y="${height - 18}" transform="rotate(-45 ${x(row.year)} ${height - 18})">
          ${row.year}
        </text>
      `;
    }).join("");

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(function (step) {
      const gridY = paddingTop + step * (height - paddingTop - paddingBottom);
      const value = maxValue - step * safeValueRange;

      return `
        <line x1="${paddingLeft}" y1="${gridY}" x2="${width - paddingRight}" y2="${gridY}" class="loan-graph-grid"></line>
        <text x="8" y="${gridY + 5}" class="loan-graph-value">${money(value)}</text>
      `;
    }).join("");

    return `
      <div class="loan-graph-box">
        <h3>Monthly Payment Graph</h3>

        <svg class="loan-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly payment by years graph">
          ${gridLines}

          <line x1="${paddingLeft}" y1="${height - paddingBottom}" x2="${width - paddingRight + 12}" y2="${height - paddingBottom}" class="loan-graph-axis"></line>
          <line x1="${paddingLeft}" y1="${height - paddingBottom}" x2="${paddingLeft}" y2="${paddingTop - 14}" class="loan-graph-axis"></line>

          <polyline points="${points}" class="loan-graph-line"></polyline>

          ${circles}
          ${yearLabels}
        </svg>
      </div>
    `;
  }

  function renderLoanOutput() {
    if (!isLoanPage()) return;

    const panel = getLoanOutputPanel();
    if (!panel) return;

    const inputs = findLoanInputs();

    if (!inputs.amountInput || !inputs.rateInput || !inputs.yearsInput) {
      panel.innerHTML = "";
      return;
    }

    const principal = cleanNumber(inputs.amountInput.value);
    const annualRate = cleanNumber(inputs.rateInput.value);
    const inputYears = cleanNumber(inputs.yearsInput.value);

    if (
      !Number.isFinite(principal) ||
      !Number.isFinite(annualRate) ||
      !Number.isFinite(inputYears) ||
      principal <= 0 ||
      annualRate < 0 ||
      inputYears <= 0
    ) {
      panel.innerHTML = "";
      return;
    }

    const maxYears = Math.min(Math.floor(inputYears), 60);
    const data = [];

    for (let year = 1; year <= maxYears; year += 1) {
      const monthly = calculateMonthlyPayment(principal, annualRate, year);
      const totalPayment = monthly * year * 12;
      const totalInterest = totalPayment - principal;

      data.push({
        year,
        monthly,
        totalInterest,
        totalPayment
      });
    }

    const rows = data.map(function (row) {
      return `
        <tr>
          <td>${row.year}</td>
          <td>${money(row.monthly)}</td>
          <td>${money(row.totalInterest)}</td>
          <td>${money(row.totalPayment)}</td>
        </tr>
      `;
    }).join("");

    panel.innerHTML = `
      <div class="loan-result-table-box">
        <h3>Result</h3>

        <div class="loan-result-table-scroll">
          <table class="loan-result-table">
            <thead>
              <tr>
                <th>Years</th>
                <th>Monthly Payment</th>
                <th>Total Interest</th>
                <th>Total Payment</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>

      ${buildGraph(data)}
    `;
  }

  function startLoanOutput() {
    if (!isLoanPage()) return;

    const calculator = document.querySelector(".calculator");
    if (!calculator) return;

    calculator.addEventListener("click", function (event) {
      const button = event.target.closest("button");
      if (!button) return;

      const text = button.textContent.toLowerCase();

      if (text.includes("calculate") || text.includes("loan")) {
        setTimeout(renderLoanOutput, 0);
        setTimeout(renderLoanOutput, 120);
      }
    });

    calculator.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        setTimeout(renderLoanOutput, 0);
        setTimeout(renderLoanOutput, 120);
      }
    });

    renderLoanOutput();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startLoanOutput);
  } else {
    startLoanOutput();
  }
})();
/* =====================================================
   PC ONLY: move calculator result outside calculator box
   Result appears below calculator + result/history area
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  const resultSelectors = [
    "#result",
    "#bmiResult",
    "#loanResult",
    "#discountResult",
    "#percentageResult",
    "#compoundResult"
  ];

  function getMain() {
    return document.querySelector("main.pc-calculator-layout") || document.querySelector("main");
  }

  function getResultElements(main) {
    if (!main) return [];

    return resultSelectors
      .map(function (selector) {
        return main.querySelector(selector);
      })
      .filter(Boolean);
  }

  function getOutsidePanel(main) {
    let panel = main.querySelector(":scope > .pc-outside-result-panel");

    if (!panel) {
      panel = document.createElement("section");
      panel.className = "pc-outside-result-panel";
      panel.setAttribute("aria-label", "Calculator result");

      const calculator = main.querySelector(":scope > .calculator");

      if (calculator) {
        calculator.insertAdjacentElement("afterend", panel);
      } else {
        main.appendChild(panel);
      }
    }

    return panel;
  }

  function moveResultsOutside() {
    const main = getMain();
    if (!main) return;

    const calculator = main.querySelector(":scope > .calculator");
    if (!calculator) return;

    const results = getResultElements(main);

    if (!isPc()) {
      const panel = main.querySelector(":scope > .pc-outside-result-panel");

      results.forEach(function (result) {
        if (panel && panel.contains(result)) {
          calculator.appendChild(result);
        }
      });

      if (panel && panel.children.length === 0) {
        panel.remove();
      }

      return;
    }

    if (!main.classList.contains("pc-calculator-layout")) return;

    const panel = getOutsidePanel(main);

    results.forEach(function (result) {
      if (!panel.contains(result)) {
        panel.appendChild(result);
      }
    });

    const loanOutputPanel = main.querySelector(":scope > #loanOutputPanel");

    if (loanOutputPanel && !panel.contains(loanOutputPanel)) {
      panel.appendChild(loanOutputPanel);
    }
  }

  function startMoveResultsOutside() {
    moveResultsOutside();

    window.addEventListener("resize", moveResultsOutside);

    document.addEventListener("click", function () {
      setTimeout(moveResultsOutside, 0);
      setTimeout(moveResultsOutside, 150);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        setTimeout(moveResultsOutside, 0);
        setTimeout(moveResultsOutside, 150);
      }
    });

    setTimeout(moveResultsOutside, 300);
    setTimeout(moveResultsOutside, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startMoveResultsOutside);
  } else {
    startMoveResultsOutside();
  }
})();