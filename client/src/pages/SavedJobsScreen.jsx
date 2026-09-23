import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { jobApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import { JobCardSkeleton } from '../components/SkeletonLoader';

export default function SavedJobsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const fetchSavedJobs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await jobApi.getSavedJobs();
      setSavedJobs(res.saved_jobs || []);
    } catch (err) {
      console.error('Fetch saved jobs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, [user]);

  const handleUnsave = (jobId) => {
    setSavedJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const handleTrackStatus = async (jobId, newStatus) => {
    try {
      await jobApi.trackApplication(jobId, newStatus);
      fetchSavedJobs();
    } catch (e) {}
  };

  if (!user) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
          <Bookmark size={32} />
        </div>
        <h2 className="font-extrabold text-slate-900 text-lg">Save & Track Opportunities</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
          Log in to bookmark jobs, set deadline reminders, and track your application progress.
        </p>
        <button
          onClick={() => navigate('/profile')}
          className="px-6 py-3 bg-gradient-to-r from-[#FF6B00] to-[#FF8500] text-white font-extrabold text-xs rounded-xl shadow-md"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const filteredJobs = savedJobs.filter(job => {
    if (activeTab === 'Not Applied') return !job.application_status || job.application_status === 'Interested';
    if (activeTab === 'Applied') return job.application_status && job.application_status !== 'Interested';
    if (activeTab === 'Expiring Soon') {
      const daysLeft = (new Date(job.application_deadline).getTime() - Date.now()) / (1000 * 3600 * 24);
      return daysLeft > 0 && daysLeft <= 5;
    }
    return true;
  });

  return (
    <div className="pb-24 space-y-4 w-full">
      {/* Edge-to-Edge Corporate Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-4">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-white flex items-center gap-2.5">
              <Bookmark size={22} className="text-[#FF6B00]" /> Saved Opportunities
            </h1>
            <span className="text-xs bg-slate-800 text-orange-400 border border-slate-700 px-3.5 py-1.5 rounded-full font-semibold">
              {savedJobs.length} Bookmarks
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold text-center border border-slate-700/80">
            {['All', 'Not Applied', 'Applied', 'Expiring Soon'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 rounded-lg transition-all text-xs truncate ${
                  activeTab === tab
                    ? 'bg-[#FF6B00] text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Saved Feed */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 space-y-4 pt-2">
        {loading ? (
          <>
            <JobCardSkeleton />
            <JobCardSkeleton />
          </>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <div key={job.id} className="space-y-2">
              <JobCard job={job} onSaveToggle={handleUnsave} isSaved={true} />

              {/* Status Tracker Toolbar */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between text-xs shadow-2xs">
                <span className="font-extrabold text-slate-700 text-xs">Track Status:</span>
                <select
                  value={job.application_status || 'Interested'}
                  onChange={(e) => handleTrackStatus(job.id, e.target.value)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-[#FF6B00] focus:outline-none"
                >
                  <option value="Interested">Interested</option>
                  <option value="Applied">Applied</option>
                  <option value="Assessment">Assessment Round</option>
                  <option value="Interview">Interview Scheduled</option>
                  <option value="Selected">Selected / Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-xs">
            <p className="text-base font-extrabold text-slate-800">No Saved Jobs in this Category</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-[#FF6B00] to-[#FF8500] text-white font-extrabold text-xs rounded-xl shadow-md"
            >
              Explore Opportunities
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

