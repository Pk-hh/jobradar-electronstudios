import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, CheckCircle2, Award, GraduationCap, MapPin, User, Save } from 'lucide-react';

export default function ProfileScreen() {
  const { user, updateProfile, isAdmin, setIsAdmin } = useAuth();
  const navigate = useNavigate();

  // Profile Edit State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('B.Tech');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState(2026);
  const [skillsText, setSkillsText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || 'Job Seeker');
      setPhone(user.phone || '');
      setQualification(user.qualification || 'B.Tech');
      setDegree(user.degree || '');
      setBranch(user.branch || '');
      setGraduationYear(user.graduation_year || 2026);
      setSkillsText(Array.isArray(user.skills) ? user.skills.join(', ') : '');
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const skillsArray = skillsText.split(',').map(s => s.trim()).filter(Boolean);
    try {
      await updateProfile({
        name,
        phone,
        qualification,
        degree,
        branch,
        graduation_year: parseInt(graduationYear),
        skills: skillsArray
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2200);
    } catch (err) {
      alert('Failed to save profile preferences');
    }
  };

  return (
    <div className="pb-28 sm:pb-32 space-y-6 w-full">
      {/* Edge-to-Edge Corporate Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FF6B00] text-white font-bold text-xl flex items-center justify-center">
              {name ? name.charAt(0).toUpperCase() : 'J'}
            </div>
            <div>
              <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">{name || 'Job Seeker'}</h1>
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-normal">
                <CheckCircle2 size={14} className="text-emerald-400" /> Career Profile & Preferences
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-8 lg:px-12 max-w-3xl space-y-4">
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold rounded-2xl flex items-center gap-2.5 shadow-2xs">
            <CheckCircle2 size={18} className="text-emerald-600" /> Preferences updated! Job recommendations will dynamically adapt to your profile.
          </div>
        )}

        {/* Instant Profile Customizer Form */}
        <form onSubmit={handleProfileSave} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] space-y-5 text-xs text-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Sparkles size={18} className="text-[#FF6B00]" /> Career Profile & Preference Engine
            </h2>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase bg-slate-100 px-2.5 py-1 rounded-full">Auto Saved</span>
          </div>

          <div>
            <label className="font-extrabold text-slate-900 block mb-1.5">Your Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rahul Sharma"
              className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl text-xs font-medium focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="font-extrabold text-slate-900 block mb-1.5">Phone Number (Optional for SMS / Alert Notifications)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl text-xs font-medium focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-extrabold text-slate-900 block mb-1.5">Highest Qualification</label>
              <select
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl text-xs font-extrabold focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all"
              >
                <option value="B.Tech">B.Tech / B.E</option>
                <option value="M.Tech">M.Tech / M.E</option>
                <option value="MCA">MCA / M.Sc CS</option>
                <option value="Degree">Degree / Any Graduate</option>
              </select>
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1.5">Graduation Year</label>
              <input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl text-xs font-medium focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="font-extrabold text-slate-900 block mb-1.5">Branch / Major Stream</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Computer Science & Engineering"
              className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl text-xs font-medium focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="font-extrabold text-slate-900 block mb-1.5">Technical & Core Skills (Comma Separated)</label>
            <textarea
              rows={2}
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="React, Node.js, Python, SQL, Java"
              className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-2xl text-xs font-medium focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all"
            />
            <span className="text-[10px] text-slate-500 font-semibold mt-1.5 block">Used by JobRadar recommendation engine to calculate profile match scores.</span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#FF6B00] via-[#FF7A00] to-[#FF8500] hover:shadow-lg hover:shadow-orange-500/20 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Save size={16} /> Save Career Preferences
          </button>
        </form>
      </div>
    </div>
  );
}

