import React, { useState } from 'react';
import { Package, Truck, MapPin } from 'lucide-react';

const DistributionView = ({ fetchWithAuth, batches, distributions, onDelete }) => {
    const [activeTab, setActiveTab] = useState('distribution');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const [disForm, setDisForm] = useState({
        batch_id: '',
        customer_id: '',
        planned_use: 'Agriculture',
        location: '',
        quantity_kg: '',
        amount_rs: ''
    });

    const [appForm, setAppForm] = useState({
        distribution_id: '',
        purpose: 'Agriculture',
        photo: null,
        kml_file: null
    });

    const handleDisSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('batch_id', disForm.batch_id);
            formData.append('customer_id', disForm.customer_id);
            formData.append('planned_use', disForm.planned_use);
            formData.append('location', disForm.location);
            formData.append('quantity_kg', disForm.quantity_kg);
            formData.append('amount_rs', disForm.amount_rs);

            const res = await fetchWithAuth('/distribution/record', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Failed to record distribution');
            setMessage('✅ Distribution Recorded');
        } catch (err) {
            setMessage(`❌ Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAppSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('distribution_id', appForm.distribution_id);
            formData.append('purpose', appForm.purpose);
            if (appForm.photo) formData.append('photo', appForm.photo);
            if (appForm.kml_file) formData.append('kml_file', appForm.kml_file);

            const res = await fetchWithAuth('/distribution/application', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Failed to record application');
            setMessage('✅ Application Recorded');
        } catch (err) {
            setMessage(`❌ Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Package className="text-purple-600" />
                Distribution & Application
            </h2>

            <div className="flex gap-4 border-b mb-6">
                <button
                    onClick={() => setActiveTab('distribution')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'distribution' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
                >
                    Distribution (Sale)
                </button>
                <button
                    onClick={() => setActiveTab('application')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'application' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
                >
                    Field Application
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {activeTab === 'distribution' && (
                <form onSubmit={handleDisSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Select Batch</label>
                            <select
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                value={disForm.batch_id}
                                onChange={e => setDisForm({ ...disForm, batch_id: e.target.value })}
                                required
                            >
                                <option value="">-- Select Batch --</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.batch_id}>
                                        {b.batch_id} ({b.biochar_output} kg)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Customer ID</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg"
                                value={disForm.customer_id}
                                onChange={e => setDisForm({ ...disForm, customer_id: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Quantity (Kg)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border rounded-lg"
                                value={disForm.quantity_kg}
                                onChange={e => setDisForm({ ...disForm, quantity_kg: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Amount (Rs)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border rounded-lg"
                                value={disForm.amount_rs}
                                onChange={e => setDisForm({ ...disForm, amount_rs: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium">
                        {submitting ? 'Saving...' : 'Record Distribution'}
                    </button>
                </form>
            )}

            {activeTab === 'application' && (
                <form onSubmit={handleAppSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Distribution ID</label>
                        <input
                            type="number"
                            className="w-full px-4 py-2 border rounded-lg"
                            value={appForm.distribution_id}
                            onChange={e => setAppForm({ ...appForm, distribution_id: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Purpose</label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg"
                            value={appForm.purpose}
                            onChange={e => setAppForm({ ...appForm, purpose: e.target.value })}
                        >
                            <option value="Agriculture">Agriculture</option>
                            <option value="Horticulture">Horticulture</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                            <label className="block text-sm font-medium mb-1">Application Photo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setAppForm({ ...appForm, photo: e.target.files[0] })}
                                required
                            />
                        </div>
                        <div className="border rounded-lg p-4">
                            <label className="block text-sm font-medium mb-1">Applied Land KML</label>
                            <input
                                type="file"
                                accept=".kml"
                                onChange={e => setAppForm({ ...appForm, kml_file: e.target.files[0] })}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
                        {submitting ? 'Saving...' : 'Record Application'}
                    </button>
                </form>
            )}
            {/* Distribution History Table */}
            <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Recent Distributions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Batch</th>
                                <th className="px-6 py-3">Usage</th>
                                <th className="px-6 py-3">Location</th>
                                <th className="px-6 py-3">Qty (kg)</th>
                                <th className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {distributions && distributions.length > 0 ? (
                                distributions.map((dist) => (
                                    <tr key={dist.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{dist.customer_id}</td>
                                        <td className="px-6 py-4">{dist.batch_id}</td>
                                        <td className="px-6 py-4">{dist.planned_use}</td>
                                        <td className="px-6 py-4">{dist.location}</td>
                                        <td className="px-6 py-4 font-bold text-green-600">{dist.quantity_kg}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => onDelete(dist.id)}
                                                className="text-red-600 hover:text-red-900 font-medium text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No distribution records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DistributionView;
