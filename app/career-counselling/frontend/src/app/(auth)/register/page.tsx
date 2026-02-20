"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import { BadgeCheck, Book, Users, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    const nameParts = values.name
      .split(" ")
      .filter((part) => part.trim().length > 0);
    let firstName = "";
    let middleName = "";
    let lastName = "";

    // Validate that we have at least first name and last name
    if (nameParts.length < 2) {
      toast.error("Please enter both first and last name");
      setIsSubmitting(false);
      return;
    }

    if (nameParts.length >= 3) {
      firstName = nameParts[0];
      middleName = nameParts.slice(1, -1).join(" ");
      lastName = nameParts[nameParts.length - 1];
    } else {
      firstName = nameParts[0];
      lastName = nameParts[1];
    }

    const payload = {
      firstName,
      middleName,
      lastName,
      email: values.email,
      password: values.password,
    };

    try {
      const response = await axios.post("/api/signup", payload);
      localStorage.setItem("token", response.data.token); // Set token in local storage
      window.dispatchEvent(new Event("user-authenticated")); // Dispatch custom event

      // Show success toast
      toast.success("Account created successfully!");

      // Send new users through the onboarding flow before hitting the dashboard
      window.location.href = "/onboarding";
    } catch (error: Error | unknown) {
      console.error(
        "Error creating user:",
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail || "Unknown error"
      );

      // Show specific error message based on error response
      const errorDetail = (
        error as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;

      if (errorDetail?.includes("email already exists")) {
        toast.error("An account with this email already exists");
      } else if (errorDetail?.includes("lastName")) {
        toast.error("Please provide your last name");
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-lavender/10 to-primary-blue/5 px-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-primary-blue/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-primary-lavender/20 rounded-full blur-3xl"></div>

      <div className="container mx-auto max-w-6xl flex flex-col lg:flex-row-reverse gap-8 items-center lg:items-stretch relative z-10">
        {/* Registration Form Card */}
        <Card className="w-full max-w-md border border-gray-200 shadow-lg backdrop-blur-sm bg-white/80">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex justify-center mb-2">
              <Image
                src="/logo.png"
                alt="AlumNiti Logo"
                width={60}
                height={60}
                className="h-12 w-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpath d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'%3E%3C/path%3E%3Cpath d='M2 12h20'%3E%3C/path%3E%3C/svg%3E";
                }}
              />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-primary-blue">
              Create Account
            </CardTitle>
            <p className="text-center text-gray-500 text-sm">
              Start your personalized career journey today
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          {...field}
                          className="border-gray-300 focus:border-primary-blue focus:ring focus:ring-primary-blue/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your email"
                          {...field}
                          className="border-gray-300 focus:border-primary-blue focus:ring focus:ring-primary-blue/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create a password"
                          {...field}
                          className="border-gray-300 focus:border-primary-blue focus:ring focus:ring-primary-blue/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your password"
                          {...field}
                          className="border-gray-300 focus:border-primary-blue focus:ring focus:ring-primary-blue/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-5 w-5 mx-auto" />
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center">
              <p className="text-sm text-secondary-darkGray">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary-blue font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Information Cards - Visible on desktop */}
        <div className="hidden lg:block w-full max-w-md">
          <Card className="border border-gray-200 shadow-md backdrop-blur-sm bg-white/80 mb-8 overflow-hidden">
            <div className="bg-primary-blue/10 p-6">
              <h3 className="text-2xl font-bold text-primary-blue mb-2">
                Why Join AlumNiti?
              </h3>
              <p className="text-gray-700">
                Your journey to professional success starts here.
              </p>
            </div>
            <CardContent className="pt-6">
              <ul className="space-y-5">
                <li className="flex items-start">
                  <span className="flex-shrink-0 mr-3">
                    <BadgeCheck className="h-6 w-6 text-primary-blue" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      AI-Powered Career Matching
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Get matched with careers that align with your skills,
                      interests, and personality.
                    </p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 mr-3">
                    <Book className="h-6 w-6 text-primary-blue" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Learning Pathways
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Access curated educational resources tailored to your
                      career goals.
                    </p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 mr-3">
                    <Users className="h-6 w-6 text-primary-blue" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Expert Mentorship
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Connect with industry professionals who can guide you on
                      your career path.
                    </p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 mr-3">
                    <Star className="h-6 w-6 text-primary-blue" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Personalized Dashboard
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Track your progress, manage applications, and receive
                      personalized recommendations.
                    </p>
                  </div>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-primary-lavender/20 rounded-lg border border-primary-lavender/30">
                <p className="text-sm text-gray-700 italic">
                  "AlumNiti transformed my professional journey by providing
                  clear guidance when I needed it most."
                  <span className="block mt-2 font-medium">
                    — Priya S., Software Engineer
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
