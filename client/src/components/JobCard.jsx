import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, Calendar, Bookmark, CheckCircle2, Flame, Award, ArrowUpRight, Sparkles, Building2 } from 'lucide-react';
import { jobApi } from '../services/api';

export default function JobCard({ job, onSaveToggle, isSaved: initialIsSaved }) {
  const navigate = useNavigate();
  const [saved, setSaved] = React.useState(initialIsSaved || job?.is_saved || false);
  const [saveLoading, setSaveLoading] = React.useState(false);

  // Sync state if job prop updates
  React.useEffect(() => {
    if (job?.is_saved !== undefined) {
      setSaved(job.is_saved);
    }
  }, [job?.is_saved]);

  const handleSaveClick = async (e) => {
    e.stopPropagation();
    try {
      setSaveLoading(true);
      const res = await jobApi.toggleSave(job.id);
      setSaved(res.is_saved);
      if (onSaveToggle) onSaveToggle(job.id, res.is_saved);
    } catch (err) {
      console.error('Save toggle error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const isNew = job.posted_at && (Date.now() - new Date(job.posted_at).getTime()) < 3 * 86400000;
  const isGovt = job.category === 'Government';
  const isInternship = job.category === 'Internships';

  const deadlineFormatted = job.application_deadline
    ? new Date(job.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : 'Open';

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="group bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer relative flex flex-col justify-between active:scale-[0.99] overflow-hidden"
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={job.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'}
                alt={job.company}
                className="w-11 h-11 rounded-lg object-cover border border-slate-200 shadow-2xs bg-slate-50"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-sm leading-snug truncate group-hover:text-[#FF6B00] transition-colors">
                  {job.title}
                </h3>
                {job.verified === 1 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-orange-50 text-[#FF6B00] px-1.5 py-0.5 rounded border border-orange-200/60">
                    <CheckCircle2 size={11} className="text-[#FF6B00]" /> VERIFIED
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-600 mt-0.5 truncate flex items-center gap-1.5">
                <span>{job.company}</span>
                {isGovt && <span className="text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.2 rounded uppercase">GOVT</span>}
              </p>
            </div>
          </div>

          {/* Action Buttons Header */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isNew && (
              <span className="bg-slate-900 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                <Flame size={11} className="text-orange-400" /> NEW
              </span>
            )}
            <button
              onClick={handleSaveClick}
              disabled={saveLoading}
              aria-label="Save Job"
              className={`p-2 rounded-xl btn-tactile transition-all duration-200 ${
                saved
                  ? 'bg-orange-50 text-[#FF6B00] border border-orange-200 scale-105'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bookmark size={18} fill={saved ? '#FF6B00' : 'none'} />
            </button>
          </div>
        </div>

        {/* Details Grid / Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700 my-3">
          <span className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-3 py-1 rounded-xl font-semibold border border-slate-200/60 group-hover:bg-slate-100 transition-colors">
            <MapPin size={13} className="text-slate-500" /> {job.location}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-3 py-1 rounded-xl font-semibold border border-slate-200/60 group-hover:bg-slate-100 transition-colors">
            <Briefcase size={13} className="text-slate-500" /> {job.type}
          </span>
          {job.work_mode && (
            <span className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-3 py-1 rounded-xl font-semibold border border-slate-200/60 group-hover:bg-slate-100 transition-colors">
              {job.work_mode}
            </span>
          )}
          {job.experience && (
            <span className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-3 py-1 rounded-xl font-semibold border border-slate-200/60 group-hover:bg-slate-100 transition-colors">
              <Award size={13} className="text-slate-500" /> {job.experience}
            </span>
          )}
        </div>
      </div>

      {/* Highlighted Compensation & Deadline Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs mt-3">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            {isInternship ? 'Stipend' : 'Compensation'}
          </span>
          <span className="font-extrabold text-[#FF6B00] text-sm tracking-tight block">
            {job.salary || job.stipend || 'As per norms'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Deadline</span>
            <span className="font-bold text-slate-800 flex items-center justify-end gap-1">
              <Calendar size={12} className="text-[#FF6B00]" /> {deadlineFormatted}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6B00] group-hover:bg-[#FF6B00] group-hover:text-white group-hover:scale-110 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center">
            <ArrowUpRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

