
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
   LOAN PAGE: clean fixed result table + graph
   No MutationObserver. No document-wide click rebuilding.
   calculateLoan() creates result outside the calculator.
===================================================== */
(function () {
  "use strict";

  let loanHistory = [];

  function isLoanPage() {
    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      !!document.getElementById("loanResult")
    );
  }

  function safeLoadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem("loanHistory") || "[]");
      loanHistory = Array.isArray(saved) ? saved : [];
    } catch {
      loanHistory = [];
    }
  }

  function safeSaveHistory() {
    try {
      localStorage.setItem("loanHistory", JSON.stringify(loanHistory));
    } catch {
      /* ignore storage error */
    }
  }

  function getNumber(id) {
    const input = document.getElementById(id);
    return input ? Number(input.value) : NaN;
  }

  function money(value) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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

  function getOutputPanel() {
    const calculator = document.querySelector(".calculator");
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

  function buildGraph(data) {
    if (!data.length) return "";

    const width = 420;
    const height = 250;
    const left = 54;
    const right = 24;
    const top = 26;
    const bottom = 48;

    const minYear = data[0].year;
    const maxYear = data[data.length - 1].year;

    const values = data.map(function (row) {
      return row.monthly;
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
      return x(row.year) + "," + y(row.monthly);
    }).join(" ");

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(function (step) {
      const gridY = top + step * (height - top - bottom);
      const label = maxValue - step * valueRange;

      return `
        <line x1="${left}" y1="${gridY}" x2="${width - right}" y2="${gridY}" class="loan-graph-grid"></line>
        <text x="8" y="${gridY + 5}" class="loan-graph-value">${money(label)}</text>
      `;
    }).join("");

    const yearLabels = data.map(function (row) {
      if (data.length > 12 && row.year % 5 !== 0 && row.year !== minYear && row.year !== maxYear) {
        return "";
      }

      return `
        <text x="${x(row.year)}" y="${height - 18}" transform="rotate(-45 ${x(row.year)} ${height - 18})">${row.year}</text>
      `;
    }).join("");

    const circles = data.map(function (row) {
      return `<circle cx="${x(row.year)}" cy="${y(row.monthly)}" r="5"></circle>`;
    }).join("");

    return `
      <svg class="loan-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly payment by years graph">
        ${gridLines}

        <line x1="${left}" y1="${height - bottom}" x2="${width - right + 12}" y2="${height - bottom}" class="loan-graph-axis"></line>
        <line x1="${left}" y1="${height - bottom}" x2="${left}" y2="${top - 14}" class="loan-graph-axis"></line>

        <polyline points="${points}" class="loan-graph-line"></polyline>

        ${circles}
        ${yearLabels}
      </svg>
    `;
  }

  function getTableCopyText(panel) {
    const table = panel.querySelector("table");
    if (!table) return "";

    return Array.from(table.querySelectorAll("tr"))
      .map(function (row) {
        return Array.from(row.querySelectorAll("th, td"))
          .map(function (cell) {
            return cell.textContent.trim();
          })
          .join("\t");
      })
      .join("\n");
  }

  function copyText(text, button) {
    if (!text) return;

    function done(label) {
      const oldText = button.textContent;
      button.textContent = label;

      setTimeout(function () {
        button.textContent = oldText;
      }, 1200);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(function () {
          done("Copied");
        })
        .catch(function () {
          fallbackCopy(text, done);
        });

      return;
    }

    fallbackCopy(text, done);
  }

  function fallbackCopy(text, done) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
      done("Copied");
    } catch {
      done("Failed");
    }

    textarea.remove();
  }

  function renderLoanOutput(data) {
    const panel = getOutputPanel();
    if (!panel) return;

    if (!data || !data.length) {
      panel.innerHTML = "";
      panel.hidden = true;
      return;
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

    panel.hidden = false;
    panel.innerHTML = `
      <div class="loan-output-top">
        <div class="loan-result-panel">
          <h2 class="loan-panel-title">Result</h2>

          <div class="loan-result-body">
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

        <div class="loan-copy-side">
          <button type="button" class="loan-copy-btn">Copy</button>
        </div>
      </div>

      <div class="loan-graph-panel">
        <h2 class="loan-panel-title">Graph</h2>

        <div class="loan-graph-body">
          ${buildGraph(data)}
        </div>
      </div>
    `;

    const copyButton = panel.querySelector(".loan-copy-btn");

    if (copyButton) {
      copyButton.addEventListener("click", function () {
        copyText(getTableCopyText(panel), copyButton);
      });
    }
  }

  function showLoanHistory() {
    const list = document.getElementById("loanHistoryList");
    if (!list) return;

    list.innerHTML = "";

    loanHistory.slice().reverse().forEach(function (item) {
      const li = document.createElement("li");
      li.className = "history-item";

      const text = document.createElement("span");
      text.className = "history-text";
      text.textContent = item;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "history-copy-btn";
      copyBtn.textContent = "copy";

      copyBtn.addEventListener("click", function () {
        copyText(item, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function saveLoanHistory(amount, annualRate, years, answer) {
    const item =
      "Loan: " + amount.toFixed(2) +
      " | Interest: " + annualRate.toFixed(2) + "%" +
      " | Years: " + years +
      " → " + answer.replace(/\n/g, " | ");

    loanHistory.push(item);

    if (loanHistory.length > 50) {
      loanHistory.shift();
    }

    safeSaveHistory();
    showLoanHistory();
  }

  function calculateLoan() {
    const amount = getNumber("amount");
    const annualRate = getNumber("interest");
    const years = getNumber("years");
    const result = document.getElementById("loanResult");

    if (amount <= 0 || annualRate < 0 || years <= 0) {
      if (result) {
        result.innerText = "Please enter valid loan details.";
      }

      renderLoanOutput([]);
      return;
    }

    const maxYears = Math.min(Math.floor(years), 60);
    const data = [];

    for (let year = 1; year <= maxYears; year += 1) {
      const monthly = monthlyPayment(amount, annualRate, year);
      const totalPayment = monthly * year * 12;
      const totalInterest = totalPayment - amount;

      data.push({
        year,
        monthly,
        totalInterest,
        totalPayment
      });
    }

    const selectedMonthly = monthlyPayment(amount, annualRate, years);
    const selectedTotalPayment = selectedMonthly * years * 12;
    const selectedTotalInterest = selectedTotalPayment - amount;

    const answer =
      "Monthly payment: " + selectedMonthly.toFixed(2) + "\n" +
      "Annual interest rate: " + annualRate.toFixed(2) + "%\n" +
      "Total interest: " + selectedTotalInterest.toFixed(2) + "\n" +
      "Total payment: " + selectedTotalPayment.toFixed(2);

    if (result) {
      result.innerText = answer;
    }

    saveLoanHistory(amount, annualRate, years, answer);
    renderLoanOutput(data);
  }

  function clearLoanHistory() {
    loanHistory = [];

    try {
      localStorage.removeItem("loanHistory");
    } catch {
      /* ignore storage error */
    }

    showLoanHistory();

    const result = document.getElementById("loanResult");
    if (result) result.innerText = "";

    renderLoanOutput([]);
  }

  function initLoanPage() {
    if (!isLoanPage()) return;

    safeLoadHistory();
    showLoanHistory();

    const result = document.getElementById("loanResult");
    if (result) {
      result.innerText = "";
    }

    renderLoanOutput([]);
  }

  window.calculateLoan = calculateLoan;
  window.clearLoanHistory = clearLoanHistory;
  window.showLoanHistory = showLoanHistory;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLoanPage);
  } else {
    initLoanPage();
  }
})();
/* =====================================================
   LOAN PAGE: remove Copy button inside calculator box
   Keeps outside result/table copy button
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

  function removeLoanInsideCopyButton() {
    if (!isLoanPage()) return;

    const calculator = document.querySelector(".calculator");
    const loanResult = document.getElementById("loanResult");

    if (!calculator) return;

    calculator
      .querySelectorAll(".result-copy-btn, .copy-result-btn")
      .forEach(function (button) {
        if (!button.closest("#loanExternalOutput")) {
          button.remove();
        }
      });

    if (loanResult) {
      const wrapper = loanResult.closest(".result-copy-wrap");

      if (wrapper && calculator.contains(wrapper)) {
        wrapper.parentNode.insertBefore(loanResult, wrapper);
        wrapper.remove();
      }
    }
  }

  function start() {
    removeLoanInsideCopyButton();

    setTimeout(removeLoanInsideCopyButton, 100);
    setTimeout(removeLoanInsideCopyButton, 400);
    setTimeout(removeLoanInsideCopyButton, 1000);

    document.addEventListener("click", function () {
      setTimeout(removeLoanInsideCopyButton, 0);
      setTimeout(removeLoanInsideCopyButton, 150);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   PC ONLY: make all calculator pages use loan-style output
   - Result appears outside calculator
   - Copy button on side
   - Loan keeps its table + graph system
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function isExcludedPage() {
    return (
      document.body.classList.contains("index-page") ||
      document.body.classList.contains("about-page") ||
      document.body.classList.contains("privacy-page") ||
      document.body.classList.contains("contact-page") ||
      document.body.classList.contains("info-page")
    );
  }

  function isLoanPage() {
    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      !!document.getElementById("loanExternalOutput")
    );
  }

  function getMain() {
    return document.querySelector("main");
  }

  function getCalculator(main) {
    return main ? main.querySelector(":scope > .calculator") : null;
  }

  function isCalculatorPage() {
    const main = getMain();
    if (!main || isExcludedPage()) return false;
    if (main.classList.contains("calculator-box")) return false;

    return !!getCalculator(main);
  }

  function getResultElement(main) {
    if (!main) return null;

    const selectors = [
      "#result",
      "#ageResult",
      "#bmiResult",
      "#discountResult",
      "#percentageResult",
      "#compoundResult"
    ];

    for (const selector of selectors) {
      const element = main.querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  function copyText(text, button) {
    const value = String(text || "").trim();
    if (!value) return;

    function done() {
      const oldText = button.textContent;
      button.textContent = "Copied!";
      setTimeout(function () {
        button.textContent = oldText;
      }, 1200);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(done).catch(function () {
        fallbackCopy(value);
        done();
      });
    } else {
      fallbackCopy(value);
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

  function createUniversalPanel(main, calculator) {
    let panel = main.querySelector(":scope > .universal-output-panel");

    if (!panel) {
      panel = document.createElement("section");
      panel.className = "universal-output-panel";
      panel.setAttribute("aria-label", "Calculator result");

      panel.innerHTML = `
        <div class="universal-output-top">
          <div class="universal-result-panel">
            <h2 class="universal-panel-title">Result</h2>
            <div class="universal-result-body"></div>
          </div>

          <div class="universal-copy-side">
            <button type="button" class="universal-copy-btn">Copy</button>
          </div>
        </div>
      `;

      calculator.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function removeInsideCopyButtons(calculator) {
    if (!calculator) return;

    calculator
      .querySelectorAll(".result-copy-btn, .copy-result-btn")
      .forEach(function (button) {
        button.remove();
      });
  }

  function unwrapResult(result) {
    if (!result) return;

    const wrapper = result.closest(".result-copy-wrap");

    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(result, wrapper);
      wrapper.remove();
    }
  }

  function syncUniversalOutput() {
    if (!isCalculatorPage()) return;

    const main = getMain();
    const calculator = getCalculator(main);

    if (!main || !calculator) return;

    main.classList.add("pc-calculator-layout");

    removeInsideCopyButtons(calculator);

    if (isLoanPage()) {
      const loanPanel = document.getElementById("loanExternalOutput");

      if (loanPanel && loanPanel.parentElement !== main) {
        calculator.insertAdjacentElement("afterend", loanPanel);
      }

      return;
    }

    const result = getResultElement(main);
    if (!result) return;

    unwrapResult(result);

    if (!isPc()) {
      if (!calculator.contains(result)) {
        calculator.appendChild(result);
      }

      const panel = main.querySelector(":scope > .universal-output-panel");
      if (panel) panel.remove();

      return;
    }

    const panel = createUniversalPanel(main, calculator);
    const body = panel.querySelector(".universal-result-body");
    const copyButton = panel.querySelector(".universal-copy-btn");

    if (!body || !copyButton) return;

    if (!body.contains(result)) {
      body.appendChild(result);
    }

    result.style.display = "";

    const hasText = result.innerText.trim() || result.textContent.trim();
    panel.hidden = !hasText;

    if (copyButton.dataset.ready !== "true") {
      copyButton.dataset.ready = "true";

      copyButton.addEventListener("click", function () {
        copyText(result.innerText || result.textContent, copyButton);
      });
    }
  }

  function startUniversalLoanStyle() {
    syncUniversalOutput();

    window.addEventListener("resize", syncUniversalOutput);

    document.addEventListener("click", function () {
      setTimeout(syncUniversalOutput, 0);
      setTimeout(syncUniversalOutput, 150);
      setTimeout(syncUniversalOutput, 400);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        setTimeout(syncUniversalOutput, 0);
        setTimeout(syncUniversalOutput, 150);
        setTimeout(syncUniversalOutput, 400);
      }
    });

    setTimeout(syncUniversalOutput, 300);
    setTimeout(syncUniversalOutput, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startUniversalLoanStyle);
  } else {
    startUniversalLoanStyle();
  }
})();
/* =====================================================
   PC ONLY: restore ? help button
   Opens instructions/references, closes on second click
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function isExcludedPage() {
    return (
      document.body.classList.contains("index-page") ||
      document.body.classList.contains("about-page") ||
      document.body.classList.contains("privacy-page") ||
      document.body.classList.contains("contact-page") ||
      document.body.classList.contains("info-page")
    );
  }

  function setupQuestionButton() {
    if (!isPc() || isExcludedPage()) return;

    const main = document.querySelector("main.pc-calculator-layout");
    if (!main) return;

    const instructionBox = main.querySelector(":scope > .instruction-box");
    if (!instructionBox) return;

    let button = main.querySelector(":scope > .pc-question-toggle");

    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "pc-question-toggle";
      button.textContent = "?";
      button.setAttribute("aria-label", "Open instructions and references");
      button.setAttribute("aria-expanded", "false");

      main.appendChild(button);
    }

    if (button.dataset.restoreQuestionReady === "true") return;

    button.dataset.restoreQuestionReady = "true";

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      const willOpen = !main.classList.contains("pc-help-open");

      main.classList.toggle("pc-help-open", willOpen);
      button.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  }

  function start() {
    setupQuestionButton();

    window.addEventListener("resize", setupQuestionButton);

    setTimeout(setupQuestionButton, 200);
    setTimeout(setupQuestionButton, 700);
    setTimeout(setupQuestionButton, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   LOAN PAGE: add Copy button beside graph
   Copies graph data: Years + Monthly Payment
===================================================== */
(function () {
  "use strict";

  function isLoanPage() {
    return (
      document.body.classList.contains("loan-page") ||
      document.body.dataset.page === "loan" ||
      !!document.getElementById("loanExternalOutput")
    );
  }

  function getGraphDataText() {
    const table = document.querySelector("#loanExternalOutput .loan-result-table");
    if (!table) return "";

    const rows = Array.from(table.querySelectorAll("tbody tr"));

    if (!rows.length) return "";

    let text = "Years\tMonthly Payment\n";

    rows.forEach(function (row) {
      const cells = row.querySelectorAll("td");

      if (cells.length >= 2) {
        text +=
          cells[0].textContent.trim() +
          "\t" +
          cells[1].textContent.trim() +
          "\n";
      }
    });

    return text.trim();
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

  function copyGraphData(button) {
    const text = getGraphDataText();
    if (!text) return;

    function done() {
      const oldText = button.textContent;
      button.textContent = "Copied!";

      setTimeout(function () {
        button.textContent = oldText;
      }, 1200);
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

  function addGraphCopyButton() {
    if (!isLoanPage()) return;

    const output = document.getElementById("loanExternalOutput");
    if (!output) return;

    const graphPanel =
      output.querySelector(":scope > .loan-graph-panel") ||
      output.querySelector(":scope > .loan-graph-row > .loan-graph-panel");

    if (!graphPanel) return;

    let graphRow = output.querySelector(":scope > .loan-graph-row");

    if (!graphRow) {
      graphRow = document.createElement("div");
      graphRow.className = "loan-graph-row";

      output.insertBefore(graphRow, graphPanel);
      graphRow.appendChild(graphPanel);
    }

    let copySide = graphRow.querySelector(":scope > .loan-graph-copy-side");

    if (!copySide) {
      copySide = document.createElement("div");
      copySide.className = "loan-graph-copy-side";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "loan-graph-copy-btn";
      button.textContent = "Copy";

      button.addEventListener("click", function () {
        copyGraphData(button);
      });

      copySide.appendChild(button);
      graphRow.appendChild(copySide);
    }
  }

  function startGraphCopyButton() {
    addGraphCopyButton();

    document.addEventListener("click", function () {
      setTimeout(addGraphCopyButton, 0);
      setTimeout(addGraphCopyButton, 150);
      setTimeout(addGraphCopyButton, 400);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        setTimeout(addGraphCopyButton, 0);
        setTimeout(addGraphCopyButton, 150);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startGraphCopyButton);
  } else {
    startGraphCopyButton();
  }
})();
/* =====================================================
   PC ONLY: FINAL ? SYMBOL FUNCTION FIX
   Click ? = open instructions/references
   Click ? again = close
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function isExcludedPage() {
    return (
      document.body.classList.contains("index-page") ||
      document.body.classList.contains("about-page") ||
      document.body.classList.contains("privacy-page") ||
      document.body.classList.contains("contact-page") ||
      document.body.classList.contains("info-page")
    );
  }

  function positionHelpBox(main) {
    if (!isPc()) return;

    const button = main.querySelector(":scope > .pc-question-toggle");
    const box = main.querySelector(":scope > .instruction-box");

    if (!button || !box) return;

    const buttonRect = button.getBoundingClientRect();

    const gap = 8;
    const screenPadding = 16;
    const boxWidth = Math.min(520, window.innerWidth - 32);

    let left = buttonRect.left - boxWidth - gap;

    if (left < screenPadding) {
      left = screenPadding;
    }

    let top = buttonRect.top;

    if (top + 520 > window.innerHeight) {
      top = Math.max(screenPadding, window.innerHeight - 560);
    }

    document.documentElement.style.setProperty("--pc-question-panel-left", left + "px");
    document.documentElement.style.setProperty("--pc-question-panel-top", top + "px");
    document.documentElement.style.setProperty("--pc-question-panel-width", boxWidth + "px");
  }

  function setupQuestionButton() {
    if (!isPc() || isExcludedPage()) return;

    document.querySelectorAll("main.pc-calculator-layout").forEach(function (main) {
      const instructionBox = main.querySelector(":scope > .instruction-box");
      if (!instructionBox) return;

      let button = main.querySelector(":scope > .pc-question-toggle");

      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "pc-question-toggle";
        button.textContent = "?";
        button.setAttribute("aria-label", "Open instructions and references");
        button.setAttribute("aria-expanded", "false");

        main.appendChild(button);
      }

      positionHelpBox(main);
    });
  }

  document.addEventListener(
    "click",
    function (event) {
      const button = event.target.closest(".pc-question-toggle");
      if (!button || !isPc()) return;

      const main = button.closest("main.pc-calculator-layout");
      if (!main) return;

      event.preventDefault();
      event.stopPropagation();

      const willOpen = !main.classList.contains("pc-help-open");

      main.classList.toggle("pc-help-open", willOpen);
      button.setAttribute("aria-expanded", willOpen ? "true" : "false");

      positionHelpBox(main);
    },
    true
  );

  function start() {
    setupQuestionButton();

    window.addEventListener("resize", setupQuestionButton);
    window.addEventListener("scroll", function () {
      document.querySelectorAll("main.pc-calculator-layout").forEach(positionHelpBox);
    });

    setTimeout(setupQuestionButton, 100);
    setTimeout(setupQuestionButton, 400);
    setTimeout(setupQuestionButton, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   PC ONLY: FINAL FLOATING ? HELP OVERLAY
   - Does not move page layout
   - Opens left of ? symbol
   - Same size as calculator box
   - Overlays all page items
   - Works on all calculator pages
===================================================== */
(function () {
  "use strict";

  const BUTTON_ID = "pcQuestionOverlayButton";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function isExcludedPage() {
    return (
      document.body.classList.contains("index-page") ||
      document.body.classList.contains("about-page") ||
      document.body.classList.contains("privacy-page") ||
      document.body.classList.contains("contact-page") ||
      document.body.classList.contains("info-page")
    );
  }

  function getMain() {
    return document.querySelector("main.pc-calculator-layout") ||
           document.querySelector("main.has-instructions") ||
           document.querySelector("main");
  }

  function isCalculatorPage(main) {
    if (!main || isExcludedPage()) return false;

    return !!(
      main.querySelector(":scope > .calculator") &&
      main.querySelector(":scope > .instruction-box")
    );
  }

  function removeOldQuestionButtons(main) {
    if (!main) return;

    main.querySelectorAll(":scope > .pc-question-toggle").forEach(function (button) {
      button.remove();
    });
  }

  function getButton() {
    let button = document.getElementById(BUTTON_ID);

    if (!button) {
      button = document.createElement("button");
      button.id = BUTTON_ID;
      button.type = "button";
      button.textContent = "?";
      button.setAttribute("aria-label", "Open instructions and references");
      button.setAttribute("aria-expanded", "false");

      document.body.appendChild(button);
    }

    return button;
  }

  function positionButtonAndPanel() {
    const main = getMain();

    if (!isPc() || !isCalculatorPage(main)) {
      document.body.classList.remove("pc-final-help-ready", "pc-final-help-open");

      const oldButton = document.getElementById(BUTTON_ID);
      if (oldButton) oldButton.hidden = true;

      return;
    }

    removeOldQuestionButtons(main);

    const calculator = main.querySelector(":scope > .calculator");
    const instructionBox = main.querySelector(":scope > .instruction-box");
    const button = getButton();

    if (!calculator || !instructionBox || !button) return;

    const calcRect = calculator.getBoundingClientRect();

    const buttonSize = 58;
    const gap = 4;
    const screenPadding = 12;

    let buttonLeft = calcRect.right + gap;
    let buttonTop = calcRect.top;

    if (buttonLeft + buttonSize > window.innerWidth - screenPadding) {
      buttonLeft = window.innerWidth - screenPadding - buttonSize;
    }

    if (buttonLeft < screenPadding) {
      buttonLeft = screenPadding;
    }

    if (buttonTop < screenPadding) {
      buttonTop = screenPadding;
    }

    if (buttonTop + buttonSize > window.innerHeight - screenPadding) {
      buttonTop = window.innerHeight - screenPadding - buttonSize;
    }

    let panelWidth = calcRect.width;
    let panelHeight = calcRect.height;

    panelWidth = Math.min(panelWidth, window.innerWidth - screenPadding * 2);
    panelHeight = Math.min(panelHeight, window.innerHeight - screenPadding * 2);

    let panelLeft = buttonLeft - panelWidth - gap;
    let panelTop = buttonTop;

    if (panelLeft < screenPadding) {
      panelLeft = screenPadding;
      panelWidth = Math.min(panelWidth, buttonLeft - gap - screenPadding);
    }

    if (panelWidth < 300) {
      panelWidth = Math.min(calcRect.width, window.innerWidth - screenPadding * 2);
      panelLeft = screenPadding;
    }

    if (panelTop + panelHeight > window.innerHeight - screenPadding) {
      panelTop = window.innerHeight - screenPadding - panelHeight;
    }

    if (panelTop < screenPadding) {
      panelTop = screenPadding;
    }

    document.documentElement.style.setProperty("--pc-final-question-left", buttonLeft + "px");
    document.documentElement.style.setProperty("--pc-final-question-top", buttonTop + "px");

    document.documentElement.style.setProperty("--pc-final-help-left", panelLeft + "px");
    document.documentElement.style.setProperty("--pc-final-help-top", panelTop + "px");
    document.documentElement.style.setProperty("--pc-final-help-width", panelWidth + "px");
    document.documentElement.style.setProperty("--pc-final-help-height", panelHeight + "px");

    button.hidden = false;
    document.body.classList.add("pc-final-help-ready");
  }

  function setupButtonClick() {
    const button = getButton();

    if (button.dataset.finalQuestionReady === "true") return;

    button.dataset.finalQuestionReady = "true";

    button.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (!isPc()) return;

        const main = getMain();
        if (!isCalculatorPage(main)) return;

        positionButtonAndPanel();

        const willOpen = !document.body.classList.contains("pc-final-help-open");

        document.body.classList.toggle("pc-final-help-open", willOpen);
        button.setAttribute("aria-expanded", willOpen ? "true" : "false");
      },
      true
    );
  }

  function startFinalQuestionOverlay() {
    setupButtonClick();
    positionButtonAndPanel();

    window.addEventListener("resize", positionButtonAndPanel);
    window.addEventListener("scroll", positionButtonAndPanel, { passive: true });

    setTimeout(positionButtonAndPanel, 100);
    setTimeout(positionButtonAndPanel, 400);
    setTimeout(positionButtonAndPanel, 900);
    setTimeout(positionButtonAndPanel, 1500);

    document.addEventListener(
      "click",
      function (event) {
        const button = document.getElementById(BUTTON_ID);
        const panel = document.querySelector("main.pc-calculator-layout > .instruction-box");

        if (
          document.body.classList.contains("pc-final-help-open") &&
          button &&
          panel &&
          !button.contains(event.target) &&
          !panel.contains(event.target)
        ) {
          document.body.classList.remove("pc-final-help-open");
          button.setAttribute("aria-expanded", "false");
        }

        setTimeout(positionButtonAndPanel, 0);
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startFinalQuestionOverlay);
  } else {
    startFinalQuestionOverlay();
  }
})();
/* =====================================================
   PC ONLY: make ? gap close to instruction/reference box
   Panel right edge stays beside ? button
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function isExcludedPage() {
    return (
      document.body.classList.contains("index-page") ||
      document.body.classList.contains("about-page") ||
      document.body.classList.contains("privacy-page") ||
      document.body.classList.contains("contact-page") ||
      document.body.classList.contains("info-page")
    );
  }

  function fixQuestionGap() {
    if (!isPc() || isExcludedPage()) return;

    const button = document.getElementById("pcQuestionOverlayButton");
    const main =
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main.has-instructions");

    if (!button || !main) return;

    const calculator = main.querySelector(":scope > .calculator");
    const instructionBox = main.querySelector(":scope > .instruction-box");

    if (!calculator || !instructionBox) return;

    const calcRect = calculator.getBoundingClientRect();

    const buttonSize = 58;
    const gap = 2; /* smaller number = closer */
    const screenPadding = 12;

    let panelWidth = Math.min(calcRect.width, window.innerWidth - screenPadding * 2);
    let panelHeight = Math.min(calcRect.height, window.innerHeight - screenPadding * 2);

    let buttonLeft = calcRect.right + gap;
    let buttonTop = calcRect.top + 10;

    if (buttonLeft + buttonSize > window.innerWidth - screenPadding) {
      buttonLeft = window.innerWidth - screenPadding - buttonSize;
    }

    let panelLeft = buttonLeft - panelWidth - gap;
    let panelTop = buttonTop - 10;

    if (panelLeft < screenPadding) {
      panelLeft = screenPadding;
      panelWidth = Math.max(300, buttonLeft - gap - screenPadding);
    }

    if (panelTop < screenPadding) {
      panelTop = screenPadding;
    }

    if (panelTop + panelHeight > window.innerHeight - screenPadding) {
      panelTop = window.innerHeight - screenPadding - panelHeight;
    }

    document.documentElement.style.setProperty("--pc-final-question-left", buttonLeft + "px");
    document.documentElement.style.setProperty("--pc-final-question-top", buttonTop + "px");

    document.documentElement.style.setProperty("--pc-final-help-left", panelLeft + "px");
    document.documentElement.style.setProperty("--pc-final-help-top", panelTop + "px");
    document.documentElement.style.setProperty("--pc-final-help-width", panelWidth + "px");
    document.documentElement.style.setProperty("--pc-final-help-height", panelHeight + "px");
  }

  function start() {
    fixQuestionGap();

    window.addEventListener("resize", fixQuestionGap);
    window.addEventListener("scroll", fixQuestionGap, { passive: true });

    document.addEventListener("click", function () {
      setTimeout(fixQuestionGap, 0);
      setTimeout(fixQuestionGap, 80);
      setTimeout(fixQuestionGap, 200);
    });

    setTimeout(fixQuestionGap, 100);
    setTimeout(fixQuestionGap, 500);
    setTimeout(fixQuestionGap, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   PC ONLY: FINAL TIGHT ? GAP FIX
   Makes help panel touch/near the ? symbol
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function isExcludedPage() {
    return (
      document.body.classList.contains("index-page") ||
      document.body.classList.contains("about-page") ||
      document.body.classList.contains("privacy-page") ||
      document.body.classList.contains("contact-page") ||
      document.body.classList.contains("info-page")
    );
  }

  function getMain() {
    return (
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main.has-instructions")
    );
  }

  function tightPositionQuestionPanel() {
    if (!isPc() || isExcludedPage()) return;

    const main = getMain();
    const button = document.getElementById("pcQuestionOverlayButton");

    if (!main || !button) return;

    const calculator = main.querySelector(":scope > .calculator");
    const panel = main.querySelector(":scope > .instruction-box");

    if (!calculator || !panel) return;

    const calcRect = calculator.getBoundingClientRect();

    const gap = 0;          /* 0 = touching, 2 = tiny gap */
    const padding = 10;
    const buttonSize = 58;

    let buttonLeft = calcRect.right + 4;
    let buttonTop = calcRect.top + 8;

    if (buttonLeft + buttonSize > window.innerWidth - padding) {
      buttonLeft = window.innerWidth - padding - buttonSize;
    }

    if (buttonTop < padding) {
      buttonTop = padding;
    }

    let panelWidth = Math.min(calcRect.width, buttonLeft - padding - gap);
    let panelHeight = Math.min(calcRect.height, window.innerHeight - padding * 2);

    if (panelWidth < 320) {
      panelWidth = Math.min(calcRect.width, window.innerWidth - padding * 2);
    }

    let panelLeft = buttonLeft - panelWidth - gap;
    let panelTop = buttonTop - 8;

    if (panelLeft < padding) {
      panelLeft = padding;
    }

    if (panelTop < padding) {
      panelTop = padding;
    }

    if (panelTop + panelHeight > window.innerHeight - padding) {
      panelTop = window.innerHeight - padding - panelHeight;
    }

    document.documentElement.style.setProperty("--tight-q-left", buttonLeft + "px");
    document.documentElement.style.setProperty("--tight-q-top", buttonTop + "px");

    document.documentElement.style.setProperty("--tight-panel-left", panelLeft + "px");
    document.documentElement.style.setProperty("--tight-panel-top", panelTop + "px");
    document.documentElement.style.setProperty("--tight-panel-width", panelWidth + "px");
    document.documentElement.style.setProperty("--tight-panel-height", panelHeight + "px");
  }

  function startTightQuestionFix() {
    tightPositionQuestionPanel();

    window.addEventListener("resize", tightPositionQuestionPanel);
    window.addEventListener("scroll", tightPositionQuestionPanel, { passive: true });

    document.addEventListener("click", function () {
      setTimeout(tightPositionQuestionPanel, 0);
      setTimeout(tightPositionQuestionPanel, 80);
      setTimeout(tightPositionQuestionPanel, 200);
    });

    setTimeout(tightPositionQuestionPanel, 100);
    setTimeout(tightPositionQuestionPanel, 500);
    setTimeout(tightPositionQuestionPanel, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startTightQuestionFix);
  } else {
    startTightQuestionFix();
  }
})();
/* =====================================================
   PC ONLY: FINAL ? OVERLAY ON TOP OF CALCULATOR
   - ? stays beside calculator
   - Instruction/reference box overlays calculator
   - Same size as calculator box
   - Does not move any page item
   - Works on all calculator pages
===================================================== */
(function () {
  "use strict";

  const BUTTON_ID = "pcQuestionOverlayButton";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function isExcludedPage() {
    return (
      document.body.classList.contains("index-page") ||
      document.body.classList.contains("about-page") ||
      document.body.classList.contains("privacy-page") ||
      document.body.classList.contains("contact-page") ||
      document.body.classList.contains("info-page")
    );
  }

  function getMain() {
    return (
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main.has-instructions") ||
      document.querySelector("main")
    );
  }

  function isCalculatorPage(main) {
    if (!main || isExcludedPage()) return false;

    return !!(
      main.querySelector(":scope > .calculator") &&
      main.querySelector(":scope > .instruction-box")
    );
  }

  function getButton() {
    let button = document.getElementById(BUTTON_ID);

    if (!button) {
      button = document.createElement("button");
      button.id = BUTTON_ID;
      button.type = "button";
      button.textContent = "?";
      button.setAttribute("aria-label", "Open instructions and references");
      button.setAttribute("aria-expanded", "false");
      document.body.appendChild(button);
    }

    button.hidden = false;
    return button;
  }

  function removeOldQuestionButtons(main) {
    if (!main) return;

    main.querySelectorAll(":scope > .pc-question-toggle").forEach(function (button) {
      button.remove();
    });
  }

  function positionCalculatorOverlay() {
    const main = getMain();

    if (!isPc() || !isCalculatorPage(main)) {
      document.body.classList.remove("pc-calculator-help-ready", "pc-calculator-help-open");

      const button = document.getElementById(BUTTON_ID);
      if (button) button.hidden = true;

      return;
    }

    removeOldQuestionButtons(main);

    const calculator = main.querySelector(":scope > .calculator");
    const instructionBox = main.querySelector(":scope > .instruction-box");
    const button = getButton();

    if (!calculator || !instructionBox || !button) return;

    const calcRect = calculator.getBoundingClientRect();

    const screenPadding = 10;
    const buttonSize = 58;
    const buttonGap = 6;

    let overlayLeft = calcRect.left;
    let overlayTop = calcRect.top;
    let overlayWidth = calcRect.width;
    let overlayHeight = calcRect.height;

    if (overlayLeft < screenPadding) {
      overlayLeft = screenPadding;
    }

    if (overlayTop < screenPadding) {
      overlayTop = screenPadding;
    }

    overlayWidth = Math.min(overlayWidth, window.innerWidth - screenPadding * 2);
    overlayHeight = Math.min(overlayHeight, window.innerHeight - screenPadding * 2);

    if (overlayLeft + overlayWidth > window.innerWidth - screenPadding) {
      overlayLeft = window.innerWidth - screenPadding - overlayWidth;
    }

    if (overlayTop + overlayHeight > window.innerHeight - screenPadding) {
      overlayTop = window.innerHeight - screenPadding - overlayHeight;
    }

    let buttonLeft = overlayLeft + overlayWidth + buttonGap;
    let buttonTop = overlayTop + 10;

    if (buttonLeft + buttonSize > window.innerWidth - screenPadding) {
      buttonLeft = overlayLeft + overlayWidth - buttonSize - 10;
      buttonTop = overlayTop + 10;
    }

    document.documentElement.style.setProperty("--calc-help-left", overlayLeft + "px");
    document.documentElement.style.setProperty("--calc-help-top", overlayTop + "px");
    document.documentElement.style.setProperty("--calc-help-width", overlayWidth + "px");
    document.documentElement.style.setProperty("--calc-help-height", overlayHeight + "px");

    document.documentElement.style.setProperty("--calc-help-btn-left", buttonLeft + "px");
    document.documentElement.style.setProperty("--calc-help-btn-top", buttonTop + "px");

    document.body.classList.add("pc-calculator-help-ready");
  }

  function setupQuestionButton() {
    const button = getButton();

    if (button.dataset.calculatorOverlayReady === "true") return;

    button.dataset.calculatorOverlayReady = "true";

    button.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (!isPc()) return;

        const main = getMain();
        if (!isCalculatorPage(main)) return;

        positionCalculatorOverlay();

        const willOpen = !document.body.classList.contains("pc-calculator-help-open");

        document.body.classList.toggle("pc-calculator-help-open", willOpen);
        button.setAttribute("aria-expanded", willOpen ? "true" : "false");
      },
      true
    );
  }

  function startCalculatorHelpOverlay() {
    setupQuestionButton();
    positionCalculatorOverlay();

    window.addEventListener("resize", positionCalculatorOverlay);
    window.addEventListener("scroll", positionCalculatorOverlay, { passive: true });

    document.addEventListener(
      "click",
      function (event) {
        const button = document.getElementById(BUTTON_ID);
        const main = getMain();
        const panel = main ? main.querySelector(":scope > .instruction-box") : null;

        if (
          document.body.classList.contains("pc-calculator-help-open") &&
          button &&
          panel &&
          !button.contains(event.target) &&
          !panel.contains(event.target)
        ) {
          document.body.classList.remove("pc-calculator-help-open");
          button.setAttribute("aria-expanded", "false");
        }

        setTimeout(positionCalculatorOverlay, 0);
      },
      true
    );

    setTimeout(positionCalculatorOverlay, 100);
    setTimeout(positionCalculatorOverlay, 400);
    setTimeout(positionCalculatorOverlay, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCalculatorHelpOverlay);
  } else {
    startCalculatorHelpOverlay();
  }
})();
/* =====================================================
   ALL CALCULATOR PAGES: input history only
   History boxes show the input values user entered
   Works for basic, age, BMI, loan, discount, percentage, compound
===================================================== */
(function () {
  "use strict";

  const MAX_ITEMS = 50;

  function getPageType() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    if (title.includes("basic")) return "basic";
    if (title.includes("age")) return "age";
    if (title.includes("bmi")) return "bmi";
    if (title.includes("loan")) return "loan";
    if (title.includes("discount")) return "discount";
    if (title.includes("percentage")) return "percentage";
    if (title.includes("compound")) return "compound";

    if (document.getElementById("display")) return "basic";
    if (document.getElementById("birthdate")) return "age";
    if (document.getElementById("loanResult")) return "loan";
    if (document.getElementById("bmiResult")) return "bmi";
    if (document.getElementById("discountResult")) return "discount";
    if (document.getElementById("percentageResult")) return "percentage";
    if (document.getElementById("compoundResult")) return "compound";

    return "";
  }

  function getHistoryList(type) {
    const map = {
      basic: "historyList",
      age: "ageHistoryList",
      bmi: "bmiHistoryList",
      loan: "loanHistoryList",
      discount: "discountHistoryList",
      percentage: "percentageHistoryList",
      compound: "compoundHistoryList"
    };

    return document.getElementById(map[type]);
  }

  function storageKey(type) {
    return "inputHistory_" + type;
  }

  function loadInputHistory(type) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(type)) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveInputHistory(type, history) {
    localStorage.setItem(storageKey(type), JSON.stringify(history.slice(-MAX_ITEMS)));
  }

  function valueOf(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function textOfSelect(id) {
    const el = document.getElementById(id);
    if (!el) return "";

    if (el.tagName.toLowerCase() === "select") {
      return el.options[el.selectedIndex]
        ? el.options[el.selectedIndex].textContent.trim()
        : el.value;
    }

    return el.value || "";
  }

  function getCalculatorInputs() {
    const calculator = document.querySelector(".calculator");
    if (!calculator) return [];

    return Array.from(
      calculator.querySelectorAll("input, select, textarea")
    ).filter(function (input) {
      if (input.type === "hidden") return false;
      if (input.id === "display") return true;
      return true;
    });
  }

  function labelForInput(input) {
    if (!input) return "Input";

    if (input.id) {
      const label = document.querySelector('label[for="' + input.id + '"]');
      if (label) {
        return label.textContent.replace(/[:：]/g, "").trim();
      }
    }

    if (input.placeholder) {
      return input.placeholder.replace(/example/ig, "").replace(/[:：]/g, "").trim() || "Input";
    }

    if (input.name) return input.name;

    return "Input";
  }

  function getGenericInputText() {
    return getCalculatorInputs()
      .map(function (input) {
        const label = labelForInput(input);
        const value = input.tagName.toLowerCase() === "select"
          ? textOfSelect(input.id)
          : String(input.value || "").trim();

        if (!value) return "";

        return label + ": " + value;
      })
      .filter(Boolean)
      .join(" | ");
  }

  function getInputTextByType(type) {
    if (type === "basic") {
      const display = valueOf("display");
      return display ? "Expression: " + display : "";
    }

    if (type === "age") {
      const birthdate = valueOf("birthdate");
      return birthdate ? "Birth date: " + birthdate : "";
    }

    if (type === "loan") {
      const amount =
        valueOf("amount") ||
        valueOf("loanAmount") ||
        valueOf("principal") ||
        valueOf("loanPrincipal");

      const interest =
        valueOf("interest") ||
        valueOf("loanRate") ||
        valueOf("interestRate") ||
        valueOf("annualRate") ||
        valueOf("rate");

      const years =
        valueOf("years") ||
        valueOf("loanYears") ||
        valueOf("loanTerm") ||
        valueOf("term");

      if (!amount && !interest && !years) return "";

      return (
        "Loan amount: " + (amount || "-") +
        " | Interest rate: " + (interest || "-") + "%" +
        " | Years: " + (years || "-")
      );
    }

    if (type === "compound") {
      const principal =
        valueOf("principal") ||
        valueOf("compoundPrincipal") ||
        valueOf("amount");

      const rate =
        valueOf("rate") ||
        valueOf("compoundRate") ||
        valueOf("interest") ||
        valueOf("interestRate");

      const years =
        valueOf("years") ||
        valueOf("compoundYears") ||
        valueOf("time");

      const frequency =
        textOfSelect("frequency") ||
        textOfSelect("compoundFrequency") ||
        textOfSelect("compoundSelect");

      const text =
        "Principal: " + (principal || "-") +
        " | Interest rate: " + (rate || "-") + "%" +
        " | Years: " + (years || "-") +
        (frequency ? " | Frequency: " + frequency : "");

      return text;
    }

    return getGenericInputText();
  }

  function copyInputHistoryText(text, button) {
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

  function renderInputHistory(type) {
    const list = getHistoryList(type);
    if (!list) return;

    const history = loadInputHistory(type);

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
        copyInputHistoryText(item, copyBtn);
      });

      li.appendChild(text);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function addInputHistory() {
    const type = getPageType();
    if (!type) return;

    const list = getHistoryList(type);
    if (!list) return;

    const inputText = getInputTextByType(type);
    if (!inputText) return;

    const history = loadInputHistory(type);

    if (history[history.length - 1] !== inputText) {
      history.push(inputText);
    }

    saveInputHistory(type, history);
    renderInputHistory(type);
  }

  function clearInputHistory() {
    const type = getPageType();
    if (!type) return;

    localStorage.removeItem(storageKey(type));
    renderInputHistory(type);
  }

  function hookClearButtons() {
    const type = getPageType();
    if (!type) return;

    const historyBox =
      document.querySelector("." + type + "-history-box") ||
      document.querySelector(".history");

    if (!historyBox) return;

    historyBox.querySelectorAll(".clear-btn, button").forEach(function (button) {
      const text = button.textContent.trim().toLowerCase();

      if (!text.includes("clear")) return;
      if (button.dataset.inputHistoryClearReady === "true") return;

      button.dataset.inputHistoryClearReady = "true";

      button.addEventListener("click", function () {
        setTimeout(clearInputHistory, 0);
        setTimeout(clearInputHistory, 100);
      });
    });
  }

  function hookCalculateButtons() {
    const calculator = document.querySelector(".calculator");
    if (!calculator) return;

    calculator.addEventListener("click", function (event) {
      const button = event.target.closest("button");
      if (!button) return;

      const text = button.textContent.trim().toLowerCase();

      if (
        text.includes("calculate") ||
        text === "=" ||
        text.includes("bmi") ||
        text.includes("age") ||
        text.includes("loan") ||
        text.includes("discount") ||
        text.includes("percentage") ||
        text.includes("compound")
      ) {
        setTimeout(addInputHistory, 0);
        setTimeout(addInputHistory, 150);
        setTimeout(addInputHistory, 400);
      }
    });

    calculator.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        setTimeout(addInputHistory, 0);
        setTimeout(addInputHistory, 150);
        setTimeout(addInputHistory, 400);
      }
    });
  }

  function startInputHistorySystem() {
    const type = getPageType();
    if (!type) return;

    hookCalculateButtons();
    hookClearButtons();

    renderInputHistory(type);

    setTimeout(function () {
      renderInputHistory(type);
      hookClearButtons();
    }, 300);

    setTimeout(function () {
      renderInputHistory(type);
      hookClearButtons();
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startInputHistorySystem);
  } else {
    startInputHistorySystem();
  }

  window.clearInputHistory = clearInputHistory;
})();