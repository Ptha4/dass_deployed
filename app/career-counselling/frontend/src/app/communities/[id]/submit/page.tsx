"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, Tags } from "lucide-react";
import { Community } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

export default function SubmitPostPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const [community, setCommunity] = useState<Community | null>(null);
    const [form, setForm] = useState({ title: "", content: "", tags: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        axios.get(`/api/communities/${id}`).then((r) => setCommunity(r.data)).catch(() => { });
    }, [id, isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!form.title.trim() || !form.content.trim()) {
            setError("Title and content are required.");
            return;
        }
        setLoading(true);
        try {
            const tags = form.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            await axios.post(`/api/communities/${id}/posts`, {
                title: form.title,
                content: form.content,
                tags,
            });
            router.push(`/communities/${id}`);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to create post.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/30">
            <div className="max-w-2xl mx-auto px-4 py-10">
                {/* Back link */}
                <Link
                    href={`/communities/${id}`}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to{" "}
                    {community ? (
                        <span className="font-medium text-gray-700">c/{community.name}</span>
                    ) : (
                        "community"
                    )}
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div
                        className="h-2 w-full"
                        style={{ backgroundColor: community?.iconColor || "#6366f1" }}
                    />
                    <div className="px-6 py-5 border-b border-gray-50">
                        <h1 className="text-xl font-bold text-gray-900">Create a Post</h1>
                        {community && (
                            <p className="text-sm text-gray-400 mt-0.5">
                                Posting in{" "}
                                <span className="font-semibold" style={{ color: community.iconColor }}>
                                    c/{community.name}
                                </span>
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                            <Input
                                placeholder="An interesting title for your post"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                maxLength={300}
                                className="rounded-xl"
                            />
                            <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/300</p>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label>
                            <Textarea
                                placeholder="Share your thoughts, questions, or insights..."
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                className="rounded-xl resize-none min-h-[180px]"
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <Tags className="h-3.5 w-3.5 text-gray-400" />
                                Tags <span className="font-normal text-gray-400">(optional)</span>
                            </label>
                            <Input
                                placeholder="career, advice, interview (comma-separated)"
                                value={form.tags}
                                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                                className="rounded-xl"
                            />
                            <p className="text-xs text-gray-400 mt-1">Add tags to help others find your post</p>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</div>
                        )}

                        {/* Preview of tags */}
                        {form.tags.trim() && (
                            <div className="flex flex-wrap gap-1.5">
                                {form.tags
                                    .split(",")
                                    .map((t) => t.trim())
                                    .filter(Boolean)
                                    .map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                            </div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/communities/${id}`)}
                                className="flex-1 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Posting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" /> Post
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
