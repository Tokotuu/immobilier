<script lang="ts">
  import type { PropertyInputs } from '$lib/calculations/calculator';
  import { LOAN_DEFAULTS, FIVE_PERCENT_DEPOSIT_SCHEME } from '$lib/config/au-constants';
  import { BRISBANE_SUBURBS, getGrowthRate } from '$lib/config/brisbane-suburbs';

  interface Props {
    onCalculate: (inputs: PropertyInputs) => void;
  }

  let { onCalculate }: Props = $props();

  // Form state
  let propertyPrice = $state(100000);
  let depositPercent = $state(5);
  let isFirstHome = $state(true);
  let use5PercentScheme = $state(false);
  let annualIncome = $state(300000);
  let loanInterestRate = $state(LOAN_DEFAULTS.interestRate * 100); // Convert to percentage
  let loanTermYears = $state(LOAN_DEFAULTS.loanTermYears);
  let weeklyRent = $state(800);

  // Property characteristics
  let propertyType = $state<'house' | 'unit' | 'townhouse'>('house');
  let selectedSuburb = $state<string>('');
  let useAutoGrowthRate = $state(true); // Auto-calculate growth rate from selections

  // Advanced options
  let showAdvanced = $state(false);
  let councilRates = $state(2000);
  let waterRates = $state(1200);
  let insurance = $state(1500);
  let maintenanceRate = $state(1.0); // As percentage
  let manualPropertyGrowthRate = $state(5.0); // Manual override
  let rentalYieldGrowthRate = $state(3.0); // As percentage

  // Auto-calculated growth rate based on suburb and property type
  let autoPropertyGrowthRate = $derived(() => {
    if (!selectedSuburb) return 5.1; // Brisbane 30-year average

    // Townhouses use average of house and unit rates
    if (propertyType === 'townhouse') {
      const houseRate = getGrowthRate(selectedSuburb, 'house');
      const unitRate = getGrowthRate(selectedSuburb, 'unit');
      return ((houseRate + unitRate) / 2) * 100; // Convert to percentage
    }

    return getGrowthRate(selectedSuburb, propertyType === 'house' ? 'house' : 'unit') * 100;
  });

  // Final growth rate (auto or manual)
  let propertyGrowthRate = $derived(
    useAutoGrowthRate ? autoPropertyGrowthRate : manualPropertyGrowthRate
  );

  // Computed values
  let deposit = $derived(propertyPrice * (depositPercent / 100));
  let loanAmount = $derived(propertyPrice - deposit);
  let lvr = $derived((loanAmount / propertyPrice) * 100);

  // Check eligibility for 5% deposit scheme
  let isEligibleFor5PercentScheme = $derived(
    isFirstHome &&
    propertyPrice <= FIVE_PERCENT_DEPOSIT_SCHEME.propertyCapBrisbane &&
    depositPercent >= FIVE_PERCENT_DEPOSIT_SCHEME.minimumDeposit * 100
  );

  function handleSubmit(e: Event) {
    e.preventDefault();

    const inputs: PropertyInputs = {
      propertyPrice,
      deposit,
      isFirstHome,
      use5PercentScheme: use5PercentScheme && isEligibleFor5PercentScheme,
      annualIncome,
      loanInterestRate: loanInterestRate / 100,
      loanTermYears,
      weeklyRent,
      // Always include property growth rate (now auto-calculated from suburb/type)
      propertyGrowthRate: propertyGrowthRate / 100,
      ...(showAdvanced && {
        councilRates,
        waterRates,
        insurance,
        maintenanceRate: maintenanceRate / 100,
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
      <label for="propertyType" class="block text-sm font-medium text-gray-700">
        Property Type
      </label>
      <select
        id="propertyType"
        bind:value={propertyType}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="house">House</option>
        <option value="unit">Unit/Apartment</option>
        <option value="townhouse">Townhouse</option>
      </select>
      <p class="mt-1 text-sm text-gray-500">
        Affects growth rate estimation
      </p>
    </div>

    <div class="md:col-span-2">
      <label for="suburb" class="block text-sm font-medium text-gray-700">
        Suburb (Optional - for accurate growth rate)
      </label>
      <select
        id="suburb"
        bind:value={selectedSuburb}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Brisbane Average (5.1%/year)</option>
        <optgroup label="Inner Brisbane (0-10km from CBD)">
          {#each BRISBANE_SUBURBS.filter(s => s.region === 'inner') as suburb}
            <option value={suburb.name}>{suburb.name}</option>
          {/each}
        </optgroup>
        <optgroup label="Middle Ring (10-20km from CBD)">
          {#each BRISBANE_SUBURBS.filter(s => s.region === 'middle') as suburb}
            <option value={suburb.name}>{suburb.name}</option>
          {/each}
        </optgroup>
        <optgroup label="Outer Brisbane (20-40km from CBD)">
          {#each BRISBANE_SUBURBS.filter(s => s.region === 'outer') as suburb}
            <option value={suburb.name}>{suburb.name}</option>
          {/each}
        </optgroup>
        <optgroup label="Regional Centres">
          {#each BRISBANE_SUBURBS.filter(s => s.region === 'regional') as suburb}
            <option value={suburb.name}>{suburb.name}</option>
          {/each}
        </optgroup>
      </select>
      {#if selectedSuburb}
        <p class="mt-1 text-sm text-green-600 font-medium">
          📍 Estimated growth rate: {propertyGrowthRate.toFixed(2)}%/year ({propertyType})
        </p>
      {/if}
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
        step="1000"
        min="0"
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

  <div class="space-y-3">
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

    {#if isFirstHome}
      <div class="ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <label class="flex items-start">
          <input
            type="checkbox"
            bind:checked={use5PercentScheme}
            disabled={!isEligibleFor5PercentScheme}
            class="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
          />
          <div class="ml-3 flex-1">
            <span class="text-sm font-medium text-gray-900">
              Use Australian Government 5% Deposit Scheme
            </span>
            <p class="text-xs text-gray-600 mt-1">
              Save on LMI with as little as 5% deposit • Property cap: {formatCurrency(FIVE_PERCENT_DEPOSIT_SCHEME.propertyCapBrisbane)}
            </p>
            {#if !isEligibleFor5PercentScheme}
              <p class="text-xs text-red-600 mt-2 font-medium">
                {#if propertyPrice > FIVE_PERCENT_DEPOSIT_SCHEME.propertyCapBrisbane}
                  ⚠ Property price exceeds ${formatCurrency(FIVE_PERCENT_DEPOSIT_SCHEME.propertyCapBrisbane)} cap
                {:else if depositPercent < FIVE_PERCENT_DEPOSIT_SCHEME.minimumDeposit * 100}
                  ⚠ Minimum 5% deposit required
                {:else}
                  ⚠ Not eligible (must be first home buyer)
                {/if}
              </p>
            {/if}
          </div>
        </label>
      </div>
    {/if}
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
          <div class="flex items-center justify-between mb-2">
            <label for="propertyGrowth" class="block text-sm font-medium text-gray-700">
              Property Growth Rate (%/year)
            </label>
            <label class="flex items-center text-xs text-gray-600">
              <input
                type="checkbox"
                bind:checked={useAutoGrowthRate}
                class="mr-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-calculate
            </label>
          </div>
          {#if useAutoGrowthRate}
            <div class="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p class="text-sm text-blue-800 font-medium">
                {propertyGrowthRate.toFixed(2)}% (based on {selectedSuburb || 'Brisbane average'} {propertyType})
              </p>
            </div>
          {:else}
            <input
              type="number"
              id="propertyGrowth"
              bind:value={manualPropertyGrowthRate}
              step="0.5"
              min="0"
              max="20"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          {/if}
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
