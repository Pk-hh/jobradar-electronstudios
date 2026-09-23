import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Briefcase, Zap } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import JobCard from '../components/JobCard';
import FilterBottomSheet from '../components/FilterBottomSheet';
import { JobCardSkeleton } from '../components/SkeletonLoader';

export default function JobsScreen({ isMobileFrame }) {
  const [jobs, setJobs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [subCategory, setSubCategory] = useState('All');

  const [filters, setFilters] = useState({
    category: 'All',
    work_mode: 'All',
    type: 'All',
    location: 'All',
    qualification: 'All',
    verified_only: false,
    sort: 'latest'
  });

  const subCategories = ['All', 'Software', 'AI/ML', 'Embedded Systems', 'VLSI', 'Web Development', 'Testing', 'Mechanical', 'Civil', 'Design'];

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        sub_category: subCategory !== 'All' ? subCategory : undefined,
        ...filters
      };
      const res = await firebaseService.getJobs(params);
      setJobs(res.jobs || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Fetch jobs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, subCategory, filters]);

  // Single column in mobile frame; 4 columns on 100% full screen PC view
  const gridClasses = isMobileFrame
    ? 'grid-cols-1 gap-4'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';

  return (
    <div className="pb-28 sm:pb-32 space-y-6 w-full">
      {/* Edge-to-Edge Corporate Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-5">
        <div className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-white flex items-center gap-2.5">
                <Briefcase size={22} className="text-[#FF6B00]" /> Job Notifications Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
                Explore full-time positions and graduate opportunities across verified hiring partners.
              </p>
            </div>
            <span className="text-xs bg-slate-800 text-orange-400 border border-slate-700 px-3.5 py-1.5 rounded-full font-semibold self-start sm:self-auto">
              {totalCount} Active Roles
            </span>
          </div>

          {/* Search Console */}
          <div className="flex items-center gap-3 w-full max-w-3xl">
            <div className="relative flex-1 flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl focus-within:border-[#FF6B00] focus-within:ring-2 focus-within:ring-[#FF6B00]/20 transition-all">
              <Search size={18} className="text-slate-400 ml-3.5 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by job title, company, or required skill..."
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

          {/* Subcategory Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {subCategories.map(sc => (
              <button
                key={sc}
                onClick={() => setSubCategory(sc)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  subCategory === sc
                    ? 'bg-[#FF6B00] text-white font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 border border-slate-700/80'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Full-Width Grid Feed */}
      <div className={`${isMobileFrame ? 'px-4' : 'w-full px-4 sm:px-6 md:px-8 lg:px-12'} pt-2`}>
        <div className={`grid ${gridClasses}`}>
          {loading ? (
            <>
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </>
          ) : jobs.length > 0 ? (
            jobs.map(job => <JobCard key={job.id} job={job} />)
          ) : (
            <div className="col-span-full bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto shadow-xs">
                <Search size={32} className="text-[#FF6B00]" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">No Job Notifications Match Your Criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try loosening your subcategory selection or reset search query filters.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSubCategory('All');
                  setFilters({ category: 'All', work_mode: 'All', type: 'All', location: 'All', qualification: 'All', verified_only: false, sort: 'latest' });
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#FF6B00] to-[#FF8500] text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Clear All Filters
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

