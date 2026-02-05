"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Heart,
  Send,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

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
}

interface Comment {
  commentID: string;
  content: string;
  userID: string;
  createdAt: string;
  parent_id?: string;
}

export function DiscussionFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/posts?limit=10`
      );
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    if (comments[postId]) {
      return; // Already loaded
    }
    
    setLoadingComments({ ...loadingComments, [postId]: true });
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/comments?page_id=${postId}&type=post&limit=20`
      );
      setComments({ ...comments, [postId]: response.data.comments || [] });
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments({ ...comments, [postId]: [] });
    } finally {
      setLoadingComments({ ...loadingComments, [postId]: false });
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/like`
      );
      // Refresh posts to get updated like count
      fetchPosts();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment[postId]?.trim()) return;

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/comments`, {
        content: newComment[postId],
        type: "post",
        page_id: postId,
        parent_id: null,
      });
      
      setNewComment({ ...newComment, [postId]: "" });
      // Refresh comments
      setComments({ ...comments, [postId]: [] as Comment[] }); // Clear to force reload
      await fetchComments(postId);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      await fetchComments(postId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-muted-foreground">
            No discussions yet. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.postId} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            {/* Post Header */}
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {post.expertDetails.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {post.expertDetails.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Expert
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
              {post.content}
            </p>

            {/* Post Actions */}
            <div className="flex items-center gap-4 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(post.postId)}
                className="gap-2"
              >
                <Heart
                  className={`h-4 w-4 ${
                    post.likedBy?.length > 0 ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                <span className="text-xs">{post.likes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleComments(post.postId)}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">
                  {comments[post.postId]?.length || 0} Comments
                </span>
                {expandedPost === post.postId ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Comments Section */}
            {expandedPost === post.postId && (
              <div className="mt-4 pt-4 border-t space-y-4">
                {/* Add Comment */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment[post.postId] || ""}
                    onChange={(e) =>
                      setNewComment({ ...newComment, [post.postId]: e.target.value })
                    }
                    className="min-h-[60px] resize-none"
                  />
                  <Button
                    size="icon"
                    onClick={() => handleAddComment(post.postId)}
                    disabled={!newComment[post.postId]?.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Comments List */}
                {loadingComments[post.postId] ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Loading comments...</p>
                  </div>
                ) : comments[post.postId]?.length > 0 ? (
                  <div className="space-y-3">
                    {comments[post.postId].map((comment) => (
                      <div key={comment.commentID} className="flex gap-3 pl-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-200 text-xs">
                            {comment.userID.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-xs">
                              {comment.userID}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
