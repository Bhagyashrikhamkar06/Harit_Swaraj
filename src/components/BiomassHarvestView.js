import React, { useState } from 'react';
import { Leaf, Camera, Upload, AlertTriangle, CheckCircle } from 'lucide-react';

const BiomassHarvestView = ({ plots, fetchWithAuth }) => {
    const [activeTab, setActiveTab] = useState('harvest'); // 'harvest' or 'preprocessing'
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Harvest Form State
    const [harvestForm, setHarvestForm] = useState({
        biomass_batch_id: '',
        plot_id: '',
        actual_harvested_ton: '',
        photo_1: null,
        photo_2: null
    });

    // Preprocessing Form State
    const [processForm, setProcessForm] = useState({
        harvest_id: '', // Should be a dropdown of existing harvests ideally
        method: '',
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

            if (!res.ok) throw new Error('Failed to record harvest');

            setMessage('✅ Harvest recorded successfully!');
            setHarvestForm({
                biomass_batch_id: '',
                plot_id: '',
                actual_harvested_ton: '',
                photo_1: null,
                photo_2: null
            });
        } catch (err) {
            console.error(err);
            setMessage(`❌ Error: ${err.message}`);
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

            if (!res.ok) throw new Error('Failed to record preprocessing');

            setMessage('✅ Preprocessing recorded successfully!');
            setProcessForm({
                harvest_id: '',
                method: '',
                photo_before: null,
                photo_after: null
            });
        } catch (err) {
            console.error(err);
            setMessage(`❌ Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-6">
                <Leaf className="text-green-600" size={24} />
                <h2 className="text-xl font-bold">Biomass Management</h2>
            </div>

            <div className="flex gap-4 border-b mb-6">
                <button
                    onClick={() => setActiveTab('harvest')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'harvest' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
                >
                    Harvest Recording
                </button>
                <button
                    onClick={() => setActiveTab('preprocessing')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'preprocessing' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
                >
                    Pre-processing
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {activeTab === 'harvest' && (
                <form onSubmit={handleHarvestSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Plot</label>
                            <select
                                value={harvestForm.plot_id}
                                onChange={(e) => setHarvestForm({ ...harvestForm, plot_id: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                required
                            >
                                <option value="">-- Select Plot --</option>
                                {plots.map(p => (
                                    <option key={p.id} value={p.id}>{p.plot_id} - {p.species}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                            <input
                                type="text"
                                value={harvestForm.biomass_batch_id}
                                onChange={(e) => setHarvestForm({ ...harvestForm, biomass_batch_id: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="BMS-2023-001"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harvested Amount (Tons)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={harvestForm.actual_harvested_ton}
                                onChange={(e) => setHarvestForm({ ...harvestForm, actual_harvested_ton: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Camera className="mx-auto text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500 mb-2">Photo Side 1</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setHarvestForm({ ...harvestForm, photo_1: e.target.files[0] })}
                                className="hidden"
                                id="h-photo-1"
                                required
                            />
                            <label htmlFor="h-photo-1" className="cursor-pointer text-green-600 text-sm">
                                {harvestForm.photo_1 ? harvestForm.photo_1.name : 'Choose Photo'}
                            </label>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Camera className="mx-auto text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500 mb-2">Photo Side 2</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setHarvestForm({ ...harvestForm, photo_2: e.target.files[0] })}
                                className="hidden"
                                id="h-photo-2"
                                required
                            />
                            <label htmlFor="h-photo-2" className="cursor-pointer text-green-600 text-sm">
                                {harvestForm.photo_2 ? harvestForm.photo_2.name : 'Choose Photo'}
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {submitting ? 'Recording...' : 'Save Harvest Record'}
                    </button>
                </form>
            )}

            {activeTab === 'preprocessing' && (
                <form onSubmit={handleProcessSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harvest ID (Internal)</label>
                        <input
                            type="number"
                            value={processForm.harvest_id}
                            onChange={(e) => setProcessForm({ ...processForm, harvest_id: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="Enter Harvest ID from list (TODO: Make dropdown)"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                        <input
                            type="text"
                            value={processForm.method}
                            onChange={(e) => setProcessForm({ ...processForm, method: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="Chipping/Drying"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-500 mb-2">Before Processing</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setProcessForm({ ...processForm, photo_before: e.target.files[0] })}
                                className="hidden"
                                id="p-photo-1"
                                required
                            />
                            <label htmlFor="p-photo-1" className="cursor-pointer text-green-600 text-sm">
                                {processForm.photo_before ? processForm.photo_before.name : 'Upload'}
                            </label>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-500 mb-2">After Processing</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setProcessForm({ ...processForm, photo_after: e.target.files[0] })}
                                className="hidden"
                                id="p-photo-2"
                                required
                            />
                            <label htmlFor="p-photo-2" className="cursor-pointer text-green-600 text-sm">
                                {processForm.photo_after ? processForm.photo_after.name : 'Upload'}
                            </label>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {submitting ? 'Recording...' : 'Save Pre-processing Record'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default BiomassHarvestView;
