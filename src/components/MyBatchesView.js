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

const MyBatchesView = ({ batches, transports = [], distributions = [], onDelete, theme, variant = 'default' }) => {
    const safeDate = (dateString) => {
        if (!dateString) return 'Pending';
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? 'Pending' : d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    const columns = [
        {
            key: 'batch_id',
            label: 'Biochar Batch ID',
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
        { key: 'biomass_input', label: 'Biomass used (kg)', align: 'center', render: v => <span className="font-medium">{v}</span> },
        { key: 'species', label: 'Biomass Species', align: 'center', render: (v, row) => <span className="font-medium text-slate-600">{row.species || v || 'Mixed Wood'}</span> },
        { key: 'biochar_output', label: 'Biochar quantity produced (kg)', align: 'center', render: v => <span className="font-bold text-emerald-700">{v}</span> },
        {
            key: 'outbound_shipment',
            label: 'Outbound Shipment done',
            align: 'center',
            render: (_, row) => {
                const isShipped = transports.some(t => t.type === 'outbound' && distributions.some(d => d.id === t.distribution_id && d.batch_id === row.id));
                return <span className={`font-bold ${isShipped ? 'text-green-600' : 'text-slate-400'}`}>{isShipped ? 'Yes' : 'No'}</span>;
            }
        },
        {
            key: 'outbound_date',
            label: 'Date of Outbound Shipment',
            align: 'center',
            render: (_, row) => {
                const transport = transports.find(t => t.type === 'outbound' && distributions.some(d => d.id === t.distribution_id && d.batch_id === row.id));
                return <span className="text-sm">{transport ? safeDate(transport.date) : 'Pending'}</span>;
            }
        },
        {
            key: 'biochar_application',
            label: 'Biochar application Done',
            align: 'center',
            render: (_, row) => {
                const hasApp = distributions.some(d => d.batch_id === row.id && d.applications && d.applications.length > 0);
                return <span className={`font-bold ${hasApp ? 'text-green-600' : 'text-slate-400'}`}>{hasApp ? 'Yes' : 'No'}</span>;
            }
        },
        {
            key: 'application_date',
            label: 'Date of Biochar Application',
            align: 'center',
            render: (_, row) => {
                const distWithApp = distributions.find(d => d.batch_id === row.id && d.applications && d.applications.length > 0);
                return <span className="text-sm">{distWithApp && distWithApp.applications[0]?.created_at ? safeDate(distWithApp.applications[0].created_at) : 'Pending'}</span>;
            }
        }
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

    if (variant === 'minimal') {
        return (
            <div className="w-full">
                <DataTable
                    accentColor="emerald"
                    columns={columns}
                    data={batches}
                    actions={actions}
                    pageSize={15}
                    emptyMessage="No batches found. Start production to record your first batch."
                    searchPlaceholder="Search by Batch ID or status…"
                    variant="minimal"
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-16 pt-2">
            <div className={`rounded-2xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="p-2">
                    <DataTable
                        accentColor="emerald"
                        columns={columns}
                        data={batches}
                        actions={actions}
                        pageSize={15}
                        emptyMessage="No batches found. Start production to record your first batch."
                        searchPlaceholder="Search by Batch ID or status…"
                        variant="default"
                    />
                </div>
            </div>
        </div>
    );
};

export default MyBatchesView;
