import React, { useState } from 'react';
import { X, AlertTriangle, Send, Check } from 'lucide-react';
import { jobApi } from '../services/api';

export default function ReportModal({ isOpen, onClose, jobId, jobTitle }) {
  const [reason, setReason] = useState('Outdated / Closed Job');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await jobApi.reportJob(jobId, reason, details);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up border border-slate-200/90">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-amber-600">
            <div className="p-1.5 rounded-xl bg-amber-50">
              <AlertTriangle size={18} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Report Notice</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-2.5 animate-scale-up">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <Check size={28} className="text-emerald-600" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Report Submitted</h4>
            <p className="text-xs text-slate-500 font-medium">Our moderation team will review this notice within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600 font-medium">
              Help us maintain authentic listings for <span className="font-extrabold text-slate-900">{jobTitle}</span>.
            </p>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold border border-rose-200">
                {error}
              </div>
            )}

            <div>
              <label className="font-extrabold text-slate-900 block mb-1.5">Reason for Report</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl text-xs font-extrabold focus:border-[#FF6B00] focus:outline-none"
              >
                <option value="Outdated / Closed Job">Outdated / Closed Application Link</option>
                <option value="Incorrect Job Details">Incorrect Salary / Job Details</option>
                <option value="Suspected Spam or Fraud">Suspected Spam or Fraud Recruitment</option>
                <option value="Duplicate Listing">Duplicate Opportunity Listing</option>
                <option value="Other">Other Issues</option>
              </select>
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1.5">Additional Notes (Optional)</label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide details about broken link or recruiter issue..."
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl text-xs font-medium focus:border-[#FF6B00] focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 border border-slate-300 font-extrabold text-slate-700 rounded-2xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 bg-gradient-to-r from-[#FF6B00] via-[#FF7A00] to-[#FF8500] hover:shadow-md text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Send size={14} /> {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

