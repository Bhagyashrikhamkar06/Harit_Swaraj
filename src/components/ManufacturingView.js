import React, { useState } from 'react';
import { Factory, Upload, Camera, CheckCircle, Info, ChevronRight, Video, FileText, Droplets, Zap, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ManufacturingView = ({ fetchWithAuth, fetchBatches, fetchDashboardData, theme, onSuccess }) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [batchForm, setBatchForm] = useState({
        batch_id: `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
        biomass_input: '',
        biochar_output: '',
        kiln_type: 'Batch Retort Kiln',
        species: '',
        video: null,
        photo: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('batch_id', batchForm.batch_id);
            formData.append('biomass_input', batchForm.biomass_input);
            formData.append('biochar_output', batchForm.biochar_output);
            formData.append('kiln_type', batchForm.kiln_type);
            formData.append('species', batchForm.species);

            if (batchForm.video) {
                formData.append('video', batchForm.video);
            }
            if (batchForm.photo) {
                formData.append('photo', batchForm.photo);
            }

            const response = await fetchWithAuth('/manufacturing/record', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to record batch');
            }

            setMessage(`SUCCESS: ✅ Batch recorded successfully! Output: ${data.biochar_output}kg`);
            setBatchForm({
                batch_id: `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
                biomass_input: '',
                biochar_output: '',
                kiln_type: 'Batch Retort Kiln',
                species: '',
                video: null,
                photo: null
            });

            // Refresh batches
            if (fetchBatches) fetchBatches();
            if (fetchDashboardData) fetchDashboardData();
            if (onSuccess) onSuccess();
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
                            <Factory size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Production Batch</h2>
                            <p className="text-sm text-green-200">Record biochar production batches</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white">
                        Batch Process
                    </div>
                </div>

                <div className="p-8 md:p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <FileText size={18} className="text-gray-400" />
                                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Production Details</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        Batch Reference ID
                                        <Info size={14} className="text-gray-400" />
                                    </label>
                                    <input
                                        type="text"
                                        value={batchForm.batch_id}
                                        onChange={(e) => setBatchForm({ ...batchForm, batch_id: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium"
                                        placeholder="e.g. BCH-005"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        Pyrolysis Technology
                                    </label>
                                    <select
                                        value={batchForm.kiln_type}
                                        onChange={(e) => setBatchForm({ ...batchForm, kiln_type: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="Batch Retort Kiln">Retort Kiln (Standard)</option>
                                        <option value="Continuous Retort">Industrial Continuous</option>
                                        <option value="TLUD">TLUD Gasifier</option>
                                        <option value="Rocket Kiln">Precision Rocket Kiln</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        Biomass Input Weight
                                        <Droplets size={14} className="text-blue-500" />
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={batchForm.biomass_input}
                                            onChange={(e) => setBatchForm({ ...batchForm, biomass_input: e.target.value })}
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-gray-800"
                                            placeholder="0.0"
                                            required
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase">kg</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        Biochar Output Weight
                                        <Zap size={14} className="text-yellow-500" />
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={batchForm.biochar_output}
                                            onChange={(e) => setBatchForm({ ...batchForm, biochar_output: e.target.value })}
                                            className="w-full px-5 py-3 bg-green-50/50 border border-green-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-green-800"
                                            placeholder="0.0"
                                            required
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-green-600 font-bold text-xs uppercase">kg</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Specific Biomass Varieties</label>
                                <input
                                    type="text"
                                    value={batchForm.species}
                                    onChange={(e) => setBatchForm({ ...batchForm, species: e.target.value })}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                    placeholder="e.g. Mixed Agrichar, Woodchips, Bamboo"
                                />
                            </div>
                        </section>

                        {/* Media Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <Camera size={18} className="text-gray-400" />
                                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Evidence Calibration</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div
                                    className={`relative group border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${batchForm.video ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:border-blue-400 hover:bg-blue-50/10'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => setBatchForm({ ...batchForm, video: e.target.files[0] })}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="relative">
                                        <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${batchForm.video ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'
                                            }`}>
                                            <Video size={28} />
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-1">Production Video</h4>
                                        <p className="text-xs text-gray-500 px-4">
                                            {batchForm.video ? `Selected: ${batchForm.video.name}` : 'Upload video of kiln operation for higher verification'}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className={`relative group border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${batchForm.photo ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200 hover:border-purple-400 hover:bg-purple-50/10'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setBatchForm({ ...batchForm, photo: e.target.files[0] })}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="relative">
                                        <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${batchForm.photo ? 'bg-purple-500 text-white' : 'bg-white text-purple-500'
                                            }`}>
                                            <Camera size={28} />
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-1">Result Photo</h4>
                                        <p className="text-xs text-gray-500 px-4">
                                            {batchForm.photo ? `Selected: ${batchForm.photo.name}` : 'Upload photo of the produced biochar cooling'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Status Message */}
                        {message && (
                            <div className={`p-5 rounded-2xl flex items-start gap-3 animate-scale-in shadow-sm ${message.startsWith('SUCCESS') ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'
                                }`}>
                                <div className={`p-1.5 rounded-full mt-0.5 ${message.startsWith('SUCCESS') ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {message.startsWith('SUCCESS') ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                </div>
                                <span className="text-sm font-medium">{message.replace('SUCCESS: ', '').replace('ERROR: ', '')}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full group mt-4 overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 transition-transform group-hover:scale-105"></div>
                            <div className="relative h-14 flex items-center justify-center text-white font-bold text-lg rounded-2xl group-active:scale-95 transition-all">
                                {submitting ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Saving Production...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Record Production Batch</span>
                                        <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                                    </div>
                                )}
                            </div>
                        </button>
                    </form>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-gray-400 opacity-60 grayscale scale-90">
                <Factory size={24} />
                <div className="h-10 w-[1px] bg-gray-300"></div>
                <div className="text-xs font-bold uppercase tracking-widest">Global Biochar Standard V2.0</div>
            </div>
        </div>
    );
};

export default ManufacturingView;
