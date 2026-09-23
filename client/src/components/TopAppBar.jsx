import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Smartphone, Monitor, ShieldCheck, Home, Briefcase, GraduationCap, Landmark, Bookmark, User, Compass } from 'lucide-react';
import { notificationApi } from '../services/api';

export default function TopAppBar({ isMobileFrame, onToggleFrame }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationApi.getNotifications()
      .then(res => setUnreadCount(res.unread_count || 0))
      .catch(() => {});
  }, [location.pathname]);

  const navLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Internships', path: '/internships', icon: GraduationCap },
    { label: 'Govt Jobs', path: '/government', icon: Landmark },
    { label: 'Saved', path: '/saved', icon: Bookmark },
    { label: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#0F172A]/95 backdrop-blur-md text-white w-full border-b border-slate-800 shadow-md">
      <div className={`${isMobileFrame ? 'px-3' : 'w-full px-4 sm:px-6 md:px-8 lg:px-12'} py-3`}>
        <div className="flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#FF6B00] flex items-center justify-center text-white shadow-sm group-hover:bg-[#E05E00] transition-colors">
              <Compass size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-lg md:text-xl tracking-tight text-white leading-none">
                  Job<span className="text-[#FF6B00]">Radar</span>
                </span>
              </div>
              <span className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                Careers & Placement Portal
              </span>
            </div>
          </div>

          {/* PC Desktop Navigation Links */}
          {!isMobileFrame && (
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(link.path);

                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap btn-tactile transition-all duration-200 ${
                      isActive
                        ? 'bg-[#FF6B00] text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon size={16} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Action Controls Container */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Viewport View Switcher */}
            <button
              onClick={onToggleFrame}
              title={isMobileFrame ? 'Switch to Full Screen PC View' : 'Switch to Mobile App View'}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 btn-tactile transition-all flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
            >
              {isMobileFrame ? (
                <>
                  <Monitor size={16} className="text-[#FF6B00]" />
                  <span className="hidden sm:inline">PC Mode</span>
                </>
              ) : (
                <>
                  <Smartphone size={16} className="text-[#FF6B00]" />
                  <span className="hidden sm:inline">App View</span>
                </>
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all relative flex-shrink-0 btn-tactile"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF6B00] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


