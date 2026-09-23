import React, { useState } from 'react';
import { X, Copy, Check, Share2, Send } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, job }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !job) return null;

  const shareUrl = `${window.location.origin}/jobs/${job.id}`;
  const shareText = `JOB NOTIFICATION: ${job.title} at ${job.company}\nLocation: ${job.location} | Type: ${job.type} | Salary: ${job.salary || job.stipend || 'As per norms'}\nApply Deadline: ${new Date(job.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}\nOfficial Portal Link: ${shareUrl}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${job.title} - ${job.company}`,
          text: shareText,
          url: shareUrl
        });
        onClose();
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up border border-slate-200/90">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-orange-50 text-[#FF6B00]">
              <Share2 size={18} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Share Opportunity</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
          {shareText}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 border border-slate-300 font-extrabold text-slate-800 rounded-2xl hover:bg-slate-50 flex items-center justify-center gap-2 text-xs transition-colors"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>

          <button
            onClick={handleNativeShare}
            className="flex-1 py-3 bg-gradient-to-r from-[#FF6B00] via-[#FF7A00] to-[#FF8500] hover:shadow-md text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 text-xs transition-all"
          >
            <Send size={16} /> Share via Apps
          </button>
        </div>
      </div>
    </div>
  );
}

