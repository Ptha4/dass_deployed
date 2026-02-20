"use client";

import Link from "next/link";
import { Users2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpertPostsProps {
  expertId: string;
  expertName: string;
  expertInitials: string;
  isExpertLoggedIn?: boolean;
}

/**
 * The old expert-specific posts system has been replaced with
 * a Reddit-like community system. Posts now live inside communities.
 * This component encourages users to visit the communities page.
 */
export default function ExpertPosts({
  expertName,
}: ExpertPostsProps) {
  return (
    <div className="py-10 flex flex-col items-center text-center gap-4">
      <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
        <Users2 className="h-8 w-8 text-indigo-400" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 mb-1">
          Posts moved to Communities
        </h3>
        <p className="text-sm text-gray-500 max-w-xs">
          {expertName} now posts inside topic communities. Explore communities to
          find their latest contributions.
        </p>
      </div>
      <Link href="/communities">
        <Button variant="outline" className="gap-2 rounded-xl">
          <ExternalLink className="h-4 w-4" />
          Browse Communities
        </Button>
      </Link>
    </div>
  );
}
