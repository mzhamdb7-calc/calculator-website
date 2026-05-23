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