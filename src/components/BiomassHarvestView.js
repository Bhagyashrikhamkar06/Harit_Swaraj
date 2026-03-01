import React, { useState } from 'react';
import { Leaf, Camera, Upload, AlertTriangle, CheckCircle, Info, ChevronRight, Zap, Target, Sliders, Scissors } from 'lucide-react';

const BiomassHarvestView = ({ plots, fetchWithAuth, theme, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('harvest'); // 'harvest' or 'preprocessing'
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Harvest Form State
    const [harvestForm, setHarvestForm] = useState({
        biomass_batch_id: `HRV-${Math.floor(1000 + Math.random() * 9000)}`,
        plot_id: '',
        actual_harvested_ton: '',
        photo_1: null,
        photo_2: null
    });

    // Preprocessing Form State
    const [processForm, setProcessForm] = useState({
        harvest_id: '',
        method: 'Drying',
        photo_before: null,
        photo_after: null
    });

    const handleHarvestSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('biomass_batch_id', harvestForm.biomass_batch_id);
            formData.append('plot_id', harvestForm.plot_id);
            formData.append('actual_harvested_ton', harvestForm.actual_harvested_ton);
            if (harvestForm.photo_1) formData.append('photo_1', harvestForm.photo_1);
            if (harvestForm.photo_2) formData.append('photo_2', harvestForm.photo_2);

            const res = await fetchWithAuth('/harvest/create', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                let errorDetail = 'Failed to record harvest';
                try {
                    const errData = await res.json();
                    if (errData.detail) {
                        errorDetail = typeof errData.detail === 'string' ? errData.detail : (errData.detail[0]?.msg || errorDetail);
                    }
                } catch (e) { }
                throw new Error(errorDetail);
            }

            setMessage('SUCCESS: ✅ Harvest recorded and logged to ledger!');
            setHarvestForm({
                biomass_batch_id: `HRV-${Math.floor(1000 + Math.random() * 9000)}`,
                plot_id: '',
                actual_harvested_ton: '',
                photo_1: null,
                photo_2: null
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            setMessage(`ERROR: ❌ ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleProcessSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('harvest_id', processForm.harvest_id);
            formData.append('method', processForm.method);
            if (processForm.photo_before) formData.append('photo_before', processForm.photo_before);
            if (processForm.photo_after) formData.append('photo_after', processForm.photo_after);

            const res = await fetchWithAuth('/harvest/preprocess', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                let errorDetail = 'Failed to record preprocessing';
                try {
                    const errData = await res.json();
                    if (errData.detail) {
                        errorDetail = typeof errData.detail === 'string' ? errData.detail : (errData.detail[0]?.msg || errorDetail);
                    }
                } catch (e) { }
                throw new Error(errorDetail);
            }

            setMessage('SUCCESS: ✅ Pre-processing operation verified!');
            setProcessForm({
                harvest_id: '',
                method: 'Drying',
                photo_before: null,
                photo_after: null
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
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
                            <Leaf size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Biomass Harvest</h2>
                            <p className="text-sm text-green-200">Record collection with photos and weight</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('harvest')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'harvest' ? 'bg-white text-green-700' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}`}>Harvest Log</button>
                        <button onClick={() => setActiveTab('preprocessing')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'preprocessing' ? 'bg-white text-green-700' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}`}>Pre-Process</button>
                    </div>
                </div>

                <div className="p-2">
                    {/* Premium Tabs */}
                    <div className="flex bg-gray-100/80 p-2 rounded-3xl m-8 gap-3 border border-gray-200/50 backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab('harvest')}
                            className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'harvest'
                                ? 'bg-white text-emerald-600 shadow-xl ring-1 ring-emerald-100 scale-[1.02]'
                                : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                                }`}
                        >
                            <Target size={20} />
                            Harvest Log
                        </button>
                        <button
                            onClick={() => setActiveTab('preprocessing')}
                            className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'preprocessing'
                                ? 'bg-white text-indigo-600 shadow-xl ring-1 ring-indigo-100 scale-[1.02]'
                                : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                                }`}
                        >
                            <Sliders size={20} />
                            Material Prep
                        </button>
                    </div>

                    <div className="px-10 pb-12">
                        {message && (
                            <div className={`p-6 rounded-[1.5rem] flex items-start gap-4 animate-scale-in shadow-sm mb-10 ${message.startsWith('SUCCESS') ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                                }`}>
                                <div className={`p-2 rounded-full mt-0.5 ${message.startsWith('SUCCESS') ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                    {message.startsWith('SUCCESS') ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm uppercase tracking-wide">{message.startsWith('SUCCESS') ? 'Transaction Confirmed' : 'Submission Failed'}</p>
                                    <p className="text-sm opacity-90">{message.replace('SUCCESS: ', '').replace('ERROR: ', '')}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'harvest' ? (
                            <form onSubmit={handleHarvestSubmit} className="space-y-10">
                                <section className="space-y-8">
                                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <Target size={18} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Extraction Data</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">Origin Plot <Info size={14} className="text-gray-300" /></label>
                                            <select
                                                value={harvestForm.plot_id}
                                                onChange={(e) => setHarvestForm({ ...harvestForm, plot_id: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-[1.25rem] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="">Select verified source</option>
                                                {plots.map(p => (
                                                    <option key={p.id} value={p.id}>{p.plot_id} — {p.species}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Yield Batch ID</label>
                                            <input
                                                type="text"
                                                value={harvestForm.biomass_batch_id}
                                                readOnly
                                                className="w-full px-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-[1.25rem] outline-none font-mono font-bold text-emerald-700 cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-full">
                                            <label className="text-sm font-bold text-gray-700">Actual Harvest Weight</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={harvestForm.actual_harvested_ton}
                                                    onChange={(e) => setHarvestForm({ ...harvestForm, actual_harvested_ton: e.target.value })}
                                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-[1.25rem] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-lg"
                                                    placeholder="0.00"
                                                    required
                                                />
                                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400 uppercase tracking-tighter">Metric Tons</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-8">
                                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <Camera size={18} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Field Verification Photos</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[1, 2].map((num) => (
                                            <div
                                                key={num}
                                                className={`relative group border-2 border-dashed rounded-[1.75rem] p-10 text-center transition-all cursor-pointer ${harvestForm[`photo_${num}`] ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/10'
                                                    }`}
                                            >
                                                <input
                                                    type="file"
                                                    accept="image/*,video/*" capture="environment"
                                                    onChange={(e) => setHarvestForm({ ...harvestForm, [`photo_${num}`]: e.target.files[0] })}
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    required
                                                />
                                                <Upload className={`mx-auto mb-3 transition-transform group-hover:-translate-y-1 ${harvestForm[`photo_${num}`] ? 'text-emerald-500' : 'text-gray-300'}`} size={36} />
                                                <h4 className="font-bold text-gray-900 text-sm italic">Capture Point {num}</h4>
                                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black">
                                                    {harvestForm[`photo_${num}`] ? harvestForm[`photo_${num}`].name : 'Required for Verification'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full group overflow-hidden relative rounded-[1.5rem] h-16 transition-all duration-300 active:scale-95"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 transition-transform group-hover:scale-105"></div>
                                    <div className="relative flex items-center justify-center text-white font-bold text-lg gap-3">
                                        {submitting ? (
                                            <>
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Encrypting Audit Data...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Target size={22} className="group-hover:rotate-12 transition-transform" />
                                                <span>Finalize Harvest Record</span>
                                                <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </div>
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleProcessSubmit} className="space-y-10">
                                <section className="space-y-8">
                                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Scissors size={18} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Material Treatment</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Source Harvest ID</label>
                                            <input
                                                type="text"
                                                value={processForm.harvest_id}
                                                onChange={(e) => setProcessForm({ ...processForm, harvest_id: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                                                placeholder="Enter ID from harvest list"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Methodology</label>
                                            <select
                                                value={processForm.method}
                                                onChange={(e) => setProcessForm({ ...processForm, method: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold appearance-none"
                                                required
                                            >
                                                <option value="Drying">Sun Drying</option>
                                                <option value="Chipping">Mechanical Chipping</option>
                                                <option value="Compaction">Compaction / Bailing</option>
                                                <option value="Manual">Manual Preparation</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-8">
                                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Zap size={18} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Process Integrity Photos</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className={`relative group border-2 border-dashed rounded-[1.75rem] p-10 text-center transition-all cursor-pointer ${processForm.photo_before ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/10'
                                            }`}>
                                            <input
                                                type="file"
                                                accept="image/*,video/*" capture="environment"
                                                onChange={(e) => setProcessForm({ ...processForm, photo_before: e.target.files[0] })}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                required
                                            />
                                            <Upload className={`mx-auto mb-3 transition-transform group-hover:-translate-y-1 ${processForm.photo_before ? 'text-indigo-500' : 'text-gray-300'}`} size={36} />
                                            <h4 className="font-bold text-gray-900 text-sm italic">Input Material</h4>
                                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black">
                                                {processForm.photo_before ? processForm.photo_before.name : 'Photo: Before Treatment'}
                                            </p>
                                        </div>
                                        <div className={`relative group border-2 border-dashed rounded-[1.75rem] p-10 text-center transition-all cursor-pointer ${processForm.photo_after ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/10'
                                            }`}>
                                            <input
                                                type="file"
                                                accept="image/*,video/*" capture="environment"
                                                onChange={(e) => setProcessForm({ ...processForm, photo_after: e.target.files[0] })}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                required
                                            />
                                            <Upload className={`mx-auto mb-3 transition-transform group-hover:-translate-y-1 ${processForm.photo_after ? 'text-indigo-500' : 'text-gray-300'}`} size={36} />
                                            <h4 className="font-bold text-gray-900 text-sm italic">Output Result</h4>
                                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black">
                                                {processForm.photo_after ? processForm.photo_after.name : 'Photo: After Treatment'}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full group overflow-hidden relative rounded-[1.5rem] h-16 transition-all duration-300 active:scale-95"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 transition-transform group-hover:scale-105"></div>
                                    <div className="relative flex items-center justify-center text-white font-bold text-lg gap-3">
                                        {submitting ? (
                                            <>
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Registering Process...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sliders size={22} className="group-hover:scale-110 transition-transform" />
                                                <span>Seal Pre-processing Log</span>
                                                <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </div>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-2 opacity-50 grayscale">
                <div className="flex items-center gap-6">
                    <Target size={16} />
                    <Leaf size={16} />
                    <Sliders size={16} />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-900">Carbon Asset Tracking Protocol</div>
            </div>
        </div >
    );
};

export default BiomassHarvestView;
