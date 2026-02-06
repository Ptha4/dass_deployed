"use client";

import { Button } from "@/components/ui/button";
import { Search, UserCircle, Calendar, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

interface WelcomeHeaderProps {
  userName?: string;
  unreadReplies?: number;
  upcomingMeetingsToday?: number;
}

export function WelcomeHeader({
  userName,
  unreadReplies = 0,
  upcomingMeetingsToday = 0,
}: WelcomeHeaderProps) {
  const router = useRouter();

  return (
    <div className="pb-8">
      <div className="px-6 sm:px-8 lg:px-12">
        <div className="bg-gradient-to-r from-blue-50 via-white to-white rounded-2xl p-10 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        {/* Left Side - Text & Actions */}
        <div className="flex-1">
          {/* Heading with Emoji */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            Welcome back{userName ? `, ${userName}` : ""}! 
            <span className="animate-wave inline-block origin-[70%_70%] text-4xl">👋</span>
          </h1>

          {/* Subtitle with Dynamic Content */}
          <p className="text-gray-500 text-base mb-6">
            {unreadReplies > 0 || upcomingMeetingsToday > 0 ? (
              <>
                You have{" "}
                {unreadReplies > 0 && (
                  <>
                    <span className="font-semibold text-blue-600">
                      {unreadReplies} unread {unreadReplies === 1 ? "reply" : "replies"}
                    </span>
                    {upcomingMeetingsToday > 0 && " and "}
                  </>
                )}
                {upcomingMeetingsToday > 0 && (
                  <>
                    <span className="font-semibold text-indigo-600">
                      {upcomingMeetingsToday} upcoming{" "}
                      {upcomingMeetingsToday === 1 ? "meeting" : "meetings"}
                    </span>{" "}
                    today
                  </>
                )}
              </>
            ) : (
              "Track your career exploration progress and discover new opportunities."
            )}
          </p>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              size="default"
              className="bg-white shadow-sm hover:shadow-md transition-shadow border-blue-200 text-gray-700 font-medium group h-11 px-5"
              onClick={() => router.push("/experts")}
            >
              <Search className="h-5 w-5 mr-2 text-blue-600 group-hover:scale-110 transition-transform" />
              Find Mentor
            </Button>
            <Button
              variant="outline"
              size="default"
              className="bg-white shadow-sm hover:shadow-md transition-shadow border-purple-200 text-gray-700 font-medium group h-11 px-5"
              onClick={() => router.push("/profile")}
            >
              <UserCircle className="h-5 w-5 mr-2 text-purple-600 group-hover:scale-110 transition-transform" />
              Update Profile
            </Button>
          </div>
        </div>

        {/* Right Side - Daily Insight Card */}
        <div className="lg:min-w-[300px]">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Daily Insight
                </p>
                <p className="text-xl font-bold text-gray-800">
                  {upcomingMeetingsToday > 0
                    ? `${upcomingMeetingsToday} ${upcomingMeetingsToday === 1 ? "Event" : "Events"}`
                    : "No Events"}
                </p>
              </div>
            </div>
            
            {unreadReplies > 0 && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Bell className="h-4 w-4 text-orange-500" />
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-orange-600">{unreadReplies}</span> unread{" "}
                  {unreadReplies === 1 ? "notification" : "notifications"}
                </p>
              </div>
            )}

            {upcomingMeetingsToday === 0 && unreadReplies === 0 && (
              <p className="text-sm text-gray-500 pt-3 border-t border-gray-100">
                You're all caught up! 🎉
              </p>
            )}
          </div>
        </div>
        </div>
      </div>
      </div>

      {/* Add custom CSS for wave animation */}
      <style jsx>{`
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }

        .animate-wave {
          animation: wave 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
