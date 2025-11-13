<script lang="ts">
  import Chart from './Chart.svelte';
  import type { CalculationResult } from '$lib/calculations/calculator';
  import type { ChartConfiguration } from 'chart.js';

  interface Props {
    result: CalculationResult;
  }

  let { result }: Props = $props();

  function formatCurrency(value: number): string {
    if (isNaN(value) || value === null || value === undefined) {
      console.error('Invalid value passed to formatCurrency:', value);
      return '$0';
    }
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(value);
  }

  function formatPercent(value: number): string {
    return (value * 100).toFixed(2) + '%';
  }

  // Chart configuration for net position comparison
  let chartConfig = $derived<ChartConfiguration>({
    type: 'line',
    data: {
      labels: result.yearlyBreakdown.map((y) => `Year ${y.year}`),
      datasets: [
        {
          label: 'Buying (Equity)',
          data: result.yearlyBreakdown.map((y) => y.netPositionBuying),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Renting (Investment)',
          data: result.yearlyBreakdown.map((y) => y.netPositionRenting),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Net Position Over Time: Buying vs Renting',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += formatCurrency(context.parsed.y);
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: function (value) {
              return formatCurrency(Number(value));
            },
          },
        },
      },
    },
  });

  // Property value and loan balance chart
  let propertyChartConfig = $derived<ChartConfiguration>({
    type: 'line',
    data: {
      labels: result.yearlyBreakdown.map((y) => `Year ${y.year}`),
      datasets: [
        {
          label: 'Property Value',
          data: result.yearlyBreakdown.map((y) => y.propertyValue),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Loan Balance',
          data: result.yearlyBreakdown.map((y) => y.loanBalance),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Equity',
          data: result.yearlyBreakdown.map((y) => y.equity),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Property Value, Loan Balance & Equity',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += formatCurrency(context.parsed.y);
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: function (value) {
              return formatCurrency(Number(value));
            },
          },
        },
      },
    },
  });

  // Selected year for detailed view
  let selectedYear = $state(10);
  let selectedYearData = $derived(result.yearlyBreakdown[selectedYear - 1]);
</script>

<div class="space-y-6">
  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h3 class="text-sm font-medium text-gray-500 uppercase">Upfront Costs</h3>
      <p class="mt-2 text-3xl font-bold text-gray-900">
        {formatCurrency(result.upfrontCosts.total)}
      </p>
      <div class="mt-4 text-sm text-gray-600 space-y-1">
        <div class="flex justify-between">
          <span>Stamp Duty:</span>
          <span>{formatCurrency(result.upfrontCosts.stampDuty)}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>LMI:</span>
          <div class="text-right">
            <span class:text-green-600={result.upfrontCosts.lmi === 0 && result.loanDetails.lvr > 80}>
              {formatCurrency(result.upfrontCosts.lmi)}
            </span>
            {#if result.upfrontCosts.lmi === 0 && result.loanDetails.lvr > 80}
              <div class="text-xs text-green-600 font-medium">5% Scheme</div>
            {/if}
          </div>
        </div>
        <div class="flex justify-between">
          <span>Legal & Inspections:</span>
          <span>{formatCurrency(result.upfrontCosts.legalFees + result.upfrontCosts.inspections)}</span>
        </div>
      </div>
      {#if result.upfrontCosts.lmi === 0 && result.loanDetails.lvr > 80}
        <div class="mt-4 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          🎉 Saving on LMI via Australian Government 5% Deposit Scheme
        </div>
      {/if}
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
      <h3 class="text-sm font-medium text-gray-500 uppercase">Monthly Repayment</h3>
      <p class="mt-2 text-3xl font-bold text-gray-900">
        {formatCurrency(result.loanDetails.monthlyRepayment)}
      </p>
      <div class="mt-4 text-sm text-gray-600 space-y-1">
        <div class="flex justify-between">
          <span>Loan Amount:</span>
          <span>{formatCurrency(result.loanDetails.loanAmount)}</span>
        </div>
        <div class="flex justify-between">
          <span>LVR:</span>
          <span>{formatPercent(result.loanDetails.lvr / 100)}</span>
        </div>
        <div class="flex justify-between">
          <span>Total Interest:</span>
          <span>{formatCurrency(result.loanDetails.totalInterestPaid)}</span>
        </div>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
      <h3 class="text-sm font-medium text-gray-500 uppercase">10-Year Outlook</h3>
      <p class="mt-2 text-3xl font-bold {result.summary.advantage10Year === 'buying' ? 'text-blue-600' : 'text-red-600'}">
        {result.summary.advantage10Year === 'buying' ? 'Buying' : 'Renting'}
      </p>
      <div class="mt-4 text-sm text-gray-600">
        <p>
          {result.summary.advantage10Year === 'buying' ? 'Buying' : 'Renting'} is better by
        </p>
        <p class="text-lg font-semibold text-gray-900">
          {formatCurrency(result.summary.advantage10YearAmount)}
        </p>
        {#if result.summary.breakEvenYear}
          <p class="mt-2">
            Break-even: <span class="font-semibold">Year {result.summary.breakEvenYear}</span>
          </p>
        {:else}
          <p class="mt-2 text-red-600">
            Buying doesn't break even in 30 years
          </p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Charts -->
  <div class="bg-white p-6 rounded-lg shadow-md">
    <div class="h-96">
      <Chart config={chartConfig} />
    </div>
  </div>

  <div class="bg-white p-6 rounded-lg shadow-md">
    <div class="h-96">
      <Chart config={propertyChartConfig} />
    </div>
  </div>

  <!-- Year Selector for Detailed View -->
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Detailed Year View</h3>

    <div class="mb-6">
      <label for="yearSlider" class="block text-sm font-medium text-gray-700 mb-2">
        Select Year: <span class="font-bold">{selectedYear}</span>
      </label>
      <input
        type="range"
        id="yearSlider"
        bind:value={selectedYear}
        min="1"
        max="30"
        class="w-full"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Buying Scenario -->
      <div class="border-l-4 border-blue-500 pl-4">
        <h4 class="font-semibold text-blue-900 mb-3">Buying Scenario</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Property Value:</span>
            <span class="font-semibold">{formatCurrency(selectedYearData.propertyValue)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Loan Balance:</span>
            <span class="font-semibold">{formatCurrency(selectedYearData.loanBalance)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Equity:</span>
            <span class="font-semibold text-green-600">{formatCurrency(selectedYearData.equity)}</span>
          </div>
          <div class="flex justify-between border-t pt-2">
            <span class="text-gray-600">Yearly Ownership Cost:</span>
            <span class="font-semibold">{formatCurrency(selectedYearData.yearlyOwnershipCost)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Cumulative Costs:</span>
            <span class="font-semibold">{formatCurrency(selectedYearData.cumulativeOwnershipCost)}</span>
          </div>
        </div>
      </div>

      <!-- Renting Scenario -->
      <div class="border-l-4 border-red-500 pl-4">
        <h4 class="font-semibold text-red-900 mb-3">Renting Scenario</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Investment Balance:</span>
            <span class="font-semibold text-green-600">{formatCurrency(selectedYearData.investmentBalance)}</span>
          </div>
          <div class="flex justify-between border-t pt-2">
            <span class="text-gray-600">Yearly Rent:</span>
            <span class="font-semibold">{formatCurrency(selectedYearData.yearlyRentPaid)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Cumulative Rent:</span>
            <span class="font-semibold">{formatCurrency(selectedYearData.cumulativeRentPaid)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparison -->
    <div class="mt-6 pt-6 border-t">
      <div class="text-center">
        <p class="text-sm text-gray-600">Net Position Comparison</p>
        <p class="text-2xl font-bold {selectedYearData.advantage === 'buying' ? 'text-blue-600' : 'text-red-600'} mt-2">
          {selectedYearData.advantage === 'buying' ? 'Buying' : 'Renting'} is ahead by {formatCurrency(selectedYearData.advantageAmount)}
        </p>
      </div>
    </div>
  </div>

  <!-- 20-Year Summary -->
  {#if result.yearlyBreakdown.length >= 20}
    <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">20-Year Summary</h3>
      <p class="text-gray-700">
        After 20 years, <span class="font-bold {result.summary.advantage20Year === 'buying' ? 'text-blue-600' : 'text-red-600'}">
          {result.summary.advantage20Year === 'buying' ? 'buying' : 'renting'}
        </span> is financially better by
        <span class="font-bold text-lg">{formatCurrency(result.summary.advantage20YearAmount)}</span>
      </p>
    </div>
  {/if}
</div>
