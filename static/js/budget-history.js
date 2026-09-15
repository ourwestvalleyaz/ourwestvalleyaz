(() => {
  "use strict";

  const exactMoney = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  const compactMoney = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
  });

  const svgNS = "http://www.w3.org/2000/svg";

  function makeSVG(tag, attributes = {}) {
    const node = document.createElementNS(svgNS, tag);

    Object.entries(attributes).forEach(([key, value]) => {
      node.setAttribute(key, String(value));
    });

    return node;
  }

  function rowsForMetric(records, metric) {
    return records
      .filter((row) => row.metric === metric)
      .sort(
        (a, b) =>
          Number(a.fiscal_year.slice(2)) -
          Number(b.fiscal_year.slice(2))
      );
  }

  function drawChart(container, rows) {
    if (rows.length < 2) {
      return;
    }

    const width = 760;
    const height = 285;

    const margin = {
      top: 30,
      right: 30,
      bottom: 52,
      left: 76
    };

    const chartWidth =
      width - margin.left - margin.right;

    const chartHeight =
      height - margin.top - margin.bottom;

    const values = rows.map((row) => Number(row.amount));

    let min = Math.min(...values) * 0.90;
    let max = Math.max(...values) * 1.06;

    if (min === max) {
      min *= 0.9;
      max *= 1.1;
    }

    const range = max - min;

    const x = (index) =>
      margin.left +
      (index / (rows.length - 1)) * chartWidth;

    const y = (amount) =>
      margin.top +
      ((max - amount) / range) * chartHeight;

    const svg = makeSVG("svg", {
      viewBox: `0 0 ${width} ${height}`,
      class: "budget-history__svg budget-history__desktop-chart",
      "aria-hidden": "true",
      focusable: "false"
    });

    for (let i = 0; i <= 4; i += 1) {
      const value = min + range * (i / 4);
      const yy = y(value);

      svg.appendChild(
        makeSVG("line", {
          x1: margin.left,
          x2: width - margin.right,
          y1: yy,
          y2: yy,
          class: "budget-history__grid"
        })
      );

      const label = makeSVG("text", {
        x: margin.left - 12,
        y: yy + 4,
        "text-anchor": "end",
        class: "budget-history__axis-label"
      });

      label.textContent = compactMoney.format(value);
      svg.appendChild(label);
    }

    const points = rows.map(
      (row, index) =>
        `${x(index)},${y(Number(row.amount))}`
    );

    const areaPoints = [
      `${x(0)},${margin.top + chartHeight}`,
      ...points,
      `${x(rows.length - 1)},${margin.top + chartHeight}`
    ];

    svg.appendChild(
      makeSVG("polygon", {
        points: areaPoints.join(" "),
        class: "budget-history__area"
      })
    );

    svg.appendChild(
      makeSVG("polyline", {
        points: points.join(" "),
        class: "budget-history__line",
        fill: "none"
      })
    );

    rows.forEach((row, index) => {
      const xx = x(index);
      const yy = y(Number(row.amount));

      const year = makeSVG("text", {
        x: xx,
        y: height - 20,
        "text-anchor": "middle",
        class: "budget-history__year-label"
      });

      year.textContent = row.fiscal_year;
      svg.appendChild(year);

      const group = makeSVG("g", {
        class: "budget-history__point"
      });

      const hit = makeSVG("circle", {
        cx: xx,
        cy: yy,
        r: 18,
        class: "budget-history__point-hit"
      });

      const dot = makeSVG("circle", {
        cx: xx,
        cy: yy,
        r: 5,
        class: "budget-history__point-dot"
      });

      const title = makeSVG("title");

      title.textContent =
        `${row.fiscal_year}: ${exactMoney.format(row.amount)}`;

      group.append(hit, dot, title);
      svg.appendChild(group);
    });

    container.appendChild(svg);
  }

  function drawMobileBarChart(container, rows) {
    if (rows.length < 2) {
      return;
    }

    const max = Math.max(
      ...rows.map((row) => Number(row.amount))
    );

    const chart = document.createElement("div");
    chart.className = "budget-history__mobile-bars";
    chart.setAttribute("aria-hidden", "true");

    rows.forEach((row, index) => {
      const amount = Number(row.amount);
      const percent = max > 0
        ? (amount / max) * 100
        : 0;

      const previous = index > 0
        ? Number(rows[index - 1].amount)
        : Number(row.prior_year_amount) || null;

      const yoy = previous
        ? ((amount - previous) / previous) * 100
        : null;

      const item = document.createElement("div");
      item.className = "budget-history__mobile-bar-row";

      const labels = document.createElement("div");
      labels.className = "budget-history__mobile-bar-labels";

      const year = document.createElement("a");
      year.className = "budget-history__mobile-bar-year";
      year.href =
        `/communities/${row.city_id}/budgets/${row.fiscal_year.toLowerCase()}/`;
      year.textContent = row.fiscal_year;

      const value = document.createElement("span");
      value.className = "budget-history__mobile-bar-value";
      value.textContent = exactMoney.format(amount);

      labels.append(year, value);

      const track = document.createElement("div");
      track.className = "budget-history__mobile-bar-track";

      const bar = document.createElement("div");
      bar.className = "budget-history__mobile-bar-fill";
      bar.style.width = `${percent.toFixed(2)}%`;

      track.appendChild(bar);

      const change = document.createElement("div");
      change.className = "budget-history__mobile-bar-change";

      if (yoy === null) {
        change.classList.add(
          "budget-history__mobile-bar-change--neutral"
        );
        change.textContent = "YoY —";
      } else {
        const sign = yoy > 0 ? "+" : "";

        if (yoy > 0) {
          change.classList.add(
            "budget-history__mobile-bar-change--positive"
          );
        } else if (yoy < 0) {
          change.classList.add(
            "budget-history__mobile-bar-change--negative"
          );
        } else {
          change.classList.add(
            "budget-history__mobile-bar-change--neutral"
          );
        }

        change.textContent = `${sign}${yoy.toFixed(1)}% YoY`;
      }

      item.append(labels, track, change);
      chart.appendChild(item);
    });

    container.appendChild(chart);
  }


  function updateTable(table, rows, label) {
    const caption = table.querySelector("caption");
    const tbody = table.querySelector("tbody");

    if (!tbody) {
      return;
    }

    if (caption) {
      caption.textContent = "Adopted budget history";
    }

    tbody.replaceChildren();

    let previous = null;

    rows.forEach((row) => {
      const tr = document.createElement("tr");

      const fy = document.createElement("th");
      fy.scope = "row";

      const fyLink = document.createElement("a");
      fyLink.href =
        `/communities/${row.city_id}/budgets/${row.fiscal_year.toLowerCase()}/`;
      fyLink.textContent = row.fiscal_year;

      fy.appendChild(fyLink);

      const amount = document.createElement("td");
      amount.textContent = exactMoney.format(row.amount);

      const mayor = document.createElement("td");
      mayor.textContent = row.mayor_at_adoption || "—";

      const change = document.createElement("td");

      if (!previous && Number(row.prior_year_amount) > 0) {
        previous = {
          amount: Number(row.prior_year_amount)
        };
      }

      if (previous) {
        const pct =
          ((row.amount - previous.amount) /
            previous.amount) *
          100;

        change.textContent =
          `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
      } else {
        change.textContent = "—";
      }

      tr.append(fy, amount, mayor, change);
      tbody.appendChild(tr);

      previous = row;
    });
  }

  function updateSummary(root, rows) {
    const summary = root.querySelector(
      "[data-budget-history-summary]"
    );

    if (rows.length < 2) {
      return;
    }

    const first = rows[0];
    const last = rows[rows.length - 1];

    const change = last.amount - first.amount;
    const pct = (change / first.amount) * 100;

    let direction = "did not change";

    if (change > 0) {
      direction = "increased";
    } else if (change < 0) {
      direction = "decreased";
    }

    if (summary) {
      summary.textContent =
        `From ${first.fiscal_year} to ${last.fiscal_year}, ` +
        `this measure ${direction} ` +
        `${Math.abs(pct).toFixed(1)}%.`;
    }

  }

  function init(root) {
    const dataNode = root.querySelector(
      "[data-budget-history-data]"
    );

    const chart = root.querySelector(
      "[data-budget-history-chart]"
    );

    const table = root.querySelector(
      "[data-budget-history-table]"
    );

    const buttons = Array.from(
      root.querySelectorAll("[data-budget-metric]")
    );

    if (!dataNode || !chart || !table) {
      return;
    }

    let records;

    try {
      records = JSON.parse(dataNode.textContent);
    } catch {
      return;
    }

    function activate(metric) {
      const rows = rowsForMetric(records, metric);

      if (rows.length < 2) {
        return;
      }

      buttons.forEach((button) => {
        const active =
          button.dataset.budgetMetric === metric;

        button.classList.toggle(
          "is-active",
          active
        );

        button.setAttribute(
          "aria-pressed",
          active ? "true" : "false"
        );
      });

      const activeButton = buttons.find(
        (button) =>
          button.dataset.budgetMetric === metric
      );

      const label = activeButton
        ? activeButton.textContent.trim()
        : metric;

      chart.replaceChildren();

      drawChart(chart, rows);
      drawMobileBarChart(chart, rows);

      updateTable(table, rows, label);
      updateSummary(root, rows);
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        activate(button.dataset.budgetMetric);
      });
    });

    const initialButton =
      buttons.find(
        (button) =>
          button.classList.contains("is-active")
      ) || buttons[0];

    const availableMetrics = Array.from(
      new Set(records.map((row) => row.metric))
    );

    const initialMetric = initialButton
      ? initialButton.dataset.budgetMetric
      : (
          availableMetrics.includes("total_budget")
            ? "total_budget"
            : availableMetrics[0]
        );

    if (initialMetric) {
      activate(initialMetric);
    }
  }

  document
    .querySelectorAll("[data-budget-history]")
    .forEach(init);
})();

/* OWVAZ budget-history semantic change coloring
 *
 * The server-rendered desktop table already includes a signed YoY
 * percentage. The interactive history can also rebuild that table.
 * Reapply the same semantic direction treatment whenever its DOM changes.
 */
(() => {
  const applyBudgetHistoryChangeColors = (root) => {
    const table = root.querySelector("table");

    if (!table) {
      return;
    }

    const headerCells = Array.from(
      table.querySelectorAll("thead th")
    );

    const changeIndex = headerCells.findIndex((cell) =>
      cell.textContent.trim().toLowerCase().includes("yoy change")
    );

    if (changeIndex < 0) {
      return;
    }

    table.querySelectorAll("tbody tr").forEach((row) => {
      const cells = row.querySelectorAll("th, td");
      const cell = cells[changeIndex];

      if (!cell) {
        return;
      }

      cell.classList.add("budget-history__change");
      cell.classList.remove(
        "budget-history__change--positive",
        "budget-history__change--negative",
        "budget-history__change--neutral"
      );

      const text = cell.textContent.trim();

      if (text.startsWith("+")) {
        cell.classList.add(
          "budget-history__change--positive"
        );
      } else if (text.startsWith("-")) {
        cell.classList.add(
          "budget-history__change--negative"
        );
      } else {
        cell.classList.add(
          "budget-history__change--neutral"
        );
      }
    });
  };

  const initialize = () => {
    document
      .querySelectorAll("[data-budget-history]")
      .forEach((root) => {
        applyBudgetHistoryChangeColors(root);

        const observer = new MutationObserver(() => {
          applyBudgetHistoryChangeColors(root);
        });

        observer.observe(root, {
          childList: true,
          subtree: true
        });
      });
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();

