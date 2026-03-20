import React, { useState } from 'react';
import { Settings, ShieldCheck, CheckCircle, AlertTriangle, Upload, Flame, Box, Droplets, Trash2, ArrowRight, Sliders } from 'lucide-react';
import MediaUploader from './MediaUploader';

const TechnicalOperationsView = ({ fetchWithAuth, harvests, batches, theme }) => {
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [preForm, setPreForm] = useState({
        harvest_id: '',
        method: 'Drying',
        photo_before: null,
        photo_after: null
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

            if (!res.ok) {
                let errorDetail = 'Failed to record pre-processing';
                try {
                    const errData = await res.json();
                    if (errData.detail) errorDetail = typeof errData.detail === 'string' ? errData.detail : (errData.detail[0]?.msg || errorDetail);
                } catch (e) { }
                throw new Error(errorDetail);
            }
            setMessage('SUCCESS: ✅ Pre-processing step verified and recorded!');
            setPreForm({ harvest_id: '', method: 'Drying', photo_before: null, photo_after: null });
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
                            <Sliders size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Biomass Pre-processing</h2>
                            <p className="text-sm text-green-200">Pre-processing and integrity workflows</p>
                        </div>
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
                                <MediaUploader
                                    file={preForm.photo_before}
                                    onChange={f => setPreForm({ ...preForm, photo_before: f })}
                                    label="Input State"
                                    required={true}
                                    className="aspect-square"
                                />
                                <MediaUploader
                                    file={preForm.photo_after}
                                    onChange={f => setPreForm({ ...preForm, photo_after: f })}
                                    label="Process Output"
                                    required={true}
                                    className="aspect-square"
                                />
                            </div>
                            <button type="submit" disabled={submitting} className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-600 hover:shadow-xl hover:shadow-green-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                {submitting ? 'Synchronizing...' : <><span>Log Process</span> <ArrowRight size={18} /></>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TechnicalOperationsView;
