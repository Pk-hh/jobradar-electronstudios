import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Send, Image, FileText, Upload, Plus, Trash2,
  Table, Sparkles, CheckCircle2, ShieldCheck, Building, MapPin, Briefcase, Award, AlertTriangle
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';

export default function AdminJobEditorScreen({ isMobileFrame }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const createDefaultTable = (index = 1) => ({
    id: `table_${Date.now()}_${index}`,
    title: index === 1 ? 'Syllabus & Detail Breakdown' : `Table #${index}`,
    headers: ['Post / Subject', 'Eligibility / Syllabus', 'Vacancies / Marks', 'Pay Scale / Notes'],
    rows: [
      ['', '', '', '']
    ]
  });

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
    verified: true,
    custom_tables: [createDefaultTable(1)],
    custom_fields: [
      { label: 'Age Limit', value: '' },
      { label: 'Application Fee', value: '' }
    ]
  };

  const [formData, setFormData] = useState(emptyFormState);

  useEffect(() => {
    if (isEditing) {
      const fetchJob = async () => {
        try {
          setLoading(true);
          const res = await firebaseService.getJobDetails(id);
          if (res.job) {
            const job = res.job;
            let initialTables = [];
            if (Array.isArray(job.custom_tables) && job.custom_tables.length > 0) {
              initialTables = job.custom_tables;
            } else if (job.custom_table && job.custom_table.rows && job.custom_table.rows.length > 0) {
              initialTables = [job.custom_table];
            } else {
              initialTables = [createDefaultTable(1)];
            }

            const normalizedTables = initialTables.map(tbl => ({
              ...tbl,
              headers: tbl.headers || [],
              rows: (tbl.rows || []).map(r => Array.isArray(r) ? r : (r?.cells || []))
            }));

            setFormData({
              ...emptyFormState,
              ...job,
              skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || '',
              custom_tables: normalizedTables,
              custom_fields: Array.isArray(job.custom_fields) && job.custom_fields.length > 0
                ? job.custom_fields
                : [
                    { label: 'Age Limit', value: '' },
                    { label: 'Application Fee', value: '' }
                  ]
            });
          }
        } catch (err) {
          console.error('Fetch job error:', err);
          alert('Failed to load job details');
        } finally {
          setLoading(false);
        }
      };
      fetchJob();
    }
  }, [id, isEditing]);

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

  const handleSave = async (statusOverride) => {
    if (!formData.title || !formData.company) {
      alert('Job Title and Company Name are required fields.');
      return;
    }

    try {
      setSaving(true);

      const skillsArray = typeof formData.skills === 'string'
        ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : formData.skills;

      // Clean custom_tables payload and structure rows as Firestore-compliant objects ({ cells: [...] })
      let cleanedTables = [];
      if (Array.isArray(formData.custom_tables)) {
        cleanedTables = formData.custom_tables
          .map((tbl, idx) => {
            if (!tbl) return null;
            const headers = (tbl.headers || []).map(h => h !== undefined && h !== null ? String(h) : '');
            const rawRows = (tbl.rows || []).map(row => Array.isArray(row) ? row : (row?.cells || []));
            const activeRows = rawRows.filter(row =>
              Array.isArray(row) && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '')
            );
            const hasTitle = Boolean(tbl.title && String(tbl.title).trim() !== '');
            const hasHeaders = headers.some(h => h.trim() !== '');
            const hasRows = activeRows.length > 0;

            if (hasTitle || hasHeaders || hasRows) {
              const rowsList = activeRows.length > 0 ? activeRows : [headers.map(() => '')];
              return {
                id: tbl.id || `table_${Date.now()}_${idx}`,
                title: tbl.title || `Notification Table #${idx + 1}`,
                headers: headers.length > 0 ? headers : ['Column 1', 'Column 2', 'Column 3', 'Column 4'],
                rows: rowsList.map(r => ({
                  cells: (Array.isArray(r) ? r : (r?.cells || [])).map(c => c !== undefined && c !== null ? String(c) : '')
                }))
              };
            }
            return null;
          })
          .filter(Boolean);
      }

      // Clean custom_fields payload
      let cleanedFields = [];
      if (Array.isArray(formData.custom_fields)) {
        cleanedFields = formData.custom_fields
          .filter(f => f && f.label && String(f.label).trim() !== '' && f.value && String(f.value).trim() !== '')
          .map(f => ({ label: String(f.label).trim(), value: String(f.value).trim() }));
      }

      const payload = {
        ...formData,
        skills: skillsArray,
        custom_tables: cleanedTables,
        custom_table: cleanedTables.length > 0 ? cleanedTables[0] : null,
        custom_fields: cleanedFields,
        status: statusOverride || formData.status,
        vacancies: formData.vacancies ? parseInt(formData.vacancies) : 0
      };

      if (isEditing) {
        await firebaseService.updateJobInFirestore(id, payload);
      } else {
        await firebaseService.createJobInFirestore(payload);
      }

      alert(`Job notification successfully ${isEditing ? 'updated' : 'published'}!`);
      navigate('/admin');
    } catch (err) {
      console.error('Save job error:', err);
      alert('Failed to save job: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-extrabold text-slate-800 text-sm">Loading Job Specification Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-36 w-full">
      {/* Sticky Top Header Bar */}
      <div className="bg-[#09090B]/95 backdrop-blur-xl text-white p-4 sticky top-[57px] md:top-[61px] z-30 shadow-md border-b border-white/10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-white">
                {isEditing ? 'Edit Job Notification' : 'Create Job / Recruitment Notice'}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Full-screen workspace editor with custom tables & key-value specifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('Draft')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs rounded-xl transition-all"
            >
              Save Draft
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('Published')}
              className="px-5 py-2 bg-gradient-to-r from-[#FF6B00] to-[#FF8500] hover:from-[#E05E00] hover:to-[#FF6B00] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Send size={15} />
              <span>{isEditing ? 'Update Notice' : 'Publish Opportunity'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-6 space-y-6">
        {/* Card 1: Basic Info & Branding */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-200/90 space-y-4">
          <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building size={18} /> Basic Notice & Organization Branding
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-extrabold text-slate-900 block mb-1">Job / Recruitment Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. INDIAN COAST GUARD GROUP C RECRUITMENT 2026"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-bold text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:bg-white"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Company / Organization *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. MINISTRY OF DEFENCE / GOVT OF INDIA"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-bold text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:bg-white"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-extrabold focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="Jobs">Private / Tech Jobs</option>
                <option value="Internships">Internships & Apprenticeships</option>
                <option value="Government">Government & PSU Recruitment</option>
                <option value="Entrance Exams">Entrance Exams & Admission Tests</option>
              </select>
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Sub Category</label>
              <input
                type="text"
                value={formData.sub_category}
                onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                placeholder="e.g. Software, Mechanical, Engineering, Medical"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Job / Notice Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-extrabold focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Internship">Internship</option>
                <option value="Contractual">Contractual / Govt Gazette</option>
                <option value="Entrance Exam">Entrance Exam / Admission Test</option>
              </select>
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Work Mode</label>
              <select
                value={formData.work_mode}
                onChange={(e) => setFormData({ ...formData, work_mode: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-extrabold focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Posting Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Hyderabad, Pan India, Bengaluru, Remote"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>

          {/* Company Logo Link / Upload */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Image size={16} className="text-[#FF6B00]" /> Company Logo Image Link / Upload
              </label>
              <span className="text-[10px] text-slate-500">Paste URL or upload image file</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={formData.logo || ''}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="flex-1 p-3 bg-white border border-slate-300/80 rounded-xl text-xs font-mono focus:outline-none focus:border-[#FF6B00]"
              />
              <label className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 flex-shrink-0 transition-all">
                <Upload size={14} />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Salary, Qualification & Criteria */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-200/90 space-y-4">
          <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award size={18} /> Compensation, Qualification & Requirements
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Salary / Compensation / Stipend</label>
              <input
                type="text"
                value={formData.salary || formData.stipend || ''}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. ₹18,000 - ₹81,100 / Month, ₹45,000 Stipend"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-bold text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Experience Required</label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="e.g. Fresher (0-1 Yrs), 2+ Years"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Qualification Required</label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="e.g. 10th, 12th Pass, B.Tech / B.E, Any Graduate"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Branch / Stream</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                placeholder="e.g. CSE, IT, ECE, Civil, All Streams"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-extrabold text-slate-900 block mb-1">Required Technical Skills (Comma Separated)</label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g. Java, Python, React, Data Structures"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-extrabold text-slate-900 block mb-1">Detailed Eligibility Criteria</label>
              <textarea
                rows={3}
                value={formData.eligibility}
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                placeholder="e.g. 10th / 12th Pass from recognized board. Minimum 50% aggregate."
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-medium text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Application Deadline</label>
              <input
                type="date"
                value={formData.application_deadline ? formData.application_deadline.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-bold text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Open Vacancies Count</label>
              <input
                type="number"
                value={formData.vacancies}
                onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
                placeholder="e.g. 50"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-extrabold text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Gazette PDF & Links */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-200/90 space-y-4">
          <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText size={18} /> Official PDF Gazette & Application Links
          </h2>

          {/* PDF Gazette Link / Upload */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <FileText size={16} className="text-[#FF6B00]" /> Official PDF Gazette / Advertisement Link
              </label>
              <span className="text-[10px] text-slate-500">Paste PDF URL or upload PDF file</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={formData.official_notification_url || ''}
                onChange={(e) => setFormData({ ...formData, official_notification_url: e.target.value })}
                placeholder="https://example.com/notification-gazette.pdf"
                className="flex-1 p-3 bg-white border border-slate-300/80 rounded-xl text-xs font-mono focus:outline-none focus:border-[#FF6B00]"
              />
              <label className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 flex-shrink-0 transition-all">
                <Upload size={14} />
                <span>Upload PDF</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileUpload(e, 'official_notification_url')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Official Application Link / URL *</label>
              <input
                type="url"
                required
                value={formData.application_url}
                onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                placeholder="https://company.example.com/apply"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-mono text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Source Provider Name</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g. Official Gazette, Recruiter Direct, Central Website"
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Description & Selection Process */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-200/90 space-y-4">
          <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText size={18} /> Description & Selection Process
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Detailed Job Description & Context</label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter detailed job description, duties, context, and responsibilities..."
                className="w-full p-3.5 bg-slate-50 border border-slate-300/80 rounded-2xl font-medium text-slate-900 focus:outline-none focus:border-[#FF6B00] leading-relaxed"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Selection Process Steps</label>
              <textarea
                rows={3}
                value={formData.selection_process || ''}
                onChange={(e) => setFormData({ ...formData, selection_process: e.target.value })}
                placeholder="e.g. 1. Written Test  2. Physical Fitness  3. Medical Exam"
                className="w-full p-3.5 bg-slate-50 border border-slate-300/80 rounded-2xl font-medium text-slate-900 focus:outline-none focus:border-[#FF6B00] leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Card 5: Custom Key-Value Columns */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
                <Sparkles size={18} /> Custom Key-Value Specification Columns ({formData.custom_fields?.length || 0})
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">Add custom specification fields like Age Limit, Application Fee, Service Bond, Exam Venue, etc.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const curFields = formData.custom_fields || [];
                setFormData(prev => ({
                  ...prev,
                  custom_fields: [...curFields, { label: '', value: '' }]
                }));
              }}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all"
            >
              + Add Field
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {['Age Limit', 'Application Fee', 'Service Bond', 'Exam Date / Venue', 'Cutoff Marks'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  const curFields = formData.custom_fields || [];
                  if (!curFields.some(f => f.label === preset)) {
                    setFormData(prev => ({
                      ...prev,
                      custom_fields: [...curFields, { label: preset, value: '' }]
                    }));
                  }
                }}
                className="px-2.5 py-1 bg-slate-50 hover:bg-orange-50 border border-slate-200 text-[10px] font-bold text-slate-700 rounded-lg transition-all"
              >
                + {preset}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {formData.custom_fields?.map((field, fIdx) => (
              <div key={fIdx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <input
                  type="text"
                  value={field.label || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newFields = [...(formData.custom_fields || [])];
                    newFields[fIdx] = { ...newFields[fIdx], label: val };
                    setFormData(prev => ({ ...prev, custom_fields: newFields }));
                  }}
                  placeholder="Field Label (e.g. Age Limit)"
                  className="w-1/3 p-2.5 bg-white border border-slate-300/80 rounded-xl text-xs font-extrabold focus:outline-none focus:border-[#FF6B00]"
                />
                <input
                  type="text"
                  value={field.value || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newFields = [...(formData.custom_fields || [])];
                    newFields[fIdx] = { ...newFields[fIdx], value: val };
                    setFormData(prev => ({ ...prev, custom_fields: newFields }));
                  }}
                  placeholder="Field Value (e.g. 18 to 30 Years)"
                  className="flex-1 p-2.5 bg-white border border-slate-300/80 rounded-xl text-xs font-medium focus:outline-none focus:border-[#FF6B00]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newFields = formData.custom_fields.filter((_, idx) => idx !== fIdx);
                    setFormData(prev => ({ ...prev, custom_fields: newFields }));
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1.5 font-extrabold text-base"
                  title="Remove field"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Multiple Custom Data Tables */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
                <Table size={18} /> Custom Data Tables ({formData.custom_tables?.length || 0})
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">Add multiple tables for Syllabus, Posts, Pay Scale, Exam Pattern, etc.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const newTable = createDefaultTable((formData.custom_tables?.length || 0) + 1);
                setFormData(prev => ({
                  ...prev,
                  custom_tables: [...(prev.custom_tables || []), newTable]
                }));
              }}
              className="px-3.5 py-1.5 bg-[#FF6B00] hover:bg-[#E05E00] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all"
            >
              + Add Another Table
            </button>
          </div>

          <div className="space-y-6">
            {formData.custom_tables?.map((table, tIdx) => (
              <div key={table.id || tIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-orange-100 text-[#FF6B00] text-[10px] font-black flex items-center justify-center">
                      #{tIdx + 1}
                    </span>
                    Table #{tIdx + 1} Configuration
                  </span>
                  {formData.custom_tables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newTables = formData.custom_tables.filter((_, idx) => idx !== tIdx);
                        setFormData(prev => ({ ...prev, custom_tables: newTables }));
                      }}
                      className="text-xs font-extrabold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Delete Table
                    </button>
                  )}
                </div>

                {/* Table Title */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Table Section Title</label>
                  <input
                    type="text"
                    value={table.title || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newTables = [...formData.custom_tables];
                      newTables[tIdx] = { ...newTables[tIdx], title: val };
                      setFormData(prev => ({ ...prev, custom_tables: newTables }));
                    }}
                    placeholder="e.g. Syllabus Breakdown / Category-wise Vacancies & Pay Scale"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                {/* Column Headers */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-slate-800">Column Headers ({table.headers?.length || 0})</label>
                    <button
                      type="button"
                      onClick={() => {
                        const curHeaders = table.headers || [];
                        const curRows = table.rows || [[]];
                        const newHeaders = [...curHeaders, `Column ${curHeaders.length + 1}`];
                        const newRows = curRows.map(row => [...row, '']);
                        const newTables = [...formData.custom_tables];
                        newTables[tIdx] = { ...newTables[tIdx], headers: newHeaders, rows: newRows };
                        setFormData(prev => ({ ...prev, custom_tables: newTables }));
                      }}
                      className="text-[10px] font-bold text-[#FF6B00] hover:underline"
                    >
                      + Add Column
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {table.headers?.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-1">
                        <input
                          type="text"
                          value={h}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newHeaders = [...table.headers];
                            newHeaders[hIdx] = val;
                            const newTables = [...formData.custom_tables];
                            newTables[tIdx] = { ...newTables[tIdx], headers: newHeaders };
                            setFormData(prev => ({ ...prev, custom_tables: newTables }));
                          }}
                          placeholder={`Header ${hIdx + 1}`}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#FF6B00]"
                        />
                        {table.headers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newHeaders = table.headers.filter((_, idx) => idx !== hIdx);
                              const newRows = table.rows.map(row => row.filter((_, idx) => idx !== hIdx));
                              const newTables = [...formData.custom_tables];
                              newTables[tIdx] = { ...newTables[tIdx], headers: newHeaders, rows: newRows };
                              setFormData(prev => ({ ...prev, custom_tables: newTables }));
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 font-bold text-xs"
                            title="Remove column"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rows Config */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-slate-800">Table Data Rows ({table.rows?.length || 0})</label>
                    <button
                      type="button"
                      onClick={() => {
                        const colCount = table.headers?.length || 4;
                        const newRow = new Array(colCount).fill('');
                        const newTables = [...formData.custom_tables];
                        newTables[tIdx] = { ...newTables[tIdx], rows: [...table.rows, newRow] };
                        setFormData(prev => ({ ...prev, custom_tables: newTables }));
                      }}
                      className="text-[10px] font-bold text-[#FF6B00] hover:underline"
                    >
                      + Add Row
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {table.rows?.map((row, rIdx) => {
                      const rowCells = Array.isArray(row) ? row : (row?.cells || []);
                      return (
                        <div key={rIdx} className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5 relative">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-b border-slate-100 pb-1">
                            <span>Row #{rIdx + 1}</span>
                            {table.rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newRows = table.rows.filter((_, idx) => idx !== rIdx);
                                  const newTables = [...formData.custom_tables];
                                  newTables[tIdx] = { ...newTables[tIdx], rows: newRows };
                                  setFormData(prev => ({ ...prev, custom_tables: newTables }));
                                }}
                                className="text-rose-600 font-extrabold text-[10px] hover:underline"
                              >
                                Delete Row
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                            {table.headers?.map((_, cIdx) => (
                              <input
                                key={cIdx}
                                type="text"
                                value={rowCells[cIdx] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newRows = table.rows.map((r, idx) => {
                                    if (idx !== rIdx) return r;
                                    const updatedRow = [...(Array.isArray(r) ? r : (r?.cells || []))];
                                    updatedRow[cIdx] = val;
                                    return updatedRow;
                                  });
                                  const newTables = [...formData.custom_tables];
                                  newTables[tIdx] = { ...newTables[tIdx], rows: newRows };
                                  setFormData(prev => ({ ...prev, custom_tables: newTables }));
                                }}
                                placeholder={table.headers[cIdx] || `Col ${cIdx + 1}`}
                                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#FF6B00]"
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
