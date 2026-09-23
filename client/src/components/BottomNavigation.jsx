import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Briefcase, GraduationCap, Bookmark, User } from 'lucide-react';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Internships', path: '/internships', icon: GraduationCap },
    { label: 'Saved', path: '/saved', icon: Bookmark },
    { label: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090B]/95 backdrop-blur-2xl text-white border-t border-white/10 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'text-[#FF6B00] font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={21} className={isActive ? 'stroke-[2.5px] scale-110 text-[#FF6B00]' : 'stroke-2'} />
              </div>
              <span className="text-[10px] mt-1 font-bold tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#FF6B00] rounded-full shadow-sm shadow-orange-500/50" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

