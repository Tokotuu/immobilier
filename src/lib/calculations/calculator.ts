import {
  QLD_STAMP_DUTY_BRACKETS,
  AU_TAX_BRACKETS,
  MEDICARE_LEVY_RATE,
  CGT_DISCOUNT_RATE,
  QLD_PROPERTY_COSTS,
  LOAN_DEFAULTS,
  INVESTMENT_ASSUMPTIONS,
  TRANSACTION_COSTS,
  FIVE_PERCENT_DEPOSIT_SCHEME,
} from '$lib/config/au-constants';

export interface PropertyInputs {
  propertyPrice: number;
  deposit: number;
  isFirstHome: boolean;
  use5PercentScheme?: boolean; // Australian Government 5% Deposit Scheme
  annualIncome: number;
  loanInterestRate: number;
  loanTermYears: number;

  // Rental comparison
  weeklyRent: number;

  // Optional overrides
  councilRates?: number;
  waterRates?: number;
  insurance?: number;
  maintenanceRate?: number;
  propertyGrowthRate?: number;
  rentalYieldGrowthRate?: number;
}

export interface YearlyResult {
  year: number;

  // Buying scenario
  propertyValue: number;
  loanBalance: number;
  equity: number;
  yearlyOwnershipCost: number;
  cumulativeOwnershipCost: number;

  // Renting scenario
  yearlyRentPaid: number;
  cumulativeRentPaid: number;
  investmentBalance: number; // If deposit was invested instead

  // Comparison
  netPositionBuying: number; // Equity - cumulative costs + tax benefits
  netPositionRenting: number; // Investment balance - cumulative rent
  advantage: 'buying' | 'renting';
  advantageAmount: number;
}

export interface CalculationResult {
  upfrontCosts: {
    stampDuty: number;
    lmi: number;
    legalFees: number;
    inspections: number;
    total: number;
  };

  loanDetails: {
    loanAmount: number;
    lvr: number;
    monthlyRepayment: number;
    totalInterestPaid: number;
  };

  yearlyBreakdown: YearlyResult[];

  summary: {
    breakEvenYear: number | null; // Year when buying becomes better
    advantage10Year: 'buying' | 'renting';
    advantage10YearAmount: number;
    advantage20Year: 'buying' | 'renting';
    advantage20YearAmount: number;
  };
}

/**
 * Calculate QLD stamp duty
 */
export function calculateStampDuty(propertyPrice: number, isFirstHome: boolean): number {
  if (isFirstHome && propertyPrice <= 500000) {
    return 0; // First home concession
  }

  let duty = 0;
  let previousThreshold = 0;

  for (let i = 0; i < QLD_STAMP_DUTY_BRACKETS.length; i++) {
    const bracket = QLD_STAMP_DUTY_BRACKETS[i];

    if (propertyPrice <= bracket.threshold) {
      break;
    }

    const nextThreshold = QLD_STAMP_DUTY_BRACKETS[i + 1]?.threshold || propertyPrice;
    const taxableInBracket = Math.min(propertyPrice, nextThreshold) - bracket.threshold;

    duty = bracket.base + taxableInBracket * bracket.rate;
    previousThreshold = bracket.threshold;
  }

  return Math.round(duty);
}

/**
 * Calculate Lenders Mortgage Insurance
 */
export function calculateLMI(
  loanAmount: number,
  propertyPrice: number,
  isFirstHome: boolean = false,
  use5PercentScheme: boolean = false
): number {
  const lvr = loanAmount / propertyPrice;
  const depositPercent = 1 - lvr;

  // Check if eligible for 5% Deposit Scheme
  if (
    use5PercentScheme &&
    isFirstHome &&
    FIVE_PERCENT_DEPOSIT_SCHEME.enabled &&
    propertyPrice <= FIVE_PERCENT_DEPOSIT_SCHEME.propertyCapBrisbane &&
    depositPercent >= FIVE_PERCENT_DEPOSIT_SCHEME.minimumDeposit
  ) {
    return 0; // No LMI under government scheme
  }

  // Standard LMI rules
  if (lvr <= LOAN_DEFAULTS.lvrNoLMI) {
    return 0;
  }

  // Simplified LMI calculation - actual is more complex
  const lmiRate = LOAN_DEFAULTS.lmiRate * (lvr - LOAN_DEFAULTS.lvrNoLMI) * 2;
  return Math.round(loanAmount * lmiRate);
}

/**
 * Calculate monthly loan repayment (P&I)
 */
export function calculateMonthlyRepayment(
  loanAmount: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;

  const monthlyPayment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return monthlyPayment;
}

/**
 * Calculate marginal tax rate including Medicare Levy
 */
export function calculateMarginalTaxRate(income: number): number {
  let taxRate = 0;

  for (let i = AU_TAX_BRACKETS.length - 1; i >= 0; i--) {
    if (income > AU_TAX_BRACKETS[i].threshold) {
      taxRate = AU_TAX_BRACKETS[i].rate;
      break;
    }
  }

  return taxRate + MEDICARE_LEVY_RATE;
}

/**
 * Main calculation function
 */
export function calculateRentVsBuy(inputs: PropertyInputs, yearsToProject: number = 30): CalculationResult {
  const loanAmount = inputs.propertyPrice - inputs.deposit;
  const lvr = loanAmount / inputs.propertyPrice;

  // Upfront costs
  const stampDuty = calculateStampDuty(inputs.propertyPrice, inputs.isFirstHome);
  const lmi = calculateLMI(
    loanAmount,
    inputs.propertyPrice,
    inputs.isFirstHome,
    inputs.use5PercentScheme ?? false
  );
  const legalFees = TRANSACTION_COSTS.buyerLegalFees;
  const inspections = TRANSACTION_COSTS.buildingInspection + TRANSACTION_COSTS.pestInspection;
  const totalUpfront = stampDuty + lmi + legalFees + inspections;

  // Loan details
  const monthlyRepayment = calculateMonthlyRepayment(
    loanAmount,
    inputs.loanInterestRate,
    inputs.loanTermYears
  );

  const annualRepayment = monthlyRepayment * 12;
  const totalRepaid = monthlyRepayment * inputs.loanTermYears * 12;
  const totalInterest = totalRepaid - loanAmount;

  // Property costs
  const councilRates = inputs.councilRates ?? QLD_PROPERTY_COSTS.councilRates;
  const waterRates = inputs.waterRates ?? QLD_PROPERTY_COSTS.waterRates;
  const insurance = inputs.insurance ?? QLD_PROPERTY_COSTS.insurance;
  const maintenanceRate = inputs.maintenanceRate ?? QLD_PROPERTY_COSTS.maintenanceRate;
  const propertyGrowthRate = inputs.propertyGrowthRate ?? INVESTMENT_ASSUMPTIONS.propertyGrowthRate;
  const rentalYieldGrowthRate = inputs.rentalYieldGrowthRate ?? INVESTMENT_ASSUMPTIONS.rentalYieldGrowthRate;

  // Tax rate
  const marginalTaxRate = calculateMarginalTaxRate(inputs.annualIncome);

  // Yearly projections
  const yearlyBreakdown: YearlyResult[] = [];

  let currentPropertyValue = inputs.propertyPrice;
  let currentLoanBalance = loanAmount;
  let cumulativeOwnershipCost = totalUpfront;
  let cumulativeRentPaid = 0;
  let investmentBalance = inputs.deposit; // Initial investment of deposit
  let currentWeeklyRent = inputs.weeklyRent;

  const monthlyRate = inputs.loanInterestRate / 12;

  for (let year = 1; year <= yearsToProject; year++) {
    // Property appreciation
    currentPropertyValue *= (1 + propertyGrowthRate);

    // Loan amortization
    let yearStartBalance = currentLoanBalance;
    let yearlyInterestPaid = 0;

    for (let month = 0; month < 12; month++) {
      const interestPayment = currentLoanBalance * monthlyRate;
      const principalPayment = monthlyRepayment - interestPayment;

      yearlyInterestPaid += interestPayment;
      currentLoanBalance = Math.max(0, currentLoanBalance - principalPayment);

      if (currentLoanBalance === 0) break;
    }

    const equity = currentPropertyValue - currentLoanBalance;

    // Annual ownership costs
    const maintenance = currentPropertyValue * maintenanceRate;
    const yearlyOwnershipCost = councilRates + waterRates + insurance + maintenance;
    cumulativeOwnershipCost += yearlyOwnershipCost + annualRepayment;

    // Rental scenario
    const yearlyRentPaid = currentWeeklyRent * 52;
    cumulativeRentPaid += yearlyRentPaid;
    currentWeeklyRent *= (1 + rentalYieldGrowthRate);

    // Investment growth (deposit + savings from not buying)
    const yearlySavings = annualRepayment + yearlyOwnershipCost - yearlyRentPaid;
    investmentBalance = investmentBalance * (1 + INVESTMENT_ASSUMPTIONS.alternativeInvestmentReturn) +
                        (yearlySavings > 0 ? yearlySavings : 0);

    // If renting is more expensive, investment balance decreases
    if (yearlySavings < 0) {
      investmentBalance += yearlySavings; // This will decrease it
    }

    // Net positions
    const netPositionBuying = equity;
    const netPositionRenting = investmentBalance;

    const advantage = netPositionBuying > netPositionRenting ? 'buying' : 'renting';
    const advantageAmount = Math.abs(netPositionBuying - netPositionRenting);

    yearlyBreakdown.push({
      year,
      propertyValue: currentPropertyValue,
      loanBalance: currentLoanBalance,
      equity,
      yearlyOwnershipCost,
      cumulativeOwnershipCost,
      yearlyRentPaid,
      cumulativeRentPaid,
      investmentBalance,
      netPositionBuying,
      netPositionRenting,
      advantage,
      advantageAmount,
    });
  }

  // Find break-even year
  let breakEvenYear: number | null = null;
  for (const result of yearlyBreakdown) {
    if (result.advantage === 'buying') {
      breakEvenYear = result.year;
      break;
    }
  }

  // Summary
  const year10 = yearlyBreakdown[9];
  const year20 = yearlyBreakdown[19];

  return {
    upfrontCosts: {
      stampDuty,
      lmi,
      legalFees,
      inspections,
      total: totalUpfront,
    },
    loanDetails: {
      loanAmount,
      lvr,
      monthlyRepayment,
      totalInterestPaid: totalInterest,
    },
    yearlyBreakdown,
    summary: {
      breakEvenYear,
      advantage10Year: year10.advantage,
      advantage10YearAmount: year10.advantageAmount,
      advantage20Year: year20.advantage,
      advantage20YearAmount: year20.advantageAmount,
    },
  };
}
