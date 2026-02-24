import React, { useState } from 'react';
import { Upload, MapPin, Camera, CheckCircle, AlertTriangle, Info, Map, Leaf, Scale, Move, ChevronRight, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BiomassIdView = ({
    plotForm,
    setPlotForm,
    fetchWithAuth,
    refreshData,
    theme
}) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handlePhotoChange = (index, file) => {
        const newPhotos = [...plotForm.photos];
        newPhotos[index] = file;
        setPlotForm({ ...plotForm, photos: newPhotos });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('plot_id', plotForm.plot_id);
            formData.append('type', plotForm.type);
            formData.append('species', plotForm.species);
            formData.append('area', plotForm.area);
            formData.append('expected_biomass', plotForm.expected_biomass);
            formData.append('survey_number', plotForm.survey_number);
            formData.append('village', plotForm.village);
            formData.append('taluka', plotForm.taluka);
            formData.append('district', plotForm.district);

            plotForm.photos.forEach((photo, idx) => {
                if (photo) formData.append(`photo_${idx}`, photo);
            });

            if (plotForm.kml_file) {
                formData.append('kml_file', plotForm.kml_file);
            }

            if (!plotForm.plot_id || plotForm.plot_id.length < 3) {
                throw new Error("Plot ID is required and must be valid.");
            }

            const response = await fetchWithAuth('/biomass/register-plot', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to register plot');
            }

            setMessage(`SUCCESS: ✅ Plot registered successfully! ID: ${data.plot_id}`);
            setPlotForm({
                plot_id: `PLT-${Math.floor(1000 + Math.random() * 9000)}`,
                type: 'Wood',
                species: '',
                area: '',
                expected_biomass: '',
                survey_number: '',
                village: '',
                taluka: '',
                district: '',
                photos: [null, null, null, null],
                kml_file: null
            });

            if (refreshData) refreshData();

        } catch (err) {
            console.error("Submit Error:", err);
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
                            <h2 className="text-lg font-semibold text-white">Biomass Registration</h2>
                            <p className="text-sm text-green-200">Register land parcels with geospatial data</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white">
                        Parcel Onboarding
                    </div>
                </div>

                <div className="p-8 md:p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: Plot Details */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <MapPin size={18} className="text-gray-400" />
                                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Origin Data</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Plot Reference ID</label>
                                    <input
                                        type="text"
                                        value={plotForm.plot_id}
                                        onChange={(e) => setPlotForm({ ...plotForm, plot_id: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium"
                                        placeholder="e.g. PLT-702"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Biomass Classification</label>
                                    <select
                                        value={plotForm.type}
                                        onChange={(e) => setPlotForm({ ...plotForm, type: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="Wood">Forestry / Wood Waste</option>
                                        <option value="Agricultural Waste">Agro-Residues (Rice, Wheat, Corn)</option>
                                        <option value="Invasive Species">Invasive Species (Lantana, etc.)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Flora Species</label>
                                    <input
                                        type="text"
                                        value={plotForm.species}
                                        onChange={(e) => setPlotForm({ ...plotForm, species: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium"
                                        placeholder="e.g. Teak, Rice Husk, Bamboo"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Est. Area (ac)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={plotForm.area}
                                            onChange={(e) => setPlotForm({ ...plotForm, area: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                            placeholder="0.0"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Yield (t)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={plotForm.expected_biomass}
                                            onChange={(e) => setPlotForm({ ...plotForm, expected_biomass: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                            placeholder="0.0"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 1.5: Land Record Details (7/12) */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <FileText size={18} className="text-gray-400" />
                                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Land Record (7/12) Details</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Survey No / Gat Number</label>
                                    <input
                                        type="text"
                                        value={plotForm.survey_number}
                                        onChange={(e) => setPlotForm({ ...plotForm, survey_number: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium"
                                        placeholder="e.g. 104/1A"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Village</label>
                                    <input
                                        type="text"
                                        value={plotForm.village}
                                        onChange={(e) => setPlotForm({ ...plotForm, village: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium"
                                        placeholder="e.g. Ralegan Siddhi"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Taluka</label>
                                    <input
                                        type="text"
                                        value={plotForm.taluka}
                                        onChange={(e) => setPlotForm({ ...plotForm, taluka: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium"
                                        placeholder="e.g. Parner"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">District</label>
                                    <input
                                        type="text"
                                        value={plotForm.district}
                                        onChange={(e) => setPlotForm({ ...plotForm, district: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium"
                                        placeholder="e.g. Ahmednagar"
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Mapping Info */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <Map size={18} className="text-gray-400" />
                                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Geo-Verification</h3>
                            </div>

                            <div
                                className={`relative group border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${plotForm.kml_file ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:border-green-400 hover:bg-green-50/10'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept=".kml"
                                    onChange={(e) => setPlotForm({ ...plotForm, kml_file: e.target.files[0] })}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    required
                                />
                                <div className="relative">
                                    <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${plotForm.kml_file ? 'bg-green-500 text-white' : 'bg-white text-green-500 shadow-sm'
                                        }`}>
                                        <Upload size={32} />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-1">Boundary Mapping (KML)</h4>
                                    <p className="text-xs text-gray-500 px-10">
                                        {plotForm.kml_file ? `Selected: ${plotForm.kml_file.name}` : 'Drop your KML file here or click to browse. We use this to verify coordinates with satellite imagery.'}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Visual Proof */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <Camera size={18} className="text-gray-400" />
                                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Visual Documentation</h3>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[0, 1, 2, 3].map((idx) => (
                                    <div
                                        key={idx}
                                        className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all ${plotForm.photos[idx] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-green-500 hover:bg-white'
                                            }`}
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handlePhotoChange(idx, e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            required
                                        />
                                        <Camera className={`mx-auto mb-2 transition-colors ${plotForm.photos[idx] ? 'text-green-500' : 'text-gray-300'}`} size={20} />
                                        <div className="text-[10px] font-bold text-gray-600 truncate px-1">
                                            {plotForm.photos[idx] ? plotForm.photos[idx].name : `View ${idx + 1}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-blue-50/50 rounded-2xl flex items-start gap-3">
                                <Info size={16} className="text-blue-500 mt-0.5" />
                                <p className="text-[11px] text-blue-700 leading-relaxed font-medium">Please provide 4 distinct photos covering the area boundary and biomass health. Geo-tagging metadata in photos will accelerate verification.</p>
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
                            className="w-full group mt-4 overflow-hidden relative rounded-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 transition-transform group-hover:scale-105"></div>
                            <div className="relative h-14 flex items-center justify-center text-white font-bold text-lg group-active:scale-95 transition-all">
                                {submitting ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Saving Record...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Register Biomass Plot</span>
                                        <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                                    </div>
                                )}
                            </div>
                        </button>
                    </form>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-gray-400 opacity-60">
                <div className="flex items-center gap-3 grayscale">
                    <MapPin size={20} />
                    <Upload size={20} />
                    <CheckCircle size={20} />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em]">Verified Registry Interface</div>
            </div>
        </div>
    );
};

export default BiomassIdView;
