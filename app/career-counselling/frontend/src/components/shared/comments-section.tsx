"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Reply, MessageSquare } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Comment } from "@/types";

interface CommentsSectionProps {
  pageId: string | number | undefined;
  type: "blog" | "video" | "post" | "expert";
  title?: string;
}

export default function CommentsSection({
  pageId,
  type,
  title = "Comments",
}: CommentsSectionProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10); // Number of comments per page
  const [totalComments, setTotalComments] = useState(0);

  const fetchComments = useCallback(async () => {
    if (!pageId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/comments?page_id=${pageId}&type=${type}&page=${currentPage}&limit=${itemsPerPage}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized. Please log in.");
        } else {
          setError(`Failed to fetch comments: ${response.statusText}`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Handle both paginated and non-paginated responses
      if (data.comments && typeof data.total !== "undefined") {
        // Paginated response
        setComments(data.comments);
        setTotalComments(data.total);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
      } else if (Array.isArray(data)) {
        // Non-paginated response (array of comments)
        setComments(data);
        setTotalComments(data.length);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
      } else if (data.data && Array.isArray(data.data)) {
        // Another common format: { data: [...comments] }
        setComments(data.data);
        setTotalComments(data.data.length);
        setTotalPages(Math.ceil(data.data.length / itemsPerPage));
      } else {
        // Empty or unexpected format
        console.log("Unexpected data format:", data);
        setComments([]);
        setTotalComments(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error(`Error fetching ${type} comments:`, err);
      setError(`Failed to fetch comments. Please try again later.`);
    } finally {
      setLoading(false);
    }
  }, [pageId, currentPage, type, itemsPerPage]);

  useEffect(() => {
    if (pageId) {
      fetchComments();
    }
  }, [pageId, currentPage, type, fetchComments]);

  const handleComment = async () => {
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }

    if (!comment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    const token = localStorage.getItem("token");
    const newComment = {
      content: comment,
      type: type,
      page_id: pageId,
    };

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newComment),
      });

      if (response.ok) {
        const data = await response.json();
        // If we're on the first page, add the new comment to the top
        if (currentPage === 1) {
          setComments((prev) => [data, ...prev.slice(0, itemsPerPage - 1)]);
        }
        // Increment total comments
        setTotalComments((prev) => prev + 1);
        // Recalculate total pages
        setTotalPages(Math.ceil((totalComments + 1) / itemsPerPage));
        setComment("");
        // If we're not on the first page, go to the first page to see the new comment
        if (currentPage !== 1) {
          setCurrentPage(1);
        }
        toast.success("Comment posted successfully");
      } else {
        setError("Failed to post comment");
        toast.error("Failed to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("Failed to post comment");
      toast.error("Failed to post comment");
    }
  };

  const handleReply = async (commentId: string) => {
    if (!user) {
      toast.error("You must be logged in to reply");
      return;
    }

    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    const token = localStorage.getItem("token");
    const reply = {
      content: replyContent,
      type: type,
      page_id: pageId,
      parent_id: commentId,
    };

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reply),
      });

      if (response.ok) {
        const newReply = await response.json();

        // Add the reply to its parent comment
        setComments((prevComments) =>
          prevComments.map((comment) => {
            if (comment.commentID === commentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              };
            }
            return comment;
          })
        );

        // Reset reply state
        setReplyingTo(null);
        setReplyContent("");
        toast.success("Reply posted successfully");
      } else {
        setError("Failed to post reply");
        toast.error("Failed to post reply");
      }
    } catch (err) {
      setError("Failed to post reply");
      console.error(err);
      toast.error("Failed to post reply");
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="rounded-lg bg-white p-6 border border-gray-200 shadow-sm animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <div className="w-1 h-8 bg-primary-blue mr-3 rounded-full transition-all duration-300 hover:h-10"></div>
          {title}
          <span className="ml-2 text-lg font-normal text-gray-500">
            ({totalComments})
          </span>
        </h2>
      </div>

      {/* Comment Form */}
      <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 mb-8 transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
        <div className="flex space-x-4">
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm transition-transform duration-300 hover:scale-110">
            <AvatarImage
              src={user?.avatar ? String(user.avatar) : "/avatars/user.jpg"}
            />
            <AvatarFallback className="bg-primary-blue text-white">
              {user ? user.firstName?.[0] : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] border-gray-200 focus:border-primary-blue focus:ring-primary-blue/20 resize-none rounded-md transition-all duration-200"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setComment("")}
                className="text-gray-600 border-gray-200 transition-colors duration-200 hover:border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleComment}
                disabled={!comment.trim() || !user}
                className="bg-primary-blue hover:bg-primary-blue/90 text-white transition-all duration-200 hover:shadow"
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-8 animate-pulse">
            <div className="flex space-x-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded"></div>
                  <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg transition-all duration-300 animate-fadeIn hover:shadow-sm">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4 transition-transform duration-500 hover:rotate-12">
              <MessageSquare className="h-8 w-8 text-primary-blue" />
            </div>
            <p className="text-gray-600 mb-4">
              No comments yet. Be the first to comment!
            </p>
            {!user && (
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/login")}
                className="border-gray-200 transition-transform duration-200 hover:scale-105"
              >
                Login to comment
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {comments.map((comment, index) => (
                <div
                  key={comment.commentID}
                  className="border border-gray-100 rounded-lg overflow-hidden mb-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Main Comment */}
                  <div className="p-5 bg-white">
                    <div className="flex space-x-4">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm transition-transform duration-200 hover:scale-110">
                        <AvatarImage
                          src={comment.user?.avatar || "/default-avatar.png"}
                        />
                        <AvatarFallback className="bg-primary-blue text-white">
                          {comment.user?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-800">
                              {comment.user?.name || "Unknown"}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                          <p className="text-gray-700 py-2 leading-relaxed">
                            {comment.content}
                          </p>
                          <div className="flex items-center mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-primary-blue transition-colors duration-200"
                              onClick={() => {
                                // Toggle reply form
                                if (replyingTo === comment.commentID) {
                                  setReplyingTo(null);
                                  setReplyContent("");
                                } else {
                                  setReplyingTo(comment.commentID);
                                  setReplyContent("");
                                }
                              }}
                            >
                              <Reply className="h-4 w-4 mr-1 transition-transform duration-200 group-hover:translate-x-1" />
                              Reply
                            </Button>
                          </div>

                          {/* Reply Form */}
                          {replyingTo === comment.commentID && (
                            <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3 animate-slideIn">
                              <Textarea
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) =>
                                  setReplyContent(e.target.value)
                                }
                                className="min-h-[60px] border-gray-200 resize-none focus:border-primary-blue focus:ring-primary-blue/20 transition-all duration-200"
                                autoFocus
                              />
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent("");
                                  }}
                                  className="text-gray-600 border-gray-200 transition-colors duration-200"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(comment.commentID)}
                                  disabled={!replyContent.trim() || !user}
                                  className="bg-primary-blue hover:bg-primary-blue/90 text-white transition-all duration-200 hover:shadow"
                                >
                                  Reply
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-100 p-4">
                      <div className="pl-4 ml-10 space-y-4 border-l-2 border-gray-200">
                        {comment.replies.map((reply, replyIndex) => (
                          <div
                            key={reply.commentID}
                            className="flex space-x-3 transition-transform duration-300 hover:translate-x-2 animate-fadeIn"
                            style={{
                              animationDelay: `${0.2 + replyIndex * 0.05}s`,
                            }}
                          >
                            <Avatar className="h-8 w-8 border border-white shadow-sm transition-transform duration-200 hover:scale-110">
                              <AvatarImage
                                src={
                                  reply.user?.avatar || "/default-avatar.png"
                                }
                              />
                              <AvatarFallback className="bg-primary-blue text-white">
                                {reply.user?.name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-sm text-gray-800">
                                  {reply.user?.name || "Unknown"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(reply.createdAt).toLocaleDateString(
                                    undefined,
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <Pagination className="mt-8 animate-fadeIn">
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                        className="border-gray-200 hover:border-primary-blue hover:text-primary-blue transition-all duration-200 hover:scale-105"
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Simple pagination logic for showing relevant page numbers
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (currentPage >= 3) {
                        pageNum = currentPage - 3 + i;
                      }
                      // Ensure we don't go beyond total pages
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
                          className={`transition-all duration-200 ${
                            currentPage === pageNum
                              ? "bg-primary-blue border-primary-blue"
                              : "border-gray-200 hover:scale-105"
                          }`}
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
                        className="border-gray-200 hover:border-primary-blue hover:text-primary-blue transition-all duration-200 hover:scale-105"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
        {loading && comments.length > 0 && (
          <div className="py-4 text-center text-gray-500">
            <div className="inline-block animate-spin mr-2">
              <svg
                className="h-5 w-5 text-primary-blue"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            Loading more comments...
          </div>
        )}
      </div>
    </div>
  );
}
