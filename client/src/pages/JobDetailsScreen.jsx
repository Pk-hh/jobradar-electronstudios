import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Briefcase, Calendar, Award, CheckCircle2, Bookmark,
  Share2, AlertTriangle, ExternalLink, Users, Building, FileText, Check, DollarSign, Sparkles, ShieldCheck, Table
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { DetailSkeleton } from '../components/SkeletonLoader';
import ShareModal from '../components/ShareModal';
import ReportModal from '../components/ReportModal';

export default function JobDetailsScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [appStatus, setAppStatus] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAtEnd, setIsAtEnd] = useState(false);

  useEffect(() => {
    let ticking = false;

    const checkScrollPosition = () => {
      const currentScrollY = Math.max(0, window.scrollY);
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // Show action bar ONLY when scrolled near the end of the page (within 250px of bottom), or if content is short
      const isShortPage = scrollHeight <= clientHeight + 100;
      const reachedEnd = currentScrollY + clientHeight >= scrollHeight - 250;

      if (isShortPage || reachedEnd) {
        setIsAtEnd(true);
      } else {
        setIsAtEnd(false);
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkScrollPosition);
        ticking = true;
      }
    };

    checkScrollPosition();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [job]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await firebaseService.getJobDetails(id);
        setJob(res.job);
        setIsSaved(res.job ? res.job.is_saved : false);
        setAppStatus(res.job ? res.job.user_application_status : null);
      } catch (err) {
        console.error('Fetch job details error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleSaveToggle = async () => {
    try {
      const res = await firebaseService.toggleSave(id);
      setIsSaved(res.is_saved);
    } catch (e) {}
  };

  const handleApplyClick = () => {
    if (!job || !job.application_url) return;
    firebaseService.logApplyClick(job.id).catch(() => {});
    window.open(job.application_url, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <DetailSkeleton />;

  if (!job) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="font-extrabold text-slate-900 text-lg">Job Notification Not Found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-gradient-to-r from-[#FF6B00] to-[#FF8500] text-white font-extrabold text-xs rounded-xl shadow-md"
        >
          Return to Home Directory
        </button>
      </div>
    );
  }

  const isExpired = job.application_deadline ? new Date(job.application_deadline) < new Date() : false;
  const deadlineDate = job.application_deadline
    ? new Date(job.application_deadline).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null;

  // Check which quick info cards are present
  const hasSalary = Boolean(job.salary?.trim() || job.stipend?.trim());
  const hasExperience = Boolean(job.experience?.trim());
  const hasType = Boolean(job.type?.trim());
  const hasDeadline = Boolean(job.application_deadline?.trim() && deadlineDate);

  // Check if eligibility section has any present fields
  const hasQualification = Boolean(job.qualification?.trim());
  const hasBranch = Boolean(job.branch?.trim());
  const hasEligibility = Boolean(job.eligibility?.trim());
  const hasVacancies = Boolean(job.vacancies && parseInt(job.vacancies) > 0);
  const showEligibilitySection = hasQualification || hasBranch || hasEligibility || hasVacancies;

  // Check technical skills
  const skillsArray = Array.isArray(job.skills)
    ? job.skills.filter(s => typeof s === 'string' && s.trim() !== '')
    : typeof job.skills === 'string'
    ? job.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const showSkillsSection = skillsArray.length > 0;

  // Check description and selection process
  const showDescription = Boolean(job.description?.trim());
  const showSelectionProcess = Boolean(job.selection_process?.trim());

  // Check custom key-value fields (columns)
  const validCustomFields = Array.isArray(job.custom_fields)
    ? job.custom_fields.filter(f => f && f.label && String(f.label).trim() !== '' && f.value && String(f.value).trim() !== '')
    : [];
  const showCustomFields = validCustomFields.length > 0;

  // Check multiple custom tables (or fallback single custom_table)
  let displayTables = [];
  if (Array.isArray(job.custom_tables) && job.custom_tables.length > 0) {
    displayTables = job.custom_tables;
  } else if (job.custom_table) {
    displayTables = [job.custom_table];
  }

  const validTables = displayTables.filter(tbl => {
    return (
      tbl &&
      (
        (Array.isArray(tbl.headers) && tbl.headers.some(h => h !== undefined && h !== null && String(h).trim() !== '')) ||
        (Array.isArray(tbl.rows) && tbl.rows.some(r => Array.isArray(r) && r.some(c => c !== undefined && c !== null && String(c).trim() !== ''))) ||
        (tbl.title && String(tbl.title).trim() !== '')
      )
    );
  });
  const showCustomTables = validTables.length > 0;

  // Check verification section
  const hasSource = Boolean(job.source?.trim());
  const hasPdfUrl = Boolean(job.official_notification_url?.trim());
  const showVerificationSection = hasSource || hasPdfUrl;

  return (
    <div className="pb-48 sm:pb-52 space-y-5 bg-slate-50 min-h-screen w-full">
      {/* Top Glass Header Bar */}
      <div className="bg-[#09090B]/95 backdrop-blur-xl text-white p-3.5 sm:p-4 sticky top-[57px] md:top-[61px] z-20 shadow-lg border-b border-white/10 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="font-extrabold text-sm text-slate-200 truncate max-w-[220px]">{job.company}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={() => setIsReportOpen(true)}
            className="p-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all"
          >
            <AlertTriangle size={18} />
          </button>
        </div>
      </div>

      {/* Main Company Card Header */}
      <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-12 bg-white rounded-3xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-200/90 space-y-4 relative overflow-hidden">
        <div className="flex items-start gap-4">
          {job.logo ? (
            <img
              src={job.logo}
              alt={job.company}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200/80 shadow-xs bg-slate-50 flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#FF6B00] text-white font-extrabold text-2xl flex items-center justify-center shadow-xs flex-shrink-0">
              {job.company ? job.company.charAt(0).toUpperCase() : 'J'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-extrabold text-slate-900 text-xl sm:text-2xl leading-tight tracking-tight">{job.title}</h1>
              {job.verified === 1 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 text-[#FF6B00] px-2.5 py-0.5 rounded-md border border-orange-200/80 shadow-2xs">
                  <CheckCircle2 size={11} className="text-[#FF6B00]" /> VERIFIED
                </span>
              )}
            </div>
            {job.company && <p className="text-sm font-extrabold text-slate-700 mt-1">{job.company}</p>}
            {(job.location || job.work_mode) && (
              <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-[#FF6B00]" />
                {[job.location, job.work_mode ? `(${job.work_mode})` : null].filter(Boolean).join(' ')}
              </p>
            )}
          </div>
        </div>

        {isExpired && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-extrabold p-3 rounded-2xl flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
            <span>Application Deadline Expired on {deadlineDate}</span>
          </div>
        )}
      </div>

      {/* Quick Info Grid (ONLY SHOWING NON-EMPTY FIELDS) */}
      {(hasSalary || hasExperience || hasType || hasDeadline) && (
        <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {hasSalary && (
            <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/40 p-4 rounded-2xl border border-orange-200/70 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Compensation</span>
              <span className="font-black text-[#FF6B00] text-sm block truncate">
                {job.salary || job.stipend}
              </span>
            </div>
          )}

          {hasExperience && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Experience</span>
              <span className="font-extrabold text-slate-900 text-xs block truncate">{job.experience}</span>
            </div>
          )}

          {hasType && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Job Type</span>
              <span className="font-extrabold text-slate-900 text-xs block truncate">{job.type}</span>
            </div>
          )}

          {hasDeadline && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Deadline</span>
              <span className="font-extrabold text-slate-900 text-xs block truncate">{deadlineDate}</span>
            </div>
          )}
        </div>
      )}

      {/* Structured Details Sections */}
      {(showEligibilitySection || showSkillsSection || showDescription || showSelectionProcess || showCustomFields || showCustomTables || showVerificationSection) && (
        <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-12 bg-white rounded-3xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-200/90 space-y-6 text-xs text-slate-800">
          {/* Section: Qualification & Eligibility */}
          {showEligibilitySection && (
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
                <Award size={16} /> Eligibility & Criteria
              </h3>
              <div className="space-y-2 text-xs font-medium text-slate-700">
                {hasQualification && <p><span className="font-bold text-slate-900">Qualification:</span> {job.qualification}</p>}
                {hasBranch && <p><span className="font-bold text-slate-900">Branch / Stream:</span> {job.branch}</p>}
                {hasEligibility && <p><span className="font-bold text-slate-900">Detailed Criteria:</span> {job.eligibility}</p>}
                {hasVacancies && <p><span className="font-bold text-slate-900">Open Vacancies:</span> {job.vacancies} Posts</p>}
              </div>
            </div>
          )}

          {/* Section: Custom Extra Key-Value Fields / Specifications (Age Limit, Application Fee, Bond, etc.) */}
          {showCustomFields && (
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
                <Sparkles size={16} /> Additional Specifications & Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {validCustomFields.map((f, idx) => (
                  <div key={idx} className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">{f.label}</span>
                    <span className="font-bold text-slate-800 text-xs block leading-relaxed whitespace-pre-line">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Multiple Custom Detail Tables (Syllabus, Vacancies Breakdown, Exam Pattern, Pay Scale, etc.) */}
          {validTables.map((table, tIdx) => (
            <div key={table.id || tIdx} className="space-y-3 pb-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
                <Table size={16} /> {table.title || `Notification Table Details #${tIdx + 1}`}
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      {table.headers.map((h, idx) => (
                        <th key={idx} className="p-3 font-extrabold uppercase tracking-wider text-[11px] whitespace-nowrap border-b border-slate-800">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {table.rows.map((row, rIdx) => {
                      if (!Array.isArray(row) || row.every(c => !c || String(c).trim() === '')) return null;
                      return (
                        <tr key={rIdx} className="odd:bg-slate-50/60 even:bg-white hover:bg-orange-50/30 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 font-medium text-slate-700 whitespace-pre-line align-top">
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Section: Required Skills */}
          {showSkillsSection && (
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
                <Sparkles size={16} /> Required Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillsArray.map((skill, i) => (
                  <span key={i} className="bg-orange-50 text-[#FF6B00] border border-orange-200/80 font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section: Job Description */}
          {showDescription && (
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
                <FileText size={16} /> Job Description & Context
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-xs font-medium">{job.description}</p>
            </div>
          )}

          {/* Section: Selection Process */}
          {showSelectionProcess && (
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
                <CheckCircle2 size={16} /> Selection Process
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 font-medium">
                {job.selection_process}
              </p>
            </div>
          )}

          {/* Section: Official Links & Source */}
          {showVerificationSection && (
            <div className="space-y-3 pt-1">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
                <ShieldCheck size={16} /> Verification & Source
              </h3>
              {hasSource && (
                <p className="text-xs text-slate-600 font-medium">
                  <span className="font-bold text-slate-900">Source Provider:</span> {job.source}
                </p>
              )}
              {hasPdfUrl && (
                <a
                  href={job.official_notification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline pt-1"
                >
                  <FileText size={15} /> View Official Notification Advertisement PDF / Page
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Modern Action Pod (Revealed ONLY at the end of scroll) */}
      <div
        className={`fixed bottom-[72px] md:bottom-6 left-3 right-3 md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:w-full z-30 transform-gpu transition-all duration-500 ease-out will-change-transform ${
          isAtEnd
            ? 'translate-y-0 opacity-100 pointer-events-auto shadow-2xl'
            : 'translate-y-[250%] opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-[0_12px_35px_-5px_rgba(0,0,0,0.4)] flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={handleSaveToggle}
            className={`px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all duration-200 btn-tactile border ${
              isSaved
                ? 'bg-orange-500/15 text-[#FF6B00] border-orange-500/40 shadow-xs'
                : 'bg-slate-800/90 text-slate-300 hover:text-white border-slate-700/70 hover:bg-slate-700/80'
            }`}
          >
            <Bookmark size={17} fill={isSaved ? '#FF6B00' : 'none'} className={isSaved ? 'text-[#FF6B00]' : 'text-slate-400'} />
            <span className="tracking-wide">{isSaved ? 'SAVED' : 'SAVE'}</span>
          </button>

          <button
            onClick={handleApplyClick}
            disabled={isExpired || !job.application_url}
            className={`flex-1 py-3 sm:py-3.5 px-5 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 btn-tactile shadow-lg ${
              isExpired || !job.application_url
                ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FF6B00] via-[#FF7A00] to-[#FF8500] hover:from-[#E05E00] hover:to-[#FF6B00] shadow-orange-500/25 active:scale-[0.98]'
            }`}
          >
            <span className="tracking-wider">{isExpired ? 'DEADLINE EXPIRED' : 'APPLY NOW'}</span>
            {!isExpired && job.application_url && <ExternalLink size={16} className="text-white flex-shrink-0" />}
          </button>
        </div>
      </div>

      {/* Share & Report Modals */}
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} job={job} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} jobId={job.id} jobTitle={job.title} />
    </div>
  );
}
