import React, { useState } from 'react';
import { Upload, MapPin, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BiomassIdView = ({
    plotForm,
    setPlotForm,
    fetchWithAuth,
    refreshData
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

            plotForm.photos.forEach((photo, idx) => {
                if (photo) formData.append(`photo_${idx}`, photo);
            });

            // Handle file input properly - ensure it's a file
            if (plotForm.kml_file) {
                formData.append('kml_file', plotForm.kml_file);
            }

            // Explicitly check for valid plot ID
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

            setMessage(`✅ Plot registered successfully! Status: ${data.status}`);
            setPlotForm({
                plot_id: '',
                type: 'Wood',
                species: '',
                area: '',
                expected_biomass: '',
                photos: [null, null, null, null],
                kml_file: null
            });

            // Refresh plots
            if (refreshData) refreshData();

        } catch (err) {
            console.error("Submit Error:", err);
            setMessage(`❌ Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-6">
                <MapPin className="text-green-600" size={24} />
                <h2 className="text-xl font-bold">{t('biomass.title')}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('biomass.plot_id')}</label>
                        <input
                            type="text"
                            value={plotForm.plot_id}
                            onChange={(e) => setPlotForm({ ...plotForm, plot_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="PLT-002"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('biomass.type')}</label>
                        <select
                            value={plotForm.type}
                            onChange={(e) => setPlotForm({ ...plotForm, type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                        >
                            <option value="Wood">Wood</option>
                            <option value="Agricultural Waste">Agricultural Waste</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('biomass.species')}</label>
                        <input
                            type="text"
                            value={plotForm.species}
                            onChange={(e) => setPlotForm({ ...plotForm, species: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Bamboo"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('biomass.area')}</label>
                        <input
                            type="number"
                            step="0.1"
                            value={plotForm.area}
                            onChange={(e) => setPlotForm({ ...plotForm, area: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="2.5"
                            required
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('biomass.expected_biomass')}</label>
                        <input
                            type="number"
                            step="0.1"
                            value={plotForm.expected_biomass}
                            onChange={(e) => setPlotForm({ ...plotForm, expected_biomass: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="15.5"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('biomass.kml_upload')}</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-600 mb-2">Drop KML file or click to browse</p>
                        <input
                            type="file"
                            accept=".kml"
                            onChange={(e) => setPlotForm({ ...plotForm, kml_file: e.target.files[0] })}
                            className="hidden"
                            id="kml-upload"
                            required
                        />
                        <label htmlFor="kml-upload" className="cursor-pointer text-green-600 text-sm font-medium">
                            {plotForm.kml_file ? plotForm.kml_file.name : 'Choose file'}
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('biomass.photos')}</label>
                    <div className="grid grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map((idx) => (
                            <div key={idx} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                                <Camera className="mx-auto text-gray-400 mb-2" size={24} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handlePhotoChange(idx, e.target.files[0])}
                                    className="hidden"
                                    id={`photo-${idx}`}
                                    required
                                />
                                <label htmlFor={`photo-${idx}`} className="cursor-pointer block">
                                    <span className="text-green-600 text-sm font-medium">
                                        {plotForm.photos[idx] ? plotForm.photos[idx].name : 'Choose Photo'}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">Photo {idx + 1}</p>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                    {submitting ? t('common.loading') : t('biomass.register_plot')}
                </button>
            </form>
        </div>
    );
};

export default BiomassIdView;
