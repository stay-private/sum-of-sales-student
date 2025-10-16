# Sales Summary (sum-of-sales)

A single-page web application that fetches an attached CSV file (data.csv), sums its `sales` column, sets the page title to "Sales Summary", and displays the total inside the `#total-sales` element. Built with modern best practices and styled with Bootstrap 5 from jsDelivr.

## Features

- Fetches `data.csv` from the same directory
- Robust CSV parsing (handles quoted fields and escaped quotes)
- Sums the numeric values in the `sales` column (case-insensitive)
- Displays the total in `#total-sales`
- Loads Bootstrap 5 CSS from jsDelivr CDN
- Production-ready error handling and accessible status messages

## Project Structure

- `index.html` — Single-page application shell
- `script.js` — App logic: fetch CSV, parse, sum, and render
- `style.css` — Minimal custom styles
- `data.csv` — Attached dataset consumed by the app

## Getting Started

You can open the app via HTTP locally or host it on GitHub Pages.

### Run locally

Because browsers restrict `fetch` from the `file://` protocol, use a simple static server:

- Python 3
  - `python3 -m http.server 8080`
  - Open http://localhost:8080 in your browser

- Node.js (http-server)
  - `npx http-server -p 8080`
  - Open http://localhost:8080

### Deploy to GitHub Pages

1. Push this repository to GitHub
2. In your repository settings, enable GitHub Pages for the `main` branch (root directory)
3. Visit the published URL (e.g., `https://<username>.github.io/<repo>/`)

No additional build steps are required.

## Technical Notes

- Title is set to `Sales Summary` in HTML and enforced at runtime
- Bootstrap 5 CSS is loaded from jsDelivr: `cdn.jsdelivr.net`
- CSV is fetched from `./data.csv` with a timeout and `no-cache` to reduce stale content issues
- The CSV parser tolerates quoted fields and escaped quotes and skips empty lines
- Non-numeric cells in the `sales` column are ignored; errors fail gracefully with a clear status message

## Accessibility

- Live region (`aria-live="polite"`) communicates loading and error states
- Focus-visible styles added for keyboard navigation

## Security and Performance

- No external JavaScript dependencies beyond optional Bootstrap JS (not required)
- Fetch uses `same-origin` credentials and a request timeout
- Minimal bundle size; no frameworks required

## License

This project is provided as-is for demonstration/testing purposes.
