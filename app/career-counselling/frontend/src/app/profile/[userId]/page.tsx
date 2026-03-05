"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, User as UserIcon, Calendar, MapPin, Mail, Phone, Briefcase, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Post } from "@/types";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function UserProfilePage() {
  const { userId } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      setUser(response.data);
    } catch (err: any) {
      console.error("Error fetching user profile:", err);
      setError(err.response?.data?.detail || "Failed to load user profile");
    }
  }, [userId]);

  const fetchUserPosts = useCallback(async () => {
    try {
      console.log(`Fetching posts for user: ${userId}`);
      const response = await axios.get(`/api/users/${userId}/posts`);
      console.log('Posts API response:', response.data);
      setPosts(response.data || []);
    } catch (err: any) {
      console.error("Error fetching user posts:", err);
      // Don't set error for posts, just log it
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [userId, fetchUserProfile, fetchUserPosts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            User Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          User profile could not be loaded.
        </h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <Card className="shadow-lg border-0 mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={user.profilePicture || ""} 
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                  {getUserInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.firstName} {user.middleName} {user.lastName}
                </h1>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="secondary" className="text-xs">
                    {user.type.charAt(0).toUpperCase() + user.type.slice(1)}
                  </Badge>
                  {user.isExpert && (
                    <Badge variant="default" className="text-xs">
                      Expert
                    </Badge>
                  )}
                  {user.isAdmin && (
                    <Badge variant="destructive" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{user.email}</span>
                </div>
                {user.mobileNo && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{user.mobileNo}</span>
                  </div>
                )}
                {user.home_state && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{user.home_state}</span>
                  </div>
                )}
                {user.category && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{user.category}</span>
                  </div>
                )}
              </div>

              {/* Onboarding Info */}
              {(user.grade || user.preferred_stream || user.target_college || user.interests?.length || user.career_goals) && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-primary">Academic Information</h3>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {user.grade && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          <strong>Grade:</strong> {user.grade}
                        </span>
                      </div>
                    )}
                    {user.preferred_stream && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          <strong>Stream:</strong> {user.preferred_stream}
                        </span>
                      </div>
                    )}
                    {user.target_college && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          <strong>Target College:</strong> {user.target_college}
                        </span>
                      </div>
                    )}
                  </div>
                  {user.interests && user.interests.length > 0 && (
                    <div className="mt-3">
                      <strong className="text-sm text-gray-700">Interests:</strong>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.interests.map((interest, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.career_goals && (
                    <div className="mt-3">
                      <strong className="text-sm text-gray-700">Career Goals:</strong>
                      <p className="text-sm text-gray-600 mt-1">{user.career_goals}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Posts */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-xl text-primary">
            Posts by {user.firstName} {user.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Posts Yet
              </h3>
              <p className="text-gray-600">
                {user.firstName} hasn't posted anything yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.postId} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Post Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            href={`/posts/${post.postId}`}
                            className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors"
                          >
                            {post.title}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                        {post.communityName && (
                          <Badge variant="outline" className="text-xs">
                            {post.communityDisplayName || post.communityName}
                          </Badge>
                        )}
                      </div>

                      {/* Post Content */}
                      <p className="text-gray-700 line-clamp-3">
                        {post.content}
                      </p>

                      {/* Post Media */}
                      {post.media && post.media.length > 0 && (
                        <div className="space-y-2">
                          {post.media.map((media, index) => (
                            <div key={media.fileId} className="rounded-lg overflow-hidden">
                              {media.type === "image" ? (
                                <img
                                  src={media.url}
                                  alt={`Post image ${index + 1}`}
                                  className="w-full h-48 object-cover"
                                />
                              ) : (
                                <video
                                  src={media.url}
                                  controls
                                  className="w-full h-48 object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Post Footer */}
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>{post.likes || 0} likes</span>
                          {post.commentsCount !== undefined && (
                            <span>{post.commentsCount} comments</span>
                          )}
                        </div>
                        <Link href={`/posts/${post.postId}`}>
                          <Button variant="outline" size="sm">
                            View Post
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
