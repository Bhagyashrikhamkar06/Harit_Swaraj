import React, { useState } from 'react';
import { Users, MapPin, Phone, Globe, Scale, CheckCircle, AlertTriangle, ArrowRight, UserPlus, ShieldCheck, ChevronRight } from 'lucide-react';

const CustomerIdentificationView = ({ fetchWithAuth, theme, showToast, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        customer_id: '',
        block: '',
        village: '',
        contact_number: '',
        biochar_application: 'Soil Amendment',
        expected_demand: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const res = await fetchWithAuth('/customers/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                let errorDetail = 'Failed to register customer';
                try {
                    const errData = await res.json();
                    errorDetail = (errData.detail && typeof errData.detail === 'string') ? errData.detail : (errData.detail?.[0]?.msg || errorDetail);
                } catch (e) { }
                throw new Error(errorDetail);
            }
            
            setMessage('SUCCESS: ✅ Customer registered successfully!');
            setFormData({
                customer_id: '',
                block: '',
                village: '',
                contact_number: '',
                biochar_application: 'Soil Amendment',
                expected_demand: ''
            });
            
            if (onSuccess) onSuccess();
        } catch (err) {
            setMessage(`ERROR: ❌ ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const inputClasses = `w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 appearance-none ${theme === 'dark' ? '!bg-slate-900/50 !text-white !border-slate-700' : ''}`;
    const labelClasses = "text-sm font-bold text-gray-700 mb-2 block";
    const sectionHeaderClasses = "flex items-center gap-2 pb-2 border-b border-gray-100 mb-6";
    const sectionTitleClasses = "font-bold text-gray-900 uppercase tracking-wider text-xs italic";

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className={`rounded-2xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {/* Reference Style Header */}
                <div className={`px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme === 'dark' ? 'bg-green-900 border-slate-700' : 'bg-green-700 border-green-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10">
                            <Users size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Customer Identification</h2>
                            <p className="text-sm text-green-200">Register and manage end-users of biochar</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white">
                        Onboarding Form
                    </div>
                </div>

                <div className="p-10">
                    {message && (
                        <div className={`p-5 rounded-2xl flex items-start gap-3 animate-scale-in shadow-sm mb-8 ${message.startsWith('SUCCESS') ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                            <div className={`p-1.5 rounded-full mt-0.5 ${message.startsWith('SUCCESS') ? 'bg-green-100' : 'bg-red-100'}`}>
                                {message.startsWith('SUCCESS') ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                            </div>
                            <span className="text-sm font-medium">{message.replace('SUCCESS: ', '').replace('ERROR: ', '')}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Section 1: Personal Identifiers */}
                        <section className="space-y-6">
                            <div className={sectionHeaderClasses}>
                                <ShieldCheck size={18} className="text-gray-400" />
                                <h3 className={sectionTitleClasses}>Customer Identifiers</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={labelClasses}>Customer Id / Name</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="e.g. Mahabaleshwar Farms / John Doe"
                                        value={formData.customer_id}
                                        onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClasses}>Contact Number</label>
                                    <input
                                        type="tel"
                                        className={inputClasses}
                                        placeholder="e.g. +91 9876543210"
                                        value={formData.contact_number}
                                        onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Location Details */}
                        <section className="space-y-6">
                            <div className={sectionHeaderClasses}>
                                <MapPin size={18} className="text-gray-400" />
                                <h3 className={sectionTitleClasses}>Geospatial Location</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={labelClasses}>Block</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="e.g. Haveli"
                                        value={formData.block}
                                        onChange={e => setFormData({ ...formData, block: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClasses}>Village</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="e.g. Wagholi"
                                        value={formData.village}
                                        onChange={e => setFormData({ ...formData, village: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Usage Expectations */}
                        <section className="space-y-6">
                            <div className={sectionHeaderClasses}>
                                <Scale size={18} className="text-gray-400" />
                                <h3 className={sectionTitleClasses}>Application & Demand</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div className="space-y-2">
                                    <label className={labelClasses}>Biochar Application Type</label>
                                    <select
                                        className={inputClasses}
                                        value={formData.biochar_application}
                                        onChange={e => setFormData({ ...formData, biochar_application: e.target.value })}
                                        required
                                    >
                                        <option value="Soil Amendment">Soil Amendment / Farming</option>
                                        <option value="Paved Material">Construction / Paved Materials</option>
                                        <option value="Animal Feed">Animal Feed Supplement</option>
                                        <option value="Water Filtration">Water Filtration Media</option>
                                        <option value="Other">Other Industrial Use</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClasses}>Expected Demand (Ton)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            className={inputClasses}
                                            placeholder="0.0"
                                            value={formData.expected_demand}
                                            onChange={e => setFormData({ ...formData, expected_demand: e.target.value })}
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">TON</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full group overflow-hidden relative rounded-2xl h-16 transition-all duration-300 active:scale-95 ${submitting ? 'bg-gray-400' : ''}`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r transition-transform group-hover:scale-105 from-emerald-600 to-emerald-500`}></div>
                            <div className="relative flex items-center justify-center text-white font-bold text-lg gap-3">
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Synchronizing Registry...</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={22} className="group-hover:animate-bounce" />
                                        <span>Register Customer Identity</span>
                                        <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </div>
                        </button>
                    </form>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-2 opacity-40">
                <div className="flex items-center gap-4 grayscale">
                    <Users size={14} />
                    <Phone size={14} />
                    <Globe size={14} />
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-900">End-Customer Identity Protocol V1.02</div>
            </div>
        </div>
    );
};

export default CustomerIdentificationView;
