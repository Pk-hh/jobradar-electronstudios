import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, PlusCircle, Bell, RefreshCw, Eye, MousePointerClick, CheckCircle2,
  AlertTriangle, Trash2, Edit3, Search, Filter, Calendar, ExternalLink, Upload, FolderCheck, FileText, Image, Building, CloudUpload, MapPin
} from 'lucide-react';
import { adminApi } from '../services/api';
import { firebaseService, isFirebaseConfigured } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardScreen({ isMobileFrame }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Empty Form State for manual entry
  const emptyFormState = {
    title: '',
    company: '',
    logo: '',
    description: '',
    category: 'Jobs',
    sub_category: '',
    type: 'Full Time',
    location: '',
    work_mode: 'On-site',
    salary: '',
    stipend: '',
    experience: '',
    qualification: '',
    branch: '',
    skills: '',
    eligibility: '',
    vacancies: '',
    application_deadline: '',
    selection_process: '',
    official_notification_url: '',
    application_url: '',
    source: '',
    status: 'Published',
    verified: true
  };

  // Form State
  const [formData, setFormData] = useState(emptyFormState);

  // Broadcast Notif Form State
  const [notifData, setNotifData] = useState({
    title: 'NEW OPPORTUNITY ALERT',
    message: 'A new fresher recruitment drive was just announced!',
    type: 'NEW_JOB'
  });

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const statsRes = await adminApi.getStats();
      setStats(statsRes.stats);

      const jobsRes = await adminApi.getAdminJobs({ status: statusFilter, search: searchQuery });
      setJobs(jobsRes.jobs || []);

      const reportsRes = await adminApi.getReports();
      setReports(reportsRes.reports || []);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [statusFilter, searchQuery]);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await firebaseService.uploadFileToStorage(file);
      if (res.url) {
        setFormData(prev => ({ ...prev, [field]: res.url }));
        alert(`File uploaded successfully: ${res.url}`);
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateOrUpdateJob = async (statusOverride) => {
    try {
      const skillsArray = typeof formData.skills === 'string'
        ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : formData.skills;

      const payload = {
        ...formData,
        skills: skillsArray,
        status: statusOverride || formData.status,
        vacancies: formData.vacancies ? parseInt(formData.vacancies) : 0
      };

      if (editingJob) {
        await adminApi.updateJob(editingJob.id, payload);
      } else {
        await firebaseService.createJobInFirestore(payload);
      }

      setIsJobModalOpen(false);
      setEditingJob(null);
      setFormData(emptyFormState);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to save job');
    }
  };

  const handleToggleVerify = async (jobId) => {
    try {
      await adminApi.toggleVerify(jobId);
      fetchAdminData();
    } catch (e) {}
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job notification permanently?')) return;
    try {
      await adminApi.deleteJob(jobId);
      fetchAdminData();
    } catch (e) {}
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      await adminApi.broadcastNotification(notifData);
      alert('Notification broadcasted to active users!');
      setIsNotifModalOpen(false);
    } catch (err) {
      alert('Failed to broadcast notification');
    }
  };

  const containerClass = isMobileFrame ? 'px-4' : 'w-full px-4 sm:px-6 md:px-8 lg:px-12';

  return (
    <div className="pb-24 space-y-6 bg-slate-50 min-h-screen w-full">
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white py-8">
        <div className={`${containerClass} flex items-center justify-between`}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="font-extrabold text-lg md:text-xl tracking-tight text-white flex items-center gap-2">
                Admin Management Console
              </h1>
              <p className="text-xs text-slate-400 font-normal">Firestore Database & Asset Upload Management</p>
            </div>
          </div>

          <button
            onClick={fetchAdminData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl flex items-center gap-2 text-xs font-semibold transition-all"
          >
            <RefreshCw size={15} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      <div className={`${containerClass} space-y-6`}>
        {/* Connection Info Banner */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 flex items-start gap-3.5 shadow-2xs">
          <CloudUpload size={20} className="text-[#FF6B00] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 text-sm block">Firebase & Storage Live Connection</span>
            Company logos, flyers, and PDF gazettes are synced to <code className="bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded font-mono font-bold">Firebase Cloud Storage / Firestore</code>.
            {isFirebaseConfigured() ? (
              <span className="ml-2 font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded inline-block mt-1 sm:mt-0">
                Project: {import.meta.env.VITE_FIREBASE_PROJECT_ID}
              </span>
            ) : (
              <span className="ml-2 font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded inline-block mt-1 sm:mt-0">
                Server Fallback Ready
              </span>
            )}
          </div>
        </div>

        {/* KPI Stats Overview Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Roles</span>
              <span className="font-extrabold text-[#FF6B00] text-2xl block">{stats.active_jobs}</span>
              <span className="text-[11px] text-slate-500 font-normal">Of {stats.total_jobs} Total Listings</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Expired Roles</span>
              <span className="font-extrabold text-rose-600 text-2xl block">{stats.expired_jobs}</span>
              <span className="text-[11px] text-slate-500 font-normal">Passed Deadline</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Govt & Internships</span>
              <span className="font-extrabold text-slate-900 text-2xl block">{stats.govt_jobs} / {stats.internships}</span>
              <span className="text-[11px] text-slate-500 font-normal">Govt / Internships</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Engagement</span>
              <span className="font-extrabold text-emerald-600 text-2xl block">{stats.total_views} Views</span>
              <span className="text-[11px] text-slate-500 font-normal">{stats.total_clicks} Apply Clicks</span>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              setEditingJob(null);
              setFormData(emptyFormState);
              setIsJobModalOpen(true);
            }}
            className="w-full sm:flex-1 py-2.5 px-4 bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs md:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            <PlusCircle size={16} /> Post New Opportunity
          </button>

          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="w-full sm:w-auto py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            <Bell size={16} /> Send Push Broadcast
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search size={15} className="text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog by title, company..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:border-[#FF6B00] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['All', 'Published', 'Draft', 'Verified', 'Expired'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap transition-all ${
                  statusFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Catalog Table List */}
        <div className="space-y-3">
          <h2 className="font-extrabold text-slate-900 text-base">Job Catalog ({jobs.length})</h2>

          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs hover:border-slate-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={job.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'}
                      alt={job.company}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0 bg-slate-50"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm md:text-base">{job.title}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          job.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          job.status === 'Expired' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {job.status}
                        </span>
                        <span className="bg-orange-50 text-[#FF6B00] border border-orange-200/60 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {job.category}
                        </span>
                      </div>
                      <p className="text-slate-600 font-normal mt-0.5 flex items-center gap-1">
                        <span>{job.company}</span>
                        <span>•</span>
                        <MapPin size={12} className="text-[#FF6B00]" />
                        <span>{job.location} ({job.work_mode})</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start flex-shrink-0">
                    <button
                      onClick={() => handleToggleVerify(job.id)}
                      title="Toggle Verified Badge"
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        job.verified
                          ? 'bg-orange-50 border-orange-200 text-[#FF6B00]'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      <span>{job.verified ? 'VERIFIED' : 'UNVERIFIED'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500 gap-2 flex-wrap">
                  <span className="font-normal">Deadline: {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'N/A'}</span>
                  <span className="font-normal">Views: {job.views_count || 0} | Apply Clicks: {job.clicks_count || 0}</span>

                  <div className="flex items-center gap-3 font-semibold">
                    <button
                      onClick={() => {
                        setEditingJob(job);
                        setFormData({
                          ...emptyFormState,
                          ...job,
                          skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || ''
                        });
                        setIsJobModalOpen(true);
                      }}
                      className="text-slate-700 hover:text-slate-900 flex items-center gap-1"
                    >
                      <Edit3 size={13} /> Edit
                    </button>

                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-rose-600 hover:text-rose-800 flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Job Create / Edit with Firebase File Upload Controls */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <h3 className="font-extrabold text-base text-[#111111]">
              {editingJob ? 'Edit Job Notification' : 'Create Opportunity (Manual Data Entry)'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Job / Notice Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Software Engineer, Assistant Manager"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Infosys, TCS, ISRO"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  >
                    <option value="Jobs">Jobs</option>
                    <option value="Internships">Internships</option>
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                    <option value="Freshers">Freshers</option>
                    <option value="Work From Home">Work From Home</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Apprenticeships">Apprenticeships</option>
                    <option value="Campus Jobs">Campus Jobs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Sub Category</label>
                  <input
                    type="text"
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                    placeholder="e.g. Software, SSC, UPSC, Banking, Mechanical"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Job Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Apprenticeship">Apprenticeship</option>
                    <option value="Contract">Contract</option>
                    <option value="Part Time">Part Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Work Mode</label>
                  <select
                    value={formData.work_mode}
                    onChange={(e) => setFormData({ ...formData, work_mode: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Hyderabad, Bengaluru, Pan India"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Salary / Compensation</label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="e.g. ₹4.5 - 6 LPA, Level 7 Pay Matrix"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Experience Required</label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g. Fresher (0-1 Yrs), 2+ Years"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Qualification Required</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. B.Tech / B.E, Any Graduate, 12th Pass"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Branch / Stream</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="e.g. CSE, IT, ECE, Civil, All Branches"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Required Technical Skills (Comma separated)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="e.g. Java, Python, React, SQL"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Detailed Eligibility Criteria</label>
                <textarea
                  rows={2}
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="e.g. Minimum 60% in graduation. Age limit: 18-30 yrs."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={formData.application_deadline ? formData.application_deadline.split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Open Vacancies</label>
                  <input
                    type="number"
                    value={formData.vacancies}
                    onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Company Logo URL or Upload */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Image size={15} className="text-[#FF6B00]" /> Company Logo Image Link / URL
                  </label>
                  <span className="text-[10px] text-slate-500">Paste URL or upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={formData.logo || ''}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-[#FF6B00]"
                  />
                  <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 flex-shrink-0 transition-all">
                    <Upload size={13} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploading && <p className="text-[10px] text-[#FF6B00] font-bold">Uploading image...</p>}
              </div>

              {/* Official PDF Gazette / Advertisement Link or Upload */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText size={15} className="text-[#FF6B00]" /> Official PDF Gazette / Notification Link
                  </label>
                  <span className="text-[10px] text-slate-500">Paste PDF URL or upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={formData.official_notification_url || ''}
                    onChange={(e) => setFormData({ ...formData, official_notification_url: e.target.value })}
                    placeholder="https://example.com/notification-gazette.pdf"
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-[#FF6B00]"
                  />
                  <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 flex-shrink-0 transition-all">
                    <Upload size={13} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileUpload(e, 'official_notification_url')}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploading && <p className="text-[10px] text-[#FF6B00] font-bold">Uploading document...</p>}
              </div>

              <div>
                <label className="font-bold block mb-1">Official Application Link / URL *</label>
                <input
                  type="url"
                  required
                  value={formData.application_url}
                  onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                  placeholder="https://company.example.com/apply"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Source Provider</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g. Official Website, Recruiter Direct, Central Gazette"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Job Description & Context</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter detailed job description, responsibilities, etc."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Selection Process</label>
                <textarea
                  rows={2}
                  value={formData.selection_process || ''}
                  onChange={(e) => setFormData({ ...formData, selection_process: e.target.value })}
                  placeholder="e.g. 1. Online Test  2. Technical Interview  3. HR Round"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Action Buttons: Save Draft, Publish */}
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsJobModalOpen(false)}
                className="py-2.5 px-4 border border-gray-300 font-bold rounded-xl text-gray-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleCreateOrUpdateJob('Draft')}
                className="py-2.5 px-4 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300"
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={() => handleCreateOrUpdateJob('Published')}
                className="flex-1 py-2.5 bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold rounded-xl shadow-md"
              >
                Publish Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Push Notification Broadcast */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4 text-xs">
            <h3 className="font-extrabold text-base text-[#111111]">Broadcast Push Notification</h3>

            <form onSubmit={handleBroadcast} className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  value={notifData.title}
                  onChange={(e) => setNotifData({ ...notifData, title: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Message Body</label>
                <textarea
                  rows={3}
                  required
                  value={notifData.message}
                  onChange={(e) => setNotifData({ ...notifData, message: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNotifModalOpen(false)}
                  className="w-1/3 py-2.5 border border-gray-300 font-bold text-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-[#FF6B00] text-white font-bold rounded-xl shadow-md"
                >
                  Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
