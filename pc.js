/*
  Copyright © 2026 Hamdi. All rights reserved.
  PC MODE ONLY
  ? help panel opens LEFT and closes on second click.
*/

(function () {
  "use strict";

  const PC_QUERY = "(min-width: 851px)";

  function isPc() {
    return window.matchMedia(PC_QUERY).matches;
  }

  function cleanOldArrows() {
    document
      .querySelectorAll("#navbar .nav-menu-arrow, #navbar .phone-sub-arrow")
      .forEach(function (arrow) {
        arrow.remove();
      });
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

  function isCalculatorPage(main) {
    if (!main || isExcludedPage()) return false;
    if (main.classList.contains("calculator-box")) return false;

    return !!(
      main.querySelector(":scope > .calculator") &&
      main.querySelector(":scope > .instruction-box") &&
      getLeftBox(main)
    );
  }

  function preparePcLayout(main) {
    if (!isCalculatorPage(main)) return;

    const instructionBox = main.querySelector(":scope > .instruction-box");
    const leftBox = getLeftBox(main);

    main.classList.add("pc-calculator-layout");

    let whatBox =
      main.querySelector(":scope > .pc-what-slot .instruction-what-box") ||
      instructionBox.querySelector(":scope > .instruction-what-box");

    if (!whatBox || !leftBox) return;

    let slot = main.querySelector(":scope > .pc-what-slot");

    if (!slot) {
      slot = document.createElement("aside");
      slot.className = "pc-what-slot";
      slot.setAttribute("aria-label", "What this calculator does");
      main.insertBefore(slot, leftBox);
    }

    if (!slot.contains(whatBox)) {
      slot.appendChild(whatBox);
    }

    main.querySelectorAll(".instruction-what-box").forEach(function (box) {
      if (box !== whatBox) {
        box.remove();
      }
    });
  }

  function createQuestionButton(main) {
    let button = main.querySelector(":scope > .pc-question-toggle");

    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "pc-question-toggle";
      button.textContent = "?";
      button.setAttribute("aria-label", "Open instructions and references");
      button.setAttribute("aria-expanded", "false");

      const instructionBox = main.querySelector(":scope > .instruction-box");
      main.insertBefore(button, instructionBox);
    }

    return button;
  }

  function syncPanelPosition(main) {
    if (!isPc()) return;

    const button = main.querySelector(":scope > .pc-question-toggle");
    const calculator = main.querySelector(":scope > .calculator");
    const instructionBox = main.querySelector(":scope > .instruction-box");

    if (!button || !calculator || !instructionBox) return;

    const buttonRect = button.getBoundingClientRect();
    const calcRect = calculator.getBoundingClientRect();

    const gap = 14;
    const screenPadding = 16;

    const panelWidth = Math.min(calcRect.width, window.innerWidth - screenPadding * 2);

    let panelLeft = buttonRect.left - panelWidth - gap;
    if (panelLeft < screenPadding) {
      panelLeft = screenPadding;
    }

    let panelTop = buttonRect.top;
    let panelHeight = Math.min(calcRect.height, window.innerHeight - panelTop - screenPadding);

    if (panelHeight < 320) {
      panelTop = screenPadding;
      panelHeight = Math.min(calcRect.height, window.innerHeight - screenPadding * 2);
    }

    document.documentElement.style.setProperty("--pc-help-left", panelLeft + "px");
    document.documentElement.style.setProperty("--pc-help-top", panelTop + "px");
    document.documentElement.style.setProperty("--pc-help-width", panelWidth + "px");
    document.documentElement.style.setProperty("--pc-help-height", panelHeight + "px");
  }

  function setupQuestionButton(main) {
    if (!isCalculatorPage(main)) return;

    preparePcLayout(main);

    const button = createQuestionButton(main);

    syncPanelPosition(main);

    if (button.dataset.pcQuestionReady === "true") return;

    button.dataset.pcQuestionReady = "true";

    button.addEventListener("click", function (event) {
      if (!isPc()) return;

      event.preventDefault();
      event.stopPropagation();

      const willOpen = !main.classList.contains("pc-help-open");

      main.classList.toggle("pc-help-open", willOpen);
      button.setAttribute("aria-expanded", willOpen ? "true" : "false");
      button.setAttribute(
        "aria-label",
        willOpen ? "Close instructions and references" : "Open instructions and references"
      );

      syncPanelPosition(main);
    });
  }

  function setupAll() {
    cleanOldArrows();

    document.querySelectorAll("main").forEach(function (main) {
      if (!isCalculatorPage(main)) {
        main.classList.remove("pc-calculator-layout", "pc-help-open");
        return;
      }

      setupQuestionButton(main);

      if (!isPc()) {
        main.classList.remove("pc-help-open");
      }
    });
  }

  function syncOpenPanels() {
    document.querySelectorAll("main.pc-calculator-layout").forEach(syncPanelPosition);
  }

  function start() {
    setupAll();

    window.addEventListener("resize", function () {
      setupAll();
      syncOpenPanels();
    });

    window.addEventListener("scroll", syncOpenPanels);

    setTimeout(setupAll, 100);
    setTimeout(setupAll, 400);
    setTimeout(setupAll, 900);
    setTimeout(setupAll, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   PC ONLY: force-create ? help button
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

  function getHistoryBox(main) {
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

  function isCalculatorPage(main) {
    if (!main || isExcludedPage()) return false;
    if (main.classList.contains("calculator-box")) return false;

    return !!(
      main.querySelector(":scope > .calculator") &&
      main.querySelector(":scope > .instruction-box") &&
      getHistoryBox(main)
    );
  }

  function positionHelpPanel(main) {
    if (!isPc()) return;

    const button = main.querySelector(":scope > .pc-question-toggle");
    const calculator = main.querySelector(":scope > .calculator");

    if (!button || !calculator) return;

    const buttonRect = button.getBoundingClientRect();
    const calcRect = calculator.getBoundingClientRect();

    const gap = 4;
    const screenPadding = 16;

    const panelWidth = Math.min(calcRect.width, window.innerWidth - screenPadding * 2);

    let panelLeft = buttonRect.left - panelWidth - gap;

    if (panelLeft < screenPadding) {
      panelLeft = screenPadding;
    }

    let panelTop = buttonRect.top;
    let panelHeight = Math.min(calcRect.height, window.innerHeight - panelTop - screenPadding);

    if (panelHeight < 320) {
      panelTop = screenPadding;
      panelHeight = Math.min(calcRect.height, window.innerHeight - screenPadding * 2);
    }

    document.documentElement.style.setProperty("--pc-help-left", panelLeft + "px");
    document.documentElement.style.setProperty("--pc-help-top", panelTop + "px");
    document.documentElement.style.setProperty("--pc-help-width", panelWidth + "px");
    document.documentElement.style.setProperty("--pc-help-height", panelHeight + "px");
  }

  function createQuestionButton(main) {
    if (!isCalculatorPage(main)) return;

    main.classList.add("pc-calculator-layout");

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

      main.insertBefore(button, instructionBox);
    }

    if (button.dataset.forceQuestionReady !== "true") {
      button.dataset.forceQuestionReady = "true";

      button.addEventListener("click", function (event) {
        if (!isPc()) return;

        event.preventDefault();
        event.stopPropagation();

        const willOpen = !main.classList.contains("pc-help-open");

        main.classList.toggle("pc-help-open", willOpen);
        button.setAttribute("aria-expanded", willOpen ? "true" : "false");

        positionHelpPanel(main);
      });
    }

    positionHelpPanel(main);
  }

  function startQuestionFix() {
    if (!isPc()) return;

    document.querySelectorAll("main").forEach(createQuestionButton);
  }

  window.addEventListener("resize", startQuestionFix);
  window.addEventListener("scroll", function () {
    document.querySelectorAll("main.pc-calculator-layout").forEach(positionHelpPanel);
  });

  setTimeout(startQuestionFix, 100);
  setTimeout(startQuestionFix, 400);
  setTimeout(startQuestionFix, 1000);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startQuestionFix);
  } else {
    startQuestionFix();
  }
})();