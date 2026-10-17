"use client";

import { Search, Mail, MailOpen, MoreVertical, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_ENQUIRIES = [
  {
    id: "enq_1",
    name: "John Doe",
    company: "Acme Esports",
    email: "john@example.com",
    status: "new",
    submittedAt: "2026-09-18T12:00:00Z",
    hasAttachment: true,
  },
  {
    id: "enq_2",
    name: "Sarah Smith",
    company: "Global Brands Inc.",
    email: "sarah.smith@global.com",
    status: "read",
    submittedAt: "2026-09-17T09:30:00Z",
    hasAttachment: false,
  },
  {
    id: "enq_3",
    name: "Ahmed Khan",
    company: "Freelance",
    email: "ahmed@example.pk",
    status: "replied",
    submittedAt: "2026-09-15T16:45:00Z",
    hasAttachment: true,
  }
];

export default function AdminEnquiriesPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Production Enquiries</h1>
          <p className="text-sm text-ze-neutral-400">Manage incoming requests for Mark47 services.</p>
        </div>
        
        <div className="flex items-center bg-ze-neutral-900 border border-ze-neutral-800 rounded-md px-3 py-1.5 w-full md:w-64 focus-within:border-ze-gold-500 transition-colors">
          <Search className="w-4 h-4 text-ze-neutral-500 mr-2" />
          <input 
            type="text" 
            placeholder="Search enquiries..." 
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-ze-neutral-600"
          />
        </div>
      </div>

      <div className="bg-ze-neutral-900 border border-ze-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-ze-neutral-950 border-b border-ze-neutral-800 text-xs uppercase font-mono text-ze-neutral-500">
                <th className="py-4 px-6 font-medium">Contact</th>
                <th className="py-4 px-6 font-medium">Company</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Date</th>
                <th className="py-4 px-6 font-medium">Attachment</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ENQUIRIES.map((enq) => (
                <tr key={enq.id} className="border-b border-ze-neutral-800/50 hover:bg-ze-neutral-800/20 transition-colors">
                  <td className="py-4 px-6">
                    <div className="text-sm text-white font-medium">{enq.name}</div>
                    <div className="text-xs text-ze-neutral-400">{enq.email}</div>
                  </td>
                  <td className="py-4 px-6 text-sm text-ze-neutral-300">{enq.company || "-"}</td>
                  <td className="py-4 px-6 text-sm">
                    {enq.status === 'new' && (
                      <span className="flex items-center text-ze-gold-400 bg-ze-gold-400/10 px-2.5 py-1 rounded-full text-xs font-medium w-fit">
                        <Mail className="w-3 h-3 mr-1.5" /> New
                      </span>
                    )}
                    {enq.status === 'read' && (
                      <span className="flex items-center text-ze-neutral-400 bg-ze-neutral-400/10 px-2.5 py-1 rounded-full text-xs font-medium w-fit">
                        <MailOpen className="w-3 h-3 mr-1.5" /> Read
                      </span>
                    )}
                    {enq.status === 'replied' && (
                      <span className="flex items-center text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full text-xs font-medium w-fit">
                        <MailOpen className="w-3 h-3 mr-1.5" /> Replied
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-ze-neutral-400">
                    {new Date(enq.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    {enq.hasAttachment ? (
                      <span className="text-ze-gold-400 text-xs border border-ze-gold-500/30 px-2 py-1 rounded">Yes</span>
                    ) : (
                      <span className="text-ze-neutral-600 text-xs">No</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-ze-neutral-300 hover:text-white bg-ze-neutral-800/50 hover:bg-ze-neutral-700">
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 text-ze-neutral-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
