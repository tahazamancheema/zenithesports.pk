"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithDiscord, signInWithEmail } from "@/server/actions/auth";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2 } from "lucide-react";

export function AuthModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("login") === "true";
  
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeModal = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("login");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signInWithEmail(email);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || "Failed to send login link.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithDiscord();
    } catch (err) {
      setError("Failed to initialize Discord login.");
      setIsLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={closeModal} title="Access Portal">
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <p className="text-sm text-ze-neutral-400">
            Sign in to register for tournaments, manage your team, and access the Zenith ecosystem.
          </p>
        </div>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center p-6 bg-ze-gold-500/10 border border-ze-gold-500/20 rounded-lg text-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-ze-gold-500" />
            <div>
              <h3 className="text-lg font-heading font-semibold text-white">Check your email</h3>
              <p className="text-sm text-ze-neutral-300 mt-1">
                We've sent a magic link to <span className="font-mono text-ze-gold-400">{email}</span>
              </p>
            </div>
            <Button variant="ghost" onClick={closeModal} className="mt-2 text-ze-gold-400 hover:text-ze-gold-300">
              Close
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-2 rounded">
                  {error}
                </p>
              )}

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full"
                loading={isLoading}
              >
                <Mail className="w-4 h-4 mr-2" />
                Continue with Email
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-ze-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-mono">
                <span className="bg-ze-neutral-900 px-2 text-ze-neutral-500">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white border-transparent"
              onClick={handleDiscordSignIn}
              disabled={isLoading}
            >
              <svg 
                role="img" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5 mr-2 fill-current"
              >
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
              </svg>
              Discord
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
