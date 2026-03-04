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
    ClipboardCheck
} from 'lucide-react';
import BiomassIdView from './BiomassIdView';
import BiomassHarvestView from './BiomassHarvestView';
import TransportView from './TransportView';
import ManufacturingView from './ManufacturingView';
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
