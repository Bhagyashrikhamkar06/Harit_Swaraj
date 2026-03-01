import React, { useState } from 'react';
import { Package, Trash2, CheckCircle, AlertTriangle, Globe, MapPin } from 'lucide-react';
import DataTable from './DataTable';
import MediaUploader from './MediaUploader';
const DistributionView = ({ fetchWithAuth, batches, distributions, onDelete, theme, onSuccess }) => {
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
        setMessage('');
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
            setMessage('SUCCESS: ✅ Distribution recorded successfully!');
            setDisForm({ batch_id: '', customer_id: '', planned_use: 'Agriculture', location: '', quantity_kg: '', amount_rs: '' });
            if (onSuccess) onSuccess();
        } catch (err) {
            setMessage(`ERROR: ❌ ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAppSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
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

            if (!res.ok) {
                let errorDetail = 'Failed to record application';
                try {
                    const errData = await res.json();
                    if (errData.detail) {
                        errorDetail = typeof errData.detail === 'string' ? errData.detail : (errData.detail[0]?.msg || errorDetail);
                    }
                } catch (e) { }
                throw new Error(errorDetail);
            }
            setMessage('SUCCESS: ✅ Application recorded!');
            setAppForm({ distribution_id: '', purpose: 'Agriculture', photo: null, kml_file: null });
            if (onSuccess) onSuccess();
        } catch (err) {
            setMessage(`ERROR: ❌ ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // --- DataTable columns for distributions ---
    const distColumns = [
        {
            key: 'customer_id',
            label: 'Customer ID',
            mobileMain: true,
            render: (v) => <span className="font-bold text-gray-900">{v}</span>,
        },
        {
            key: 'batch_id',
            label: 'Batch',
            render: (v) => (
                <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-bold">{v}</span>
            ),
        },
        {
            key: 'planned_use',
            label: 'Usage',
            render: (v) => (
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">{v}</span>
            ),
        },
        {
            key: 'location',
            label: 'Location',
            render: (v) => (
                <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                    {v || '—'}
                </div>
            ),
        },
        {
            key: 'quantity_kg',
            label: 'Qty (kg)',
            align: 'center',
            render: (v) => <span className="font-bold text-green-600">{v}</span>,
        },
        {
            key: 'amount_rs',
            label: 'Amount (₹)',
            align: 'right',
            render: (v) => v ? <span className="font-medium">₹{v}</span> : '—',
        },
    ];

    const distActions = [
        {
            label: 'Delete',
            icon: <Trash2 size={15} />,
            colorClass: 'hover:!text-red-600 hover:!bg-red-50',
            onClick: (row) => onDelete(row.id),
        },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
            <div className={`rounded-2xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {/* Simple Green Header */}
                <div className={`px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme === 'dark' ? 'bg-green-900 border-slate-700' : 'bg-green-700 border-green-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10">
                            <Package size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Distribution & Application</h2>
                            <p className="text-sm text-green-200">Certified carbon sink documentation</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('distribution')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'distribution' ? 'bg-white text-green-700' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}`}>Distribution</button>
                        <button onClick={() => setActiveTab('application')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'application' ? 'bg-white text-green-700' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}`}>Field Application</button>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mx-6 mt-6 p-4 rounded-2xl flex items-start gap-3 animate-scale-in shadow-sm ${message.startsWith('SUCCESS') ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                        <div className={`p-1.5 rounded-full mt-0.5 ${message.startsWith('SUCCESS') ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            {message.startsWith('SUCCESS') ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        </div>
                        <span className="text-sm font-medium">{message.replace('SUCCESS: ', '').replace('ERROR: ', '')}</span>
                    </div>
                )}

                <div className="px-8 pb-8">
                    {activeTab === 'distribution' && (
                        <form onSubmit={handleDisSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Select Batch</label>
                                    <select
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all appearance-none"
                                        value={disForm.batch_id}
                                        onChange={e => setDisForm({ ...disForm, batch_id: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Select Batch --</option>
                                        {batches.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.batch_id} ({b.biochar_output} kg)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Customer ID</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all"
                                        value={disForm.customer_id}
                                        onChange={e => setDisForm({ ...disForm, customer_id: e.target.value })}
                                        placeholder="e.g. CUST-001"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Planned Use</label>
                                    <select
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all appearance-none"
                                        value={disForm.planned_use}
                                        onChange={e => setDisForm({ ...disForm, planned_use: e.target.value })}
                                    >
                                        <option value="Agriculture">Agriculture</option>
                                        <option value="Horticulture">Horticulture</option>
                                        <option value="Soil Remediation">Soil Remediation</option>
                                        <option value="Carbon Credit Market">Carbon Credit Market</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Location</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all"
                                        value={disForm.location}
                                        onChange={e => setDisForm({ ...disForm, location: e.target.value })}
                                        placeholder="City / Village"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Quantity (kg)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-bold"
                                        value={disForm.quantity_kg}
                                        onChange={e => setDisForm({ ...disForm, quantity_kg: e.target.value })}
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Amount (Rs)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-bold"
                                        value={disForm.amount_rs}
                                        onChange={e => setDisForm({ ...disForm, amount_rs: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-60 active:scale-95"
                            >
                                {submitting ? (
                                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving...</span></>
                                ) : (
                                    <><Package size={20} /><span>Record Distribution</span></>
                                )}
                            </button>
                        </form>
                    )}

                    {activeTab === 'application' && (
                        <form onSubmit={handleAppSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Distribution ID</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                                        value={appForm.distribution_id}
                                        onChange={e => setAppForm({ ...appForm, distribution_id: e.target.value })}
                                        placeholder="Enter Distribution ID (e.g. 1)"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Purpose</label>
                                    <select
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                                        value={appForm.purpose}
                                        onChange={e => setAppForm({ ...appForm, purpose: e.target.value })}
                                    >
                                        <option value="Agriculture">Agriculture</option>
                                        <option value="Horticulture">Horticulture</option>
                                        <option value="Soil Remediation">Soil Remediation</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <MediaUploader
                                    file={appForm.photo}
                                    onChange={(f) => setAppForm({ ...appForm, photo: f })}
                                    label="📸 Application Photo"
                                    required={true}
                                />
                                <div className={`relative group border - 2 border - dashed rounded - 2xl p - 6 text - center transition - all cursor - pointer ${appForm.kml_file ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:border-green-400'} `}>
                                    <input type="file" accept=".kml" onChange={e => setAppForm({ ...appForm, kml_file: e.target.files[0] })} className="absolute inset-0 opacity-0 cursor-pointer z-10" required />
                                    <div className="text-sm font-bold text-gray-700 mb-1">🗺️ Applied Land KML</div>
                                    <div className="text-xs text-gray-400">{appForm.kml_file ? appForm.kml_file.name : 'Click to upload'}</div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-60 active:scale-95"
                            >
                                {submitting ? (
                                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving...</span></>
                                ) : (
                                    <><MapPin size={20} /><span>Record Application</span></>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* ── Distribution History Table ── */}
            <DataTable
                title="Recent Distributions"
                subtitle={`${distributions?.length || 0} records`}
                icon={<Package size={20} />}
                accentColor="purple"
                columns={distColumns}
                data={distributions || []}
                actions={distActions}
                pageSize={6}
                emptyMessage="No distribution records found. Record a distribution above."
                searchPlaceholder="Search customer, batch, location…"
            />
        </div>
    );
};

export default DistributionView;
