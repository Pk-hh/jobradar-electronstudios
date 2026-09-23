import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, Calendar, Bookmark, CheckCircle2, Flame, Award, ArrowUpRight, Sparkles, Building2 } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';

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
      const res = await firebaseService.toggleSave(job.id);
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
      className="group bg-white rounded-xl border border-slate-200/90 p-4 sm:p-4.5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer relative flex flex-col justify-between active:scale-[0.99] overflow-hidden"
    >
      <div className="space-y-3">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <img
              src={job.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'}
              alt={job.company}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover border border-slate-200 shadow-2xs bg-slate-50 flex-shrink-0"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80';
              }}
            />

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-[#FF6B00] transition-colors break-words">
                  {job.title}
                </h3>
                {Boolean(job.verified) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-50 text-[#FF6B00] px-1.5 py-0.5 rounded border border-orange-200/60 whitespace-nowrap">
                    <CheckCircle2 size={11} className="text-[#FF6B00]" /> VERIFIED
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-600 truncate flex items-center gap-1.5">
                <span className="truncate">{job.company}</span>
                {isGovt && <span className="text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.2 rounded uppercase flex-shrink-0">GOVT</span>}
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
              className={`p-1.5 sm:p-2 rounded-xl btn-tactile transition-all duration-200 ${
                saved
                  ? 'bg-orange-50 text-[#FF6B00] border border-orange-200 scale-105'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bookmark size={17} fill={saved ? '#FF6B00' : 'none'} />
            </button>
          </div>
        </div>

        {/* Details Grid / Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700 pt-0.5">
          {job.location && (
            <span className="inline-flex items-center gap-1 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg font-semibold border border-slate-200/60 max-w-full">
              <MapPin size={12} className="text-slate-500 flex-shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-none">{job.location}</span>
            </span>
          )}
          {job.type && (
            <span className="inline-flex items-center gap-1 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg font-semibold border border-slate-200/60 max-w-full">
              <Briefcase size={12} className="text-slate-500 flex-shrink-0" />
              <span className="truncate max-w-[110px] sm:max-w-none">{job.type}</span>
            </span>
          )}
          {job.work_mode && (
            <span className="inline-flex items-center gap-1 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg font-semibold border border-slate-200/60 max-w-full">
              <span className="truncate max-w-[100px] sm:max-w-none">{job.work_mode}</span>
            </span>
          )}
          {job.experience && (
            <span className="inline-flex items-center gap-1 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg font-semibold border border-slate-200/60 max-w-full">
              <Award size={12} className="text-slate-500 flex-shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-none">{job.experience}</span>
            </span>
          )}
        </div>
      </div>

      {/* Highlighted Compensation & Deadline Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs mt-3 gap-2 min-w-0">
        <div className="min-w-0 flex-1 pr-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            {isInternship ? 'Stipend' : 'Compensation'}
          </span>
          <span className="font-extrabold text-[#FF6B00] text-xs sm:text-sm tracking-tight block truncate">
            {job.salary || job.stipend || 'Not Specified'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Deadline</span>
            <span className="font-bold text-slate-800 flex items-center justify-end gap-1 whitespace-nowrap text-[11px] sm:text-xs">
              <Calendar size={12} className="text-[#FF6B00]" /> {deadlineFormatted}
            </span>
          </div>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-50 text-[#FF6B00] group-hover:bg-[#FF6B00] group-hover:text-white group-hover:scale-110 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center flex-shrink-0">
            <ArrowUpRight size={15} />
          </div>
        </div>
      </div>
    </div>
  );
}

