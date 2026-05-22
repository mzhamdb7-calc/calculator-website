/*
  Copyright © 2026 Hamdi. All rights reserved.
  PHONE MODE ONLY
*/

(function () {
  "use strict";

  function isPhone() {
    return window.matchMedia("(max-width: 850px)").matches;
  }

  function closePhoneSubmenus(navbar) {
    if (!navbar) return;

    navbar.querySelectorAll("details.nav-group").forEach(function (group) {
      group.open = false;
      group.removeAttribute("open");
      group.dataset.phoneOpen = "false";
      group.classList.remove("is-open", "open", "active", "phone-sub-open");
    });

    navbar.querySelectorAll(".fixed-nav-group, .navbar-fixed-group").forEach(function (group) {
      group.classList.remove("is-open", "open", "active", "phone-sub-open");
    });
  }

  function closeAllDropdowns(navbar, exceptDropdown) {
    navbar.querySelectorAll(":scope > .dropdown").forEach(function (dropdown) {
      if (dropdown === exceptDropdown) return;

      dropdown.classList.remove("phone-open", "mobile-open");
      dropdown.dataset.phoneOpen = "false";

      const button = dropdown.querySelector(":scope > .dropbtn");
      if (button) {
        button.setAttribute("aria-expanded", "false");
        button.blur();
      }
    });
  }

  function setupPhoneDropdowns() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    navbar.querySelectorAll(":scope > .dropdown").forEach(function (dropdown) {
      const button = dropdown.querySelector(":scope > .dropbtn");

      if (!button) return;
      if (dropdown.dataset.phoneDropdownReady === "true") return;

      dropdown.dataset.phoneDropdownReady = "true";

      button.addEventListener("click", function (event) {
        if (!isPhone()) return;

        event.preventDefault();
        event.stopPropagation();

        const isOpen = dropdown.classList.contains("phone-open");

        closeAllDropdowns(navbar, dropdown);
        closePhoneSubmenus(navbar);

        dropdown.classList.toggle("phone-open", !isOpen);
        dropdown.classList.toggle("mobile-open", !isOpen);
        dropdown.dataset.phoneOpen = !isOpen ? "true" : "false";

        button.setAttribute("aria-expanded", !isOpen ? "true" : "false");
        button.blur();
      });
    });

    document.addEventListener("click", function (event) {
      if (!isPhone()) return;
      if (navbar.contains(event.target)) return;

      closeAllDropdowns(navbar, null);
      closePhoneSubmenus(navbar);
    });
  }

  function setupPhoneSubmenus() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    navbar.querySelectorAll(".nav-group > summary").forEach(function (summary) {
      if (summary.dataset.phoneSubmenuReady === "true") return;

      summary.dataset.phoneSubmenuReady = "true";

      summary.addEventListener("click", function (event) {
        if (!isPhone()) return;

        event.preventDefault();
        event.stopPropagation();

        const group = summary.parentElement;
        const wasOpen = group.open === true;

        navbar.querySelectorAll(".nav-group").forEach(function (otherGroup) {
          otherGroup.open = false;
          otherGroup.dataset.phoneOpen = "false";
          otherGroup.classList.remove("is-open", "open", "active", "phone-sub-open");
        });

        group.open = !wasOpen;
        group.dataset.phoneOpen = !wasOpen ? "true" : "false";
        group.classList.toggle("is-open", !wasOpen);
        group.classList.toggle("phone-sub-open", !wasOpen);
      });
    });
  }

  function initPhone() {
    setupPhoneDropdowns();
    setupPhoneSubmenus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPhone);
  } else {
    initPhone();
  }
})();