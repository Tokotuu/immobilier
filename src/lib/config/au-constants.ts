/**
 * Australian and Queensland-specific financial constants
 * Updated for 2024-2025 financial year
 */

// Queensland Stamp Duty Rates (as of 2024)
export const QLD_STAMP_DUTY_BRACKETS = [
  { threshold: 0, rate: 0, base: 0 },
  { threshold: 5000, rate: 0.015, base: 0 },
  { threshold: 75000, rate: 0.035, base: 1050 },
  { threshold: 540000, rate: 0.045, base: 17325 },
  { threshold: 1000000, rate: 0.0575, base: 38025 },
] as const;

// Australian Income Tax Brackets 2024-2025
export const AU_TAX_BRACKETS = [
  { threshold: 0, rate: 0, base: 0 }, // Tax-free threshold
  { threshold: 18200, rate: 0.16, base: 0 },
  { threshold: 45000, rate: 0.30, base: 4288 },
  { threshold: 135000, rate: 0.37, base: 31288 },
  { threshold: 190000, rate: 0.45, base: 51638 },
] as const;

// Medicare Levy
export const MEDICARE_LEVY_RATE = 0.02;

// Capital Gains Tax (uses marginal tax rate with 50% discount if held > 12 months)
export const CGT_DISCOUNT_RATE = 0.5; // 50% discount for assets held > 12 months

// Property Investment Constants
export const NEGATIVE_GEARING_ENABLED = true;

// Typical Brisbane/QLD property costs (annual)
export const QLD_PROPERTY_COSTS = {
  councilRates: 2000, // Annual average for Brisbane
  waterRates: 1200, // Annual average
  insurance: 1500, // Building insurance
  maintenanceRate: 0.01, // 1% of property value per year
  propertyManagementRate: 0.08, // 8% of rental income (if using agent)
  landTax: {
    threshold: 600000, // QLD land tax threshold (2024)
    rate: 0.01, // 1% above threshold
  },
} as const;

// Loan Constants
export const LOAN_DEFAULTS = {
  lvrMax: 0.95, // Maximum 95% LVR
  lvrNoLMI: 0.80, // No LMI below 80% LVR
  lmiRate: 0.03, // Approximate LMI cost as % of loan
  interestRate: 0.065, // Current approximate variable rate (6.5%)
  loanTermYears: 30,
} as const;

// Home Buyer Grants and Concessions (QLD)
export const QLD_FIRST_HOME_BENEFITS = {
  stampDutyConcessionThreshold: 500000, // First home concession up to this value
  firstHomeGrantNewBuild: 15000, // Grant for new builds
  firstHomeGrantCap: 750000, // Property value cap for grant
} as const;

// Australian Government 5% Deposit Scheme (from Oct 1, 2025)
export const FIVE_PERCENT_DEPOSIT_SCHEME = {
  enabled: true,
  minimumDeposit: 0.05, // 5% for first home buyers
  minimumDepositSingleParent: 0.02, // 2% for single parents
  propertyCapBrisbane: 1000000, // $1M for Brisbane (increased from $700k)
  propertyCapRegionalQLD: 1000000, // $1M for Gold Coast, Sunshine Coast
  propertyCapRestOfQLD: 550000, // $550k for rest of Queensland
  noLMI: true, // Government guarantees up to 15%, so no LMI required
  noIncomeCap: true, // Income caps removed from Oct 1, 2025
  unlimitedPlaces: true, // Unlimited spots available
} as const;

// Investment Assumptions
export const INVESTMENT_ASSUMPTIONS = {
  propertyGrowthRate: 0.05, // 5% annual property appreciation
  rentalYieldGrowthRate: 0.03, // 3% annual rent increase
  inflationRate: 0.025, // 2.5% inflation
  alternativeInvestmentReturn: 0.08, // 8% if investing in stocks/ETFs instead
  savingsRate: 0.04, // 4% savings account interest
} as const;

// Transaction Costs
export const TRANSACTION_COSTS = {
  buyerLegalFees: 1500,
  buildingInspection: 500,
  pestInspection: 300,
  sellerAgentCommission: 0.025, // 2.5% of sale price
  sellerLegalFees: 1000,
  sellerMarketingCosts: 3000,
} as const;
