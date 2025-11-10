<script lang="ts">
  import type { PropertyInputs } from '$lib/calculations/calculator';
  import { LOAN_DEFAULTS } from '$lib/config/au-constants';

  interface Props {
    onCalculate: (inputs: PropertyInputs) => void;
  }

  let { onCalculate }: Props = $props();

  // Form state
  let propertyPrice = $state(750000);
  let depositPercent = $state(20);
  let isFirstHome = $state(true);
  let annualIncome = $state(100000);
  let loanInterestRate = $state(LOAN_DEFAULTS.interestRate * 100); // Convert to percentage
  let loanTermYears = $state(LOAN_DEFAULTS.loanTermYears);
  let weeklyRent = $state(600);

  // Advanced options
  let showAdvanced = $state(false);
  let councilRates = $state(2000);
  let waterRates = $state(1200);
  let insurance = $state(1500);
  let maintenanceRate = $state(1.0); // As percentage
  let propertyGrowthRate = $state(5.0); // As percentage
  let rentalYieldGrowthRate = $state(3.0); // As percentage

  // Computed values
  let deposit = $derived(propertyPrice * (depositPercent / 100));
  let loanAmount = $derived(propertyPrice - deposit);
  let lvr = $derived((loanAmount / propertyPrice) * 100);

  function handleSubmit(e: Event) {
    e.preventDefault();

    const inputs: PropertyInputs = {
      propertyPrice,
      deposit,
      isFirstHome,
      annualIncome,
      loanInterestRate: loanInterestRate / 100,
      loanTermYears,
      weeklyRent,
      ...(showAdvanced && {
        councilRates,
        waterRates,
        insurance,
        maintenanceRate: maintenanceRate / 100,
        propertyGrowthRate: propertyGrowthRate / 100,
        rentalYieldGrowthRate: rentalYieldGrowthRate / 100,
      }),
    };

    onCalculate(inputs);
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(value);
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6 bg-white p-6 rounded-lg shadow-md">
  <div class="border-b border-gray-200 pb-4">
    <h2 class="text-2xl font-bold text-gray-900">Property Details</h2>
    <p class="mt-1 text-sm text-gray-600">Brisbane, Queensland</p>
  </div>

  <!-- Basic Inputs -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label for="propertyPrice" class="block text-sm font-medium text-gray-700">
        Property Price
      </label>
      <input
        type="number"
        id="propertyPrice"
        bind:value={propertyPrice}
        step="10000"
        min="100000"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
      <p class="mt-1 text-sm text-gray-500">{formatCurrency(propertyPrice)}</p>
    </div>

    <div>
      <label for="depositPercent" class="block text-sm font-medium text-gray-700">
        Deposit (%)
      </label>
      <input
        type="number"
        id="depositPercent"
        bind:value={depositPercent}
        step="1"
        min="5"
        max="100"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
      <p class="mt-1 text-sm text-gray-500">
        {formatCurrency(deposit)} • LVR: {lvr.toFixed(1)}%
      </p>
    </div>

    <div>
      <label for="weeklyRent" class="block text-sm font-medium text-gray-700">
        Weekly Rent (Equivalent Property)
      </label>
      <input
        type="number"
        id="weeklyRent"
        bind:value={weeklyRent}
        step="10"
        min="100"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
      <p class="mt-1 text-sm text-gray-500">
        {formatCurrency(weeklyRent * 52)}/year
      </p>
    </div>

    <div>
      <label for="annualIncome" class="block text-sm font-medium text-gray-700">
        Annual Income (for tax calculations)
      </label>
      <input
        type="number"
        id="annualIncome"
        bind:value={annualIncome}
        step="5000"
        min="18200"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
      <p class="mt-1 text-sm text-gray-500">{formatCurrency(annualIncome)}</p>
    </div>

    <div>
      <label for="interestRate" class="block text-sm font-medium text-gray-700">
        Interest Rate (%)
      </label>
      <input
        type="number"
        id="interestRate"
        bind:value={loanInterestRate}
        step="0.1"
        min="1"
        max="15"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="loanTerm" class="block text-sm font-medium text-gray-700">
        Loan Term (years)
      </label>
      <input
        type="number"
        id="loanTerm"
        bind:value={loanTermYears}
        step="5"
        min="5"
        max="30"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  </div>

  <div>
    <label class="flex items-center">
      <input
        type="checkbox"
        bind:checked={isFirstHome}
        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span class="ml-2 text-sm text-gray-700">
        First Home Buyer (eligible for QLD stamp duty concession)
      </span>
    </label>
  </div>

  <!-- Advanced Options -->
  <div class="border-t border-gray-200 pt-4">
    <button
      type="button"
      onclick={() => (showAdvanced = !showAdvanced)}
      class="text-sm font-medium text-blue-600 hover:text-blue-500"
    >
      {showAdvanced ? '▼' : '▶'} Advanced Options
    </button>

    {#if showAdvanced}
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="councilRates" class="block text-sm font-medium text-gray-700">
            Annual Council Rates
          </label>
          <input
            type="number"
            id="councilRates"
            bind:value={councilRates}
            step="100"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="waterRates" class="block text-sm font-medium text-gray-700">
            Annual Water Rates
          </label>
          <input
            type="number"
            id="waterRates"
            bind:value={waterRates}
            step="100"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="insurance" class="block text-sm font-medium text-gray-700">
            Annual Building Insurance
          </label>
          <input
            type="number"
            id="insurance"
            bind:value={insurance}
            step="100"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="maintenanceRate" class="block text-sm font-medium text-gray-700">
            Maintenance Rate (% of property value/year)
          </label>
          <input
            type="number"
            id="maintenanceRate"
            bind:value={maintenanceRate}
            step="0.1"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="propertyGrowth" class="block text-sm font-medium text-gray-700">
            Property Growth Rate (%/year)
          </label>
          <input
            type="number"
            id="propertyGrowth"
            bind:value={propertyGrowthRate}
            step="0.5"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="rentGrowth" class="block text-sm font-medium text-gray-700">
            Rent Growth Rate (%/year)
          </label>
          <input
            type="number"
            id="rentGrowth"
            bind:value={rentalYieldGrowthRate}
            step="0.5"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- Submit Button -->
  <div class="flex justify-end pt-4 border-t border-gray-200">
    <button
      type="submit"
      class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Calculate
    </button>
  </div>
</form>
