"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Heart, Clock, Edit, Trash2, Save, X } from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UserDetails {
  name: string;
  initials: string;
}

interface ExpertDetails {
  name: string;
  initials: string;
}

interface Post {
  postId: string;
  content: string;
  userId?: string;
  expertId?: string;
  userDetails?: UserDetails;
  expertDetails?: ExpertDetails;
  createdAt: string;
  updatedAt: string;
  likes: number;
  likedBy: string[];
  views: number;
  tags?: string[];
  commentsCount?: number;
}

export function UserPostsFeed() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const fetchUserPosts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      // Fetch all posts and filter by current user - use internal API route
      const response = await axios.get(`/api/posts?limit=50`);
      
      // Handle both paginated and array responses
      const allPosts = Array.isArray(response.data)
        ? response.data
        : response.data.posts || [];
      
      // Filter posts by expertId matching current user's expertId or userId
      const userPosts = allPosts.filter((post: Post) => {
        // Check if user is an expert and post is by expert
        if (user?.isExpert && user?.expertId && post.expertId) {
          return post.expertId === user.expertId;
        }
        // Otherwise check userId
        return post.userId === user?._id;
      });
      
      setPosts(userPosts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      toast.error("Failed to load your posts");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPostId(post.postId);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (postId: string) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }
      
      // Update local state
      setPosts(posts.map(post => 
        post.postId === postId 
          ? { ...post, content: editContent, updatedAt: new Date().toISOString() }
          : post
      ));
      
      setEditingPostId(null);
      setEditContent("");
      toast.success("Post updated successfully!");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }
      
      setPosts(posts.filter(post => post.postId !== postId));
      toast.success("Post deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleLike = async (e: React.MouseEvent, postId: string, currentLikes: number, likedBy: string[]) => {
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

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/like`
      );
    } catch (error) {
      console.error("Error liking post:", error);
      setPosts(posts);
    }
  };

  const navigateToPost = (postId: string) => {
    if (editingPostId) return; // Don't navigate when editing
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
          You haven't created any posts yet. Start sharing your thoughts!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {posts.map((post, index) => (
        <div key={post.postId}>
          <div
            className={`py-6 transition-colors ${
              editingPostId !== post.postId ? "hover:bg-gray-50/50 cursor-pointer" : ""
            }`}
            onClick={() => editingPostId !== post.postId && navigateToPost(post.postId)}
          >
            {/* Post Header */}
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="h-10 w-10 ring-1 ring-gray-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                  {post.authorInitials || 
                   post.userDetails?.initials || 
                   (typeof user?.name === 'string' ? user.name.slice(0, 2).toUpperCase() : "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900">
                      {post.authorName || 
                       post.userDetails?.name || 
                       (typeof user?.name === 'string' ? user.name : "You")}
                    </span>
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      You
                    </Badge>
                    <span className="text-xs text-muted-foreground">·</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  
                  {/* Edit and Delete buttons */}
                  {editingPostId !== post.postId && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(post);
                        }}
                        className="h-8 px-2"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(post.postId);
                        }}
                        className="h-8 px-2"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="ml-13">
              {editingPostId === post.postId ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px] text-sm"
                    placeholder="Edit your post..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit(post.postId);
                      }}
                      className="gap-1"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs px-2 py-0.5 bg-gray-50 text-gray-700 border-gray-200"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center gap-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleLike(e, post.postId, post.likes, post.likedBy)}
                      className="gap-2 hover:bg-red-50 h-8 px-2 -ml-2"
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          post.likedBy?.includes(user?._id || "")
                            ? "fill-red-500 text-red-500"
                            : "text-gray-500"
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-600">
                        {post.likes}
                      </span>
                    </Button>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {post.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Divider between posts */}
          {index < posts.length - 1 && (
            <div className="border-b border-gray-100" />
          )}
        </div>
      ))}
    </div>
  );
}
