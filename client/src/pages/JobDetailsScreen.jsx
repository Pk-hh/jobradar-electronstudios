import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Briefcase, Calendar, Award, CheckCircle2, Bookmark,
  Share2, AlertTriangle, ExternalLink, Users, Building, FileText, Check, DollarSign, Sparkles, ShieldCheck
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
  const [isFooterVisible, setIsFooterVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if (currentScrollY < 30 || currentScrollY + clientHeight >= scrollHeight - 30) {
        setIsFooterVisible(true);
      } else if (currentScrollY > lastScrollY + 5) {
        setIsFooterVisible(false);
      } else if (currentScrollY < lastScrollY - 5) {
        setIsFooterVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    if (!job) return;
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

  const isExpired = new Date(job.application_deadline) < new Date();
  const deadlineDate = new Date(job.application_deadline).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="pb-32 sm:pb-36 space-y-5 bg-slate-50 min-h-screen w-full">
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
          <img
            src={job.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'}
            alt={job.company}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200/80 shadow-xs bg-slate-50 flex-shrink-0"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-extrabold text-slate-900 text-xl sm:text-2xl leading-tight tracking-tight">{job.title}</h1>
              {job.verified === 1 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 text-[#FF6B00] px-2.5 py-0.5 rounded-md border border-orange-200/80 shadow-2xs">
                  <CheckCircle2 size={11} className="text-[#FF6B00]" /> VERIFIED
                </span>
              )}
            </div>
            <p className="text-sm font-extrabold text-slate-700 mt-1">{job.company}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
              <MapPin size={14} className="text-[#FF6B00]" /> {job.location} ({job.work_mode})
            </p>
          </div>
        </div>

        {isExpired && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-extrabold p-3 rounded-2xl flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
            <span>Application Deadline Expired on {deadlineDate}</span>
          </div>
        )}
      </div>

      {/* Quick Info Grid */}
      <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/40 p-4 rounded-2xl border border-orange-200/70 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Compensation</span>
          <span className="font-black text-[#FF6B00] text-sm block truncate">
            {job.salary || job.stipend || 'Not Specified'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Experience</span>
          <span className="font-extrabold text-slate-900 text-xs block truncate">{job.experience || 'Not Specified'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Job Type</span>
          <span className="font-extrabold text-slate-900 text-xs block truncate">{job.type || 'Full Time'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Deadline</span>
          <span className="font-extrabold text-slate-900 text-xs block truncate">{job.application_deadline ? deadlineDate : 'Open'}</span>
        </div>
      </div>

      {/* Structured Details Sections */}
      <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-12 bg-white rounded-3xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-200/90 space-y-6 text-xs text-slate-800">
        {/* Section: Qualification & Eligibility */}
        {(job.qualification || job.branch || job.eligibility || (job.vacancies && job.vacancies > 0)) && (
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
              <Award size={16} /> Eligibility & Criteria
            </h3>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              {job.qualification && <p><span className="font-bold text-slate-900">Qualification:</span> {job.qualification}</p>}
              {job.branch && <p><span className="font-bold text-slate-900">Branch / Stream:</span> {job.branch}</p>}
              {job.eligibility && <p><span className="font-bold text-slate-900">Detailed Criteria:</span> {job.eligibility}</p>}
              {job.vacancies > 0 && <p><span className="font-bold text-slate-900">Open Vacancies:</span> {job.vacancies}</p>}
            </div>
          </div>
        )}

        {/* Section: Required Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
              <Sparkles size={16} /> Required Technical Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, i) => (
                <span key={i} className="bg-orange-50 text-[#FF6B00] border border-orange-200/80 font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section: Job Description */}
        {job.description && (
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
              <FileText size={16} /> Job Description & Context
            </h3>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-xs font-medium">{job.description}</p>
          </div>
        )}

        {/* Section: Selection Process */}
        {job.selection_process && (
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
        <div className="space-y-3 pt-1">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
            <ShieldCheck size={16} /> Verification & Source
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            <span className="font-bold text-slate-900">Source Provider:</span> {job.source || 'Recruiter Direct'}
          </p>
          {job.official_notification_url && (
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
      </div>

      {/* Floating Modern Action Pod */}
      <div
        className={`fixed bottom-16 md:bottom-6 left-3 right-3 md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:w-full z-30 transition-transform duration-300 ease-in-out ${
          isFooterVisible ? 'translate-y-0' : 'translate-y-[200%] pointer-events-none'
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
            disabled={isExpired}
            className={`flex-1 py-3 sm:py-3.5 px-5 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 btn-tactile shadow-lg ${
              isExpired
                ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FF6B00] via-[#FF7A00] to-[#FF8500] hover:from-[#E05E00] hover:to-[#FF6B00] shadow-orange-500/25 active:scale-[0.98]'
            }`}
          >
            <span className="tracking-wider">{isExpired ? 'DEADLINE EXPIRED' : 'APPLY NOW'}</span>
            {!isExpired && <ExternalLink size={16} className="text-white flex-shrink-0" />}
          </button>
        </div>
      </div>

      {/* Share & Report Modals */}
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} job={job} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} jobId={job.id} jobTitle={job.title} />
    </div>
  );
}

