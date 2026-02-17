import React from 'react';
import { CheckCircle, AlertTriangle, Info, X, Sparkles, ArrowRight, MapPin, Factory, Leaf } from 'lucide-react';

// Toast Notification Component
export const Toast = ({ message, type = 'success', onClose }) => {
    const icons = {
        success: <CheckCircle className="text-green-500" size={20} />,
        error: <AlertTriangle className="text-red-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200'
    };

    return (
        <div className={`fixed top-4 right-4 z-50 ${bgColors[type]} border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}>
            {icons[type]}
            <p className="flex-1 text-sm font-medium text-gray-900">{message}</p>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
            </button>
        </div>
    );
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
    const sizes = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className={`${sizes[size]} border-green-600 border-t-transparent rounded-full animate-spin`}></div>
            {text && <p className="mt-3 text-sm text-gray-600">{text}</p>}
        </div>
    );
};

// Empty State Component
export const EmptyState = ({ icon: Icon, title, description, actionText, onAction, secondaryActionText, onSecondaryAction }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Icon className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6 max-w-md">{description}</p>
            <div className="flex gap-3">
                {actionText && onAction && (
                    <button
                        onClick={onAction}
                        className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        {actionText}
                        <ArrowRight size={18} />
                    </button>
                )}
                {secondaryActionText && onSecondaryAction && (
                    <button
                        onClick={onSecondaryAction}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        {secondaryActionText}
                    </button>
                )}
            </div>
        </div>
    );
};

// Welcome/Onboarding Card Component
export const WelcomeCard = ({ user, onDismiss, onGetStarted }) => {
    const roleMessages = {
        farmer: {
            title: "Welcome, Farmer!",
            description: "Start by registering your biomass plots to track your contribution to carbon removal.",
            icon: Leaf,
            primaryAction: "Register First Plot",
            steps: [
                "Register your biomass plot with location details",
                "Upload photos and KML boundary files",
                "Track harvest and transportation",
                "Earn carbon credits for verified biomass"
            ]
        },
        owner: {
            title: "Welcome, Plant Owner!",
            description: "Manage your biochar production facility and track manufacturing batches.",
            icon: Factory,
            primaryAction: "Record First Batch",
            steps: [
                "Record biochar production batches",
                "Track biomass input and biochar output",
                "Get ML-based fraud detection verification",
                "Distribute biochar and generate certificates"
            ]
        },
        auditor: {
            title: "Welcome, Auditor!",
            description: "Perform independent audits to ensure integrity of carbon credit claims.",
            icon: MapPin,
            primaryAction: "View Audit Dashboard",
            steps: [
                "Review registered plots and batches",
                "Conduct field and manufacturing audits",
                "Verify satellite vs observed land use",
                "Submit audit reports with evidence"
            ]
        },
        admin: {
            title: "Welcome, Administrator!",
            description: "Oversee the entire MRV system and manage all stakeholders.",
            icon: Sparkles,
            primaryAction: "View Analytics",
            steps: [
                "Monitor all plots and batches",
                "Review audit reports",
                "Analyze system-wide metrics",
                "Manage user accounts and permissions"
            ]
        }
    };

    const config = roleMessages[user?.role] || roleMessages.farmer;
    const Icon = config.icon;

    return (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-lg p-6 mb-6 border border-green-100">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                        <Icon className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
                        <p className="text-sm text-gray-600">{user?.full_name || user?.username}</p>
                    </div>
                </div>
                <button
                    onClick={onDismiss}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>
            </div>

            <p className="text-gray-700 mb-4">{config.description}</p>

            <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-500" />
                    Quick Start Guide
                </h3>
                <ol className="space-y-2">
                    {config.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                            </span>
                            <span>{step}</span>
                        </li>
                    ))}
                </ol>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onGetStarted}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                    {config.primaryAction}
                    <ArrowRight size={18} />
                </button>
                <button
                    onClick={onDismiss}
                    className="px-4 py-2.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                >
                    I'll Explore
                </button>
            </div>
        </div>
    );
};

// Success Animation Component
export const SuccessAnimation = ({ message, onComplete }) => {
    React.useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center animate-scale-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle className="text-green-600" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
    );
};

// Confirmation Dialog Component
export const ConfirmDialog = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, type = 'warning' }) => {
    const colors = {
        warning: 'bg-yellow-100 text-yellow-600',
        danger: 'bg-red-100 text-red-600',
        info: 'bg-blue-100 text-blue-600'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                <div className={`w-12 h-12 ${colors[type]} rounded-full flex items-center justify-center mb-4`}>
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${type === 'danger'
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Help Tooltip Component
export const HelpTooltip = ({ text, children }) => {
    const [show, setShow] = React.useState(false);

    return (
        <div className="relative inline-block">
            <button
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                className="text-gray-400 hover:text-gray-600"
            >
                {children || <Info size={16} />}
            </button>
            {show && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
                    {text}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
};

// Progress Steps Component
export const ProgressSteps = ({ steps, currentStep }) => {
    return (
        <div className="flex items-center justify-between mb-8">
            {steps.map((step, idx) => (
                <React.Fragment key={idx}>
                    <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${idx < currentStep
                                ? 'bg-green-600 text-white'
                                : idx === currentStep
                                    ? 'bg-green-100 text-green-600 border-2 border-green-600'
                                    : 'bg-gray-200 text-gray-400'
                            }`}>
                            {idx < currentStep ? <CheckCircle size={20} /> : idx + 1}
                        </div>
                        <p className={`text-xs mt-2 ${idx <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                            {step}
                        </p>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={`flex-1 h-1 mx-2 ${idx < currentStep ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
