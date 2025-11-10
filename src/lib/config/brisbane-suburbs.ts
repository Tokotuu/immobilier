/**
 * Brisbane suburb-specific property growth rates
 * Based on CoreLogic historical data (10-year averages)
 *
 * Note: These are estimates and past performance doesn't guarantee future results
 */

export interface SuburbData {
  name: string;
  medianHousePrice: number;
  medianUnitPrice: number;
  houseGrowthRate: number; // 10-year average annual %
  unitGrowthRate: number;
  region: 'inner' | 'middle' | 'outer' | 'regional';
}

export const BRISBANE_SUBURBS: SuburbData[] = [
  // Inner Brisbane (5-10km from CBD)
  {
    name: 'Brisbane CBD',
    medianHousePrice: 1200000,
    medianUnitPrice: 650000,
    houseGrowthRate: 0.055, // 5.5%
    unitGrowthRate: 0.035, // 3.5%
    region: 'inner',
  },
  {
    name: 'New Farm',
    medianHousePrice: 1800000,
    medianUnitPrice: 750000,
    houseGrowthRate: 0.06,
    unitGrowthRate: 0.04,
    region: 'inner',
  },
  {
    name: 'Paddington',
    medianHousePrice: 1500000,
    medianUnitPrice: 650000,
    houseGrowthRate: 0.065,
    unitGrowthRate: 0.04,
    region: 'inner',
  },
  {
    name: 'West End',
    medianHousePrice: 1400000,
    medianUnitPrice: 700000,
    houseGrowthRate: 0.07,
    unitGrowthRate: 0.045,
    region: 'inner',
  },

  // Middle Ring (10-20km from CBD)
  {
    name: 'Wynnum',
    medianHousePrice: 900000,
    medianUnitPrice: 550000,
    houseGrowthRate: 0.065,
    unitGrowthRate: 0.04,
    region: 'middle',
  },
  {
    name: 'Ashgrove',
    medianHousePrice: 1300000,
    medianUnitPrice: 600000,
    houseGrowthRate: 0.055,
    unitGrowthRate: 0.035,
    region: 'middle',
  },
  {
    name: 'Coorparoo',
    medianHousePrice: 1100000,
    medianUnitPrice: 580000,
    houseGrowthRate: 0.06,
    unitGrowthRate: 0.04,
    region: 'middle',
  },
  {
    name: 'Carindale',
    medianHousePrice: 950000,
    medianUnitPrice: 520000,
    houseGrowthRate: 0.055,
    unitGrowthRate: 0.038,
    region: 'middle',
  },

  // Outer Brisbane (20-40km from CBD)
  {
    name: 'Logan Central',
    medianHousePrice: 600000,
    medianUnitPrice: 380000,
    houseGrowthRate: 0.08, // High growth, affordable area
    unitGrowthRate: 0.05,
    region: 'outer',
  },
  {
    name: 'Ipswich',
    medianHousePrice: 550000,
    medianUnitPrice: 350000,
    houseGrowthRate: 0.07,
    unitGrowthRate: 0.045,
    region: 'outer',
  },
  {
    name: 'Caboolture',
    medianHousePrice: 580000,
    medianUnitPrice: 380000,
    houseGrowthRate: 0.065,
    unitGrowthRate: 0.04,
    region: 'outer',
  },
  {
    name: 'Redland Bay',
    medianHousePrice: 720000,
    medianUnitPrice: 480000,
    houseGrowthRate: 0.06,
    unitGrowthRate: 0.04,
    region: 'outer',
  },

  // Regional Centres
  {
    name: 'Gold Coast',
    medianHousePrice: 1000000,
    medianUnitPrice: 650000,
    houseGrowthRate: 0.058,
    unitGrowthRate: 0.04,
    region: 'regional',
  },
  {
    name: 'Sunshine Coast',
    medianHousePrice: 1100000,
    medianUnitPrice: 700000,
    houseGrowthRate: 0.062,
    unitGrowthRate: 0.042,
    region: 'regional',
  },
];

// Default growth rates by region (if suburb not found)
export const REGION_DEFAULTS = {
  inner: { house: 0.06, unit: 0.04 },
  middle: { house: 0.058, unit: 0.038 },
  outer: { house: 0.068, unit: 0.043 },
  regional: { house: 0.06, unit: 0.04 },
  unknown: { house: 0.051, unit: 0.035 }, // Conservative estimate
};

/**
 * Get suburb data by name
 */
export function getSuburbData(suburbName: string): SuburbData | null {
  return BRISBANE_SUBURBS.find(
    (s) => s.name.toLowerCase() === suburbName.toLowerCase()
  ) || null;
}

/**
 * Get appropriate growth rate based on suburb and property type
 */
export function getGrowthRate(
  suburbName: string | null,
  propertyType: 'house' | 'unit'
): number {
  if (suburbName) {
    const suburb = getSuburbData(suburbName);
    if (suburb) {
      return propertyType === 'house' ? suburb.houseGrowthRate : suburb.unitGrowthRate;
    }
  }

  // Default to conservative estimate
  return propertyType === 'house'
    ? REGION_DEFAULTS.unknown.house
    : REGION_DEFAULTS.unknown.unit;
}
