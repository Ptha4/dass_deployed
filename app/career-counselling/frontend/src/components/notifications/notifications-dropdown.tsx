"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Notification } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Helper function to strip Markdown
const stripMarkdown = (markdown: string): string => {
  // Log the input for debugging
  console.log("Stripping Markdown Input:", JSON.stringify(markdown));

  if (!markdown) return "";

  let text = markdown;

  // Block Elements
  text = text.replace(/#+\s*(.*)$/gm, "$1"); // Headers (NO ^ anchor, handles optional space after #)
  text = text.replace(/^>\s+/gm, ""); // Blockquotes (Keep ^ anchor)
  text = text.replace(/^(\s*(\*|-|\+)\s+)|(^\s*\d+\.\s+)/gm, ""); // List items (basic markers)
  text = text.replace(/^- \[( |x)\]\s+/gm, ""); // Task list markers
  text = text.replace(/```[\s\S]*?```/g, ""); // Fenced Code blocks
  text = text.replace(/^(---|___|\*\*\*)\s*$/gm, ""); // Horizontal rules
  text = text.replace(/^\|.*\|$/gm, ""); // Table rows (basic)
  text = text.replace(/^\|?[- :]+\|[-| :]*\|$/gm, ""); // Table separators (basic)
  text = text.replace(/^\s*([^\n]+)\n:\s+(.*)/gm, "$1: $2"); // Definition lists (basic)
  text = text.replace(/^\[\^(\w+)\]:\s*(.*)/gm, ""); // Footnote definitions

  // Inline Elements
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2"); // Bold
  text = text.replace(/(\*|_)(.*?)\1/g, "$2"); // Italics
  text = text.replace(/~~(.*?)~~/g, "$1"); // Strikethrough
  text = text.replace(/`(.*?)`/g, "$1"); // Inline code
  text = text.replace(/!\[(.*?)\]\(.*?\)/g, "$1"); // Images (keep alt text)
  text = text.replace(/\[(.*?)\]\(.*?\)/g, "$1"); // Links (keep link text)
  text = text.replace(/<[^>]*>/g, ""); // HTML tags
  text = text.replace(/\[\^(\w+)\]/g, ""); // Footnote links
  text = text.replace(/:(.*?):/g, "$1"); // Emoji (remove colons, keep text/unicode)
  text = text.replace(/==(.*?)==/g, "$1"); // Highlight
  text = text.replace(/~(.*?)~/g, "$1"); // Subscript
  text = text.replace(/\^(.*?)\^/g, "$1"); // Superscript

  // Clean up extra whitespace and newlines
  text = text.replace(/\n{2,}/g, "\n"); // Replace multiple newlines with one
  text = text.replace(/\\n/g, " "); // Replace escaped newlines with space
  text = text.replace(/\s+/g, " ").trim(); // Replace multiple spaces with one and trim

  console.log("Stripping Markdown Output:", JSON.stringify(text)); // Log output for comparison
  return text;
};

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [isAuthenticated]);

  const fetchExpertIdByUserId = async (
    userId: string
  ): Promise<string | null> => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/by-user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.expertId) {
        return response.data.expertId;
      }
      return null;
    } catch (error) {
      console.error("Error fetching expert ID:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Setup polling for notifications (every minute)
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  useEffect(() => {
    // Refetch when dropdown is opened
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark individual notification as read
      if (!notification.read) {
        const token = localStorage.getItem("token");

        try {
          await axios.put(
            `/api/notifications/${notification.notificationId}`,
            { read: true },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log("Notification marked as read successfully");
        } catch (markReadError) {
          console.error("Error marking notification as read:", markReadError);
          // Continue with navigation even if marking as read fails
        }

        // Update local state to mark as read regardless of API success
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notification.notificationId
              ? { ...n, read: true }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Navigate based on notification type and reference
      if (notification.referenceType === "expert" && notification.referenceId) {
        // Navigate to expert detail page using the expert ID
        console.log(
          `Navigating to expert page with ID: ${notification.referenceId}`
        );
        router.push(`/experts/${notification.referenceId}`);
      } else if (
        notification.referenceType === "post" &&
        notification.referenceId
      ) {
        // For post notifications, navigate to the expert's page
        let expertId = null;

        // First check if sourceUserDetails has expertId
        if (
          notification.sourceUserDetails &&
          "expertId" in notification.sourceUserDetails
        ) {
          expertId = (notification.sourceUserDetails as any).expertId;
        }
        // If not, fetch the expert ID from the API using the source user ID
        else if (notification.sourceUserId) {
          expertId = await fetchExpertIdByUserId(notification.sourceUserId);
        }

        if (expertId) {
          console.log(`Navigating to expert page with ID: ${expertId}`);
          router.push(`/experts/${expertId}`);
        } else {
          console.log("Could not navigate - expert ID not found");
          toast({
            title: "Navigation Error",
            description: "Could not navigate to the expert's page.",
            variant: "destructive",
          });
        }
      } else if (
        notification.referenceType === "blog" &&
        notification.referenceId
      ) {
        console.log(
          `Navigating to blog page with ID: ${notification.referenceId}`
        );
        router.push(`/blogs/${notification.referenceId}`);
      } else if (
        notification.referenceType === "video" &&
        notification.referenceId
      ) {
        console.log(
          `Navigating to video page with ID: ${notification.referenceId}`
        );
        router.push(`/videos/${notification.referenceId}`);
      } else {
        console.log("No specific navigation target for this notification");
      }

      // Close dropdown after clicking
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling notification:", error);
      toast({
        title: "Error",
        description: "Failed to process notification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Use POST method instead of PUT
      await axios.post(
        "/api/notifications/read-all",
        {}, // Empty body
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all as read. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative w-9 h-9 p-0 rounded-full"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-blue-600"
              variant="default"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 mt-2">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="font-medium">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={markAllAsRead}
              disabled={isLoading}
            >
              {isLoading ? "Marking..." : "Mark all as read"}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[420px] overflow-scroll">
          {notifications.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.notificationId}
                className={`px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 transition-colors ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  <div
                    className={`w-2 h-2 mt-2 rounded-full ${
                      !notification.read ? "bg-blue-600" : "bg-transparent"
                    }`}
                  />
                  <div className="flex-1">
                    <p className={`text-sm line-clamp-2 ${
                      notification.referenceType === 'post' ? 'break-all' : 'break-word'
                    }`}>
                      {stripMarkdown(notification.content)}{" "}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
