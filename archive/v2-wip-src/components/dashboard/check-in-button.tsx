"use client";

import { useState, useEffect } from "react";
import { Timer, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckInButtonProps {
  tournamentStartTime: string;
  isRegistered: boolean;
}

export function CheckInButton({ tournamentStartTime, isRegistered }: CheckInButtonProps) {
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // Basic logic to determine if we are within the 1-hour check-in window
    const checkTime = () => {
      const start = new Date(tournamentStartTime).getTime();
      const now = new Date().getTime();
      const diff = start - now;
      
      const oneHour = 60 * 60 * 1000;
      
      if (diff > 0 && diff <= oneHour) {
        setCanCheckIn(true);
        const mins = Math.floor(diff / (1000 * 60));
        setTimeLeft(`${mins}m remaining`);
      } else if (diff <= 0) {
        setCanCheckIn(false);
        setTimeLeft("Tournament started");
      } else {
        setCanCheckIn(false);
        setTimeLeft("Check-in opens 1h before start");
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [tournamentStartTime]);

  if (!isRegistered) return null;

  if (isCheckedIn) {
    return (
      <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Checked In Successfully</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button 
        variant="primary" 
        disabled={!canCheckIn}
        onClick={() => setIsCheckedIn(true)}
        className="w-full relative overflow-hidden group"
      >
        <span className="relative z-10 flex items-center justify-center">
          <Timer className="w-4 h-4 mr-2" />
          {canCheckIn ? "Check-In Now" : "Check-In Disabled"}
        </span>
        {canCheckIn && (
          <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
        )}
      </Button>
      
      <div className="flex justify-between items-center text-xs">
        <span className={canCheckIn ? "text-yellow-500 font-medium flex items-center" : "text-ze-neutral-500"}>
          {canCheckIn && <AlertTriangle className="w-3 h-3 mr-1" />}
          {timeLeft}
        </span>
        <span className="text-ze-neutral-500">Auto-drop if missed</span>
      </div>
    </div>
  );
}
