(() => {
  const lookup = document.querySelector('.trash-service-lookup');
  if (!lookup) return;

  const hotspots = [
    ...lookup.querySelectorAll('[data-mobile-zone]')
  ];

  const result = lookup.querySelector('#mobile-zone-result');

  const panels = [
    ...lookup.querySelectorAll('[data-mobile-zone-panel]')
  ];

  const mapContainer = lookup.querySelector(
    '.trash-service-lookup__map'
  );

  const zoneMap = lookup.querySelector('.city-zone-map');

  const mobileInstruction = lookup.querySelector(
    '.trash-zone-map__mobile-instruction'
  );

  if (
    !hotspots.length ||
    !result ||
    !panels.length ||
    !mapContainer ||
    !zoneMap ||
    !mobileInstruction
  ) return;

  const mobileQuery = window.matchMedia('(max-width: 700px)');

  function showZone(zone) {
    if (!mobileQuery.matches) return;

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.mobileZonePanel !== zone;
    });

    if (zone === 'A' || zone === 'B') {
      mapContainer.insertBefore(result, mobileInstruction);
    } else {
      zoneMap.insertAdjacentElement('afterend', result);
    }

    result.hidden = false;

    requestAnimationFrame(() => {
      result.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    });
  }

  hotspots.forEach((hotspot) => {
    hotspot.addEventListener('click', (event) => {
      if (!mobileQuery.matches) return;

      event.preventDefault();
      showZone(hotspot.dataset.mobileZone);
    });
  });

  function syncMode() {
    if (!mobileQuery.matches) {
      result.hidden = true;

      panels.forEach((panel) => {
        panel.hidden = true;
      });
    }
  }

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', syncMode);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(syncMode);
  }

  syncMode();
})();
