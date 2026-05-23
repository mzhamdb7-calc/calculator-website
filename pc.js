/*
  Copyright © 2026 Hamdi. All rights reserved.
  PC MODE ONLY
  Health / finance arrows:
  closed = ▼
  hover/open = ▲
*/

(function () {
  "use strict";

  function isPcMode() {
    return window.matchMedia("(min-width: 851px)").matches;
  }

  function cleanLabel(text) {
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

  function isOpen(group) {
    return (
      group.matches(":hover") ||
      group.open === true ||
      group.classList.contains("open") ||
      group.classList.contains("active") ||
      group.classList.contains("is-open")
    );
  }

  function setArrow(group) {
    const arrow = group.querySelector(
      ":scope > summary .nav-menu-arrow, " +
      ":scope > .nav-summary .nav-menu-arrow, " +
      ":scope > .navbar-fixed-summary .nav-menu-arrow"
    );

    if (!arrow) return;
    arrow.textContent = isOpen(group) ? "▲" : "▼";
  }

  function setupGroup(group) {
    if (!group || group.dataset.pcArrowReady === "true") return;

    const trigger = getTrigger(group);
    if (!trigger) return;

    group.dataset.pcArrowReady = "true";

    trigger.querySelectorAll(".nav-menu-arrow").forEach(function (oldArrow) {
      oldArrow.remove();
    });

    trigger.textContent = cleanLabel(trigger.textContent) + " ";

    const arrow = document.createElement("span");
    arrow.className = "nav-menu-arrow";
    arrow.textContent = "▼";
    trigger.appendChild(arrow);

    group.addEventListener("mouseenter", function () {
      if (!isPcMode()) return;
      arrow.textContent = "▲";
    });

    group.addEventListener("mouseleave", function () {
      if (!isPcMode()) return;
      setArrow(group);
    });

    group.addEventListener("toggle", function () {
      if (!isPcMode()) return;
      setArrow(group);
    });

    trigger.addEventListener("click", function () {
      if (!isPcMode()) return;
      setTimeout(function () {
        setArrow(group);
      }, 0);
    });

    setArrow(group);
  }

  function setupPcNavbarArrows() {
    document
      .querySelectorAll(
        "#navbar .dropdown-content > details.nav-group, " +
        "#navbar .dropdown-content > .nav-group, " +
        "#navbar .dropdown-content > .fixed-nav-group, " +
        "#navbar .dropdown-content > .navbar-fixed-group"
      )
      .forEach(setupGroup);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupPcNavbarArrows);
  } else {
    setupPcNavbarArrows();
  }
})();
