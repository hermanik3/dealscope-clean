import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) || 1 : 1;

  if (!q) {
    return NextResponse.json(
      { error: "Missing search term" },
      { status: 400 }
    );
  }

  if (!RAINFOREST_API_KEY && !BESTBUY_API_KEY) {
    return NextResponse.json(
      { error: "Server is not configured with any provider API keys" },
      { status: 500 }
    );
  }

  const tasks: Promise<ProviderResult>[] = [];

  // AMAZON via Rainforest API
  if (RAINFOREST_API_KEY) {
    const amazonTask: Promise<ProviderResult> = (async () => {
      try {
        const apiUrl = `https://api.rainforestapi.com/request?api_key=${RAINFOREST_API_KEY}&type=search&amazon_domain=amazon.com&search_term=${encodeURIComponent(
          q
        )}&page=${page}`;

        const res = await fetch(apiUrl);
        if (!res.ok) {
          console.error("Amazon/Rainforest error status:", res.status);
          return { results: [], hasMore: false };
        }

        const json = await res.json();

        const results: UnifiedResult[] = (json.search_results ?? []).map(
          (item: any) => ({
            source: "amazon",
            title: item.title,
            price: item.price?.raw ?? null,
            link: item.link,
            thumbnail: item.image ?? null,
            rating:
              typeof item.rating === "number" ? item.rating : undefined,
            reviews:
              typeof item.reviews === "number" ? item.reviews : undefined,
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
    })();

    tasks.push(amazonTask);
  }

  // BEST BUY Products API
  if (BESTBUY_API_KEY) {
    const bestBuyTask: Promise<ProviderResult> = (async () => {
      try {
        // Best Buy search API: search across products by keyword
        const bbUrl = `https://api.bestbuy.com/v1/products((search=${encodeURIComponent(
          q
        )}))?apiKey=${BESTBUY_API_KEY}&format=json&pageSize=10&page=${page}`;

        const res = await fetch(bbUrl);
        if (!res.ok) {
          console.error("Best Buy API error status:", res.status);
          return { results: [], hasMore: false };
        }

        const json = await res.json();
        const products = json.products ?? [];
console.log("Best Buy products count:", products.length);

        const results: UnifiedResult[] = products.map((p: any) => {
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
            link: p.url, // direct Best Buy product URL
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
    })();

    tasks.push(bestBuyTask);
  }

  try {
    const providerResults = await Promise.all(tasks);

    const allResults = providerResults.flatMap((p) => p.results);
    const hasMore = providerResults.some((p) => p.hasMore);

    return NextResponse.json({ results: allResults, hasMore });
  } catch (err) {
    console.error("Combined providers exception:", err);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
