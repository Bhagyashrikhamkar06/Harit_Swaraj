import React from 'react';
import { CheckCircle, AlertTriangle, Info, X, Sparkles, ArrowRight, MapPin, Factory, Leaf, Camera, Mail, Phone, ExternalLink, Clock, Trash2, Package } from 'lucide-react';

// Toast Notification Component
export const Toast = ({ message, type = 'success', onClose }) => {
    const icons = {
        success: <CheckCircle className="text-emerald-500" size={20} />,
        error: <AlertTriangle className="text-red-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />
    };

    const styles = {
        success: 'bg-emerald-50/80 border-emerald-200/50 text-emerald-900 shadow-emerald-500/10',
        error: 'bg-red-50/80 border-red-200/50 text-red-900 shadow-red-500/10',
        info: 'bg-blue-50/80 border-blue-200/50 text-blue-900 shadow-blue-500/10'
    };

    return (
        <div className={`fixed top-8 right-8 z-[100] ${styles[type]} backdrop-blur-2xl border-2 rounded-[2rem] shadow-2xl p-6 flex items-center gap-4 min-w-[320px] max-w-md animate-scale-in`}>
            <div className={`p-2 rounded-2xl ${type === 'success' ? 'bg-emerald-500/10' : type === 'error' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                {icons[type]}
            </div>
            <p className="flex-1 text-sm font-black uppercase tracking-tight">{message}</p>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-all">
                <X size={18} className="text-gray-400" />
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
            <div className={`${sizes[size]} border-emerald-600 border-t-transparent rounded-full animate-spin`}></div>
            {text && <p className="mt-3 text-sm font-black uppercase tracking-widest text-slate-400">{text}</p>}
        </div>
    );
};

// Empty State Component
export const EmptyState = ({ icon: Icon, title, description, actionText, onAction, secondaryActionText, onSecondaryAction }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-8 animate-floating">
                <Icon className="text-emerald-500" size={40} />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-500 mb-10 max-w-md font-medium leading-relaxed">{description}</p>
            <div className="flex flex-col sm:flex-row gap-4">
                {actionText && onAction && (
                    <button
                        onClick={onAction}
                        className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        {actionText}
                        <ArrowRight size={20} />
                    </button>
                )}
                {secondaryActionText && onSecondaryAction && (
                    <button
                        onClick={onSecondaryAction}
                        className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
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

    const content = roleMessages[user?.role] || {
        title: `Welcome, ${user?.username || 'User'}!`,
        description: "Let's explore the Harit Swaraj ecosystem.",
        icon: Sparkles,
        primaryAction: "Go to Dashboard",
        steps: [
            "Monitor biodiversity and carbon stocks",
            "Verify supply chain transparency",
            "Manage your profile and settings"
        ]
    };

    const Icon = content.icon;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-2xl bg-emerald-950/40 animate-fade-in">
            <div className="bg-white rounded-[3.5rem] shadow-[0_32px_128px_-16px_rgba(6,78,59,0.3)] max-w-2xl w-full overflow-hidden border border-emerald-100 flex flex-col md:flex-row animate-scale-in">
                {/* Visual Side */}
                <div className="md:w-5/12 bg-emerald-950 p-10 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full -mr-32 -mt-32" />
                    <div className="relative z-10 w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-3xl border border-white/20 animate-floating">
                        <Icon size={32} className="text-emerald-400" />
                    </div>
                    <div className="relative z-10 mt-12">
                        <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{content.title}</h2>
                        <div className="w-12 h-1.5 bg-emerald-500 rounded-full mt-6" />
                    </div>
                </div>

                {/* Content Side */}
                <div className="md:w-7/12 p-12 flex flex-col">
                    <div className="flex-1">
                        <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
                            {content.description}
                        </p>

                        <div className="space-y-4 mb-10">
                            {content.steps.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-4">
                                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onGetStarted}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                            {content.primaryAction}
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={onDismiss}
                            className="w-full py-3 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
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
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-xl flex items-center justify-center z-[100] animate-fade-in">
            <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-emerald-100 animate-scale-in max-w-sm w-full mx-6">
                <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-bounce transition-all duration-500">
                    <CheckCircle className="text-emerald-500" size={48} />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 mb-3">Certified!</h3>
                <p className="text-slate-600 font-medium leading-relaxed">{message}</p>
            </div>
        </div>
    );
};

// Confirmation Dialog Component
export const ConfirmDialog = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, type = 'warning' }) => {
    const config = {
        warning: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: AlertTriangle, btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' },
        danger: { bg: 'bg-red-50', text: 'text-red-600', icon: AlertTriangle, btn: 'bg-red-600 hover:bg-red-700 shadow-red-500/20' },
        info: { bg: 'bg-blue-50', text: 'text-blue-600', icon: Info, btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' }
    };

    const style = config[type] || config.warning;
    const Icon = style.icon;

    return (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-fade-in">
            <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-md w-full p-12 animate-scale-in border border-emerald-100">
                <div className={`w-20 h-20 ${style.bg} rounded-[2rem] flex items-center justify-center mb-8 mx-auto`}>
                    <Icon className={style.text} size={32} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-center text-slate-900 mb-3">{title}</h3>
                <p className="text-slate-600 text-center font-medium leading-relaxed mb-10">{message}</p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className={`w-full py-4 ${style.btn} text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl active:scale-95`}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full py-3 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                    >
                        {cancelText}
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
                className="text-emerald-400 hover:text-emerald-600 transition-colors"
            >
                {children || <Info size={16} />}
            </button>
            {show && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-5 py-3 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl shadow-2xl z-[100] min-w-[200px] text-center animate-scale-in">
                    {text}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                </div>
            )}
        </div>
    );
};

// Progress Steps Component
export const ProgressSteps = ({ steps, currentStep }) => {
    return (
        <div className="flex items-center justify-between mb-12 px-6">
            {steps.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isActive = idx === currentStep;

                return (
                    <React.Fragment key={idx}>
                        <div className="flex flex-col items-center group">
                            <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 ${isCompleted
                                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20'
                                : isActive
                                    ? 'bg-white text-emerald-600 border-2 border-emerald-600 shadow-xl'
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                {isCompleted ? <CheckCircle size={24} /> : (
                                    <span className="text-lg font-black italic">{idx + 1}</span>
                                )}
                            </div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-4 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {step}
                            </p>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="flex-1 h-0.5 mx-4 mt-[-20px] bg-slate-100 relative overflow-hidden">
                                <div className={`absolute inset-0 bg-emerald-600 transition-all duration-1000 ${isCompleted ? 'translate-x-0' : '-translate-x-full'}`} />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
