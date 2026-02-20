"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, User, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Meeting {
  id: string;
  expertName: string;
  topic: string;
  date: string;
  time: string;
  platform: string;
  color: string;
}

export function UpcomingEventsWidget() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    // Mock upcoming meetings with experts - replace with API call
    const mockMeetings: Meeting[] = [
      {
        id: "1",
        expertName: "Dr. Sarah Chen",
        topic: "Career Planning Session",
        date: "Today",
        time: "2:00 PM",
        platform: "Google Meet",
        color: "from-blue-500 to-cyan-500",
      },
      {
        id: "2",
        expertName: "Prof. Michael Rodriguez",
        topic: "AI & Machine Learning Guidance",
        date: "Tomorrow",
        time: "10:00 AM",
        platform: "Zoom",
        color: "from-purple-500 to-pink-500",
      },
      {
        id: "3",
        expertName: "Dr. Priya Sharma",
        topic: "College Application Review",
        date: "Feb 22",
        time: "4:30 PM",
        platform: "Google Meet",
        color: "from-green-500 to-emerald-500",
      },
    ];
    setMeetings(mockMeetings);
  }, []);

  if (meetings.length === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-6">
          <div className="text-center py-4">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No upcoming meetings</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextMeeting = meetings[0];

  return (
    <Card className="bg-white rounded-xl shadow-sm border-0 overflow-hidden">
      <CardContent className="p-6">
        {/* Next Meeting - Featured */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Upcoming Meetings
            </h3>
          </div>

          {/* Main Meeting Card */}
          <div
            className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${nextMeeting.color} p-4 mb-3 cursor-pointer hover:shadow-lg transition-shadow`}
            onClick={() => toast.info("Meetings dashboard is under construction")}
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-base font-bold text-white leading-tight pr-2">
                  {nextMeeting.topic}
                </h4>
                <span className="px-2 py-0.5 bg-white/30 backdrop-blur-sm rounded text-xs font-semibold text-white uppercase">
                  Meeting
                </span>
              </div>

              <div className="space-y-1.5 text-white/90 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium">{nextMeeting.date} at {nextMeeting.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{nextMeeting.platform}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span>with {nextMeeting.expertName}</span>
                </div>
              </div>
            </div>

            {/* Decorative circle */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
          </div>
        </div>

        {/* Other Meetings - Compact List */}
        {meetings.length > 1 && (
          <div className="space-y-2">
            {meetings.slice(1, 3).map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                onClick={() => toast.info("Meetings dashboard is under construction")}
              >
                <div className={`flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br ${meeting.color} flex items-center justify-center shadow-sm`}>
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {meeting.topic}
                  </p>
                  <p className="text-xs text-gray-500">
                    {meeting.date} • {meeting.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        {meetings.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info("Meetings dashboard is under construction")}
            className="w-full mt-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 gap-1"
          >
            View all meetings
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
