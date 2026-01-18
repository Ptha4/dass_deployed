"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  Calendar,
  Trash2,
  Eye,
  MessageSquare,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import MarkdownViewer from "@/components/shared/markdown-viewer";
import { toast } from "sonner";
import type { Post } from "@/types";
import CommentsSection from "@/components/shared/comments-section";
import { useAuth } from "@/contexts/AuthContext";
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

interface ExpertPostsProps {
  expertId: string;
  expertName: string;
  expertInitials: string;
  isExpertLoggedIn?: boolean;
}

export default function ExpertPosts({
  expertId,
  expertName,
  expertInitials,
  isExpertLoggedIn = false,
}: ExpertPostsProps) {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState<Set<string>>(
    new Set()
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(5); // Number of posts per page

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // Update API call to support pagination
        const response = await fetch(
          `/api/experts/${expertId}/posts?page=${currentPage}&limit=${itemsPerPage}`
        );
        if (!response.ok) throw new Error("Failed to fetch posts");

        const data = await response.json();

        // Check if data has pagination structure, otherwise handle as array
        const postsData = data.posts || data;
        setPosts(postsData);

        // Set total pages if available in response
        if (data.totalPages) {
          setTotalPages(data.totalPages);
        } else if (data.total) {
          setTotalPages(Math.ceil(data.total / itemsPerPage));
        } else {
          // If server doesn't support pagination yet, calculate pages from returned data
          setTotalPages(
            Math.max(1, Math.ceil(postsData.length / itemsPerPage))
          );
        }

        // Record which posts are liked by the current user
        if (user && user._id) {
          const liked = new Set<string>();
          postsData.forEach((post: Post) => {
            if (post.likedBy && post.likedBy.includes(user._id)) {
              liked.add(post.postId);
            }
          });
          setLikedPosts(liked);
        }
      } catch (err) {
        setError("Failed to load posts");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [expertId, user, currentPage, itemsPerPage]);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated || !user) {
      toast.error("You must be logged in to like posts");
      return;
    }

    try {
      // Check current like status before API call
      const wasLiked = likedPosts.has(postId);

      // Dismiss any existing toast messages
      toast.dismiss();

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to like post");

      const updatedPost = await response.json();

      // Update all state at once to minimize renders
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post.postId === postId ? updatedPost : post))
      );

      // Update liked posts set
      const newLikedPosts = new Set(likedPosts);
      if (wasLiked) {
        newLikedPosts.delete(postId);
        // Show unlike toast
        toast.error("Unliked the post");
      } else {
        newLikedPosts.add(postId);
        // Show like toast
        toast.success("Liked the post");
      }
      setLikedPosts(newLikedPosts);
    } catch (err) {
      toast.error("Failed to update like");
      console.error(err);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!isExpertLoggedIn) return;

    try {
      // Store post data before deletion for potential undo
      const postToDelete = posts.find((post) => post.postId === postId);
      if (!postToDelete) return;

      // Remove post from state
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.postId !== postId)
      );

      // Show toast with undo option
      toast("Post deleted", {
        description: "The post has been removed",
        action: {
          label: "Undo",
          onClick: async () => {
            // Restore post in UI immediately
            setPosts((prevPosts) =>
              [...prevPosts, postToDelete].sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
            );
            toast.success("Post restored");
          },
        },
        duration: 5000, // 5 seconds before permanent deletion
        onAutoClose: async () => {
          // Permanently delete the post after toast disappears
          try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/posts/${postId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) throw new Error("Failed to delete post");
          } catch (err) {
            // If deletion fails, restore the post and show an error
            setPosts((prevPosts) =>
              [...prevPosts, postToDelete].sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
            );
            toast.error("Failed to delete post");
            console.error(err);
          }
        },
      });
    } catch (err) {
      toast.error("Failed to delete post");
      console.error(err);
    }
  };

  // Track view when post is expanded
  const handlePostView = async (postId: string) => {
    try {
      // Only track the view if the post is newly expanded
      if (expandedPostId !== postId) {
        await fetch(`/api/posts/${postId}/view`, {
          method: "POST",
        });
      }
    } catch (err) {
      console.error("Error tracking post view:", err);
    }
  };

  // Toggle post expansion for comments
  const togglePostExpansion = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      handlePostView(postId);
    }
  };

  // Toggle content expansion for "Read more" functionality
  const toggleContentExpansion = (postId: string) => {
    const newExpandedContent = new Set(expandedContent);
    if (newExpandedContent.has(postId)) {
      newExpandedContent.delete(postId);
    } else {
      newExpandedContent.add(postId);
    }
    setExpandedContent(newExpandedContent);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading && posts.length === 0) {
    return <div className="py-8 text-center">Loading posts...</div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {posts.length === 0 && !loading ? (
        <div className="py-8 text-center text-gray-500">
          No posts available yet.
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <Card key={post.postId} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {post.expertDetails?.initials || expertInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <p className="font-semibold text-blue-700">
                        {post.expertDetails?.name || expertName}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                        {isExpertLoggedIn && (
                          <button
                            onClick={() => handleDelete(post.postId)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Delete post"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="prose prose-blue max-w-none mb-4 break-all relative">
                      {post.content.length > 150 &&
                      !expandedContent.has(post.postId) ? (
                        <>
                          <div className="max-h-48 overflow-hidden">
                            <MarkdownViewer
                              content={post.content.substring(0, 150) + "..."}
                            />
                            {/* Add gradient overlay */}
                            <div className="absolute inset-x-0 bottom-6 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 p-1 h-auto"
                            onClick={() => toggleContentExpansion(post.postId)}
                          >
                            <span>Show more</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <MarkdownViewer content={post.content} />
                          {post.content.length > 150 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 p-1 h-auto"
                              onClick={() =>
                                toggleContentExpansion(post.postId)
                              }
                            >
                              <span>Show less</span>
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-start gap-6 pt-2 text-gray-500 text-sm">
                      <button
                        className={`flex items-center gap-1 hover:text-blue-600 ${
                          likedPosts.has(post.postId) ? "text-blue-600" : ""
                        }`}
                        onClick={() => handleLike(post.postId)}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            likedPosts.has(post.postId) ? "fill-blue-600" : ""
                          }`}
                        />
                        <span>{post.likes}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.views || 0}</span>
                      </div>

                      <button
                        className={`flex items-center gap-1 hover:text-blue-600 ${
                          expandedPostId === post.postId ? "text-blue-600" : ""
                        }`}
                        onClick={() => togglePostExpansion(post.postId)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Comments</span>
                      </button>
                    </div>

                    {/* Comments section (visible when expanded) */}
                    {expandedPostId === post.postId && (
                      <div className="mt-4 border-t pt-4">
                        <CommentsSection
                          pageId={post.postId}
                          type="post"
                          title="Comments"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                {/* Previous Button */}
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

                {/* Next Button */}
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
      {loading && posts.length > 0 && (
        <div className="py-4 text-center text-gray-500">
          Loading more posts...
        </div>
      )}
    </div>
  );
}
