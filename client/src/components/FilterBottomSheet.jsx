import React, { useState } from 'react';
import { X, Filter, Check } from 'lucide-react';

export default function FilterBottomSheet({ isOpen, onClose, filters, onApplyFilters, onResetFilters }) {
  const [localFilters, setLocalFilters] = useState(filters || {});

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const cleared = {
      category: 'All',
      work_mode: 'All',
      type: 'All',
      location: 'All',
      qualification: 'All',
      verified_only: false,
      sort: 'latest'
    };
    setLocalFilters(cleared);
    onResetFilters(cleared);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up border border-slate-200/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-orange-50 text-[#FF6B00]">
              <Filter size={18} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Filter Opportunities</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Filter Options Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-800 flex-1">
          {/* Work Mode */}
          <div>
            <label className="font-extrabold text-slate-900 block mb-2.5">Work Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {['All', 'Remote', 'Hybrid', 'On-site'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleChange('work_mode', mode)}
                  className={`py-2.5 px-2 rounded-xl font-bold text-center border text-xs transition-all ${
                    (localFilters.work_mode || 'All') === mode
                      ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8500] text-white border-transparent shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Job / Engagement Type */}
          <div>
            <label className="font-extrabold text-slate-900 block mb-2.5">Job Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['All', 'Full Time', 'Internship', 'Apprenticeship', 'Contract', 'Part Time'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleChange('type', t)}
                  className={`py-2.5 px-2 rounded-xl font-bold text-center border text-xs transition-all ${
                    (localFilters.type || 'All') === t
                      ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8500] text-white border-transparent shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Location */}
          <div>
            <label className="font-extrabold text-slate-900 block mb-2">Location</label>
            <select
              value={localFilters.location || 'All'}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl text-xs font-extrabold focus:border-[#FF6B00] focus:outline-none"
            >
              <option value="All">All Locations</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Remote">Remote</option>
              <option value="Chennai">Chennai</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="All India">All India (Govt / Open)</option>
            </select>
          </div>

          {/* Qualification */}
          <div>
            <label className="font-extrabold text-slate-900 block mb-2">Qualification</label>
            <select
              value={localFilters.qualification || 'All'}
              onChange={(e) => handleChange('qualification', e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl text-xs font-extrabold focus:border-[#FF6B00] focus:outline-none"
            >
              <option value="All">Any Qualification</option>
              <option value="B.Tech">B.Tech / B.E</option>
              <option value="M.Tech">M.Tech / M.E</option>
              <option value="MCA">MCA / M.Sc CS</option>
              <option value="Degree">Any Bachelor Degree</option>
            </select>
          </div>

          {/* Verified Only Switch */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <span className="font-extrabold text-slate-900 block">Verified Jobs Only</span>
              <span className="text-[11px] text-slate-500 font-medium">Only show official verified recruiter postings</span>
            </div>
            <input
              type="checkbox"
              checked={localFilters.verified_only || false}
              onChange={(e) => handleChange('verified_only', e.target.checked)}
              className="w-5 h-5 accent-[#FF6B00] cursor-pointer"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="font-extrabold text-slate-900 block mb-2.5">Sort By</label>
            <div className="flex gap-2">
              {[
                { id: 'latest', label: 'Latest Posted' },
                { id: 'deadline', label: 'Expiring Soon' },
                { id: 'popular', label: 'Most Viewed' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleChange('sort', s.id)}
                  className={`flex-1 py-2.5 px-2 rounded-xl font-extrabold text-center border text-[11px] transition-all ${
                    (localFilters.sort || 'latest') === s.id
                      ? 'bg-slate-950 text-white border-slate-950'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center gap-3">
          <button
            onClick={handleReset}
            className="w-1/3 py-3.5 border border-slate-300 font-extrabold text-slate-700 rounded-2xl hover:bg-slate-100 transition-colors text-xs"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="w-2/3 py-3.5 bg-gradient-to-r from-[#FF6B00] via-[#FF7A00] to-[#FF8500] hover:shadow-md text-white font-extrabold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Check size={16} /> Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

