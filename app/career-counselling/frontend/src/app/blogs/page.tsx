"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BlogCard } from "@/components/blogs/blog-card";
import BlogFilters from "@/components/blogs/blog-filters";
import { Loader2 } from "lucide-react";
import { Blog } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { SkeletonCard, SkeletonCardGrid } from "@/components/shared/loading-indicator";

export default function BlogsPage() {
  const [filters, setFilters] = useState({
    category: "all",
    college: "all",
    branch: "all",
    sortBy: "recent",
  });
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const ITEMS_PER_PAGE = 12;

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      category: "all",
      college: "all",
      branch: "all",
      sortBy: "recent",
    });
    setCurrentPage(1);
  };

  const fetchBlogs = useCallback(async () => {
    setLoading(true);

    try {
      // Prepare query parameters
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortBy: filters.sortBy || "recent",
      };

      // Add refType filter if category is selected
      if (filters.category && filters.category !== "all") {
        params.refType = filters.category;

        // Add typeId filter if college or branch is selected
        if (filters.category === "college" && filters.college && filters.college !== "all") {
          params.typeId = filters.college;
        } else if (filters.category === "collegebranch" && filters.branch && filters.branch !== "all") {
          params.typeId = filters.branch;
        }
      }

      const response = await axios.get("/api/blogs/", { params });

      // Handle both paginated and non-paginated responses
      if (response.data.blogs && typeof response.data.total !== "undefined") {
        // Paginated response
        setBlogs(response.data.blogs);
        setTotalBlogs(response.data.total);
        setTotalPages(Math.ceil(response.data.total / ITEMS_PER_PAGE));
      } else {
        // Non-paginated response (array of blogs)
        const newBlogs = Array.isArray(response.data) ? response.data : [];
        setBlogs(newBlogs);
        setTotalBlogs(newBlogs.length);
        setTotalPages(Math.ceil(newBlogs.length / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, ITEMS_PER_PAGE]);

  // Initial load and when filters/page change
  useEffect(() => {
    fetchBlogs();
  }, [currentPage, filters, fetchBlogs]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Career Insights Blog <span className="text-lg font-normal text-gray-500">({totalBlogs} articles)</span></h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/4 overflow-y-auto pr-2">
          <div className="pb-16 sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button
                variant="default"
                size="sm"
                onClick={resetFilters}
                className="bg-black text-white hover:bg-gray-800 text-xs"
              >
                Reset All
              </Button>
            </div>
            <BlogFilters filters={filters} onChange={setFilters} />
          </div>
        </aside>

        <main className="lg:w-3/4 relative">
          {loading && blogs.length === 0 ? (
            <SkeletonCardGrid
              count={9}
              columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              className="py-4"
            />
          ) : (
            <>
              {/* Loading overlay for filter changes */}
              {loading && (
                <div className="absolute inset-0 flex justify-center items-center z-10 bg-white/80">
                  <div className="w-full">
                    <SkeletonCardGrid
                      count={9}
                      columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      className="opacity-70"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <BlogCard key={blog.blogID} blog={blog} />
                ))}
              </div>

              {blogs.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No blogs found matching your filters.
                  </p>
                </div>
              )}

              {/* Pagination UI */}
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1)
                            handlePageChange(currentPage - 1);
                        }}
                        className={
                          currentPage <= 1
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {/* First page */}
                    {currentPage >= 3 && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(1);
                          }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Ellipsis if not showing first page */}
                    {currentPage >= 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Pages around current page */}
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum = currentPage - 1 + i;
                      // Adjust if we're at the start
                      if (currentPage <= 2) {
                        pageNum = i + 1;
                      }
                      // Adjust if we're at the end
                      else if (currentPage >= totalPages - 1) {
                        pageNum = totalPages - 2 + i;
                      }

                      // Skip if page number is out of range
                      if (pageNum <= 0 || pageNum > totalPages) {
                        return null;
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
                    }).filter(Boolean)}

                    {/* Ellipsis if not showing last page */}
                    {currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Last page */}
                    {totalPages > 3 && currentPage < totalPages - 1 && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(totalPages);
                          }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages)
                            handlePageChange(currentPage + 1);
                        }}
                        className={
                          currentPage >= totalPages
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
