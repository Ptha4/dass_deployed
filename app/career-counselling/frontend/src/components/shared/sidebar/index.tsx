"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronDown,
  School,
  Split,
  Video,
  User,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  subItems?: {
    title: string;
    href: string;
    icon: React.ReactNode;
  }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);

  const isAdmin = user?.isAdmin;
  const isExpert = user?.isExpert;

  // Toggle collapsible sections
  const toggleCollapsible = (title: string) => {
    setOpenCollapsibles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  // Build dashboard items based on user roles
  const dashboardItems = [];
  if (isAuthenticated) {
    dashboardItems.push({
      title: "User Dashboard",
      href: "/dashboard",
      icon: <User className="h-5 w-5" />,
    });

    if (isAdmin) {
      dashboardItems.push({
        title: "Admin Dashboard",
        href: "/admin",
        icon: <ShieldCheck className="h-5 w-5" />,
      });
    }

    if (isExpert && user?.expertId) {
      dashboardItems.push({
        title: "Expert Dashboard",
        href: `/experts/${user.expertId}`,
        icon: <GraduationCap className="h-5 w-5" />,
      });
    }
  }

  const sidebarItems: SidebarItem[] = [
    // Dashboards Section
    ...(isAuthenticated && dashboardItems.length === 1
      ? [
          {
            title: "Dashboard",
            href: dashboardItems[0].href,
            icon: <LayoutDashboard className="h-5 w-5" />,
          },
        ]
      : []),
    ...(isAuthenticated && dashboardItems.length > 1
      ? [
          {
            title: "Dashboards",
            icon: <LayoutDashboard className="h-5 w-5" />,
            subItems: dashboardItems,
          },
        ]
      : []),

    // Colleges Section
    {
      title: "Colleges",
      icon: <Building2 className="h-5 w-5" />,
      subItems: [
        {
          title: "Explore Colleges",
          href: "/colleges",
          icon: <School className="h-5 w-5" />,
        },
        {
          title: "Career Assessment",
          href: "/assessments",
          icon: <BookOpen className="h-5 w-5" />,
        },
        {
          title: "College Predictor",
          href: "/predictor",
          icon: <Split className="h-5 w-5" />,
        },
      ],
    },

    // Content Section
    {
      title: "Content",
      icon: <BookOpen className="h-5 w-5" />,
      subItems: [
        {
          title: "Blogs",
          href: "/blogs",
          icon: <BookOpen className="h-5 w-5" />,
        },
        {
          title: "Videos",
          href: "/videos",
          icon: <Video className="h-5 w-5" />,
        },
      ],
    },

    // Experts Section
    {
      title: "Experts",
      href: "/experts",
      icon: <GraduationCap className="h-5 w-5" />,
    },

    // AI Chat Section
    {
      title: "AI Chat",
      href: "/chat",
      icon: <Sparkles className="h-5 w-5" />,
    },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const hasActiveSubItem = (subItems?: { href: string }[]) => {
    if (!subItems) return false;
    return subItems.some((item) => isActive(item.href));
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-4 py-8">
        <div className="space-y-2 w-full">
          {sidebarItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isItemActive = isActive(item.href);
            const hasActiveSub = hasActiveSubItem(item.subItems);
            const isOpen = openCollapsibles.includes(item.title);

            if (hasSubItems) {
              return (
                <div key={item.title}>
                  <button
                    onClick={() => toggleCollapsible(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all group",
                      hasActiveSub
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <span className="flex items-center space-x-4">
                      <span
                        className={cn(
                          "transition-colors text-xl",
                          hasActiveSub
                            ? "text-blue-600"
                            : "text-gray-600"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className={cn(
                        "text-base",
                        hasActiveSub ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                      )}>{item.title}</span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-gray-500 transition-transform",
                        (isOpen || hasActiveSub) && "rotate-180"
                      )}
                    />
                  </button>
                  {(isOpen || hasActiveSub) && (
                    <div className="mt-1.5 mb-1.5">
                      <div className="space-y-1.5 ml-5 pl-6 border-l-2 border-gray-200">
                        {item.subItems?.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                              "flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all text-base",
                              isActive(subItem.href)
                                ? "bg-blue-50 font-semibold text-blue-600"
                                : "font-normal text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            <span
                              className={cn(
                                "text-gray-500 w-5 h-5 flex items-center justify-center text-lg",
                                isActive(subItem.href) && "text-blue-600"
                              )}
                            >
                              {subItem.icon}
                            </span>
                            <span>{subItem.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Regular link without sub-items
            return (
              <Link
                key={item.title}
                href={item.href!}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center space-x-4 px-5 py-4 rounded-xl transition-all group",
                  isItemActive
                    ? "bg-blue-50 font-semibold text-blue-600"
                    : "font-medium text-gray-700 hover:bg-gray-50"
                )}
              >
                <span
                  className={cn(
                    "transition-colors text-xl",
                    isItemActive
                      ? "text-blue-600"
                      : "text-gray-600"
                  )}
                >
                  {item.icon}
                </span>
                <span className="text-base">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - Optional */}
      <div className="px-6 py-5 mt-auto">
        <div className="text-sm text-gray-400">
          © 2026 AlumNiti
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 z-30 pt-[80px]">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 z-40 md:hidden transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {renderSidebarContent()}
      </aside>
    </>
  );
}
