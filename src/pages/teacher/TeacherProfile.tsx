import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Building, Briefcase, GraduationCap, Check } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const TeacherProfile: React.FC = () => {
  const { success, error } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [phone, setPhone] = useState('');
  const [officeRoom, setOfficeRoom] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState<number | string>(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers/profile');
      setProfile(res.profile);
      setAllocations(res.allocations || []);
      setPhone(res.profile.phone || '');
      setOfficeRoom(res.profile.office_room || '');
      setQualification(res.profile.qualification || '');
      setExperience(res.profile.experience_years || 0);
    } catch (err: any) {
      error(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/teachers/profile', {
        phone,
        office_room: officeRoom,
        qualification,
        experience_years: Number(experience),
      });
      success('Faculty profile updated successfully');
      fetchProfile();
    } catch (err: any) {
      error(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <LoadingSpinner fullScreen message="Loading faculty profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
          {profile.full_name?.slice(0, 2).toUpperCase() || 'TC'}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {profile.designation}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">Employee ID: {profile.employee_id}</p>
          <p className="text-xs text-slate-500 mt-1">
            Department: {profile.department_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Institutional Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
            Institutional Assignment
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Department</p>
              <p className="font-semibold text-slate-800">{profile.department_name}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Designation</p>
              <p className="font-semibold text-slate-800">{profile.designation}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Institutional Email</p>
              <p className="font-semibold text-slate-800 truncate">{profile.email}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Assigned Courses</p>
              <div className="space-y-1 mt-1">
                {allocations.map((a: any) => (
                  <span
                    key={a.id}
                    className="inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mr-1 mb-1"
                  >
                    {a.subject_code} - {a.class_name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Editable Faculty Details Form */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="pb-3 border-b border-slate-100 mb-5">
            <h3 className="text-sm font-semibold text-slate-900">Contact & Office Details</h3>
            <p className="text-xs text-slate-500">
              Update office hours location, telephone extension, and academic credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Extension
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Office / Cabin Location
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={officeRoom}
                    onChange={(e) => setOfficeRoom(e.target.value)}
                    placeholder="e.g. Tech Block 3, Room 402"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Highest Academic Qualification
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. Ph.D. in Computer Science (MIT)"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Years of Teaching / Industry Experience
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="number"
                  min={0}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
                <Check className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
