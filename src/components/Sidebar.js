import React, { useState } from 'react';
import {
    Home, MapPin, Leaf, Truck, Factory, Package,
    TrendingUp, ChevronLeft, ChevronRight, Menu, X, Globe
} from 'lucide-react';

const Sidebar = ({ activeModule, setActiveModule, userModules, moduleLabels, currentUser, isMobile }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const moduleIcons = {
        dashboard: Home,
        'biomass-id': MapPin,
        harvest: Leaf,
        transport: Truck,
        manufacturing: Factory,
        'my-plots': Leaf,
        'my-batches': Package,
        'all-plots': MapPin,
        'all-batches': Package,
        distribution: Globe,
        analytics: TrendingUp
    };

    const handleModuleClick = (module) => {
        setActiveModule(module);
        if (isMobile) {
            setIsMobileOpen(false);
        }
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* User Info Section */}
            <div className={`p-4 border-b border-green-700 ${isCollapsed ? 'hidden' : 'block'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                        {currentUser?.full_name?.charAt(0) || currentUser?.username?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {currentUser?.full_name || currentUser?.username}
                        </p>
                        <p className="text-xs text-green-200 capitalize">
                            {currentUser?.role}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
                <div className="space-y-1 px-2">
                    {userModules.map((module) => {
                        const Icon = moduleIcons[module];
                        const isActive = activeModule === module;

                        return (
                            <button
                                key={module}
                                onClick={() => handleModuleClick(module)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-green-500 text-white shadow-lg'
                                    : 'text-green-100 hover:bg-green-700 hover:text-white'
                                    } ${isCollapsed ? 'justify-center' : ''}`}
                                title={isCollapsed ? moduleLabels[module] : ''}
                            >
                                <Icon size={20} className="flex-shrink-0" />
                                {!isCollapsed && (
                                    <span className="text-sm font-medium truncate">
                                        {moduleLabels[module]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Collapse Toggle (Desktop Only) */}
            {!isMobile && (
                <div className="p-2 border-t border-green-700">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-green-100 hover:bg-green-700 hover:text-white rounded-lg transition-colors"
                    >
                        {isCollapsed ? (
                            <ChevronRight size={20} />
                        ) : (
                            <>
                                <ChevronLeft size={20} />
                                <span className="text-sm">Minimize</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );

    // Mobile: Overlay Sidebar
    if (isMobile) {
        return (
            <>
                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="fixed top-4 left-4 z-50 p-2 bg-green-600 text-white rounded-lg shadow-lg md:hidden"
                >
                    <Menu size={24} />
                </button>

                {/* Mobile Overlay */}
                {isMobileOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                            onClick={() => setIsMobileOpen(false)}
                        />

                        {/* Sidebar */}
                        <div className="fixed inset-y-0 left-0 w-64 bg-green-600 shadow-2xl z-50 md:hidden animate-slide-in">
                            {/* Close Button */}
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="absolute top-4 right-4 p-2 text-white hover:bg-green-700 rounded-lg"
                            >
                                <X size={20} />
                            </button>

                            <SidebarContent />
                        </div>
                    </>
                )}
            </>
        );
    }

    // Desktop: Fixed Sidebar
    return (
        <div
            className={`hidden md:flex flex-col bg-green-600 shadow-xl transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'
                }`}
        >
            <SidebarContent />
        </div>
    );
};

export default Sidebar;
