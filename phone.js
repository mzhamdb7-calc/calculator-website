/*
  PHONE MODE ONLY — modern rebuild
  This file no longer injects the old boxed/legacy mobile menu.
  Mobile layout is handled by style.css + phone.css.
*/
(function () {
  "use strict";

  const PHONE_QUERY = "(max-width: 850px)";

  function isPhone() {
    return window.matchMedia(PHONE_QUERY).matches;
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
    document.body.classList.toggle("mobile-layout", isPhone());
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
