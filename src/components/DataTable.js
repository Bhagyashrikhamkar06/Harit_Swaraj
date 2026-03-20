import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, LayoutList, X } from 'lucide-react';

/**
 * DataTable — Reusable table with search, sort, pagination, and mobile card view.
 *
 * Props:
 *   columns  : [{key, label, sortable?, render?, mobileMain?, mobileSub?, align?}]
 *   data     : array of objects
 *   title    : string
 *   subtitle : string
 *   icon     : react element
 *   accentColor : 'green' | 'blue' | 'purple' | 'orange'
 *   actions  : [{label, icon, onClick, colorClass?, show?}]  (per-row actions)
 *   headerActions : react element (right side of header)
 *   pageSize : number (default 8)
 *   emptyMessage : string
 *   searchPlaceholder : string
 */

const ACCENT = {
    green: { ring: 'focus:ring-emerald-500', border: 'focus:border-emerald-500', badge: 'bg-emerald-50 text-emerald-700', row: 'hover:bg-emerald-50/20' },
    blue: { ring: 'focus:ring-blue-500', border: 'focus:border-blue-500', badge: 'bg-blue-50 text-blue-700', row: 'hover:bg-blue-50/20' },
    purple: { ring: 'focus:ring-purple-500', border: 'focus:border-purple-500', badge: 'bg-purple-50 text-purple-700', row: 'hover:bg-purple-50/20' },
    orange: { ring: 'focus:ring-orange-500', border: 'focus:border-orange-500', badge: 'bg-orange-50 text-orange-700', row: 'hover:bg-orange-50/20' },
};

const DataTable = ({
    columns = [],
    data = [],
    title = 'Records',
    subtitle = '',
    icon,
    accentColor = 'green',
    actions = [],
    headerActions,
    pageSize = 8,
    emptyMessage = 'No records found.',
    searchPlaceholder = 'Search records...',
    variant = 'default',
    renderCardFooter,
}) => {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'

    const accent = ACCENT[accentColor] || ACCENT.green;

    // --- Search ---
    const searchableKeys = columns.filter(c => !c.noSearch).map(c => c.key);
    const filtered = useMemo(() => {
        if (!search.trim()) return data;
        const q = search.toLowerCase();
        return data.filter(row =>
            searchableKeys.some(k => {
                const val = row[k];
                return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
            })
        );
    }, [data, search, searchableKeys]);

    // --- Sort ---
    const sorted = useMemo(() => {
        if (!sortKey) return filtered;
        return [...filtered].sort((a, b) => {
            const av = a[sortKey] ?? '';
            const bv = b[sortKey] ?? '';
            const cmp = typeof av === 'number' && typeof bv === 'number'
                ? av - bv
                : String(av).localeCompare(String(bv));
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir]);

    // --- Pagination ---
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

    const handleSort = (key) => {
        if (!key) return;
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
        setPage(1);
    };

    const handleSearch = (val) => {
        setSearch(val);
        setPage(1);
    };

    const SortIcon = ({ colKey }) => {
        if (sortKey !== colKey) return <ChevronUp size={12} className="text-gray-300" />;
        return sortDir === 'asc'
            ? <ChevronUp size={12} className="text-green-500" />
            : <ChevronDown size={12} className="text-green-500" />;
    };

    // --- Pagination range ---
    const pageRange = useMemo(() => {
        const range = [];
        const delta = 1;
        const left = Math.max(1, safePage - delta);
        const right = Math.min(totalPages, safePage + delta);
        if (left > 1) range.push(1);
        if (left > 2) range.push('...');
        for (let i = left; i <= right; i++) range.push(i);
        if (right < totalPages - 1) range.push('...');
        if (right < totalPages) range.push(totalPages);
        return range;
    }, [safePage, totalPages]);

    return (
        <div className="flex flex-col h-full">
            {/* Table Control Header */}
            {variant !== 'minimal' && (
                <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {(title || subtitle || icon) && (
                        <div>
                            <div className="flex items-center gap-2.5 mb-1">
                                {icon && <div className="text-green-600">{icon}</div>}
                                <h3 className="text-base font-semibold text-slate-800">{title}</h3>
                            </div>
                            {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className={`w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-300 transition-all outline-none ring-offset-0 ${accent.ring} focus:ring-2 focus:bg-white focus:shadow-xl focus:shadow-emerald-500/5`}
                            />
                            {search && (
                                <button onClick={() => handleSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutList size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('card')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'card' ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Table View ── */}
            {viewMode === 'table' && (
                <div className="overflow-x-auto">
                    <table className={`w-full ${variant === 'minimal' ? 'border-collapse border border-gray-300' : ''}`}>
                        <thead>
                            <tr className={variant === 'minimal' ? 'bg-white border-b border-gray-300' : 'bg-[#f6f8f1]/80 border-y border-[#eaefe2]'}>
                                {columns.map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => col.sortable !== false && handleSort(col.key)}
                                        className={variant === 'minimal' ? `px-3 py-2 text-[12px] font-bold text-gray-900 border border-gray-300 whitespace-nowrap bg-gray-50
                      ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                      ${col.sortable !== false ? 'cursor-pointer select-none' : ''}
                    ` : `px-6 py-4 text-[13px] font-bold text-[#6D8B74] whitespace-nowrap
                      ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                      ${col.sortable !== false ? 'cursor-pointer select-none hover:text-emerald-700 hover:bg-[#eaefe2]/50 transition-all' : ''}
                    `}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            {col.label}
                                            {col.sortable !== false && <SortIcon colKey={col.key} />}
                                        </span>
                                    </th>
                                ))}
                                {actions.length > 0 && (
                                    <th className={variant === 'minimal' ? "px-3 py-2 text-[12px] font-bold text-gray-900 border border-gray-300 bg-gray-50 text-center" : "px-6 py-4 text-[13px] font-bold text-[#6D8B74] text-center"}>
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className={variant === 'minimal' ? "" : "divide-y divide-slate-50"}>
                            {paged.length > 0 ? (
                                paged.map((row, rowIdx) => (
                                    <tr key={row.id ?? rowIdx} className={variant === 'minimal' ? 'bg-white hover:bg-gray-50 outline-none' : `transition-all duration-300 group ${accent.row}`}>
                                        {columns.map(col => (
                                            <td
                                                key={col.key}
                                                className={variant === 'minimal' ? `px-3 py-2 text-[12px] font-normal text-gray-800 border-b border-r border-gray-300
                          ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}
                        ` : `px-6 py-4 text-[13px] font-semibold text-slate-700
                          ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}
                        `}
                                            >
                                                {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                                            </td>
                                        ))}
                                        {actions.length > 0 && (
                                            <td className={variant === 'minimal' ? "px-3 py-2 text-center border-b border-gray-300 border-r" : "px-8 py-5 text-center"}>
                                                <div className="flex justify-center gap-2">
                                                    {actions.map((act, aIdx) => {
                                                        if (act.show && !act.show(row)) return null;
                                                        return (
                                                            <button
                                                                key={aIdx}
                                                                onClick={() => act.onClick(row)}
                                                                title={act.label}
                                                                className={variant === 'minimal' ? `px-2 py-1 rounded flex items-center justify-center gap-1 hover:bg-gray-200 text-xs font-semibold underline text-blue-600` : `px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:shadow-sm ${act.colorClass || ''}`}
                                                            >
                                                                {variant === 'minimal' ? (act.label) : (
                                                                    <>
                                                                        {act.icon}
                                                                        {act.showLabel && <span className="text-[12px] font-bold">{act.label}</span>}
                                                                    </>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center animate-pulse">
                                                <Search size={24} className="text-slate-200" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-400">
                                                    {search ? `No results for "${search}"` : emptyMessage}
                                                </p>
                                                {search && (
                                                    <button onClick={() => handleSearch('')} className="text-xs text-green-600 hover:text-green-700 mt-2 transition-colors">
                                                        Clear search
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Card View (Mobile-First) ── */}
            {viewMode === 'card' && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paged.length > 0 ? (
                        paged.map((row, rowIdx) => {
                            const mainCol = columns.find(c => c.mobileMain) || columns[0];
                            const subCols = columns.filter(c => !c.hideOnCard);
                            return (
                                <div
                                    key={row.id ?? rowIdx}
                                    className="bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-all animate-fade-in"
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="font-bold text-gray-900 text-sm">
                                            {mainCol.render ? mainCol.render(row[mainCol.key], row) : (row[mainCol.key] ?? '—')}
                                        </div>
                                        {actions.length > 0 && (
                                            <div className="flex gap-1">
                                                {actions.map((act, aIdx) => {
                                                    if (act.show && !act.show(row)) return null;
                                                    return (
                                                        <button
                                                            key={aIdx}
                                                            onClick={() => act.onClick(row)}
                                                            title={act.label}
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-sm font-medium
                                                              text-gray-500 hover:text-gray-800 hover:bg-white ${act.colorClass || ''}`}
                                                        >
                                                            {act.icon}
                                                            {act.showLabel && <span className="text-xs">{act.label}</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Fields */}
                                    <div className="space-y-1.5">
                                        {subCols.slice(0, 8).map(col => (
                                            <div key={col.key} className="flex justify-between text-xs gap-2">
                                                <span className="text-gray-400 font-medium flex-shrink-0">{col.label}</span>
                                                <span className="text-gray-700 text-right">
                                                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Card Footer Integration */}
                                    {renderCardFooter && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
                                            {renderCardFooter(row)}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-10 text-center text-gray-400">
                            <Search size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">{search ? `No results for "${search}"` : emptyMessage}</p>
                            {search && (
                                <button onClick={() => handleSearch('')} className="text-xs text-blue-500 hover:underline mt-1">
                                    Clear search
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Pagination + Footer ── */}
            <div className="px-4 md:px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}</span>–
                    <span className="font-semibold text-gray-700">{Math.min(safePage * pageSize, filtered.length)}</span> of{' '}
                    <span className="font-semibold text-gray-700">{filtered.length}</span>
                    {data.length !== filtered.length && <span className="text-gray-400"> (filtered from {data.length})</span>}
                </p>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {pageRange.map((p, i) =>
                            p === '...'
                                ? <span key={`el-${i}`} className="px-1 text-gray-400 text-xs">…</span>
                                : (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-7 h-7 text-xs font-medium rounded-lg transition-all
                      ${safePage === p
                                                ? 'bg-green-600 text-white shadow-sm'
                                                : 'hover:bg-gray-100 text-gray-600'}`}
                                    >
                                        {p}
                                    </button>
                                )
                        )}

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataTable;
