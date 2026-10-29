import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, ShieldAlert, Check, Calendar, HeartPulse } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const StudentProfile: React.FC = () => {
  const { success, error } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable approved fields state
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/profile');
      setProfile(res.profile);
      setPhone(res.profile.phone || '');
      setEmergencyContact(res.profile.emergency_contact || '');
      setAddress(res.profile.address || '');
      setDob(res.profile.date_of_birth || '');
      setBloodGroup(res.profile.blood_group || '');
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
      await api.put('/students/profile', {
        phone,
        emergency_contact: emergencyContact,
        address,
        date_of_birth: dob,
        blood_group: bloodGroup,
      });
      success('Personal contact details updated successfully.');
      fetchProfile();
    } catch (err: any) {
      error(err.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
          {profile.full_name?.slice(0, 2).toUpperCase() || 'ST'}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Student
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">Register No: {profile.register_number}</p>
          <p className="text-xs text-slate-500 mt-1">
            {profile.department_name} • {profile.class_name} • Semester {profile.semester}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Institutional records (Read-Only) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Official Records (Locked)
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Department</p>
              <p className="font-semibold text-slate-800">{profile.department_name}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Class Group</p>
              <p className="font-semibold text-slate-800">{profile.class_name}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Current Semester</p>
              <p className="font-semibold text-slate-800">Semester {profile.semester}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Enrollment Year</p>
              <p className="font-semibold text-slate-800">{profile.enrollment_year}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Institutional Email</p>
              <p className="font-semibold text-slate-800 truncate">{profile.email}</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 italic">
            Official academic registration fields can only be modified by the Registrar or Administration.
          </p>
        </div>

        {/* Right 2 cols: Editable Contact Details Form */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="pb-3 border-b border-slate-100 mb-5">
            <h3 className="text-sm font-semibold text-slate-900">Personal & Emergency Information</h3>
            <p className="text-xs text-slate-500">
              Students may update personal telephone, emergency contact, and residential address.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number
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
                  Emergency Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+1 (555) 999-9999"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group
                </label>
                <div className="relative">
                  <HeartPulse className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, city, state, zip code"
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
