"use client";

import { RelevantBlogs } from "@/components/dashboard/relevant-blogs";
import UpcomingMeetings from "@/components/dashboard/user/upcoming-meetings";
import { DiscussionFeed } from "@/components/dashboard/discussion-feed";
import { Compass, FileText, Search, GraduationCap, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export default function UserDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const dashboardContent = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary-darkGray">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your career exploration progress and discover new
              opportunities.
            </p>
          </div>
          <Badge
            variant="outline"
            className="mt-2 sm:mt-0 flex items-center gap-1 px-3 py-1 bg-secondary/10"
          >
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span>Last updated: Today</span>
          </Badge>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Community Feed */}
          <DiscussionFeed />

          {/* Upcoming Meetings */}
          <UpcomingMeetings />
          
          {/* College predictor with enhanced card */}
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 pb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-500" />
                <CardTitle>College Predictor</CardTitle>
              </div>
              <CardDescription>
                Discover colleges that match your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <Button
                onClick={() => router.push("/predictor")}
                className="w-full mb-3"
                >
                Go to College Predictor
                </Button>
                
                {/* Button for Assessments */}
                <Button
                onClick={() => router.push("/assessments")}
                className="w-full"
                variant="outline"
                >
                <Calendar className="h-4 w-4 mr-2" />
                Take Career Assessments
                </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden border-none shadow-md h-full">
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                <CardTitle>Relevant Blogs</CardTitle>
              </div>
              <CardDescription>
                Articles curated for your interests
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <RelevantBlogs />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick stats section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Search className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Searches
              </p>
              <h3 className="text-2xl font-bold">27</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <GraduationCap className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Saved Colleges
              </p>
              <h3 className="text-2xl font-bold">12</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Read Articles
              </p>
              <h3 className="text-2xl font-bold">8</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
              <Compass className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Profile Strength
              </p>
              <h3 className="text-2xl font-bold">75%</h3>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return <ProtectedRoute>{dashboardContent}</ProtectedRoute>;
}
