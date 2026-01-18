"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import CollegeCard from "@/components/colleges/college-card";
import CollegeFilters from "@/components/colleges/college-filters";
import CollegeSorting from "@/components/colleges/college-sorting";
import { College } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  SkeletonCardGrid
} from "@/components/shared/loading-indicator";

export default function CollegesPage() {
  const [filters, setFilters] = useState({
    state: "",
    course: "",
    landArea: 0,
    placement: 0,
    type: "",
    locality_type: "",
    ranking: "",
  });
  
  // Sorting state
  const [sortOptions, setSortOptions] = useState<{
    fields: { field: string; order: 'asc' | 'desc'; priority: number }[];
  }>({
    fields: []
  });
  
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10); // Number of colleges per page

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      state: "",
      course: "",
      landArea: 0,
      placement: 0,
      type: "",
      locality_type: "",
      ranking: "",
    });
    setSortOptions({ fields: [] });
    setCurrentPage(1);
  };

  const fetchColleges = useCallback(async () => {
    setLoading(true);

    try {
      // Add a console log to see what parameters we're sending
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        landArea: filters.landArea || undefined,
        placement: filters.placement || undefined,
        college_type: filters.type || undefined,
        locality_type: filters.locality_type || undefined,
        state:
          filters.state && filters.state !== "All States"
            ? filters.state
            : undefined,
        course_category:
          filters.course && filters.course !== "All Courses"
            ? filters.course
            : undefined,
        sort: sortOptions.fields.map(
          (field) => `${field.field}:${field.order}`
        ).join(","),
      };
      
      const response = await axios.get("/api/colleges/", { params });
      
      // Handle paginated response
      if (response.data && response.data.colleges) {
        setColleges(response.data.colleges);
        setTotalPages(
          response.data.totalPages || 
          Math.ceil(response.data.total / itemsPerPage) || 
          1
        );
      } else {
        // Fallback to handling non-paginated response (array of colleges)
        setColleges(Array.isArray(response.data) ? response.data : []);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error fetching colleges:", error);
      setColleges([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortOptions, itemsPerPage]);

  // Initial load and when currentPage or filters change
  useEffect(() => {
    fetchColleges();
  }, [currentPage, filters, sortOptions, fetchColleges]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Explore Colleges</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/4">
          <div className="sticky top-4">
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
            <CollegeFilters filters={filters} onChange={setFilters} />
          </div>
        </aside>

        <main className="lg:w-3/4 relative">
          {loading ? (
            <SkeletonCardGrid
              count={6}
              columns="grid-cols-1 md:grid-cols-2"
              className="py-4"
            />
          ) : (
            <>
              <CollegeSorting sortOptions={sortOptions} onChange={setSortOptions} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {colleges.map((college) => (
                  <CollegeCard
                    key={college.collegeID}
                    college={{
                      collegeID: college.collegeID,
                      name: college.name,
                      address: college.address || "Location not specified",
                      type: college.type || "Not specified",
                      yearOfEstablishment: college.yearOfEstablishment || -1,
                      landArea: college.landArea || -1,
                      placement: college.placement || -1,
                      placementMedian: college.placementMedian || -1,
                    }}
                  />
                ))}
              </div>

              {colleges.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No colleges found matching your filters.
                  </p>
                </div>
              )}

              {/* Pagination UI */}
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={
                        currentPage <= 1 ? "opacity-50 pointer-events-none" : ""
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}
