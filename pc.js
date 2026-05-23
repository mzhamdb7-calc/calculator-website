/*
  Copyright © 2026 Hamdi. All rights reserved.
  PC MODE ONLY
  Clean old JS arrows.
  Arrow direction is now controlled by CSS only.
*/

(function () {
  "use strict";

  function removeOldArrowSpans() {
    document
      .querySelectorAll("#navbar .nav-menu-arrow, #navbar .phone-sub-arrow")
      .forEach(function (arrow) {
        arrow.remove();
      });
  }

  function start() {
    removeOldArrowSpans();

    window.addEventListener("resize", removeOldArrowSpans);

    document.addEventListener("click", function () {
      setTimeout(removeOldArrowSpans, 0);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

/* =====================================================
   PC ONLY: ? help panel for instructions + references
   Click ? to open. Click again to close.
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function setupQuestionHelp(main) {
    if (!main || !main.classList.contains("pc-calculator-layout")) return;

    const calculator = main.querySelector(":scope > .calculator");
    const instructionBox = main.querySelector(":scope > .instruction-box");

    if (!calculator || !instructionBox) return;

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

    if (button.dataset.questionReady === "true") return;

    button.dataset.questionReady = "true";

    button.addEventListener("click", function () {
      if (!isPc()) return;

      const willOpen = !main.classList.contains("pc-help-open");

      main.classList.toggle("pc-help-open", willOpen);
      button.setAttribute("aria-expanded", willOpen ? "true" : "false");
      button.setAttribute(
        "aria-label",
        willOpen ? "Close instructions and references" : "Open instructions and references"
      );
    });
  }

  function syncQuestionHelp() {
    document.querySelectorAll("main.pc-calculator-layout").forEach(function (main) {
      setupQuestionHelp(main);

      if (!isPc()) {
        main.classList.remove("pc-help-open");
      }
    });
  }

  function start() {
    syncQuestionHelp();

    window.addEventListener("resize", syncQuestionHelp);

    setTimeout(syncQuestionHelp, 150);
    setTimeout(syncQuestionHelp, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   PC ONLY: make ? help overlay match calculator size
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function syncHelpOverlaySize() {
    if (!isPc()) return;

    document.querySelectorAll("main.pc-calculator-layout").forEach(function (main) {
      const calculator = main.querySelector(":scope > .calculator");
      const instructionBox = main.querySelector(":scope > .instruction-box");

      if (!calculator || !instructionBox) return;

      const mainRect = main.getBoundingClientRect();
      const calcRect = calculator.getBoundingClientRect();

      main.style.setProperty("--pc-help-left", (calcRect.left - mainRect.left) + "px");
      main.style.setProperty("--pc-help-top", (calcRect.top - mainRect.top) + "px");
      main.style.setProperty("--pc-help-width", calcRect.width + "px");
      main.style.setProperty("--pc-help-height", calcRect.height + "px");
    });
  }

  function startHelpOverlaySizeSync() {
    syncHelpOverlaySize();

    window.addEventListener("resize", syncHelpOverlaySize);
    window.addEventListener("scroll", syncHelpOverlaySize);

    document.addEventListener("click", function () {
      setTimeout(syncHelpOverlaySize, 0);
      setTimeout(syncHelpOverlaySize, 150);
    });

    setTimeout(syncHelpOverlaySize, 300);
    setTimeout(syncHelpOverlaySize, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startHelpOverlaySizeSync);
  } else {
    startHelpOverlaySizeSync();
  }
})();
/* =====================================================
   PC ONLY: ? panel opens left without disturbing layout
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function syncQuestionPanelLeft() {
    if (!isPc()) return;

    document.querySelectorAll("main.pc-calculator-layout").forEach(function (main) {
      const calculator = main.querySelector(":scope > .calculator");
      const button = main.querySelector(":scope > .pc-question-toggle");
      const instructionBox = main.querySelector(":scope > .instruction-box");

      if (!calculator || !button || !instructionBox) return;

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
    });
  }

  function startQuestionPanelLeft() {
    syncQuestionPanelLeft();

    window.addEventListener("resize", syncQuestionPanelLeft);
    window.addEventListener("scroll", syncQuestionPanelLeft);

    document.addEventListener("click", function () {
      setTimeout(syncQuestionPanelLeft, 0);
      setTimeout(syncQuestionPanelLeft, 150);
    });

    setTimeout(syncQuestionPanelLeft, 300);
    setTimeout(syncQuestionPanelLeft, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startQuestionPanelLeft);
  } else {
    startQuestionPanelLeft();
  }
})();