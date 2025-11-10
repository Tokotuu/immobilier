<script lang="ts">
  import PropertyInputForm from '$lib/components/PropertyInputForm.svelte';
  import ResultsDisplay from '$lib/components/ResultsDisplay.svelte';
  import { calculateRentVsBuy, type PropertyInputs, type CalculationResult } from '$lib/calculations/calculator';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let result = $state<CalculationResult | null>(null);
  let showResults = $state(false);

  function handleCalculate(inputs: PropertyInputs) {
    result = calculateRentVsBuy(inputs, 30);
    showResults = true;

    // Scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function resetCalculation() {
    showResults = false;
    result = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Format quarter period (e.g., "2024-Q3" -> "Q3 2024")
  function formatQuarter(period: string): string {
    const [year, quarter] = period.split('-');
    return `${quarter} ${year}`;
  }
</script>

<svelte:head>
  <title>Brisbane Rent vs Buy Calculator - Property Decision Tool</title>
  <meta name="description" content="Compare renting vs buying property in Brisbane, Australia. Calculate stamp duty, mortgage costs, and long-term financial outcomes." />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 class="text-3xl font-bold text-gray-900">
        Brisbane Property Calculator
      </h1>
      <p class="mt-2 text-gray-600">
        Compare the financial outcomes of renting vs buying in Brisbane, Queensland
      </p>
      <div class="mt-2 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          2024-2025 Tax Year
        </span>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          QLD Stamp Duty Rates
        </span>
        {#if data.absData}
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            📊 ABS Official Data ({formatQuarter(data.absData.period)})
          </span>
        {/if}
      </div>

      {#if data.absData}
        <div class="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p class="text-sm font-medium text-purple-900 mb-1">
            Official Brisbane Growth Rates (10-year average from ABS):
          </p>
          <div class="flex gap-4 text-xs text-purple-800">
            <span>Houses: <strong>{(data.absData.houseGrowthRate * 100).toFixed(2)}%/year</strong></span>
            <span>Units: <strong>{(data.absData.unitGrowthRate * 100).toFixed(2)}%/year</strong></span>
            <span>All Residential: <strong>{(data.absData.allResidentialGrowthRate * 100).toFixed(2)}%/year</strong></span>
          </div>
        </div>
      {/if}
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Input Form -->
    <div class="mb-8">
      <PropertyInputForm onCalculate={handleCalculate} absData={data.absData} />
    </div>

    <!-- Results Section -->
    {#if showResults && result}
      <div id="results" class="scroll-mt-8">
        <!-- Results Header -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">
            Analysis Results
          </h2>
          <button
            onclick={resetCalculation}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            New Calculation
          </button>
        </div>

        <ResultsDisplay {result} />

        <!-- Disclaimers -->
        <div class="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 class="text-sm font-semibold text-yellow-900 mb-2">Important Disclaimers</h3>
          <ul class="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>This calculator provides estimates only and should not be considered financial advice</li>
            <li>Actual costs, rates, and property values may vary significantly</li>
            <li>Lifestyle factors, personal circumstances, and market conditions are not considered</li>
            <li>Tax calculations are simplified - consult a tax professional for accurate advice</li>
            <li>Interest rates, property growth, and rental yields are assumptions and may not reflect reality</li>
            <li>Always seek professional financial and legal advice before making property decisions</li>
          </ul>
        </div>

        <!-- Methodology -->
        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 class="text-sm font-semibold text-blue-900 mb-2">What's Included in This Analysis</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 class="font-semibold mb-2">Buying Costs:</h4>
              <ul class="space-y-1 list-disc list-inside ml-2">
                <li>QLD stamp duty (with first home concession)</li>
                <li>Lenders Mortgage Insurance (LMI)</li>
                <li>Legal fees and inspections</li>
                <li>Loan repayments (P&I)</li>
                <li>Council and water rates</li>
                <li>Building insurance</li>
                <li>Maintenance costs</li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold mb-2">Renting Comparison:</h4>
              <ul class="space-y-1 list-disc list-inside ml-2">
                <li>Rental payments with growth</li>
                <li>Deposit invested in alternative investments</li>
                <li>Opportunity cost of capital</li>
                <li>Flexibility and transaction cost savings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Info Section (shown when no results) -->
    {#if !showResults}
      <div class="bg-white rounded-lg shadow-md p-8 mt-8">
        <h2 class="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
        <div class="prose prose-blue max-w-none">
          <p class="text-gray-700">
            This calculator helps you make an informed decision about renting vs buying property in Brisbane
            by comparing the financial outcomes over 30 years. It considers all major costs and factors specific
            to Queensland and Australian tax law.
          </p>

          <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">Key Features:</h3>
          <ul class="text-gray-700 space-y-2">
            <li>
              <strong>Queensland-specific calculations:</strong> Includes QLD stamp duty rates,
              first home buyer concessions, and Brisbane average property costs
            </li>
            <li>
              <strong>Comprehensive cost analysis:</strong> Factors in all ownership costs including
              rates, insurance, maintenance, and opportunity costs
            </li>
            <li>
              <strong>30-year projections:</strong> See how your net position evolves over time with
              detailed year-by-year breakdowns
            </li>
            <li>
              <strong>Investment comparison:</strong> Compares buying vs investing your deposit in
              alternative investments while renting
            </li>
            <li>
              <strong>Real tax rates:</strong> Uses actual 2024-2025 Australian income tax brackets
              for accurate calculations
            </li>
          </ul>

          <div class="mt-8 p-4 bg-gray-100 rounded-lg">
            <p class="text-sm text-gray-600 italic">
              Fill in your details above to get started with your personalized analysis.
              You can adjust advanced parameters to fine-tune the calculations to your situation.
            </p>
          </div>
        </div>
      </div>
    {/if}
  </main>

  <!-- Footer -->
  <footer class="mt-16 bg-white border-t border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <p class="text-center text-sm text-gray-500">
        For informational purposes only. Not financial advice. Consult professionals before making property decisions.
      </p>
      <p class="text-center text-xs text-gray-400 mt-2">
        Data accurate as of 2024-2025 financial year
      </p>
    </div>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
