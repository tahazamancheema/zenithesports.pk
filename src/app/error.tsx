"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 film-grain opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-md w-full bg-[#111] border border-white/10 p-8 rounded-2xl text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-[family-name:var(--font-heading)] font-bold text-white mb-2 uppercase">
          System Error
        </h1>
        <p className="text-gray-400 mb-8 font-[family-name:var(--font-body)]">
          A critical error occurred while rendering this page. Our technical team has been notified.
        </p>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()} 
            variant="primary"
            className="w-full flex justify-center h-12"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Link href="/" className="w-full">
            <Button 
              variant="secondary"
              className="w-full flex justify-center h-12"
            >
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
