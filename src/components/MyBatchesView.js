import React from 'react';
import { Trash2, Package, Factory, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import DataTable from './DataTable';

const EfficiencyBar = ({ ratio }) => {
    const pct = Math.min((ratio || 0) * 100, 100);
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-blue-600">{pct.toFixed(0)}%</span>
            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

const BatchStatusBadge = ({ status, mlResult }) => {
    const cfg = {
        verified: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={11} /> },
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={11} /> },
        suspicious: { bg: 'bg-orange-100', text: 'text-orange-700', icon: <AlertTriangle size={11} /> },
    }[status] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: null };

    return (
        <div className="relative group/tooltip inline-block">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.text}`}>
                {cfg.icon}{status}
            </span>
            {status === 'suspicious' && mlResult?.reasons && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-gray-900 text-white text-xs rounded-2xl shadow-2xl
          opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                    <div className="flex items-center gap-1.5 mb-1.5 text-orange-400 font-bold">
                        <AlertTriangle size={12} /> ML Flags
                    </div>
                    <ul className="space-y-1">
                        {mlResult.reasons.map((r, i) => <li key={i} className="opacity-90 leading-snug">• {r}</li>)}
                    </ul>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
};

const MyBatchesView = ({ batches, onDelete, theme }) => {
    const columns = [
        {
            key: 'batch_id',
            label: 'Batch ID',
            mobileMain: true,
            render: (val) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                        <Factory size={14} />
                    </div>
                    <span className="font-bold text-gray-900">{val}</span>
                </div>
            ),
        },
        { key: 'biomass_input', label: 'Input (kg)', align: 'center', render: v => <span className="font-medium">{v}</span> },
        { key: 'biochar_output', label: 'Output (kg)', align: 'center', render: v => <span className="font-bold text-gray-800">{v}</span> },
        {
            key: 'ratio',
            label: 'Efficiency',
            align: 'center',
            render: (v) => <EfficiencyBar ratio={v} />,
        },
        {
            key: 'co2_removed',
            label: 'CO₂ Rem. (kg)',
            align: 'center',
            render: (v) => (
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-lg text-xs font-bold">
                    {v?.toFixed(1) ?? '—'}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (v, row) => <BatchStatusBadge status={v} mlResult={row.ml_result} />,
        },
    ];

    const actions = [
        {
            label: 'Delete batch',
            icon: <Trash2 size={15} />,
            colorClass: 'hover:!text-red-600 hover:!bg-red-50',
            onClick: (row) => onDelete(row.id),
        },
    ];

    const avgEfficiency = batches.length
        ? (batches.reduce((a, b) => a + (b.ratio || 0), 0) / batches.length * 100).toFixed(1)
        : '0.0';

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-16">
            <div className={`rounded-2xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {/* Simple Green Header */}
                <div className={`px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme === 'dark' ? 'bg-green-900 border-slate-700' : 'bg-green-700 border-green-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10">
                            <Package size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Manufacturing Batches</h2>
                            <p className="text-sm text-green-200">Production yields and carbon metrics</p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white`}>
                        Avg. Efficiency: {avgEfficiency}%
                    </div>
                </div>

                <div className="p-2">
                    <DataTable
                        title="Manufacturing Batches"
                        subtitle="Detailed logs of production yields and carbon sequestration metrics."
                        icon={<Package size={20} />}
                        accentColor="blue"
                        columns={columns}
                        data={batches}
                        actions={actions}
                        pageSize={8}
                        emptyMessage="No batches found. Start production to record your first batch."
                        searchPlaceholder="Search by Batch ID or status…"
                    />
                </div>
            </div>
        </div>
    );
};

export default MyBatchesView;
