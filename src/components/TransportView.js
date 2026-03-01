import React, { useState } from 'react';
import { Truck, Upload, AlertTriangle, CheckCircle, Package, ArrowRight, MapPin, Navigation, Calendar, Info, ChevronRight, Fuel, ShieldCheck } from 'lucide-react';

const TransportView = ({ fetchWithAuth, batches, distributions, harvests, theme, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('inbound'); // 'inbound' or 'outbound'

    const [form, setForm] = useState({
        shipment_id: `SHP-${Math.floor(1000 + Math.random() * 9000)}`,
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

            if (!res.ok) {
                let errorDetail = 'Failed to record transport';
                try {
                    const errData = await res.json();
                    if (errData.detail) {
                        errorDetail = typeof errData.detail === 'string' ? errData.detail : (errData.detail[0]?.msg || errorDetail);
                    }
                } catch (e) { }
                throw new Error(errorDetail);
            }

            setMessage('SUCCESS: ✅ Transport record saved and synchronized!');
            setForm({
                shipment_id: `SHP-${Math.floor(1000 + Math.random() * 9000)}`,
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
                            <Truck size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Transport Log</h2>
                            <p className="text-sm text-green-200">Record biomass and biochar shipments</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setType('inbound')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${type === 'inbound' ? 'bg-white text-green-700' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}`}>Inbound</button>
                        <button onClick={() => setType('outbound')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${type === 'outbound' ? 'bg-white text-green-700' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}`}>Outbound</button>
                    </div>
                </div>

                <div className="p-1">
                    <div className="flex bg-gray-50 p-2 rounded-2xl m-6 gap-2 border border-gray-200">
                        <button
                            onClick={() => setType('inbound')}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === 'inbound'
                                ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-100'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <Package size={18} />
                            Inbound Shipment
                        </button>
                        <button
                            onClick={() => setType('outbound')}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === 'outbound'
                                ? 'bg-white text-green-600 shadow-md ring-1 ring-green-100'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <Navigation size={18} />
                            Outbound Logistics
                        </button>
                    </div>

                    <div className="px-8 pb-10">
                        {message && (
                            <div className={`p-5 rounded-2xl flex items-start gap-3 animate-scale-in shadow-sm mb-8 ${message.startsWith('SUCCESS') ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'
                                }`}>
                                <div className={`p-1.5 rounded-full mt-0.5 ${message.startsWith('SUCCESS') ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {message.startsWith('SUCCESS') ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                </div>
                                <span className="text-sm font-medium">{message.replace('SUCCESS: ', '').replace('ERROR: ', '')}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Trip Metadata */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <ShieldCheck size={18} className="text-gray-400" />
                                    <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs italic">Shipment Identifiers</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Shipment ID</label>
                                        <input
                                            type="text"
                                            value={form.shipment_id}
                                            onChange={(e) => setForm({ ...form, shipment_id: e.target.value })}
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono font-bold"
                                            placeholder="Auto-generated"
                                            required
                                        />
                                    </div>

                                    {type === 'inbound' ? (
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Source Harvest ID</label>
                                            <input
                                                type="text"
                                                value={form.harvest_id}
                                                onChange={(e) => setForm({ ...form, harvest_id: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                                                placeholder="Enter ID (e.g. BMB-... or 111)"
                                                required
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Distribution ID</label>
                                            <input
                                                type="text"
                                                value={form.distribution_id}
                                                onChange={(e) => setForm({ ...form, distribution_id: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold"
                                                placeholder="Enter ID"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Vehicle Details */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <Truck size={18} className="text-gray-400" />
                                    <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs italic">Asset Configuration</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Vehicle Category</label>
                                        <select
                                            value={form.vehicle_type}
                                            onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="Truck">Heavy Duty Truck</option>
                                            <option value="Mini Truck">Light Cargo Vehicle</option>
                                            <option value="Tractor">Agricultural Tractor</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Registration Plate</label>
                                        <input
                                            type="text"
                                            value={form.vehicle_number}
                                            onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all uppercase placeholder:italic"
                                            placeholder="e.g. MH-12-AB-1234"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Est. Quantity (kg)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={form.quantity_kg}
                                                onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                                                placeholder="0"
                                                required
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">KG</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Routing */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <MapPin size={18} className="text-gray-400" />
                                    <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs italic">Geospatial Routing</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Dispatch Point</label>
                                        <input
                                            type="text"
                                            value={form.route_from}
                                            onChange={(e) => setForm({ ...form, route_from: e.target.value })}
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Enter Origin"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Destination Hub</label>
                                        <input
                                            type="text"
                                            value={form.route_to}
                                            onChange={(e) => setForm({ ...form, route_to: e.target.value })}
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Enter Target"
                                            required
                                        />
                                    </div>
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[-10px] hidden md:block z-10">
                                        <div className="bg-white p-2 rounded-full shadow-lg border border-gray-100 text-gray-300">
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Media Verification */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <ShieldCheck size={18} className="text-gray-400" />
                                    <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs italic">Visual Proof of Custody</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={`relative group border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer ${form.loading_photo ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:border-blue-400 hover:bg-blue-50/10'
                                        }`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setForm({ ...form, loading_photo: e.target.files[0] })}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            required
                                        />
                                        <Upload className={`mx-auto mb-3 transition-transform group-hover:-translate-y-1 ${form.loading_photo ? 'text-blue-500' : 'text-gray-300'}`} size={32} />
                                        <h4 className="font-bold text-gray-900 text-sm">Dispatch Loading</h4>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                                            {form.loading_photo ? form.loading_photo.name : 'Photo at Source'}
                                        </p>
                                    </div>
                                    <div className={`relative group border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer ${form.unloading_photo ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:border-green-400 hover:bg-green-50/10'
                                        }`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setForm({ ...form, unloading_photo: e.target.files[0] })}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            required
                                        />
                                        <Upload className={`mx-auto mb-3 transition-transform group-hover:-translate-y-1 ${form.unloading_photo ? 'text-green-500' : 'text-gray-300'}`} size={32} />
                                        <h4 className="font-bold text-gray-900 text-sm">Arrival Inspection</h4>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                                            {form.unloading_photo ? form.unloading_photo.name : 'Photo at Destination'}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full group overflow-hidden relative rounded-2xl h-16 transition-all duration-300 active:scale-95 ${submitting ? 'bg-gray-400' : ''
                                    }`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r transition-transform group-hover:scale-105 ${type === 'inbound' ? 'from-blue-600 to-blue-500' : 'from-green-600 to-green-500'}`}></div>
                                <div className="relative flex items-center justify-center text-white font-bold text-lg gap-3">
                                    {submitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Recording GPS Data...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Truck size={22} className="group-hover:animate-bounce" />
                                            <span>Record {type === 'inbound' ? 'Inbound' : 'Outbound'} Logistics</span>
                                            <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-2 opacity-40">
                <div className="flex items-center gap-4 grayscale">
                    <Fuel size={14} />
                    <Navigation size={14} />
                    <Calendar size={14} />
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-900">Chain of Custody Protocol V3.42</div>
            </div>
        </div>
    );
};

export default TransportView;
