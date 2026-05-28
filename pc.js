/*
  PC MODE ONLY — modern rebuild
  This file no longer injects legacy navigation styles.
  Layout is handled by style.css + pc.css.
*/
(function () {
  "use strict";

  const PC_QUERY = "(min-width: 851px)";

  function isPc() {
    return window.matchMedia(PC_QUERY).matches;
  }

  function cleanupLegacyElements() {
    const menuIcon = document.getElementById("menuIcon");
    if (menuIcon) menuIcon.remove();

    document.body.classList.remove("menu-scrolled");
    document.documentElement.classList.remove("menu-scrolled");

    const nav = document.getElementById("navbar");
    if (nav) {
      nav.classList.remove("open", "scrolled");
      nav.classList.add("clean-navbar");
    }
  }

  function syncModeClass() {
    document.body.classList.toggle("desktop-layout", isPc());
  }

  function start() {
    cleanupLegacyElements();
    syncModeClass();
    window.addEventListener("resize", syncModeClass, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
