/*
  Copyright © 2026 Hamdi. All rights reserved.
  PC MODE ONLY

  Clean PC file:
  - PC navbar/menu only
  - PC calculator layout only
  - ? button beside "What does this calculator do?"
  - Instruction/reference panel overlays calculator box
*/

(function () {
  "use strict";

  const PC_QUERY = "(min-width: 851px)";
  const CSS_ID = "clean-pc-css";
  const BUTTON_ID = "pcQuestionOverlayButton";

  function isPc() {
    return window.matchMedia(PC_QUERY).matches;
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

  function installPcCss() {
    const old = document.getElementById(CSS_ID);
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = CSS_ID;

    style.textContent = `
      @media (min-width: 851px) {
        #navbar .nav-menu-arrow,
        #navbar .phone-sub-arrow {
          display: none !important;
        }

        #navbar summary {
          list-style: none !important;
        }

        #navbar summary::-webkit-details-marker {
          display: none !important;
        }

        #navbar summary::marker {
          content: "" !important;
        }

        #navbar > .dropdown > .dropbtn::after {
          content: "▼" !important;
          display: inline-block !important;
          margin-left: 8px !important;
          color: var(--black) !important;
          font-size: 14px !important;
          font-weight: bold !important;
          line-height: 1 !important;
        }

        #navbar > .dropdown:hover > .dropbtn::after,
        #navbar > .dropdown:focus-within > .dropbtn::after,
        #navbar > .dropdown.menu-open > .dropbtn::after {
          content: "▲" !important;
        }

        #navbar .dropdown-content > details.nav-group > summary::after,
        #navbar .dropdown-content > .nav-group > summary::after {
          content: "▼" !important;
          display: inline-block !important;
          margin-left: 8px !important;
          color: var(--black) !important;
          font-size: 14px !important;
          font-weight: bold !important;
          line-height: 1 !important;
        }

        #navbar .dropdown-content > details.nav-group:hover > summary::after,
        #navbar .dropdown-content > details.nav-group:focus-within > summary::after,
        #navbar .dropdown-content > details.nav-group[open] > summary::after,
        #navbar .dropdown-content > .nav-group:hover > summary::after,
        #navbar .dropdown-content > .nav-group:focus-within > summary::after,
        #navbar .dropdown-content > .nav-group[open] > summary::after {
          content: "▲" !important;
        }

        main.pc-calculator-layout {
          width: 100% !important;
          max-width: min(1200px, calc(100vw - 32px)) !important;
          margin: 130px auto 80px !important;
          padding: 16px !important;
          display: grid !important;
          grid-template-columns: minmax(280px, 360px) minmax(560px, 780px) !important;
          grid-template-rows: auto auto auto !important;
          column-gap: 28px !important;
          row-gap: 18px !important;
          justify-content: center !important;
          align-items: start !important;
          overflow: visible !important;
          box-sizing: border-box !important;
        }

        main.pc-calculator-layout > * {
          min-width: 0 !important;
          box-sizing: border-box !important;
        }

        main.pc-calculator-layout > .pc-what-slot {
          grid-column: 1 / 3 !important;
          grid-row: 1 !important;
          width: calc(100% - 76px) !important;
          max-width: calc(100% - 76px) !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        main.pc-calculator-layout > .pc-what-slot .instruction-what-box {
          width: 100% !important;
          min-height: 86px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          text-align: center !important;
          padding: 14px 18px !important;
          background: #ffd3d3 !important;
          color: var(--black) !important;
          border: 5px solid var(--black) !important;
          box-shadow: 8px 8px 0 var(--black) !important;
          box-sizing: border-box !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
        }

        main.pc-calculator-layout > .history,
        main.pc-calculator-layout > .age-history-box,
        main.pc-calculator-layout > .bmi-history-box,
        main.pc-calculator-layout > .discount-history-box,
        main.pc-calculator-layout > .loan-history-box,
        main.pc-calculator-layout > .percentage-history-box,
        main.pc-calculator-layout > .compound-history-box {
          grid-column: 1 !important;
          grid-row: 2 !important;
          width: 100% !important;
          max-width: 100% !important;
          min-height: 360px !important;
          max-height: calc(100vh - 300px) !important;
          margin: 0 !important;
          background: var(--soft-yellow) !important;
          border: 5px solid var(--black) !important;
          box-shadow: 8px 8px 0 var(--black) !important;
          transform: none !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }

        main.pc-calculator-layout > .calculator {
          grid-column: 2 !important;
          grid-row: 2 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          border: 5px solid var(--black) !important;
          box-shadow: 9px 9px 0 var(--black) !important;
          justify-self: stretch !important;
          align-self: start !important;
          text-align: center !important;
        }

        main.pc-calculator-layout > .calculator *,
        main.pc-calculator-layout > .calculator input,
        main.pc-calculator-layout > .calculator select,
        main.pc-calculator-layout > .calculator textarea {
          text-align: center !important;
        }

        main.pc-calculator-layout > .instruction-box {
          display: none !important;
        }

        main.pc-calculator-layout > .pc-question-toggle {
          display: none !important;
        }

        #pcQuestionOverlayButton {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          position: fixed !important;
          left: var(--calc-help-btn-left, calc(100vw - 80px)) !important;
          top: var(--calc-help-btn-top, 130px) !important;
          width: 58px !important;
          height: 58px !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ff9fcb !important;
          color: var(--black) !important;
          border: 4px solid var(--black) !important;
          box-shadow: 6px 6px 0 var(--black) !important;
          font-family: inherit !important;
          font-size: 30px !important;
          font-weight: bold !important;
          line-height: 1 !important;
          cursor: pointer !important;
          z-index: 2147483647 !important;
          box-sizing: border-box !important;
        }

        #pcQuestionOverlayButton:hover,
        body.pc-calculator-help-open #pcQuestionOverlayButton {
          background: var(--yellow) !important;
        }

        #pcQuestionOverlayButton[hidden] {
          display: none !important;
        }

        body.pc-calculator-help-open main.pc-calculator-layout > .instruction-box {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          position: fixed !important;
          left: var(--calc-help-left, 10px) !important;
          top: var(--calc-help-top, 130px) !important;
          width: var(--calc-help-width, 700px) !important;
          height: var(--calc-help-height, 620px) !important;
          max-width: calc(100vw - 20px) !important;
          max-height: calc(100vh - 20px) !important;
          margin: 0 !important;
          padding: 20px !important;
          background: var(--white) !important;
          border: 5px solid var(--black) !important;
          box-shadow: 9px 9px 0 var(--black) !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          transform: none !important;
          z-index: 2147483646 !important;
          box-sizing: border-box !important;
        }

        body.pc-calculator-help-open main.pc-calculator-layout > .instruction-box,
        body.pc-calculator-help-open main.pc-calculator-layout > .instruction-box * {
          max-width: 100% !important;
          box-sizing: border-box !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
        }

        body.pc-calculator-help-open main.pc-calculator-layout > .instruction-box > .instruction-what-box {
          display: none !important;
        }

        body.pc-calculator-help-open main.pc-calculator-layout .instruction-main-title,
        body.pc-calculator-help-open main.pc-calculator-layout .reference-main-title,
        body.pc-calculator-help-open main.pc-calculator-layout .reference-box > h2 {
          text-align: center !important;
        }

        body.pc-calculator-help-open main.pc-calculator-layout .instruction-section:not(.instruction-what-box),
        body.pc-calculator-help-open main.pc-calculator-layout .reference-card {
          margin: 0 0 16px !important;
          padding: 14px 12px !important;
          color: var(--black) !important;
          border: 4px solid var(--black) !important;
          box-shadow: 5px 5px 0 var(--black) !important;
          text-align: center !important;
        }

        body.pc-calculator-help-open main.pc-calculator-layout .instruction-how-box {
          background: #d3fff9 !important;
        }

        body.pc-calculator-help-open main.pc-calculator-layout .instruction-formula-box {
          background: #fff4b8 !important;
        }

        body.pc-calculator-help-open main.pc-calculator-layout .instruction-example-box {
          background: #d3ffd9 !important;
        }

        body.pc-calculator-help-open main.pc-calculator-layout .reference-box {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          overflow: visible !important;
        }

        body.pc-calculator-help-open main.pc-calculator-layout .reference-scroll {
          padding: 0 !important;
          overflow: visible !important;
        }

        main.pc-calculator-layout > #universalLoanStyleOutput,
        main.pc-calculator-layout > #loanExternalOutput {
          grid-column: 1 / 3 !important;
          grid-row: 3 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 18px !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }

        main.pc-calculator-layout > #universalLoanStyleOutput[hidden],
        main.pc-calculator-layout > #loanExternalOutput[hidden] {
          display: none !important;
        }

        #universalLoanStyleOutput .loan-output-top,
        #loanExternalOutput .loan-output-top,
        #loanExternalOutput .loan-graph-row {
          width: 100% !important;
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) auto !important;
          gap: 16px !important;
          align-items: start !important;
          box-sizing: border-box !important;
        }

        #universalLoanStyleOutput .loan-result-panel,
        #loanExternalOutput .loan-result-panel,
        #loanExternalOutput .loan-graph-panel {
          width: 100% !important;
          max-width: 100% !important;
          padding: 18px !important;
          background: #d3fff9 !important;
          color: var(--black) !important;
          border: 5px solid var(--black) !important;
          box-shadow: 8px 8px 0 var(--black) !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }

        #loanExternalOutput .loan-graph-panel {
          background: var(--white) !important;
        }

        #universalLoanStyleOutput .loan-panel-title,
        #loanExternalOutput .loan-panel-title {
          margin: 0 0 14px !important;
          color: var(--black) !important;
          font-size: 30px !important;
          font-weight: bold !important;
          line-height: 1.2 !important;
          text-align: center !important;
        }

        #universalLoanStyleOutput .loan-result-body,
        #loanExternalOutput .loan-result-body,
        #loanExternalOutput .loan-graph-body {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: auto !important;
          overflow-y: auto !important;
          box-sizing: border-box !important;
        }

        #universalLoanStyleOutput .loan-result-table-scroll,
        #loanExternalOutput .loan-result-table-scroll {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: auto !important;
          overflow-y: auto !important;
          background: var(--white) !important;
          border: 4px solid var(--black) !important;
          box-sizing: border-box !important;
        }

        #universalLoanStyleOutput .loan-result-table,
        #loanExternalOutput .loan-result-table {
          width: 100% !important;
          min-width: 700px !important;
          border-collapse: collapse !important;
          background: var(--white) !important;
          color: var(--black) !important;
          font-size: 17px !important;
          font-weight: bold !important;
          text-align: center !important;
        }

        #universalLoanStyleOutput .loan-result-table th,
        #universalLoanStyleOutput .loan-result-table td,
        #loanExternalOutput .loan-result-table th,
        #loanExternalOutput .loan-result-table td {
          padding: 12px 14px !important;
          border: 3px solid var(--black) !important;
          text-align: center !important;
          white-space: pre-line !important;
          vertical-align: middle !important;
        }

        #universalLoanStyleOutput .loan-result-table th,
        #loanExternalOutput .loan-result-table th {
          background: var(--soft-yellow) !important;
        }

        #universalLoanStyleOutput .loan-result-table td,
        #loanExternalOutput .loan-result-table td {
          background: var(--white) !important;
        }

        #universalLoanStyleOutput .loan-result-table td:first-child {
          background: #d3fff9 !important;
        }

        #universalLoanStyleOutput .loan-copy-side,
        #loanExternalOutput .loan-copy-side,
        #loanExternalOutput .loan-graph-copy-side {
          display: flex !important;
          align-items: flex-start !important;
          justify-content: center !important;
        }

        #universalLoanStyleOutput .loan-copy-btn,
        #loanExternalOutput .loan-copy-btn,
        #loanExternalOutput .loan-graph-copy-btn {
          min-width: 90px !important;
          padding: 10px 14px !important;
          background: #ffb3c7 !important;
          color: var(--black) !important;
          border: 4px solid var(--black) !important;
          box-shadow: 4px 4px 0 var(--black) !important;
          font-family: inherit !important;
          font-size: 16px !important;
          font-weight: bold !important;
          cursor: pointer !important;
        }

        #universalLoanStyleOutput .loan-copy-btn:hover,
        #loanExternalOutput .loan-copy-btn:hover,
        #loanExternalOutput .loan-graph-copy-btn:hover {
          background: var(--yellow) !important;
          transform: translate(-2px, -2px) !important;
          box-shadow: 6px 6px 0 var(--black) !important;
        }

        #loanExternalOutput .loan-graph {
          width: 100% !important;
          max-width: 520px !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
          background: var(--white) !important;
        }

        #loanExternalOutput .loan-graph-grid {
          stroke: #ccc !important;
          stroke-width: 2 !important;
        }

        #loanExternalOutput .loan-graph-axis {
          stroke: #555 !important;
          stroke-width: 4 !important;
        }

        #loanExternalOutput .loan-graph-line {
          fill: none !important;
          stroke: #4db6c1 !important;
          stroke-width: 5 !important;
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
        }

        #loanExternalOutput .loan-graph circle {
          fill: #d3fff9 !important;
          stroke: #4db6c1 !important;
          stroke-width: 4 !important;
        }

        #loanExternalOutput .loan-graph text {
          fill: var(--black) !important;
          font-family: "Comic Neue", "Comic Sans MS", cursive, sans-serif !important;
          font-size: 11px !important;
          font-weight: bold !important;
        }

        .calculator #result,
        .calculator #ageResult,
        .calculator #bmiResult,
        .calculator #loanResult,
        .calculator #discountResult,
        .calculator #percentageResult,
        .calculator #compoundResult,
        .calculator .result-copy-btn,
        .calculator .copy-result-btn {
          display: none !important;
        }

        #menuIcon {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
          position: fixed !important;
          top: 24px !important;
          right: 24px !important;
          width: 78px !important;
          height: 50px !important;
          align-items: center !important;
          justify-content: center !important;
          background: var(--white) !important;
          color: var(--black) !important;
          border: 4px solid var(--black) !important;
          box-shadow: 5px 5px 0 var(--black) !important;
          font-size: 18px !important;
          font-weight: bold !important;
          cursor: pointer !important;
          z-index: 999999999 !important;
        }

        body.menu-scrolled #menuIcon,
        #menuIcon.show {
          display: flex !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }

        body.menu-scrolled #navbar:not(.open) {
          display: none !important;
        }

        body.menu-scrolled #navbar.open {
          display: flex !important;
          position: fixed !important;
          top: 24px !important;
          right: 116px !important;
          left: auto !important;
          bottom: auto !important;
          width: 190px !important;
          height: auto !important;
          flex-direction: column !important;
          align-items: stretch !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          transform: none !important;
          overflow: visible !important;
          z-index: 999999998 !important;
        }

        body.menu-scrolled #navbar.open > a,
        body.menu-scrolled #navbar.open > .dropdown {
          width: 190px !important;
          height: 55px !important;
          flex: none !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
          overflow: visible !important;
        }

        body.menu-scrolled #navbar.open > a,
        body.menu-scrolled #navbar.open > .dropdown > .dropbtn {
          width: 190px !important;
          height: 55px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: var(--white) !important;
          color: var(--black) !important;
          border: 4px solid var(--black) !important;
          box-shadow: 5px 5px 0 var(--black) !important;
          font-size: 18px !important;
          font-weight: bold !important;
          text-decoration: none !important;
          cursor: pointer !important;
        }
      }

      @media (min-width: 851px) and (max-width: 1180px) {
        main.pc-calculator-layout {
          grid-template-columns: 1fr !important;
          max-width: calc(100vw - 24px) !important;
        }

        main.pc-calculator-layout > .pc-what-slot,
        main.pc-calculator-layout > .history,
        main.pc-calculator-layout > .age-history-box,
        main.pc-calculator-layout > .bmi-history-box,
        main.pc-calculator-layout > .discount-history-box,
        main.pc-calculator-layout > .loan-history-box,
        main.pc-calculator-layout > .percentage-history-box,
        main.pc-calculator-layout > .compound-history-box,
        main.pc-calculator-layout > .calculator,
        main.pc-calculator-layout > #universalLoanStyleOutput,
        main.pc-calculator-layout > #loanExternalOutput {
          grid-column: 1 !important;
        }

        main.pc-calculator-layout > .pc-what-slot {
          grid-row: 1 !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        main.pc-calculator-layout > .calculator {
          grid-row: 2 !important;
        }

        main.pc-calculator-layout > .history,
        main.pc-calculator-layout > .age-history-box,
        main.pc-calculator-layout > .bmi-history-box,
        main.pc-calculator-layout > .discount-history-box,
        main.pc-calculator-layout > .loan-history-box,
        main.pc-calculator-layout > .percentage-history-box,
        main.pc-calculator-layout > .compound-history-box {
          grid-row: 3 !important;
        }

        main.pc-calculator-layout > #universalLoanStyleOutput,
        main.pc-calculator-layout > #loanExternalOutput {
          grid-row: 4 !important;
        }

        #universalLoanStyleOutput .loan-output-top,
        #loanExternalOutput .loan-output-top,
        #loanExternalOutput .loan-graph-row {
          grid-template-columns: 1fr !important;
        }

        #universalLoanStyleOutput .loan-copy-side,
        #loanExternalOutput .loan-copy-side,
        #loanExternalOutput .loan-graph-copy-side {
          justify-content: flex-start !important;
        }
      }

      @media (max-width: 850px) {
        #pcQuestionOverlayButton {
          display: none !important;
        }
      }
    `;

    document.head.appendChild(style);
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

  function prepareLayout(main) {
    if (!isPc() || !isCalculatorPage(main)) return;

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
      if (box !== whatBox) box.remove();
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

  function positionHelpOverlay() {
    if (!isPc()) return;

    const main = document.querySelector("main.pc-calculator-layout");
    const button = getButton();

    if (!main || !isCalculatorPage(main)) {
      button.hidden = true;
      document.body.classList.remove("pc-calculator-help-open");
      return;
    }

    const calculator = main.querySelector(":scope > .calculator");
    const whatSlot = main.querySelector(":scope > .pc-what-slot");
    const instructionBox = main.querySelector(":scope > .instruction-box");

    if (!calculator || !whatSlot || !instructionBox) return;

    const calcRect = calculator.getBoundingClientRect();
    const whatRect = whatSlot.getBoundingClientRect();

    const screenPadding = 10;
    const buttonSize = 58;
    const gap = 8;

    let buttonLeft = whatRect.right + gap;
    let buttonTop = whatRect.top + Math.max(0, (whatRect.height - buttonSize) / 2);

    if (buttonLeft + buttonSize > window.innerWidth - screenPadding) {
      buttonLeft = whatRect.right - buttonSize - 12;
    }

    buttonLeft = Math.max(screenPadding, Math.min(buttonLeft, window.innerWidth - screenPadding - buttonSize));
    buttonTop = Math.max(screenPadding, Math.min(buttonTop, window.innerHeight - screenPadding - buttonSize));

    let overlayLeft = calcRect.left;
    let overlayTop = calcRect.top;
    let overlayWidth = Math.min(calcRect.width, window.innerWidth - screenPadding * 2);
    let overlayHeight = Math.min(calcRect.height, window.innerHeight - screenPadding * 2);

    if (overlayLeft + overlayWidth > window.innerWidth - screenPadding) {
      overlayLeft = window.innerWidth - screenPadding - overlayWidth;
    }

    if (overlayTop + overlayHeight > window.innerHeight - screenPadding) {
      overlayTop = window.innerHeight - screenPadding - overlayHeight;
    }

    overlayLeft = Math.max(screenPadding, overlayLeft);
    overlayTop = Math.max(screenPadding, overlayTop);

    document.documentElement.style.setProperty("--calc-help-btn-left", buttonLeft + "px");
    document.documentElement.style.setProperty("--calc-help-btn-top", buttonTop + "px");
    document.documentElement.style.setProperty("--calc-help-left", overlayLeft + "px");
    document.documentElement.style.setProperty("--calc-help-top", overlayTop + "px");
    document.documentElement.style.setProperty("--calc-help-width", overlayWidth + "px");
    document.documentElement.style.setProperty("--calc-help-height", overlayHeight + "px");

    button.hidden = false;
  }

  function setupQuestionButton() {
    const button = getButton();

    if (button.dataset.cleanPcReady === "true") return;
    button.dataset.cleanPcReady = "true";

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (!isPc()) return;

      const main = document.querySelector("main.pc-calculator-layout");
      if (!main || !isCalculatorPage(main)) return;

      positionHelpOverlay();

      const willOpen = !document.body.classList.contains("pc-calculator-help-open");
      document.body.classList.toggle("pc-calculator-help-open", willOpen);
      button.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    document.addEventListener("click", function (event) {
      const main = document.querySelector("main.pc-calculator-layout");
      const panel = main ? main.querySelector(":scope > .instruction-box") : null;

      if (
        document.body.classList.contains("pc-calculator-help-open") &&
        panel &&
        !button.contains(event.target) &&
        !panel.contains(event.target)
      ) {
        document.body.classList.remove("pc-calculator-help-open");
        button.setAttribute("aria-expanded", "false");
      }
    });
  }

  function setupPcMenu() {
    const navbar = document.getElementById("navbar");
    const menuIcon = document.getElementById("menuIcon");

    if (!navbar || !menuIcon) return;

    let closeTimer;

    function isPastTopMenu() {
      return window.scrollY > 90;
    }

    function updateMenu() {
      if (!isPc()) return;

      if (isPastTopMenu()) {
        document.body.classList.add("menu-scrolled");
        navbar.classList.add("scrolled");
        menuIcon.classList.add("show");
      } else {
        document.body.classList.remove("menu-scrolled");
        navbar.classList.remove("scrolled", "open");
        menuIcon.classList.remove("show");
      }
    }

    function openMenu() {
      if (!isPc() || !isPastTopMenu()) return;

      clearTimeout(closeTimer);
      document.body.classList.add("menu-scrolled");
      navbar.classList.add("scrolled", "open");
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

    window.toggleMenu = function () {
      if (!isPastTopMenu()) return;
      navbar.classList.toggle("open");
    };

    window.addEventListener("scroll", updateMenu, { passive: true });
    updateMenu();
  }

  function setupAll() {
    if (!isPc()) return;

    document
      .querySelectorAll("#navbar .nav-menu-arrow, #navbar .phone-sub-arrow")
      .forEach(function (arrow) {
        arrow.remove();
      });

    document.querySelectorAll("main").forEach(function (main) {
      if (isCalculatorPage(main)) {
        prepareLayout(main);
      } else {
        main.classList.remove("pc-calculator-layout");
      }
    });

    positionHelpOverlay();
  }

  function start() {
    installPcCss();
    setupQuestionButton();
    setupPcMenu();
    setupAll();

    window.addEventListener("resize", setupAll);
    window.addEventListener("scroll", positionHelpOverlay, { passive: true });

    document.addEventListener("click", function () {
      setTimeout(setupAll, 0);
      setTimeout(positionHelpOverlay, 100);
    });

    setTimeout(setupAll, 100);
    setTimeout(setupAll, 400);
    setTimeout(setupAll, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
