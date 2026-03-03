"use client";

import HeroSection from "@/components/landing/hero-section";
import FeaturesSection from "@/components/landing/features-section";
import StatsSection from "@/components/landing/stats-section";
import CTASection from "@/components/landing/cta-section";
import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
// Lazy load heavy components to improve initial page load
const MapSection = dynamic(() => import("@/components/landing/map-section"), {
  loading: () => (
    <div className="py-20 flex justify-center items-center">
      <div className="animate-pulse text-center">
        <div className="h-8 w-64 bg-blue-100 rounded mx-auto mb-4"></div>
        <div className="h-40 w-full max-w-2xl bg-blue-50 rounded mx-auto"></div>
      </div>
    </div>
  ),
  ssr: false, // Disable server-side rendering for this component
});

const TestimonialsSection = dynamic(
  () => import("@/components/landing/testimonials-section"),
  {
    loading: () => (
      <div className="py-20 flex justify-center items-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-64 bg-blue-100 rounded mx-auto mb-4"></div>
          <div className="h-20 w-full max-w-2xl bg-blue-50 rounded mx-auto"></div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Loader Component
const LoadingOverlay = ({ error }: { error: string | null }) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "white",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999, // Ensure it's on top
    }}
  >
    {error ? (
      <div className="text-red-600 text-center max-w-md mx-auto px-6">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
        <p className="text-sm mb-4">Unable to connect to our backend service.</p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-xs font-mono text-red-700">{error}</p>
          <p className="text-xs text-gray-600 mt-2">
            API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
          </p>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>Please check:</p>
          <p>• Backend server is running and accessible</p>
          <p>• Network connection is stable</p>
          <p>• No firewall blocking the connection</p>
          <p>• Backend URL is correctly configured</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Retry Connection
        </button>
      </div>
    ) : (
      <>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ pointerEvents: "none" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              AlumNiti
            </h1>
          </motion.div>
        </motion.div>
        <div className="loadingspinner">
          <div id="square1"></div>
          <div id="square2"></div>
          <div id="square3"></div>
          <div id="square4"></div>
          <div id="square5"></div>
        </div>
      </>
    )}
  </div>
);

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    const checkApiStatus = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Adjust the URL based on your actual API endpoint
        const response = await fetch("/api/health");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.status === "healthy") {
          setIsApiReady(true);
        } else {
          setError(`Backend returned unexpected status: ${data.status}`);
        }
      } catch (e: any) {
        console.error("API check failed:", e);
        
        // Provide more specific error messages based on the error type
        if (e.name === 'TypeError' && e.message.includes('fetch')) {
          setError('Network error: Unable to reach backend server. Please check if the backend is deployed and running');
        } else if (e.message.includes('Failed to fetch')) {
          setError('CORS or network error: Backend may be running but not accessible from this domain');
        } else if (e.message.includes('HTTP 404')) {
          setError('Backend health endpoint not found. Check if backend routes are properly configured and deployed');
        } else if (e.message.includes('HTTP 500')) {
          setError('Backend server error. The backend service may be experiencing issues');
        } else if (e.message.includes('HTTP 503')) {
          setError('Backend service unavailable. The backend may be starting up or temporarily overloaded');
        } else {
          setError(`Connection failed: ${e.message || 'Unknown error occurred while connecting to backend'}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    setTimeout(() => {
      checkApiStatus();
    }, 300);
  }, []);

  if (isLoading || !isApiReady || error) {
    return <LoadingOverlay error={error} />;
  }

  return (
    <div className="w-full overflow-hidden">
      {/* Main Content */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <Suspense fallback={null}>
          <MapSection />
        </Suspense>
        <StatsSection />
        <Suspense fallback={null}>
          <TestimonialsSection />
        </Suspense>
        <CTASection />
      </main>

      {/* Floating back-to-top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
        aria-label="Back to top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </div>
  );
}
