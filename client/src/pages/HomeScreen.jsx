import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Sparkles, ArrowRight, RefreshCw, Flame, Landmark, ShieldCheck, Zap } from 'lucide-react';
import { jobApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import CategoryChip from '../components/CategoryChip';
import FilterBottomSheet from '../components/FilterBottomSheet';
import { JobCardSkeleton } from '../components/SkeletonLoader';

export default function HomeScreen({ isMobileFrame }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [govtHighlights, setGovtHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: 'All',
    work_mode: 'All',
    type: 'All',
    location: 'All',
    qualification: 'All',
    verified_only: false,
    sort: 'latest'
  });

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const params = {
        category: activeCategory !== 'All' ? activeCategory : undefined,
        search: searchQuery || undefined,
        ...filters
      };

      const res = await jobApi.getJobs(params);
      setJobs(res.jobs || []);

      try {
        const recRes = await jobApi.getRecommendations();
        setRecommendations(recRes.recommendations || []);
      } catch (e) {}

      try {
        const govtRes = await jobApi.getJobs({ category: 'Government' });
        setGovtHighlights((govtRes.jobs || []).slice(0, 5));
      } catch (e) {}
    } catch (err) {
      console.error('Fetch home jobs error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [activeCategory, filters, searchQuery, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHomeData();
  };

  // Single column in mobile frame; 3 columns on full screen PC view
  const feedGridClass = isMobileFrame ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5';

  return (
    <div className="pb-24 space-y-6 w-full">
      {/* Edge-to-Edge Corporate Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        <div className="w-full space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {user?.name && user.name !== 'Job Seeker'
                  ? `Welcome back, ${user.name.split(' ')[0]}`
                  : 'Find your next career opportunity'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-normal">
                Verified listings for software engineering, campus placement drives, internships & official government notices.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              className={`px-3.5 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white flex items-center gap-2 text-xs font-semibold transition-all self-start md:self-auto ${
                refreshing ? 'animate-spin' : ''
              }`}
              title="Refresh Opportunities Feed"
            >
              <RefreshCw size={15} />
              <span>Refresh Feed</span>
            </button>
          </div>

          {/* Integrated Corporate Search & Filter Console */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 w-full max-w-3xl">
            <div className="relative flex-1 flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl focus-within:border-[#FF6B00] focus-within:ring-2 focus-within:ring-[#FF6B00]/20 transition-all">
              <Search size={18} className="text-slate-400 ml-3.5 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title, skill, company, or notification..."
                className="w-full py-3 px-3 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="mr-1.5 px-4 py-2 bg-[#FF6B00] hover:bg-[#E05E00] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              >
                Search
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all flex-shrink-0"
              title="Filter Opportunities"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Container */}
      <div className={`${isMobileFrame ? 'px-4' : 'w-full px-4 sm:px-6 md:px-8 lg:px-12'} space-y-6`}>
        {/* Category Chips Horizontal Scroll */}
        <div>
          <CategoryChip
            activeCategory={activeCategory}
            onSelectCategory={(cat) => {
              setActiveCategory(cat);
              setFilters(prev => ({ ...prev, category: cat }));
            }}
          />
        </div>

        <div className={!isMobileFrame ? 'grid grid-cols-1 lg:grid-cols-4 gap-6' : 'space-y-5'}>
          {/* Main Opportunities Feed (Spans 3 Columns on PC Desktop View) */}
          <div className={!isMobileFrame ? 'lg:col-span-3 space-y-4' : 'space-y-4'}>
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
                <div className="p-1.5 rounded-xl bg-orange-100 text-[#FF6B00]">
                  <Flame size={20} />
                </div>
                Latest Job Alerts
              </h2>
              <button
                onClick={() => navigate('/jobs')}
                className="text-xs md:text-sm font-extrabold text-[#FF6B00] hover:text-[#E05E00] flex items-center gap-1 group"
              >
                <span>View Full Directory</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Jobs Cards Feed Grid */}
            <div className={`grid ${feedGridClass}`}>
              {loading ? (
                <>
                  <JobCardSkeleton />
                  <JobCardSkeleton />
                  <JobCardSkeleton />
                  <JobCardSkeleton />
                  <JobCardSkeleton />
                  <JobCardSkeleton />
                </>
              ) : jobs.length > 0 ? (
                jobs.map((job) => <JobCard key={job.id} job={job} />)
              ) : (
                <div className="col-span-full bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto shadow-xs">
                    <Search size={32} className="text-[#FF6B00]" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg">No Matching Opportunities</h3>
                  <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">
                    We couldn't find any job notices matching your current search parameters. Try resetting filters.
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory('All');
                      setSearchQuery('');
                      setFilters({ category: 'All', work_mode: 'All', type: 'All', location: 'All', qualification: 'All', verified_only: false, sort: 'latest' });
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-[#FF6B00] to-[#FF8500] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg hover:shadow-orange-500/20 transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PC Desktop Right Sidebar (Spans 1 Column on PC Desktop View) */}
          {!isMobileFrame && (
            <div className="lg:col-span-1 space-y-5">
              {recommendations.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-orange-200/80 shadow-[0_2px_12px_-2px_rgba(255,107,0,0.08)] space-y-3">
                  <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                      <Sparkles size={16} className="text-[#FF6B00]" /> Tailored For You
                    </h3>
                    <span className="text-[10px] font-extrabold text-[#FF6B00] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      AI Match
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {recommendations.slice(0, 5).map((recJob) => (
                      <div
                        key={recJob.id}
                        onClick={() => navigate(`/jobs/${recJob.id}`)}
                        className="p-3 bg-slate-50 hover:bg-orange-50/50 rounded-xl border border-slate-200/80 hover:border-orange-300 transition-all cursor-pointer space-y-1 group"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-[#FF6B00] font-black">{recJob.match_score}% Match Score</span>
                          <span className="text-slate-500">{recJob.location}</span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 truncate group-hover:text-[#FF6B00] transition-colors">{recJob.title}</h4>
                        <p className="text-[11px] text-slate-600 font-medium truncate">{recJob.company}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {govtHighlights.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                      <Landmark size={16} className="text-slate-900" /> Govt Gazettes
                    </h3>
                    <button
                      onClick={() => navigate('/government')}
                      className="text-[11px] font-bold text-[#FF6B00] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {govtHighlights.map((govt) => (
                      <div
                        key={govt.id}
                        onClick={() => navigate(`/jobs/${govt.id}`)}
                        className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 transition-all cursor-pointer flex items-center justify-between text-xs group"
                      >
                        <div className="min-w-0 pr-2">
                          <h4 className="font-extrabold text-slate-900 truncate text-[11px] group-hover:text-[#FF6B00] transition-colors">{govt.title}</h4>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{govt.company}</p>
                        </div>
                        <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded whitespace-nowrap">
                          {govt.vacancies ? `${govt.vacancies} Posts` : 'Govt'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <FilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApplyFilters={(newFilters) => setFilters(newFilters)}
        onResetFilters={(newFilters) => setFilters(newFilters)}
      />
    </div>
  );
}

