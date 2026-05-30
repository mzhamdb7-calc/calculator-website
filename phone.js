// phone.js - mobile-only behavior. Loaded for all pages but activates only on phone screens.
(function () {
  "use strict";

  const PHONE_QUERY = "(max-width: 850px)";
  const media = window.matchMedia ? window.matchMedia(PHONE_QUERY) : { matches: window.innerWidth <= 850 };

  function isPhone() {
    return media.matches || window.innerWidth <= 850;
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function setupPhoneNav() {
    if (!isPhone()) return;

    document.documentElement.classList.add("is-phone");
    document.body.classList.add("is-phone");

    const navbar = document.getElementById("navbar") || document.querySelector(".clean-navbar, nav");
    if (!navbar) return;

    // Keep touch dropdowns usable on phones without affecting desktop hover.
    const dropdownButtons = navbar.querySelectorAll(
      ".clean-nav-button, .clean-nav-submenu-button, .nav-dropdown > a, .dropdown > a"
    );

    dropdownButtons.forEach((button) => {
      if (button.dataset.phoneBound === "1") return;
      button.dataset.phoneBound = "1";
      button.addEventListener("click", function (event) {
        if (!isPhone()) return;
        const parent = button.closest(".clean-nav-dropdown, .clean-nav-submenu, .nav-dropdown, .dropdown");
        if (!parent) return;
        const panel = parent.querySelector(
          ".clean-nav-dropdown-panel, .clean-nav-submenu-panel, .dropdown-menu, .submenu"
        );
        if (!panel) return;
        event.preventDefault();
        parent.classList.toggle("phone-open");
        panel.classList.toggle("phone-open");
      });
    });

    // Hide open dropdowns when tapping outside.
    if (!document.body.dataset.phoneOutsideBound) {
      document.body.dataset.phoneOutsideBound = "1";
      document.addEventListener("click", function (event) {
        if (!isPhone()) return;
        if (navbar.contains(event.target)) return;
        navbar.querySelectorAll(".phone-open").forEach((el) => el.classList.remove("phone-open"));
      });
    }

    // Smooth mobile navbar hide/show while scrolling. This only adds classes;
    // phone.css controls the visual rules, so desktop is untouched.
    if (!navbar.dataset.phoneScrollBound) {
      navbar.dataset.phoneScrollBound = "1";
      let lastY = window.scrollY || 0;
      window.addEventListener("scroll", function () {
        if (!isPhone()) return;
        const currentY = window.scrollY || 0;
        if (currentY > lastY + 8 && currentY > 80) {
          navbar.classList.add("phone-nav-hidden");
        } else if (currentY < lastY - 8) {
          navbar.classList.remove("phone-nav-hidden");
        }
        lastY = currentY;
      }, { passive: true });
    }
  }

  ready(setupPhoneNav);

  if (media.addEventListener) {
    media.addEventListener("change", setupPhoneNav);
  } else if (media.addListener) {
    media.addListener(setupPhoneNav);
  }
})();
