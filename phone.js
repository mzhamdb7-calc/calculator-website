/*
  Copyright © 2026 Hamdi. All rights reserved.
  PHONE MENU HARD OVERRIDE
  - calculator opens upward
  - info opens upward
  - opening info closes calculator
  - opening calculator closes info
  - health / finance items open upward
*/

(function () {
  "use strict";

  function isPhone() {
    return window.matchMedia("(max-width: 850px)").matches;
  }

  function installPhoneMenuCSS() {
    const oldStyle = document.getElementById("phone-menu-hard-override-css");
    if (oldStyle) oldStyle.remove();

    const style = document.createElement("style");
    style.id = "phone-menu-hard-override-css";

    style.textContent = `
      @media (max-width: 850px) {
        html body {
          padding-bottom: 95px !important;
        }

        html body #menuIcon,
        html body #menuIcon.show,
        html body.menu-scrolled #menuIcon,
        html body.menu-scrolled #menuIcon.show {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        html body #scrollTopBtn,
        html body .scroll-top {
          display: flex !important;
          position: fixed !important;
          right: 12px !important;
          left: auto !important;
          bottom: calc(18px + env(safe-area-inset-bottom)) !important;
          width: 54px !important;
          height: 54px !important;
          align-items: center !important;
          justify-content: center !important;
          background: var(--white) !important;
          color: var(--black) !important;
          border: 4px solid var(--black) !important;
          box-shadow: 5px 5px 0 var(--black) !important;
          font-size: 32px !important;
          font-weight: bold !important;
          opacity: 1 !important;
          z-index: 999999999 !important;
        }

        html body #navbar,
        html body #navbar.scrolled,
        html body #navbar.open,
        html body.menu-scrolled #navbar,
        html body.menu-scrolled #navbar.scrolled,
        html body.menu-scrolled #navbar.open {
          display: flex !important;
          position: fixed !important;
          top: auto !important;
          bottom: calc(18px + env(safe-area-inset-bottom)) !important;
          left: 8px !important;
          right: 76px !important;
          width: auto !important;
          max-width: none !important;
          height: 54px !important;
          flex-direction: row !important;
          align-items: stretch !important;
          background: var(--white) !important;
          border: 3px solid var(--black) !important;
          box-shadow: none !important;
          transform: none !important;
          overflow: visible !important;
          box-sizing: border-box !important;
          z-index: 999999998 !important;
        }

        html body #navbar > a,
        html body #navbar > .dropdown,
        html body #navbar.open > a,
        html body #navbar.open > .dropdown {
          width: 33.333% !important;
          max-width: 33.333% !important;
          height: 54px !important;
          flex: 1 1 33.333% !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
          overflow: visible !important;
          box-sizing: border-box !important;
        }

        html body #navbar > a,
        html body #navbar > .dropdown > .dropbtn,
        html body #navbar.open > a,
        html body #navbar.open > .dropdown > .dropbtn {
          width: 100% !important;
          height: 54px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: var(--white) !important;
          color: var(--black) !important;
          border: none !important;
          border-right: 3px solid var(--black) !important;
          box-shadow: none !important;
          font-size: 15px !important;
          font-weight: bold !important;
          line-height: 1 !important;
          text-align: center !important;
          text-decoration: none !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          box-sizing: border-box !important;
        }

        html body #navbar > .dropdown:last-child > .dropbtn {
          border-right: none !important;
        }

        html body #navbar > a:hover,
        html body #navbar > .dropdown > .dropbtn:hover,
        html body #navbar > .dropdown.phone-dropup-open > .dropbtn {
          background: var(--yellow) !important;
        }

        /* Hide dropdowns by default */
        html body #navbar > .dropdown > .dropdown-content,
        html body #navbar > .dropdown:hover > .dropdown-content,
        html body #navbar > .dropdown:focus-within > .dropdown-content,
        html body #navbar.open > .dropdown > .dropdown-content,
        html body #navbar.open > .dropdown:hover > .dropdown-content,
        html body #navbar.open > .dropdown:focus-within > .dropdown-content {
          display: none !important;
        }

        /* Show only the clicked dropdown */
        html body #navbar > .dropdown.phone-dropup-open > .dropdown-content,
        html body #navbar.open > .dropdown.phone-dropup-open > .dropdown-content {
          display: block !important;
        }

        /* Calculator + info panels open UPWARD */
        html body #navbar > .dropdown > .dropdown-content,
        html body #navbar.open > .dropdown > .dropdown-content {
          position: absolute !important;
          top: auto !important;
          bottom: calc(100% + 3px) !important;
          width: 210px !important;
          max-width: calc(100vw - 16px) !important;
          height: auto !important;
          background: var(--white) !important;
          border: 3px solid var(--black) !important;
          box-shadow: 4px 4px 0 var(--black) !important;
          overflow: visible !important;
          transform: none !important;
          z-index: 999999999 !important;
          box-sizing: border-box !important;
        }

        html body #navbar > .dropdown:not(.about-dropdown) > .dropdown-content {
          left: 50% !important;
          right: auto !important;
          transform: translateX(-50%) !important;
        }

        html body #navbar > .about-dropdown > .about-dropdown-content {
          left: auto !important;
          right: 0 !important;
          transform: none !important;
        }

        html body #navbar .dropdown-content > a,
        html body #navbar .dropdown-content > .nav-group > summary,
        html body #navbar .dropdown-content > .fixed-nav-group > .nav-summary,
        html body #navbar .dropdown-content > .navbar-fixed-group > .navbar-fixed-summary {
          width: 100% !important;
          height: 42px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: var(--white) !important;
          color: var(--black) !important;
          border: none !important;
          border-bottom: 3px solid var(--black) !important;
          box-shadow: none !important;
          font-size: 15px !important;
          font-weight: bold !important;
          text-align: center !important;
          text-decoration: none !important;
          box-sizing: border-box !important;
        }

        html body #navbar .dropdown-content > *:last-child,
        html body #navbar .dropdown-content > *:last-child > summary,
        html body #navbar .dropdown-content > *:last-child > .nav-summary,
        html body #navbar .dropdown-content > *:last-child > .navbar-fixed-summary {
          border-bottom: none !important;
        }

        html body #navbar .dropdown-content .nav-group,
        html body #navbar .dropdown-content .fixed-nav-group,
        html body #navbar .dropdown-content .navbar-fixed-group {
          position: relative !important;
          overflow: visible !important;
          height: 42px !important;
        }

        /* Hide health/finance items by default */
        html body #navbar .nav-group > .nav-group-links,
        html body #navbar .fixed-nav-group > .nav-group-links,
        html body #navbar .navbar-fixed-group > .nav-group-links,
        html body #navbar .nav-group:hover > .nav-group-links,
        html body #navbar .fixed-nav-group:hover > .nav-group-links,
        html body #navbar .navbar-fixed-group:hover > .nav-group-links {
          display: none !important;
        }

        /* Show active health/finance items */
        html body #navbar .nav-group.phone-submenu-open > .nav-group-links,
        html body #navbar .nav-group[data-phone-open="true"] > .nav-group-links,
        html body #navbar .nav-group.is-open > .nav-group-links,
        html body #navbar .fixed-nav-group.phone-submenu-open > .nav-group-links,
        html body #navbar .fixed-nav-group.is-open > .nav-group-links,
        html body #navbar .navbar-fixed-group.phone-submenu-open > .nav-group-links,
        html body #navbar .navbar-fixed-group.is-open > .nav-group-links {
          display: block !important;
        }

        /* Health/finance items open UPWARD */
        html body #navbar .nav-group > .nav-group-links,
        html body #navbar .fixed-nav-group > .nav-group-links,
        html body #navbar .navbar-fixed-group > .nav-group-links {
          position: absolute !important;
          top: auto !important;
          bottom: calc(100% + 3px) !important;
          left: 0 !important;
          right: auto !important;
          width: 100% !important;
          background: var(--white) !important;
          border: 3px solid var(--black) !important;
          box-shadow: 4px 4px 0 var(--black) !important;
          overflow: visible !important;
          z-index: 999999999 !important;
          box-sizing: border-box !important;
        }

        html body #navbar .nav-group-links a {
          width: 100% !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: var(--white) !important;
          color: var(--black) !important;
          border: none !important;
          border-bottom: 3px solid var(--black) !important;
          box-shadow: none !important;
          font-size: 14px !important;
          font-weight: bold !important;
          text-align: center !important;
          text-decoration: none !important;
        }

        html body #navbar .nav-group-links a:last-child {
          border-bottom: none !important;
        }

        html body #navbar .dropdown-content a:hover,
        html body #navbar .nav-group-links a:hover,
        html body #navbar .nav-group.phone-submenu-open > summary,
        html body #navbar .fixed-nav-group.phone-submenu-open > .nav-summary,
        html body #navbar .navbar-fixed-group.phone-submenu-open > .navbar-fixed-summary {
          background: var(--yellow) !important;
        }

        .calculator-box,
        .calculator-container,
        .age-calculator-container,
        .bmi-calculator-container,
        .loan-calculator-container,
        .discount-calculator-container,
        .percentage-calculator-container,
        .about-container,
        main.has-instructions {
          margin-top: 20px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getNavbar() {
    return document.getElementById("navbar");
  }

  function getDropdowns(navbar) {
    return Array.from(navbar.querySelectorAll(":scope > .dropdown"));
  }

  function getContent(dropdown) {
    return dropdown.querySelector(":scope > .dropdown-content");
  }

  function closeSubmenus(scope) {
    if (!scope) return;

    scope.querySelectorAll(".nav-group, .fixed-nav-group, .navbar-fixed-group")
      .forEach(function (group) {
        group.classList.remove("phone-submenu-open", "is-open", "open", "active");
        group.dataset.phoneOpen = "false";

        if (group.tagName && group.tagName.toLowerCase() === "details") {
          group.open = false;
          group.removeAttribute("open");
        }
      });
  }

  function closeDropdown(dropdown) {
    if (!dropdown) return;

    dropdown.classList.remove("phone-dropup-open", "phone-open", "mobile-open");
    dropdown.dataset.phoneOpen = "false";

    const button = dropdown.querySelector(":scope > .dropbtn");
    const content = getContent(dropdown);

    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.blur();
    }

    if (content) {
      content.style.setProperty("display", "none", "important");
    }

    closeSubmenus(dropdown);
  }

  function openDropdown(dropdown) {
    if (!dropdown) return;

    const button = dropdown.querySelector(":scope > .dropbtn");
    const content = getContent(dropdown);

    dropdown.classList.add("phone-dropup-open", "phone-open", "mobile-open");
    dropdown.dataset.phoneOpen = "true";

    if (button) {
      button.setAttribute("aria-expanded", "true");
      button.blur();
    }

    if (content) {
      content.style.setProperty("display", "block", "important");
      content.style.setProperty("position", "absolute", "important");
      content.style.setProperty("top", "auto", "important");
      content.style.setProperty("bottom", "calc(100% + 3px)", "important");

      if (dropdown.classList.contains("about-dropdown")) {
        content.style.setProperty("left", "auto", "important");
        content.style.setProperty("right", "0", "important");
        content.style.setProperty("transform", "none", "important");
      } else {
        content.style.setProperty("left", "50%", "important");
        content.style.setProperty("right", "auto", "important");
        content.style.setProperty("transform", "translateX(-50%)", "important");
      }
    }
  }

  function closeAllDropdowns(navbar, exceptDropdown) {
    getDropdowns(navbar).forEach(function (dropdown) {
      if (dropdown !== exceptDropdown) {
        closeDropdown(dropdown);
      }
    });
  }

  function toggleDropdown(dropdown) {
    const navbar = getNavbar();
    if (!navbar || !dropdown) return;

    const wasOpen = dropdown.classList.contains("phone-dropup-open");

    closeAllDropdowns(navbar, dropdown);

    if (wasOpen) {
      closeDropdown(dropdown);
    } else {
      openDropdown(dropdown);
    }
  }

  function getSubmenuGroup(target) {
    const trigger = target.closest(
      "#navbar .dropdown-content .nav-group > summary, " +
      "#navbar .dropdown-content .fixed-nav-group > .nav-summary, " +
      "#navbar .dropdown-content .navbar-fixed-group > .navbar-fixed-summary"
    );

    if (!trigger) return null;

    return trigger.parentElement;
  }

  function closeSiblingSubmenus(group) {
    const dropdown = group.closest(".dropdown");
    if (!dropdown) return;

    dropdown.querySelectorAll(".nav-group, .fixed-nav-group, .navbar-fixed-group")
      .forEach(function (otherGroup) {
        if (otherGroup !== group) {
          closeSubmenus(otherGroup);
        }
      });
  }

  function toggleSubmenu(group) {
    if (!group) return;

    const wasOpen =
      group.classList.contains("phone-submenu-open") ||
      group.classList.contains("is-open") ||
      group.dataset.phoneOpen === "true" ||
      group.open === true;

    closeSiblingSubmenus(group);

    if (wasOpen) {
      closeSubmenus(group);
      return;
    }

    group.classList.add("phone-submenu-open", "is-open", "open", "active");
    group.dataset.phoneOpen = "true";

    if (group.tagName && group.tagName.toLowerCase() === "details") {
      group.open = true;
      group.setAttribute("open", "");
    }
  }

  function resetInlineStylesForPc() {
    const navbar = getNavbar();
    if (!navbar) return;

    getDropdowns(navbar).forEach(function (dropdown) {
      dropdown.classList.remove("phone-dropup-open", "phone-open", "mobile-open");
      dropdown.removeAttribute("data-phone-open");

      const content = getContent(dropdown);
      if (content) {
        content.style.removeProperty("display");
        content.style.removeProperty("position");
        content.style.removeProperty("top");
        content.style.removeProperty("bottom");
        content.style.removeProperty("left");
        content.style.removeProperty("right");
        content.style.removeProperty("transform");
      }
    });

    navbar.querySelectorAll(".nav-group, .fixed-nav-group, .navbar-fixed-group")
      .forEach(function (group) {
        group.classList.remove("phone-submenu-open");
        group.removeAttribute("data-phone-open");
      });
  }

  function handlePointerDown(event) {
    if (!isPhone()) return;

    const navbar = getNavbar();
    if (!navbar) return;

    const dropdownButton = event.target.closest("#navbar > .dropdown > .dropbtn");

    if (dropdownButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      toggleDropdown(dropdownButton.closest(".dropdown"));
      return;
    }

    const submenuGroup = getSubmenuGroup(event.target);

    if (submenuGroup) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      toggleSubmenu(submenuGroup);
      return;
    }

    if (!navbar.contains(event.target)) {
      closeAllDropdowns(navbar, null);
    }
  }

  function handleClick(event) {
    if (!isPhone()) return;

    const dropdownButton = event.target.closest("#navbar > .dropdown > .dropbtn");
    const submenuGroup = getSubmenuGroup(event.target);

    if (dropdownButton || submenuGroup) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }

  function initPhoneMenuOverride() {
    installPhoneMenuCSS();

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("click", handleClick, true);

    window.addEventListener("resize", function () {
      if (!isPhone()) {
        resetInlineStylesForPc();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPhoneMenuOverride);
  } else {
    initPhoneMenuOverride();
  }
})();
/* =====================================================
   PHONE FIX: closed calculator/info button returns white
   Only the currently open dropdown stays yellow
===================================================== */
(function () {
  "use strict";

  function isPhone() {
    return window.matchMedia("(max-width: 850px)").matches;
  }

  function installWhiteResetCSS() {
    const oldStyle = document.getElementById("phone-yellow-reset-css");
    if (oldStyle) oldStyle.remove();

    const style = document.createElement("style");
    style.id = "phone-yellow-reset-css";

    style.textContent = `
      @media (max-width: 850px) {
        html body #navbar > .dropdown:not(.phone-dropup-open) > .dropbtn,
        html body #navbar > .dropdown:not(.phone-dropup-open):hover > .dropbtn,
        html body #navbar > .dropdown:not(.phone-dropup-open):focus-within > .dropbtn,
        html body #navbar > .dropdown:not(.phone-dropup-open).phone-open > .dropbtn,
        html body #navbar > .dropdown:not(.phone-dropup-open).mobile-open > .dropbtn {
          background: var(--white) !important;
        }

        html body #navbar > .dropdown.phone-dropup-open > .dropbtn {
          background: var(--yellow) !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function normalizePhoneDropdownColors() {
    if (!isPhone()) return;

    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    navbar.querySelectorAll(":scope > .dropdown").forEach(function (dropdown) {
      const button = dropdown.querySelector(":scope > .dropbtn");

      if (!button) return;

      const isOpen = dropdown.classList.contains("phone-dropup-open");

      if (!isOpen) {
        dropdown.classList.remove("phone-open", "mobile-open");
        dropdown.dataset.phoneOpen = "false";
        button.setAttribute("aria-expanded", "false");
        button.style.setProperty("background", "var(--white)", "important");
        button.blur();
      } else {
        button.style.setProperty("background", "var(--yellow)", "important");
      }
    });

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  }

  function start() {
    installWhiteResetCSS();

    window.addEventListener("pointerup", function () {
      setTimeout(normalizePhoneDropdownColors, 0);
      setTimeout(normalizePhoneDropdownColors, 80);
    }, true);

    window.addEventListener("click", function () {
      setTimeout(normalizePhoneDropdownColors, 0);
      setTimeout(normalizePhoneDropdownColors, 80);
    }, true);

    window.addEventListener("resize", normalizePhoneDropdownColors);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* =====================================================
   PHONE FIX: health / finance arrow changes
   closed = ▼
   open = ▲
===================================================== */
(function () {
  "use strict";

  function isPhone() {
    return window.matchMedia("(max-width: 850px)").matches;
  }

  function installPhoneSubArrowCSS() {
    const oldStyle = document.getElementById("phone-submenu-arrow-css");
    if (oldStyle) oldStyle.remove();

    const style = document.createElement("style");
    style.id = "phone-submenu-arrow-css";

    style.textContent = `
      @media (max-width: 850px) {
        html body #navbar .dropdown-content .nav-group > summary::after,
        html body #navbar .dropdown-content .fixed-nav-group > .nav-summary::after,
        html body #navbar .dropdown-content .navbar-fixed-group > .navbar-fixed-summary::after {
          content: none !important;
          display: none !important;
        }

        html body #navbar .phone-sub-arrow {
          display: inline-block !important;
          margin-left: 8px !important;
          color: var(--black) !important;
          font-size: 14px !important;
          font-weight: bold !important;
          line-height: 1 !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function cleanText(text) {
    return String(text || "")
      .replace(/[▼▲▶◀⬇⬆⬅➡]/g, "")
      .trim();
  }

  function getTrigger(group) {
    return (
      group.querySelector(":scope > summary") ||
      group.querySelector(":scope > .nav-summary") ||
      group.querySelector(":scope > .navbar-fixed-summary")
    );
  }

  function groupIsOpen(group) {
    return (
      group.open === true ||
      group.dataset.phoneOpen === "true" ||
      group.classList.contains("phone-submenu-open") ||
      group.classList.contains("is-open") ||
      group.classList.contains("open") ||
      group.classList.contains("active")
    );
  }

  function setupArrow(group) {
    const trigger = getTrigger(group);
    if (!trigger) return;

    let arrow = trigger.querySelector(".phone-sub-arrow");

    if (!arrow) {
      trigger.querySelectorAll(".nav-menu-arrow").forEach(function (oldArrow) {
        oldArrow.remove();
      });

      trigger.textContent = cleanText(trigger.textContent) + " ";

      arrow = document.createElement("span");
      arrow.className = "phone-sub-arrow";
      arrow.textContent = "▼";

      trigger.appendChild(arrow);
    }

    arrow.textContent = groupIsOpen(group) ? "▲" : "▼";
  }

  function updateAllPhoneSubArrows() {
    if (!isPhone()) return;

    document
      .querySelectorAll(
        "#navbar .dropdown-content .nav-group, " +
        "#navbar .dropdown-content .fixed-nav-group, " +
        "#navbar .dropdown-content .navbar-fixed-group"
      )
      .forEach(setupArrow);
  }

  function start() {
    installPhoneSubArrowCSS();
    updateAllPhoneSubArrows();

    window.addEventListener(
      "pointerdown",
      function () {
        setTimeout(updateAllPhoneSubArrows, 0);
        setTimeout(updateAllPhoneSubArrows, 80);
      },
      true
    );

    window.addEventListener(
      "click",
      function () {
        setTimeout(updateAllPhoneSubArrows, 0);
        setTimeout(updateAllPhoneSubArrows, 80);
      },
      true
    );

    const navbar = document.getElementById("navbar");

    if (navbar) {
      const observer = new MutationObserver(function () {
        updateAllPhoneSubArrows();
      });

      observer.observe(navbar, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["open", "class", "data-phone-open"]
      });
    }

    window.addEventListener("resize", updateAllPhoneSubArrows);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();