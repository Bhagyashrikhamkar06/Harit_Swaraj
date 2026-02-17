import React, { useState } from 'react';
import { Truck, Upload, AlertTriangle, CheckCircle, Package } from 'lucide-react';

const TransportView = ({ fetchWithAuth, batches, distributions, harvests }) => {
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('inbound'); // 'inbound' or 'outbound'

    const [form, setForm] = useState({
        shipment_id: '',
        vehicle_type: 'Truck',
        vehicle_number: '',
        mileage: '',
        route_from: '',
        route_to: '',
        quantity_kg: '',
        harvest_id: '',       // For inbound
        distribution_id: '',  // For outbound
        loading_photo: null,
        unloading_photo: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('transport_type', type);
            formData.append('shipment_id', form.shipment_id);
            formData.append('vehicle_type', form.vehicle_type);
            formData.append('vehicle_number', form.vehicle_number);

            if (form.mileage) formData.append('mileage', form.mileage);
            if (form.route_from) formData.append('route_from', form.route_from);
            if (form.route_to) formData.append('route_to', form.route_to);
            if (form.quantity_kg) formData.append('quantity_kg', form.quantity_kg);

            if (type === 'inbound' && form.harvest_id) formData.append('harvest_id', form.harvest_id);
            if (type === 'outbound' && form.distribution_id) formData.append('distribution_id', form.distribution_id);

            if (form.loading_photo) formData.append('loading_photo', form.loading_photo);
            if (form.unloading_photo) formData.append('unloading_photo', form.unloading_photo);

            const res = await fetchWithAuth('/transport/record', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Failed to record transport');

            setMessage('✅ Transport record saved!');
            setForm({
                shipment_id: '',
                vehicle_type: 'Truck',
                vehicle_number: '',
                mileage: '',
                route_from: '',
                route_to: '',
                quantity_kg: '',
                harvest_id: '',
                distribution_id: '',
                loading_photo: null,
                unloading_photo: null
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
                <Truck className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold">Logistics & Transportation</h2>
            </div>

            <div className="flex gap-4 border-b mb-6">
                <button
                    onClick={() => setType('inbound')}
                    className={`pb-2 px-4 font-medium ${type === 'inbound' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                >
                    Inbound (Harvest → Factory)
                </button>
                <button
                    onClick={() => setType('outbound')}
                    className={`pb-2 px-4 font-medium ${type === 'outbound' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
                >
                    Outbound (Biochar → Customer)
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shipment ID</label>
                        <input
                            type="text"
                            value={form.shipment_id}
                            onChange={(e) => setForm({ ...form, shipment_id: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="SHP-2023-001"
                            required
                        />
                    </div>

                    {type === 'inbound' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Source Harvest ID</label>
                            <input
                                type="number"
                                value={form.harvest_id}
                                onChange={(e) => setForm({ ...form, harvest_id: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="Enter Harvest ID"
                                required
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Distribution ID</label>
                            <input
                                type="number"
                                value={form.distribution_id}
                                onChange={(e) => setForm({ ...form, distribution_id: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="Enter Distribution ID"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                        <select
                            value={form.vehicle_type}
                            onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                        >
                            <option value="Truck">Truck</option>
                            <option value="Mini Truck">Mini Truck</option>
                            <option value="Tractor">Tractor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                        <input
                            type="text"
                            value={form.vehicle_number}
                            onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="MH-12-AB-1234"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Route From</label>
                        <input
                            type="text"
                            value={form.route_from}
                            onChange={(e) => setForm({ ...form, route_from: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Route To</label>
                        <input
                            type="text"
                            value={form.route_to}
                            onChange={(e) => setForm({ ...form, route_to: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500 mb-2">Loading Photo</p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setForm({ ...form, loading_photo: e.target.files[0] })}
                            className="hidden"
                            id="t-photo-1"
                            required
                        />
                        <label htmlFor="t-photo-1" className="cursor-pointer text-blue-600 text-sm">
                            {form.loading_photo ? form.loading_photo.name : 'Upload'}
                        </label>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500 mb-2">Unloading Photo</p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setForm({ ...form, unloading_photo: e.target.files[0] })}
                            className="hidden"
                            id="t-photo-2"
                            required
                        />
                        <label htmlFor="t-photo-2" className="cursor-pointer text-blue-600 text-sm">
                            {form.unloading_photo ? form.unloading_photo.name : 'Upload'}
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:bg-gray-400 ${type === 'inbound' ? 'bg-blue-600' : 'bg-green-600'}`}
                >
                    {submitting ? 'Recording...' : `Record ${type === 'inbound' ? 'Inbound' : 'Outbound'} Transport`}
                </button>
            </form>
        </div>
    );
};

export default TransportView;
