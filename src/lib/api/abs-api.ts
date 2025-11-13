/**
 * ABS (Australian Bureau of Statistics) Data API Integration
 *
 * Fetches residential property price data from the official ABS RES_DWELL dataset
 * Documentation: https://www.abs.gov.au/about/data-services/application-programming-interfaces-apis/data-api-user-guide
 */

const ABS_BASE_URL = 'https://data.api.abs.gov.au/rest/data';
const DATAFLOW_ID = 'RES_DWELL';

// Region codes for ABS API
export const ABS_REGIONS = {
  BRISBANE: '3GBRI',
  SYDNEY: '1GSYD',
  MELBOURNE: '1GMEL',
  ADELAIDE: '2GADE',
  PERTH: '5GPER',
  HOBART: '6GHOB',
  DARWIN: '7GDAR',
  CANBERRA: '8ACTE',
} as const;

// Measure codes
export const ABS_MEASURES = {
  MEDIAN_PRICE_HOUSES: '3', // Median Price - Established House Transfers (in $'000)
  MEDIAN_PRICE_UNITS: '4',  // Median Price - Attached Dwelling Transfers (in $'000)
  TRANSFER_COUNT_HOUSES: '1', // Number of Established House Transfers
  TRANSFER_COUNT_UNITS: '2',  // Number of Attached Dwelling Transfers
} as const;

export interface ABSDataPoint {
  period: string; // e.g., "2024-Q3"
  value: number;  // Median price in $'000 (e.g., 757 = $757,000)
}

export interface ABSPropertyData {
  region: string;
  measure: string;
  frequency: string;
  data: ABSDataPoint[];
  lastUpdated: string;
}

export interface GrowthScenarios {
  fiveYear: number;   // 5-year CAGR (optimistic - recent trends)
  tenYear: number;    // 10-year CAGR (balanced - full cycle)
  fifteenYear: number; // 15-year CAGR (conservative - longer view)
}

export interface ABSGrowthRate {
  region: string;

  // Growth rate scenarios for different property types
  houses: GrowthScenarios;
  units: GrowthScenarios;
  allResidential: GrowthScenarios;

  // Historical data for transparency
  historicalData: {
    houses: ABSDataPoint[];
    units: ABSDataPoint[];
  };

  // Metadata
  metadata: {
    firstPeriod: string;
    latestPeriod: string;
    totalQuarters: number;
    lastUpdated: string;
  };

  source: 'ABS_RES_DWELL';

  // Backward compatibility (deprecated - use houses.tenYear instead)
  /** @deprecated Use houses.tenYear instead */
  houseGrowthRate?: number;
  /** @deprecated Use units.tenYear instead */
  unitGrowthRate?: number;
  /** @deprecated Use allResidential.tenYear instead */
  allResidentialGrowthRate?: number;
  /** @deprecated Use metadata.latestPeriod instead */
  period?: string;
  /** @deprecated Use metadata.lastUpdated instead */
  lastUpdated?: string;
}

/**
 * Fetch residential property median price data from ABS
 * Fetches all available historical data (back to 2002)
 */
export async function fetchABSPropertyData(
  region: string = ABS_REGIONS.BRISBANE,
  measure: string = ABS_MEASURES.MEDIAN_PRICE_HOUSES
): Promise<ABSPropertyData> {
  // Fetch ALL available data - ABS has data back to 2002
  const startPeriod = '2002-Q1';

  const endDate = new Date();
  const endYear = endDate.getFullYear();
  const endQuarter = Math.floor(endDate.getMonth() / 3) + 1;
  const endPeriod = `${endYear}-Q${endQuarter}`;

  // Construct API URL
  // Format: /data/ABS,RES_DWELL/{measure}.{region}.Q
  const url = `${ABS_BASE_URL}/ABS,${DATAFLOW_ID}/${measure}.${region}.Q?startPeriod=${startPeriod}&endPeriod=${endPeriod}&detail=dataonly`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.sdmx.data+json;version=1.0.0-wd',
      },
    });

    if (!response.ok) {
      throw new Error(`ABS API error: ${response.status} ${response.statusText}`);
    }

    const jsonData = await response.json();

    // Parse SDMX-JSON format
    const data = parseSDMXJSON(jsonData);

    return {
      region,
      measure,
      frequency: 'Q',
      data,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch ABS data:', error);
    throw error;
  }
}

/**
 * Parse SDMX-JSON format from ABS API
 */
function parseSDMXJSON(jsonData: any): ABSDataPoint[] {
  try {
    // SDMX-JSON structure: dataSets[0].series (not observations)
    const dataSet = jsonData.data?.dataSets?.[0];
    const series = dataSet?.series;
    const dimensions = jsonData.data?.structure?.dimensions;

    if (!series || !dimensions) {
      throw new Error('Invalid SDMX-JSON structure');
    }

    // Find the TIME_PERIOD dimension (in observation dimensions)
    const timeDimension = dimensions.observation?.find((d: any) => d.id === 'TIME_PERIOD');
    if (!timeDimension) {
      throw new Error('TIME_PERIOD dimension not found');
    }

    const dataPoints: ABSDataPoint[] = [];

    // Get the first (and usually only) series
    // Series is keyed like "0:0:0" (measure:region:frequency)
    const seriesKey = Object.keys(series)[0];
    if (!seriesKey) {
      throw new Error('No series data found');
    }

    const observations = series[seriesKey].observations;
    if (!observations) {
      throw new Error('No observations found in series');
    }

    // Observations is an object with keys like "0", "1", "2" (time indices)
    for (const [timeIndex, valueArray] of Object.entries(observations)) {
      const period = timeDimension.values[parseInt(timeIndex)].id;
      const value = (valueArray as number[])[0];

      dataPoints.push({ period, value });
    }

    // Sort by period
    return dataPoints.sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    console.error('Failed to parse SDMX-JSON:', error);
    throw error;
  }
}

/**
 * Calculate annual growth rate from quarterly median price data
 */
export function calculateGrowthRate(data: ABSDataPoint[], yearsToAverage: number = 10): number {
  if (data.length < 4) {
    throw new Error('Insufficient data points to calculate growth rate');
  }

  // Get the most recent value
  const latestValue = data[data.length - 1].value;

  // Get value from yearsToAverage ago (or as far back as we have)
  const quartersBack = Math.min(yearsToAverage * 4, data.length - 1);
  const oldValue = data[data.length - 1 - quartersBack].value;

  if (oldValue === 0) {
    throw new Error('Invalid data: zero or negative prices');
  }

  // Calculate compound annual growth rate (CAGR)
  const years = quartersBack / 4;
  const growthRate = Math.pow(latestValue / oldValue, 1 / years) - 1;

  return growthRate;
}

/**
 * Calculate growth scenarios for different timeframes
 */
export function calculateGrowthScenarios(data: ABSDataPoint[]): GrowthScenarios {
  if (data.length < 20) { // At least 5 years of data
    throw new Error('Insufficient data to calculate scenarios (minimum 5 years required)');
  }

  return {
    fiveYear: calculateGrowthRate(data, 5),
    tenYear: calculateGrowthRate(data, 10),
    fifteenYear: calculateGrowthRate(data, 15),
  };
}

/**
 * Fetch Brisbane property growth rates with multiple scenarios
 * Returns all available historical data and 5/10/15-year growth rates
 */
export async function fetchBrisbaneGrowthRates(): Promise<ABSGrowthRate> {
  try {
    // Fetch ALL available historical data for both property types
    const [housesData, unitsData] = await Promise.all([
      fetchABSPropertyData(ABS_REGIONS.BRISBANE, ABS_MEASURES.MEDIAN_PRICE_HOUSES),
      fetchABSPropertyData(ABS_REGIONS.BRISBANE, ABS_MEASURES.MEDIAN_PRICE_UNITS),
    ]);

    // Calculate growth scenarios for each property type
    const houseScenarios = calculateGrowthScenarios(housesData.data);
    const unitScenarios = calculateGrowthScenarios(unitsData.data);

    // Calculate weighted average scenarios (60% houses, 40% units - typical Brisbane mix)
    const allResidentialScenarios: GrowthScenarios = {
      fiveYear: houseScenarios.fiveYear * 0.6 + unitScenarios.fiveYear * 0.4,
      tenYear: houseScenarios.tenYear * 0.6 + unitScenarios.tenYear * 0.4,
      fifteenYear: houseScenarios.fifteenYear * 0.6 + unitScenarios.fifteenYear * 0.4,
    };

    // Get metadata from houses data (both should have same periods)
    const firstPeriod = housesData.data[0].period;
    const latestPeriod = housesData.data[housesData.data.length - 1].period;
    const totalQuarters = housesData.data.length;

    return {
      region: 'Brisbane',

      // Growth scenarios by property type
      houses: houseScenarios,
      units: unitScenarios,
      allResidential: allResidentialScenarios,

      // Store all historical data
      historicalData: {
        houses: housesData.data,
        units: unitsData.data,
      },

      // Metadata
      metadata: {
        firstPeriod,
        latestPeriod,
        totalQuarters,
        lastUpdated: new Date().toISOString(),
      },

      source: 'ABS_RES_DWELL',

      // Backward compatibility (use 10-year as default)
      houseGrowthRate: houseScenarios.tenYear,
      unitGrowthRate: unitScenarios.tenYear,
      allResidentialGrowthRate: allResidentialScenarios.tenYear,
      period: latestPeriod,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch Brisbane growth rates:', error);
    throw error;
  }
}
