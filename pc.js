/* =====================================================
   PC ONLY: make ? help panel closer to ? symbol
===================================================== */
(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function makeQuestionPanelCloser() {
    if (!isPc()) return;

    document.querySelectorAll("main.pc-calculator-layout").forEach(function (main) {
      const button = main.querySelector(":scope > .pc-question-toggle");
      const calculator = main.querySelector(":scope > .calculator");
      const instructionBox = main.querySelector(":scope > .instruction-box");

      if (!button || !calculator || !instructionBox) return;

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
    });
  }

  window.addEventListener("resize", makeQuestionPanelCloser);
  window.addEventListener("scroll", makeQuestionPanelCloser);

  document.addEventListener("click", function () {
    setTimeout(makeQuestionPanelCloser, 0);
    setTimeout(makeQuestionPanelCloser, 100);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", makeQuestionPanelCloser);
  } else {
    makeQuestionPanelCloser();
  }
})();