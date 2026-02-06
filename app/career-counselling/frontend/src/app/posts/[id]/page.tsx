"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Heart,
  Send,
  Clock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface ExpertDetails {
  name: string;
  initials: string;
}

interface Post {
  postId: string;
  content: string;
  expertId: string;
  expertDetails: ExpertDetails;
  createdAt: string;
  updatedAt: string;
  likes: number;
  likedBy: string[];
  views: number;
  tags?: string[];
  commentsCount?: number;
}

interface Comment {
  commentID: string;
  content: string;
  userID: string;
  createdAt: string;
  parent_id?: string;
  userName?: string;
}

function PostDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPostAndComments();
    }
  }, [postId]);

  const fetchPostAndComments = async () => {
    setLoading(true);
    try {
      // Fetch post details
      const postResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}`
      );
      setPost(postResponse.data);

      // Fetch comments
      await fetchComments();
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/comments?page_id=${postId}&type=post&limit=50`
      );
      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    const userId = user?._id || "";
    const isLiked = post.likedBy?.includes(userId);

    // Optimistic UI update
    setPost({
      ...post,
      likes: isLiked ? post.likes - 1 : post.likes + 1,
      likedBy: isLiked
        ? post.likedBy.filter((id) => id !== userId)
        : [...post.likedBy, userId],
    });

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/like`
      );
    } catch (error) {
      console.error("Error liking post:", error);
      // Rollback on error
      fetchPostAndComments();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/comments`, {
        content: newComment,
        type: "post",
        page_id: postId,
        parent_id: null,
      });

      setNewComment("");
      // Refresh comments to show the new one
      await fetchComments();
      
      // Update post comment count
      if (post) {
        setPost({
          ...post,
          commentsCount: (post.commentsCount || 0) + 1,
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Post not found</h3>
            <p className="text-muted-foreground mb-4">
              The post you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Post Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Post Header */}
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {post.expertDetails.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-base">
                    {post.expertDetails.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Expert
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <p className="text-base text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`text-xs ${
                      tag.toLowerCase().includes("startup")
                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
                        : tag.toLowerCase().includes("master")
                        ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300"
                        : tag.toLowerCase().includes("interview")
                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300"
                        : tag.toLowerCase().includes("career")
                        ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
                        : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="my-4" />

            {/* Post Actions */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className="gap-2 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${
                    post.likedBy?.includes(user?._id || "")
                      ? "fill-red-500 text-red-500"
                      : "text-gray-500"
                  }`}
                />
                <span className="text-sm font-medium">{post.likes} Likes</span>
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {post.commentsCount || comments.length} Comments
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Comments ({comments.length})
            </h3>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Comment Input */}
            <div className="space-y-3">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="gap-2"
                >
                  {submittingComment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Comments List */}
            {loadingComments ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Loading comments...
                </p>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.commentID} className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {comment.userName
                          ? comment.userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : comment.userID.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">
                          {comment.userName || comment.userID}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PostDetailPage() {
  return (
    <ProtectedRoute>
      <PostDetailContent />
    </ProtectedRoute>
  );
}
