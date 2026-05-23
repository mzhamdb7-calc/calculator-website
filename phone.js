/*
  Copyright © 2026 Hamdi. All rights reserved.
  PHONE MODE ONLY
  Safe phone menu:
  - no document-level click blocking
  - calculator opens upward
  - info opens upward
  - opening one closes the other
  - health/finance open upward
*/

(function () {
  "use strict";

  const PHONE_QUERY = "(max-width: 850px)";
  const CSS_ID = "safe-phone-menu-css";

  function isPhone() {
    return window.matchMedia(PHONE_QUERY).matches;
  }

  function getNavbar() {
    return document.getElementById("navbar");
  }

  function topDropdowns(navbar) {
    return Array.from(navbar.querySelectorAll(":scope > .dropdown"));
  }

  function submenuGroups(root) {
    return Array.from(
      root.querySelectorAll(
        ".nav-group, " +
        ".fixed-nav-group, " +
        ".navbar-fixed-group"
      )
    );
  }

  function getSubmenuTrigger(group) {
    return (
      group.querySelector(":scope > summary") ||
      group.querySelector(":scope > .nav-summary") ||
      group.querySelector(":scope > .navbar-fixed-summary")
    );
  }

  function cleanLabel(text) {
    return String(text || "")
      .replace(/[▼▲▶◀⬇⬆⬅➡]/g, "")
      .trim();
  }

  function installPhoneMenuCss() {
    const old = document.getElementById(CSS_ID);
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = CSS_ID;

    style.textContent = `
      @media (max-width: 850px) {
        html,
        body {
          overflow-x: hidden !important;
          touch-action: manipulation !important;
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
          pointer-events: auto !important;
          z-index: 9999999 !important;
        }

        html body #navbar,
        html body #navbar.open,
        html body #navbar.scrolled,
        html body #navbar.scrolled.open,
        html body.menu-scrolled #navbar,
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
          pointer-events: auto !important;
          box-sizing: border-box !important;
          z-index: 999999 !important;
        }

        html body #navbar *,
        html body #navbar.open * {
          pointer-events: auto !important;
          box-sizing: border-box !important;
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
        }

        html body #navbar > .dropdown:last-child > .dropbtn {
          border-right: none !important;
        }

        html body #navbar > .dropdown:not(.phone-open) > .dropbtn,
        html body #navbar > .dropdown:not(.phone-open):hover > .dropbtn,
        html body #navbar > .dropdown:not(.phone-open):focus-within > .dropbtn {
          background: var(--white) !important;
        }

        html body #navbar > .dropdown.phone-open > .dropbtn {
          background: var(--yellow) !important;
        }

        html body #navbar > .dropdown > .dropdown-content,
        html body #navbar > .dropdown:hover > .dropdown-content,
        html body #navbar > .dropdown:focus-within > .dropdown-content,
        html body #navbar.open > .dropdown > .dropdown-content,
        html body #navbar.open > .dropdown:hover > .dropdown-content,
        html body #navbar.open > .dropdown:focus-within > .dropdown-content {
          display: none !important;
        }

        html body #navbar > .dropdown.phone-open > .dropdown-content,
        html body #navbar.open > .dropdown.phone-open > .dropdown-content {
          display: block !important;
        }

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
          z-index: 9999999 !important;
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
          font-family: inherit !important;
          font-size: 15px !important;
          font-weight: bold !important;
          text-align: center !important;
          text-decoration: none !important;
          cursor: pointer !important;
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
          height: 42px !important;
          overflow: visible !important;
          background: var(--white) !important;
        }

        html body #navbar .nav-group > .nav-group-links,
        html body #navbar .fixed-nav-group > .nav-group-links,
        html body #navbar .navbar-fixed-group > .nav-group-links,
        html body #navbar .nav-group:hover > .nav-group-links,
        html body #navbar .fixed-nav-group:hover > .nav-group-links,
        html body #navbar .navbar-fixed-group:hover > .nav-group-links,
        html body #navbar .nav-group:focus-within > .nav-group-links,
        html body #navbar .fixed-nav-group:focus-within > .nav-group-links,
        html body #navbar .navbar-fixed-group:focus-within > .nav-group-links {
          display: none !important;
        }

        html body #navbar .nav-group.phone-sub-open > .nav-group-links,
        html body #navbar .fixed-nav-group.phone-sub-open > .nav-group-links,
        html body #navbar .navbar-fixed-group.phone-sub-open > .nav-group-links,
        html body #navbar .nav-group[open] > .nav-group-links {
          display: block !important;
        }

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
          z-index: 99999999 !important;
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
          font-size: 14px !important;
          font-weight: bold !important;
          text-align: center !important;
          text-decoration: none !important;
        }

        html body #navbar .nav-group-links a:last-child {
          border-bottom: none !important;
        }

        html body #navbar .nav-group.phone-sub-open > summary,
        html body #navbar .fixed-nav-group.phone-sub-open > .nav-summary,
        html body #navbar .navbar-fixed-group.phone-sub-open > .navbar-fixed-summary,
        html body #navbar .nav-group[open] > summary,
        html body #navbar .dropdown-content a:hover,
        html body #navbar .nav-group-links a:hover {
          background: var(--yellow) !important;
        }

        html body #navbar .nav-group > summary::after,
        html body #navbar .fixed-nav-group > .nav-summary::after,
        html body #navbar .navbar-fixed-group > .navbar-fixed-summary::after {
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

        html body main,
        html body main.has-instructions,
        html body .calculator-container,
        html body .age-calculator-container,
        html body .bmi-calculator-container,
        html body .discount-calculator-container,
        html body .loan-calculator-container,
        html body .percentage-calculator-container,
        html body .compound-interest-container,
        html body .about-container,
        html body .calculator-box {
          margin-top: 20px !important;
          pointer-events: auto !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function addPhoneArrow(trigger) {
    if (!trigger) return null;

    trigger.querySelectorAll(".phone-sub-arrow, .nav-menu-arrow").forEach(function (oldArrow) {
      oldArrow.remove();
    });

    trigger.textContent = cleanLabel(trigger.textContent) + " ";

    const arrow = document.createElement("span");
    arrow.className = "phone-sub-arrow";
    arrow.textContent = "▼";
    trigger.appendChild(arrow);

    return arrow;
  }

  function updatePhoneArrow(group) {
    const trigger = getSubmenuTrigger(group);
    if (!trigger) return;

    let arrow = trigger.querySelector(".phone-sub-arrow");

    if (!arrow) {
      arrow = addPhoneArrow(trigger);
    }

    if (!arrow) return;

    arrow.textContent =
      group.classList.contains("phone-sub-open") || group.open ? "▲" : "▼";
  }

  function closeSubmenus(dropdown) {
    if (!dropdown) return;

    submenuGroups(dropdown).forEach(function (group) {
      group.classList.remove("phone-sub-open", "is-open", "open", "active");
      group.dataset.phoneOpen = "false";

      if (group.tagName && group.tagName.toLowerCase() === "details") {
        group.open = false;
        group.removeAttribute("open");
      }

      updatePhoneArrow(group);
    });
  }

  function closeDropdown(dropdown) {
    if (!dropdown) return;

    dropdown.classList.remove("phone-open", "mobile-open", "phone-dropup-open");
    dropdown.dataset.phoneOpen = "false";

    const button = dropdown.querySelector(":scope > .dropbtn");
    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.blur();
    }

    closeSubmenus(dropdown);
  }

  function closeAll(navbar, exceptDropdown) {
    topDropdowns(navbar).forEach(function (dropdown) {
      if (dropdown !== exceptDropdown) {
        closeDropdown(dropdown);
      }
    });
  }

  function openDropdown(dropdown) {
    const navbar = getNavbar();
    if (!navbar || !dropdown) return;

    closeAll(navbar, dropdown);

    dropdown.classList.add("phone-open", "mobile-open", "phone-dropup-open");
    dropdown.dataset.phoneOpen = "true";

    const button = dropdown.querySelector(":scope > .dropbtn");
    if (button) {
      button.setAttribute("aria-expanded", "true");
      button.blur();
    }
  }

  function toggleDropdown(dropdown) {
    if (!dropdown) return;

    if (dropdown.classList.contains("phone-open")) {
      closeDropdown(dropdown);
    } else {
      openDropdown(dropdown);
    }
  }

  function toggleSubmenu(group) {
    if (!group) return;

    const dropdown = group.closest(".dropdown");
    if (!dropdown) return;

    submenuGroups(dropdown).forEach(function (other) {
      if (other === group) return;

      other.classList.remove("phone-sub-open", "is-open", "open", "active");
      other.dataset.phoneOpen = "false";

      if (other.tagName && other.tagName.toLowerCase() === "details") {
        other.open = false;
        other.removeAttribute("open");
      }

      updatePhoneArrow(other);
    });

    const willOpen = !(group.classList.contains("phone-sub-open") || group.open);

    group.classList.toggle("phone-sub-open", willOpen);
    group.classList.toggle("is-open", willOpen);
    group.dataset.phoneOpen = willOpen ? "true" : "false";

    if (group.tagName && group.tagName.toLowerCase() === "details") {
      group.open = willOpen;
      if (willOpen) {
        group.setAttribute("open", "");
      } else {
        group.removeAttribute("open");
      }
    }

    updatePhoneArrow(group);
  }

  function setupPhoneMenu() {
    installPhoneMenuCss();

    const navbar = getNavbar();
    if (!navbar || navbar.dataset.safePhoneReady === "true") return;

    navbar.dataset.safePhoneReady = "true";

    topDropdowns(navbar).forEach(function (dropdown) {
      const button = dropdown.querySelector(":scope > .dropbtn");
      if (!button) return;

      button.addEventListener("click", function (event) {
        if (!isPhone()) return;

        event.preventDefault();
        event.stopPropagation();

        toggleDropdown(dropdown);
      });
    });

    submenuGroups(navbar).forEach(function (group) {
      const trigger = getSubmenuTrigger(group);
      if (!trigger) return;

      addPhoneArrow(trigger);

      trigger.addEventListener("click", function (event) {
        if (!isPhone()) return;

        event.preventDefault();
        event.stopPropagation();

        toggleSubmenu(group);
      });
    });

    document.addEventListener("click", function (event) {
      if (!isPhone()) return;
      if (navbar.contains(event.target)) return;

      closeAll(navbar, null);
    });

    window.addEventListener("resize", function () {
      if (!isPhone()) {
        closeAll(navbar, null);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupPhoneMenu);
  } else {
    setupPhoneMenu();
  }
})();
