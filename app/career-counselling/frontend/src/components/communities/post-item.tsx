"use client";

import Link from "next/link";
import { Heart, MessageSquare, Eye, Clock } from "lucide-react";
import { Post } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

interface PostItemProps {
    post: Post;
    showCommunity?: boolean;
}

export default function PostItem({ post, showCommunity = false }: PostItemProps) {
    const { user } = useAuth();
    const userId = user?._id || "";
    const [likes, setLikes] = useState(post.likes);
    const [likedBy, setLikedBy] = useState<string[]>(post.likedBy || []);
    const isLiked = likedBy.includes(userId);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return;

        // Optimistic update
        if (isLiked) {
            setLikes((l) => l - 1);
            setLikedBy((lb) => lb.filter((id) => id !== userId));
        } else {
            setLikes((l) => l + 1);
            setLikedBy((lb) => [...lb, userId]);
        }

        try {
            await axios.post(`/api/posts/${post.postId}/like`);
        } catch {
            // rollback
            if (isLiked) {
                setLikes((l) => l + 1);
                setLikedBy((lb) => [...lb, userId]);
            } else {
                setLikes((l) => l - 1);
                setLikedBy((lb) => lb.filter((id) => id !== userId));
            }
        }
    };

    const initials = post.authorInitials || (post.authorName?.charAt(0) || "U").toUpperCase();

    return (
        <div className="group bg-white border border-gray-100 hover:border-indigo-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5">
            {/* Author row */}
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: "#6366f1" }}
                >
                    {initials}
                </div>
                <span className="font-medium text-gray-600">{post.authorName || "Anonymous"}</span>
                {showCommunity && post.communityDisplayName && (
                    <>
                        <span>in</span>
                        <Link
                            href={`/communities/${post.communityId}`}
                            className="font-semibold text-indigo-500 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            c/{post.communityName}
                        </Link>
                    </>
                )}
                <span className="ml-auto flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
            </div>

            {/* Title + content */}
            <Link href={`/posts/${post.postId}`}>
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1.5 line-clamp-2">
                    {post.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.content}</p>
            </Link>

            {/* Media gallery */}
            {post.media && post.media.length > 0 && (
                <div className={`grid gap-2 mb-3 ${post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {post.media.map((item, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                            {item.type === "image" ? (
                                <img
                                    src={item.url}
                                    alt=""
                                    className="w-full h-48 object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <video
                                    src={item.url}
                                    controls
                                    className="w-full h-48 object-cover"
                                    preload="metadata"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-5 text-xs text-gray-400">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 hover:text-rose-500 transition-colors ${isLiked ? "text-rose-500" : ""}`}
                >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-500" : ""}`} />
                    <span>{likes}</span>
                </button>

                <Link
                    href={`/posts/${post.postId}`}
                    className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors"
                >
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.commentsCount || 0} comments</span>
                </Link>

                <div className="flex items-center gap-1.5 ml-auto">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{post.views || 0}</span>
                </div>
            </div>
        </div>
    );
}
