import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import TopAppBar from './components/TopAppBar';
import BottomNavigation from './components/BottomNavigation';

import HomeScreen from './pages/HomeScreen';
import JobsScreen from './pages/JobsScreen';
import InternshipsScreen from './pages/InternshipsScreen';
import GovernmentJobsScreen from './pages/GovernmentJobsScreen';
import JobDetailsScreen from './pages/JobDetailsScreen';
import SavedJobsScreen from './pages/SavedJobsScreen';
import ProfileScreen from './pages/ProfileScreen';
import NotificationsScreen from './pages/NotificationsScreen';
import AdminDashboardScreen from './pages/AdminDashboardScreen';

function MainLayout() {
  const location = useLocation();
  // Default to PC Desktop Wide View (100% Screen Width)
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Hide BottomNavigation on Job Details screen so Save & Apply bar has clean dedicated bottom space without footer collisions
  const isJobDetailsPage = location.pathname.startsWith('/jobs/') && location.pathname !== '/jobs';

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${isMobileFrame ? 'py-0 sm:py-6 bg-slate-950' : ''}`}>
      <div
        className={
          isMobileFrame
            ? 'mobile-frame-emulator rounded-none sm:rounded-3xl border-0 sm:border-8 sm:border-slate-800 shadow-2xl transition-all duration-300'
            : 'w-full min-h-screen bg-slate-50 flex flex-col transition-all duration-300'
        }
      >
        <TopAppBar
          isMobileFrame={isMobileFrame}
          onToggleFrame={() => setIsMobileFrame(prev => !prev)}
        />

        <main className="flex-1 min-h-[calc(100vh-140px)]">
          <div key={location.pathname} className="animate-page-enter w-full">
            <Routes>
              <Route path="/" element={<HomeScreen isMobileFrame={isMobileFrame} />} />
              <Route path="/jobs" element={<JobsScreen isMobileFrame={isMobileFrame} />} />
              <Route path="/internships" element={<InternshipsScreen isMobileFrame={isMobileFrame} />} />
              <Route path="/government" element={<GovernmentJobsScreen isMobileFrame={isMobileFrame} />} />
              <Route path="/jobs/:id" element={<JobDetailsScreen isMobileFrame={isMobileFrame} />} />
              <Route path="/saved" element={<SavedJobsScreen isMobileFrame={isMobileFrame} />} />
              <Route path="/profile" element={<ProfileScreen isMobileFrame={isMobileFrame} />} />
              <Route path="/notifications" element={<NotificationsScreen isMobileFrame={isMobileFrame} />} />
              <Route path="/admin" element={<AdminDashboardScreen isMobileFrame={isMobileFrame} />} />
            </Routes>
          </div>
        </main>

        {/* Bottom navigation for main tab screens (hidden on detail pages to prevent double footer merging) */}
        {!isJobDetailsPage && (
          <div className={!isMobileFrame ? 'block md:hidden' : 'block'}>
            <BottomNavigation />
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </Router>
  );
}

