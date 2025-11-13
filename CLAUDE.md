# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Brisbane Rent vs Buy Property Calculator - A comprehensive financial analysis tool to help users decide whether to rent or buy property in Brisbane, Queensland, Australia. The calculator uses official Australian Bureau of Statistics (ABS) data and incorporates QLD-specific calculations including stamp duty, first home buyer concessions, and the Australian Government 5% Deposit Scheme.

## Tech Stack

- **SvelteKit 5** with TypeScript (strict mode enabled)
- **Tailwind CSS 4** with @tailwindcss/forms
- **Chart.js** for data visualization
- **Zod** for runtime validation (ready for future API integrations)
- **Node.js 18+**

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev  # Opens on http://localhost:5173

# Type checking
npm run check              # Run once
npm run check:watch        # Watch mode

# Production build
npm run build
npm run preview            # Preview production build
```

## Architecture

### Core Calculation Engine (`src/lib/calculations/calculator.ts`)

The heart of the application. All financial calculations happen here:

- **`calculateRentVsBuy(inputs, yearsToProject)`** - Main calculation function that returns comprehensive results including:
  - Upfront costs (stamp duty, LMI, legal fees)
  - Loan details (monthly repayment, total interest)
  - Year-by-year breakdown (30 years by default)
  - Summary metrics (break-even year, 10/20-year comparisons)

- **Key calculation functions:**
  - `calculateStampDuty(propertyPrice, isFirstHome)` - QLD stamp duty with first home concession
  - `calculateLMI(loanAmount, propertyPrice, isFirstHome, use5PercentScheme)` - LMI with gov scheme support
  - `calculateMonthlyRepayment(loanAmount, annualRate, years)` - Standard amortization
  - `calculateMarginalTaxRate(income)` - AU tax brackets + Medicare Levy

**Important:** The calculation engine compares two scenarios:
1. **Buying:** Tracks property value, loan balance, equity, and cumulative ownership costs
2. **Renting:** Tracks rent paid and investment balance (deposit + savings invested at alternative return rate)

Net positions are calculated as:
- Buying: Equity (Property Value - Loan Balance)
- Renting: Investment Balance (Deposit invested + savings/costs differential)

### Australian Constants (`src/lib/config/au-constants.ts`)

Contains all Australian and Queensland-specific financial constants for 2024-2025:

- `QLD_STAMP_DUTY_BRACKETS` - QLD progressive stamp duty rates
- `AU_TAX_BRACKETS` - Australian income tax brackets 2024-2025
- `QLD_PROPERTY_COSTS` - Brisbane averages (council rates, water, insurance, maintenance)
- `LOAN_DEFAULTS` - Default loan parameters (LVR thresholds, LMI rules)
- `FIVE_PERCENT_DEPOSIT_SCHEME` - Australian Government 5% Deposit Scheme rules (Oct 2025)
- `INVESTMENT_ASSUMPTIONS` - Default growth rates (property, rent, alternative investments)

**When modifying:** These constants should be updated annually based on official government sources (QLD Revenue Office, ATO, RBA).

### ABS Data Integration (`src/lib/api/abs-api.ts`)

Fetches real property growth data from Australian Bureau of Statistics:

- Uses official ABS RES_DWELL dataset via SDMX-JSON API
- **Region codes:** BRISBANE (3GBRI), SYDNEY (1GSYD), MELBOURNE (1GMEL), etc. (see `ABS_REGIONS`)
- **Measure codes:**
  - `3` - Median Price of Established House Transfers (in $'000)
  - `4` - Median Price of Attached Dwelling Transfers (units, in $'000)
  - `1` - Number of Established House Transfers
  - `2` - Number of Attached Dwelling Transfers
- **`fetchBrisbaneGrowthRates()`** - Fetches 10-year median price history and calculates CAGR for houses and units
  - All residential growth rate is calculated as weighted average (60% houses, 40% units)

**Data caching:** Server endpoint (`/api/abs/growth-rates`) caches data for 90 days in `data/abs-cache.json` to avoid excessive API calls. Use `?force=true` to bypass cache.

**IMPORTANT:** The ABS API uses SDMX-JSON format with a "series" structure (not flat observations). The `parseSDMXJSON()` function handles this. When debugging ABS integration, check:
1. API URL format: `/data/ABS,RES_DWELL/{measure}.{region}.Q?startPeriod=YYYY-QN&endPeriod=YYYY-QN&detail=dataonly`
2. Accept header: `application/vnd.sdmx.data+json;version=1.0.0-wd`
3. Data structure: `jsonData.data.dataSets[0].series["0:0:0"].observations`
4. Time periods: `jsonData.data.structure.dimensions.observation[0].values` (TIME_PERIOD dimension)

### SvelteKit Routes & Data Loading

- **`src/routes/+page.server.ts`** - Server-side data loading for ABS growth rates
  - Fetches from `/api/abs/growth-rates` on page load
  - Returns `absData`, `absCached`, `absStale` to the page
  - Gracefully handles API failures (returns `null` if unavailable)

- **`src/routes/api/abs/growth-rates/+server.ts`** - API endpoint with caching
  - 90-day file-system cache in `data/abs-cache.json`
  - Falls back to stale cache if fresh fetch fails
  - Supports `?force=true` for cache bypass

### Svelte Components (Svelte 5)

**Important:** This project uses **Svelte 5** with new syntax:
- Runes: `$state()`, `$derived()`, `$effect()`
- Props: `let { propName } = $props()`
- Snippets instead of slots

Components:
- `PropertyInputForm.svelte` - Input form for all calculation parameters
- `ResultsDisplay.svelte` - Displays calculation results, charts, and breakdowns
- `Chart.svelte` - Chart.js wrapper compatible with Svelte 5

### Property Types & Suburb-Specific Growth

The calculator supports different property types (houses vs units) with suburb-specific growth rates:

- **Brisbane suburbs config:** `src/lib/config/brisbane-suburbs.ts`
- Property type affects which ABS growth rate is used (houses vs units vs all residential)
- Growth rates are suburb-specific when available, falling back to Brisbane-wide averages

## Code Style & Conventions

- **TypeScript:** Strict mode enabled, always use types
- **Formatting:** Use tabs for indentation (SvelteKit convention)
- **Imports:** Use `$lib/` alias for library imports
- **Constants:** SCREAMING_SNAKE_CASE with `as const` assertion
- **Comments:** JSDoc for exported functions, inline comments for complex logic

## Testing

Currently no test framework is set up. When adding tests:
- Install Vitest for unit tests
- Use `@testing-library/svelte` for component tests
- Focus on testing calculation functions in `calculator.ts` (critical path)

## Important Notes

1. **Financial calculations are estimates only** - Not financial advice
2. **QLD-specific** - Stamp duty and costs are specific to Queensland. For other states, update `au-constants.ts`
3. **API rate limits** - ABS API has no documented rate limits, but implement caching for production
4. **Svelte 5** - Use new rune syntax (`$state`, `$derived`, `$props`) not legacy reactivity
5. **Tax year** - All tax constants are for 2024-2025. Update annually
6. **Government schemes** - 5% Deposit Scheme rules effective Oct 1, 2025 (unlimited places, no income cap)

## Future Enhancements (Flagged in Code)

- Negative gearing calculations (constant exists, not implemented)
- Capital Gains Tax detailed calculations (CGT_DISCOUNT_RATE exists)
- Land tax for investment properties
- Export to PDF
- Comparison of multiple properties side-by-side
- Additional Australian cities (Sydney, Melbourne, etc.)

## Data Sources & References

- **Stamp Duty:** [Office of State Revenue Queensland](https://qro.qld.gov.au/)
- **Tax Brackets:** [Australian Taxation Office](https://www.ato.gov.au/)
- **Property Data:** [Australian Bureau of Statistics - RES_DWELL](https://www.abs.gov.au/)
- **5% Deposit Scheme:** [Australian Government First Home Guarantee](https://www.nhfic.gov.au/what-we-do/fhg/)

## Common Development Tasks

When adding new features to calculations:
1. Add constants to `au-constants.ts` if needed
2. Update `PropertyInputs` interface in `calculator.ts`
3. Modify `calculateRentVsBuy()` to incorporate new logic
4. Update `PropertyInputForm.svelte` for new inputs
5. Adjust `ResultsDisplay.svelte` to show new results
6. Test with realistic Brisbane property scenarios

When updating for new tax year:
1. Update `AU_TAX_BRACKETS` in `au-constants.ts`
2. Update `QLD_STAMP_DUTY_BRACKETS` if changed
3. Update `QLD_PROPERTY_COSTS` averages
4. Update `LOAN_DEFAULTS.interestRate` to current RBA cash rate + margin
5. Check for updates to first home buyer schemes
