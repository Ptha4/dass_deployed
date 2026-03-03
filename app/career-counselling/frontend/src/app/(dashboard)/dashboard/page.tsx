"use client";

import { useState, useEffect } from "react";
import { RelevantBlogs } from "@/components/dashboard/relevant-blogs";
import { FollowedCommunitiesWidget } from "@/components/dashboard/followed-communities-widget";
import { WeeklyGoalsWidget } from "@/components/dashboard/weekly-goals-widget";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { FindMentorQuestionnaire } from "@/components/dashboard/find-mentor-questionnaire";
import { UserPostsFeed } from "@/components/dashboard/user-posts-feed";
import { FileText, Loader2, Users2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Post } from "@/types";
import axios from "axios";
import Link from "next/link";

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

export default function UserDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showMentorQuestionnaire, setShowMentorQuestionnaire] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, [isAuthenticated]);

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

  const dashboardContent = (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Find Mentor Questionnaire Modal */}
      {showMentorQuestionnaire && (
        <FindMentorQuestionnaire onClose={() => setShowMentorQuestionnaire(false)} />
      )}

      {/* Welcome Header */}
      <div className="w-full max-w-[1800px]">
        <WelcomeHeader
          userName={user?.firstName}
          unreadReplies={stats?.unreadReplies}
          upcomingMeetingsToday={stats?.upcomingMeetingsToday}
          onFindMentor={() => setShowMentorQuestionnaire(true)}
        />
      </div>

      {/* Main Grid */}
      <div className="flex-1 w-full max-w-[1800px] px-6 sm:px-8 lg:px-12 pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-[calc(100vh-12rem)]">
          {/* Left Column — Community Feed */}
          <div className="lg:col-span-2 overflow-y-auto pr-2 pb-10 custom-scrollbar">
            <div className="pb-8">
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="px-8 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Your Posts</h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Latest posts from you
                  </p>
                </div>
                <div className="px-6 py-4">
                  <UserPostsFeed />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Sidebar Widgets */}
          <div className="lg:col-span-1 overflow-y-auto space-y-6 pr-2 pb-10 custom-scrollbar">
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

            {/* Bottom padding for right sidebar */}
            <div className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );

  return <ProtectedRoute>{dashboardContent}</ProtectedRoute>;
}
