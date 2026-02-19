"use client";

import { useState, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import axios from "axios";
import ExpertCard, { ExpertCardSkeleton } from "@/components/experts/expert-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Expert } from "@/types";
import ExpertFilters from "@/components/experts/expert-filters";
import { ExpertsFilterSidebar } from "@/components/experts/experts-filter-sidebar";

// Main Experts Page Component
export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retries, setRetries] = useState(0);
  const [savedPreferences, setSavedPreferences] = useState<any>(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // Simplified filters state
  const [filters, setFilters] = useState({
    fields: [],
    goals: [],
    educationLevel: "",
    availability: "all",
    sortBy: "rating",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(8); // Number of experts per page (adjusted for 2x4 grid)

  const fetchExperts = async () => {
    setLoading(true);
    setError("");

    try {
      // Build query parameters based on filters
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      // Add filters to query params
      if (filters.availability !== "all") {
        params.availability = filters.availability;
      }
      
      if (filters.sortBy && filters.sortBy !== "none") {
        params.sortBy = filters.sortBy;
      }

      // Add field filters
      if (filters.fields && filters.fields.length > 0) {
        params.fields = filters.fields.join(',');
      }

      // Add goal filters
      if (filters.goals && filters.goals.length > 0) {
        params.goals = filters.goals.join(',');
      }

      // Add education level filter
      if (filters.educationLevel) {
        params.educationLevel = filters.educationLevel;
      }
      
      const response = await axios.get(`/api/experts`, { params });
      const data = response.data;

      // Handle both paginated and non-paginated responses
      if (data.experts && typeof data.total !== "undefined") {
        // Paginated response
        setExperts(data.experts);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
      } else {
        // Non-paginated response (array of experts)
        setExperts(Array.isArray(data) ? data : []);
        setTotalPages(
          Math.ceil((Array.isArray(data) ? data.length : 0) / itemsPerPage)
        );
      }
    } catch (err: any) {
      console.error("Error fetching experts:", err);

      // Provide more specific error messages based on the error type
      if (err.response) {
        // Server responded with an error status code
        const statusText = err.response.status ? ` (${err.response.status})` : '';
        const message = err.response.data && typeof err.response.data === 'object' && err.response.data.message
          ? err.response.data.message
          : 'Failed to load experts';
        setError(`Server error${statusText}: ${message}`);
      } else if (err.request) {
        // Request was made but no response was received
        setError("Network error: Unable to connect to the server. Please check your connection.");
      } else {
        // Something else happened while setting up the request
        setError("Failed to load experts. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      fields: [],
      goals: [],
      educationLevel: "",
      availability: "all",
      sortBy: "rating",
    });
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem("mentorPreferences");
        if (saved) {
          setSavedPreferences(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };
    loadPreferences();
  }, []);

  // Retry handler
  const handleRetry = () => {
    setRetries(prev => prev + 1);
    fetchExperts();
  };

  useEffect(() => {
    fetchExperts();
  }, [currentPage, itemsPerPage, filters]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && experts.length === 0) {
    // Show skeleton loading state
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Our Experts</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className="pb-16 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <div className="h-10 w-full rounded-md bg-gray-200 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28 mb-2" />
                  <div className="h-10 w-full rounded-md bg-gray-200 animate-pulse"></div>
                </div>
              </div>
            </div>
          </aside>
          <main className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, index) => (
                <ExpertCardSkeleton key={index} />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Our Experts</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-red-700 mb-2">Unable to Load Experts</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Button
            onClick={handleRetry}
            className="gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Retrying..." : "Retry"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Our Experts</h1>

      <div className={`grid grid-cols-1 gap-6 ${isFilterCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-4'}`}>
        {/* Left Sidebar - Filters (collapsible) */}
        {!isFilterCollapsed && (
          <aside className="lg:col-span-1">
            <ExpertsFilterSidebar
              onFiltersChange={handleFiltersChange}
              savedPreferences={savedPreferences}
              isCollapsed={isFilterCollapsed}
              onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
            />
          </aside>
        )}

        <main className={isFilterCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'}>
          {/* Filter toggle button when collapsed */}
          {isFilterCollapsed && (
            <div className="mb-4">
              <ExpertsFilterSidebar
                onFiltersChange={handleFiltersChange}
                savedPreferences={savedPreferences}
                isCollapsed={isFilterCollapsed}
                onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
              />
            </div>
          )}

          {loading && experts.length > 0 ? (
            <div className="absolute inset-0 flex justify-center items-center z-10 bg-white/80">
              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, index) => (
                    <ExpertCardSkeleton key={index} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {experts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No experts found with the selected filters.</p>
              <Button onClick={resetFilters} className="mt-4">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6">
              {experts.map((expert) => (
                <ExpertCard key={expert.expertID} expert={expert} />
              ))}
            </div>
          )}

          {/* Pagination UI */}
          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }}
                    />
                  </PaginationItem>
                )}

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage >= 3) {
                      pageNum = currentPage - 3 + i;
                    }
                    if (pageNum > totalPages) {
                      pageNum = totalPages - (4 - i);
                    }
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </main>
      </div>
    </div>
  );
}
