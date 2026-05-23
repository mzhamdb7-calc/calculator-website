/*
  Copyright © 2026 Hamdi. All rights reserved.
  PC MODE ONLY
  Health / finance arrows:
  closed = ▼
  hover/open = ▲
*/

(function () {
  "use strict";

  const PC_QUERY = "(min-width: 851px)";

  function isPcMode() {
    return window.matchMedia(PC_QUERY).matches;
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

  function isGroupOpen(group) {
    return (
      group.matches(":hover") ||
      group.open === true ||
      group.classList.contains("open") ||
      group.classList.contains("active") ||
      group.classList.contains("is-open")
    );
  }

  function updateArrow(group) {
    const trigger = getTrigger(group);
    if (!trigger) return;

    const arrow = trigger.querySelector(".nav-menu-arrow");
    if (!arrow) return;

    arrow.textContent = isGroupOpen(group) ? "▲" : "▼";
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
      updateArrow(group);
    });

    group.addEventListener("toggle", function () {
      if (!isPcMode()) return;
      updateArrow(group);
    });

    trigger.addEventListener("click", function () {
      if (!isPcMode()) return;

      window.setTimeout(function () {
        updateArrow(group);
      }, 0);
    });

    updateArrow(group);
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

    if (!isPcMode()) {
      document.querySelectorAll("#navbar .nav-menu-arrow").forEach(function (arrow) {
        arrow.textContent = "▼";
      });
    }
  }

  function start() {
    setupPcNavbarArrows();

    window.addEventListener("resize", function () {
      setupPcNavbarArrows();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
