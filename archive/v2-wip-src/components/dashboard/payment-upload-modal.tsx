"use client";

import { useState } from "react";
import { Upload, X, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaymentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentName: string;
  amount: string;
}

export function PaymentUploadModal({ isOpen, onClose, tournamentName, amount }: PaymentUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    // Mock Supabase storage upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUploading(false);
    setIsSuccess(true);
    
    // Reset and close after a delay
    setTimeout(() => {
      setIsSuccess(false);
      setFile(null);
      onClose();
    }, 2000);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Upload Payment Proof">
      <div className="space-y-6">
        
        <div className="bg-ze-neutral-950 p-4 rounded-lg border border-ze-neutral-800 flex justify-between items-center">
          <div>
            <p className="text-xs font-mono text-ze-neutral-500 uppercase mb-1">Tournament</p>
            <p className="text-sm text-white font-medium">{tournamentName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-ze-neutral-500 uppercase mb-1">Amount Due</p>
            <p className="text-lg font-heading font-bold text-ze-gold-400">{amount}</p>
          </div>
        </div>

        {!isSuccess ? (
          <div className="space-y-4">
            <div className="text-sm text-ze-neutral-300">
              Please transfer <strong className="text-white">{amount}</strong> to our official JazzCash/Easypaisa account (0300-1234567) and upload the screenshot here.
            </div>

            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors relative",
                file ? "border-ze-gold-500 bg-ze-gold-500/5" : "border-ze-neutral-800 hover:border-ze-neutral-700 bg-ze-neutral-900/50 hover:bg-ze-neutral-900"
              )}
            >
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              
              {file ? (
                <>
                  <ImageIcon className="w-8 h-8 text-ze-gold-500 mb-3" />
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-ze-neutral-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-ze-neutral-500 mb-3" />
                  <p className="text-sm font-medium text-white">Click or drag image to upload</p>
                  <p className="text-xs text-ze-neutral-500 mt-1">JPEG, PNG up to 5MB</p>
                </>
              )}
            </div>

            <Button 
              variant="primary" 
              className="w-full" 
              disabled={!file}
              loading={isUploading}
              onClick={handleUpload}
            >
              {isUploading ? "Uploading..." : "Submit Payment Proof"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">Proof Uploaded Successfully</h3>
            <p className="text-sm text-ze-neutral-400 max-w-[280px]">
              Our admin team will verify the transaction and approve your slot shortly.
            </p>
          </div>
        )}

      </div>
    </Modal>
  );
}
