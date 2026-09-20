<div align="center">

# CPF Generator

**Generate valid Brazilian CPF numbers in bulk — pick the issuing state, fill your own spreadsheet layout, export to `.xlsx` or `.csv`.**

Built for QA engineers and developers who need realistic test data for Brazilian systems.
Everything runs in the browser: no back-end, no API, no data ever leaves the machine.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Node](https://img.shields.io/badge/Node-20.x-339933?logo=node.js&logoColor=white)

</div>

---

## The problem

Testing any Brazilian system means feeding it CPFs. Not random 11-digit strings — the
validator on the other side rejects those. You need numbers that pass the mod-11 check,
and often numbers tied to a **specific state**, because the 9th digit encodes the fiscal
region where the document was issued.

Most generators hand you one number at a time, with no control over origin and no way to
get the output into the spreadsheet your team actually works from.

This one generates **thousands at once**, per-state, and writes them straight into *your*
spreadsheet template.

---

## Features

- **Valid by construction** — check digits computed with the official mod-11 algorithm, so every number passes real validators.
- **State-controlled origin** — choose any of the 27 UFs, or let it randomize. The 9th digit is set to that state's fiscal region.
- **Batch configuration** — stack multiple lots in one run, each with its own quantity (up to 1,000), state and naming rule.
- **Optional names** — fully random, or seeded with a prefix you type ("Maria" → "Maria Santos").
- **Formatted or raw** — toggle between `123.456.789-09` and `12345678909`.
- **Selective regeneration** — don't like a row? Select it and swap just that CPF, keeping its state and mask.
- **Spreadsheet template import** — upload your own `.xlsx` / `.xls` / `.csv` and the export comes back in that exact layout.
- **Export & copy** — `.xlsx`, `.csv`, or copy any column to the clipboard.
- **Zero data exposure** — no server, no telemetry. Uploaded spreadsheets are parsed in-memory, client-side.

<details>
<summary><b>How the spreadsheet template import works</b></summary>

<br>

Upload a spreadsheet and the app treats it as the layout for every export — instead of
dumping a generic 3-column table, it writes results into the columns your file already has.

**Header detection is deliberately forgiving.** Real-world spreadsheets are messy, so the
parser scans the **first 10 rows** looking for a header, and matches column names after
normalizing case, accents and punctuation. `Nº CPF`, `numero do cpf` and `CPF` all resolve
to the same column.

| Target column | Accepted headers |
|---|---|
| Name | `Nome`, `Nome Completo`, `Cliente`, `Nome do Cliente`, `Name`, `Full Name` |
| CPF | `CPF`, `Nº CPF`, `Documento`, `Doc`, `Número do CPF` |
| State | `Estado`, `UF`, `Sigla UF`, `State` |

**Rules the filler follows:**

- Only those three columns are touched. **No columns are created**, and everything else in the sheet is preserved as-is.
- Existing data rows consume results in order, writing **only into empty cells** — a row that already has a name keeps it.
- Blank rows between data rows are preserved and skipped, not filled.
- Results that don't fit into existing rows are appended as new rows at the end.
- The template stays active across generations until you explicitly remove it.

**Edge cases handled:**

- **Leading zeros** — Excel stores `01234567890` as a number and drops the zero. Values with 9–10 digits are re-padded back to 11.
- **Legacy encoding** — Excel pt-BR saves CSV as Windows-1252. The parser tries strict UTF-8 first, then falls back.
- **Trailing blank rows** — Excel's inflated "used range" is trimmed instead of producing thousands of empty rows.
- **CSV separator** — exports use `;`, which is what Excel pt-BR expects, plus a UTF-8 BOM so accents survive.

</details>

<details>
<summary><b>How a CPF is actually built</b></summary>

<br>

A CPF is 11 digits: 9 base digits followed by 2 check digits.

```
   1 2 3 . 4 5 6 . 7 8 9 - 0 9
   └───────┬───────┘ │   └─┬─┘
     8 random digits │   check digits
                     │
              fiscal region (UF)
```

1. The first 8 digits are random.
2. The 9th is the **fiscal region code** for the chosen state — `8` for SP, `6` for MG, `0` for RS, and so on.
3. The first check digit weights the 9 base digits by 10…2, sums them, and takes `11 - (sum % 11)` — collapsing to `0` when the remainder is under 2.
4. The second check digit repeats the process over 10 digits, weighted 11…2.

Region codes are grouped, not one-per-state — region `2` covers the whole North (AC, AM, AP, PA, RO, RR), while SP gets `8` to itself.

</details>

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, static export) | Builds to plain HTML/JS. No runtime, no server bill, no cold starts. |
| UI | **React 19** | Component model for a genuinely stateful UI (batches, selection, modal). |
| Language | **TypeScript 5** (strict) | The spreadsheet parser handles `unknown[][]` from arbitrary user files — types are the guardrail. |
| Styling | **Tailwind CSS v4** | Utility-first, no runtime CSS-in-JS, tokens defined in `globals.css`. |
| Spreadsheets | **SheetJS (`xlsx`)** | The only realistic option for reading and writing `.xlsx` in-browser. |
| Fonts | `next/font` — IBM Plex Sans / Mono | Self-hosted at build time; Mono gives tabular digits for the results table. |
| CI/CD | **GitHub Actions → Azure Static Web Apps** | Push to `main` typechecks, builds and deploys. |

### Notable decisions

**No back-end — on purpose.** CPF generation is pure computation and spreadsheet parsing
works fine in the browser. A server would add cost, latency and a privacy question
("where do my uploaded spreadsheets go?") for zero gain. The whole app is a static bundle.

**SheetJS is lazy-loaded.** The library is ~900 KB — larger than the rest of the app. It's
pulled in via dynamic `import()` only when someone actually imports or exports a
spreadsheet, so the initial page load never pays for it.

---

## Architecture

A deliberately flat structure — this is a focused single-page app, and layering it further
would add indirection without adding clarity. The one boundary that matters is enforced:
**pure logic knows nothing about React.**

```
src/
├── app/
│   ├── layout.tsx          Root layout, fonts, metadata
│   ├── page.tsx            State orchestration: batches, results, selection, view
│   └── globals.css         Tailwind v4 + design tokens
│
├── components/             Presentational, state via props
│   ├── LotCard.tsx         One batch: quantity, state, name rule
│   ├── GenerateBar.tsx     Floating action bar (generate / regenerate)
│   ├── ResultsSection.tsx  Results table, selection, export & copy
│   ├── ImportModal.tsx     Template upload + SheetJS parsing
│   └── …                   Checkbox, SegmentedControl, UfDropdown
│
├── lib/                    Pure TypeScript — no React, no DOM
│   ├── cpf.ts              Check-digit math, UF↔region map, name generation
│   ├── template.ts         Header detection, template filling
│   └── fonts.ts            next/font setup
│
└── types.ts                Lot, ResultRow
```

```
┌──────────────────────────────────────────────┐
│  page.tsx — owns all application state       │
└───────┬──────────────────────────┬───────────┘
        │ props / callbacks        │ calls
        ▼                          ▼
┌───────────────────┐      ┌───────────────────┐
│   components/     │      │      lib/         │
│  render + events  │      │   pure functions  │
│                   │      │  (testable, no    │
│                   │      │   React or DOM)   │
└─────────┬─────────┘      └───────────────────┘
          │ dynamic import() on demand
          ▼
   ┌─────────────┐
   │   SheetJS   │  ~900 KB, loaded only on import/export
   └─────────────┘
```

State lives in exactly one place: [page.tsx](src/app/page.tsx). Components receive props and
emit callbacks; nothing else holds application state. `lib/` is pure — `generateCpfForUf`,
`parseTemplate` and `fillTemplate` take values and return values, which keeps the tricky
parts (check-digit math, header matching, cell filling) independent of the UI.

---

## Getting Started

### Prerequisites

- **Node.js 20.x** (see [`.nvmrc`](.nvmrc))
- npm

### Run locally

```bash
git clone https://github.com/maat-aug/cpf-generator.git
cd cpf-generator
npm ci
npm run dev
```

Open **http://localhost:3000**.

No environment variables, no database, no connection strings — there's nothing to configure.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Static site into `out/` |
| `npm run typecheck` | `tsc --noEmit` — the only automated gate |
| `npm run preview` | Serves the built `out/` on port 3000 |

`npm run preview` serves the real built output, which is the closest thing to the deployed
site. Worth running before pushing.

---

## Deployment

Push to `main` triggers
[`azure-static-web-apps.yml`](.github/workflows/azure-static-web-apps.yml), which runs:

```
checkout → setup Node 20 → npm ci → typecheck → build → verify SWA config → deploy
```

Deploys go to **Azure Static Web Apps** and require the repository secret
`AZURE_STATIC_WEB_APPS_API_TOKEN`. Concurrent runs are cancelled so two rapid pushes can't
race for the same slot.

Security headers (HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`,
`Permissions-Policy`) are declared in
[`public/staticwebapp.config.json`](public/staticwebapp.config.json), which is copied into
`out/` at build time — and the pipeline fails if it's missing.

---

## Author

[![GitHub](https://img.shields.io/badge/GitHub-maat--aug-181717?logo=github&logoColor=white)](https://github.com/maat-aug)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Matheus_Augusto-0A66C2?logo=linkedin&logoColor=white)](https://linkedin.com/in/matheus-augusto-a89348265)
