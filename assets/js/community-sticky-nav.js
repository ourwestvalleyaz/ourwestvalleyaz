(() => {
  "use strict";

  const sticky = document.querySelector(
    "[data-community-sticky-nav]"
  );

  if (!sticky) {
    return;
  }

  const pageHeader = document.querySelector(
    "[data-sticky-nav-header]"
  );

  if (!pageHeader) {
    return;
  }

  const currentLabel = sticky.querySelector(
    "[data-community-current-section]"
  );

  const links = Array.from(
    sticky.querySelectorAll(
      "[data-community-section-link]"
    )
  );

  if (!currentLabel || links.length === 0) {
    return;
  }

  const sections = links
    .map((link) => {
      const id = link.dataset.communitySectionLink;
      const section = document.getElementById(id);

      if (!section) {
        return null;
      }

      return {
        id,
        name:
          link.dataset.communitySectionName ||
          link.textContent.trim(),
        link,
        section,
      };
    })
    .filter(Boolean);

  if (sections.length === 0) {
    return;
  }

  let headerVisible = true;
  let activeId = "";

  const setActive = (item) => {
    if (!item || item.id === activeId) {
      return;
    }

    activeId = item.id;
    currentLabel.textContent = item.name;

    sections.forEach((candidate) => {
      if (candidate.id === item.id) {
        candidate.link.setAttribute(
          "aria-current",
          "location"
        );
      } else {
        candidate.link.removeAttribute(
          "aria-current"
        );
      }
    });
  };

  const updateCurrentSection = () => {
    const stickyHeight =
      sticky.hidden
        ? 0
        : sticky.getBoundingClientRect().height;

    const threshold = stickyHeight + 32;

    let active = sections[0];

    for (const item of sections) {
      const top =
        item.section.getBoundingClientRect().top;

      if (top <= threshold) {
        active = item;
      } else {
        break;
      }
    }

    setActive(active);
  };

  const setVisible = (visible) => {
    sticky.hidden = !visible;

    document.documentElement.classList.toggle(
      "has-community-sticky-nav",
      visible
    );

    if (visible) {
      updateCurrentSection();
    }
  };

  /*
   * Show the sticky navigation only after the page's own
   * title/header has completely left the viewport.
   */
  const headerObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];

      headerVisible = entry.isIntersecting;
      setVisible(!headerVisible);
    },
    {
      threshold: 0,
    }
  );

  headerObserver.observe(pageHeader);

  let frameRequested = false;

  const requestUpdate = () => {
    if (headerVisible || frameRequested) {
      return;
    }

    frameRequested = true;

    window.requestAnimationFrame(() => {
      updateCurrentSection();
      frameRequested = false;
    });
  };

  window.addEventListener(
    "scroll",
    requestUpdate,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    requestUpdate
  );

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.dataset.communitySectionLink;

      const item = sections.find(
        (candidate) => candidate.id === id
      );

      if (item) {
        setActive(item);
      }
    });
  });

  setActive(sections[0]);
})();
