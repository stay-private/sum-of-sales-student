# Sales Summary SPA

A simple single-page application that fetches data.csv, summarizes sales, and now also provides per-product totals, currency conversion, and region filtering.

What it does
- Loads sales data from data.csv
- Displays overall total sales
- Shows a Bootstrap table of per-product totals (#product-sales)
- Lets you pick a currency from rates.json via the #currency-picker
- Lets you filter results by region via the #region-filter, which updates both the overall total and the per-product table
- Sets a data-region attribute on the #total-sales element to reflect the active region

Getting started
1. Serve the directory over HTTP (for example):
   - Using Node: npx serve .
   - Using Python: python3 -m http.server 8000
2. Open http://localhost:8000 in your browser.

Files
- index.html: App markup with controls and containers
- script.js: App logic (CSV parsing, rendering, currency and region handling)
- style.css: Minimal styling (on top of Bootstrap 5)
- data.csv: Example dataset used by the app
- rates.json: Currency conversion rates used by the currency picker

Data requirements
- The CSV is expected to contain at least a sales column. If product and region columns exist, they are used for grouping and filtering.
  - Recognized headers (case-insensitive): product, region, sales

Accessibility
- Live region updates via aria-live on the main container
- Clear focus styles and semantic HTML

Notes
- The currency picker is populated from rates.json (e.g., USD, EUR, INR). INR is the default if present.
- The per-product totals and overall total are converted to the chosen currency. The per-product table values are kept in a plain numeric format to ease machine parsing.

License
- MIT


## Round 2 Updates
### New Requirements:
Enhance the sales page: add a Bootstrap table #product-sales showing per-product totals, introduce a currency selector #currency-picker using rates.json, and add a region filter #region-filter that updates #total-sales and sets data-region.

### New Checks:
- document.querySelectorAll("#product-sales tbody tr").length >= 1
- (() => { const rows = [...document.querySelectorAll("#product-sales tbody tr td:last-child")]; const sum = rows.reduce((acc, cell) => acc + parseFloat(cell.textContent), 0); return Math.abs(sum - 510) < 0.01; })()
- !!document.querySelector("#currency-picker option[value='USD']")
- !!document.querySelector("#total-currency")
- document.querySelector("#region-filter").tagName === "SELECT"
- document.querySelector("#total-sales").dataset.region !== undefined
