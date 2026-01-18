"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // Import the Image component
import {
  Menu,
  User,
  Wallet,
  ShieldCheck,
  GraduationCap,
  MessageCircle,
  Crown,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SearchBar from "./search-bar";
import NavLinks from "./nav-links";
import MobileNav from "./mobile-nav";
import { useAuth } from "@/contexts/AuthContext";
import NotificationsDropdown from "@/components/notifications/notifications-dropdown";
import Chatbot from "@/components/shared/chatbot";
import { SubscribeButton } from "@/components/subscription/subscribe-button";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  // Listen for custom event to toggle chatbot from mobile nav
  useEffect(() => {
    const handleToggleChatbotEvent = () => {
      setIsChatbotOpen((prev) => !prev);
    };

    window.addEventListener("toggle-chatbot", handleToggleChatbotEvent);
    return () =>
      window.removeEventListener("toggle-chatbot", handleToggleChatbotEvent);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${
      user.lastName?.[0] || ""
    }`.toUpperCase();
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-md" : "bg-white/95 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              {/* Replace text logo with Image component */}
              <Image
                src="/logo.png"
                alt="AlumNiti Logo"
                width={40}
                height={10}
                priority
              />
              <span className="text-xl font-bold text-primary-blue">
                AlumNiti
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <NavLinks />
              <div className="ml-4">
                <SearchBar />
              </div>

              {/* Chatbot Button - Desktop */}
              <Button
                onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                size="sm"
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-gradient-to-r from-blue-100 to-purple-100 text-primary-blue hover:from-blue-200 hover:to-purple-200 transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                <span>AI Chat</span>
              </Button>

              {/* Authentication Controls */}
              <div className="flex items-center space-x-4">
                {isAuthenticated && user ? (
                  <div className="flex items-center space-x-2">
                    <NotificationsDropdown />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="relative h-9 w-9 rounded-full"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={
                                typeof user.profileImage === "string"
                                  ? user.profileImage
                                  : ""
                              }
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                            <AvatarFallback className="bg-primary-blue text-white">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-56"
                        align="end"
                        forceMount
                      >
                        <div className="flex items-center justify-start gap-2 p-2">
                          <div className="flex flex-col space-y-1 leading-none">
                            <p className="font-medium text-sm">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="w-[200px] truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem asChild>
                            <Link href="/profile" className="cursor-pointer">
                              <User className="mr-2 h-4 w-4" />
                              <span>Profile</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/wallet" className="cursor-pointer">
                              <Wallet className="mr-2 h-4 w-4" />
                              <span>Wallet</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard" className="cursor-pointer">
                              <Settings className="mr-2 h-4 w-4" />
                              <span>Dashboard</span>
                            </Link>
                          </DropdownMenuItem>

                          {user.isAdmin && (
                            <DropdownMenuItem asChild>
                              <Link href="/admin" className="cursor-pointer">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                <span>Admin Dashboard</span>
                              </Link>
                            </DropdownMenuItem>
                          )}

                          {user.isExpert && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/experts/${user.expertId}`}
                                className="cursor-pointer"
                              >
                                <GraduationCap className="mr-2 h-4 w-4" />
                                <span>Expert Dashboard</span>
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuGroup>
                        <DropdownMenuItem 
                          onClick={() => {
                            // Close the dropdown when selecting subscribe button
                            setIsMobileMenuOpen(false);
                          }}
                          className="p-0"
                        >
                          <SubscribeButton className="w-full justify-start cursor-pointer rounded px-2 py-1.5 text-sm" showIcon={true} />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={logout}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/login"
                      className="text-secondary-darkGray hover:text-primary-blue transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="bg-primary-blue text-white px-4 py-2 rounded-md hover:bg-primary-blue/90 transition-colors whitespace-nowrap"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-2">
              {isAuthenticated && <NotificationsDropdown />}

              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[300px] sm:w-[350px] p-0"
                >
                  <SheetTitle className="sr-only" />
                  <MobileNav
                    onClose={() => setIsMobileMenuOpen(false)}
                    isLoggedIn={isAuthenticated}
                    handleLogout={logout}
                    isAdmin={user?.isAdmin}
                    isExpert={user?.isExpert}
                    expertId={user?.expertId}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
      {/* Chatbot floating component */}
      <Chatbot isOpen={isChatbotOpen} onOpenChange={setIsChatbotOpen} />
    </>
  );
}
