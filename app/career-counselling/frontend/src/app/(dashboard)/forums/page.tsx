"use client";

import { useState, useEffect } from "react";
import { DiscussionFeed } from "@/components/dashboard/discussion-feed";
import { RelevantBlogs } from "@/components/dashboard/relevant-blogs";
import { FollowedCommunitiesWidget } from "@/components/dashboard/followed-communities-widget";
import { WeeklyGoalsWidget } from "@/components/dashboard/weekly-goals-widget";
import { TrendingCarousel } from "@/components/dashboard/trending-carousel";
import { ForumsFilterSidebar } from "@/components/forums/forums-filter-sidebar";
import { FileText, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { Post } from "@/types";

interface WeeklyGoal {
  id: number;
  title: string;
  completed: boolean;
}

interface DashboardStats {
  profileStrength: number;
  unreadReplies: number;
  upcomingMeetingsToday: number;
  weeklyGoals: WeeklyGoal[];
}

export default function ForumsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savedPreferences, setSavedPreferences] = useState<any>(null);
  const [currentFilters, setCurrentFilters] = useState<any>(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    loadSavedPreferences();
  }, []);

  const loadSavedPreferences = async () => {
    try {
      const preferences = localStorage.getItem("mentorPreferences");
      if (preferences) {
        setSavedPreferences(JSON.parse(preferences));
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
    // You can pass these filters to DiscussionFeed if needed
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/user/dashboard-stats`
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStats({
        profileStrength: 0,
        unreadReplies: 0,
        upcomingMeetingsToday: 0,
        weeklyGoals: [],
      });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    // small delay to allow header/stats to fetch first; DiscussionFeed handles posts
    setLoading(false);
  }, []);

  const forumsContent = (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-12 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Discussion Posts</h1>
          <p className="text-gray-600 mt-1">Join the community discussions</p>
        </div>

        {/* Main Grid: Filters + Posts + Sidebar */}
        <div className={`grid grid-cols-1 gap-6 ${isFilterCollapsed ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
          {/* Left Sidebar - Filters (collapsible) */}
          {!isFilterCollapsed && (
            <div className="lg:col-span-1">
              <ForumsFilterSidebar
                onFiltersChange={handleFiltersChange}
                savedPreferences={savedPreferences}
                isCollapsed={isFilterCollapsed}
                onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
              />
            </div>
          )}

          {/* Center - Discussion Feed */}
          <div className={isFilterCollapsed ? 'lg:col-span-2' : 'lg:col-span-2'}>
            {/* Filter toggle button when collapsed */}
            {isFilterCollapsed && (
              <div className="mb-4">
                <ForumsFilterSidebar
                  onFiltersChange={handleFiltersChange}
                  savedPreferences={savedPreferences}
                  isCollapsed={isFilterCollapsed}
                  onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
                />
              </div>
            )}
            
            {/* Trending Carousel at top */}
            <TrendingCarousel />
            
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="px-8 py-6">
                <DiscussionFeed filters={currentFilters} />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Community Widgets */}
          <div className="lg:col-span-1 space-y-6">
            {/* Followed Communities Widget */}
            <FollowedCommunitiesWidget />

            {/* Weekly Goals Widget */}
            {stats && stats.weeklyGoals.length > 0 && (
              <WeeklyGoalsWidget goals={stats.weeklyGoals} />
            )}

            {/* Relevant Blogs Card */}
            <Card className="bg-white rounded-xl shadow-sm border-0 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-green-500" />
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Relevant Blogs
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-500">
                  Articles curated for your interests
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <RelevantBlogs />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  return <ProtectedRoute>{forumsContent}</ProtectedRoute>;
}
