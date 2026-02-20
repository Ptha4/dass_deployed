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

interface Post {
  postId: string;
  title?: string;
  content: string;
  authorId?: string;
  authorName?: string;
  authorInitials?: string;
  communityId?: string;
  communityName?: string;
  communityDisplayName?: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  likedBy: string[];
  views: number;
  tags?: string[];
  commentsCount?: number;
  mediaType?: "image" | "video" | null;
  mediaUrl?: string;
  topComment?: PostComment;
}

interface PostComment {
  commentId: string;
  authorName: string;
  authorInitials: string;
  content: string;
  createdAt: string;
}

interface Filters {
  fields: string[];
  goals: string[];
  educationLevel: string;
  sortBy: string;
}

interface DiscussionFeedProps {
  filters?: Filters;
}

export function DiscussionFeed({ filters }: DiscussionFeedProps = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const fetchPosts = async () => {
    try {
      // Use internal API route used elsewhere in the app to avoid CORS/env issues
      const response = await axios.get(`/api/posts?limit=50`);

      // response.data may be paginated { posts: [...], total } or a plain array
      const rawPosts = Array.isArray(response.data)
        ? response.data
        : response.data.posts || [];

      // Enhance posts with multimedia and mock comments.
      // Insert a media post after every 2 or 3 text posts (randomly choose 2 or 3 after each media insertion)
      const mockComments: PostComment[] = [
        {
          commentId: "1",
          authorName: "Sarah Johnson",
          authorInitials: "SJ",
          content: "This is incredibly insightful! Thanks for sharing your experience.",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          commentId: "2",
          authorName: "Michael Chen",
          authorInitials: "MC",
          content: "I completely agree with your perspective on this topic. Very helpful!",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          commentId: "3",
          authorName: "Priya Sharma",
          authorInitials: "PS",
          content: "Great advice! This really helped me understand the process better.",
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          commentId: "4",
          authorName: "David Williams",
          authorInitials: "DW",
          content: "Thanks for breaking this down so clearly. Much appreciated!",
          createdAt: new Date(Date.now() - 5400000).toISOString(),
        },
      ];

      const enhancedPosts: Post[] = [];
      let counter = 0; // counts non-media posts since last media
      // choose threshold (2 or 3) randomly for the first group
      let threshold = Math.random() > 0.5 ? 2 : 3;

      for (let i = 0; i < rawPosts.length; i++) {
        const post: Post = rawPosts[i];

        // decide whether to attach media to this post
        let mediaType: Post["mediaType"] = null;
        if (counter >= threshold) {
          mediaType = Math.random() > 0.5 ? "image" : "video";
          counter = 0; // reset counter after inserting media
          threshold = Math.random() > 0.5 ? 2 : 3; // pick next threshold
        } else {
          counter += 1;
        }

        const mediaUrl = mediaType === "image"
          ? `https://picsum.photos/seed/${post.postId}/800/450`
          : mediaType === "video"
            ? "https://www.w3schools.com/html/mov_bbb.mp4"
            : undefined;

        enhancedPosts.push({
          ...post,
          mediaType,
          mediaUrl,
          topComment: (post.commentsCount || 0) > 0
            ? mockComments[Math.floor(Math.random() * mockComments.length)]
            : undefined,
        });
      }

      // Apply filters if provided
      let filteredPosts = enhancedPosts;

      if (filters) {
        // Filter by fields (tags)
        if (filters.fields && filters.fields.length > 0) {
          filteredPosts = filteredPosts.filter(post =>
            post.tags && post.tags.some(tag =>
              filters.fields.some(field =>
                tag.toLowerCase().includes(field.toLowerCase()) ||
                field.toLowerCase().includes(tag.toLowerCase())
              )
            )
          );
        }

        // Filter by goals (check tags or content for goal-related keywords)
        if (filters.goals && filters.goals.length > 0) {
          filteredPosts = filteredPosts.filter(post => {
            const searchText = `${post.content} ${(post.tags || []).join(' ')}`.toLowerCase();
            return filters.goals.some(goal =>
              searchText.includes(goal.toLowerCase()) ||
              goal.toLowerCase().split(' ').some(word => searchText.includes(word))
            );
          });
        }

        // Sort posts
        if (filters.sortBy) {
          filteredPosts = [...filteredPosts].sort((a, b) => {
            switch (filters.sortBy) {
              case 'mostRecent':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              case 'mostLiked':
                return b.likes - a.likes;
              case 'mostViewed':
                return b.views - a.views;
              case 'mostDiscussed':
                return (b.commentsCount || 0) - (a.commentsCount || 0);
              default:
                return 0;
            }
          });
        }
      }

      setPosts(filteredPosts);
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
    const prevPosts = posts;
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

    // Send API request in background to internal API, include token if available
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await axios.post(
        `/api/posts/${postId}/like`,
        {},
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      );
    } catch (error) {
      console.error("Error liking post:", error);
      // Rollback on error
      setPosts(prevPosts);
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
                  {post.authorInitials || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {post.authorName || "Anonymous"}
                  </span>
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

              {/* Media Content */}
              {post.mediaType === "image" && post.mediaUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className="w-full h-auto object-cover max-h-[400px]"
                    loading="lazy"
                  />
                </div>
              )}
              {post.mediaType === "video" && post.mediaUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                  <video
                    controls
                    className="w-full h-auto max-h-[400px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <source src={post.mediaUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={`text-xs px-2 py-0.5 ${tag.toLowerCase().includes("startup")
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
              <div className="flex items-center gap-6 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleLike(e, post.postId, post.likes, post.likedBy)}
                  className="gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2 -ml-2"
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${post.likedBy?.includes(user?._id || "")
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

              {/* Top Comment Preview */}
              {post.topComment && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-7 w-7 ring-1 ring-gray-200">
                      <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-xs">
                        {post.topComment.authorInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          {post.topComment.authorName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(post.topComment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                        {post.topComment.content}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
