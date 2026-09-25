(function () {
  function closeDetails(selector, except) {
    document.querySelectorAll(selector).forEach(function (menu) {
      if (menu !== except) {
        menu.removeAttribute("open");
      }
    });
  }

  function closeCommunitiesMenus(except) {
    closeDetails(".communities-menu[open]", except);
  }

  function closeMobileMenus() {
    closeDetails(".mobile-menu[open]");
  }

  function closeAllHeaderMenus() {
    closeCommunitiesMenus();

    window.requestAnimationFrame(function () {
      closeMobileMenus();
    });
  }

  function resetNestedMobileMenus(parentMenu) {
    if (!parentMenu) {
      return;
    }

    parentMenu
      .querySelectorAll(".communities-menu[open]")
      .forEach(function (menu) {
        menu.removeAttribute("open");
      });
  }

  function closeMenusForOutsideClick(event) {
    var clickedInsideHeaderMenu = event.target.closest(
      ".communities-menu, .mobile-menu"
    );

    if (clickedInsideHeaderMenu) {
      return;
    }

    closeAllHeaderMenus();
  }

  document.addEventListener("click", closeMenusForOutsideClick);

  document.addEventListener("toggle", function (event) {
    var menu = event.target;

    if (!menu || !menu.matches) {
      return;
    }

    if (menu.matches(".mobile-menu") && menu.hasAttribute("open")) {
      resetNestedMobileMenus(menu);
    }

    if (menu.matches(".communities-menu") && menu.hasAttribute("open")) {
      closeCommunitiesMenus(menu);
    }
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
      return;
    }

    var focusedSummary = null;

    document.querySelectorAll(".communities-menu[open], .mobile-menu[open]").forEach(function (menu) {
      if (!focusedSummary) {
        focusedSummary = menu.querySelector("summary");
      }

      menu.removeAttribute("open");
    });

    if (focusedSummary) {
      focusedSummary.focus();
    }
  });

  function initScrollAwareHeader() {
    var header = document.querySelector(".site-header");

    if (!header) {
      return;
    }

    var lastScrollY = window.scrollY || 0;
    var ticking = false;
    var minimumDelta = 4;
    var hideAfter = 96;

    function revealHeader() {
      header.classList.remove("site-header--hidden");
      header.classList.add("site-header--revealed");
    }

    function resetHeaderAtTop() {
      header.classList.remove("site-header--hidden");
      header.classList.remove("site-header--revealed");
    }

    function updateHeader() {
      var currentScrollY = window.scrollY || 0;
      var delta = currentScrollY - lastScrollY;

      closeAllHeaderMenus();

      if (currentScrollY <= hideAfter) {
        resetHeaderAtTop();
      } else if (delta >= minimumDelta) {
        header.classList.add("site-header--hidden");
        header.classList.remove("site-header--revealed");
      } else if (delta <= -minimumDelta) {
        revealHeader();
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  }

  initScrollAwareHeader();
})();
