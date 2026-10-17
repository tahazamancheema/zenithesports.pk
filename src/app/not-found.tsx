import Link from "next/link";
import { Search, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 film-grain opacity-20 pointer-events-none" />
      
      {/* Glitch text effect background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-bold font-[family-name:var(--font-display)] text-white/5 select-none pointer-events-none">
        404
      </div>
      
      <div className="relative z-10 max-w-lg w-full text-center">
        <h1 className="text-8xl font-[family-name:var(--font-display)] font-bold text-white mb-4">
          404
        </h1>
        <h2 className="text-2xl font-[family-name:var(--font-heading)] font-bold uppercase text-[var(--color-gold-500)] tracking-widest mb-4">
          Location Not Found
        </h2>
        <p className="text-gray-400 mb-10 font-[family-name:var(--font-body)] text-lg">
          The tactical map does not have coordinates for this sector. The page you are looking for has been moved or does not exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
          <Link href="/" className="w-full">
            <Button 
              variant="primary"
              className="w-full h-12"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Base
            </Button>
          </Link>
          
          <Link href="/tournaments" className="w-full">
            <Button 
              variant="ghost"
              className="w-full h-12 border border-white/10 hover:bg-white/5"
            >
              Tournaments <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
