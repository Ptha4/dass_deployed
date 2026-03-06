"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Eye,
  FileText,
  MessageSquare,
  Video,
  Calendar,
  DollarSign,
  Settings,
  Edit,
  Save,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Star,
  MoreHorizontal,
  Loader2,
  Pencil,
  FilePlus,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { Expert } from "@/types";
import CreatePost from "@/components/experts/detail/create-post";
import ExpertPosts from "@/components/experts/detail/expert-posts";
import MarkdownViewer from "@/components/shared/markdown-viewer";
import UpcomingMeetings from "@/components/experts/detail/upcoming-meetings";
import { VideoManagement } from "@/components/experts/video-management";
import { BlogManagement } from "@/components/experts/blog-management";

interface ExpertDashboardProps {
  expert: Expert;
  expertInitials: string;
}

interface Analytics {
  views: {
    profileViews: number;
    videoViews: number;
    blogReads: number;
    postViews: number;
    totalEngagement: number;
  };
  content: {
    videosCount: number;
    blogsCount: number;
    postsCount: number;
  };
  performance: {
    followersCount: number;
    ratings: {
      average: number;
      distribution: { rating: number; count: number }[];
    };
    meetings: {
      completed: number;
      upcoming: number;
      cancellationRate: number;
    };
    earnings: {
      total: number;
      thisMonth: number;
      previousMonth: number;
      growth: number;
    };
    monthlyViews: { month: string; views: number }[];
    contentEngagement: { type: string; count: number }[];
  };
}

export default function ExpertDashboard({
  expert,
  expertInitials,
}: ExpertDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [postRefreshTrigger, setPostRefreshTrigger] = useState(0);
  const [profileForm, setProfileForm] = useState({
    firstName: expert.userDetails.firstName,
    lastName: expert.userDetails.lastName,
    bio: expert.bio,
    currentPosition: expert.currentPosition,
    organization: expert.organization,
    available: expert.available,
    meetingCost: expert.meetingCost,
  });

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28DFF"];

  const [blogContent, setBlogContent] = useState({
    heading: "",
    body: "",
  });
  const [blogActiveTab, setBlogActiveTab] = useState("write");
  const [isSubmittingBlog, setIsSubmittingBlog] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [showBlogDialog, setShowBlogDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  // Track refund requests to accurately calculate earnings
  const [refundRequests, setRefundRequests] = useState<Record<string, string>>(
    {}
  );
  // Track actual earnings (after refunds)
  const [actualEarnings, setActualEarnings] = useState({
    total: 0,
    thisMonth: 0,
    completedSessions: 0,
  });

  const handlePostCreated = () => {
    setPostRefreshTrigger((prev) => prev + 1);
  };

  const handleBlogSubmit = async () => {
    if (!blogContent.heading.trim() || !blogContent.body.trim()) {
      setBlogError("Blog title and content cannot be empty");
      return;
    }

    try {
      setIsSubmittingBlog(true);
      setBlogError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to create a blog");
        return;
      }

      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          heading: blogContent.heading,
          body: blogContent.body,
          refType: "NA",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create blog");
      }

      const data = await response.json();
      setBlogContent({ heading: "", body: "" });
      setBlogActiveTab("write");
      setShowBlogDialog(false);
      toast.success("Blog created successfully!");

      // Redirect to the blog page
      window.location.href = `/blogs/${data.blogID}`;
    } catch (err) {
      setBlogError(
        err instanceof Error
          ? err.message
          : "Failed to create blog. Please try again."
      );
    } finally {
      setIsSubmittingBlog(false);
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `/api/experts/${expert.expertID}/analytics`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to load analytics data");
        const data = await response.json();
        setAnalytics(data);

        // After fetching analytics, fetch refund data to update stats
        fetchRefundData();
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error("Failed to load analytics data. Please try again later.");
        // For development or fallback purposes only - in production this should be removed or handled differently
        setAnalytics({
          views: {
            profileViews: 0,
            videoViews: 0,
            blogReads: 0,
            postViews: 0,
            totalEngagement: 0,
          },
          content: {
            videosCount: 0,
            blogsCount: 0,
            postsCount: 0,
          },
          performance: {
            followersCount: 0,
            ratings: {
              average: expert.rating || 0,
              distribution: [
                { rating: 1, count: 0 },
                { rating: 2, count: 0 },
                { rating: 3, count: 0 },
                { rating: 4, count: 0 },
                { rating: 5, count: 0 },
              ],
            },
            meetings: {
              completed: 0,
              upcoming: 0,
              cancellationRate: 0,
            },
            earnings: {
              total: 0,
              thisMonth: 0,
              previousMonth: 0,
              growth: 0,
            },
            monthlyViews: [
              { month: "Jan", views: 0 },
              { month: "Feb", views: 0 },
              { month: "Mar", views: 0 },
              { month: "Apr", views: 0 },
              { month: "May", views: 0 },
              { month: "Jun", views: 0 },
            ],
            contentEngagement: [
              { type: "Videos", count: 0 },
              { type: "Blogs", count: 0 },
              { type: "Posts", count: 0 },
              { type: "Meetings", count: 0 },
            ],
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [expert.expertID, expert.rating]);

  // Function to fetch refund data and update actual earnings
  const fetchRefundData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/refunds", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch refund data");

      const refundData = await response.json();

      // Create a map of meetingId -> status
      const refundMap: Record<string, string> = {};
      refundData.forEach((refund: any) => {
        refundMap[refund.meetingId] = refund.status;
      });

      setRefundRequests(refundMap);

      // Now fetch all meetings to calculate actual earnings
      await fetchMeetingsForEarningsCalculation(refundMap);
    } catch (error) {
      console.error("Error fetching refund data:", error);
    }
  };

  // Function to fetch meetings and calculate actual earnings
  const fetchMeetingsForEarningsCalculation = async (
    refundMap: Record<string, string>
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/meetings/expert/${expert.expertID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch meetings");

      const meetings = await response.json();

      // Initialize values
      let totalEarnings = 0;
      let thisMonthEarnings = 0;
      let completedSessions = 0;

      // Get current month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Calculate actual earnings (excluding refunded meetings)
      meetings.forEach((meeting: any) => {
        const isRefunded = refundMap[meeting._id] === "approved";

        if (meeting.status === "completed" && !isRefunded) {
          // Count as a completed session
          completedSessions++;

          // Add to total earnings
          totalEarnings += meeting.amount;

          // Check if completed this month
          const completedDate = new Date(
            meeting.completedAt || meeting.endTime
          );
          if (
            completedDate.getMonth() === currentMonth &&
            completedDate.getFullYear() === currentYear
          ) {
            thisMonthEarnings += meeting.amount;
          }
        }
      });

      // Update actual earnings state
      setActualEarnings({
        total: totalEarnings,
        thisMonth: thisMonthEarnings,
        completedSessions: completedSessions,
      });
    } catch (error) {
      console.error("Error fetching meetings for earnings calculation:", error);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/experts/${expert.expertID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      // Update was successful
      toast.success("Profile updated successfully!");
      setIsEditingProfile(false);

      // Force page refresh to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !analytics) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header with consistent left margin - shifted upward */}
      <div className="flex justify-between items-center px-6 mt-8">
        <h2 className="text-4xl font-bold text-gray-900">Expert Dashboard</h2>
        {!isEditingProfile ? (
          <Button
            onClick={() => setIsEditingProfile(true)}
            variant="outline"
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsEditingProfile(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Profile Editing Section */}
      {isEditingProfile && (
        <Card className="mb-6 border-blue-200 shadow-md">
          <CardHeader>
            <CardTitle>Edit Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileForm.firstName}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileForm.lastName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, lastName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPosition">Current Position</Label>
                <Input
                  id="currentPosition"
                  value={profileForm.currentPosition}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      currentPosition: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={profileForm.organization}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      organization: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingCost">
                  Session Cost (coins per hour)
                </Label>
                <Input
                  id="meetingCost"
                  type="number"
                  value={profileForm.meetingCost}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      meetingCost: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="available">Available for consultations</Label>
                  <Switch
                    id="available"
                    checked={profileForm.available}
                    onCheckedChange={(checked) =>
                      setProfileForm({ ...profileForm, available: checked })
                    }
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Toggle this to show your availability status to potential
                  clients
                </p>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="bio">Bio / About</Label>
                <Textarea
                  id="bio"
                  value={profileForm.bio}
                  rows={6}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, bio: e.target.value })
                  }
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats - Big Number, Small Label format */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-4xl font-bold text-gray-900 mb-1">
                  {analytics.performance.followersCount}
                </h3>
                <p className="text-sm font-medium text-gray-500">
                  Total Followers
                </p>
                <p className="text-xs text-green-600 mt-1 font-medium">+14% this month</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600 stroke-[2]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-4xl font-bold text-gray-900 mb-1">
                  {analytics.views.totalEngagement.toLocaleString()}
                </h3>
                <p className="text-sm font-medium text-gray-500">
                  Total Engagement
                </p>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  +8.2% this month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Eye className="h-6 w-6 text-green-600 stroke-[2]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-4xl font-bold text-gray-900 mb-1">
                  {actualEarnings.completedSessions > 0
                    ? actualEarnings.completedSessions
                    : analytics.performance.meetings.completed}
                </h3>
                <p className="text-sm font-medium text-gray-500">
                  Sessions Completed
                </p>
                {actualEarnings.completedSessions <
                  analytics.performance.meetings.completed && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    {analytics.performance.meetings.completed -
                      actualEarnings.completedSessions}{" "}
                    refunded
                  </p>
                )}
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  {analytics.performance.meetings.upcoming} upcoming
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-6 w-6 text-amber-600 stroke-[2]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-4xl font-bold text-gray-900 mb-1">
                  {actualEarnings.total > 0
                    ? actualEarnings.total.toLocaleString()
                    : analytics.performance.earnings.total.toLocaleString()}
                </h3>
                <p className="text-sm font-medium text-gray-500">
                  Total Earnings (coins)
                </p>
                {actualEarnings.total <
                  analytics.performance.earnings.total && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    {(
                      analytics.performance.earnings.total -
                      actualEarnings.total
                    ).toLocaleString()}{" "}
                    refunded
                  </p>
                )}
                <p className="text-xs text-green-600 mt-1 font-medium">
                  +{analytics.performance.earnings.growth}% growth
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-6 w-6 text-purple-600 stroke-[2]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6">
        {/* Main Analytics Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Meetings */}
          <UpcomingMeetings expertId={expert.expertID} />

          {/* Views Chart with increased padding */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold text-gray-900">
                  Profile Engagement
                </CardTitle>
                <div className="flex items-center gap-2">
                  <LineChartIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Last 6 months</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.performance.monthlyViews}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      formatter={(value) => [`${value} views`, "Engagement"]}
                      contentStyle={{
                        backgroundColor: "#FFF",
                        borderColor: "#E5E7EB",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#2563EB"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Content Stats with increased padding */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold text-gray-900">
                  Content Performance
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs font-normal">
                    Total:{" "}
                    {analytics.content.videosCount +
                      analytics.content.blogsCount +
                      analytics.content.postsCount}{" "}
                    items
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.performance.contentEngagement}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="type" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip
                        formatter={(value) => [
                          `${value.toLocaleString()} views`,
                          "Content Views",
                        ]}
                        contentStyle={{
                          backgroundColor: "#FFF",
                          borderColor: "#E5E7EB",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 border rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Video className="h-6 w-6 text-blue-600 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900">{analytics.content.videosCount}</h4>
                        <p className="text-sm font-medium text-gray-500">Videos</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm font-medium">
                      {analytics.views.videoViews.toLocaleString()} views
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-5 border rounded-lg hover:border-green-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-green-600 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900">{analytics.content.blogsCount}</h4>
                        <p className="text-sm font-medium text-gray-500">Blogs</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm font-medium">
                      {analytics.views.blogReads.toLocaleString()} reads
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-5 border rounded-lg hover:border-amber-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-6 w-6 text-amber-600 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900">{analytics.content.postsCount}</h4>
                        <p className="text-sm font-medium text-gray-500">Posts</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm font-medium">
                      {analytics.views.postViews.toLocaleString()} views
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Content - Posts, Videos, Blogs */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold text-gray-900">Your Content</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="posts" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Posts
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {analytics.content.postsCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="gap-2">
                    <Video className="h-4 w-4" />
                    Videos
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {analytics.content.videosCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="blogs" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Blogs
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {analytics.content.blogsCount}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-4">
                  <ExpertPosts
                    key={postRefreshTrigger}
                    expertId={expert.expertID}
                    expertName={`${expert.userDetails.firstName} ${expert.userDetails.lastName}`}
                    expertInitials={expertInitials}
                    isExpertLoggedIn={true}
                  />
                </TabsContent>

                <TabsContent value="videos" className="space-y-4">
                  <VideoManagement expertId={expert.expertID} />
                </TabsContent>

                <TabsContent value="blogs" className="space-y-4">
                  <BlogManagement />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Side Analytics */}
        <div className="space-y-8">
          {/* Content Creation Actions */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start hover:bg-blue-50"
                variant="outline"
                onClick={() => setShowPostDialog(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Create New Post
              </Button>
              
              <Button
                className="w-full justify-start hover:bg-blue-50"
                variant="outline"
                onClick={() => (window.location.href = "/blogs/create")}
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Create New Blog
              </Button>

              <Button
                className="w-full justify-start hover:bg-blue-50"
                variant="outline"
                onClick={() => (window.location.href = "/videos/create")}
              >
                <Video className="h-4 w-4 mr-2" />
                Upload New Video
              </Button>
              <Button
                className="w-full justify-start hover:bg-blue-50"
                variant="outline"
                onClick={() =>
                  (window.location.href = "https://calendar.google.com/")
                }
              >
                <Calendar className="h-4 w-4 mr-2" />
                Manage Schedule
              </Button>
            </CardContent>
          </Card>

          {/* Ratings Overview */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Ratings Overview
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {expert.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.performance.ratings.distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="rating"
                      label={({ rating, count }) => (count > 0 ? `${rating}⭐` : "")}
                    >
                      {analytics.performance.ratings.distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${value} ratings`,
                        `${name} stars`,
                      ]}
                      contentStyle={{
                        backgroundColor: "#FFF",
                        borderColor: "#E5E7EB",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 text-center">
                <p className="text-sm text-gray-500">
                  Based on{" "}
                  {analytics.performance.ratings.distribution.reduce(
                    (acc, curr) => acc + curr.count,
                    0
                  )}{" "}
                  ratings
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Post Modal */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share your insights and expertise with your followers
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <CreatePost
              expertId={expert.expertID}
              expertInitials={expertInitials}
              onPostCreated={() => {
                handlePostCreated();
                setShowPostDialog(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
