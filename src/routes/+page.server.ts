import type { PageServerLoad } from './$types';
import type { ABSGrowthRate } from '$lib/api/abs-api';

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    // Fetch ABS data from our API endpoint
    const response = await fetch('/api/abs/growth-rates');

    if (!response.ok) {
      console.warn('Failed to fetch ABS data:', response.statusText);
      return {
        absData: null,
      };
    }

    const result = await response.json();

    if (result.success) {
      return {
        absData: result.data as ABSGrowthRate,
        absCached: result.cached,
        absStale: result.stale,
      };
    }

    return {
      absData: null,
    };
  } catch (error) {
    console.error('Error loading ABS data:', error);
    return {
      absData: null,
    };
  }
};
