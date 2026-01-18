import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import RandomImage from "../shared/random-image";
import { Blog } from "@/types";
import { useEffect, useState } from "react";
import axios from "axios";

interface RelatedBlogsProps {
  currentBlogId: string;
  refType: string;
  typeId?: string;
}

export default function RelatedBlogs({
  currentBlogId,
  refType,
  typeId,
}: RelatedBlogsProps) {
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedBlogs = async () => {
      try {
        setIsLoading(true);
        // Fetch related blogs with the same refType
        const params: any = {
          limit: 3,
          refType: refType,
        };

        // Add typeId if it exists and is relevant
        if (typeId && refType !== "NA") {
          params.typeId = typeId;
        }

        const response = await axios.get("/api/blogs", { params });

        // Filter out the current blog
        const filteredBlogs = response.data.blogs.filter(
          (blog: Blog) => blog.blogID !== currentBlogId
        );

        setRelatedBlogs(filteredBlogs.slice(0, 3));
      } catch (error) {
        console.error("Error fetching related blogs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentBlogId) {
      fetchRelatedBlogs();
    }
  }, [currentBlogId, refType, typeId]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        Loading related blogs...
      </div>
    );
  }

  if (relatedBlogs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-4">Related Articles</h3>
      <div className="space-y-4">
        {relatedBlogs.map((blog) => (
          <Link
            key={blog.blogID}
            href={`/blogs/${blog.blogID}`}
            className="m-1"
          >
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex space-x-4">
                <div className="relative w-24 h-24">
                  <RandomImage
                    alt={blog.heading}
                    fill
                    className="object-cover rounded-l-lg"
                  ></RandomImage>
                </div>
                <CardContent className="flex-1 p-3">
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">
                    {blog.heading}
                  </h4>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{blog.views || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{`${Math.max(
                        1,
                        Math.ceil(blog.body.split(/\s+/).length / 200)
                      )} min`}</span>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
