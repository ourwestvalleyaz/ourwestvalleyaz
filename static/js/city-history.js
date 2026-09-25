"use strict";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-history-toggle]").forEach((button) => {
    const history = button.closest(".city-history");
    if (!history) return;

    const timelineId = button.getAttribute("aria-controls");
    const timeline = document.getElementById(timelineId);
    if (!timeline || !history.contains(timeline)) return;

    const additionalEvents = Array.from(
      timeline.querySelectorAll(".city-history__item--additional")
    );
    const expandLabel = button.querySelector(".city-history__expand-label");
    const collapseLabel = button.querySelector(".city-history__collapse-label");

    if (!additionalEvents.length || !expandLabel || !collapseLabel) return;

    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      const nextExpanded = !expanded;

      additionalEvents.forEach((event) => {
        event.hidden = !nextExpanded;
      });

      button.setAttribute("aria-expanded", String(nextExpanded));
      expandLabel.hidden = nextExpanded;
      collapseLabel.hidden = !nextExpanded;
    });
  });
});
