"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { PostCard } from "@/components/posts/post-card";
import PostFilters from "@/components/posts/post-filters";
import { Loader2 } from "lucide-react";
import { Post } from "@/types";
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

export default function PostsPage() {
  const [filters, setFilters] = useState({
    sortBy: "recent",
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const ITEMS_PER_PAGE = 12;

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      sortBy: "recent",
    });
    setCurrentPage(1);
  };

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    try {
      // Prepare query parameters
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortBy: filters.sortBy || "recent",
      };

      const response = await axios.get("/api/posts/", { params });

      // Handle both paginated and non-paginated responses
      if (response.data.posts && typeof response.data.total !== "undefined") {
        // Paginated response
        setPosts(response.data.posts);
        setTotalPosts(response.data.total);
        setTotalPages(Math.ceil(response.data.total / ITEMS_PER_PAGE));
      } else {
        // Non-paginated response (array of posts)
        const newPosts = Array.isArray(response.data) ? response.data : [];
        setPosts(newPosts);
        setTotalPosts(newPosts.length);
        setTotalPages(Math.ceil(newPosts.length / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, ITEMS_PER_PAGE]);

  // Initial load and when filters/page change
  useEffect(() => {
    fetchPosts();
  }, [currentPage, filters, fetchPosts]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Discussion Posts{" "}
        <span className="text-lg font-normal text-gray-500">
          ({totalPosts} posts)
        </span>
      </h1>

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
            <PostFilters filters={filters} onChange={setFilters} />
          </div>
        </aside>

        <main className="lg:w-3/4 relative">
          {loading && posts.length === 0 ? (
            <SkeletonCardGrid
              count={9}
              columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
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
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post.postId} post={post} />
                ))}
              </div>

              {posts.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No posts found matching your filters.
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
