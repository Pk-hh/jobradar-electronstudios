import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, CheckCheck, Landmark, Flame, Clock, Sparkles } from 'lucide-react';
import { notificationApi } from '../services/api';

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (notif) => {
    try {
      await notificationApi.markRead(notif.id);
      if (notif.job_id) {
        navigate(`/jobs/${notif.job_id}`);
      }
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      fetchNotifications();
    } catch (e) {}
  };

  const getNotifIcon = (type) => {
    if (type === 'GOVT_JOB') return <Landmark className="text-amber-500" size={20} />;
    if (type === 'DEADLINE_SOON') return <Clock className="text-rose-500" size={20} />;
    if (type === 'RECOMMENDED') return <Sparkles className="text-purple-500" size={20} />;
    return <Flame className="text-[#FF6B00]" size={20} />;
  };

  return (
    <div className="pb-24 space-y-4 bg-slate-50 min-h-screen w-full">
      {/* Dark Glass Header */}
      <div className="bg-[#09090B]/90 backdrop-blur-xl text-white p-4 sticky top-0 z-30 shadow-xl border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-extrabold text-base tracking-tight flex items-center gap-2">
            <Bell size={18} className="text-[#FF6B00]" /> Notification Center
          </h1>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="text-xs font-extrabold text-[#FF6B00] hover:text-[#FF8500] flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20"
        >
          <CheckCheck size={14} /> Mark All Read
        </button>
      </div>

      {/* List Container */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 space-y-3 pt-2">
        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-slate-400">Loading alerts...</div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                notif.is_read
                  ? 'bg-white border-slate-200/80 opacity-75'
                  : 'bg-gradient-to-r from-orange-50/70 to-amber-50/30 border-orange-200 shadow-sm border-l-4 border-l-[#FF6B00]'
              }`}
            >
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex-shrink-0 shadow-2xs">
                {getNotifIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">{notif.title}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-snug font-medium">{notif.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
            <Bell size={28} className="mx-auto text-slate-300" />
            <h3 className="font-extrabold text-slate-800 text-base">No Unread Notifications</h3>
            <p className="text-xs text-slate-500 font-medium">New job alerts & deadline notifications will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

