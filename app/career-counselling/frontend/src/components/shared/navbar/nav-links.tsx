"use client";

import * as React from "react";
import Link from "next/link";
import {
  Book,
  BookOpen,
  School,
  Video,
  Split,
  LayoutDashboard,
  GraduationCap,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  Omit<React.ComponentPropsWithoutRef<"a">, "title"> & {
    title: React.ReactNode;
    children?: React.ReactNode;
  }
>(({ className, title, children, ...props }, ref) => {
  return (
    <NavigationMenuLink asChild>
      <Link
        ref={ref as any}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
        {...props}
      >
        <div className="text-sm font-medium leading-none flex items-center gap-2">
          {title}
        </div>
        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
          {children}
        </p>
      </Link>
    </NavigationMenuLink>
  );
});
ListItem.displayName = "ListItem";

export default function NavLinks() {
  const { isAuthenticated, user } = useAuth();

  const collegesItems = [
    {
      title: "Explore Colleges",
      href: "/colleges",
      description: "Browse and compare different colleges and universities",
      icon: <School className="h-4 w-4" />,
    },
    {
      title: "Career Assessment",
      href: "/assessments",
      description: "Take a career assessment test to find your strengths",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      title: "College-Branch Predictor",
      href: "/predictor",
      description:
        "Tool to predict your college and branch based on your scores",
      icon: <Split className="h-4 w-4" />,
    },
  ];

  const contentItems = [
    {
      title: "Blogs",
      href: "/blogs",
      description: "Read articles and guides on career development",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      title: "Videos",
      href: "/videos",
      description: "Watch educational and informative videos",
      icon: <Video className="h-4 w-4" />,
    },
  ];

  const dashboardItems = [];
  const isAdmin = user?.isAdmin;
  const isExpert = user?.isExpert;
  const hasMultipleDashboards = isAuthenticated && (isAdmin || isExpert);

  if (isAuthenticated) {
    dashboardItems.push({
      title: "User Dashboard",
      href: "/dashboard",
      description:
        "View your personalized dashboard with recommendations and progress",
      icon: <User className="h-4 w-4" />,
    });

    if (isAdmin) {
      dashboardItems.push({
        title: "Admin Dashboard",
        href: "/admin",
        description: "Manage users, content, and platform settings",
        icon: <ShieldCheck className="h-4 w-4" />,
      });
    }

    if (isExpert && user?.expertId) {
      dashboardItems.push({
        title: "Expert Dashboard",
        href: `/experts/${user.expertId}`,
        description: "Manage your expert profile, sessions, and requests",
        icon: <GraduationCap className="h-4 w-4" />,
      });
    }
  }

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {isAuthenticated && (
          <NavigationMenuItem>
            {hasMultipleDashboards ? (
              <>
                <NavigationMenuTrigger>
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboards
                  </span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-1">
                    {dashboardItems.map((item) => (
                      <div key={item.title}>
                        <ListItem
                          title={
                            <span className="flex items-center gap-2">
                              {item.icon}
                              {item.title}
                            </span>
                          }
                          href={item.href}
                        >
                          {item.description}
                        </ListItem>
                      </div>
                    ))}
                  </div>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink asChild>
                <Link
                  href="/dashboard"
                  className={navigationMenuTriggerStyle()}
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    User Dashboard
                  </span>
                </Link>
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        )}

        <NavigationMenuItem>
          <NavigationMenuTrigger>Colleges</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
              {collegesItems.map((item) => (
                <div key={item.title}>
                  <ListItem
                    title={
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.title}
                      </span>
                    }
                    href={item.href}
                  >
                    {item.description}
                  </ListItem>
                </div>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Content</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
              {contentItems.map((item) => (
                <div key={item.title}>
                  <ListItem
                    title={
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.title}
                      </span>
                    }
                    href={item.href}
                  >
                    {item.description}
                  </ListItem>
                </div>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <div
            className={cn(
              navigationMenuTriggerStyle(),
              "bg-gradient-to-r from-blue-100 to-purple-100 text-primary-blue hover:from-blue-200 hover:to-purple-200"
            )}
            onClick={() => (window.location.href = "/experts")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                window.location.href = "/experts";
              }
            }}
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Experts
            </span>
          </div>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
