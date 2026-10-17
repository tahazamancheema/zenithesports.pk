"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { CheckCircle2, Shield, Users, Trophy, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, name: "Team Details", icon: Shield },
  { id: 2, name: "Roster", icon: Users },
  { id: 3, name: "Review", icon: CheckCircle2 },
];

export default function TournamentRegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState([
    { inGameName: "", role: "captain" },
    { inGameName: "", role: "player" },
    { inGameName: "", role: "player" },
    { inGameName: "", role: "player" },
    { inGameName: "", role: "player" },
  ]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(s => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    
    // Redirect to dashboard on success
    router.push("/dashboard?success=registered");
  };

  return (
    <main className="min-h-screen pb-24">
      <PageHeader 
        title="REGISTER" 
        subtitle="Secure your slot in the tournament. Registration requires a full roster."
      />

      <div className="container mx-auto px-4 mt-12 max-w-4xl">
        
        {/* Stepper UI */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-ze-neutral-800 -z-10 rounded-full" />
            <div 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-ze-gold-500 -z-10 rounded-full transition-all duration-500" 
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
            
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div 
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 border-2",
                      isActive ? "bg-ze-neutral-900 border-ze-gold-500 text-ze-gold-500" : 
                      isCompleted ? "bg-ze-gold-500 border-ze-gold-500 text-ze-neutral-950" : 
                      "bg-ze-neutral-950 border-ze-neutral-800 text-ze-neutral-500"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "mt-3 text-xs font-heading uppercase tracking-wider",
                    isActive || isCompleted ? "text-white" : "text-ze-neutral-500"
                  )}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Area */}
        <div className="bg-ze-neutral-900/50 border border-ze-neutral-800 rounded-xl p-6 md:p-10 min-h-[400px]">
          
          {/* Step 1: Team Details */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-heading font-bold text-white mb-2">Team Information</h2>
              <p className="text-ze-neutral-400 text-sm mb-6">Create a new team or select an existing one.</p>
              
              <div className="space-y-4 max-w-md">
                <label className="block text-sm font-medium text-ze-neutral-300">Team Name</label>
                <Input 
                  placeholder="e.g. Sentinels, Fnatic" 
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          )}

          {/* Step 2: Roster */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-heading font-bold text-white mb-2">Roster Declaration</h2>
              <p className="text-ze-neutral-400 text-sm mb-6">Enter the Exact In-Game Names (IGN) of your starting 5.</p>
              
              <div className="space-y-4">
                {players.map((player, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-ze-neutral-800 flex items-center justify-center font-mono text-ze-neutral-400 shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <Input 
                        placeholder={`Player ${index + 1} IGN`}
                        value={player.inGameName}
                        onChange={(e) => {
                          const newPlayers = [...players];
                          newPlayers[index].inGameName = e.target.value;
                          setPlayers(newPlayers);
                        }}
                      />
                    </div>
                    <div className="w-24">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded border uppercase font-mono",
                        index === 0 ? "border-ze-gold-500/30 text-ze-gold-400 bg-ze-gold-500/10" : "border-ze-neutral-700 text-ze-neutral-400 bg-ze-neutral-800"
                      )}>
                        {index === 0 ? "Captain" : "Player"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-heading font-bold text-white mb-2">Final Review</h2>
              <p className="text-ze-neutral-400 text-sm mb-6">Review your registration details before confirming your slot.</p>
              
              <div className="bg-ze-neutral-950 border border-ze-neutral-800 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-xs uppercase font-mono text-ze-neutral-500 mb-1">Tournament</h3>
                  <div className="flex items-center text-white font-medium">
                    <Trophy className="w-4 h-4 mr-2 text-ze-gold-500" />
                    Zenith Valorant Invitational
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs uppercase font-mono text-ze-neutral-500 mb-1">Team Name</h3>
                  <div className="text-white font-medium">{teamName || "Not Provided"}</div>
                </div>

                <div>
                  <h3 className="text-xs uppercase font-mono text-ze-neutral-500 mb-2">Starting Roster</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {players.map((player, idx) => (
                      <div key={idx} className="bg-ze-neutral-900 px-3 py-2 rounded border border-ze-neutral-800 flex justify-between">
                        <span className="text-white">{player.inGameName || `Player ${idx+1}`}</span>
                        <span className="text-ze-neutral-500 text-xs">{idx === 0 ? "C" : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="ghost" 
            onClick={handlePrev}
            disabled={currentStep === 1 || isSubmitting}
            className="text-ze-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button 
            variant="primary" 
            onClick={handleNext}
            loading={isSubmitting}
            className="min-w-[140px]"
          >
            {currentStep === STEPS.length ? "Confirm Slot" : "Next Step"}
            {currentStep !== STEPS.length && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>

      </div>
    </main>
  );
}
