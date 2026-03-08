import React, { useState } from 'react';
import {
    Home, MapPin, Leaf, Truck, Factory, Package,
    TrendingUp, ChevronLeft, ChevronRight, X, Globe, Settings, Sliders, ShieldCheck
} from 'lucide-react';

const Sidebar = ({
    activeModule,
    setActiveModule,
    userModules,
    moduleLabels,
    currentUser,
    isMobile,
    mobileMenuOpen,
    setMobileMenuOpen,
    theme,
    toggleTheme
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

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
        analytics: TrendingUp,
        'technical-ops': Sliders,
        'audit-submission': ShieldCheck,
        settings: Settings
    };

    const handleModuleClick = (module) => {
        setActiveModule(module);
        if (isMobile) {
            setMobileMenuOpen(false);
        }
    };

    // Sidebar colors
    const sidebarBg = theme === 'dark' ? 'bg-slate-900 border-r border-slate-800' : 'bg-green-700 border-r border-green-800';
    const brandTextColor = theme === 'dark' ? 'text-white' : 'text-white';
    const subTextColor = theme === 'dark' ? 'text-slate-400' : 'text-green-200';
    const userSectionBorder = theme === 'dark' ? 'border-slate-700' : 'border-green-600';
    const activeItemBg = theme === 'dark' ? 'bg-green-600 text-white' : 'bg-white/20 text-white';
    const inactiveItemColor = theme === 'dark' ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-white/80 hover:bg-white/10 hover:text-white';
    const bottomBorderColor = theme === 'dark' ? 'border-slate-800' : 'border-green-600';

    const SidebarContent = () => (
        <div className="flex flex-col h-full h-screen">
            {/* App Branding */}
            <div className={`p-6 pb-4 ${isCollapsed ? 'items-center' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-md">
                        <Leaf size={22} />
                    </div>
                    {!isCollapsed && (
                        <div>
                            <h2 className={`text-base font-bold leading-tight ${brandTextColor}`}>Harit Swaraj</h2>
                            <p className={`text-xs font-normal mt-0.5 ${subTextColor}`}>MRV Registry</p>
                        </div>
                    )}
                </div>
            </div>

            {/* User Section */}
            {!isCollapsed && (
                <div className={`mx-5 mb-5 pb-4 border-b ${userSectionBorder}`}>
                    <p className={`text-xs mb-1 ${subTextColor}`}>Logged in as</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-300" />
                        <p className={`text-sm font-medium capitalize ${brandTextColor}`}>
                            {currentUser?.username} &nbsp;·&nbsp;
                            <span className="text-green-200 font-normal">{currentUser?.role}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-2 px-3 no-scrollbar">
                <div className="space-y-1">
                    {userModules.map((module) => {
                        const Icon = moduleIcons[module] || Home;
                        const isActive = activeModule === module;

                        // Section label headers between groups (shown in mockup)
                        const sectionHeaders = {
                            'biomass-id': { label: 'Process Workflow', show: !isCollapsed },
                            'distribution': { label: 'Process Optimization', show: !isCollapsed },
                        };

                        return (
                            <React.Fragment key={module}>
                                {sectionHeaders[module] && sectionHeaders[module].show && (
                                    <div className="pt-3 pb-1 px-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                                            {sectionHeaders[module].label}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={() => handleModuleClick(module)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${isActive
                                        ? activeItemBg + ' shadow-md'
                                        : inactiveItemColor
                                        } ${isCollapsed ? 'justify-center' : ''}`}
                                    title={isCollapsed ? moduleLabels[module] : ''}
                                >
                                    <Icon
                                        size={18}
                                        className={`flex-shrink-0 ${isActive ? 'text-white' : (theme === 'dark' ? 'text-green-400' : 'text-white/70')}`}
                                    />
                                    {!isCollapsed && (
                                        <span className={`text-sm font-normal ${isActive ? 'text-white' : ''}`}>
                                            {moduleLabels[module]}
                                        </span>
                                    )}
                                    {!isCollapsed && isActive && (
                                        <ChevronRight size={14} className="ml-auto text-white/70" />
                                    )}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Section - Collapse Button */}
            <div className={`p-3 border-t ${bottomBorderColor}`}>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 text-xs font-semibold ${theme === 'dark'
                        ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    {isCollapsed ? (
                        <ChevronRight size={16} />
                    ) : (
                        <>
                            <ChevronLeft size={16} />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    // Mobile: Overlay Sidebar
    if (isMobile) {
        return (
            <>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/40 z-40 md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        {/* Sidebar */}
                        <div className={`fixed inset-y-0 left-0 w-64 shadow-xl z-50 md:hidden animate-slide-in ${theme === 'dark' ? 'bg-slate-900' : 'bg-green-700'
                            } border-r ${theme === 'dark' ? 'border-slate-800' : 'border-green-800'}`}>
                            {/* Close Button */}
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className={`absolute top-5 right-4 p-2 rounded-lg transition-all ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
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
            className={`hidden md:flex flex-col shadow-sm transition-all duration-500 h-screen sticky top-0 overflow-hidden ${sidebarBg} ${isCollapsed ? 'w-20' : 'w-64'}`}
        >
            <SidebarContent />
        </div>
    );
};

export default Sidebar;
