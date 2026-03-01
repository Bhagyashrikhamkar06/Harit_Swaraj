import React, { useState } from 'react';
import { ShieldAlert, Globe, Factory, MapPin, CheckCircle, AlertTriangle, Upload, Camera, Search, ChevronRight, Info } from 'lucide-react';

const AuditSubmissionView = ({ fetchWithAuth, plots, theme }) => {
    const [auditType, setAuditType] = useState('field'); // 'field', 'manufacturing', 'application'
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const [form, setForm] = useState({
        plot_id: '',
        satellite_land_use: 'Agricultural Land',
        observed_land_use: 'Agricultural Land',
        facility_location_check: true,
        inbound_biomass_data: '',
        actual_biomass_data: '',
        biochar_production_data: '',
        application_plot_id: '',
        biochar_presence_verified: false,
        predicted_quantity_per_ha: '',
        photos: []
    });

    const handlePhotoChange = (e) => {
        setForm({ ...form, photos: Array.from(e.target.files) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('type', auditType);
            if (form.plot_id) formData.append('plot_id', form.plot_id);

            if (auditType === 'field') {
                formData.append('satellite_land_use', form.satellite_land_use);
                formData.append('observed_land_use', form.observed_land_use);
            } else if (auditType === 'manufacturing') {
                formData.append('facility_location_check', form.facility_location_check);
                formData.append('inbound_biomass_data', form.inbound_biomass_data || '{}');
                formData.append('actual_biomass_data', form.actual_biomass_data || '{}');
                formData.append('biochar_production_data', form.biochar_production_data || '{}');
            } else {
                formData.append('application_plot_id', form.application_plot_id);
                formData.append('biochar_presence_verified', form.biochar_presence_verified);
                formData.append('predicted_quantity_per_ha', form.predicted_quantity_per_ha);
            }

            form.photos.forEach(photo => {
                formData.append('photos', photo);
            });

            const res = await fetchWithAuth('/audit/submit', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                let errorDetail = 'Failed to submit audit';
                try {
                    const errData = await res.json();
                    if (errData.detail) errorDetail = typeof errData.detail === 'string' ? errData.detail : (errData.detail[0]?.msg || errorDetail);
                } catch (e) { }
                throw new Error(errorDetail);
            }
            setMessage('SUCCESS: ✅ Independent Audit Report successfully filed and timestamped.');
            setForm({ plot_id: '', satellite_land_use: 'Agricultural Land', observed_land_use: 'Agricultural Land', facility_location_check: true, inbound_biomass_data: '', actual_biomass_data: '', biochar_production_data: '', application_plot_id: '', biochar_presence_verified: false, predicted_quantity_per_ha: '', photos: [] });
        } catch (err) {
            setMessage(`ERROR: ❌ ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-16">
            <div className={`rounded-2xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {/* Simple Green Header */}
                <div className={`px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme === 'dark' ? 'bg-green-900 border-slate-700' : 'bg-green-700 border-green-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10">
                            <CheckCircle size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Independent Audit</h2>
                            <p className="text-sm text-green-200">Submit verification reports</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['field', 'manufacturing', 'application'].map(t => (
                            <button key={t} onClick={() => setAuditType(t)} className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${auditType === t ? 'bg-white text-green-700' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-10">
                    {message && (
                        <div className={`mb-10 p-5 rounded-2xl flex items-start gap-4 animate-scale-in border-2 ${message.startsWith('SUCCESS') ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-red-800 border-red-100'
                            }`}>
                            <div className={`p-2 rounded-full ${message.startsWith('SUCCESS') ? 'bg-green-100' : 'bg-red-100'}`}>
                                {message.startsWith('SUCCESS') ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            </div>
                            <p className="text-sm font-bold">{message.replace('SUCCESS: ', '').replace('ERROR: ', '')}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Assignment Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <Search size={16} className="text-slate-400" />
                                <h3 className="font-black text-slate-900 uppercase tracking-widest text-[11px] italic">Verified Assets</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Target Plot (KML Assigned)</label>
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 outline-none transition-all font-bold appearance-none"
                                        value={form.plot_id}
                                        onChange={e => setForm({ ...form, plot_id: e.target.value })}
                                    >
                                        <option value="">Select Assignment</option>
                                        {plots?.map(p => <option key={p.id} value={p.id}>{p.species} Plot ({p.village})</option>)}
                                    </select>
                                </div>
                                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex gap-3">
                                    <Info size={20} className="text-emerald-600 shrink-0" />
                                    <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase tracking-wider">
                                        Assigned 24 hours ago. Auditor must only use KML coordinates for location navigation. Complete all observation fields below.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Specific Audit Content */}
                        {auditType === 'field' && (
                            <section className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Globe size={20} className="text-slate-900" />
                                    <h4 className="font-black text-slate-900 uppercase text-xs">Land Use Comparison</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block pl-1">Historical Use (Satellite Data)</label>
                                        {['Open land', 'Forest (Agroforest)', 'Agricultural Land'].map(type => (
                                            <button key={type} type="button" onClick={() => setForm({ ...form, satellite_land_use: type })}
                                                className={`w-full py-4 px-5 rounded-2xl text-xs font-black uppercase text-left transition-all border-2 ${form.satellite_land_use === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block pl-1">Actual Use (Ground Observation)</label>
                                        {['Open land', 'Forest (Agroforest)', 'Agricultural Land'].map(type => (
                                            <button key={type} type="button" onClick={() => setForm({ ...form, observed_land_use: type })}
                                                className={`w-full py-4 px-5 rounded-2xl text-xs font-black uppercase text-left transition-all border-2 ${form.observed_land_use === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {auditType === 'manufacturing' && (
                            <section className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Factory size={20} className="text-slate-900" />
                                    <h4 className="font-black text-slate-900 uppercase text-xs">Batch Authenticity Check</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block pl-1">Today's Inbound Tonnage (JSON)</label>
                                        <textarea
                                            className="w-full h-32 px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-slate-900 outline-none transition-all font-mono text-xs"
                                            placeholder='{"batch_id": "B-101", "weight": 2.5}'
                                            value={form.inbound_biomass_data}
                                            onChange={e => setForm({ ...form, inbound_biomass_data: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block pl-1">Actual On-site Biomass (JSON)</label>
                                        <textarea
                                            className="w-full h-32 px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-slate-900 outline-none transition-all font-mono text-xs"
                                            placeholder='{"type": "Bamboo", "quantity": 1200}'
                                            value={form.actual_biomass_data}
                                            onChange={e => setForm({ ...form, actual_biomass_data: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            </section>
                        )}

                        {auditType === 'application' && (
                            <section className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <MapPin size={20} className="text-slate-900" />
                                    <h4 className="font-black text-slate-900 uppercase text-xs">Soil Carbon Sequestration Verification</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
                                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Biochar Particles Found?</span>
                                            <button type="button" onClick={() => setForm({ ...form, biochar_presence_verified: !form.biochar_presence_verified })} className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${form.biochar_presence_verified ? 'bg-green-600 justify-end' : 'bg-slate-300 justify-start'}`}>
                                                <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block pl-1">Predicted Quantity (Kg/Ha)</label>
                                            <input type="number" step="0.1" className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-slate-900 outline-none transition-all font-bold" value={form.predicted_quantity_per_ha} onChange={e => setForm({ ...form, predicted_quantity_per_ha: e.target.value })} placeholder="Based on 4-point check" />
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 text-white p-6 rounded-[1.5rem] flex flex-col justify-center gap-2">
                                        <h5 className="font-black text-[10px] text-yellow-500 uppercase tracking-widest leading-loose">Visual Sampling Protocol</h5>
                                        <p className="text-[10px] text-white/50 leading-relaxed font-bold italic">Auditor must locate 4 random spots across the KML area and photograph physical biochar samples at each point.</p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Evidence Upload */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <Camera size={16} className="text-slate-400" />
                                <h3 className="font-black text-slate-900 uppercase tracking-widest text-[11px] italic">Auditable Multimedia Evidence</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className={`relative border-4 border-dashed rounded-[2rem] p-12 text-center transition-all ${form.photos.length > 0 ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <input type="file" multiple accept="image/*,video/*" capture="environment" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" required />
                                    <Upload className={`mx-auto mb-4 ${form.photos.length > 0 ? 'text-green-600' : 'text-slate-300'}`} size={48} />
                                    <h4 className="text-xl font-black text-slate-900 mb-2">Upload Visual Logs</h4>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        {form.photos.length > 0 ? `${form.photos.length} Photos Captured` : 'Min 4 photos required for field validation'}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full h-20 bg-slate-900 text-white rounded-[2rem] font-black text-xl uppercase tracking-widest hover:scale-[1.02] shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                            {submitting ? 'Encrypting & Filing...' : <><span>Submit Verified Report</span> <ChevronRight size={26} /></>}
                        </button>
                    </form>
                </div>
            </div>

            <div className="mt-10 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Independent Audit Relay Connected</p>
            </div>
        </div>
    );
};

export default AuditSubmissionView;
