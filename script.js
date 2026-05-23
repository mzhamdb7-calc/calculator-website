
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

/* PHONE CLICK MENU SYSTEM */
document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("navbar");
  const menuIcon = document.getElementById("menuIcon");

  if (!navbar || !menuIcon) return;

  const calculatorDropdown = navbar.querySelector(":scope > .dropdown");
  const calculatorButton = calculatorDropdown
    ? calculatorDropdown.querySelector(".dropbtn")
    : null;

  function isPhone() {
    return window.matchMedia("(max-width: 850px)").matches;
  }

  function closePhoneSubmenus() {
    if (calculatorDropdown) {
      calculatorDropdown.classList.remove("phone-open");
    }

    navbar.querySelectorAll(".nav-group").forEach(function (group) {
      group.open = false;
    });
  }

  function togglePhoneMenu(event) {
    if (!isPhone()) return;

    event.preventDefault();
    event.stopPropagation();

    document.body.classList.add("menu-scrolled");
    navbar.classList.add("scrolled");
    navbar.classList.toggle("open");
    navbar.classList.toggle("phone-menu-open");

    if (!navbar.classList.contains("open")) {
      closePhoneSubmenus();
    }
  }

  menuIcon.addEventListener("click", togglePhoneMenu);

  if (calculatorButton && calculatorDropdown) {
    calculatorButton.addEventListener("click", function (event) {
      if (!isPhone() || !navbar.classList.contains("open")) return;

      event.preventDefault();
      event.stopPropagation();

      calculatorDropdown.classList.toggle("phone-open");

      navbar.querySelectorAll(".nav-group").forEach(function (group) {
        group.open = false;
      });
    });
  }

  navbar.querySelectorAll(".nav-group > summary").forEach(function (summary) {
    summary.addEventListener("click", function (event) {
      if (!isPhone() || !navbar.classList.contains("open")) return;

      event.preventDefault();
      event.stopPropagation();

      const group = summary.parentElement;
      const isOpen = group.open;

      navbar.querySelectorAll(".nav-group").forEach(function (otherGroup) {
        otherGroup.open = false;
      });

      group.open = !isOpen;
    });
  });

  document.addEventListener("click", function (event) {
    if (!isPhone()) return;

    if (!navbar.contains(event.target) && !menuIcon.contains(event.target)) {
      navbar.classList.remove("open", "phone-menu-open");
      closePhoneSubmenus();
    }
  });
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
/* Remove emoji arrow text from phone side menu health/finance */
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("#navbar .dropdown-content details.nav-group > summary")
    .forEach(function (summary) {
      summary.childNodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent = node.textContent
            .replace(/[▼▲◀▶⬅️🔽🔼]/g, "")
            .trim();
        }
      });
    });
});
/* PHONE SIDE MENU: remove real emoji arrows from health/finance text */
document.addEventListener("DOMContentLoaded", function () {
  function cleanSideMenuArrows() {
    document
      .querySelectorAll("#navbar .dropdown-content details.nav-group > summary")
      .forEach(function (summary) {
        summary.childNodes.forEach(function (node) {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = node.textContent
              .replace(/[\u25BC\u25B2\u25C0\u25B6\u2B05\uFE0F]/g, "")
              .replace(/[▼▲◀▶⬅]/g, "")
              .trim();
          }
        });
      });
  }

  cleanSideMenuArrows();

  document.addEventListener("click", function () {
    setTimeout(cleanSideMenuArrows, 0);
  });

  document.querySelectorAll("#navbar .dropdown-content details.nav-group").forEach(function (detail) {
    detail.addEventListener("toggle", function () {
      setTimeout(cleanSideMenuArrows, 0);
    });
  });
});
/* PHONE FINAL FIX: navbar health/finance second tap closes */
(function () {
  function isPhone() {
    return window.matchMedia("(max-width: 850px)").matches;
  }

  function getClickedGroup(event) {
    const summary = event.target.closest(
      "#navbar .dropdown-content details.nav-group > summary"
    );

    if (summary) {
      return summary.parentElement;
    }

    const button = event.target.closest(
      "#navbar .dropdown-content .nav-finance > .nav-summary, #navbar .dropdown-content .nav-summary"
    );

    if (button) {
      return button.closest(".nav-group");
    }

    return null;
  }

  function closeGroup(group) {
    if (!group) return;

    group.open = false;
    group.removeAttribute("open");
    group.dataset.phoneOpen = "false";
    group.classList.remove("is-open", "open", "active", "phone-sub-open");
  }

  function openGroup(group) {
    if (!group) return;

    group.open = true;
    group.setAttribute("open", "");
    group.dataset.phoneOpen = "true";
    group.classList.add("is-open", "open", "active", "phone-sub-open");
  }

  function closeAllGroupsExcept(exceptGroup) {
    document
      .querySelectorAll("#navbar .dropdown-content .nav-group")
      .forEach(function (group) {
        if (group !== exceptGroup) {
          closeGroup(group);
        }
      });
  }

  window.addEventListener(
    "click",
    function (event) {
      if (!isPhone()) return;

      const group = getClickedGroup(event);
      if (!group) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const isOpen =
        group.dataset.phoneOpen === "true" ||
        group.classList.contains("is-open") ||
        group.open === true;

      closeAllGroupsExcept(group);

      if (isOpen) {
        closeGroup(group);
      } else {
        openGroup(group);
      }

      setTimeout(function () {
        if (isOpen) {
          closeGroup(group);
        } else {
          openGroup(group);
        }
      }, 0);
    },
    true
  );
})();

/* OVERRIDE: PHONE finance/health tap toggle fix */
(function () {
  function isPhone() {
    return window.matchMedia("(max-width: 850px)").matches;
  }

  function getNavbarGroup(event) {
    const summary = event.target.closest(
      "#navbar .dropdown-content details.nav-group > summary"
    );

    if (summary) {
      return summary.parentElement;
    }

    const button = event.target.closest(
      "#navbar .dropdown-content .nav-summary"
    );

    if (button) {
      return button.closest(".nav-group");
    }

    return null;
  }

  function groupName(group) {
    const text = group.textContent.toLowerCase();
    if (text.includes("finance")) return "finance";
    if (text.includes("health")) return "health";
    return "";
  }

  function closeGroup(group) {
    if (!group) return;

    group.open = false;
    group.removeAttribute("open");
    group.dataset.phoneOpen = "false";
    group.classList.remove("is-open", "open", "active", "phone-sub-open");
  }

  function openGroup(group) {
    if (!group) return;

    group.open = true;
    group.setAttribute("open", "");
    group.dataset.phoneOpen = "true";
    group.classList.add("is-open", "open", "active", "phone-sub-open");
  }

  function closeAllNavbarGroupsExcept(exceptGroup) {
    document
      .querySelectorAll("#navbar .dropdown-content .nav-group")
      .forEach(function (group) {
        if (group !== exceptGroup) {
          closeGroup(group);
        }
      });
  }

  window.addEventListener(
    "click",
    function (event) {
      if (!isPhone()) return;

      const group = getNavbarGroup(event);
      if (!group) return;

      const name = groupName(group);
      if (name !== "finance" && name !== "health") return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const wasOpen = group.dataset.phoneOpen === "true";

      closeAllNavbarGroupsExcept(group);

      if (wasOpen) {
        closeGroup(group);
      } else {
        openGroup(group);
      }

      setTimeout(function () {
        if (wasOpen) {
          closeGroup(group);
        } else {
          openGroup(group);
        }
      }, 0);

      setTimeout(function () {
        if (wasOpen) {
          closeGroup(group);
        } else {
          openGroup(group);
        }
      }, 80);
    },
    true
  );
})();
/* OVERRIDE: PHONE navbar health/finance fixed toggle
   Converts navbar details into button menus so old details behavior cannot reopen finance.
*/
(function () {
  function isPhone() {
    return window.matchMedia("(max-width: 850px)").matches;
  }

  function setupFixedNavbarGroups() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    const dropdownContent = navbar.querySelector(".dropdown-content");
    if (!dropdownContent) return;

    dropdownContent
      .querySelectorAll("details.nav-group")
      .forEach(function (details) {
        const summary = details.querySelector(":scope > summary");
        const links = details.querySelector(":scope > .nav-group-links");

        if (!summary || !links) return;

        const group = document.createElement("div");
        group.className = "nav-group fixed-nav-group";
        group.dataset.menuName = summary.textContent.trim().toLowerCase();

        const button = document.createElement("button");
        button.type = "button";
        button.className = "nav-summary";
        button.textContent = summary.textContent.trim();

        group.appendChild(button);
        group.appendChild(links.cloneNode(true));

        details.replaceWith(group);
      });
  }

  function closeAllGroups(exceptGroup) {
    document
      .querySelectorAll("#navbar .dropdown-content .fixed-nav-group")
      .forEach(function (group) {
        if (group !== exceptGroup) {
          group.classList.remove("is-open");
        }
      });
  }

  function handleNavbarGroupClick(event) {
    if (!isPhone()) return;

    const button = event.target.closest(
      "#navbar .dropdown-content .fixed-nav-group > .nav-summary"
    );

    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const group = button.closest(".fixed-nav-group");
    const wasOpen = group.classList.contains("is-open");

    closeAllGroups(group);

    if (wasOpen) {
      group.classList.remove("is-open");
    } else {
      group.classList.add("is-open");
    }
  }

  function closeWhenClickOutside(event) {
    if (!isPhone()) return;

    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    if (!navbar.contains(event.target)) {
      closeAllGroups(null);
    }
  }

  function initFixedNavbarGroups() {
    setupFixedNavbarGroups();

    window.addEventListener("click", handleNavbarGroupClick, true);
    document.addEventListener("click", closeWhenClickOutside, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFixedNavbarGroups);
  } else {
    initFixedNavbarGroups();
  }
})();
/* OVERRIDE: add instruction box to every page */
(function () {
  function getInstructionData() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    if (title.includes("basic")) {
      return [
        "Enter numbers using the buttons.",
        "Choose +, −, ×, ÷, power, or square root.",
        "Press = to calculate.",
        "Use ANS to reuse your last answer.",
        "Press AC to clear the display."
      ];
    }

    if (title.includes("age")) {
      return [
        "Select your birth date.",
        "Press calculate age.",
        "Normal age and Asian age will appear.",
        "Use Clear to remove saved results."
      ];
    }

    if (title.includes("bmi")) {
      return [
        "Choose SI or US units.",
        "Enter your weight and height.",
        "Waist size is optional.",
        "Press calculate bmi.",
        "Your BMI result will appear below."
      ];
    }

    if (title.includes("loan")) {
      return [
        "Enter the loan amount.",
        "Enter the annual interest rate.",
        "Enter the loan years.",
        "Press calculate loan.",
        "Monthly payment will be shown."
      ];
    }

    if (title.includes("discount")) {
      return [
        "Enter the original price.",
        "Enter the discount percentage.",
        "Press calculate discount.",
        "Final price and savings will be shown."
      ];
    }

    if (title.includes("percentage")) {
      return [
        "Enter the percentage value.",
        "Enter the number.",
        "Press calculate percentage.",
        "The percentage result will appear below."
      ];
    }

    if (title.includes("calculator")) {
      return [
        "Choose a calculator type.",
        "Open health for age and BMI.",
        "Open finance for loan and discount.",
        "Choose percentage for percentage calculation."
      ];
    }

    return [
      "Use the menu to move between pages.",
      "Open calculator to choose a calculator type.",
      "Use the go up button to return to the top."
    ];
  }

  function addInstructionBox() {
    const main = document.querySelector("main");
    if (!main) return;
    if (main.querySelector(".instruction-box")) return;

    const box = document.createElement("aside");
    box.className = "instruction-box";

    const title = document.createElement("h2");
    title.textContent = "Instructions";

    const list = document.createElement("ul");

    getInstructionData().forEach(function (text) {
      const li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    });

    box.appendChild(title);
    box.appendChild(list);

    main.classList.add("has-instructions");
    main.appendChild(box);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addInstructionBox);
  } else {
    addInstructionBox();
  }
})();
/* OVERRIDE: remove instruction box from index.html only */
(function () {
  function removeIndexInstruction() {
    const main = document.querySelector("main");

    if (!main) return;

    /* index.html uses calculator-box */
    if (main.classList.contains("calculator-box")) {
      const instructionBox = main.querySelector(".instruction-box");

      if (instructionBox) {
        instructionBox.remove();
      }

      main.classList.remove("has-instructions");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removeIndexInstruction);
  } else {
    removeIndexInstruction();
  }

  setTimeout(removeIndexInstruction, 100);
})();
/* OVERRIDE: detailed instruction content */
(function () {
  function pageTitle() {
    const h1 = document.querySelector("h1");
    return h1 ? h1.textContent.trim().toLowerCase() : "";
  }

  function makeSection(title, text) {
    const section = document.createElement("div");
    section.className = "instruction-section";

    const h3 = document.createElement("h3");
    h3.textContent = title;

    const p = document.createElement("p");
    p.textContent = text;

    section.appendChild(h3);
    section.appendChild(p);

    return section;
  }

  function getDetailedInstructions() {
    const title = pageTitle();

    if (title.includes("basic")) {
      return [
        ["What does this calculator do?", "It helps you do quick math calculations like addition, subtraction, multiplication, division, power, and square root."],
        ["How to use it", "Enter numbers using the buttons, choose an operator, then press = to get the answer."],
        ["Formula used", "The calculator follows normal math order: brackets first, then powers, multiplication/division, then addition/subtraction."],
        ["Example calculation", "Example: 8 + 2 × 3 = 14 because multiplication is calculated before addition."]
      ];
    }

    if (title.includes("age")) {
      return [
        ["What does this calculator do?", "It calculates your normal age and Asian age from your birth date."],
        ["How to use it", "Select your birth date, then press calculate age."],
        ["Formula used", "Normal age = current year − birth year, adjusted if your birthday has not passed. Asian age = current year − birth year + 1."],
        ["Example calculation", "If you were born in 2000 and the current year is 2026, Asian age = 2026 − 2000 + 1 = 27."]
      ];
    }

    if (title.includes("bmi")) {
      return [
        ["What does this calculator do?", "It calculates your Body Mass Index and optional waist-to-height ratio."],
        ["How to use it", "Choose SI or US unit, enter your weight and height, then press calculate bmi. Waist is optional."],
        ["Formula used", "SI BMI = weight kg ÷ height m². US BMI = 703 × weight lb ÷ height inch². W/H ratio = waist ÷ height."],
        ["Example calculation", "If weight is 70 kg and height is 1.70 m, BMI = 70 ÷ 1.70² = 24.22."]
      ];
    }

    if (title.includes("loan")) {
      return [
        ["What does this calculator do?", "It estimates your monthly loan payment, total payment, and total interest."],
        ["How to use it", "Enter loan amount, annual interest rate, and loan years, then press calculate loan."],
        ["Formula used", "Monthly payment = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where P is loan amount, r is monthly rate, and n is total months."],
        ["Example calculation", "For a 10000 loan at 5% yearly interest for 2 years, it calculates the estimated monthly payment."]
      ];
    }

    if (title.includes("discount")) {
      return [
        ["What does this calculator do?", "It calculates the final price after discount and how much money you save."],
        ["How to use it", "Enter the original price and discount percentage, then press calculate discount."],
        ["Formula used", "Savings = original price × discount ÷ 100. Final price = original price − savings."],
        ["Example calculation", "If price is 100 and discount is 20%, savings = 20 and final price = 80."]
      ];
    }

    if (title.includes("percentage")) {
      return [
        ["What does this calculator do?", "It calculates what a percentage of a number is."],
        ["How to use it", "Enter the percentage value and the number, then press calculate percentage."],
        ["Formula used", "Result = percentage ÷ 100 × number."],
        ["Example calculation", "20% of 150 = 20 ÷ 100 × 150 = 30."]
      ];
    }

    if (title.includes("about")) {
      return [
        ["What does this page do?", "This page explains what the website is about, privacy information, and contact details."],
        ["How to use it", "Read the information or use the menu to open a calculator page."],
        ["Formula used", "No formula is used on this page."],
        ["Example", "You can use the calculator menu to open BMI, age, loan, discount, percentage, or basic calculator."]
      ];
    }

    return [];
  }

  function rebuildInstructionBox() {
    const main = document.querySelector("main");
    if (!main) return;

    /* No instruction on index.html */
    if (main.classList.contains("calculator-box")) {
      const oldIndexBox = main.querySelector(".instruction-box");
      if (oldIndexBox) oldIndexBox.remove();
      main.classList.remove("has-instructions");
      return;
    }

    const data = getDetailedInstructions();
    if (!data.length) return;

    let box = main.querySelector(".instruction-box");

    if (!box) {
      box = document.createElement("aside");
      box.className = "instruction-box";
      main.appendChild(box);
    }

    box.innerHTML = "";

    const h2 = document.createElement("h2");
    h2.textContent = "Instructions";
    box.appendChild(h2);

    data.forEach(function (item) {
      box.appendChild(makeSection(item[0], item[1]));
    });

    main.classList.add("has-instructions");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", rebuildInstructionBox);
  } else {
    rebuildInstructionBox();
  }

  setTimeout(rebuildInstructionBox, 100);
})();

/* FINAL PHONE FIX: calculator menu button toggles open/close */
(function () {
  function isPhoneMode() {
    return window.matchMedia("(max-width: 850px)").matches;
  }

  function blurActiveElement() {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  }

  function closeNavbarSubmenus(navbar) {
    if (!navbar) return;

    navbar.querySelectorAll("details.nav-group").forEach(function (group) {
      group.open = false;
      group.removeAttribute("data-phone-open");
      group.classList.remove("is-open", "open", "active");
    });

    navbar.querySelectorAll(".fixed-nav-group, .navbar-fixed-group").forEach(function (group) {
      group.classList.remove("is-open", "open", "active");
    });
  }

  function setupFinalPhoneCalculatorToggle() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    const calculatorDropdown = navbar.querySelector(":scope > .dropdown");
    if (!calculatorDropdown) return;

    const calculatorButton = calculatorDropdown.querySelector(":scope > .dropbtn");
    if (!calculatorButton) return;

    window.addEventListener(
      "click",
      function (event) {
        if (!isPhoneMode()) return;

        const clickedCalculatorButton = event.target.closest("#navbar > .dropdown > .dropbtn");

        if (clickedCalculatorButton) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          const shouldOpen = !calculatorDropdown.classList.contains("phone-open");

          calculatorDropdown.classList.toggle("phone-open", shouldOpen);
          calculatorDropdown.classList.toggle("mobile-open", shouldOpen);

          closeNavbarSubmenus(navbar);

          setTimeout(function () {
            calculatorButton.blur();
            blurActiveElement();
          }, 0);

          return;
        }

        if (!navbar.contains(event.target)) {
          calculatorDropdown.classList.remove("phone-open", "mobile-open");
          closeNavbarSubmenus(navbar);
          blurActiveElement();
        }
      },
      true
    );

    window.addEventListener("resize", function () {
      calculatorDropdown.classList.remove("phone-open", "mobile-open");
      closeNavbarSubmenus(navbar);
      blurActiveElement();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupFinalPhoneCalculatorToggle);
  } else {
    setupFinalPhoneCalculatorToggle();
  }
})();
/* FINAL REAL PHONE FIX: calculator button second tap closes dropdown */
(function () {
  function isPhoneMode() {
    return window.matchMedia("(max-width: 850px)").matches;
  }

  function setupPhoneCalculatorDropdown() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    const calculatorDropdown = navbar.querySelector(":scope > .dropdown");
    if (!calculatorDropdown) return;

    const calculatorButton = calculatorDropdown.querySelector(":scope > .dropbtn");
    const dropdownContent = calculatorDropdown.querySelector(":scope > .dropdown-content");

    if (!calculatorButton || !dropdownContent) return;

    function closeSubmenus() {
      navbar.querySelectorAll("details.nav-group").forEach(function (group) {
        group.open = false;
        group.removeAttribute("open");
        group.dataset.phoneOpen = "false";
        group.classList.remove("is-open", "open", "active", "phone-sub-open");
      });

      navbar.querySelectorAll(".navbar-fixed-group").forEach(function (group) {
        group.classList.remove("is-open", "open", "active", "phone-sub-open");
      });
    }

    function setCalculatorOpen(isOpen) {
      calculatorDropdown.classList.toggle("phone-open", isOpen);
      calculatorDropdown.classList.toggle("mobile-open", isOpen);
      calculatorDropdown.dataset.phoneOpen = isOpen ? "true" : "false";

      dropdownContent.style.setProperty(
        "display",
        isOpen ? "block" : "none",
        "important"
      );

      calculatorButton.setAttribute("aria-expanded", isOpen ? "true" : "false");

      if (!isOpen) {
        calculatorButton.blur();

        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
      }

      closeSubmenus();
    }

    function clearDesktopInlineStyle() {
      calculatorDropdown.classList.remove("phone-open", "mobile-open");
      calculatorDropdown.removeAttribute("data-phone-open");
      dropdownContent.style.removeProperty("display");
      calculatorButton.setAttribute("aria-expanded", "false");
    }

    document.addEventListener(
      "pointerdown",
      function (event) {
        if (!isPhoneMode()) return;

        if (!calculatorButton.contains(event.target)) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const shouldOpen = calculatorDropdown.dataset.phoneOpen !== "true";
        setCalculatorOpen(shouldOpen);
      },
      true
    );

    document.addEventListener(
      "click",
      function (event) {
        if (!isPhoneMode()) return;

        if (calculatorButton.contains(event.target)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        if (!calculatorDropdown.contains(event.target)) {
          setCalculatorOpen(false);
        }
      },
      true
    );

    window.addEventListener("resize", function () {
      if (isPhoneMode()) {
        setCalculatorOpen(false);
      } else {
        clearDesktopInlineStyle();
      }
    });

    if (isPhoneMode()) {
      setCalculatorOpen(false);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupPhoneCalculatorDropdown);
  } else {
    setupPhoneCalculatorDropdown();
  }
})();

/* =====================================================
   PHONE FINAL FIX:
   calculator + info buttons toggle their own dropup
===================================================== */
(function () {
  function isPhoneMode() {
    return window.matchMedia("(max-width: 850px)").matches;
  }

  function closePhoneSubmenus(navbar) {
    if (!navbar) return;

    navbar.querySelectorAll("details.nav-group").forEach(function (group) {
      group.open = false;
      group.removeAttribute("open");
      group.dataset.phoneOpen = "false";
      group.classList.remove("is-open", "open", "active", "phone-sub-open");
    });

    navbar.querySelectorAll(".fixed-nav-group, .navbar-fixed-group").forEach(function (group) {
      group.classList.remove("is-open", "open", "active", "phone-sub-open");
    });
  }

  function closeAllDropdowns(navbar, exceptDropdown) {
    if (!navbar) return;

    navbar.querySelectorAll(":scope > .dropdown").forEach(function (dropdown) {
      if (dropdown !== exceptDropdown) {
        dropdown.classList.remove("phone-open", "mobile-open");
        dropdown.removeAttribute("data-phone-open");

        const content = dropdown.querySelector(":scope > .dropdown-content");
        if (content) {
          content.style.removeProperty("display");
        }

        const button = dropdown.querySelector(":scope > .dropbtn");
        if (button) {
          button.setAttribute("aria-expanded", "false");
          button.blur();
        }
      }
    });
  }

  function setupPhoneDropups() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    const dropdowns = navbar.querySelectorAll(":scope > .dropdown");

    dropdowns.forEach(function (dropdown) {
      const button = dropdown.querySelector(":scope > .dropbtn");
      const content = dropdown.querySelector(":scope > .dropdown-content");

      if (!button || !content) return;
      if (dropdown.dataset.phoneDropupReady === "true") return;

      dropdown.dataset.phoneDropupReady = "true";

      button.addEventListener(
        "pointerdown",
        function (event) {
          if (!isPhoneMode()) return;

          event.preventDefault();
          event.stopPropagation();

          const isOpen = dropdown.classList.contains("phone-open");

          closeAllDropdowns(navbar, dropdown);
          closePhoneSubmenus(navbar);

          dropdown.classList.toggle("phone-open", !isOpen);
          dropdown.classList.toggle("mobile-open", !isOpen);
          dropdown.dataset.phoneOpen = !isOpen ? "true" : "false";

          content.style.setProperty("display", !isOpen ? "block" : "none", "important");
          button.setAttribute("aria-expanded", !isOpen ? "true" : "false");

          setTimeout(function () {
            button.blur();
          }, 0);
        },
        true
      );
    });

    document.addEventListener(
      "pointerdown",
      function (event) {
        if (!isPhoneMode()) return;

        if (!navbar.contains(event.target)) {
          closeAllDropdowns(navbar, null);
          closePhoneSubmenus(navbar);
        }
      },
      true
    );

    window.addEventListener("resize", function () {
      closeAllDropdowns(navbar, null);
      closePhoneSubmenus(navbar);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupPhoneDropups);
  } else {
    setupPhoneDropups();
  }
})();
/* =====================================================
   SAFE REFERENCE BOX UNDER INSTRUCTIONS
   No loading loop
===================================================== */
(function () {
  "use strict";

  function getPageTitle() {
    const h1 = document.querySelector("h1");
    return h1 ? h1.textContent.trim().toLowerCase() : "";
  }

  function getReferenceData() {
    const title = getPageTitle();

    if (title.includes("basic")) {
      return [
        ["Math order", "Brackets first, then powers, multiplication/division, then addition/subtraction."],
        ["Power", "xʸ means multiplying a number by itself y times."],
        ["Square root", "√x finds the number that gives x when multiplied by itself."]
      ];
    }

    if (title.includes("age")) {
      return [
        ["Normal age", "Normal age = current year − birth year, adjusted if birthday has not passed."],
        ["Asian age", "Asian age = current year − birth year + 1."],
        ["Date check", "Birth date cannot be after today."]
      ];
    }

    if (title.includes("bmi")) {
      return [
        ["SI BMI", "BMI = weight kg ÷ height m²."],
        ["US BMI", "BMI = 703 × weight lb ÷ height inch²."],
        ["W/H ratio", "Waist-to-height ratio = waist ÷ height."]
      ];
    }

    if (title.includes("loan")) {
      return [
        ["Monthly payment", "Payment = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)."],
        ["Monthly rate", "Monthly rate = annual interest rate ÷ 100 ÷ 12."],
        ["Total interest", "Total interest = total payment − loan amount."]
      ];
    }

    if (title.includes("discount")) {
      return [
        ["Savings", "Savings = original price × discount ÷ 100."],
        ["Final price", "Final price = original price − savings."],
        ["Discount range", "Discount should be between 0 and 100."]
      ];
    }

    if (title.includes("percentage")) {
      return [
        ["Percentage", "Result = percentage ÷ 100 × number."],
        ["Meaning", "Percent means out of 100."],
        ["Example", "20% of 150 = 20 ÷ 100 × 150 = 30."]
      ];
    }

    if (title.includes("compound")) {
      return [
        ["Future value", "A = P(1 + r/n)ⁿᵗ."],
        ["Compound interest", "Compound Interest = A − P."],
        ["Meaning", "P = principal, r = annual rate, n = compounding frequency, t = years."],
        ["Example", "P = 1000, r = 5%, t = 10 years, n = 12 gives about 1,647.01 future value."]
      ];
    }

    return [];
  }

  function createReferenceCard(title, text) {
    const card = document.createElement("div");
    card.className = "reference-card";

    const h3 = document.createElement("h3");
    h3.textContent = title;

    const p = document.createElement("p");
    p.textContent = text;

    card.appendChild(h3);
    card.appendChild(p);

    return card;
  }

  function addReferenceBox() {
    const instructionBox = document.querySelector("main .instruction-box");
    if (!instructionBox) return;

    if (instructionBox.dataset.referenceReady === "true") return;

    const data = getReferenceData();
    if (!data.length) return;

    instructionBox.dataset.referenceReady = "true";

    const referenceBox = document.createElement("section");
    referenceBox.className = "reference-box";
    referenceBox.setAttribute("aria-label", "References");

    const heading = document.createElement("h2");
    heading.textContent = "References";

    const scrollArea = document.createElement("div");
    scrollArea.className = "reference-scroll";

    data.forEach(function (item) {
      scrollArea.appendChild(createReferenceCard(item[0], item[1]));
    });

    referenceBox.appendChild(heading);
    referenceBox.appendChild(scrollArea);

    instructionBox.appendChild(referenceBox);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addReferenceBox);
  } else {
    addReferenceBox();
  }
})();