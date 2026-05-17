import React from 'react';
import { X } from 'lucide-react';

const WA_LINK = 'https://chat.whatsapp.com/GdcuGDXDTF833A6Y96INRQ';

export default function WhatsAppModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#0e0e0e] border border-[rgba(78,70,56,0.3)] relative overflow-hidden animate-page-enter">
        {/* Green top accent */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#25D366] to-transparent" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#d1c5b3] opacity-30 hover:opacity-80 transition-opacity"
        >
          <X size={16} />
        </button>

        <div className="px-8 pt-10 pb-4 text-center">
          {/* WhatsApp icon — inline SVG so no extra dep */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center">
            <svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M16 2C8.268 2 2 8.268 2 16c0 2.47.664 4.785 1.824 6.777L2 30l7.43-1.788A13.934 13.934 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.46 11.46 0 01-5.87-1.617l-.42-.25-4.41 1.06 1.092-4.29-.274-.44A11.46 11.46 0 014.5 16C4.5 9.649 9.649 4.5 16 4.5S27.5 9.649 27.5 16 22.351 27.5 16 27.5zm6.22-8.588c-.34-.17-2.01-.99-2.322-1.103-.312-.114-.539-.17-.766.17-.228.34-.882 1.103-1.08 1.33-.2.228-.397.256-.737.086-.34-.17-1.436-.53-2.734-1.688-1.01-.9-1.692-2.012-1.89-2.352-.198-.34-.021-.524.149-.693.152-.152.34-.397.51-.596.17-.2.226-.34.34-.567.113-.228.057-.427-.029-.596-.085-.17-.766-1.845-1.05-2.525-.276-.663-.557-.573-.766-.583l-.652-.011c-.227 0-.596.085-.908.425-.312.34-1.19 1.162-1.19 2.833s1.218 3.286 1.388 3.513c.17.228 2.397 3.657 5.809 5.131.811.35 1.445.558 1.938.715.814.258 1.555.221 2.14.134.653-.097 2.01-.822 2.294-1.615.284-.793.284-1.473.199-1.615-.085-.142-.312-.228-.652-.397z"
                fill="#25D366"
              />
            </svg>
          </div>

          <h2 className="font-bebas text-3xl tracking-widest text-white leading-tight mb-2">
            JOIN THE COMMUNITY
          </h2>
          <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-60 leading-relaxed">
            Get daily updates, scrim schedules, and tournament announcements straight to WhatsApp.
          </p>
        </div>

        <div className="px-8 pb-8 pt-5 space-y-3">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="flex items-center justify-center gap-3 w-full py-3.5 bg-[#25D366] hover:bg-[#1ebe5a] active:bg-[#18b352] transition-colors"
          >
            <svg viewBox="0 0 32 32" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M16 2C8.268 2 2 8.268 2 16c0 2.47.664 4.785 1.824 6.777L2 30l7.43-1.788A13.934 13.934 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.46 11.46 0 01-5.87-1.617l-.42-.25-4.41 1.06 1.092-4.29-.274-.44A11.46 11.46 0 014.5 16C4.5 9.649 9.649 4.5 16 4.5S27.5 9.649 27.5 16 22.351 27.5 16 27.5zm6.22-8.588c-.34-.17-2.01-.99-2.322-1.103-.312-.114-.539-.17-.766.17-.228.34-.882 1.103-1.08 1.33-.2.228-.397.256-.737.086-.34-.17-1.436-.53-2.734-1.688-1.01-.9-1.692-2.012-1.89-2.352-.198-.34-.021-.524.149-.693.152-.152.34-.397.51-.596.17-.2.226-.34.34-.567.113-.228.057-.427-.029-.596-.085-.17-.766-1.845-1.05-2.525-.276-.663-.557-.573-.766-.583l-.652-.011c-.227 0-.596.085-.908.425-.312.34-1.19 1.162-1.19 2.833s1.218 3.286 1.388 3.513c.17.228 2.397 3.657 5.809 5.131.811.35 1.445.558 1.938.715.814.258 1.555.221 2.14.134.653-.097 2.01-.822 2.294-1.615.284-.793.284-1.473.199-1.615-.085-.142-.312-.228-.652-.397z"
                fill="white"
              />
            </svg>
            <span className="font-bebas text-xl tracking-widest text-white">JOIN NOW</span>
          </a>
          <button
            onClick={onClose}
            className="w-full py-2.5 font-teko text-[12px] tracking-widest text-[#d1c5b3] opacity-30 hover:opacity-60 transition-opacity uppercase"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
