import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchBrisbaneGrowthRates, type ABSGrowthRate } from '$lib/api/abs-api';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'abs-cache.json');
const CACHE_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days (quarterly)

interface CachedData {
  data: ABSGrowthRate;
  cachedAt: string;
}

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  const dataDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Read cached data if available and fresh
 */
function readCache(): ABSGrowthRate | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const cached: CachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    const cacheAge = Date.now() - new Date(cached.cachedAt).getTime();

    // Return cached data if less than 90 days old
    if (cacheAge < CACHE_DURATION_MS) {
      console.log('Using cached ABS data from', cached.cachedAt);
      return cached.data;
    }

    console.log('Cache expired, fetching fresh data');
    return null;
  } catch (error) {
    console.error('Failed to read cache:', error);
    return null;
  }
}

/**
 * Write data to cache
 */
function writeCache(data: ABSGrowthRate) {
  try {
    ensureDataDir();
    const cached: CachedData = {
      data,
      cachedAt: new Date().toISOString(),
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cached, null, 2), 'utf-8');
    console.log('Cached ABS data at', cached.cachedAt);
  } catch (error) {
    console.error('Failed to write cache:', error);
  }
}

/**
 * GET /api/abs/growth-rates
 *
 * Returns Brisbane property growth rates from ABS.
 * Caches data for 90 days to avoid excessive API calls.
 * Use ?force=true to bypass cache and fetch fresh data.
 */
export const GET: RequestHandler = async ({ url }) => {
  const forceRefresh = url.searchParams.get('force') === 'true';

  try {
    // Try to use cached data first
    if (!forceRefresh) {
      const cachedData = readCache();
      if (cachedData) {
        return json({
          success: true,
          data: cachedData,
          cached: true,
        });
      }
    }

    // Fetch fresh data from ABS
    console.log('Fetching fresh data from ABS API...');
    const data = await fetchBrisbaneGrowthRates();

    // Cache the result
    writeCache(data);

    return json({
      success: true,
      data,
      cached: false,
    });
  } catch (error) {
    console.error('ABS API error:', error);

    // If fetch fails, try to return stale cache as fallback
    const staleCache = readCache();
    if (staleCache) {
      console.log('Returning stale cache due to fetch error');
      return json({
        success: true,
        data: staleCache,
        cached: true,
        stale: true,
        error: 'Failed to fetch fresh data, using cached version',
      });
    }

    // No cache available, return error
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch ABS data',
      },
      { status: 500 }
    );
  }
};
