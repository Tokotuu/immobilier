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
  INDEX_HOUSES: '1', // Index Numbers - Houses
  INDEX_UNITS: '2',  // Index Numbers - Attached dwellings (units)
  INDEX_ALL: '3',    // Index Numbers - All residential
} as const;

export interface ABSDataPoint {
  period: string; // e.g., "2024-Q3"
  value: number;  // Index value
}

export interface ABSPropertyData {
  region: string;
  measure: string;
  frequency: string;
  data: ABSDataPoint[];
  lastUpdated: string;
}

export interface ABSGrowthRate {
  region: string;
  houseGrowthRate: number; // Annual growth rate (decimal)
  unitGrowthRate: number;  // Annual growth rate (decimal)
  allResidentialGrowthRate: number;
  period: string; // e.g., "2024-Q3"
  lastUpdated: string;
  source: 'ABS_RES_DWELL';
}

/**
 * Fetch residential property index data from ABS
 */
export async function fetchABSPropertyData(
  region: string = ABS_REGIONS.BRISBANE,
  measure: string = ABS_MEASURES.INDEX_ALL,
  yearsOfData: number = 10
): Promise<ABSPropertyData> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - yearsOfData);

  // Format dates as YYYY-QN
  const startPeriod = `${startDate.getFullYear()}-Q1`;
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
    // SDMX-JSON structure: dataSets[0].observations
    const observations = jsonData.data?.dataSets?.[0]?.observations;
    const dimensions = jsonData.data?.structure?.dimensions?.observation;

    if (!observations || !dimensions) {
      throw new Error('Invalid SDMX-JSON structure');
    }

    // Find the TIME_PERIOD dimension index
    const timeDimension = dimensions.find((d: any) => d.id === 'TIME_PERIOD');
    if (!timeDimension) {
      throw new Error('TIME_PERIOD dimension not found');
    }

    const dataPoints: ABSDataPoint[] = [];

    // Observations is an object with keys like "0:0" where first number is dimension index
    for (const [key, valueArray] of Object.entries(observations)) {
      const [timeIndex] = key.split(':').map(Number);
      const period = timeDimension.values[timeIndex].id;
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
 * Calculate annual growth rate from quarterly index data
 */
export function calculateGrowthRate(data: ABSDataPoint[], yearsToAverage: number = 10): number {
  if (data.length < 4) {
    throw new Error('Insufficient data points to calculate growth rate');
  }

  // Get the most recent value
  const latestValue = data[data.length - 1].value;
  const latestPeriod = data[data.length - 1].period;

  // Get value from yearsToAverage ago (or as far back as we have)
  const quartersBack = Math.min(yearsToAverage * 4, data.length - 1);
  const oldValue = data[data.length - 1 - quartersBack].value;

  // Calculate compound annual growth rate (CAGR)
  const years = quartersBack / 4;
  const growthRate = Math.pow(latestValue / oldValue, 1 / years) - 1;

  return growthRate;
}

/**
 * Fetch Brisbane property growth rates (houses, units, all residential)
 */
export async function fetchBrisbaneGrowthRates(): Promise<ABSGrowthRate> {
  try {
    // Fetch data for all property types
    const [housesData, unitsData, allResidentialData] = await Promise.all([
      fetchABSPropertyData(ABS_REGIONS.BRISBANE, ABS_MEASURES.INDEX_HOUSES, 10),
      fetchABSPropertyData(ABS_REGIONS.BRISBANE, ABS_MEASURES.INDEX_UNITS, 10),
      fetchABSPropertyData(ABS_REGIONS.BRISBANE, ABS_MEASURES.INDEX_ALL, 10),
    ]);

    // Calculate 10-year average growth rates
    const houseGrowthRate = calculateGrowthRate(housesData.data, 10);
    const unitGrowthRate = calculateGrowthRate(unitsData.data, 10);
    const allResidentialGrowthRate = calculateGrowthRate(allResidentialData.data, 10);

    // Get latest period
    const latestPeriod = allResidentialData.data[allResidentialData.data.length - 1].period;

    return {
      region: 'Brisbane',
      houseGrowthRate,
      unitGrowthRate,
      allResidentialGrowthRate,
      period: latestPeriod,
      lastUpdated: new Date().toISOString(),
      source: 'ABS_RES_DWELL',
    };
  } catch (error) {
    console.error('Failed to fetch Brisbane growth rates:', error);
    throw error;
  }
}
