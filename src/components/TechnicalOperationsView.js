import React, { useState } from 'react';
import { Settings, ShieldCheck, CheckCircle, AlertTriangle, Upload, Flame, Box, Droplets, Trash2, ArrowRight } from 'lucide-react';

const TechnicalOperationsView = ({ fetchWithAuth, harvests, batches, theme }) => {
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [tab, setTab] = useState('preprocess'); // 'preprocess' or 'unburnable'

    const [preForm, setPreForm] = useState({
        harvest_id: '',
        method: 'Drying',
        photo_before: null,
        photo_after: null
    });

    const [unburnForm, setUnburnForm] = useState({
        batch_id: '',
        method: 'Clay Mixing',
        biochar_kg: '',
        additive_kg: '',
        photo: null
    });

    const handlePreSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        try {
            const formData = new FormData();
            formData.append('harvest_id', preForm.harvest_id);
            formData.append('method', preForm.method);
            if (preForm.photo_before) formData.append('photo_before', preForm.photo_before);
            if (preForm.photo_after) formData.append('photo_after', preForm.photo_after);

            const res = await fetchWithAuth('/harvest/preprocess', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Failed to record pre-processing');
            setMessage('SUCCESS: ✅ Pre-processing step verified and recorded!');
            setPreForm({ harvest_id: '', method: 'Drying', photo_before: null, photo_after: null });
        } catch (err) {
            setMessage(`ERROR: ❌ ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUnburnSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        try {
            const formData = new FormData();
            formData.append('batch_id', unburnForm.batch_id);
            formData.append('method', unburnForm.method);
            formData.append('biochar_kg', unburnForm.biochar_kg);
            formData.append('additive_kg', unburnForm.additive_kg);
            if (unburnForm.photo) formData.append('photo', unburnForm.photo);

            // Using the distribution router endpoint for unburnable logic
            const res = await fetchWithAuth('/distribution/unburnable', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Failed to record unburnable process');
            setMessage('SUCCESS: ✅ Biochar has been certified as unburnable!');
            setUnburnForm({ batch_id: '', method: 'Clay Mixing', biochar_kg: '', additive_kg: '', photo: null });
        } catch (err) {
            setMessage(`ERROR: ❌ ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className={`rounded-2xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {/* Simple Green Header */}
                <div className={`px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme === 'dark' ? 'bg-green-900 border-slate-700' : 'bg-green-700 border-green-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10">
                            <Settings size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Technical Operations</h2>
                            <p className="text-sm text-green-200">Pre-processing and integrity workflows</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setTab('preprocess')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'preprocess' ? 'bg-white text-green-700' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}`}>Pre-Process</button>
                        <button onClick={() => setTab('unburnable')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'unburnable' ? 'bg-white text-green-700' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}`}>Unburnable</button>
                    </div>
                </div>

                <div className="p-10">
                    {message && (
                        <div className={`mb-10 p-5 rounded-2xl flex items-start gap-4 animate-scale-in shadow-lg border-2 ${message.startsWith('SUCCESS') ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-red-800 border-red-100'
                            }`}>
                            <div className={`p-2 rounded-full ${message.startsWith('SUCCESS') ? 'bg-green-100' : 'bg-red-100'}`}>
                                {message.startsWith('SUCCESS') ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm uppercase mb-0.5">{message.startsWith('SUCCESS') ? 'Confirmed' : 'Action Required'}</h4>
                                <p className="text-sm font-medium opacity-90">{message.substring(message.indexOf(' ') + 1)}</p>
                            </div>
                        </div>
                    )}

                    {tab === 'preprocess' ? (
                        <form onSubmit={handlePreSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Target Harvest Batch</label>
                                    <select
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-bold text-gray-800 shadow-inner appearance-none"
                                        value={preForm.harvest_id}
                                        onChange={e => setPreForm({ ...preForm, harvest_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select ID</option>
                                        {harvests?.map(h => <option key={h.id} value={h.id}>H-{h.id} ({h.biomass_batch_id})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Processing Method</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Drying', 'Chipping', 'Shredding', 'Screening'].map(m => (
                                            <button
                                                key={m} type="button"
                                                onClick={() => setPreForm({ ...preForm, method: m })}
                                                className={`py-3 rounded-xl text-sm font-black transition-all border-2 ${preForm.method === m ? 'bg-green-600 text-white border-green-600 shadow-lg' : 'bg-white text-gray-600 border-gray-100 hover:border-green-200'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`relative aspect-square border-2 border-dashed rounded-[1.5rem] p-4 flex flex-col items-center justify-center transition-all ${preForm.photo_before ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <input type="file" accept="image/*" onChange={e => setPreForm({ ...preForm, photo_before: e.target.files[0] })} className="absolute inset-0 opacity-0 cursor-pointer z-10" required />
                                        <Upload className={`mb-2 ${preForm.photo_before ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span className="text-[10px] font-black text-gray-500 uppercase">Input State</span>
                                    </div>
                                    <div className={`relative aspect-square border-2 border-dashed rounded-[1.5rem] p-4 flex flex-col items-center justify-center transition-all ${preForm.photo_after ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <input type="file" accept="image/*" onChange={e => setPreForm({ ...preForm, photo_after: e.target.files[0] })} className="absolute inset-0 opacity-0 cursor-pointer z-10" required />
                                        <Upload className={`mb-2 ${preForm.photo_after ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span className="text-[10px] font-black text-gray-500 uppercase">Process Output</span>
                                    </div>
                                </div>
                                <button type="submit" disabled={submitting} className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-600 hover:shadow-xl hover:shadow-green-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                    {submitting ? 'Synchronizing...' : <><span>Log Process</span> <ArrowRight size={18} /></>}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleUnburnSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Biochar Source</label>
                                    <select
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-800"
                                        value={unburnForm.batch_id}
                                        onChange={e => setUnburnForm({ ...unburnForm, batch_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Batch</option>
                                        {batches?.map(b => <option key={b.id} value={b.batch_id}>{b.batch_id}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Biochar Qty (kg)</label>
                                    <input type="number" step="0.1" className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold" value={unburnForm.biochar_kg} onChange={e => setUnburnForm({ ...unburnForm, biochar_kg: e.target.value })} required placeholder="0.0" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Clay Additive (kg)</label>
                                    <input type="number" step="0.1" className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold" value={unburnForm.additive_kg} onChange={e => setUnburnForm({ ...unburnForm, additive_kg: e.target.value })} required placeholder="0.0" />
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className={`flex-1 relative border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all ${unburnForm.photo ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <input type="file" accept="image/*" onChange={e => setUnburnForm({ ...unburnForm, photo: e.target.files[0] })} className="absolute inset-0 opacity-0 cursor-pointer z-10" required />
                                    <Upload className={`mb-4 ${unburnForm.photo ? 'text-emerald-500' : 'text-gray-300'}`} size={40} />
                                    <h4 className="font-bold text-gray-900">Final Verification Photo</h4>
                                    <p className="text-xs text-gray-400 mt-1 uppercase font-black">{unburnForm.photo ? unburnForm.photo.name : 'Upload after mixing'}</p>
                                </div>
                                <div className="md:w-1/3 flex flex-col justify-center gap-4">
                                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                                        <h5 className="font-black text-xs text-emerald-700 uppercase mb-2 tracking-widest">Protocol Check</h5>
                                        <p className="text-[10px] leading-relaxed text-emerald-900/70 font-bold italic">Verification of unburnable state ensures credits meet the permanence requirements for CDR markets.</p>
                                    </div>
                                    <button type="submit" disabled={submitting} className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:scale-[1.02] shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2">
                                        {submitting ? 'Certifying...' : <><ShieldCheck size={20} /> <span>Submit for Audit</span></>}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TechnicalOperationsView;
