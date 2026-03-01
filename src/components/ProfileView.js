import React, { useState, useRef } from 'react';
import { User, Phone, Mail, MapPin, Shield, Save, Camera, CheckCircle } from 'lucide-react';

const ProfileView = ({ currentUser, fetchWithAuth, showToast, theme, onUserUpdate, apiUrl }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        full_name: currentUser.full_name || '',
        phone_number: currentUser.phone_number || '',
        aadhaar_number: currentUser.aadhaar_number || '',
        address: currentUser.address || '',
        email: currentUser.email || ''
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Build full photo URL from relative path stored in DB
    const photoSrc = currentUser.photo_url
        ? `${apiUrl || 'http://localhost:8000'}${currentUser.photo_url}`
        : null;

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetchWithAuth('/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });
            if (res.ok) {
                showToast('Profile updated successfully!', 'success');
                setIsEditing(false);
            } else {
                const error = await res.json();
                throw new Error(error.detail || 'Failed to update profile');
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);
            // Do NOT set Content-Type manually — browser sets it with boundary for multipart
            const res = await fetchWithAuth('/auth/profile/photo', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const updatedUser = await res.json();
                // Update localStorage and notify parent component
                const stored = JSON.parse(localStorage.getItem('user') || '{}');
                const merged = { ...stored, photo_url: updatedUser.photo_url };
                localStorage.setItem('user', JSON.stringify(merged));
                if (onUserUpdate) onUserUpdate(merged);
                showToast('Profile photo updated!', 'success');
            } else {
                const error = await res.json();
                throw new Error(error.detail || 'Photo upload failed');
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setUploading(false);
            // Reset so same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const inputClass = `w-full pl-11 pr-4 py-3 border rounded-lg outline-none transition-all text-sm
        ${theme === 'dark'
            ? 'bg-slate-700 border-slate-600 text-white focus:border-green-500'
            : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-100'}
        disabled:opacity-60`;

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-16">

            {/* Profile Header Card */}
            <div className={`rounded-2xl overflow-hidden border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className={`px-8 py-8 ${theme === 'dark' ? 'bg-slate-800' : 'bg-green-50'}`}>
                    <div className="flex flex-col sm:flex-row items-center gap-6">

                        {/* Avatar with camera button */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-green-600 flex items-center justify-center text-white shadow-md overflow-hidden">
                                {photoSrc ? (
                                    <img
                                        src={photoSrc}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <span className="text-3xl font-bold">
                                        {currentUser.full_name?.charAt(0)?.toUpperCase() || currentUser.username?.charAt(0)?.toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Hidden file picker */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handlePhotoChange}
                            />

                            {/* Camera trigger button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute -bottom-2 -right-2 p-2 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 transition-all disabled:opacity-60"
                                title="Change profile photo"
                            >
                                {uploading ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Camera size={14} />
                                )}
                            </button>
                        </div>

                        {/* Name & Role */}
                        <div className="text-center sm:text-left">
                            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {currentUser.full_name || currentUser.username}
                            </h2>
                            <span className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full capitalize
                                ${theme === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                {currentUser.role}
                            </span>
                            <div className="flex flex-col sm:flex-row gap-3 mt-3">
                                <p className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                                    <Mail size={14} className="text-green-600" />
                                    {currentUser.email}
                                </p>
                                <p className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                                    <Phone size={14} className="text-green-600" />
                                    {currentUser.phone_number || 'No phone added'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                            <Shield size={20} className="text-green-600" />
                            Personal Information
                        </h3>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all
                                    ${theme === 'dark'
                                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input type="text" disabled={!isEditing} value={profile.full_name}
                                    onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                    className={inputClass} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input type="text" disabled={!isEditing} value={profile.phone_number}
                                    onChange={e => setProfile({ ...profile, phone_number: e.target.value })}
                                    className={inputClass} placeholder="+91 00000 00000" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>Aadhaar Number</label>
                            <div className="relative">
                                <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input type="text" disabled={!isEditing} value={profile.aadhaar_number}
                                    onChange={e => setProfile({ ...profile, aadhaar_number: e.target.value })}
                                    className={inputClass} placeholder="12-digit Aadhaar Number" />
                            </div>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>Residential Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <textarea disabled={!isEditing} value={profile.address}
                                    onChange={e => setProfile({ ...profile, address: e.target.value })}
                                    rows="3"
                                    className={inputClass + ' resize-none'}
                                    placeholder="House No, Village, Taluka, District..." />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="md:col-span-2 flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsEditing(false)}
                                    className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all
                                        ${theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* KYC Status Card */}
            <div className={`p-5 rounded-xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <CheckCircle size={20} />
                </div>
                <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>KYC Status</p>
                    <p className="text-sm text-blue-600 font-semibold">Level 1 Verified</p>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
