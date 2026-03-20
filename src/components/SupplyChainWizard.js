import React, { useState } from 'react';
import {
    ChevronRight,
    ChevronLeft,
    MapPin,
    Leaf,
    Truck,
    Factory,
    Globe,
    CheckCircle,
    Activity,
    Box,
    ArrowRight,
    ClipboardCheck,
    Users
} from 'lucide-react';
import BiomassIdView from './BiomassIdView';
import BiomassHarvestView from './BiomassHarvestView';
import TransportView from './TransportView';
import ManufacturingView from './ManufacturingView';
import CustomerIdentificationView from './CustomerIdentificationView';
import DistributionView from './DistributionView';

const SupplyChainWizard = (props) => {
    const { theme } = props;
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            id: 'identification',
            title: 'Source Registration',
            description: 'Identify and register biomass plots',
            icon: MapPin,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            component: BiomassIdView
        },
        {
            id: 'harvest',
            title: 'Collection & Prep',
            description: 'Record harvest and pre-processing',
            icon: Leaf,
            color: 'text-green-600',
            bgColor: 'bg-green-600/10',
            component: BiomassHarvestView
        },
        {
            id: 'transport',
            title: 'Logistics',
            description: 'Track inbound and outbound transport',
            icon: Truck,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            component: TransportView
        },
        {
            id: 'manufacturing',
            title: 'Pyrolysis',
            description: 'Record biochar production batches',
            icon: Factory,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
            component: ManufacturingView
        },
        {
            id: 'customer',
            title: 'End-User ID',
            description: 'Identify and register biochar customers',
            icon: Users,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-600/10',
            component: CustomerIdentificationView
        },
        {
            id: 'distribution',
            title: 'Impact Log',
            description: 'Final distribution and application',
            icon: Globe,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            component: DistributionView
        },
    ];

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const ActiveComponent = steps[currentStep].component;

    const handleSuccess = () => {
        if (props.onSuccess) props.onSuccess();
        // Auto-advance to next step on success (except for the last step)
        if (currentStep < steps.length - 1) {
            setTimeout(() => {
                nextStep();
            }, 1500); // Give user time to see success message
        }
    };

    // Filter props for each component to avoid passing unwanted props
    const getComponentProps = () => {
        const baseProps = {
            theme: props.theme,
            fetchWithAuth: props.fetchWithAuth,
            onSuccess: handleSuccess
        };

        switch (steps[currentStep].id) {
            case 'identification':
                return {
                    ...baseProps,
                    plotForm: props.plotForm,
                    setPlotForm: props.setPlotForm,
                    plots: props.plots,
                    refreshData: () => {
                        if (props.refreshData) props.refreshData();
                        handleSuccess();
                    }
                };
            case 'harvest':
                return {
                    ...baseProps,
                    plots: props.plots,
                    harvests: props.harvests
                };
            case 'transport':
                return {
                    ...baseProps,
                    batches: props.batches,
                    distributions: props.distributions,
                    harvests: props.harvests,
                    transports: props.transports
                };
            case 'manufacturing':
                return {
                    ...baseProps,
                    batches: props.batches,
                    fetchBatches: props.fetchBatches,
                    fetchDashboardData: props.fetchDashboardData,
                    // Note: ManufacturingView uses these fetch functions to refresh data
                    onSuccess: handleSuccess
                };
            case 'customer':
                return baseProps;
            case 'distribution':
                return {
                    ...baseProps,
                    batches: props.batches,
                    distributions: props.distributions,
                    onDelete: props.onDelete
                };
            default:
                return baseProps;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Wizard Header & Progress */}
            <div className={`${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-100'} rounded-3xl shadow-xl border p-4 md:p-6 relative overflow-hidden transition-all duration-500`}>
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                                    <Activity className="text-emerald-500" size={18} />
                                </div>
                                <h1 className={`text-xl md:text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    Supply Chain <span className="text-emerald-600 font-extrabold">Workflow</span>
                                </h1>
                            </div>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} font-medium`}>
                                Complete the end-to-end biochar audit trail step by step.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${currentStep === 0
                                    ? 'opacity-30 cursor-not-allowed grayscale'
                                    : `${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`
                                    }`}
                            >
                                <ChevronLeft size={18} />
                                Previous
                            </button>
                            <button
                                onClick={nextStep}
                                disabled={currentStep === steps.length - 1}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all uppercase tracking-widest ${currentStep === steps.length - 1
                                    ? 'opacity-30 cursor-not-allowed grayscale'
                                    : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-xl active:scale-95'
                                    }`}
                            >
                                Next Step
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Progress Track */}
                    <div className="relative pt-2">
                        <div className="absolute top-[2.1rem] left-0 w-full h-1 bg-gray-100 dark:bg-slate-800 rounded-full" />
                        <div
                            className="absolute top-[2.1rem] left-0 h-1 bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${(currentStep / (steps.length - 1)) * 100}% shadow: '0 0 10px rgba(16, 185, 129, 0.5)'` }}
                        />

                        <div className="relative flex justify-between items-start">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = currentStep === index;
                                const isCompleted = currentStep > index;

                                return (
                                    <div key={step.id} className="flex flex-col items-center flex-1">
                                        <button
                                            onClick={() => setCurrentStep(index)}
                                            className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500 group ${isActive
                                                ? `bg-emerald-600 text-white shadow-xl scale-110 ring-4 ${theme === 'dark' ? 'ring-slate-900' : 'ring-white'}`
                                                : isCompleted
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                                    : `${theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'} hover:bg-emerald-50 dark:hover:bg-emerald-900/20`
                                                }`}
                                        >
                                            <Icon size={index === 2 ? 22 : 20} className={`transition-all duration-500 ${isActive ? 'rotate-0' : 'group-hover:rotate-12'}`} />
                                            {isCompleted && (
                                                <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-slate-900">
                                                    <CheckCircle size={10} fill="currentColor" stroke="white" />
                                                </div>
                                            )}
                                        </button>
                                        <div className="mt-4 text-center px-1">
                                            <p className={`text-[10px] font-black uppercase tracking-widest hidden md:block ${isActive ? 'text-emerald-600' : isCompleted ? 'text-emerald-500/70' : 'text-slate-400'
                                                }`}>
                                                {step.title}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Summary Banner */}
            <div className={`p-4 rounded-3xl flex items-center gap-4 border animate-in slide-in-from-bottom duration-500 ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${steps[currentStep].bgColor} ${steps[currentStep].color} shadow-inner`}>
                    {React.createElement(steps[currentStep].icon, { size: 24 })}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500 shadow-sm'}`}>
                            Step {currentStep + 1} of {steps.length}
                        </span>
                        <ArrowRight size={12} className="text-slate-300" />
                        <span className={`text-[10px] font-black uppercase tracking-widest text-emerald-600`}>
                            {steps[currentStep].title}
                        </span>
                    </div>
                    <h3 className={`text-lg font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{steps[currentStep].description}</h3>
                </div>
                <div className="hidden lg:flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 ${theme === 'dark' ? 'border-slate-900 bg-slate-800' : 'border-white bg-slate-100'} flex items-center justify-center`}>
                                <ClipboardCheck size={14} className="text-slate-400" />
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">Compliance Check Active</span>
                </div>
            </div>

            {/* Active Component Container */}
            <div className="animate-in fade-in zoom-in duration-700">
                <ActiveComponent {...getComponentProps()} />
            </div>

            {/* Bottom Navigation for Mobile / Convenience */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-slate-800">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all ${currentStep === 0
                        ? 'opacity-0 pointer-events-none'
                        : `${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                        }`}
                >
                    <ChevronLeft size={20} />
                    Go Back
                </button>

                {currentStep < steps.length - 1 ? (
                    <button
                        onClick={nextStep}
                        className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/40 active:scale-95 transition-all flex items-center gap-3"
                    >
                        Forward
                        <ChevronRight size={20} />
                    </button>
                ) : (
                    <div className="flex items-center gap-2 text-emerald-500 font-bold">
                        <CheckCircle size={20} />
                        Workflow Completed
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplyChainWizard;
