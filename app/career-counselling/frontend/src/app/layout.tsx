import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/navbar";
import Sidebar from "@/components/shared/sidebar";
import Footer from "@/components/shared/footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AlumNiti",
  description: "Career guidance platform for Indian students",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#000000" />
        <meta
          name="description"
          content="Career guidance platform for Indian students"
        />
        <meta
          name="keywords"
          content="career, guidance, counselling, students, alumni"
        />
        <meta name="author" content="AlumNiti Team" />
        <meta property="og:title" content="AlumNiti" />
        <meta
          property="og:description"
          content="Career guidance platform for Indian students"
        />
        <meta property="og:image" content="/logo.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {/* Sidebar - Fixed Left */}
          <Sidebar />
          
          {/* Top Navbar */}
          <Navbar />
          
          {/* Main Content Area - Offset by sidebar width */}
          <main className="min-h-screen pt-[80px] md:ml-64 transition-all duration-300 bg-gray-50">
            {children}
          </main>
          
          {/* Footer - Also offset by sidebar */}
          <div className="md:ml-64 bg-gray-50">
            <Footer />
          </div>
          
          <Toaster />
          <Analytics />
          <SpeedInsights />
          <SonnerToaster position="bottom-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
