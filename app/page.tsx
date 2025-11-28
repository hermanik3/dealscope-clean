"use client";

import { useState, FormEvent, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2, Menu } from "lucide-react";

// Adds Amazon affiliate tag safely whether URL has ? or not
const withAffiliate = (url: string) =>
  url.includes("?")
    ? `${url}&tag=dealscope0b-20`
    : `${url}?tag=dealscope0b-20`;

const buildAffiliateLink = (retailer: string, productId: string) => {
  return `/api/go/${retailer}/${productId}`;
};

type SearchResult = {
  source: "amazon" | "bestbuy";
  title: string;
  price: string | null;
  link: string;
  thumbnail: string | null;
  rating?: number;
  reviews?: number;
};

function parsePrice(price: string | null): number | null {
  if (!price) return null;

  // Remove anything that is not a digit, dot or comma
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(",", "");
  const num = Number(cleaned);

  if (isNaN(num)) return null;
  return num;
}

export default function Site() {
  const nav = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "services", label: "Why DealScope" },
    { id: "pro", label: "Pro" },
    { id: "extension", label: "Extension" },
    { id: "testimonials", label: "Testimonials" },
    { id: "contact", label: "Contact" },
  ];

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
const [sortBy, setSortBy] = useState<"relevance" | "price-asc" | "price-desc">(
  "relevance"
);

const [storeFilter, setStoreFilter] = useState<"all" | "amazon" | "bestbuy">(
  "all"
);

const [priceFilter, setPriceFilter] = useState<
  "all" | "under-50" | "50-100" | "over-100"
>("all");

const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(false);

const loaderRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  if (!hasMore) return;       // no more pages → nothing to observe
  if (loading) return;        // don’t trigger while already loading

  const target = loaderRef.current;
  if (!target) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const first = entries[0];
      if (first.isIntersecting) {
        // When the sentinel enters view, load the next page
        handleLoadMore();
      }
    },
    {
      root: null,
      rootMargin: "200px", // start loading a bit before it appears
      threshold: 0,
    }
  );

  observer.observe(target);

  return () => {
    observer.disconnect();
  };
}, [hasMore, loading, handleLoadMore]);

const bestDeal = useMemo(() => {
  if (!results.length) return null;

  // Normalize search term into words
  const query = searchTerm.toLowerCase().trim();
  let candidates = results;

  if (query) {
    const words = query
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1); // ignore 1-letter stuff

    if (words.length) {
      const filtered = results.filter((item) => {
        const title = (item.title || "").toLowerCase();
        // keep items where **any** word appears in the title
        return words.some((word) => title.includes(word));
      });

      // If we found matching titles, only use those as candidates
      if (filtered.length) {
        candidates = filtered;
      }
    }
  }

  // Now pick the cheapest item among candidates
  let best: SearchResult | null = null;
  let bestPrice: number | null = null;

  for (const r of candidates) {
    const p = parsePrice(r.price);
    if (p === null) continue;

    if (bestPrice === null || p < bestPrice) {
      bestPrice = p;
      best = r;
    }
  }

  return best;
}, [results, searchTerm]);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }
      setResults(data.results || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }
async function handleLoadMore() {
  if (loading) return; // avoid double calls
  if (!searchTerm.trim()) return;

  const nextPage = page + 1;

  setLoading(true);
  setError(null);

  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(searchTerm)}&page=${nextPage}`
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Search failed");
    }

    const newResults: SearchResult[] = data.results || [];

    if (newResults.length === 0) {
      // no more results
      setHasMore(false);
      return;
    }

    // append new results to the old ones
    setResults((prev) => [...prev, ...newResults]);
    setPage(nextPage);
    setHasMore(Boolean(data.hasMore));
  } catch (err: any) {
    console.error(err);
    setError(err.message || "Search failed");
  } finally {
    setLoading(false);
  }
}

  return (
  <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-sky-50 text-slate-800">
 
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-emerald-100">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl bg-slate-900 flex items-center justify-center text-[0.6rem] font-semibold tracking-[0.25em] text-emerald-300">
              DS
            </div>
            <span className="font-semibold tracking-tight">DealScope</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-sm hover:text-slate-900 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a href="#home">
              <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white border-none">
                Start Searching
              </Button>
            </a>
          </nav>
          <button
            className="md:hidden p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t">
            <div className="mx-auto max-w-6xl px-4 py-3 grid gap-3">
              {nav.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-sm"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

     {/* Hero */}
<section id="home" className="relative overflow-hidden">
  <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-white to-white" />
  <div className="mx-auto max-w-6xl px-4 py-20 grid lg:grid-cols-2 gap-10 items-center">
    {/* LEFT SIDE: title, search bar, bullets */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
        Find anything at the lowest price online
      </h1>

      <p className="mt-4 text-slate-600 max-w-xl">
        DealScope is a sale-focused product search engine that will scan trusted
        retailers to find the best live price and send you there in one click.
      </p>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mt-6 w-full max-w-xl">
  <div className="flex items-center w-full bg-white border rounded-2xl px-3 py-2 shadow-sm">

    {/* INPUT FIELD */}
    <input
      type="text"
      placeholder="Search any product..."
      className="flex-1 outline-none text-sm bg-transparent"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />

    {/* SEARCH BUTTON ICON */}
    <button
      type="submit"
      className="p-2 rounded-xl hover:bg-slate-100 transition"
      aria-label="Search"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="h-5 w-5 text-black"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1111.1 3a7.5 7.5 0 015.55 13.65z"
        />
      </svg>
    </button>
  </div>

  <p className="text-xs text-slate-500 mt-2">
    Example: AirPods Pro, 4K TV, running shoes, gaming chair
  </p>
</form>

      {error && (
        <p className="mt-4 text-sm text-red-600 max-w-xl">{error}</p>
      )}

      <ul className="mt-6 grid gap-2 text-sm text-slate-600">
        {[
          "We scan top retailers to find the best live price.",
          "You see real discounts, not fake was-$999 marketing.",
          "In one click, you go straight to the lowest-priced offer.",
        ].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {t}
          </li>
        ))}
      </ul>
    </motion.div>

    {/* RIGHT SIDE: dynamic best-deal card */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative"
    >
     <div className="aspect-video w-full rounded-2xl bg-slate-100 shadow-inner flex flex-col justify-center p-5">
  {bestDeal ? (
    <>
     <p
  className={`text-[11px] uppercase font-semibold mb-1 ${
    bestDeal.source === "amazon" ? "text-emerald-700" : "text-blue-700"
  }`}
>
  {bestDeal.source === "amazon" ? "Amazon" : "Best Buy"} • Best overall price
</p>

      {/* image */}
      {bestDeal.thumbnail && (
        <div className="mb-3">
          <img
            src={bestDeal.thumbnail}
            alt={bestDeal.title}
            className="w-full max-h-40 object-contain rounded-lg border bg-white"
          />
        </div>
      )}

      {/* title + price */}
      <div className="flex items-start justify-between text-sm mb-2 gap-3">
        <span className="font-medium text-slate-800 line-clamp-2">
          {bestDeal.title}
        </span>
        <p className="text-[11px] uppercase text-slate-500 mb-1">
  {bestDeal.source === "amazon" ? "Amazon" : "Best Buy"}
</p>
        {bestDeal.price && (
          <span className="text-sm text-emerald-600 font-semibold whitespace-nowrap">
            {bestDeal.price}
          </span>
        )}
      </div>

      {/* rating */}
      {(bestDeal.rating || bestDeal.reviews) && (
        <p className="text-xs text-slate-500 mb-4">
          {bestDeal.rating && `${bestDeal.rating} ★`}{" "}
          {bestDeal.reviews && `• ${bestDeal.reviews} reviews`}
        </p>
      )}

      {/* clickable button as a real link */}
      <a
  href={withAffiliate(bestDeal.link)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center justify-center rounded-2xl w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-sm font-medium"
      >
        Go to this deal <ArrowRight className="ml-2 h-4 w-4" />
      </a>
    </>
  ) : (
    <>
      {/* Fallback sample content before the first search */}
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
        Sample result
      </p>
      <div className="flex items-center justify-between text-sm mb-3">
        <span className="font-medium text-slate-800">
          Wireless Headphones Pro
        </span>
        <span className="text-xs text-emerald-600 font-semibold">
          Lowest price
        </span>
      </div>
      <div className="grid gap-2 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span>Retailer A</span>
          <span className="line-through">$249.99</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Retailer B</span>
          <span className="line-through">$219.99</span>
        </div>
        <div className="flex items-center justify-between font-semibold text-slate-900">
          <span>Retailer C (DealScope pick)</span>
          <span>$189.99</span>
        </div>
      </div>
      <a
        href={buildAffiliateLink("amazon", "SAMPLE_ID")}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center justify-center rounded-2xl w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-sm font-medium"
      >
        Go to lowest price <ArrowRight className="ml-2 h-4 w-4" />
      </a>
    </>
  )}
</div>

      <div className="absolute -bottom-6 -left-6 hidden md:block h-28 w-28 rounded-3xl bg-slate-900/90" />
    </motion.div>
  </div>
</section>

      {/* Results section */}
     {results.length > 0 && (
  <section className="mx-auto max-w-6xl px-4 pb-16">
    {/* Header + filters */}
    <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
      <h2 className="text-xl font-semibold tracking-tight">
        Search results from Amazon &amp; Best Buy
      </h2>

      <div className="flex flex-wrap gap-3 text-sm">
        {/* Store filter */}
        <div className="inline-flex rounded-full border bg-white px-1 py-1">
          {[
            { id: "all", label: "All" },
            { id: "amazon", label: "Amazon" },
            { id: "bestbuy", label: "Best Buy" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                setStoreFilter(opt.id as "all" | "amazon" | "bestbuy")
              }
              className={`px-3 py-1 rounded-full ${
                storeFilter === opt.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Price filter */}
        <select
          value={priceFilter}
          onChange={(e) =>
            setPriceFilter(
              e.target.value as "all" | "under-50" | "50-100" | "over-100"
            )
          }
          className="h-9 rounded-full border px-3 text-sm text-slate-700 bg-white"
        >
          <option value="all">All prices</option>
          <option value="under-50">Under $50</option>
          <option value="50-100">$50 – $100</option>
          <option value="over-100">Over $100</option>
        </select>
      </div>
    </div>

    {/* Results grid + best-price logic */}
    {(() => {
      // 0) Apply filters
      const filteredResults = results.filter((r) => {
        // Store filter
        if (storeFilter === "amazon" && r.source !== "amazon") return false;
        if (storeFilter === "bestbuy" && r.source !== "bestbuy") return false;

        // Price filter
        const p = parsePrice(r.price);
        if (p === null) return false;

        if (priceFilter === "under-50" && p >= 50) return false;
        if (priceFilter === "50-100" && (p < 50 || p > 100)) return false;
        if (priceFilter === "over-100" && p <= 100) return false;

        return true;
      });

      if (!filteredResults.length) {
        return (
          <p className="text-sm text-slate-500">
            No deals match your filters yet.
          </p>
        );
      }

      // 1) compute best overall and best per store
      let bestOverallPrice: number | null = null;
      let bestAmazonPrice: number | null = null;
      let bestBestBuyPrice: number | null = null;

      for (const r of filteredResults) {
        const p = parsePrice(r.price);
        if (p === null) continue;

        if (bestOverallPrice === null || p < bestOverallPrice) {
          bestOverallPrice = p;
        }

        if (r.source === "amazon") {
          if (bestAmazonPrice === null || p < bestAmazonPrice) {
            bestAmazonPrice = p;
          }
        } else if (r.source === "bestbuy") {
          if (bestBestBuyPrice === null || p < bestBestBuyPrice) {
            bestBestBuyPrice = p;
          }
        }
      }

      // 2) sort according to sortBy
      const sortedResults = [...filteredResults].sort((a, b) => {
        if (sortBy === "relevance") return 0;

        const pa = parsePrice(a.price);
        const pb = parsePrice(b.price);

        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;

        if (sortBy === "price-asc") return pa - pb;
        if (sortBy === "price-desc") return pb - pa;

        return 0;
      });

      return (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedResults.map((item) => {
              const priceNumber = parsePrice(item.price);

              const isBestOverall =
                bestOverallPrice !== null &&
                priceNumber !== null &&
                priceNumber === bestOverallPrice;

              const isBestInStore =
                priceNumber !== null &&
                ((item.source === "amazon" &&
                  bestAmazonPrice !== null &&
                  priceNumber === bestAmazonPrice) ||
                  (item.source === "bestbuy" &&
                    bestBestBuyPrice !== null &&
                    priceNumber === bestBestBuyPrice));

              return (
                <Card
                  key={item.link}
                  className="rounded-2xl h-full flex flex-col"
                >
                  <CardContent className="pt-4 flex flex-col gap-3">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-40 object-contain rounded-lg border bg-slate-50"
                      />
                    )}

                    {/* Store label */}
                    <p
                      className={`text-xs uppercase font-semibold ${
                        item.source === "amazon"
                          ? "text-emerald-600"
                          : "text-blue-600"
                      }`}
                    >
                      {item.source === "amazon" ? "Amazon" : "Best Buy"}
                    </p>

                    {/* Badges */}
                    {isBestOverall ? (
                      <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Best overall price
                      </span>
                    ) : isBestInStore ? (
                      <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        Best price on{" "}
                        {item.source === "amazon" ? "Amazon" : "Best Buy"}
                      </span>
                    ) : null}

                    {/* Title */}
                    <p className="text-sm font-semibold text-slate-900 line-clamp-3">
                      {item.title}
                    </p>

                    {/* Price */}
                    {item.price && (
                      <p className="text-sm text-emerald-700 font-semibold">
                        {item.price}
                      </p>
                    )}

                    {/* Rating */}
                    {(item.rating || item.reviews) && (
                      <p className="text-xs text-slate-500">
                        {item.rating && `${item.rating} ★`}{" "}
                        {item.reviews && `• ${item.reviews} reviews`}
                      </p>
                    )}

                    {/* Link */}
                    <a
                      href={withAffiliate(item.link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-medium rounded-2xl border px-3 py-2 hover:bg-slate-50"
                    >
                      {item.source === "amazon"
                        ? "View on Amazon"
                        : "View on Best Buy"}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div
              ref={loaderRef}
              className="mt-8 h-10 flex items-center justify-center"
            >
              {loading && (
                <p className="text-sm text-slate-500">
                  Loading more deals…
                </p>
              )}
            </div>
          )}
        </>
      );
    })()}
  </section>
)} 

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight">About DealScope</h2>
            <p className="mt-3 text-slate-600">
              DealScope is a sale-only product search engine designed to help shoppers quickly find the
              lowest price on anything online. We compare real prices from multiple retailers and highlight
              true deals, so you do not waste time opening 20 tabs to check everything yourself.
            </p>
          </div>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Fast facts</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm text-slate-600">
                <li>• Founded: 2025</li>
                <li>• HQ: East Moline, IL</li>
                <li>• Focus: Lowest-price deal search</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-emerald-50/70">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Why shoppers use DealScope</h2>
          <p className="mt-2 text-slate-600 max-w-2xl">
            Each of these features is designed to save you money, time, and endless tab-switching while
            you shop online.
          </p>
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Lowest price search",
                desc: "Instantly find the best price for any product across top retailers.",
              },
              {
                title: "Verified deals only",
                desc: "We filter out fake discounts and highlight only real price drops.",
              },
              {
                title: "One-click buy",
                desc: "Jump straight to the lowest-priced retailer with a single tap.",
              },
              {
                title: "Category browsing",
                desc: "Explore trending deals in electronics, fashion, home, and more.",
              },
              {
                title: "Price tracking",
                desc: "Save items and get notified when the price drops (coming soon).",
              },
              {
                title: "Retailer transparency",
                desc: "See who sells it, for how much, and how it compares, instantly.",
              },
            ].map((s) => (
              <Card key={s.title} className="rounded-2xl h-full">
                <CardHeader>
                  <CardTitle>{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pro */}
      <section id="pro" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">DealScope Pro – price alerts</h2>
            <p className="mt-3 text-slate-600">
              DealScope Pro will let power shoppers track the products they care about and get notified the
              moment prices drop. No more checking the same pages every day, we will watch them for you.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-600">
              <li>• Track multiple products across Amazon, Walmart, Best Buy, and more.</li>
              <li>• Get email alerts when a price drops below your target.</li>
              <li>• View simple price history so you know if it is really a good deal.</li>
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white border-none" disabled>
                Join Pro waitlist – coming soon
              </Button>
              <p className="text-xs text-slate-500 max-w-xs">
                DealScope Pro will launch with a free trial and simple monthly pricing for serious deal hunters.
              </p>
            </div>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="pt-6 text-sm text-slate-600 grid gap-3">
              <div className="rounded-xl border border-dashed p-3 text-xs bg-slate-50">
                <p className="font-medium mb-1">Example watchlist</p>
                <ul className="space-y-1">
                  <li>• 55 inch 4K TV – target price $499</li>
                  <li>• Running shoes – target price $79</li>
                  <li>• Wireless earbuds – target price $99</li>
                </ul>
                <p className="mt-2 text-[11px] text-slate-500">
                  DealScope Pro will periodically re-check these items and email you as soon as any of them
                  drop below your target price.
                </p>
              </div>
              <p>
                Behind the scenes, DealScope Pro will use the same search engine that powers this site to refresh
                prices and compare them.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Extension */}
      <section id="extension" className="mx-auto max-w-6xl px-4 py-16 bg-sky-50/70">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">DealScope Chrome extension</h2>
            <p className="mt-3 text-slate-600">
              Soon, you will be able to bring DealScope with you anywhere you shop online. Our Chrome extension
              will detect the product you are viewing and check if there is a lower price at other trusted
              retailers, then send you there in one click.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-600">
              <li>• Works on Amazon, Walmart, Best Buy, and more.</li>
              <li>• Shows a small DealScope banner only when a real deal is found.</li>
              <li>• Uses the same lowest-price engine as this website.</li>
            </ul>
            <Button className="mt-6 rounded-2xl bg-slate-900 text-white" disabled>
              Chrome extension – coming soon
            </Button>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">
                Example: you are viewing wireless headphones on Amazon. DealScope quietly checks other stores in the
                background and lets you know if Walmart, Best Buy, or another retailer beats the price.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
<section
  id="testimonials"
  className="mx-auto max-w-6xl px-4 py-16 bg-slate-900 text-slate-50 rounded-3xl my-8"
>
  <h2 className="text-2xl font-semibold tracking-tight">What users say</h2>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
         <Card className="rounded-2xl bg-slate-800 border-slate-700">
  <CardContent className="pt-6">
    <p className="text-slate-50">
      ...
    </p>
    <p className="mt-4 text-sm text-slate-400">— Sarah M.</p>
  </CardContent>
</Card> 
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <p className="text-slate-700">
                "I love how simple it is. One search, I see the real deals, click once, and I’m done. No more
                comparing 20 tabs."
              </p>
              <p className="mt-4 text-sm text-slate-500">— Daniel K.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-emerald-50/70">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Get in touch</h2>
          <p className="mt-2 text-slate-600 max-w-2xl">
            Have a question or partnership idea? Reach out here.
          </p>
          <div className="mt-8 grid lg:grid-cols-2 gap-8">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm border"
            >
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  placeholder="Your name"
                  className="h-11 rounded-xl border px-3 outline-none"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-xl border px-3 outline-none"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  placeholder="Tell us how you would like to work with DealScope"
                  className="rounded-xl border p-3 outline-none"
                />
              </div>
              <Button
                type="submit"
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white border-none"
              >
                Send
              </Button>
              <p className="text-xs text-slate-500">This demo form does not submit yet.</p>
            </form>
            <div className="grid gap-4 content-start">
              <Card className="rounded-2xl">
                <CardContent className="pt-6 grid gap-3 text-slate-700">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> info@dealscope.shop
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> (309) 350-1062
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> East Moline, IL
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300 mt-8">
  <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
    <p className="text-sm text-slate-400">
      © {new Date().getFullYear()} DealScope. All rights reserved.
    </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#about" className="hover:underline">
              About
            </a>
            <a href="#services" className="hover:underline">
              Why DealScope
            </a>
            <a href="#pro" className="hover:underline">
              Pro
            </a>
            <a href="#extension" className="hover:underline">
              Extension
            </a>
            <a href="#contact" className="hover:underline">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
