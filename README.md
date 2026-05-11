# CarFinance Web — Deal Tracker

A React + Vite progressive web app for tracking and comparing car purchase and lease deals.
All deal data is stored locally in `localStorage` — no account required.
An optional Express API layer powers AI-assisted deal analysis and can serve the built UI as a single deployable container.

## Stack

| Layer | Choice |
|---|---|
| UI framework | React 19 + React Router v7 |
| Build tool | Vite 8 |
| Component library | MUI v9 + MUI Icons |
| Styling | MUI theme + Emotion |
| State / data | React Context + localStorage |
| Markdown rendering | react-markdown + remark-gfm |
| API server | Express 5 (Node 22) |
| AI | Vercel AI SDK + OpenAI |
| MCP | `@modelcontextprotocol/sdk` |
| Infrastructure | AWS CDK (ECS Fargate + ALB) |
| Language | TypeScript throughout |

## Monorepo Structure

This is an npm workspaces monorepo with three packages and a shared types package.

```
carfinance-web/
├── package.json          # Root — workspace scripts + Docker commands
│
├── common/               # Shared TypeScript types (BaseDeal, LeaseDeal, PurchaseDeal, …)
│   └── src/
│       └── types.d.ts
│
├── ui/                   # React SPA (Vite)
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── router.tsx
│       ├── theme.tsx
│       ├── types.ts          # Re-exports from common + UI-only types
│       │
│       ├── context/
│       │   ├── DealsContext.tsx   # Global purchase + lease state (localStorage)
│       │   └── UserContext.tsx    # Auth / user session
│       │
│       ├── hooks/
│       │   └── useAnalyzeDeal.ts  # Calls /api/agent for AI analysis
│       │
│       ├── utils/
│       │   ├── calculations.ts    # All financial math (purchase + lease, incl. rolled-in variant)
│       │   ├── defaults.ts        # Default form values + constants
│       │   └── storage.ts         # localStorage read/write helpers
│       │
│       ├── pages/
│       │   ├── PurchasePage.tsx
│       │   ├── LeasePage.tsx
│       │   ├── ComparisonPage.tsx
│       │   └── DealDetailPage.tsx
│       │
│       └── components/
│           ├── shared/
│           │   ├── DealCard.tsx        # Card shown in list views (standard + rolled-in stats)
│           │   ├── DealDetail.tsx      # Read-only deal detail
│           │   ├── DealBadge.tsx
│           │   ├── DealQualityBadge.tsx
│           │   ├── StatTile.tsx
│           │   ├── Button.tsx
│           │   ├── EmptyCard.tsx
│           │   ├── MarkdownContent.tsx
│           │   └── NotesField.tsx
│           ├── layout/
│           │   ├── layout.tsx
│           │   ├── nav.tsx
│           │   ├── page-header.tsx
│           │   ├── mobile-header.tsx
│           │   └── mobile-footer.tsx
│           ├── Purchase/
│           │   └── PurchaseForm.tsx
│           ├── Lease/
│           │   └── LeaseForm.tsx       # Live preview with standard + rolled-in rows
│           ├── Comparison/
│           │   ├── ComparisonPicker.tsx
│           │   └── ComparisonGrid.tsx
│           └── Export/
│               └── ExportPanel.tsx     # Plain-text + CSV export
│
├── api/                  # Express API server
│   ├── Dockerfile        # Multi-stage build — produces single image serving UI + API
│   └── src/
│       ├── index.ts      # Server entry: health, /api/version, /api/mcp, /api/agent, static UI
│       ├── agent.ts      # AI deal analysis (Vercel AI SDK + OpenAI)
│       ├── mcp.ts        # MCP request handler
│       ├── systemPrompt.ts
│       └── logger.ts     # Winston logger
│
└── infra/                # AWS CDK stack
    └── lib/
        └── api-stack.ts  # ECS Fargate + ALB deploying the Docker image
```

## Getting Started

### Prerequisites

- Node.js 22+ and npm 10+
- Docker (for the containerised build)
- An OpenAI API key (only needed for AI analysis features)

### Install dependencies

```bash
npm install
```

### Run the UI dev server

```bash
npm run dev          # starts Vite on http://localhost:5173
```

### Run the API dev server

```bash
npm run dev:api      # starts Express on http://localhost:3000 (serves UI from ui/dist)
```

The API server also serves the built UI as static files, so you need to `npm run build` the UI first if you want to hit it through the API server.

## Docker

The `api/Dockerfile` is a two-stage build:

1. **Builder** — installs all deps, builds both `ui` and `api`
2. **Production** — installs prod-only deps, copies compiled output, exposes port 3000

```bash
# Build the image
npm run build:docker
# → docker build -f api/Dockerfile -t carfinance-api .

# Run the container
npm run start:docker
# → docker run -p 3000:3000 -e OPENAI_API_KEY -e LOG_LEVEL carfinance-api
```

The container serves the React SPA as static files and exposes the API at `/api/*`.

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | For AI features | — | OpenAI key used by the agent endpoint |
| `LOG_LEVEL` | No | `info` | Winston log level (`debug`, `info`, `warn`, `error`) |
| `PORT` | No | `3000` | Port the Express server listens on |
| `NODE_ENV` | No | — | Set to `production` automatically in the Docker image |

## Infrastructure (AWS CDK)

The `infra/` package deploys the Docker image to ECS Fargate behind an Application Load Balancer.

```bash
npm run infra:synth    # cdk synth — preview the CloudFormation template
npm run infra:diff     # cdk diff — compare with deployed stack
npm run infra:deploy   # cdk deploy — push to AWS
npm run infra:destroy  # cdk destroy — tear down
```

The stack creates a VPC, ECS cluster, Fargate service (256 CPU / 512 MB), and a public ALB.
The `OPENAI_API_KEY` secret must be injected separately (e.g. via ECS task environment or Secrets Manager).

## Lease Calculations

Two lease payment variants are available in `ui/src/utils/calculations.ts`:

**Standard** (`leaseMonthlyPayment` / `leaseDueAtSigning`)
Dealer fees, acquisition fee, and down payment are paid upfront at signing.

**Fees rolled in** (`leaseRolledMonthlyPayment` / `leaseRolledDueAtSigning`)
Dealer fees and acquisition fee are rolled into the cap cost, increasing the monthly payment.
Due at signing is reduced to first month + government fees (tags / registration) only.

Both variants are shown side-by-side on each lease deal card and in the lease form live preview.

## localStorage Notes

- Purchases stored under `carfinance:purchases`, leases under `carfinance:leases`
- Each key holds a JSON array of deal objects
- Typical browser limit: **5–10 MB per origin** — sufficient for hundreds of deals
- Data is per-browser, per-device — no sync between devices
- Clearing browser site data will erase all deals

## PWA — Install to Home Screen

### iPhone / Safari
1. Open in Safari → Share → "Add to Home Screen"

### Android / Chrome
1. Open in Chrome → three-dot menu → "Add to Home Screen"

### Desktop
Look for the install icon in the address bar (Chrome / Edge).
