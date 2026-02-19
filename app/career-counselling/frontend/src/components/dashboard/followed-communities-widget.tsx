"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Community {
  id: string;
  name: string;
  avatar: string;
  members: string;
  color: string;
}

const mockCommunities: Community[] = [
  {
    id: "1",
    name: "r/CareerGuidance",
    avatar: "CG",
    members: "1.2M members",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "2",
    name: "r/EngineeringStudents",
    avatar: "ES",
    members: "856K members",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "3",
    name: "r/CollegeAdmissions",
    avatar: "CA",
    members: "432K members",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "4",
    name: "r/StudyAbroad",
    avatar: "SA",
    members: "298K members",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "5",
    name: "r/AskAcademia",
    avatar: "AA",
    members: "654K members",
    color: "from-indigo-500 to-blue-500",
  },
];

export function FollowedCommunitiesWidget() {
  const router = useRouter();

  const handleCommunityClick = (communityId: string) => {
    // Navigate to community page (placeholder route)
    router.push(`/community/${communityId}`);
  };

  return (
    <Card className="overflow-hidden bg-white rounded-xl shadow-sm border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Followed Communities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {mockCommunities.map((community) => (
          <div
            key={community.id}
            onClick={() => handleCommunityClick(community.id)}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <Avatar className="h-9 w-9 ring-1 ring-gray-100">
              <AvatarFallback
                className={`bg-gradient-to-br ${community.color} text-white text-xs font-semibold`}
              >
                {community.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {community.name}
              </p>
              <p className="text-xs text-gray-500">{community.members}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
