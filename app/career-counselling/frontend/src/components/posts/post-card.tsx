import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Eye, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Post } from "@/types";
import RandomImage from "../shared/random-image";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const expertName = post.expertDetails?.name || "Unknown Expert";
  const expertInitials = post.expertDetails?.initials || "EX";

  // Calculate estimated read time based on content length
  const readTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/posts/${post.postId}`}>
        <div className="relative h-48">
          <RandomImage
            alt={`Post by ${expertName}`}
            fill
            className="object-cover"
          />
        </div>
        <CardContent className="p-4">
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {post.content}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                  {expertInitials}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">{expertName}</p>
                <p className="text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <div className="flex items-center space-x-1" title="Likes">
                <Heart className="h-4 w-4" />
                <span>{post.likes || 0}</span>
              </div>
              <div className="flex items-center space-x-1" title="Views">
                <Eye className="h-4 w-4" />
                <span>{post.views || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
