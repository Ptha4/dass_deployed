"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchResults from "@/components/shared/navbar/search-results";
import SearchBar from "@/components/shared/navbar/search-bar";
import SearchFilters from "@/components/search/search-filters";
import { useInView } from "react-intersection-observer";
import LoadingIndicator from "@/components/shared/loading-indicator";

// Create a client component wrapper for the search functionality that uses useSearchParams
function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("category") || "";
  const typeFilter = searchParams.get("type") || "";

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { ref, inView } = useInView();

  return (
    <div className="container mx-auto px-4 py-6 mt-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Search Results</h1>
        <div className="mb-6">
          <SearchBar initialQuery={query} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <SearchFilters
              initialCategory={categoryFilter}
              initialType={typeFilter}
            />
          </div>
          <div className="md:col-span-3">
            <SearchResults
              query={query}
              categoryFilter={categoryFilter}
              typeFilter={typeFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the page with suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <SearchContent />
    </Suspense>
  );
}
