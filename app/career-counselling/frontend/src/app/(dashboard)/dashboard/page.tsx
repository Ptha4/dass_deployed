"use client";

import { useState, useEffect } from "react";
import { FollowedCommunitiesWidget } from "@/components/dashboard/followed-communities-widget";
import { WeeklyGoalsWidget } from "@/components/dashboard/weekly-goals-widget";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { FindMentorQuestionnaire } from "@/components/dashboard/find-mentor-questionnaire";
import { UpcomingEventsWidget } from "@/components/dashboard/upcoming-events-widget";
import {
  FileText,
  Video,
  MessageSquare,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Eye,
  Heart,
  BookOpen,
  ArrowUpRight,
  User,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Blog, Video as VideoType } from "@/types";
import axios from "axios";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const PAGE_SIZE = 5;

interface WeeklyGoal {
  id: number;
  title: string;
  completed: boolean;
}

interface DashboardStats {
  profileStrength: number;
  unreadReplies: number;
  upcomingMeetingsToday: number;
  weeklyGoals: WeeklyGoal[];
}

interface Post {
  postId: string;
  title?: string;
  content: string;
  authorName?: string;
  communityDisplayName?: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  views: number;
  commentsCount?: number;
  tags?: string[];
}

/* ─── Collapsible feed section ───────────────────────────────── */
function FeedSection({
  title,
  icon,
  children,
  loading,
  hasMore,
  hasLess,
  onMore,
  onLess,
  count,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  loading: boolean;
  hasMore: boolean;
  hasLess: boolean;
  onMore: () => void;
  onLess: () => void;
  count?: number;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-2">
          <span className="text-indigo-500">{icon}</span>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        {count !== undefined && (
          <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
            {count}
          </span>
        )}
      </div>
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          </div>
        ) : (
          <>
            {children}
            <div className="flex gap-2 mt-2">
              {hasMore && (
                <button
                  onClick={onMore}
                  className="flex-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-1 py-2.5 rounded-xl hover:bg-indigo-50 transition-all border border-dashed border-indigo-200 hover:border-indigo-400"
                >
                  <ChevronDown className="h-4 w-4" />
                  Show more
                </button>
              )}
              {hasLess && (
                <button
                  onClick={onLess}
                  className="flex-1 text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center gap-1 py-2.5 rounded-xl hover:bg-gray-50 transition-all border border-dashed border-gray-200 hover:border-gray-400"
                >
                  <ChevronUp className="h-4 w-4" />
                  View less
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Posts section ──────────────────────────────────────────── */
function PostsSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    axios
      .get(`/api/posts?limit=50`)
      .then((res) => {
        const data: Post[] = Array.isArray(res.data) ? res.data : res.data.posts || [];
        setPosts(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const shown = posts.slice(0, visible);

  return (
    <FeedSection
      title="Recent Posts"
      icon={<MessageSquare className="h-5 w-5" />}
      loading={loading}
      count={posts.length}
      hasMore={visible < posts.length}
      hasLess={visible > PAGE_SIZE}
      onMore={() => setVisible((v) => v + PAGE_SIZE)}
      onLess={() => setVisible(PAGE_SIZE)}
    >
      {shown.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No posts yet</p>
      ) : (
        <div className="space-y-3">
          {shown.map((post) => (
            <Link key={post.postId} href={`/posts/${post.postId}`}>
              <div className="group relative flex flex-col gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5">
                {/* Top row: community badge + arrow */}
                <div className="flex items-center justify-between gap-2">
                  {post.communityDisplayName ? (
                    <span className="inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      {post.communityDisplayName}
                    </span>
                  ) : (
                    <span />
                  )}
                  <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>

                {/* Title */}
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-900">
                  {post.title || post.content}
                </p>

                {/* Excerpt from content when title is available */}
                {post.title && post.content && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-gray-400 pt-1 border-t border-gray-100">
                  {post.authorName && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <User className="h-3 w-3" />{post.authorName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </span>
                  <span className="flex items-center gap-1 ml-auto">
                    <Heart className="h-3 w-3 text-rose-400" />{post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />{post.views}
                  </span>
                  {post.commentsCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />{post.commentsCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </FeedSection>
  );
}

/* ─── Blogs section ──────────────────────────────────────────── */
function BlogsSection() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    axios
      .get(`/api/blogs`, { params: { limit: 50, sortBy: "recent" } })
      .then((res) => {
        const data: Blog[] = res.data.blogs || res.data || [];
        setBlogs(data);
      })
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, []);

  const shown = blogs.slice(0, visible);

  return (
    <FeedSection
      title="Recent Blogs"
      icon={<FileText className="h-5 w-5" />}
      loading={loading}
      count={blogs.length}
      hasMore={visible < blogs.length}
      hasLess={visible > PAGE_SIZE}
      onMore={() => setVisible((v) => v + PAGE_SIZE)}
      onLess={() => setVisible(PAGE_SIZE)}
    >
      {shown.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No blogs yet</p>
      ) : (
        <div className="space-y-3">
          {shown.map((blog) => {
            const author = `${blog.author.firstName} ${blog.author.lastName || ""}`.trim();
            const initials = `${blog.author.firstName?.[0] ?? ""}${blog.author.lastName?.[0] ?? ""}`.toUpperCase();
            const readTime = Math.max(1, Math.ceil(blog.body.split(/\s+/).length / 200));
            const excerpt = blog.body.replace(/[#*_`>\[\]]/g, "").slice(0, 120).trim();
            return (
              <Link key={blog.blogID} href={`/blogs/${blog.blogID}`}>
                <div className="group flex flex-col gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5">
                  {/* Top: read-time pill + arrow */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <BookOpen className="h-3 w-3" />{readTime} min read
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </div>

                  {/* Title */}
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-900">
                    {blog.heading}
                  </p>

                  {/* Excerpt */}
                  {excerpt && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {excerpt}{excerpt.length === 120 ? "…" : ""}
                    </p>
                  )}

                  {/* Author + time */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {initials || <User className="h-3 w-3" />}
                    </div>
                    <span className="text-xs font-medium text-gray-600 truncate">{author}</span>
                    <span className="text-xs text-gray-400 ml-auto flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </FeedSection>
  );
}

/* ─── Videos section ─────────────────────────────────────────── */
function VideosSection() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    axios
      .get(`/api/videos`, { params: { limit: 50 } })
      .then((res) => {
        const data: VideoType[] = Array.isArray(res.data) ? res.data : res.data.videos || [];
        setVideos(data);
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  const shown = videos.slice(0, visible);

  return (
    <FeedSection
      title="Recent Videos"
      icon={<Video className="h-5 w-5" />}
      loading={loading}
      count={videos.length}
      hasMore={visible < videos.length}
      hasLess={visible > PAGE_SIZE}
      onMore={() => setVisible((v) => v + PAGE_SIZE)}
      onLess={() => setVisible(PAGE_SIZE)}
    >
      {shown.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No videos yet</p>
      ) : (
        <div className="space-y-3">
          {shown.map((video) => (
            <Link key={video.videoID} href={`/videos/${video.videoID}`}>
              <div className="group flex flex-col gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5">
                {/* Tags + arrow */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {video.tags?.slice(0, 2).map((t) => (
                      <span key={t} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" />
                </div>
                {/* Title */}
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-violet-900">
                  {video.title}
                </p>
                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-gray-400 pt-1 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />{video.views} views
                  </span>
                  <span className="flex items-center gap-1 ml-auto">
                    <Heart className="h-3 w-3 text-rose-400" />{video.likes}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </FeedSection>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────── */
export default function UserDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showMentorQuestionnaire, setShowMentorQuestionnaire] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/user/dashboard-stats`
        );
        setStats(response.data);
      } catch {
        setStats({ profileStrength: 0, unreadReplies: 0, upcomingMeetingsToday: 0, weeklyGoals: [] });
      }
    };
    fetchStats();
  }, [isAuthenticated]);

  const dashboardContent = (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Find Mentor Questionnaire Modal */}
      {showMentorQuestionnaire && (
        <FindMentorQuestionnaire onClose={() => setShowMentorQuestionnaire(false)} />
      )}

      {/* Welcome Header */}
      <div className="w-full max-w-[1800px]">
        <WelcomeHeader
          userName={user?.firstName}
          unreadReplies={stats?.unreadReplies}
          upcomingMeetingsToday={stats?.upcomingMeetingsToday}
          onFindMentor={() => setShowMentorQuestionnaire(true)}
        />
      </div>

      {/* Main Grid */}
      <div className="flex-1 w-full max-w-[1800px] px-6 sm:px-8 lg:px-12 pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column — Mixed Feed */}
          <div className="lg:col-span-2">
            <PostsSection />
            <BlogsSection />
            <VideosSection />
          </div>

          {/* Right Column — Sidebar Widgets */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upcoming Meetings */}
            <UpcomingEventsWidget />

            {/* Followed Communities */}
            <FollowedCommunitiesWidget />

            {/* Weekly Goals */}
            {stats && stats.weeklyGoals.length > 0 && (
              <WeeklyGoalsWidget goals={stats.weeklyGoals} />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return <ProtectedRoute>{dashboardContent}</ProtectedRoute>;
}
