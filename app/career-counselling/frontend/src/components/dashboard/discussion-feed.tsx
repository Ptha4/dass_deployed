"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, Clock } from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

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

export function DiscussionFeed() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleLike = async (e: React.MouseEvent, postId: string, currentLikes: number, likedBy: string[]) => {
    // CRITICAL: Stop propagation to prevent card click
    e.stopPropagation();

    const userId = user?._id || "";
    
    // Optimistic UI update
    const isLiked = likedBy.includes(userId);
    const updatedPosts = posts.map((post) => {
      if (post.postId === postId) {
        return {
          ...post,
          likes: isLiked ? currentLikes - 1 : currentLikes + 1,
          likedBy: isLiked
            ? likedBy.filter((id) => id !== userId)
            : [...likedBy, userId],
        };
      }
      return post;
    });
    setPosts(updatedPosts);

    // Send API request in background
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/like`
      );
    } catch (error) {
      console.error("Error liking post:", error);
      // Rollback on error
      setPosts(posts);
    }
  };

  const navigateToPost = (postId: string) => {
    router.push(`/posts/${postId}`);
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
      <div className="py-12 text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-muted-foreground">
          No discussions yet. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {posts.map((post, index) => (
        <div key={post.postId}>
          <div
            className="py-6 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer group"
            onClick={() => navigateToPost(post.postId)}
          >
            {/* Post Header */}
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="h-10 w-10 ring-1 ring-gray-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                  {post.expertDetails.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {post.expertDetails.name}
                  </span>
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    Expert
                  </Badge>
                  <span className="text-xs text-muted-foreground">·</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="ml-13">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap line-clamp-3 leading-relaxed">
                {post.content}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={`text-xs px-2 py-0.5 ${
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

              {/* Post Actions - Like and Comment Count ONLY */}
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleLike(e, post.postId, post.likes, post.likedBy)}
                  className="gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2 -ml-2"
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      post.likedBy?.includes(user?._id || "")
                        ? "fill-red-500 text-red-500"
                        : "text-gray-500"
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {post.likes}
                  </span>
                </Button>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {post.commentsCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle Divider between posts */}
          {index < posts.length - 1 && (
            <div className="border-b border-gray-100 dark:border-gray-800" />
          )}
        </div>
      ))}
    </div>
  );
}
