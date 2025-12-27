import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;
const BESTBUY_API_KEY = process.env.BESTBUY_API_KEY;

type UnifiedResult = {
  source: "amazon" | "bestbuy";
  title: string;
  price: string | null;
  link: string;
  thumbnail: string | null;
  rating?: number;
  reviews?: number;
};

type ProviderResult = {
  results: UnifiedResult[];
  hasMore: boolean;
};

// ------------ L1 cache (in-memory; keep) ------------
const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  expires: number;
  data: { results: UnifiedResult[]; hasMore: boolean };
};

const cache = new Map<string, CacheEntry>();

function makeCacheKey(q: string, page: number, provider: string) {
  return `${q.toLowerCase()}::${page}::${provider}`;
}

// ------------ L2 cache (Redis; NEW) ------------
const REDIS_TTL_SECONDS = 60 * 10; // 10 minutes

function makeRedisKey(q: string, page: number, provider: string) {
  // versioned key so you can change format later without conflicts
  return `dealscope:search:v1:${q.toLowerCase()}::${page}::${provider}`;
}

// ------------ timeout helper ------------
function withTimeout<T>(promise: Promise<T>, ms = 4000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Request timed out")), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ------------ Amazon ------------
async function fetchAmazon(q: string, page: number): Promise<ProviderResult> {
  if (!RAINFOREST_API_KEY) return { results: [], hasMore: false };

  try {
    const apiUrl = `https://api.rainforestapi.com/request?api_key=${RAINFOREST_API_KEY}&type=search&amazon_domain=amazon.com&search_term=${encodeURIComponent(
      q
    )}&page=${page}`;

    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
      console.error("Amazon/Rainforest error status:", res.status);
      return { results: [], hasMore: false };
    }

    const json = await res.json();

    const results: UnifiedResult[] = (json.search_results ?? []).map(
      (item: any): UnifiedResult => ({
        source: "amazon",
        title: item.title,
        price: item.price?.raw ?? null,
        link: item.link,
        thumbnail: item.image ?? null,
        rating: typeof item.rating === "number" ? item.rating : undefined,
        reviews: typeof item.reviews === "number" ? item.reviews : undefined,
      })
    );

    const pagination = json.pagination;
    let hasMore = false;
    if (
      pagination &&
      typeof pagination.current_page === "number" &&
      typeof pagination.total_pages === "number"
    ) {
      hasMore = pagination.current_page < pagination.total_pages;
    } else {
      hasMore = results.length > 0;
    }

    return { results, hasMore };
  } catch (err) {
    console.error("Amazon/Rainforest exception:", err);
    return { results: [], hasMore: false };
  }
}

// ------------ Best Buy ------------
async function fetchBestBuy(q: string, page: number): Promise<ProviderResult> {
  if (!BESTBUY_API_KEY) return { results: [], hasMore: false };

  try {
    const bbUrl = `https://api.bestbuy.com/v1/products((search=${encodeURIComponent(
      q
    )}))?apiKey=${BESTBUY_API_KEY}&format=json&pageSize=10&page=${page}`;

    const res = await fetch(bbUrl, { cache: "no-store" });
    if (!res.ok) {
      console.error("Best Buy API error status:", res.status);
      return { results: [], hasMore: false };
    }

    const json = await res.json();
    const products = json.products ?? [];

    const results: UnifiedResult[] = products.map((p: any): UnifiedResult => {
      let price: string | null = null;
      if (typeof p.salePrice === "number") {
        price = `$${p.salePrice.toFixed(2)}`;
      } else if (typeof p.regularPrice === "number") {
        price = `$${p.regularPrice.toFixed(2)}`;
      }

      return {
        source: "bestbuy",
        title: p.name,
        price,
        link: p.url,
        thumbnail: p.image ?? null,
        rating:
          typeof p.customerReviewAverage === "number"
            ? p.customerReviewAverage
            : undefined,
        reviews:
          typeof p.customerReviewCount === "number"
            ? p.customerReviewCount
            : undefined,
      };
    });

    const totalPages =
      typeof json.totalPages === "number" ? json.totalPages : null;
    const currentPage =
      typeof json.currentPage === "number" ? json.currentPage : page;

    const hasMore =
      totalPages !== null ? currentPage < totalPages : results.length > 0;

    return { results, hasMore };
  } catch (err) {
    console.error("Best Buy API exception:", err);
    return { results: [], hasMore: false };
  }
}

// ------------ main handler ------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const pageParam = searchParams.get("page");
  const providerParam = (searchParams.get("provider") || "amazon").toLowerCase();

  // provider can be: "amazon" | "bestbuy" | "all"
  const useAmazon = providerParam === "amazon" || providerParam === "all";
  const useBestBuy = providerParam === "bestbuy" || providerParam === "all";

  const page = pageParam ? parseInt(pageParam, 10) || 1 : 1;

  if (!q) {
    return NextResponse.json({ error: "Missing search term" }, { status: 400 });
  }

  if (!RAINFOREST_API_KEY && !BESTBUY_API_KEY) {
    return NextResponse.json(
      { error: "Server is not configured with any provider API keys" },
      { status: 500 }
    );
  }

  const cacheKey = makeCacheKey(q, page, providerParam);

  // ✅ 1) L1 in-memory cache (fastest)
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ ...cached.data, cached: true, cacheLayer: "L1" });
  }

  // ✅ 2) L2 Redis cache (persistent across requests/instances)
  const redisKey = makeRedisKey(q, page, providerParam);
  try {
    const redisCached = await redis.get<{ results: UnifiedResult[]; hasMore: boolean }>(
      redisKey
    );

    if (redisCached) {
      // refresh L1 for super fast repeat hits
      cache.set(cacheKey, {
        expires: Date.now() + CACHE_TTL_MS,
        data: redisCached,
      });

      return NextResponse.json({
        ...redisCached,
        cached: true,
        cacheLayer: "REDIS",
      });
    }
  } catch (err) {
    // If Redis is misconfigured or temporarily down, don't break search.
    console.error("Redis read error:", err);
  }

  // ✅ 3) Live fetch if not cached
  const providerPromises: Promise<ProviderResult>[] = [];

  if (useAmazon) {
    providerPromises.push(
      withTimeout(fetchAmazon(q, page), 4000).catch((err) => {
        console.error("Amazon timed out / failed:", err);
        return { results: [], hasMore: false };
      })
    );
  }

  if (useBestBuy) {
    providerPromises.push(
      withTimeout(fetchBestBuy(q, page), 4000).catch((err) => {
        console.error("BestBuy timed out / failed:", err);
        return { results: [], hasMore: false };
      })
    );
  }

  try {
    const providerResults = await Promise.all(providerPromises);

    let allResults = providerResults.flatMap((p) => p.results);
    allResults = allResults.slice(0, 30); // cap size

    const hasMore = providerResults.some((p) => p.hasMore);

    const payload = { results: allResults, hasMore };

    // ✅ Save to L1
    cache.set(cacheKey, {
      expires: Date.now() + CACHE_TTL_MS,
      data: payload,
    });

    // ✅ Save to Redis (don’t cache empty results)
    if (payload.results.length > 0) {
      try {
        await redis.set(redisKey, payload, { ex: REDIS_TTL_SECONDS });
      } catch (err) {
        console.error("Redis write error:", err);
      }
    }

    return NextResponse.json({ ...payload, cached: false, cacheLayer: "LIVE" });
  } catch (err) {
    console.error("Combined providers exception:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
