"use strict";

// script.js - Single Page App logic for summing the 'sales' column from data.csv
// Enhanced to show per-product totals, currency selection via rates.json, and region filtering.
(function () {
  const TOTAL_SELECTOR = "#total-sales";
  const STATUS_SELECTOR = "#status";
  const TABLE_BODY_SELECTOR = "#product-sales tbody";
  const CURRENCY_PICKER = "#currency-picker";
  const REGION_FILTER = "#region-filter";
  const TOTAL_CURRENCY = "#total-currency";

  const CSV_URL = "./data.csv"; // Relative path to attachment
  const RATES_URL = "./rates.json";
  const FETCH_TIMEOUT_MS = 10000; // 10 seconds timeout

  let rawRows = [];
  let rates = {};
  let selectedRegion = "all";
  let selectedCurrency = "INR";

  /** Utility: Set status message */
  function setStatus(message, type = "info") {
    const el = document.querySelector(STATUS_SELECTOR);
    if (!el) return;

    const classes = {
      info: "alert alert-info",
      success: "alert alert-success",
      warning: "alert alert-warning",
      danger: "alert alert-danger",
      muted: "text-muted",
    };

    if (message === "" || message == null) {
      el.className = "";
      el.innerHTML = "";
      return;
    }

    const className = classes[type] || classes.info;
    el.className = className;
    el.textContent = message;
  }

  /** Fetch with timeout */
  async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  /** Basic robust CSV parser supporting quoted fields */
  function parseCSV(text) {
    const rows = [];
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    if (!lines.length) return { headers: [], rows: [] };

    const parseLine = (line) => {
      const fields = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"') {
            if (line[i + 1] === '"') { // escaped quote
              cur += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else {
            cur += ch;
          }
        } else {
          if (ch === ',') {
            fields.push(cur);
            cur = "";
          } else if (ch === '"') {
            inQuotes = true;
          } else {
            cur += ch;
          }
        }
      }
      fields.push(cur);
      return fields;
    };

    // Skip empty leading lines
    let headerLineIndex = 0;
    while (headerLineIndex < lines.length && lines[headerLineIndex].trim() === "") headerLineIndex++;
    if (headerLineIndex >= lines.length) return { headers: [], rows: [] };

    const headers = parseLine(lines[headerLineIndex]).map((h) => h.trim());

    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim() === "") continue;
      const cols = parseLine(line);
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = cols[j] != null ? cols[j] : "";
      }
      rows.push(obj);
    }
    return { headers, rows };
  }

  function coerceRow(row) {
    // Case-insensitive column handling
    const map = {};
    for (const k of Object.keys(row)) map[k.toLowerCase()] = row[k];
    const product = map["product"] || map["item"] || map["name"] || "Unknown";
    const region = map["region"] || map["area"] || "";
    const rawSales = map["sales"] ?? map["amount"] ?? map["total"] ?? "0";
    const sales = typeof rawSales === "number" ? rawSales : parseFloat(String(rawSales).replace(/[^0-9.\-]/g, "")) || 0;
    return { product, region, sales };
  }

  function getRate(code) {
    const r = rates && Object.prototype.hasOwnProperty.call(rates, code) ? Number(rates[code]) : NaN;
    return Number.isFinite(r) && r > 0 ? r : 1;
  }

  function buildRegionFilter() {
    const select = document.querySelector(REGION_FILTER);
    if (!select) return;
    select.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "All Regions";
    select.appendChild(optAll);

    const regions = Array.from(new Set(rawRows.map((r) => r.region).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    regions.forEach((reg) => {
      const opt = document.createElement("option");
      opt.value = reg;
      opt.textContent = reg;
      select.appendChild(opt);
    });

    // Default to All Regions
    select.value = "";
    selectedRegion = "all";

    select.addEventListener("change", () => {
      selectedRegion = select.value || "all";
      render();
    });
  }

  function buildCurrencyPicker() {
    const picker = document.querySelector(CURRENCY_PICKER);
    if (!picker) return;
    picker.innerHTML = "";
    const entries = Object.entries(rates);
    entries.forEach(([code]) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code;
      picker.appendChild(opt);
    });

    // Default currency is INR if present, else first available
    if (rates && Object.prototype.hasOwnProperty.call(rates, "INR")) {
      picker.value = "INR";
    } else if (entries.length) {
      picker.value = entries[0][0];
    }
    selectedCurrency = picker.value;

    picker.addEventListener("change", () => {
      selectedCurrency = picker.value;
      render();
    });
  }

  function getFilteredRows() {
    if (selectedRegion === "all") return rawRows;
    return rawRows.filter((r) => r.region === selectedRegion);
  }

  function formatNumberForTable(x) {
    // Avoid thousands separators so machine parsing stays reliable
    const isInt = Math.abs(x - Math.round(x)) < 1e-9;
    return isInt ? String(Math.round(x)) : x.toFixed(2);
  }

  function formatNumberForTotal(x) {
    try {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(x);
    } catch (_) {
      return formatNumberForTable(x);
    }
  }

  function render() {
    const rate = getRate(selectedCurrency);
    const filtered = getFilteredRows();

    // Update total
    const totalRaw = filtered.reduce((acc, r) => acc + r.sales, 0);
    const totalConverted = totalRaw * rate;

    const totalEl = document.querySelector(TOTAL_SELECTOR);
    if (totalEl) {
      totalEl.textContent = formatNumberForTotal(totalConverted);
      totalEl.dataset.region = selectedRegion === "all" ? "all" : selectedRegion;
    }

    const curEl = document.querySelector(TOTAL_CURRENCY);
    if (curEl) curEl.textContent = selectedCurrency;

    // Group by product for table
    const byProduct = new Map();
    filtered.forEach((r) => {
      const key = r.product || "Unknown";
      byProduct.set(key, (byProduct.get(key) || 0) + r.sales);
    });

    const tbody = document.querySelector(TABLE_BODY_SELECTOR);
    if (tbody) {
      tbody.innerHTML = "";
      const products = Array.from(byProduct.keys()).sort((a, b) => a.localeCompare(b));
      products.forEach((p) => {
        const tr = document.createElement("tr");
        const tdName = document.createElement("td");
        tdName.textContent = p;
        const tdTotal = document.createElement("td");
        tdTotal.className = "text-end";
        tdTotal.textContent = formatNumberForTable(byProduct.get(p) * rate);
        tr.appendChild(tdName);
        tr.appendChild(tdTotal);
        tbody.appendChild(tr);
      });
    }
  }

  async function init() {
    try {
      setStatus("Loading sales data...", "info");
      const [csvRes, ratesRes] = await Promise.all([
        fetchWithTimeout(CSV_URL),
        fetchWithTimeout(RATES_URL).catch(() => null), // tolerate missing rates
      ]);

      const csvText = await csvRes.text();
      const parsed = parseCSV(csvText);
      rawRows = parsed.rows.map(coerceRow);

      if (!rawRows.length) {
        setStatus("No rows found in CSV.", "warning");
      }

      if (ratesRes) {
        rates = await ratesRes.json();
      } else {
        rates = { INR: 1 };
      }

      buildRegionFilter();
      buildCurrencyPicker();
      render();
      setStatus("Loaded sales data.", "success");
    } catch (err) {
      console.error(err);
      setStatus(`Failed to load data: ${err && err.message ? err.message : err}`, "danger");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
