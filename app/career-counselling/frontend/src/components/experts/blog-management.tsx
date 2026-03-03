"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  Heart,
  MessageSquare,
  Clock,
  Save,
  Loader2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface BlogData {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  status: "draft" | "published";
}

export function BlogManagement() {
  const [blogs, setBlogs] = useState<BlogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<BlogData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    coverImage: "",
    tags: "",
    status: "draft" as "draft" | "published",
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/blogs/my-blogs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch blogs");

      const data = await response.json();
      setBlogs(data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to load blogs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (blog?: BlogData) => {
    if (blog) {
      setIsEditing(true);
      setCurrentBlog(blog);
      setFormData({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        coverImage: blog.coverImage || "",
        tags: blog.tags?.join(", ") || "",
        status: blog.status,
      });
    } else {
      setIsEditing(false);
      setCurrentBlog(null);
      setFormData({
        title: "",
        content: "",
        excerpt: "",
        coverImage: "",
        tags: "",
        status: "draft",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (saveAs: "draft" | "published") => {
    if (!formData.title || !formData.content) {
      toast.error("Please fill in title and content");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/blogs/${currentBlog?.id}` : "/api/blogs";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt || formData.content.substring(0, 150) + "...",
          coverImage: formData.coverImage,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
          status: saveAs,
        }),
      });

      if (!response.ok) throw new Error("Failed to save blog");

      const message =
        saveAs === "published"
          ? isEditing
            ? "Blog updated and published"
            : "Blog published successfully"
          : isEditing
          ? "Blog updated as draft"
          : "Blog saved as draft";

      toast.success(message);
      setIsDialogOpen(false);
      fetchBlogs();
    } catch (error) {
      console.error("Error saving blog:", error);
      toast.error("Failed to save blog");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete blog");

      toast.success("Blog deleted successfully");
      fetchBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    }
  };

  const filteredBlogs =
    filterStatus === "all"
      ? blogs
      : blogs.filter((blog) => blog.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Write and manage your blog articles
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Write New Blog
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
        >
          All ({blogs.length})
        </Button>
        <Button
          variant={filterStatus === "published" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("published")}
        >
          Published ({blogs.filter((b) => b.status === "published").length})
        </Button>
        <Button
          variant={filterStatus === "draft" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("draft")}
        >
          Drafts ({blogs.filter((b) => b.status === "draft").length})
        </Button>
      </div>

      {/* Blog List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 flex gap-4">
                <div className="w-48 h-32 bg-gray-200 rounded" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBlogs.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filterStatus === "draft"
                ? "No drafts yet"
                : filterStatus === "published"
                ? "No published blogs yet"
                : "No blogs yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              Start sharing your insights by writing your first blog post
            </p>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Write Your First Blog
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBlogs.map((blog) => (
            <Card
              key={blog.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Cover Image */}
                  <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                        <FileText className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                            {blog.title}
                          </h3>
                          <Badge
                            variant={
                              blog.status === "published" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {blog.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {blog.excerpt}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(blog)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(blog.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {blog.tags.slice(0, 5).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Stats & Date */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{blog.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{blog.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{blog.comments}</span>
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        <Clock className="h-4 w-4" />
                        <span>
                          Updated{" "}
                          {formatDistanceToNow(new Date(blog.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Blog Post" : "Write New Blog Post"}
            </DialogTitle>
            <DialogDescription>
              Share your knowledge and insights with your audience
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter an engaging title for your blog..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL (Optional)</Label>
              <Input
                id="coverImage"
                placeholder="https://example.com/image.jpg"
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData({ ...formData, coverImage: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Short Description (Optional)</Label>
              <Textarea
                id="excerpt"
                placeholder="A brief summary of your blog post..."
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Content <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="Write your blog content here... (Markdown supported)"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Markdown is supported. Use ** for bold, * for italic, # for headings, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                placeholder="e.g., Career Advice, Technology, Education (comma-separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit("published")}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
