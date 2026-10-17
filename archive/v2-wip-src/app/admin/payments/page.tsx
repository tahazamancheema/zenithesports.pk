"use client";

import { useState } from "react";
import { Search, Filter, Check, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

const MOCK_PAYMENTS = [
  {
    id: "pay_1",
    teamName: "Team Falcons",
    tournamentName: "PUBGM Pro League",
    amount: "PKR 1,500",
    method: "JazzCash",
    status: "pending_verification",
    submittedAt: "2026-09-18T10:30:00Z",
    proofUrl: "/assets/placeholders/payment-proof.jpg"
  },
  {
    id: "pay_2",
    teamName: "Sentinels",
    tournamentName: "Valorant Invitational",
    amount: "PKR 2,000",
    method: "Easypaisa",
    status: "verified",
    submittedAt: "2026-09-18T09:15:00Z",
    proofUrl: "/assets/placeholders/payment-proof.jpg"
  },
  {
    id: "pay_3",
    teamName: "Reject",
    tournamentName: "Free Fire Clash",
    amount: "PKR 1,000",
    method: "Bank Transfer",
    status: "rejected",
    submittedAt: "2026-09-17T14:20:00Z",
    proofUrl: "/assets/placeholders/payment-proof.jpg"
  }
];

export default function AdminPaymentsPage() {
  const [selectedPayment, setSelectedPayment] = useState<typeof MOCK_PAYMENTS[0] | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Payment Verification</h1>
          <p className="text-sm text-ze-neutral-400">Review and approve tournament entry fee payments.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" className="bg-ze-neutral-900 border border-ze-neutral-800 text-ze-neutral-300">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="bg-ze-neutral-900 border border-ze-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-ze-neutral-950 border-b border-ze-neutral-800 text-xs uppercase font-mono text-ze-neutral-500">
                <th className="py-4 px-6 font-medium">Team</th>
                <th className="py-4 px-6 font-medium">Tournament</th>
                <th className="py-4 px-6 font-medium">Method</th>
                <th className="py-4 px-6 font-medium">Amount</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PAYMENTS.map((payment) => (
                <tr key={payment.id} className="border-b border-ze-neutral-800/50 hover:bg-ze-neutral-800/20 transition-colors">
                  <td className="py-4 px-6 text-sm text-white font-medium">{payment.teamName}</td>
                  <td className="py-4 px-6 text-sm text-ze-neutral-300">{payment.tournamentName}</td>
                  <td className="py-4 px-6 text-sm text-ze-neutral-300">{payment.method}</td>
                  <td className="py-4 px-6 text-sm font-mono text-ze-gold-400">{payment.amount}</td>
                  <td className="py-4 px-6 text-sm">
                    {payment.status === 'pending_verification' && <span className="text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full text-xs font-medium">Pending</span>}
                    {payment.status === 'verified' && <span className="text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full text-xs font-medium">Verified</span>}
                    {payment.status === 'rejected' && <span className="text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full text-xs font-medium">Rejected</span>}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedPayment(payment)}
                      className="text-ze-neutral-300 hover:text-white bg-ze-neutral-800/50 hover:bg-ze-neutral-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Review Modal */}
      <Modal 
        open={!!selectedPayment} 
        onClose={() => setSelectedPayment(null)}
        title="Payment Review"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-ze-neutral-950 p-4 rounded-lg border border-ze-neutral-800">
                <span className="text-xs font-mono text-ze-neutral-500 uppercase block mb-1">Team</span>
                <span className="text-white font-medium">{selectedPayment.teamName}</span>
              </div>
              <div className="bg-ze-neutral-950 p-4 rounded-lg border border-ze-neutral-800">
                <span className="text-xs font-mono text-ze-neutral-500 uppercase block mb-1">Amount Claimed</span>
                <span className="text-ze-gold-400 font-mono font-bold text-lg">{selectedPayment.amount}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-mono text-ze-neutral-500 uppercase block mb-2">Proof of Payment</span>
              <div className="aspect-video w-full bg-ze-neutral-950 rounded-lg border border-ze-neutral-800 flex items-center justify-center overflow-hidden">
                {/* Normally an actual Image tag here */}
                <span className="text-ze-neutral-600 font-mono text-sm">Screenshot Placeholder</span>
              </div>
            </div>

            {selectedPayment.status === 'pending_verification' && (
              <div className="flex gap-4 pt-4 border-t border-ze-neutral-800">
                <Button 
                  variant="ghost" 
                  className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                  onClick={() => setSelectedPayment(null)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 bg-green-500 hover:bg-green-600 text-green-950 border-none"
                  onClick={() => setSelectedPayment(null)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Verify & Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
