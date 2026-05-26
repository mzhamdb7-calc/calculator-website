/*
  Copyright © 2026 Hamdi. All rights reserved.
  PHONE MODE ONLY

  Clean phone file:
  - Phone navbar only
  - Removes duplicate JS arrow spans
  - Uses CSS-only arrows
  - Top menus and health/finance menus open upward
*/

(function () {
  "use strict";

  const PHONE_QUERY = "(max-width: 850px)";
  const CSS_ID = "clean-phone-css";

  function isPhone() {
    return window.matchMedia(PHONE_QUERY).matches;
  }

  function getNavbar() {
    return document.getElementById("navbar");
  }

  function installPhoneCss() {
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

        #pcQuestionOverlayButton {
          display: none !important;
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
        html body #navbar .dropdown-content > *:last-child > summary {
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

        html body #navbar .phone-sub-arrow,
        html body #navbar .nav-menu-arrow {
          display: none !important;
          content: none !important;
        }

        html body #navbar summary {
          list-style: none !important;
        }

        html body #navbar summary::-webkit-details-marker {
          display: none !important;
        }

        html body #navbar summary::marker {
          content: "" !important;
        }

        html body #navbar > .dropdown > .dropbtn::after {
          content: "▼" !important;
          display: inline-block !important;
          margin-left: 6px !important;
          color: var(--black) !important;
          font-size: 12px !important;
          font-weight: bold !important;
          line-height: 1 !important;
        }

        html body #navbar > .dropdown.phone-open > .dropbtn::after {
          content: "▲" !important;
        }

        html body #navbar .dropdown-content > details.nav-group > summary::after,
        html body #navbar .dropdown-content > .nav-group > summary::after,
        html body #navbar .dropdown-content > .fixed-nav-group > .nav-summary::after,
        html body #navbar .dropdown-content > .navbar-fixed-group > .navbar-fixed-summary::after {
          content: "▼" !important;
          display: inline-block !important;
          margin-left: 6px !important;
          color: var(--black) !important;
          font-size: 12px !important;
          font-weight: bold !important;
          line-height: 1 !important;
        }

        html body #navbar .dropdown-content > details.nav-group[open] > summary::after,
        html body #navbar .dropdown-content > .nav-group.phone-sub-open > summary::after,
        html body #navbar .dropdown-content > .fixed-nav-group.phone-sub-open > .nav-summary::after,
        html body #navbar .dropdown-content > .navbar-fixed-group.phone-sub-open > .navbar-fixed-summary::after {
          content: "▲" !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function cleanArrowText(text) {
    return String(text || "")
      .replace(/[▼▲▶◀⬇⬆⬅➡]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanOldArrows() {
    const navbar = getNavbar();
    if (!navbar) return;

    navbar
      .querySelectorAll(".phone-sub-arrow, .nav-menu-arrow")
      .forEach(function (arrow) {
        arrow.remove();
      });

    navbar
      .querySelectorAll(
        "#navbar > .dropdown > .dropbtn, " +
        "#navbar .dropdown-content > details.nav-group > summary, " +
        "#navbar .dropdown-content > .nav-group > summary, " +
        "#navbar .dropdown-content > .fixed-nav-group > .nav-summary, " +
        "#navbar .dropdown-content > .navbar-fixed-group > .navbar-fixed-summary"
      )
      .forEach(function (trigger) {
        trigger.childNodes.forEach(function (node) {
          if (node.nodeType === Node.TEXT_NODE) {
            const cleaned = cleanArrowText(node.textContent);
            node.textContent = cleaned ? cleaned + " " : "";
          }
        });
      });
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

  function closeAllTopMenus(except) {
    const navbar = getNavbar();
    if (!navbar) return;

    topDropdowns(navbar).forEach(function (dropdown) {
      if (dropdown === except) return;

      dropdown.classList.remove("phone-open", "mobile-open", "phone-dropup-open");

      const button = dropdown.querySelector(":scope > .dropbtn");
      if (button) button.setAttribute("aria-expanded", "false");
    });
  }

  function closeAllSubmenus(root, except) {
    submenuGroups(root || document).forEach(function (group) {
      if (group === except) return;

      group.classList.remove("phone-sub-open", "is-open", "open", "active");

      if (group.tagName && group.tagName.toLowerCase() === "details") {
        group.open = false;
      }
    });
  }

  function setupTopMenus() {
    const navbar = getNavbar();
    if (!navbar) return;

    topDropdowns(navbar).forEach(function (dropdown) {
      const button = dropdown.querySelector(":scope > .dropbtn");
      if (!button || button.dataset.phoneReady === "true") return;

      button.dataset.phoneReady = "true";

      button.addEventListener("click", function (event) {
        if (!isPhone()) return;

        event.preventDefault();
        event.stopPropagation();

        const willOpen = !dropdown.classList.contains("phone-open");

        closeAllTopMenus(dropdown);
        closeAllSubmenus(navbar);

        dropdown.classList.toggle("phone-open", willOpen);
        dropdown.classList.toggle("mobile-open", willOpen);
        dropdown.classList.toggle("phone-dropup-open", willOpen);
        button.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });
    });
  }

  function setupSubmenus() {
    const navbar = getNavbar();
    if (!navbar) return;

    submenuGroups(navbar).forEach(function (group) {
      const trigger =
        group.querySelector(":scope > summary") ||
        group.querySelector(":scope > .nav-summary") ||
        group.querySelector(":scope > .navbar-fixed-summary");

      if (!trigger || trigger.dataset.phoneSubReady === "true") return;

      trigger.dataset.phoneSubReady = "true";

      trigger.addEventListener("click", function (event) {
        if (!isPhone()) return;

        event.preventDefault();
        event.stopPropagation();

        const willOpen = !group.classList.contains("phone-sub-open") && !group.open;

        closeAllSubmenus(navbar, group);

        group.classList.toggle("phone-sub-open", willOpen);
        group.classList.toggle("is-open", willOpen);

        if (group.tagName && group.tagName.toLowerCase() === "details") {
          group.open = willOpen;
        }
      });
    });
  }

  function setupCloseOutside() {
    document.addEventListener("click", function (event) {
      if (!isPhone()) return;

      const navbar = getNavbar();
      if (!navbar) return;

      if (!navbar.contains(event.target)) {
        closeAllTopMenus();
        closeAllSubmenus(navbar);
      }
    });
  }

  function start() {
    installPhoneCss();
    cleanOldArrows();
    setupTopMenus();
    setupSubmenus();
    setupCloseOutside();

    window.addEventListener("resize", function () {
      if (!isPhone()) return;
      cleanOldArrows();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
