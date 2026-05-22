/*
  Copyright © 2026 Hamdi. All rights reserved.
  PC MODE ONLY
*/

(function () {
  "use strict";

  function isPc() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function setupPcNavbarArrows() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    navbar
      .querySelectorAll(".dropdown-content > .nav-group, .dropdown-content > .fixed-nav-group, .dropdown-content > .navbar-fixed-group")
      .forEach(function (group) {
        if (group.dataset.pcArrowReady === "true") return;

        const trigger =
          group.querySelector(":scope > summary") ||
          group.querySelector(":scope > .nav-summary") ||
          group.querySelector(":scope > .navbar-fixed-summary");

        if (!trigger) return;

        group.dataset.pcArrowReady = "true";

        trigger.textContent = trigger.textContent
          .replace(/[▼▲▶◀]/g, "")
          .trim() + " ";

        const arrow = document.createElement("span");
        arrow.className = "nav-menu-arrow";
        arrow.textContent = "▼";
        trigger.appendChild(arrow);

        group.addEventListener("mouseenter", function () {
          if (!isPc()) return;
          arrow.textContent = "▲";
        });

        group.addEventListener("mouseleave", function () {
          if (!isPc()) return;
          arrow.textContent = "▼";
        });
      });
  }

  function setupPcCalculatorMenuClick() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    const calculatorDropdown = navbar.querySelector(":scope > .dropdown");
    if (!calculatorDropdown) return;

    const calculatorButton = calculatorDropdown.querySelector(":scope > .dropbtn");
    if (!calculatorButton) return;

    if (calculatorButton.dataset.pcMenuReady === "true") return;
    calculatorButton.dataset.pcMenuReady = "true";

    calculatorButton.addEventListener("click", function (event) {
      if (!isPc()) return;

      if (!navbar.classList.contains("open")) return;

      event.preventDefault();
      event.stopPropagation();

      calculatorDropdown.classList.toggle("menu-open");
    });
  }

  function initPc() {
    setupPcNavbarArrows();
    setupPcCalculatorMenuClick();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPc);
  } else {
    initPc();
  }
})();