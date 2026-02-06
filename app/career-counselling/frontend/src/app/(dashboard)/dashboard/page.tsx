"use client";

import { useState, useEffect } from "react";
import { DiscussionFeed } from "@/components/dashboard/discussion-feed";
import { RelevantBlogs } from "@/components/dashboard/relevant-blogs";
import UpcomingMeetings from "@/components/dashboard/user/upcoming-meetings";
import { ProfileStrengthWidget } from "@/components/dashboard/profile-strength-widget";
import { WeeklyGoalsWidget } from "@/components/dashboard/weekly-goals-widget";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { MessageSquare, FileText } from "lucide-react";
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
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/user/dashboard-stats`
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Set default values on error
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Header */}
        <WelcomeHeader
          userName={user?.firstName}
          unreadReplies={stats?.unreadReplies}
          upcomingMeetingsToday={stats?.upcomingMeetingsToday}
        />

        {/* Main Grid: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Discussion Feed (65-70%) */}
          <div className="lg:col-span-2">
            {/* Discussion Feed - Clean Layout Without Card */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Discussion Feed
                  </h2>
                </div>
              </div>
              <div className="px-6">
                <DiscussionFeed />
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar Widgets (30-35%) */}
          <div className="lg:col-span-1 space-y-6 sticky top-20 h-fit self-start">
            {/* Profile Strength Widget */}
            {stats && <ProfileStrengthWidget strength={stats.profileStrength} />}

            {/* Weekly Goals Widget */}
            {stats && stats.weeklyGoals.length > 0 && (
              <WeeklyGoalsWidget goals={stats.weeklyGoals} />
            )}

            {/* Your Meetings - Already has its own Card wrapper */}
            <UpcomingMeetings />

            {/* Relevant Blogs Card */}
            <Card className="bg-white rounded-xl shadow-sm border-0 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg font-semibold text-gray-900">
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

  return <ProtectedRoute>{dashboardContent}</ProtectedRoute>;
}
