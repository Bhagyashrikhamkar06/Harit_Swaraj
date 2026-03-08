import React from 'react';
import { Trash2, MapPin, AlertTriangle, Eye, ExternalLink, Clock } from 'lucide-react';
import DataTable from './DataTable';


const MyPlotsView = ({ plots, harvests, transports, batches, onEdit, onDelete, apiUrl, theme, variant = 'default' }) => {
    const safeDate = (val) => {
        if (!val) return '—';
        const d = new Date(val);
        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN');
    };

    const columns = [
        {
            key: '__progress__',
            label: 'Progress',
            sortable: false,
            align: 'center',
            render: (_, row) => {
                const hrvs = harvests?.filter(h => h.plot_id === row.id) || [];
                const harvDone = hrvs.length > 0;
                const hrvIds = hrvs.map(h => h.id);
                const transDone = (transports?.filter(t => hrvIds.includes(t.harvest_id)) || []).length > 0;
                const bchs = batches?.filter(b => b.species === row.species && b.species !== null) || [];
                const mfgDone = bchs.length > 0;
                const steps = [harvDone, transDone, mfgDone, mfgDone];
                const labels = ['Harvest', 'Transport', 'Pre-proc', 'Mfg'];
                const done = [harvDone, transDone, mfgDone].filter(Boolean).length;
                const total = 3;
                return (
                    <div className="flex flex-col items-center gap-1 min-w-[80px]">
                        <div className="flex gap-1 items-center">
                            {[harvDone, transDone, mfgDone].map((s, i) => (
                                <div key={i} title={labels[i]}
                                    className={`h-2 w-5 rounded-full transition-all ${s ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                            ))}
                        </div>
                        <span className={`text-[10px] font-bold ${done === total ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {done}/{total}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'plot_id',
            label: 'Plot ID',
            mobileMain: true,
            render: (val, row) => (
                <div>
                    <div className="font-bold text-emerald-700">{val}</div>
                    {row.kml_path && (
                        <a
                            href={`${apiUrl}${row.kml_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                        >
                            <ExternalLink size={9} /> View KML
                        </a>
                    )}
                </div>
            ),
        },
        { key: 'species', label: 'Biomass Species', render: (_, row) => <span className="text-xs font-semibold text-gray-700">{row.species || '—'}</span> },
        { key: 'expected_biomass', label: 'Expected Biomass quantity', align: 'center', render: v => v ? `${v} t` : '—' },
        {
            key: 'harvesting_done',
            label: 'Harvesting Done (Yes/No)',
            align: 'center',
            render: (_, row) => {
                const hrvs = harvests?.filter(h => h.plot_id === row.id) || [];
                return hrvs.length > 0 ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-gray-400">No</span>;
            }
        },
        {
            key: 'biomass_harvested',
            label: 'Biomass Harvested (Ton)',
            align: 'center',
            render: (_, row) => {
                const hrvs = harvests?.filter(h => h.plot_id === row.id) || [];
                if (!hrvs.length) return '—';
                return hrvs.reduce((sum, h) => sum + (h.actual_harvested_ton || 0), 0).toFixed(2);
            }
        },
        {
            key: 'date_of_harvesting',
            label: 'Date of Harvesting',
            align: 'center',
            render: (_, row) => {
                const hrvs = harvests?.filter(h => h.plot_id === row.id) || [];
                return hrvs.length > 0 ? safeDate(hrvs[0].created_at) : '—';
            }
        },
        {
            key: 'transport_done',
            label: 'Transportation Done (Yes/No)',
            align: 'center',
            render: (_, row) => {
                const hrvIds = (harvests?.filter(h => h.plot_id === row.id) || []).map(h => h.id);
                const trans = transports?.filter(t => hrvIds.includes(t.harvest_id)) || [];
                return trans.length > 0 ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-gray-400">No</span>;
            }
        },
        {
            key: 'date_of_transport',
            label: 'Date of Transportation',
            align: 'center',
            render: (_, row) => {
                const hrvIds = (harvests?.filter(h => h.plot_id === row.id) || []).map(h => h.id);
                const trans = transports?.filter(t => hrvIds.includes(t.harvest_id)) || [];
                return trans.length > 0 ? safeDate(trans[0].date || trans[0].created_at) : '—';
            }
        },
        {
            key: 'preprocessing_done',
            label: 'Pre-processing done? (Yes/No)',
            align: 'center',
            render: (_, row) => {
                const bchs = batches?.filter(b => b.species === row.species && b.species !== null) || [];
                return bchs.length > 0 ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-gray-400">No</span>;
            }
        },
        {
            key: 'date_of_preprocessing',
            label: 'Date of Pre-processing',
            align: 'center',
            render: (_, row) => {
                const bchs = batches?.filter(b => b.species === row.species && b.species !== null) || [];
                return bchs.length > 0 ? safeDate(bchs[0].created_at) : '—';
            }
        },
        {
            key: 'mfg_done',
            label: 'Biochar mfg done (Yes/No)',
            align: 'center',
            render: (_, row) => {
                const bchs = batches?.filter(b => b.species === row.species && b.species !== null) || [];
                return bchs.length > 0 ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-gray-400">No</span>;
            }
        },
        {
            key: 'date_of_mfg',
            label: 'Date of Mfg',
            align: 'center',
            render: (_, row) => {
                const bchs = batches?.filter(b => b.species === row.species && b.species !== null) || [];
                return bchs.length > 0 ? safeDate(bchs[0].created_at) : '—';
            }
        }
    ];

    const actions = [
        {
            label: 'View',
            icon: <Eye size={15} />,
            showLabel: true,
            colorClass: 'hover:!text-emerald-700 hover:!bg-emerald-50',
            onClick: (row) => onEdit(row),
        },
        {
            label: 'Delete plot',
            icon: <Trash2 size={15} />,
            colorClass: 'hover:!text-red-600 hover:!bg-red-50',
            onClick: (row) => onDelete(row.id),
        },
    ];

    if (variant === 'minimal') {
        return (
            <div className="w-full">
                <DataTable
                    accentColor="green"
                    columns={columns}
                    data={plots}
                    actions={actions}
                    pageSize={15}
                    emptyMessage="Register your first plot to start carbon sequestration monitoring."
                    searchPlaceholder="Search by Plot ID, type, or species…"
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
                        accentColor="green"
                        columns={columns}
                        data={plots}
                        actions={actions}
                        pageSize={15}
                        emptyMessage="Register your first plot to start carbon sequestration monitoring."
                        searchPlaceholder="Search by Plot ID, type, or species…"
                        variant="default"
                    />
                </div>
            </div>
        </div>
    );
};

export default MyPlotsView;
