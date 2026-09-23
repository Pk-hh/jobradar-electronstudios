import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark, ExternalLink, Calendar, FileText, CheckCircle2, ShieldAlert,
  Award, Users, Crown, Building2, Train, Shield, MapPin, BookOpen, ArrowUpRight
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { JobCardSkeleton } from '../components/SkeletonLoader';

export default function GovernmentJobsScreen({ isMobileFrame }) {
  const navigate = useNavigate();
  const [govtJobs, setGovtJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const govtCategories = [
    { id: 'All', label: 'All Govt Alerts', icon: Landmark },
    { id: 'SSC', label: 'SSC', icon: FileText },
    { id: 'UPSC', label: 'UPSC', icon: Crown },
    { id: 'Banking', label: 'Banking & Insurance', icon: Building2 },
    { id: 'PSU', label: 'PSU / Maharatna', icon: Building2 },
    { id: 'Railways', label: 'Railways (RRB)', icon: Train },
    { id: 'Defence', label: 'Defence / ISRO', icon: Shield },
    { id: 'State Government', label: 'State Govt', icon: MapPin },
    { id: 'Police', label: 'Police Dept', icon: ShieldAlert },
    { id: 'Teaching', label: 'Teaching / NET', icon: BookOpen }
  ];

  const fetchGovtJobs = async () => {
    try {
      setLoading(true);
      const params = {
        category: 'Government',
        sub_category: activeCategory !== 'All' ? activeCategory : undefined
      };
      const res = await firebaseService.getJobs(params);
      setGovtJobs(res.jobs || []);
    } catch (err) {
      console.error('Fetch govt jobs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovtJobs();
  }, [activeCategory]);

  return (
    <div className="pb-28 sm:pb-32 space-y-6 w-full">
      {/* Edge-to-Edge Corporate Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-5">
        <div className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-white flex items-center gap-2.5">
                <Landmark size={22} className="text-amber-400" /> Government & PSU Recruitment Gazettes
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
                Official announcements from Central & State Gazettes, Public Sector Undertakings, and Civil Services.
              </p>
            </div>
            <span className="text-xs bg-slate-800 text-amber-400 border border-slate-700 px-3.5 py-1.5 rounded-full font-semibold self-start sm:self-auto">
              Verified Public Sector Alerts
            </span>
          </div>

          {/* Scrollable Govt Categories */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {govtCategories.map(gc => {
              const Icon = gc.icon;
              const isActive = activeCategory === gc.id;
              return (
                <button
                  key={gc.id}
                  onClick={() => setActiveCategory(gc.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 border border-slate-700/80'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-slate-950' : 'text-amber-400'} />
                  <span>{gc.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`${isMobileFrame ? 'px-4' : 'w-full px-4 sm:px-6 md:px-8 lg:px-12'} space-y-5`}>
        {/* Govt Notice Trust Note */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-200/80 rounded-2xl p-4 text-xs md:text-sm text-slate-800 flex items-start gap-3.5 shadow-2xs">
          <ShieldAlert size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-slate-900 block text-sm">Official Gazette & Application Portal Guarantee</span>
            All official PDF gazettes and authentic Government application portals listed here are thoroughly verified by our editorial team. Never pay application fees to unauthorized third-party agencies.
          </div>
        </div>

        {/* Govt Notifications List Grid */}
        <div className={`grid ${!isMobileFrame ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-5`}>
          {loading ? (
            <>
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </>
          ) : govtJobs.length > 0 ? (
            govtJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04)] hover:shadow-xl hover:border-amber-400/50 transition-all duration-300 cursor-pointer border-l-4 border-l-amber-500 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-800">
                        GOVT
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#FF6B00] transition-colors">{job.title}</h3>
                        <p className="text-xs font-bold text-slate-600 mt-0.5">{job.company}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200/80 flex items-center gap-1 flex-shrink-0 shadow-2xs">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  </div>

                  {/* Vacancy & Pay Matrix Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60 text-xs font-medium">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold uppercase">Total Vacancies</span>
                      <span className="font-extrabold text-slate-900 flex items-center gap-1 text-xs mt-0.5">
                        <Users size={14} className="text-[#FF6B00]" /> {job.vacancies ? `${job.vacancies.toLocaleString()} Posts` : 'Various'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold uppercase">Pay Matrix / Scale</span>
                      <span className="font-extrabold text-[#FF6B00] truncate block text-xs mt-0.5">{job.salary || 'Level Pay Matrix'}</span>
                    </div>
                  </div>

                  {/* Dates & Qualification */}
                  <div className="text-xs text-slate-700 space-y-1.5 font-medium">
                    {job.qualification && <p><span className="font-bold text-slate-900">Qualification:</span> {job.qualification}</p>}
                    {(job.experience || job.eligibility) && <p><span className="font-bold text-slate-900">Eligibility / Age:</span> {job.experience || job.eligibility}</p>}
                  </div>
                </div>

                {/* Action Buttons for Official PDF & Official Portal */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 text-xs gap-2.5 mt-2">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold whitespace-nowrap">
                    <Calendar size={13} className="text-[#FF6B00]" /> Deadline: {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Open'}
                  </span>

                  <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    {job.official_notification_url && (
                      <a
                        href={job.official_notification_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 border border-slate-300 font-extrabold text-slate-700 rounded-xl text-[11px] hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
                      >
                        <FileText size={12} /> PDF Advt
                      </a>
                    )}
                    <a
                      href={job.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF6B00] to-[#FF8500] hover:shadow-md text-white font-extrabold rounded-xl text-[11px] flex items-center gap-1 shadow-2xs"
                    >
                      Official Portal <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-xs">
              <p className="text-base font-extrabold text-slate-800">No Government Job Notifications Found in this Category</p>
              <button
                onClick={() => setActiveCategory('All')}
                className="px-6 py-3 bg-gradient-to-r from-[#FF6B00] to-[#FF8500] text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Show All Govt Alerts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

