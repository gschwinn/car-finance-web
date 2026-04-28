# CarFinance Web — PWA Deal Tracker

A React + Vite + Tailwind CSS progressive web app that mirrors the CarFinance iOS app.  
All data is stored locally in `localStorage` — no backend, no account required.

## Stack

| Layer       | Choice                        |
|-------------|-------------------------------|
| Framework   | React 18 + React Router v6    |
| Build tool  | Vite 5                        |
| Styling     | Tailwind CSS 3                |
| State/data  | React Context + localStorage  |
| PWA         | vite-plugin-pwa + Workbox     |
| Icons       | lucide-react                  |

## Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Project Structure

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Root layout + routing + nav
├── index.css                   # Tailwind directives + component classes
│
├── context/
│   └── DealsContext.jsx        # Global state (purchases + leases)
│
├── utils/
│   ├── calculations.js         # All financial math (mirrors Swift computed props)
│   ├── storage.js              # localStorage read/write + file download
│   └── defaults.js             # Default form values + constants
│
├── pages/
│   ├── PurchasePage.jsx        # Purchase list + modals
│   ├── LeasePage.jsx           # Lease list + modals
│   └── ComparisonPage.jsx      # Comparison grid + export
│
└── components/
    ├── shared/
    │   ├── UI.jsx              # Modal, EmptyState, StatTile, FormField, etc.
    │   ├── DealCard.jsx        # Card used in both list views
    │   └── DealDetail.jsx      # Full read-only deal detail (used in modal)
    ├── Purchase/
    │   └── PurchaseForm.jsx    # Create/edit purchase form
    ├── Lease/
    │   └── LeaseForm.jsx       # Create/edit lease form
    ├── Comparison/
    │   ├── ComparisonPicker.jsx # Deal selection sheet
    │   └── ComparisonGrid.jsx  # Side-by-side grid with best-value highlighting
    └── Export/
        └── ExportPanel.jsx     # Plain text + CSV export with copy/download/share
```

## PWA — Install to Home Screen

### iPhone / Safari
1. Open the app in Safari
2. Tap the Share button → "Add to Home Screen"
3. The app will launch full-screen (standalone mode)

### Android / Chrome
1. Open in Chrome
2. Tap the three-dot menu → "Add to Home Screen" (or look for the install banner)

### Desktop Chrome/Edge
Look for the install icon (⊕) in the address bar.

## localStorage Notes

- Data is stored under two keys: `carfinance:purchases` and `carfinance:leases`
- Each key holds a JSON array of deal objects
- Typical limit: **5–10 MB per origin** (sufficient for hundreds of deals)
- Data is **per browser, per device** — no sync between devices
- Clearing browser data / site data will erase all deals

## Extending

### Adding a new field to PurchaseDeal
1. Add the field to `defaultPurchase()` in `utils/defaults.js`
2. Add the input to `PurchaseForm.jsx`
3. Add it to `purchaseSummaryRows()` in `utils/calculations.js`
4. It will automatically appear in DealDetail and exports

### Switching to IndexedDB (for larger datasets)
Replace the functions in `utils/storage.js` with an IndexedDB wrapper  
(e.g. `idb` npm package). The Context and components don't need changes.

### Adding cloud sync
Replace or augment the `savePurchases`/`saveLeases` calls in `DealsContext.jsx`  
with API calls. localStorage can remain as the offline cache.
