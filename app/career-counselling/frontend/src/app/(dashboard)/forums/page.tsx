"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Loader2, MessageSquare } from "lucide-react";
import { ForumsFilterSidebar } from "@/components/forums/forums-filter-sidebar";
import { FollowedCommunitiesWidget } from "@/components/dashboard/followed-communities-widget";
import { TrendingCarousel } from "@/components/dashboard/trending-carousel";
import PostItem from "@/components/communities/post-item";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Post } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function ForumsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPreferences, setSavedPreferences] = useState<any>(null);
  const [currentFilters, setCurrentFilters] = useState<any>(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  useEffect(() => {
    const prefs = localStorage.getItem("mentorPreferences");
    if (prefs) setSavedPreferences(JSON.parse(prefs));
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [currentFilters]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/posts/feed?limit=50");
      let data: Post[] = Array.isArray(res.data) ? res.data : res.data.posts || [];

      // Apply filters
      if (currentFilters) {
        if (currentFilters.fields?.length) {
          data = data.filter((p) =>
            p.tags?.some((tag) =>
              currentFilters.fields.some(
                (f: string) =>
                  tag.toLowerCase().includes(f.toLowerCase()) ||
                  f.toLowerCase().includes(tag.toLowerCase())
              )
            )
          );
        }
        if (currentFilters.sortBy) {
          data = [...data].sort((a, b) => {
            switch (currentFilters.sortBy) {
              case "mostRecent":
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              case "mostLiked":
                return b.likes - a.likes;
              case "mostViewed":
                return (b.views || 0) - (a.views || 0);
              case "mostDiscussed":
                return (b.commentsCount || 0) - (a.commentsCount || 0);
              default:
                return 0;
            }
          });
        }
      }
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const forumsContent = (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Discussion Posts</h1>
          <p className="text-gray-600 mt-1">Join the community discussions</p>
        </div>

        {/* Trending Carousel */}
        <div className="mb-6">
          <TrendingCarousel />
        </div>

        {/* Main Grid: Filters + Posts + Sidebar */}
        <div
          className={`grid gap-6 h-[calc(100vh-20rem)] ${isFilterCollapsed ? "grid-cols-1 lg:grid-cols-[1fr_280px]" : "grid-cols-1 lg:grid-cols-[220px_1fr_280px]"
            }`}
        >
          {/* Left Sidebar - Filters */}
          {!isFilterCollapsed && (
            <div className="overflow-y-auto pr-2 pb-10 custom-scrollbar h-full hidden lg:block">
              <ForumsFilterSidebar
                onFiltersChange={setCurrentFilters}
                savedPreferences={savedPreferences}
                isCollapsed={isFilterCollapsed}
                onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
              />
            </div>
          )}

          {/* Center - Posts (using PostItem like community detail) */}
          <div className="overflow-y-auto pr-2 pb-10 custom-scrollbar h-full">
            {isFilterCollapsed && (
              <div className="mb-4">
                <ForumsFilterSidebar
                  onFiltersChange={setCurrentFilters}
                  savedPreferences={savedPreferences}
                  isCollapsed={isFilterCollapsed}
                  onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
                />
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-20 ml-auto" />
                    </div>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <div className="flex gap-4 pt-1">
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-800 mb-1">No discussions yet</h3>
                <p className="text-gray-400 text-sm">
                  Join a community and start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostItem key={post.postId} post={post} showCommunity />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="overflow-y-auto pr-2 pb-10 custom-scrollbar h-full space-y-6 hidden lg:block">
            <FollowedCommunitiesWidget />
          </div>
        </div>
      </div>
    </div>
  );

  return <ProtectedRoute>{forumsContent}</ProtectedRoute>;
}
