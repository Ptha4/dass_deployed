"use client";

import { Button } from "@/components/ui/button";
import { Search, UserCircle, Calendar, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { UpcomingEventsWidget } from "./upcoming-events-widget";

interface WelcomeHeaderProps {
  userName?: string;
  unreadReplies?: number;
  upcomingMeetingsToday?: number;
  onFindMentor?: () => void;
}

export function WelcomeHeader({
  userName,
  unreadReplies = 0,
  upcomingMeetingsToday = 0,
  onFindMentor,
}: WelcomeHeaderProps) {
  const router = useRouter();

  return (
    <div className="pb-10">
      <div className="px-6 sm:px-8 lg:px-12">
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-12 shadow-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
        {/* Left Side - Text & Actions */}
        <div className="flex-1">
          {/* Heading with Emoji */}
          <h1 className="text-5xl font-bold text-gray-900 mb-3 flex items-center gap-4">
            Welcome back{userName ? `, ${userName}` : ""}! 
            <span className="animate-wave inline-block origin-[70%_70%] text-5xl">👋</span>
          </h1>

          {/* Subtitle with Dynamic Content */}
          <p className="text-gray-600 text-lg mb-8">
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
          <div className="flex flex-wrap gap-5">
            <Button
              variant="outline"
              size="lg"
              className="bg-white shadow-md hover:shadow-xl transition-all border-blue-200 text-gray-700 font-semibold group h-12 px-6"
              onClick={() => {
                if (onFindMentor) {
                  onFindMentor();
                } else {
                  router.push("/experts");
                }
              }}
            >
              <Search className="h-5 w-5 mr-2 text-blue-600 group-hover:scale-110 transition-transform" />
              Find Mentor
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-white shadow-md hover:shadow-xl transition-all border-purple-200 text-gray-700 font-semibold group h-12 px-6"
              onClick={() => router.push("/profile")}
            >
              <UserCircle className="h-5 w-5 mr-2 text-purple-600 group-hover:scale-110 transition-transform" />
              Update Profile
            </Button>
          </div>
        </div>

        {/* Right Side - Upcoming Events Widget */}
        <div className="lg:min-w-[400px] lg:max-w-[450px]">
          <UpcomingEventsWidget />
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
