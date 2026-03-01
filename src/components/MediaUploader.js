import React from 'react';
import { Camera, Folder, CheckCircle, File } from 'lucide-react';

const MediaUploader = ({
    file,
    onChange,
    label,
    required = false,
    className = "",
    accept = "image/*,video/*"
}) => {
    // Determine if file is an array (multiple select) or a single file
    const isMultiple = Array.isArray(file);
    const hasFile = isMultiple ? file.length > 0 : !!file;
    const displayName = isMultiple
        ? `${file.length} file(s) selected`
        : (file ? file.name : '');

    return (
        <div className={`relative border-2 border-dashed rounded-[1.5rem] p-4 flex flex-col items-center justify-center transition-all bg-gray-50 border-gray-200 hover:border-green-400 hover:bg-white ${className}`}>
            {hasFile ? (
                <div className="flex flex-col items-center justify-center text-center w-full z-20">
                    <CheckCircle className="text-green-500 mb-2" size={24} />
                    <div className="text-[10px] font-bold text-gray-700 truncate w-full px-2">
                        {displayName}
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onChange(isMultiple ? [] : null);
                        }}
                        className="mt-3 text-[10px] text-red-500 font-bold hover:underline cursor-pointer bg-red-50 px-3 py-1 rounded-full"
                    >
                        Remove
                    </button>
                    {/* Dummy hidden input to silence any form data binding needs, but mostly state handled. */}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full z-20">
                    {label && <div className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-3">{label}</div>}
                    <div className="flex gap-2 w-full justify-center">
                        <label className="flex flex-col flex-1 items-center justify-center bg-white py-3 px-1 border border-gray-100 shadow-sm rounded-xl cursor-pointer hover:bg-green-50 hover:border-green-200 transition-all group">
                            <Camera size={18} className="mb-1.5 text-green-600 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-bold text-gray-600 uppercase">Camera</span>
                            <input
                                type="file"
                                accept={accept}
                                capture="environment"
                                multiple={isMultiple}
                                onChange={(e) => {
                                    if (e.target.files.length > 0) {
                                        onChange(isMultiple ? Array.from(e.target.files) : e.target.files[0]);
                                    }
                                }}
                                className="hidden"
                            />
                        </label>
                        <label className="flex flex-col flex-1 items-center justify-center bg-white py-3 px-1 border border-gray-100 shadow-sm rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group">
                            <Folder size={18} className="mb-1.5 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-bold text-gray-600 uppercase">Browse</span>
                            <input
                                type="file"
                                accept={accept}
                                multiple={isMultiple}
                                onChange={(e) => {
                                    if (e.target.files.length > 0) {
                                        onChange(isMultiple ? Array.from(e.target.files) : e.target.files[0]);
                                    }
                                }}
                                className="hidden"
                            />
                        </label>
                    </div>
                    {/* Hack to enforce native validation seamlessly */}
                    {required && <input type="text" required className="absolute opacity-0 w-0 h-0 bottom-0 pointer-events-none" onChange={() => { }} value="" tabIndex={-1} />}
                </div>
            )}
            {/* If there's no file, show a subtle background icon */}
            {!hasFile && (
                <div className="absolute inset-0 flex items-center justify-center z-10 opacity-[0.03] pointer-events-none">
                    <File size={60} />
                </div>
            )}
        </div>
    );
};

export default MediaUploader;
