"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Building2,
  Clock,
  CheckCircle,
  LogIn,
  UserPlus,
} from "lucide-react";
import ExpertOverview from "@/components/experts/detail/expert-overview";
import ExpertVideos from "@/components/experts/detail/expert-videos";
import ExpertBlogs from "@/components/experts/detail/expert-blogs";
import ExpertPosts from "@/components/experts/detail/expert-posts";
import ExpertRatings from "@/components/experts/detail/expert-ratings";
import BookMeeting from "@/components/experts/detail/book-meeting";
import FollowButton from "@/components/experts/follow";
import RateExpert from "@/components/experts/detail/rate-expert";
import type { Expert } from "@/types/index";
import { SocialLinksDrawer } from "@/components/experts/detail/social-links";
import ExpertDashboard from "@/components/experts/detail/expert-dashboard";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function ExpertDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpertLoggedIn, setIsExpertLoggedIn] = useState(false);
  const [isDashboardActive, setIsDashboardActive] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        const response = await fetch(`/api/experts/${id}`);
        if (!response.ok) throw new Error("Expert not found");
        const data = await response.json();
        setExpert(data);

        if (user && user.isExpert && user._id === data.userId) {
          setIsExpertLoggedIn(true);
          setIsDashboardActive(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load expert");
      } finally {
        setLoading(false);
      }
    };
    fetchExpert();
  }, [id, user]);

  // Show login prompt for non-authenticated users when page loads
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setShowLoginPrompt(true);
      // Prevent body scrolling when overlay is displayed
      document.body.style.overflow = "hidden";
    }

    // Cleanup function to restore scrolling when component unmounts or overlay is closed
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [loading, isAuthenticated]);

  // Function to handle closing the login prompt
  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false);
    document.body.style.overflow = "auto";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="text-gray-600">{error || "Expert not found"}</p>
        </Card>
      </div>
    );
  }

  const initials = `${expert.userDetails.firstName[0]}${expert.userDetails.lastName[0]}`;
  const isVerified = expert.rating >= 4.0 || expert.studentsGuided > 10;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="absolute inset-0 bg-black/30" />
      </div>
      {/* Login Overlay - will appear when needed */}
      {showLoginPrompt && !isAuthenticated && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="text-center">
              <div className="mx-auto mb-6 bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center">
                <LogIn className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
              <p className="text-gray-600 mb-6">
                You need to be signed in to interact with experts, book
                sessions, and use all the features available on this profile.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/login" passHref>
                  <Button
                    className="flex items-center gap-2 px-6 py-5"
                    onClick={handleCloseLoginPrompt}
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </Button>
                </Link>
                <Link href="/register" passHref>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-6 py-5"
                    onClick={handleCloseLoginPrompt}
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Create Account</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4">
        <div className="relative -mt-24 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-8">
              <div className="flex flex-col items-center text-center md:text-left md:flex-row gap-8">
                <div className="relative">
                  <Avatar className="h-36 w-36 ring-4 ring-blue-100 shadow-lg">
                    <AvatarFallback className="text-4xl bg-blue-50 text-blue-700">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Badge
                    variant={expert.available ? "default" : "secondary"}
                    className="absolute -top-2 -right-2 px-3 py-1"
                  >
                    {expert.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>

                <div className="flex-1 flex flex-col items-center md:items-start">
                  <div className="space-y-4 w-full">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-gray-900">
                          {`${expert.userDetails.firstName} ${expert.userDetails.lastName}`}
                        </h1>
                        {isVerified && (
                          <div
                            className="flex-shrink-0"
                            title="Verified Expert"
                          >
                            <CheckCircle className="h-6 w-6 fill-blue-600 text-white" />
                          </div>
                        )}
                      </div>

                      {isExpertLoggedIn && (
                        <div className="flex space-x-2">
                          <Button
                            variant={isDashboardActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsDashboardActive(true)}
                            className="rounded-r-none border-r-0"
                          >
                            Dashboard
                          </Button>
                          <Button
                            variant={!isDashboardActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsDashboardActive(false)}
                            className="rounded-l-none"
                          >
                            Public View
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <p className="text-lg text-blue-600 font-medium">
                          {expert.currentPosition}
                        </p>
                        {isVerified && (
                            <Badge
                            className="bg-blue-100 text-blue-700 flex items-center gap-1 px-2 transition-colors duration-200 hover:bg-blue-200 hover:text-blue-900"
                            title="Verified Expert"
                            >
                            <CheckCircle className="h-3 w-3 fill-blue-600 text-white" />
                            <span>Verified</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 flex items-center justify-center md:justify-start gap-2">
                        <Building2 className="h-5 w-5 text-gray-500" />
                        {expert.organization}
                      </p>
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                      <SocialLinksDrawer socialLinks={expert.socialLinks} />
                    </div>

                    {!isExpertLoggedIn && (
                      <FollowButton
                        targetUserId={expert.userId}
                        className="w-1/2"
                      />
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {(!isExpertLoggedIn || !isDashboardActive) && (
              <Card className="p-6 bg-gradient-to-br from-white to-blue-50 shadow-lg">
                <div className="flex flex-col h-full space-y-6">
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-blue-600">
                      {expert.meetingCost.toLocaleString("en-IN")} coins
                      <span className="text-lg text-gray-600">/hr</span>
                    </h2>
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-lg">
                        {expert.rating.toFixed(1)} Rating
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3 text-gray-700 justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">60 minute session</span>
                    </div>
                  </div>

                  {/* Rating Component - only show for non-experts */}
                  {!isExpertLoggedIn && (
                    <div className="mt-4">
                      <RateExpert
                        expertId={expert.expertID}
                        userId={expert.userId}
                        currentRating={expert.rating}
                        onRatingUpdate={(newRating) => {
                          setExpert({
                            ...expert,
                            rating: newRating,
                          });
                        }}
                      />
                    </div>
                  )}

                  {/* Only show booking option if not the expert viewing their own profile */}
                  {!isExpertLoggedIn && (
                    <div className="mt-auto pt-4">
                      <BookMeeting
                        calendarUrl={expert.calendarEmbedUrl}
                        cost={expert.meetingCost}
                        disabled={!expert.available}
                        expertId={expert.expertID}
                      />
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {isExpertLoggedIn && isDashboardActive ? (
          <ExpertDashboard expert={expert} expertInitials={initials} />
        ) : (
          <>
            <div className="mb-8">
              <Card>
                <CardContent className="pt-6">
                  <ExpertOverview expert={expert} />
                </CardContent>
              </Card>
            </div>

            <div className="mb-12">
              <Card>
                <Tabs defaultValue="posts" className="w-full">
                  <TabsList className="w-full justify-start border-b p-2 rounded-lg">
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="videos">Videos</TabsTrigger>
                    <TabsTrigger value="blogs">Blogs</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>
                  <CardContent className="pt-6">
                    <TabsContent value="posts">
                      <ExpertPosts
                        expertId={expert.expertID}
                        expertName={`${expert.userDetails.firstName} ${expert.userDetails.lastName}`}
                        expertInitials={initials}
                        isExpertLoggedIn={isExpertLoggedIn}
                      />
                    </TabsContent>
                    <TabsContent value="videos">
                      <ExpertVideos expertId={expert.expertID} />
                    </TabsContent>
                    <TabsContent value="blogs">
                      <ExpertBlogs expertId={expert.expertID} />
                    </TabsContent>
                    <TabsContent value="reviews">
                      <ExpertRatings expertId={expert.expertID} />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
