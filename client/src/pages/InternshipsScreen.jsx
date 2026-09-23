import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Search, SlidersHorizontal, Sparkles, Code, Cpu,
  BarChart3, Zap, Plug, Microscope, Globe, Settings, Building2, TrendingUp, DollarSign, Palette
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import JobCard from '../components/JobCard';
import FilterBottomSheet from '../components/FilterBottomSheet';
import { JobCardSkeleton } from '../components/SkeletonLoader';

export default function InternshipsScreen({ isMobileFrame }) {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ work_mode: 'All', location: 'All', sort: 'latest' });

  const domains = [
    { id: 'All', label: 'All Domains', icon: Sparkles },
    { id: 'Software', label: 'Software', icon: Code },
    { id: 'AI/ML', label: 'AI / ML', icon: Cpu },
    { id: 'Data Science', label: 'Data Science', icon: BarChart3 },
    { id: 'Electronics', label: 'Electronics', icon: Zap },
    { id: 'Embedded Systems', label: 'Embedded', icon: Plug },
    { id: 'VLSI', label: 'VLSI Design', icon: Microscope },
    { id: 'Web Development', label: 'Web Dev', icon: Globe },
    { id: 'Mechanical', label: 'Mechanical', icon: Settings },
    { id: 'Civil', label: 'Civil', icon: Building2 },
    { id: 'Electrical', label: 'Electrical', icon: Zap },
    { id: 'Marketing', label: 'Marketing', icon: TrendingUp },
    { id: 'Finance', label: 'Finance', icon: DollarSign },
    { id: 'Design', label: 'UI/UX Design', icon: Palette }
  ];

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const params = {
        category: 'Internships',
        sub_category: selectedDomain !== 'All' ? selectedDomain : undefined,
        search: search || undefined,
        ...filters
      };
      const res = await firebaseService.getJobs(params);
      setInternships(res.jobs || []);
    } catch (err) {
      console.error('Fetch internships error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [selectedDomain, search, filters]);

  // Single column in mobile frame; 4 columns on 100% full screen PC view
  const gridClasses = isMobileFrame
    ? 'grid-cols-1 gap-4'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';

  return (
    <div className="pb-24 space-y-6 w-full">
      {/* Edge-to-Edge Corporate Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-5">
        <div className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-white flex items-center gap-2.5">
                <GraduationCap size={22} className="text-[#FF6B00]" /> Internship & Fresher Training Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
                Stipend-backed roles, virtual remote internships, and early career placement drives.
              </p>
            </div>
            <span className="text-xs bg-slate-800 text-orange-400 border border-slate-700 px-3.5 py-1.5 rounded-full font-semibold self-start sm:self-auto">
              {internships.length} Active Openings
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
                placeholder="Search internship roles, stipend ranges, companies..."
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

          {/* 14 Domain Scrollable Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {domains.map(d => {
              const Icon = d.icon;
              const isActive = selectedDomain === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDomain(d.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 ${
                    isActive
                      ? 'bg-[#FF6B00] text-white font-bold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 border border-slate-700/80'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-[#FF6B00]'} />
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Full-Width Internship Grid Feed */}
      <div className={`${isMobileFrame ? 'px-4' : 'w-full px-4 sm:px-6 md:px-8 lg:px-12'} pt-2`}>
        <div className={`grid ${gridClasses}`}>
          {loading ? (
            <>
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </>
          ) : internships.length > 0 ? (
            internships.map(internship => <JobCard key={internship.id} job={internship} />)
          ) : (
            <div className="col-span-full bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto shadow-xs">
                <GraduationCap size={32} className="text-[#FF6B00]" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">No Internships Found in this Domain</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching across all domains or adjusting search parameters.
              </p>
              <button
                onClick={() => {
                  setSelectedDomain('All');
                  setSearch('');
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#FF6B00] to-[#FF8500] text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Show All Internships
              </button>
            </div>
          )}
        </div>
      </div>

      <FilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApplyFilters={(f) => setFilters(f)}
        onResetFilters={(f) => setFilters(f)}
      />
    </div>
  );
}

