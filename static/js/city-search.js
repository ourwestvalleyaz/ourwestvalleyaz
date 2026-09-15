(() => {
  "use strict";

  const SEARCH_INDEX_URL = "/search/index.json";
  const MAX_RESULTS = 12;
  const MAX_PAGE_RESULTS_PER_DOCUMENT = 3;

  let indexPromise = null;
  const cityPageIndexPromises = new Map();

  const normalize = (value) =>
    String(value || "")
      .toLocaleLowerCase()
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "");

  const normalizeToken = (token) => {
    const value = normalize(token).trim();

    // Conservative singular/plural normalization for ordinary
    // alphabetic search terms. Numbers, IDs, fiscal years, and
    // short terms remain unchanged.
    if (/^[a-z]{4,}$/.test(value) && value.endsWith("s")) {
      return value.slice(0, -1);
    }

    return value;
  };

  const tokenize = (query) =>
    normalize(query)
      .split(/\s+/)
      .map(normalizeToken)
      .filter(Boolean);

  const recordType = (record) =>
    record.type || record.content_type || "";

  const recordPageNumber = (record) =>
    record.page || record.page_number || null;

  const loadIndex = () => {
    if (!indexPromise) {
      indexPromise = fetch(SEARCH_INDEX_URL, {
        credentials: "same-origin",
        cache: "no-cache"
      }).then((response) => {
        if (!response.ok) {
          throw new Error(
            `Search index request failed: ${response.status}`
          );
        }

        return response.json();
      });
    }

    return indexPromise;
  };

  const loadCityPageIndex = (cityID) => {
    if (!cityPageIndexPromises.has(cityID)) {
      const url =
        `/search/${encodeURIComponent(cityID)}/pages-index.json`;

      const promise = fetch(url, {
        credentials: "same-origin",
        cache: "no-cache"
      }).then((response) => {
        if (response.status === 404) {
          return { records: [] };
        }

        if (!response.ok) {
          throw new Error(
            `City page index request failed: ${response.status}`
          );
        }

        return response.json();
      });

      cityPageIndexPromises.set(cityID, promise);
    }

    return cityPageIndexPromises.get(cityID);
  };

  const typeLabel = (record) => {
    switch (recordType(record)) {
      case "owvaz_page":
        return "OWVAZ";
      case "budget_record":
        return "Budget";
      case "public_record":
        return "Public record";
      case "public_record_page": {
        const pageNumber = recordPageNumber(record);

        return pageNumber
          ? `Public record · Page ${pageNumber}`
          : "Public record";
      }
      case "official_source":
        if (record.source_type === "official_document") {
          return "Official document";
        }

        if (record.source_type === "public_meeting_portal") {
          return "Official meeting source";
        }

        if (record.source_type === "public_procurement_portal") {
          return "Official procurement source";
        }

        return "Official City source";
      default:
        return "Result";
    }
  };

  const safeHref = (value) => {
    if (!value) {
      return null;
    }

    try {
      const url = new URL(value, window.location.origin);

      if (
        url.origin === window.location.origin ||
        url.protocol === "https:"
      ) {
        return url.href;
      }
    } catch (_) {
      return null;
    }

    return null;
  };

  const primaryHref = (record) =>
    safeHref(
      record.url ||
      record.official_url
    );

  const searchableText = (record) =>
    normalize([
      record.title,
      record.summary,
      record.text,
      record.document_type,
      record.fiscal_year
    ].filter(Boolean).join(" "));

  const scoreRecord = (record, tokens, phrase) => {
    const title = normalize(record.title);
    const summary = normalize(record.summary);
    const text = searchableText(record);
    const normalizedTokens = tokenize(text);

    let score = 0;

    if (phrase && title === phrase) {
      score += 100;
    } else if (phrase && title.includes(phrase)) {
      score += 60;
    }

    if (phrase && summary.includes(phrase)) {
      score += 25;
    }

    if (phrase && text.includes(phrase)) {
      score += 10;
    }

    for (const token of tokens) {
      const matched =
        text.includes(token) ||
        normalizedTokens.includes(token);

      if (!matched) {
        return -1;
      }

      if (title.includes(token)) {
        score += 20;
      } else if (summary.includes(token)) {
        score += 8;
      } else {
        score += 2;
      }
    }

    if (recordType(record) === "owvaz_page") {
      score += 3;
    }

    return score;
  };

  const makeSnippet = (record, tokens) => {
    const preferredSource =
      recordType(record) === "public_record_page"
        ? record.text || record.summary || ""
        : record.summary || record.text || "";

    const source = String(preferredSource)
      .replace(/\s+/g, " ")
      .trim();

    if (!source) {
      return "";
    }

    const lower = normalize(source);
    const normalizedTokens = tokens.map(normalizeToken);

    let bestPosition = -1;
    let bestMatches = 0;

    for (let i = 0; i < lower.length; i += 1) {
      const windowEnd = Math.min(lower.length, i + 320);
      const windowText = lower.slice(i, windowEnd);

      let matches = 0;

      for (const token of normalizedTokens) {
        if (
          windowText.includes(token) ||
          tokenize(windowText).includes(token)
        ) {
          matches += 1;
        }
      }

      if (matches > bestMatches) {
        bestMatches = matches;
        bestPosition = i;

        if (matches === normalizedTokens.length) {
          break;
        }
      }
    }

    if (bestPosition === -1 || bestMatches === 0) {
      return source.length > 220
        ? `${source.slice(0, 217)}...`
        : source;
    }

    const start = Math.max(0, bestPosition - 80);
    const end = Math.min(source.length, bestPosition + 240);

    let snippet = source.slice(start, end).trim();

    if (start > 0) {
      snippet = `...${snippet}`;
    }

    if (end < source.length) {
      snippet = `${snippet}...`;
    }

    return snippet;
  };

  const renderResult = (record, tokens) => {
    const article = document.createElement("article");
    article.className = "city-search-result";

    const meta = document.createElement("div");
    meta.className = "city-search-result__meta";
    meta.textContent = typeLabel(record);
    article.append(meta);

    const title = document.createElement("h3");
    title.className = "city-search-result__title";

    const href = primaryHref(record);

    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = record.title;

      if (new URL(href).origin !== window.location.origin) {
        link.rel = "noopener";
      }

      title.append(link);
    } else {
      title.textContent = record.title;
    }

    article.append(title);

    const details = [];

    if (record.fiscal_year) {
      details.push(record.fiscal_year);
    }

    if (record.document_date) {
      details.push(record.document_date);
    }

    if (details.length) {
      const detail = document.createElement("div");
      detail.className = "city-search-result__details";
      detail.textContent = details.join(" · ");
      article.append(detail);
    }

    const snippetText = makeSnippet(record, tokens);

    if (snippetText) {
      const snippet = document.createElement("p");
      snippet.className = "city-search-result__snippet";
      snippet.textContent = snippetText;
      article.append(snippet);
    }

    const links = document.createElement("div");
    links.className = "city-search-result__links";

    const primary = primaryHref(record);

    if (primary) {
      const a = document.createElement("a");
      a.href = primary;

      if (recordType(record) === "owvaz_page") {
        a.textContent = "View on OWVAZ";
      } else if (recordType(record) === "budget_record") {
        a.textContent = "View budget";
      } else {
        a.textContent = "Open source";
      }

      if (new URL(primary).origin !== window.location.origin) {
        a.rel = "noopener";
      }

      links.append(a);
    }

    const official = safeHref(record.official_url);

    if (
      official &&
      official !== primary &&
      recordType(record) !== "public_record_page"
    ) {
      const a = document.createElement("a");
      a.href = official;
      a.textContent = "Original City source";
      a.rel = "noopener";
      links.append(a);
    }

    if (links.childElementCount) {
      article.append(links);
    }

    return article;
  };

  const selectVisibleResults = (matches) => {
    const visible = [];
    const pageCounts = new Map();

    for (const item of matches) {
      const record = item.record;

      if (
        recordType(record) === "public_record_page" &&
        record.document_id
      ) {
        const count = pageCounts.get(record.document_id) || 0;

        if (count >= MAX_PAGE_RESULTS_PER_DOCUMENT) {
          continue;
        }

        pageCounts.set(record.document_id, count + 1);
      }

      visible.push(item);

      if (visible.length >= MAX_RESULTS) {
        break;
      }
    }

    return visible;
  };

  const initSearch = (root) => {
    const cityID = root.dataset.cityId || "";
    const isGlobalSearch = root.hasAttribute("data-global-search");
    const cityName = root.dataset.cityName || "this city";
    const form = root.querySelector("[data-city-search-form]");
    const input = root.querySelector("[data-city-search-input]");
    const status = root.querySelector("[data-city-search-status]");
    const results = root.querySelector("[data-city-search-results]");

    if (
      (!cityID && !isGlobalSearch) ||
      !form ||
      !input ||
      !status ||
      !results
    ) {
      return;
    }

    const clear = () => {
      results.replaceChildren();
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const query = input.value.trim();
      const tokens = tokenize(query);
      const phrase = normalize(query);

      clear();

      if (!tokens.length) {
        status.textContent = isGlobalSearch
          ? "Enter a search term to search OWVAZ."
          : `Enter a search term to search ${cityName}.`;
        input.focus();
        return;
      }

      status.textContent = isGlobalSearch
        ? "Searching OWVAZ..."
        : `Searching ${cityName}...`;

      try {
        const payload = await loadIndex();

        const canonicalRecords =
          Array.isArray(payload.records)
            ? payload.records
            : [];

        let records = canonicalRecords;

        if (!isGlobalSearch) {
          const cityPagePayload =
            await loadCityPageIndex(cityID);

          const pageRecords =
            Array.isArray(cityPagePayload.records)
              ? cityPagePayload.records
              : [];

          records = [
            ...canonicalRecords,
            ...pageRecords
          ];
        }

        const scopedRecords = isGlobalSearch
          ? records
          : records.filter(
              (record) => record.city_id === cityID
            );

        const matches = scopedRecords
          .map((record) => ({
            record,
            score: scoreRecord(record, tokens, phrase)
          }))
          .filter((item) => item.score >= 0)
          .sort((a, b) =>
            b.score - a.score ||
            String(a.record.title).localeCompare(
              String(b.record.title)
            )
          );

        if (!matches.length) {
          status.textContent = isGlobalSearch
            ? `No indexed OWVAZ results found for “${query}”.`
            : `No indexed ${cityName} results found for “${query}”.`;
          return;
        }

        const visible = selectVisibleResults(matches);

        status.textContent = isGlobalSearch
          ? `${matches.length} indexed OWVAZ result` +
            `${matches.length === 1 ? "" : "s"} found.`
          : `Showing the most relevant ${cityName} results.`;

        const fragment = document.createDocumentFragment();

        for (const { record } of visible) {
          fragment.append(renderResult(record, tokens));
        }

        results.append(fragment);

        if (matches.length > visible.length) {
          const note = document.createElement("p");
          note.className = "city-search__more";
          note.textContent =
            `Showing ${visible.length} of ${matches.length} results. ` +
            "Results are limited per source document to keep the list useful. " +
            "Refine your search to narrow the list.";
          results.append(note);
        }
      } catch (error) {
        console.error(error);

        status.textContent =
          "Search is temporarily unavailable. " +
          "The rest of this page is still available.";
      }
    });
  };

  document
    .querySelectorAll("[data-city-search]")
    .forEach(initSearch);
})();
