import React from 'react';
import { Trash2, MapPin, AlertTriangle, ExternalLink, Clock } from 'lucide-react';
import DataTable from './DataTable';

const StatusBadge = ({ plot }) => (
    <div className="relative group/tooltip inline-block">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5
      ${plot.status === 'verified' ? 'bg-green-100 text-green-700'
                : plot.status === 'suspicious' ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-500'}`}
        >
            {plot.status === 'verified' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
            {plot.status === 'suspicious' && <AlertTriangle size={11} />}
            {plot.status === 'pending' && <Clock size={11} />}
            {plot.status}
        </span>

        {plot.status === 'suspicious' && plot.verification_data?.anomaly_reasons && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 bg-gray-900 text-white text-xs rounded-2xl shadow-2xl
        opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                <div className="flex items-center gap-2 mb-2 text-orange-400 font-bold border-b border-white/10 pb-2">
                    <AlertTriangle size={14} />
                    <span>Suspicious Activity Detected</span>
                </div>
                <ul className="space-y-1.5 opacity-90">
                    {plot.verification_data.anomaly_reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                            <span>{reason}</span>
                        </li>
                    ))}
                </ul>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
            </div>
        )}
    </div>
);

const PhotoStack = ({ photos, apiUrl }) => {
    if (!photos || photos.length === 0) return <span className="text-gray-300 text-xs">—</span>;
    return (
        <div className="flex -space-x-2 hover:space-x-1 transition-all">
            {photos.slice(0, 3).map((photo, i) => (
                <img
                    key={i}
                    src={`${apiUrl}/uploads/${photo.photo_path}`}
                    alt="plot"
                    className="w-10 h-10 object-cover rounded-xl border-2 border-white shadow-sm"
                />
            ))}
            {photos.length > 3 && (
                <div className="w-10 h-10 bg-gray-100 rounded-xl border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-500">
                    +{photos.length - 3}
                </div>
            )}
        </div>
    );
};

const MyPlotsView = ({ plots, onEdit, onDelete, apiUrl, theme }) => {
    const columns = [
        {
            key: 'plot_id',
            label: 'Plot ID',
            mobileMain: true,
            render: (val, row) => (
                <div>
                    <div className="font-bold text-gray-900">{val}</div>
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
        {
            key: 'photos',
            label: 'Photos',
            sortable: false,
            noSearch: true,
            render: (val, row) => <PhotoStack photos={row.photos} apiUrl={apiUrl} />,
        },
        {
            key: 'type',
            label: 'Type',
            render: (val, row) => (
                <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 mb-0.5">
                        {val}
                    </span>
                    <div className="text-xs font-semibold text-gray-600">{row.species}</div>
                </div>
            ),
        },
        { key: 'area', label: 'Area (ac)', align: 'center', render: v => v ?? '—' },
        { key: 'expected_biomass', label: 'Biomass (t)', align: 'center', render: v => v ?? '—' },
        {
            key: 'status',
            label: 'Status',
            render: (_, row) => <StatusBadge plot={row} />,
        },
    ];

    const actions = [
        {
            label: 'Edit plot',
            icon: <ExternalLink size={15} />,
            colorClass: 'hover:!text-blue-600 hover:!bg-blue-50',
            onClick: (row) => onEdit(row),
        },
        {
            label: 'Delete plot',
            icon: <Trash2 size={15} />,
            colorClass: 'hover:!text-red-600 hover:!bg-red-50',
            onClick: (row) => onDelete(row.id),
        },
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-16">
            <div className={`rounded-2xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {/* Simple Header */}
                <div className={`px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme === 'dark' ? 'bg-green-900 border-slate-700' : 'bg-green-700 border-green-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10">
                            <MapPin size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Plot Registry</h2>
                            <p className="text-sm text-green-200">Manage your registered land parcels</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white">
                        {plots?.length || 0} plots registered
                    </div>
                </div>

                <div className="p-2">
                    <DataTable
                        title="Registered Land Parcels"
                        subtitle="Your biomass plots and verification status."
                        icon={<MapPin size={20} />}
                        accentColor="green"
                        columns={columns}
                        data={plots}
                        actions={actions}
                        pageSize={8}
                        emptyMessage="Register your first plot to start carbon sequestration monitoring."
                        searchPlaceholder="Search by Plot ID, type, or species…"
                    />
                </div>
            </div>
        </div>
    );
};

export default MyPlotsView;
