import React, { useState, useEffect } from 'react';
import {
  BookOpen, Search, SlidersHorizontal, Sparkles, Award, Cpu,
  Briefcase, GraduationCap, Globe, Zap, Landmark, ScrollText, CheckCircle2
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import JobCard from '../components/JobCard';
import FilterBottomSheet from '../components/FilterBottomSheet';
import { JobCardSkeleton } from '../components/SkeletonLoader';

export default function EntranceExamsScreen({ isMobileFrame }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStream, setSelectedStream] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ work_mode: 'All', location: 'All', sort: 'latest' });

  const streams = [
    { id: 'All', label: 'All Exams', icon: Sparkles },
    { id: 'Engineering', label: 'Engineering (GATE/JEE)', icon: Cpu },
    { id: 'Medical', label: 'Medical (NEET/INI-CET)', icon: Zap },
    { id: 'Management', label: 'Management (CAT/XAT)', icon: Award },
    { id: 'Govt Competitive', label: 'Govt Competitive (UPSC/SSC)', icon: Landmark },
    { id: 'Law & Sciences', label: 'Law & Sciences (CLAT/CUET)', icon: ScrollText }
  ];

  const fetchEntranceExams = async () => {
    try {
      setLoading(true);
      const params = {
        category: 'Entrance Exams',
        sub_category: selectedStream !== 'All' ? selectedStream : undefined,
        search: search || undefined,
        ...filters
      };
      const res = await firebaseService.getJobs(params);
      
      // Fallback filter if backend category search includes type = Entrance Exam
      let examList = res.jobs || [];
      if (examList.length === 0 && selectedStream === 'All' && !search) {
        // Fetch all jobs and filter manually for Entrance Exams or Entrance Exam type
        const allRes = await firebaseService.getJobs({});
        examList = (allRes.jobs || []).filter(j => 
          j.category === 'Entrance Exams' || 
          j.category === 'Entrance Exam' || 
          j.type === 'Entrance Exam' ||
          (j.title && j.title.toLowerCase().includes('entrance')) ||
          (j.sub_category && j.sub_category.toLowerCase().includes('entrance'))
        );
      }
      setExams(examList);
    } catch (err) {
      console.error('Fetch entrance exams error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntranceExams();
  }, [selectedStream, search, filters]);

  const gridClasses = isMobileFrame
    ? 'grid-cols-1 gap-4'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';

  return (
    <div className="pb-28 sm:pb-32 space-y-6 w-full">
      {/* Edge-to-Edge Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-5">
        <div className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-white flex items-center gap-2.5">
                <BookOpen size={24} className="text-[#FF6B00]" /> Entrance Exams & Admission Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
                Official notifications, syllabus breakdowns, exam dates, and registration portals for national & state entrance tests.
              </p>
            </div>
            <span className="text-xs bg-slate-800 text-orange-400 border border-slate-700 px-3.5 py-1.5 rounded-full font-semibold self-start sm:self-auto flex items-center gap-1.5">
              <CheckCircle2 size={13} /> {exams.length} Active Exam Gazettes
            </span>
          </div>

          {/* Integrated Search Console */}
          <div className="flex items-center gap-3 w-full max-w-3xl">
            <div className="relative flex-1 flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl focus-within:border-[#FF6B00] focus-within:ring-2 focus-within:ring-[#FF6B00]/20 transition-all">
              <Search size={18} className="text-slate-400 ml-3.5 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search GATE, JEE, CAT, NEET, CUET, NIMCET, UPSC exam alerts..."
                className="w-full py-3 px-3 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all flex-shrink-0"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className={`${isMobileFrame ? 'px-4' : 'w-full px-4 sm:px-6 md:px-8 lg:px-12'} space-y-6`}>
        {/* Stream Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
          {streams.map((st) => {
            const Icon = st.icon;
            const isActive = selectedStream === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStream(st.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#FF6B00]' : 'text-slate-500'} />
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Listing Grid */}
        {loading ? (
          <div className={`grid ${gridClasses}`}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <JobCardSkeleton key={idx} />
            ))}
          </div>
        ) : exams.length > 0 ? (
          <div className={`grid ${gridClasses}`}>
            {exams.map((exam) => (
              <JobCard key={exam.id} job={exam} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto">
              <BookOpen size={24} />
            </div>
            <p className="text-base font-extrabold text-slate-800">No Entrance Exam Notifications Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching entrance exam notices found for "{selectedStream}". Try clearing filters or post a new entrance exam notice from the Admin Console.
            </p>
            <button
              onClick={() => { setSelectedStream('All'); setSearch(''); }}
              className="mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <FilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApplyFilters={(f) => setFilters(f)}
      />
    </div>
  );
}
