import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import RandomImage from "../shared/random-image";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface RelatedVideosProps {
  currentVideoId: string | number;
}

interface Video {
  videoID: string;
  title: string;
  thumbnail?: string;
  duration: string;
  views: number;
  expertID: string;
  expertName?: string;
  expertAvatar?: string;
}

export default function RelatedVideos({ currentVideoId }: RelatedVideosProps) {
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(3); // Number of related videos per page

  useEffect(() => {
    const fetchRelatedVideos = async () => {
      if (!currentVideoId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/videos/${currentVideoId}/related?page=${currentPage}&limit=${itemsPerPage}`
        );
        if (!response.ok) throw new Error("Failed to fetch related videos");

        const data = await response.json();

        // Handle both paginated and non-paginated responses
        const videosData = data.videos || data;
        setRelatedVideos(videosData);

        // Set total pages if available in response
        if (data.totalPages) {
          setTotalPages(data.totalPages);
        } else if (data.total) {
          setTotalPages(Math.ceil(data.total / itemsPerPage));
        } else {
          // If server doesn't support pagination yet, calculate pages from returned data
          setTotalPages(
            Math.max(1, Math.ceil(videosData.length / itemsPerPage))
          );
        }
      } catch (err) {
        console.error("Error fetching related videos:", err);
        setError("Failed to load related videos");
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedVideos();
  }, [currentVideoId, currentPage, itemsPerPage]);

  // Format views count similar to expert-videos.tsx
  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    } else {
      return views.toString();
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading && relatedVideos.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Related Videos</h3>
        <div className="text-sm text-gray-500">Loading related videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Related Videos</h3>
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (relatedVideos.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Related Videos</h3>
        <div className="text-sm text-gray-500">No related videos available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Related Videos</h3>
      {relatedVideos.map((video) => (
        <Link key={video.videoID} href={`/videos/${video.videoID}`}>
          <Card className="hover:shadow-md transition-shadow">
            <div className="flex space-x-4">
              <div className="relative w-40 h-24">
                <RandomImage
                  alt={video.title}
                  fill
                  className="object-cover rounded-l-lg"
                ></RandomImage>
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                  {video.duration}
                </div>
              </div>
              <CardContent className="flex-1 p-3">
                <h4 className="font-medium text-sm mb-2 line-clamp-2">
                  {video.title}
                </h4>
                <div className="flex items-center text-xs text-gray-500 space-x-2">
                  <span>{video.expertName || "Expert"}</span>
                  <span>•</span>
                  <div className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    <span>{formatViews(video.views)}</span>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </Link>
      ))}
      {/* Pagination UI */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
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

            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
              // Simplified pagination for sidebar (showing fewer page numbers)
              let pageNum = i + 1;
              if (totalPages > 3) {
                if (currentPage > 2) {
                  pageNum = currentPage - 2 + i;
                }
                // Ensure we don't go beyond total pages
                if (pageNum > totalPages) {
                  pageNum = totalPages - (2 - i);
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
      {loading && relatedVideos.length > 0 && (
        <div className="text-sm text-center text-gray-500">
          Loading more videos...
        </div>
      )}
    </div>
  );
}
