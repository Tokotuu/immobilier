# Development Guide

## Quick Start

```bash
npm run dev
```

Visit http://localhost:5173

## Architecture Overview

### Core Calculation Engine (`src/lib/calculations/calculator.ts`)

The main `calculateRentVsBuy()` function handles:
1. **Upfront costs**: Stamp duty, LMI, legal fees
2. **Loan amortization**: Monthly P&I calculations with proper interest/principal split
3. **Property growth**: Compounds annually
4. **Ownership costs**: Council rates, water, insurance, maintenance
5. **Rental scenario**: Rent growth + alternative investment returns
6. **Year-by-year comparison**: 30-year projection

### Australian Constants (`src/lib/config/au-constants.ts`)

All financial rules are centralized here:
- QLD stamp duty brackets
- AU tax brackets (2024-2025)
- Brisbane property costs (rates, insurance, etc.)
- Investment assumptions

**To update for other states**: Modify `QLD_STAMP_DUTY_BRACKETS` with state-specific rates.

### Components

**PropertyInputForm.svelte**
- Reactive form with Svelte 5 runes (`$state`, `$derived`)
- Advanced options collapse/expand
- Real-time calculations (LVR, annual rent)

**ResultsDisplay.svelte**
- Summary cards for key metrics
- Two Chart.js visualizations
- Year slider for detailed breakdowns
- Conditional rendering based on data

**Chart.svelte**
- Wrapper around Chart.js for Svelte 5
- Uses `$effect` for reactive updates
- Registers only required Chart.js modules (tree-shakeable)

## Future API Integration

### 1. RBA Interest Rates

```typescript
// Create src/lib/api/rba.ts
export async function fetchCurrentRate() {
  const response = await fetch('https://api.rba.gov.au/...');
  const data = await response.json();
  return data.rate;
}
```

Then update the form's default interest rate reactively.

### 2. Property Price Data

Services to consider:
- Domain.com.au API (requires partnership)
- CoreLogic API (paid)
- Web scraping (realestate.com.au, domain.com.au)

Example structure:
```typescript
// src/lib/api/property-data.ts
export async function fetchMedianPrice(suburb: string, propertyType: string) {
  // Implementation
}
```

### 3. Historical Data

For more accurate growth predictions:
```typescript
export async function calculateHistoricalGrowth(suburb: string, years: number) {
  // Fetch last N years of data
  // Calculate CAGR
  // Return growth rate
}
```

## Adding New Features

### Negative Gearing

Location: `src/lib/calculations/calculator.ts`

In the yearly loop, add:
```typescript
// Calculate taxable income reduction from interest
const taxDeduction = yearlyInterestPaid * marginalTaxRate;

// Subtract from ownership costs
const netOwnershipCost = yearlyOwnershipCost - taxDeduction;
```

### Capital Gains Tax on Sale

Add a new calculation for selling:
```typescript
export function calculateCGT(
  purchasePrice: number,
  salePrice: number,
  yearsHeld: number,
  marginalTaxRate: number
): number {
  const capitalGain = salePrice - purchasePrice;
  const discount = yearsHeld >= 1 ? CGT_DISCOUNT_RATE : 0;
  const taxableGain = capitalGain * (1 - discount);
  return taxableGain * marginalTaxRate;
}
```

### Land Tax

Location: `src/lib/calculations/calculator.ts`

In yearly ownership costs:
```typescript
const landValue = currentPropertyValue * 0.7; // Estimate
const landTax = landValue > QLD_PROPERTY_COSTS.landTax.threshold
  ? (landValue - QLD_PROPERTY_COSTS.landTax.threshold) * QLD_PROPERTY_COSTS.landTax.rate
  : 0;

yearlyOwnershipCost += landTax;
```

### Scenario Comparison

To compare multiple properties side-by-side:

1. Update state in +page.svelte:
```typescript
let scenarios = $state<CalculationResult[]>([]);
```

2. Add "Save Scenario" button
3. Create comparison table/chart component

## TypeScript Tips

The codebase uses strict TypeScript. Key types:

- `PropertyInputs`: User form inputs
- `CalculationResult`: Complete analysis output
- `YearlyResult`: Single year breakdown
- `ChartConfiguration`: Chart.js config (imported from chart.js)

## Testing Locally

### Test Cases to Verify

1. **First home buyer, $500k property**:
   - Should have $0 stamp duty
   - LMI depends on deposit

2. **80% LVR**:
   - Should have $0 LMI

3. **95% LVR**:
   - Should trigger LMI calculation

4. **High income ($200k+)**:
   - Should use 45% + 2% tax rate

5. **Property growth edge cases**:
   - 0% growth: renting should win
   - 10% growth: buying should win earlier

## Performance Optimization

If calculations become slow:

1. **Memoize calculations**:
```typescript
import { memoize } from 'proxy-memoize';
const memoizedCalculate = memoize(calculateRentVsBuy);
```

2. **Web Workers** (for complex scenarios):
```typescript
// src/lib/workers/calculator.worker.ts
self.addEventListener('message', (e) => {
  const result = calculateRentVsBuy(e.data);
  self.postMessage(result);
});
```

3. **Reduce chart data points**:
Sample every N years for 30-year view.

## Deployment

### Vercel (Recommended)
```bash
npm i -D @sveltejs/adapter-vercel
```

Update `svelte.config.js`:
```javascript
import adapter from '@sveltejs/adapter-vercel';
```

### Netlify
```bash
npm i -D @sveltejs/adapter-netlify
```

### Static (GitHub Pages, etc.)
```bash
npm i -D @sveltejs/adapter-static
```

## Environment Variables

Create `.env` for API keys:
```
PUBLIC_DOMAIN_API_KEY=xxx
PUBLIC_CORELOGIC_API_KEY=yyy
```

Access in code:
```typescript
import { env } from '$env/dynamic/public';
const apiKey = env.PUBLIC_DOMAIN_API_KEY;
```

## Debugging

### Console Logging Results
```typescript
function handleCalculate(inputs: PropertyInputs) {
  result = calculateRentVsBuy(inputs, 30);
  console.log('Calculation result:', result);
  showResults = true;
}
```

### Verify Stamp Duty
```typescript
console.log('Stamp duty:', calculateStampDuty(750000, true));
```

### Check Loan Calculations
```typescript
const monthly = calculateMonthlyRepayment(600000, 0.065, 30);
console.log('Monthly repayment:', monthly);
console.log('Total repaid:', monthly * 30 * 12);
```

## Common Issues

**Tailwind classes not working?**
- Check `tailwind.config.js` content paths
- Verify `app.css` is imported in `+layout.svelte`
- Clear `.svelte-kit` and rebuild

**Chart not updating?**
- Check `$effect` in Chart.svelte
- Verify chart config is `$derived`
- Console log to check data

**Build errors?**
- Delete `.svelte-kit` and `node_modules`
- Run `npm install` again
- Check TypeScript errors with `npm run check`

## Useful Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run check            # TypeScript type checking
npm run check:watch      # Type checking in watch mode
npm run lint             # Lint code (if configured)
```

---

Happy coding! Feel free to extend this as the project grows.
