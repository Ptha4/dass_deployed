"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp, Video, FileText, Eye, Heart } from "lucide-react";
import { useRouter } from "next/navigation";

interface TrendingItem {
  id: string;
  type: "video" | "post";
  title: string;
  thumbnail?: string;
  authorName: string;
  views: number;
  likes: number;
  excerpt: string;
}

const mockTrendingItems: TrendingItem[] = [
  {
    id: "1",
    type: "video",
    title: "Breaking Into Tech: A Complete Roadmap for 2026",
    thumbnail: "https://picsum.photos/seed/video1/600/400",
    authorName: "Dr. Sarah Chen",
    views: 12500,
    likes: 843,
    excerpt: "Learn the essential steps to launch your tech career with insights from industry experts.",
  },
  {
    id: "2",
    type: "post",
    title: "Top 10 Skills Employers Are Looking For This Year",
    thumbnail: "https://picsum.photos/seed/post1/600/400",
    authorName: "Michael Rodriguez",
    views: 8900,
    likes: 621,
    excerpt: "Discover the most in-demand skills that can boost your employability and career prospects.",
  },
  {
    id: "3",
    type: "video",
    title: "How I Got Into MIT: Application Tips & Strategy",
    thumbnail: "https://picsum.photos/seed/video2/600/400",
    authorName: "Priya Sharma",
    views: 15200,
    likes: 1240,
    excerpt: "A step-by-step guide to crafting a winning college application from a recent MIT graduate.",
  },
  {
    id: "4",
    type: "post",
    title: "Remote Work Revolution: Best Practices for Students",
    thumbnail: "https://picsum.photos/seed/post2/600/400",
    authorName: "James Chen",
    views: 7600,
    likes: 534,
    excerpt: "Master remote collaboration tools and techniques that will set you apart in the modern workplace.",
  },
  {
    id: "5",
    type: "video",
    title: "AI & Machine Learning: Career Paths Explained",
    thumbnail: "https://picsum.photos/seed/video3/600/400",
    authorName: "Dr. Emily Watson",
    views: 18300,
    likes: 1456,
    excerpt: "Explore different career trajectories in AI/ML and what skills you need for each path.",
  },
];

export function TrendingCarousel() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    setItems(mockTrendingItems);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, items.length]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handleItemClick = (item: TrendingItem) => {
    if (item.type === "video") {
      router.push(`/videos/${item.id}`);
    } else {
      router.push(`/posts/${item.id}`);
    }
  };

  if (items.length === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border-0 overflow-hidden mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse flex gap-4">
            <div className="flex-1 bg-gray-200 h-48 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <Card className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 rounded-xl shadow-md border-0 overflow-hidden mb-6">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-6 py-4 bg-white/60 backdrop-blur-sm border-b border-gray-200/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Trending Now</h2>
            <span className="ml-auto text-xs text-gray-500">
              {currentIndex + 1} / {items.length}
            </span>
          </div>
        </div>

        {/* Carousel Content */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Left - Image/Thumbnail */}
            <div
              className="relative rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => handleItemClick(currentItem)}
            >
              <img
                src={currentItem.thumbnail}
                alt={currentItem.title}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Type Badge */}
              <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1.5 shadow-lg">
                {currentItem.type === "video" ? (
                  <>
                    <Video className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-xs font-semibold text-gray-900">Video</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-900">Post</span>
                  </>
                )}
              </div>

              {/* Stats on hover */}
              <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                  <Eye className="h-3 w-3 text-white" />
                  <span className="text-xs font-medium text-white">
                    {(currentItem.views / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-400" />
                  <span className="text-xs font-medium text-white">{currentItem.likes}</span>
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="flex flex-col justify-center">
              <div className="space-y-4">
                <div>
                  <h3
                    className="text-2xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
                    onClick={() => handleItemClick(currentItem)}
                  >
                    {currentItem.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    by <span className="font-semibold text-gray-900">{currentItem.authorName}</span>
                  </p>
                  <p className="text-gray-700 leading-relaxed line-clamp-3">
                    {currentItem.excerpt}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">{currentItem.views.toLocaleString()}</span>
                    <span>views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{currentItem.likes.toLocaleString()}</span>
                    <span>likes</span>
                  </div>
                </div>

                {/* View Button */}
                <Button
                  onClick={() => handleItemClick(currentItem)}
                  className="w-full md:w-auto gap-2 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                >
                  {currentItem.type === "video" ? "Watch Now" : "Read More"}
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 pb-4 px-6">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsAutoPlaying(false);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-gradient-to-r from-orange-600 to-pink-600"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
