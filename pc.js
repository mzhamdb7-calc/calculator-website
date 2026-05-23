/*
  Copyright © 2026 Hamdi. All rights reserved.
  PC MODE ONLY
  Clean arrows + question mark help panel
*/

(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function cleanOldNavbarArrows() {
    document
      .querySelectorAll("#navbar .nav-menu-arrow, #navbar .phone-sub-arrow")
      .forEach(function (arrow) {
        arrow.remove();
      });
  }

  function isCalculatorPage(main) {
    return !!(
      main &&
      main.classList.contains("pc-calculator-layout") &&
      main.querySelector(":scope > .calculator") &&
      main.querySelector(":scope > .instruction-box")
    );
  }

  function syncPanelPosition(main) {
    if (!isPc()) return;
    if (!isCalculatorPage(main)) return;

    const calculator = main.querySelector(":scope > .calculator");
    const button = main.querySelector(":scope > .pc-question-toggle");

    if (!calculator || !button) return;

    const mainRect = main.getBoundingClientRect();
    const calcRect = calculator.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    const gap = 14;
    const panelWidth = calcRect.width;
    const panelHeight = calcRect.height;

    const left = buttonRect.left - mainRect.left - panelWidth - gap;
    const top = buttonRect.top - mainRect.top;

    main.style.setProperty("--pc-help-left", left + "px");
    main.style.setProperty("--pc-help-top", top + "px");
    main.style.setProperty("--pc-help-width", panelWidth + "px");
    main.style.setProperty("--pc-help-height", panelHeight + "px");
  }

  function setupQuestionButton(main) {
    if (!isCalculatorPage(main)) return;

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

    if (button.dataset.pcQuestionReady === "true") {
      syncPanelPosition(main);
      return;
    }

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

    syncPanelPosition(main);
  }

  function setupAllQuestionButtons() {
    cleanOldNavbarArrows();

    document.querySelectorAll("main.pc-calculator-layout").forEach(function (main) {
      setupQuestionButton(main);

      if (!isPc()) {
        main.classList.remove("pc-help-open");
      }
    });
  }

  function start() {
    setupAllQuestionButtons();

    window.addEventListener("resize", setupAllQuestionButtons);
    window.addEventListener("scroll", function () {
      document.querySelectorAll("main.pc-calculator-layout").forEach(syncPanelPosition);
    });

    document.addEventListener("click", function () {
      setTimeout(setupAllQuestionButtons, 0);
    });

    setTimeout(setupAllQuestionButtons, 150);
    setTimeout(setupAllQuestionButtons, 500);
    setTimeout(setupAllQuestionButtons, 1000);

    const observer = new MutationObserver(function () {
      setupAllQuestionButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();