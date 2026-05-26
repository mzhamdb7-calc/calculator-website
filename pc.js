/*
  Copyright © 2026 Hamdi. All rights reserved.
  PC MODE ONLY

  Clean PC file:
  - PC navbar/menu only
  - PC calculator layout only
  - ? button stays beside "What does this calculator do?"
  - Instruction/reference panel opens as an overlay to the left of ?
  - Overlay stays below the ? layer and never passes over the ? symbol
*/

(function () {
  "use strict";

  const PC_QUERY = "(min-width: 851px)";
  const BUTTON_ID = "pcHelpQuestionButton";

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

  function getMain() {
    return (
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main.has-instructions") ||
      document.querySelector("main")
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

  function getWhatBox(main) {
    return (
      main.querySelector(":scope > .pc-what-slot") ||
      main.querySelector(":scope > .pc-what-slot .instruction-what-box") ||
      main.querySelector(".instruction-what-box")
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

    return button;
  }

  function closeHelpPanel() {
    document.body.classList.remove("pc-help-overlay-open");

    const button = document.getElementById(BUTTON_ID);
    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open instructions and references");
    }
  }

  function prepareLayout(main) {
    if (!isPc() || !isCalculatorPage(main)) return;

    const instructionBox = main.querySelector(":scope > .instruction-box");
    const leftBox = getLeftBox(main);

    if (!instructionBox || !leftBox) return;

    main.classList.add("pc-calculator-layout");

    let whatBox =
      main.querySelector(":scope > .pc-what-slot .instruction-what-box") ||
      instructionBox.querySelector(":scope > .instruction-what-box");

    if (!whatBox) return;

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

  function positionHelpSystem() {
    const main = getMain();
    const button = getButton();

    if (!isPc() || !isCalculatorPage(main)) {
      closeHelpPanel();
      button.hidden = true;
      return;
    }

    prepareLayout(main);

    const calculator = main.querySelector(":scope > .calculator");
    const instructionBox = main.querySelector(":scope > .instruction-box");
    const whatBox = getWhatBox(main);

    if (!calculator || !instructionBox || !whatBox) {
      button.hidden = true;
      return;
    }

    const whatRect = whatBox.getBoundingClientRect();
    const calcRect = calculator.getBoundingClientRect();

    const screenPadding = 12;
    const buttonSize = 58;
    const buttonGap = 8;
    const panelGap = 6;

    /* ? button fixed beside the What box */
    let buttonLeft = whatRect.right + buttonGap;
    let buttonTop = whatRect.top + (whatRect.height - buttonSize) / 2;

    if (buttonLeft + buttonSize > window.innerWidth - screenPadding) {
      buttonLeft = whatRect.right - buttonSize - 12;
    }

    buttonLeft = Math.max(
      screenPadding,
      Math.min(buttonLeft, window.innerWidth - screenPadding - buttonSize)
    );

    buttonTop = Math.max(
      screenPadding,
      Math.min(buttonTop, window.innerHeight - screenPadding - buttonSize)
    );

    /*
      Overlay opens to the LEFT of ?
      Right edge = buttonLeft - panelGap
      So it never covers or passes beyond the ? symbol.
    */
    const availableLeftWidth = buttonLeft - panelGap - screenPadding;

    let panelWidth = Math.min(calcRect.width, availableLeftWidth);
    let panelHeight = Math.min(calcRect.height, window.innerHeight - screenPadding * 2);

    if (panelWidth < 300) {
      panelWidth = Math.max(260, availableLeftWidth);
    }

    let panelLeft = buttonLeft - panelGap - panelWidth;
    let panelTop = calcRect.top;

    if (panelLeft < screenPadding) {
      panelLeft = screenPadding;
    }

    if (panelTop < screenPadding) {
      panelTop = screenPadding;
    }

    if (panelTop + panelHeight > window.innerHeight - screenPadding) {
      panelTop = window.innerHeight - screenPadding - panelHeight;
    }

    panelTop = Math.max(screenPadding, panelTop);

    document.documentElement.style.setProperty("--pc-help-btn-left", buttonLeft + "px");
    document.documentElement.style.setProperty("--pc-help-btn-top", buttonTop + "px");

    document.documentElement.style.setProperty("--pc-help-panel-left", panelLeft + "px");
    document.documentElement.style.setProperty("--pc-help-panel-top", panelTop + "px");
    document.documentElement.style.setProperty("--pc-help-panel-width", panelWidth + "px");
    document.documentElement.style.setProperty("--pc-help-panel-height", panelHeight + "px");

    button.hidden = false;
  }

  function setupQuestionButton() {
    const button = getButton();

    if (button.dataset.pcHelpReady === "true") return;

    button.dataset.pcHelpReady = "true";

    button.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (!isPc()) return;

        const main = getMain();
        if (!isCalculatorPage(main)) return;

        positionHelpSystem();

        const willOpen = !document.body.classList.contains("pc-help-overlay-open");

        document.body.classList.toggle("pc-help-overlay-open", willOpen);
        button.setAttribute("aria-expanded", willOpen ? "true" : "false");
        button.setAttribute(
          "aria-label",
          willOpen ? "Close instructions and references" : "Open instructions and references"
        );
      },
      true
    );
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

  function setupDropdownClickForScrolledMenu() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    navbar.querySelectorAll(":scope > .dropdown").forEach(function (dropdown) {
      if (dropdown.dataset.pcDropdownReady === "true") return;
      dropdown.dataset.pcDropdownReady = "true";

      const button = dropdown.querySelector(":scope > .dropbtn");
      if (!button) return;

      button.addEventListener("click", function (event) {
        if (!isPc() || !document.body.classList.contains("menu-scrolled")) return;

        event.preventDefault();
        event.stopPropagation();

        navbar.querySelectorAll(":scope > .dropdown").forEach(function (other) {
          if (other !== dropdown) {
            other.classList.remove("menu-open");
          }
        });

        dropdown.classList.toggle("menu-open");
      });
    });
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

    positionHelpSystem();
  }

  function start() {
    setupQuestionButton();
    setupPcMenu();
    setupDropdownClickForScrolledMenu();
    setupAll();

    window.addEventListener("resize", setupAll);
    window.addEventListener("scroll", positionHelpSystem, { passive: true });

    document.addEventListener(
      "click",
      function (event) {
        const button = document.getElementById(BUTTON_ID);
        const main = getMain();
        const panel = main ? main.querySelector(":scope > .instruction-box") : null;

        if (
          document.body.classList.contains("pc-help-overlay-open") &&
          button &&
          panel &&
          !button.contains(event.target) &&
          !panel.contains(event.target)
        ) {
          closeHelpPanel();
        }

        setTimeout(setupAll, 0);
        setTimeout(positionHelpSystem, 100);
      },
      true
    );

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
/* =====================================================
   PC ONLY: FINAL HOVER AUTO-EXPAND MENU FIX
   - Top calculator/info menu opens on hover
   - Scrolled side menu opens on hover
   - Health/finance submenus open on hover
   - One dropdown closes when another opens
===================================================== */
(function () {
  "use strict";

  const PC_QUERY = "(min-width: 851px)";
  const CSS_ID = "pc-hover-auto-expand-fix-css";

  function isPc() {
    return window.matchMedia(PC_QUERY).matches;
  }

  function getNavbar() {
    return document.getElementById("navbar");
  }

  function installHoverCss() {
    const old = document.getElementById(CSS_ID);
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = CSS_ID;

    style.textContent = `
      @media (min-width: 851px) {
        /* Make sure menu can overflow outward */
        #navbar,
        #navbar.open,
        #navbar .dropdown,
        #navbar .dropdown-content,
        #navbar .nav-group,
        #navbar .nav-group-links {
          overflow: visible !important;
        }

        /* Normal top navbar dropdown hover */
        #navbar > .dropdown:hover > .dropdown-content,
        #navbar > .dropdown:focus-within > .dropdown-content,
        #navbar > .dropdown.menu-open > .dropdown-content,
        #navbar > .dropdown.pc-hover-open > .dropdown-content {
          display: block !important;
        }

        /* Health / finance submenu hover */
        #navbar .nav-group:hover > .nav-group-links,
        #navbar .nav-group:focus-within > .nav-group-links,
        #navbar .nav-group[open] > .nav-group-links,
        #navbar .nav-group.pc-sub-hover-open > .nav-group-links {
          display: block !important;
        }

        /* Scrolled side menu dropdown hover */
        body.menu-scrolled #navbar.open > .dropdown:hover > .dropdown-content,
        body.menu-scrolled #navbar.open > .dropdown:focus-within > .dropdown-content,
        body.menu-scrolled #navbar.open > .dropdown.menu-open > .dropdown-content,
        body.menu-scrolled #navbar.open > .dropdown.pc-hover-open > .dropdown-content {
          display: block !important;
        }

        body.menu-scrolled #navbar.open .nav-group:hover > .nav-group-links,
        body.menu-scrolled #navbar.open .nav-group:focus-within > .nav-group-links,
        body.menu-scrolled #navbar.open .nav-group[open] > .nav-group-links,
        body.menu-scrolled #navbar.open .nav-group.pc-sub-hover-open > .nav-group-links {
          display: block !important;
        }

        /* Arrow direction */
        #navbar > .dropdown.pc-hover-open > .dropbtn::after,
        #navbar > .dropdown.menu-open > .dropbtn::after,
        #navbar > .dropdown:hover > .dropbtn::after {
          content: "▲" !important;
        }

        #navbar .nav-group.pc-sub-hover-open > summary::after,
        #navbar .nav-group[open] > summary::after,
        #navbar .nav-group:hover > summary::after {
          content: "▲" !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function closeOtherDropdowns(currentDropdown) {
    const navbar = getNavbar();
    if (!navbar) return;

    navbar.querySelectorAll(":scope > .dropdown").forEach(function (dropdown) {
      if (dropdown !== currentDropdown) {
        dropdown.classList.remove("pc-hover-open", "menu-open");
      }
    });
  }

  function closeOtherSubmenus(currentGroup) {
    const navbar = getNavbar();
    if (!navbar) return;

    navbar.querySelectorAll(".nav-group").forEach(function (group) {
      if (group !== currentGroup) {
        group.classList.remove("pc-sub-hover-open");

        if (group.tagName.toLowerCase() === "details") {
          group.open = false;
        }
      }
    });
  }

  function setupTopDropdownHover(dropdown) {
    if (dropdown.dataset.pcHoverReady === "true") return;
    dropdown.dataset.pcHoverReady = "true";

    dropdown.addEventListener("mouseenter", function () {
      if (!isPc()) return;

      closeOtherDropdowns(dropdown);
      dropdown.classList.add("pc-hover-open", "menu-open");
    });

    dropdown.addEventListener("mouseleave", function () {
      if (!isPc()) return;

      dropdown.classList.remove("pc-hover-open", "menu-open");

      dropdown.querySelectorAll(".nav-group").forEach(function (group) {
        group.classList.remove("pc-sub-hover-open");

        if (group.tagName.toLowerCase() === "details") {
          group.open = false;
        }
      });
    });
  }

  function setupSubmenuHover(group) {
    if (group.dataset.pcSubHoverReady === "true") return;
    group.dataset.pcSubHoverReady = "true";

    group.addEventListener("mouseenter", function () {
      if (!isPc()) return;

      closeOtherSubmenus(group);
      group.classList.add("pc-sub-hover-open");

      if (group.tagName.toLowerCase() === "details") {
        group.open = true;
      }
    });

    group.addEventListener("mouseleave", function () {
      if (!isPc()) return;

      group.classList.remove("pc-sub-hover-open");

      if (group.tagName.toLowerCase() === "details") {
        group.open = false;
      }
    });
  }

  function setupPcHoverMenu() {
    const navbar = getNavbar();
    if (!navbar) return;

    installHoverCss();

    navbar.querySelectorAll(":scope > .dropdown").forEach(setupTopDropdownHover);
    navbar.querySelectorAll(".nav-group").forEach(setupSubmenuHover);
  }

  function start() {
    setupPcHoverMenu();

    window.addEventListener("resize", setupPcHoverMenu);

    setTimeout(setupPcHoverMenu, 100);
    setTimeout(setupPcHoverMenu, 400);
    setTimeout(setupPcHoverMenu, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   PC ONLY: FINAL MENU ARROW + INDEX CARD HOVER FIX
   - Side menu arrows change direction on hover/open
   - Calculator/info menu auto expands on hover
   - Health/finance submenu auto expands on hover
   - Index health/finance cards auto expand on hover
===================================================== */
(function () {
  "use strict";

  const PC_QUERY = "(min-width: 851px)";

  function isPc() {
    return window.matchMedia(PC_QUERY).matches;
  }

  function closeOtherTopDropdowns(current) {
    document.querySelectorAll("#navbar > .dropdown").forEach(function (dropdown) {
      if (dropdown !== current) {
        dropdown.classList.remove("pc-hover-open", "menu-open");

        const button = dropdown.querySelector(":scope > .dropbtn");
        if (button) button.setAttribute("aria-expanded", "false");
      }
    });
  }

  function closeOtherNavGroups(current) {
    document.querySelectorAll("#navbar .nav-group").forEach(function (group) {
      if (group !== current) {
        group.classList.remove("pc-sub-hover-open", "is-open");

        if (group.tagName.toLowerCase() === "details") {
          group.open = false;
        }
      }
    });
  }

  function openTopDropdown(dropdown) {
    if (!isPc()) return;

    closeOtherTopDropdowns(dropdown);

    dropdown.classList.add("pc-hover-open", "menu-open");

    const button = dropdown.querySelector(":scope > .dropbtn");
    if (button) button.setAttribute("aria-expanded", "true");
  }

  function closeTopDropdown(dropdown) {
    if (!isPc()) return;

    dropdown.classList.remove("pc-hover-open", "menu-open");

    const button = dropdown.querySelector(":scope > .dropbtn");
    if (button) button.setAttribute("aria-expanded", "false");

    dropdown.querySelectorAll(".nav-group").forEach(function (group) {
      group.classList.remove("pc-sub-hover-open", "is-open");

      if (group.tagName.toLowerCase() === "details") {
        group.open = false;
      }
    });
  }

  function openNavGroup(group) {
    if (!isPc()) return;

    closeOtherNavGroups(group);

    group.classList.add("pc-sub-hover-open", "is-open");

    if (group.tagName.toLowerCase() === "details") {
      group.open = true;
    }
  }

  function closeNavGroup(group) {
    if (!isPc()) return;

    group.classList.remove("pc-sub-hover-open", "is-open");

    if (group.tagName.toLowerCase() === "details") {
      group.open = false;
    }
  }

  function setupNavbarHover() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    navbar.querySelectorAll(":scope > .dropdown").forEach(function (dropdown) {
      if (dropdown.dataset.pcFinalHoverReady === "true") return;
      dropdown.dataset.pcFinalHoverReady = "true";

      dropdown.addEventListener("mouseenter", function () {
        openTopDropdown(dropdown);
      });

      dropdown.addEventListener("mouseleave", function () {
        closeTopDropdown(dropdown);
      });

      dropdown.addEventListener("focusin", function () {
        openTopDropdown(dropdown);
      });

      dropdown.addEventListener("focusout", function () {
        setTimeout(function () {
          if (!dropdown.contains(document.activeElement)) {
            closeTopDropdown(dropdown);
          }
        }, 80);
      });
    });

    navbar.querySelectorAll(".nav-group").forEach(function (group) {
      if (group.dataset.pcFinalSubHoverReady === "true") return;
      group.dataset.pcFinalSubHoverReady = "true";

      group.addEventListener("mouseenter", function () {
        openNavGroup(group);
      });

      group.addEventListener("mouseleave", function () {
        closeNavGroup(group);
      });

      group.addEventListener("focusin", function () {
        openNavGroup(group);
      });

      group.addEventListener("focusout", function () {
        setTimeout(function () {
          if (!group.contains(document.activeElement)) {
            closeNavGroup(group);
          }
        }, 80);
      });
    });
  }

  function setupIndexCardHover() {
    document.querySelectorAll(".calculator-box .group-card").forEach(function (card) {
      if (card.dataset.pcCardHoverReady === "true") return;
      card.dataset.pcCardHoverReady = "true";

      card.addEventListener("mouseenter", function () {
        if (!isPc()) return;

        document.querySelectorAll(".calculator-box .group-card").forEach(function (other) {
          if (other !== card && other.tagName.toLowerCase() === "details") {
            other.open = false;
          }
        });

        if (card.tagName.toLowerCase() === "details") {
          card.open = true;
        }

        card.classList.add("pc-card-open");
      });

      card.addEventListener("mouseleave", function () {
        if (!isPc()) return;

        if (card.tagName.toLowerCase() === "details") {
          card.open = false;
        }

        card.classList.remove("pc-card-open");
      });

      card.addEventListener("focusin", function () {
        if (!isPc()) return;

        if (card.tagName.toLowerCase() === "details") {
          card.open = true;
        }

        card.classList.add("pc-card-open");
      });

      card.addEventListener("focusout", function () {
        if (!isPc()) return;

        setTimeout(function () {
          if (!card.contains(document.activeElement)) {
            if (card.tagName.toLowerCase() === "details") {
              card.open = false;
            }

            card.classList.remove("pc-card-open");
          }
        }, 80);
      });
    });
  }

  function start() {
    setupNavbarHover();
    setupIndexCardHover();

    window.addEventListener("resize", function () {
      setupNavbarHover();
      setupIndexCardHover();
    });

    setTimeout(setupNavbarHover, 200);
    setTimeout(setupIndexCardHover, 200);
    setTimeout(setupNavbarHover, 800);
    setTimeout(setupIndexCardHover, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   PC ONLY: CONSISTENT HELP OVERLAY SIZE FOR ALL PAGES
   - Age follows same size as loan page
   - Instruction/reference overlay same size as calculator box
   - ? stays beside What box
   - Works for all calculator pages
===================================================== */
(function () {
  "use strict";

  const PC_QUERY = "(min-width: 851px)";

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

  function getMain() {
    return (
      document.querySelector("main.pc-calculator-layout") ||
      document.querySelector("main.has-instructions") ||
      document.querySelector("main")
    );
  }

  function getHelpButton() {
    return (
      document.getElementById("pcHelpQuestionButton") ||
      document.getElementById("pcQuestionOverlayButton")
    );
  }

  function isCalculatorPage(main) {
    if (!main || isExcludedPage()) return false;

    return !!(
      main.querySelector(":scope > .calculator") &&
      main.querySelector(":scope > .instruction-box")
    );
  }

  function getWhatBox(main) {
    return (
      main.querySelector(":scope > .pc-what-slot") ||
      main.querySelector(":scope > .pc-what-slot .instruction-what-box") ||
      main.querySelector(".instruction-what-box")
    );
  }

  function markPageType() {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim().toLowerCase() : "";

    if (title.includes("basic")) {
      document.body.classList.add("basic-page");
      document.body.dataset.page = "basic";
    }

    if (title.includes("age")) {
      document.body.classList.add("age-page");
      document.body.dataset.page = "age";
    }

    if (title.includes("bmi")) {
      document.body.classList.add("bmi-page");
      document.body.dataset.page = "bmi";
    }

    if (title.includes("loan")) {
      document.body.classList.add("loan-page");
      document.body.dataset.page = "loan";
    }

    if (title.includes("discount")) {
      document.body.classList.add("discount-page");
      document.body.dataset.page = "discount";
    }

    if (title.includes("percentage")) {
      document.body.classList.add("percentage-page");
      document.body.dataset.page = "percentage";
    }

    if (title.includes("compound")) {
      document.body.classList.add("compound-page");
      document.body.dataset.page = "compound";
    }
  }

  function positionConsistentHelpOverlay() {
    if (!isPc()) return;

    const main = getMain();
    const button = getHelpButton();

    if (!main || !button || !isCalculatorPage(main)) return;

    const calculator = main.querySelector(":scope > .calculator");
    const instructionBox = main.querySelector(":scope > .instruction-box");
    const whatBox = getWhatBox(main);

    if (!calculator || !instructionBox || !whatBox) return;

    const calcRect = calculator.getBoundingClientRect();
    const whatRect = whatBox.getBoundingClientRect();

    const screenPadding = 12;
    const buttonSize = 58;
    const buttonGap = 8;

    /* ? beside What box */
    let buttonLeft = whatRect.right + buttonGap;
    let buttonTop = whatRect.top + Math.max(0, (whatRect.height - buttonSize) / 2);

    if (buttonLeft + buttonSize > window.innerWidth - screenPadding) {
      buttonLeft = whatRect.right - buttonSize - 12;
    }

    buttonLeft = Math.max(
      screenPadding,
      Math.min(buttonLeft, window.innerWidth - screenPadding - buttonSize)
    );

    buttonTop = Math.max(
      screenPadding,
      Math.min(buttonTop, window.innerHeight - screenPadding - buttonSize)
    );

    /*
      Same size as calculator box.
      This makes Age, Loan, BMI, Discount, Percentage, Compound consistent.
    */
    let panelLeft = calcRect.left;
    let panelTop = calcRect.top;
    let panelWidth = calcRect.width;
    let panelHeight = calcRect.height;

    panelWidth = Math.min(panelWidth, window.innerWidth - screenPadding * 2);
    panelHeight = Math.min(panelHeight, window.innerHeight - screenPadding * 2);

    if (panelLeft + panelWidth > window.innerWidth - screenPadding) {
      panelLeft = window.innerWidth - screenPadding - panelWidth;
    }

    if (panelTop + panelHeight > window.innerHeight - screenPadding) {
      panelTop = window.innerHeight - screenPadding - panelHeight;
    }

    panelLeft = Math.max(screenPadding, panelLeft);
    panelTop = Math.max(screenPadding, panelTop);

    /* New clean variables */
    document.documentElement.style.setProperty("--pc-help-btn-left", buttonLeft + "px");
    document.documentElement.style.setProperty("--pc-help-btn-top", buttonTop + "px");
    document.documentElement.style.setProperty("--pc-help-panel-left", panelLeft + "px");
    document.documentElement.style.setProperty("--pc-help-panel-top", panelTop + "px");
    document.documentElement.style.setProperty("--pc-help-panel-width", panelWidth + "px");
    document.documentElement.style.setProperty("--pc-help-panel-height", panelHeight + "px");

    /* Old compatible variables */
    document.documentElement.style.setProperty("--calc-help-btn-left", buttonLeft + "px");
    document.documentElement.style.setProperty("--calc-help-btn-top", buttonTop + "px");
    document.documentElement.style.setProperty("--calc-help-left", panelLeft + "px");
    document.documentElement.style.setProperty("--calc-help-top", panelTop + "px");
    document.documentElement.style.setProperty("--calc-help-width", panelWidth + "px");
    document.documentElement.style.setProperty("--calc-help-height", panelHeight + "px");
  }

  function startConsistentPcHelpSize() {
    markPageType();
    positionConsistentHelpOverlay();

    window.addEventListener("resize", positionConsistentHelpOverlay);
    window.addEventListener("scroll", positionConsistentHelpOverlay, { passive: true });

    document.addEventListener("click", function () {
      setTimeout(positionConsistentHelpOverlay, 0);
      setTimeout(positionConsistentHelpOverlay, 120);
    });

    setTimeout(positionConsistentHelpOverlay, 300);
    setTimeout(positionConsistentHelpOverlay, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startConsistentPcHelpSize);
  } else {
    startConsistentPcHelpSize();
  }
})();
