/*
  Copyright © 2026 Hamdi. All rights reserved.
  PC MODE ONLY
  Clean old JS arrows.
  Arrow direction is now controlled by CSS only.
*/

(function () {
  "use strict";

  function removeOldArrowSpans() {
    document
      .querySelectorAll("#navbar .nav-menu-arrow, #navbar .phone-sub-arrow")
      .forEach(function (arrow) {
        arrow.remove();
      });
  }

  function start() {
    removeOldArrowSpans();

    window.addEventListener("resize", removeOldArrowSpans);

    document.addEventListener("click", function () {
      setTimeout(removeOldArrowSpans, 0);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();