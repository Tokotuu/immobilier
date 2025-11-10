# Brisbane Rent vs Buy Property Calculator

A comprehensive financial analysis tool to help you decide whether it's better to rent or buy property in Brisbane, Queensland, Australia.

## Features

- **Queensland-Specific Calculations**: Includes QLD stamp duty rates, first home buyer concessions, and Brisbane-specific property costs
- **Comprehensive Financial Analysis**: Factors in all ownership costs including rates, insurance, maintenance, and opportunity costs
- **30-Year Projections**: Detailed year-by-year breakdown showing how your net position evolves over time
- **Investment Comparison**: Compares buying vs investing your deposit in alternative investments while renting
- **Australian Tax Compliance**: Uses actual 2024-2025 income tax brackets and Medicare levy for accurate calculations
- **Interactive Visualizations**: Charts showing property value, equity growth, and net position comparisons

## Tech Stack

- **SvelteKit 5** - Modern reactive framework with TypeScript
- **Tailwind CSS** - Utility-first CSS framework with @tailwindcss/forms
- **Chart.js** - Data visualization
- **Zod** - Runtime type validation (ready for future API integrations)

## Project Structure

```
src/
├── lib/
│   ├── calculations/
│   │   └── calculator.ts          # Core calculation engine
│   ├── components/
│   │   ├── Chart.svelte            # Chart.js wrapper for Svelte 5
│   │   ├── PropertyInputForm.svelte # Input form component
│   │   └── ResultsDisplay.svelte   # Results visualization
│   └── config/
│       └── au-constants.ts         # Australian financial constants
└── routes/
    ├── +layout.svelte              # Root layout
    └── +page.svelte                # Main application page
```

## What's Included in the Analysis

### Buying Costs
- QLD stamp duty (with first home concession for properties ≤ $500k)
- Lenders Mortgage Insurance (LMI) for LVR > 80%
- Legal fees and inspections (building, pest)
- Loan repayments (Principal & Interest)
- Council rates (Brisbane average: $2,000/year)
- Water rates ($1,200/year)
- Building insurance ($1,500/year)
- Maintenance costs (1% of property value/year)
- Property appreciation (default 5%/year)

### Renting Comparison
- Weekly rent payments with growth (default 3%/year)
- Deposit invested in alternative investments (default 8% return)
- Opportunity cost of capital
- Transaction cost savings

### Tax Considerations
- 2024-2025 Australian income tax brackets
- Medicare Levy (2%)
- Marginal tax rate calculations
- Capital Gains Tax considerations (ready for future implementation)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Financial Calculations

### Stamp Duty (QLD)
Queensland stamp duty is calculated using progressive brackets:
- $0 - $5,000: 0%
- $5,001 - $75,000: 1.5%
- $75,001 - $540,000: 3.5%
- $540,001 - $1,000,000: 4.5%
- $1,000,000+: 5.75%

**First Home Concession**: Properties ≤ $500,000 are exempt from stamp duty for eligible first home buyers.

### Loan Calculations
- Monthly repayments calculated using standard amortization formula
- LMI applied for LVR > 80% (simplified calculation)
- Interest and principal tracked separately over loan term

### Net Position Comparison
- **Buying**: Equity (Property Value - Loan Balance)
- **Renting**: Investment Balance (Deposit + Savings/Costs invested at 8% return)

## Future Enhancements

The codebase is structured to support:
- [ ] API integration for real-time interest rates (RBA)
- [ ] Property price data scraping (domain.com.au, realestate.com.au)
- [ ] Negative gearing calculations (already flagged in constants)
- [ ] Capital Gains Tax detailed calculations
- [ ] Land tax calculations for investment properties
- [ ] Rental yield analysis
- [ ] Inflation-adjusted comparisons
- [ ] Export results to PDF
- [ ] Save/load scenarios
- [ ] Comparison of multiple properties

## Disclaimers

⚠️ **Important**: This calculator provides estimates only and should not be considered financial advice.

- Actual costs, rates, and property values may vary significantly
- Lifestyle factors and personal circumstances are not considered
- Tax calculations are simplified - consult a tax professional
- Interest rates, property growth, and rental yields are assumptions
- Always seek professional financial and legal advice before making property decisions

## Data Sources

- QLD Stamp Duty: Office of State Revenue Queensland (2024)
- Tax Brackets: Australian Taxation Office (2024-2025)
- Property Costs: Brisbane City Council averages
- Market Rates: Current as of November 2024

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT License - feel free to use and modify for your own purposes.

---

**Note**: This tool is focused specifically on Brisbane, Queensland. For other Australian states/territories, you'll need to update the stamp duty calculations and local costs in `src/lib/config/au-constants.ts`.
