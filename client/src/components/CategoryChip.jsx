import React from 'react';
import {
  Flame, Briefcase, GraduationCap, Landmark, BookOpen, Building2,
  Zap, Home, Footprints, Wrench, School
} from 'lucide-react';

const CATEGORIES = [
  { id: 'All', label: 'All Feed', icon: Flame },
  { id: 'Jobs', label: 'Jobs', icon: Briefcase },
  { id: 'Internships', label: 'Internships', icon: GraduationCap },
  { id: 'Government', label: 'Govt Jobs', icon: Landmark },
  { id: 'Entrance Exams', label: 'Entrance Exams', icon: BookOpen },
  { id: 'Private', label: 'Private Jobs', icon: Building2 },
  { id: 'Freshers', label: 'Freshers', icon: Zap },
  { id: 'Work From Home', label: 'Work From Home', icon: Home },
  { id: 'Walk-in', label: 'Walk-in Drives', icon: Footprints },
  { id: 'Apprenticeships', label: 'Apprenticeships', icon: Wrench },
  { id: 'Campus Jobs', label: 'Campus Placement', icon: School }
];

export default function CategoryChip({ activeCategory, onSelectCategory }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 border ${
              isActive
                ? 'bg-[#FF6B00] text-white border-transparent shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <Icon size={15} className={isActive ? 'text-white' : 'text-[#FF6B00]'} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

