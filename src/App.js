import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, AlertTriangle, Users, Leaf, Factory, TrendingUp, Menu, X, Home, FileText, Truck, Droplet, MapPin, ClipboardCheck, Flame, Package, Camera, Trash2, Check, LogOut, LogIn, BarChart3, Database, Globe, Wifi, WifiOff, Download, Award, ArrowUpRight, Activity, Clock, Settings, Server, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BiomassIdView from './components/BiomassIdView';
import BiomassHarvestView from './components/BiomassHarvestView';
import TransportView from './components/TransportView';
import DistributionView from './components/DistributionView';
import Sidebar from './components/Sidebar';
import { Toast, LoadingSpinner, EmptyState, WelcomeCard, SuccessAnimation, ConfirmDialog } from './components/UXComponents';
import ManufacturingView from './components/ManufacturingView';
import MyPlotsView from './components/MyPlotsView';
import MyBatchesView from './components/MyBatchesView';
import ProfileView from './components/ProfileView';
import DataTable from './components/DataTable';
import TechnicalOperationsView from './components/TechnicalOperationsView';
import AuditSubmissionView from './components/AuditSubmissionView';
import SupplyChainWizard from './components/SupplyChainWizard';



const HaritSwarajMRV = () => {
  // i18n hook
  const { t, i18n } = useTranslation();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);

  // UI state
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('dashboard'); // For dashboard tabs
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [apiUrl, setApiUrl] = useState(process.env.REACT_APP_API_URL || '');
  const [showServerSettings] = useState(false);

  // PWA state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false); // Disabled PWA prompt
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Data state - now fetched from backend
  const [biomassPlots, setBiomassPlots] = useState([]);
  const [biocharBatches, setBiocharBatches] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [transports, setTransports] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [editingPlot, setEditingPlot] = useState(null);

  // Form state for Biomass ID
  const [plotForm, setPlotForm] = useState({
    plot_id: '',
    type: 'Wood',
    species: '',
    area: '',
    expected_biomass: '',
    survey_number: '',
    village: '',
    taluka: '',
    district: '',
    photos: [null, null, null, null],
    kml_file: null
  });



  // UX Enhancement State
  const [toast, setToast] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Show success animation
  const showSuccessAnimation = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
  };

  // Check if first time user
  useEffect(() => {
    /* // Disabled welcome card auto-show as it was found interrupting
      if (isAuthenticated && currentUser) {
        const hasSeenWelcome = localStorage.getItem(`welcome_seen_${currentUser.id}`);
        if (!hasSeenWelcome) {
          setShowWelcome(true);
        }
      }
    */
  }, [isAuthenticated, currentUser]);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }

    // Sanitize apiUrl on mount
    const savedUrl = localStorage.getItem('api_url');
    if (savedUrl && savedUrl.endsWith('/')) {
      const cleanUrl = savedUrl.replace(/\/$/, '');
      setApiUrl(cleanUrl);
      localStorage.setItem('api_url', cleanUrl);
    }
  }, []);

  // PWA install prompt listener - DISABLED per user request
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // setShowInstallPrompt(true); // Disabled - user doesn't want install prompt
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Online/offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAllData();
    }
  }, [isAuthenticated, token]);

  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${apiUrl}${url}`, {
      ...options,
      headers: {
        ...headers,
        'ngrok-skip-browser-warning': '69420'
      }
    });

    if (response.status === 401) {
      // Token expired or invalid
      handleLogout();
      throw new Error('Authentication failed');
    }

    return response;
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetchWithAuth('/dashboard/summary');
      const data = await res.json();
      setDashboardStats(data);
      return true;
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      return false;
    }
  };

  const fetchAllData = async () => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    const results = await Promise.allSettled([
      fetchDashboardData(),
      fetchPlots(),
      fetchBatches(),
      fetchHarvests(),
      fetchTransports(),
      fetchDistributions()
    ]);
    setLoading(false);
    return results;
  };

  const fetchPlots = async () => {
    try {
      const res = await fetchWithAuth('/biomass/plots');
      const data = await res.json();
      setBiomassPlots(data);
    } catch (err) {
      console.error('Error fetching plots:', err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await fetchWithAuth('/manufacturing/batches');
      const data = await res.json();
      setBiocharBatches(data);
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  const fetchHarvests = async () => {
    try {
      const res = await fetchWithAuth('/harvest/list');
      const data = await res.json();
      setHarvests(data);
    } catch (err) {
      console.error('Error fetching harvests:', err);
    }
  };

  const fetchTransports = async () => {
    try {
      const res = await fetchWithAuth('/transport/list');
      if (!res.ok) { setTransports([]); return; }
      const data = await res.json();
      setTransports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching transports:', err);
      setTransports([]);
    }
  };

  const fetchDistributions = async () => {
    try {
      const res = await fetchWithAuth('/distribution/list');
      if (!res.ok) { setDistributions([]); return; }
      const data = await res.json();
      setDistributions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching distributions:', err);
      setDistributions([]);
    }
  };

  const handleDeleteDistribution = async (id) => {
    if (!window.confirm('Are you sure you want to delete this distribution record?')) return;
    try {
      const res = await fetchWithAuth(`/distribution/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Distribution record deleted successfully', 'success');
        fetchDistributions();
        fetchDashboardData();
      } else {
        const error = await res.json();
        showToast(error.detail || 'Failed to delete distribution', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveModule('dashboard');
  };

  const handleDeletePlot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plot? This action cannot be undone.')) return;
    try {
      const res = await fetchWithAuth(`/biomass/plots/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Plot deleted successfully', 'success');
        fetchPlots();
        fetchDashboardData();
      } else {
        const error = await res.json();
        showToast(error.detail || 'Failed to delete plot', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdatePlot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { id, type, species, area, expected_biomass } = editingPlot;
      const res = await fetchWithAuth(`/biomass/plots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, species, area: parseFloat(area), expected_biomass: parseFloat(expected_biomass) })
      });

      if (res.ok) {
        showSuccessAnimation('Plot updated successfully');
        setEditingPlot(null);
        fetchPlots();
      } else {
        const error = await res.json();
        throw new Error(error.detail || 'Update failed');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this batch? This will affect your total carbon sequestered stats.')) return;
    try {
      const res = await fetchWithAuth(`/manufacturing/batches/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Batch deleted successfully', 'success');
        fetchBatches();
        fetchDashboardData();
      } else {
        const error = await res.json();
        showToast(error.detail || 'Failed to delete batch', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // PWA install handler
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // Language change handler
  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const modules = {
    owner: ['dashboard', 'supply-chain', 'biomass-id', 'harvest', 'transport', 'manufacturing', 'technical-ops', 'distribution', 'my-plots', 'my-batches', 'settings'],
    farmer: ['dashboard', 'biomass-id', 'harvest', 'my-plots', 'settings'],
    auditor: ['dashboard', 'audit-submission', 'all-plots', 'all-batches', 'settings'],
    admin: ['dashboard', 'supply-chain', 'biomass-id', 'all-plots', 'harvest', 'transport', 'manufacturing', 'technical-ops', 'distribution', 'all-batches', 'settings']
  };

  const moduleIcons = {
    dashboard: Home,
    'biomass-id': MapPin,
    harvest: Leaf,
    transport: Truck,
    manufacturing: Factory,
    distribution: Globe,
    'my-plots': Leaf,
    'my-batches': Package,
    'all-plots': MapPin,
    'all-batches': Package,
    'technical-ops': Settings,
    'audit-submission': ShieldCheck,
    'supply-chain': Activity,
    settings: Settings
  };

  const moduleLabels = {
    'biomass-id': t('biomass.title'),
    harvest: 'Biomass Harvest',
    transport: 'Transportation',
    manufacturing: t('manufacturing.title'),
    distribution: 'Distribution & Application',
    'my-plots': t('biomass.my_plots'),
    'my-batches': t('manufacturing.my_batches'),
    'all-plots': t('biomass.all_plots'),
    'all-batches': t('manufacturing.all_batches'),
    dashboard: t('dashboard.title'),
    'technical-ops': 'Biomass pre-processing',
    'audit-submission': 'Independent Audit',
    'supply-chain': 'Supply Chain Workflow',
    settings: 'Profile & Settings'
  };

  // ============ LOGIN/REGISTER COMPONENT ============

  const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      email: '',
      full_name: '',
      role: 'farmer'
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSubmitting(true);

      try {
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const payload = isLogin
          ? { username: formData.username, password: formData.password }
          : formData;

        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '69420'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Authentication failed');
        }

        // Save token and user info
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setToken(data.access_token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 overflow-hidden relative ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
        {/* Animated Background Elements */}
        {theme === 'dark' && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-4 left-4 bg-green-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-50 uppercase tracking-widest">PRODUCTION SERVER</div>
          </>
        )}

        <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-transparent'} backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 md:p-10 w-full max-w-md relative z-10 border transition-all duration-300`}>
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-[2rem] mb-6 shadow-inner ${theme === 'dark' ? 'bg-green-500/10' : 'bg-green-100'}`}>
              <Leaf className="text-green-500" size={36} />
            </div>
            <h1 className={`text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('app_name')}</h1>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'} mt-3 font-medium`}>{t('tagline')}</p>
          </div>


          <div className={`flex gap-2 mb-8 p-1 rounded-2xl ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-gray-100'}`}>
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${isLogin
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                : `${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`
                }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${!isLogin
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                : `${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`
                }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{t('auth.username')}</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full px-5 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-green-500/50 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 text-white focus:border-green-500' : 'bg-white border-gray-200 text-gray-900 focus:border-green-500'}`}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-5 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-green-500/50 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 text-white focus:border-green-500' : 'bg-white border-gray-200 text-gray-900 focus:border-green-500'}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-5 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-green-500/50 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 text-white focus:border-green-500' : 'bg-white border-gray-200 text-gray-900 focus:border-green-500'}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={`w-full px-5 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-green-500/50 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 text-white focus:border-green-500' : 'bg-white border-gray-200 text-gray-900 focus:border-green-500'}`}
                    required
                  >
                    <option value="farmer">Farmer</option>
                    <option value="owner">Plant Owner</option>
                    <option value="auditor">Auditor</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{t('auth.password')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-5 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-green-500/50 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 text-white focus:border-green-500' : 'bg-white border-gray-200 text-gray-900 focus:border-green-500'}`}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} />
                  <span className="font-bold">Connection Failed</span>
                </div>
                {error === 'Failed to fetch'
                  ? 'Server unreachable. If you are on a private Wi-Fi, try switching to Mobile Data.'
                  : error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>Processing...</>
              ) : (
                <>
                  <LogIn size={20} />
                  {isLogin ? t('auth.login') : t('auth.register')}
                </>
              )}
            </button>
          </form>


          {isLogin && (
            <div className="mt-6 p-4 bg-green-50/50 rounded-[1.5rem] border border-green-100/50 backdrop-blur-sm">
              <p className="text-[10px] font-black text-green-800 mb-2 uppercase tracking-widest opacity-60">Master Demo Accounts</p>
              <div className="text-xs text-green-900 space-y-1.5 font-bold">
                <div className="flex justify-between items-center"><span className="opacity-60">👨‍🌾 Farmer</span> <code className="bg-white/60 px-2 py-0.5 rounded-lg border border-green-200">farmer1 / farmer123</code></div>
                <div className="flex justify-between items-center"><span className="opacity-60">🏭 Owner</span> <code className="bg-white/60 px-2 py-0.5 rounded-lg border border-green-200">owner1 / owner123</code></div>
                <div className="flex justify-between items-center"><span className="opacity-60">🔍 Auditor</span> <code className="bg-white/60 px-2 py-0.5 rounded-lg border border-green-200">auditor1 / auditor123</code></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============ DASHBOARD COMPONENT ============

  const DashboardView = () => {
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [showPopulateConfirm, setShowPopulateConfirm] = useState(false);

    // Effect to handle fetch errors from parent or self
    useEffect(() => {
      if (!dashboardStats) {
        const timer = setTimeout(() => {
          if (!dashboardStats) setFetchError("Waiting for backend response... Make sure your FastAPI server is running on port 8000.");
        }, 15000); // Increased to 15s
        return () => clearTimeout(timer);
      } else {
        setFetchError(null);
      }
    }, [dashboardStats]);

    const handleRetry = async () => {
      setFetchError(null);
      await fetchAllData();
    };

    const handlePopulateData = async () => {
      setLoading(true);
      try {
        await fetchWithAuth('/admin/populate-sample-data', { method: 'POST' });
        showSuccessAnimation('Demo data populated successfully!');
        // Refresh all data
        fetchDashboardData();
        fetchPlots();
        fetchBatches();
        fetchHarvests();
        fetchTransports();
        fetchDistributions();
      } catch (err) {
        showToast('Failed to populate data: ' + err.message, 'error');
      } finally {
        setLoading(false);
        setShowPopulateConfirm(false);
      }
    };

    if (fetchError && !dashboardStats) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <WifiOff size={48} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Connection Issue</h3>
          <p className="text-gray-600 mb-6 max-w-md">{fetchError}</p>
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
            >
              <Activity size={18} />
              Retry Connection
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
            >
              Fresh Reload
            </button>
          </div>
        </div>
      );
    }

    if (!dashboardStats) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="spinner mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      );
    }

    const handleBatchClick = (batch) => {
      setSelectedBatch(batch);
      setShowBatchModal(true);
    };

    return (
      <div className="space-y-6">
        {/* Confirmation Dialog for Populate Data */}
        {showPopulateConfirm && (
          <ConfirmDialog
            title="Populate Demo Data?"
            message="This will CLEAR all existing data (except users) and generate sample plots, harvests, and batches. This action cannot be undone."
            confirmText="Yes, Populate Data"
            cancelText="Cancel"
            onConfirm={handlePopulateData}
            onCancel={() => setShowPopulateConfirm(false)}
            type="danger"
          />
        )}

        {/* Admin Actions */}
        {currentUser?.role === 'admin' && (
          <div className="flex justify-end pr-2">
            <button
              onClick={() => setShowPopulateConfirm(true)}
              className="bg-green-600/10 hover:bg-green-600 text-green-700 hover:text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ring-1 ring-green-600/20"
            >
              <Database size={14} />
              Reset & Populate Demo Data
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-[#10b981] to-[#059669] rounded-3xl shadow-xl shadow-green-500/20 p-6 text-white transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-green-100/80 text-[10px] font-bold uppercase tracking-[0.1em]">Total Biochar</p>
                <p className="text-3xl font-black mt-1">
                  {dashboardStats.total_biochar_produced?.toLocaleString()} <span className="text-lg font-medium opacity-70">kg</span>
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md flex-shrink-0 ring-1 ring-white/30">
                <Factory size={22} className="text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-green-100">
              <div className="px-2 py-0.5 rounded-full bg-white/20 mr-2 flex items-center">
                <Activity size={12} className="mr-1" />
                <span>Active</span>
              </div>
              <span className="opacity-80 font-medium">Updated just now</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#a855f7] to-[#7e22ce] rounded-3xl shadow-xl shadow-purple-500/20 p-6 text-white transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-purple-100/80 text-[10px] font-bold uppercase tracking-[0.1em]">CO₂ Sequestered</p>
                <p className="text-3xl font-black mt-1">
                  {dashboardStats.co2_sequestered?.toLocaleString()} <span className="text-lg font-medium opacity-70">kg</span>
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md flex-shrink-0 ring-1 ring-white/30">
                <Leaf size={22} className="text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-purple-100">
              <div className="px-2 py-0.5 rounded-full bg-white/20 mr-2 flex items-center">
                <Award size={12} className="mr-1" />
                <span>Certified</span>
              </div>
              <span className="opacity-80 font-medium">Verification active</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-3xl shadow-xl shadow-blue-500/20 p-6 text-white transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-blue-100/80 text-[10px] font-bold uppercase tracking-[0.1em]">Verified Batches</p>
                <p className="text-3xl font-black mt-1">
                  {dashboardStats.verified_batches}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md flex-shrink-0 ring-1 ring-white/30">
                <CheckCircle size={22} className="text-white" />
              </div>
            </div>
            <div className="mt-6">
              <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-white rounded-full h-1.5 shadow-[0_0_8px_white]"
                  style={{ width: `${(dashboardStats.verified_batches / (dashboardStats.total_batches || 1)) * 100}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-blue-100 mt-2 uppercase tracking-wider opacity-80">{dashboardStats.verified_batches} of {dashboardStats.total_batches || 0} batches verified</p>
            </div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-6 border transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden`}>
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'} text-[10px] font-bold uppercase tracking-[0.1em]`}>Pending Actions</p>
                <p className={`text-3xl font-black mt-1 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>
                  {dashboardStats.pending_batches || dashboardStats.pending_plots || 0}
                </p>
              </div>
              <div className={`${theme === 'dark' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-yellow-50 text-yellow-500'} p-3 rounded-2xl flex-shrink-0 ring-1 ring-yellow-400/20`}>
                <Clock size={22} />
              </div>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-yellow-600">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                <AlertTriangle size={12} />
                <span>Attention</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-2 border-b px-4 rounded-t-3xl overflow-x-auto no-scrollbar ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
          {[
            { id: 'dashboard', icon: Home, label: t('dashboard.overview') },
            { id: 'process', icon: ClipboardCheck, label: t('dashboard.process_status') },
            { id: 'alldata', icon: Database, label: t('dashboard.all_data') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                ? 'border-green-500 text-green-500'
                : 'border-transparent text-gray-500 hover:text-green-400'
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Biomass Plots Section */}
            <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-6 border`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Biomass Plots</h3>
                  <p className="text-sm text-gray-500 mt-1">Your registered biomass collection sites</p>
                </div>
                <div className="text-sm text-gray-600">
                  Total: <span className="font-semibold">{biomassPlots.length}</span> plots
                </div>
              </div>

              {biomassPlots.length === 0 ? (
                <EmptyState
                  icon={MapPin}
                  title="No biomass plots registered yet"
                  description="Start your carbon removal journey by registering your first biomass plot. Upload photos, add location details, and track your contribution to climate action."
                  actionText="Register First Plot"
                  onAction={() => setActiveModule('biomass-id')}
                  secondaryActionText="Learn More"
                  onSecondaryAction={() => window.open('https://docs.haritswaraj.com', '_blank')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {biomassPlots.map(plot => (
                    <div key={plot.id} className={`${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-100 hover:shadow-lg'} border rounded-2xl p-4 transition-all duration-300`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-600">{plot.plot_id}</h4>
                          <p className="text-sm text-gray-600">{plot.type} - {plot.species}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${plot.status === 'verified' ? 'bg-green-100 text-green-800' :
                          plot.status === 'suspicious' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {plot.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Area:</span>
                          <span className="font-medium">{plot.area} acres</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expected Biomass:</span>
                          <span className="font-medium">{plot.expected_biomass} tons</span>
                        </div>

                        {plot.photos && plot.photos.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                              <Camera size={12} /> Registered Photos:
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {plot.photos.map((photo, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={`${apiUrl}/uploads/${photo.photo_path}`}
                                  alt={`Plot ${plot.plot_id} - ${pIdx}`}
                                  className="w-16 h-16 object-cover rounded-md border border-gray-200"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between pt-2 border-t mt-2">
                          <span className="text-gray-500 text-xs">Registered:</span>
                          <span className="text-xs text-gray-600">{new Date(plot.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Timeline */}
            <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-6 border`}>
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[...biomassPlots.slice(0, 3).map(plot => ({
                  type: 'plot',
                  id: plot.plot_id,
                  status: plot.status,
                  timestamp: plot.created_at,
                  description: `Biomass plot registered - ${plot.type}`
                })), ...biocharBatches.slice(0, 3).map(batch => ({
                  type: 'batch',
                  id: batch.batch_id,
                  status: batch.status,
                  timestamp: batch.created_at,
                  description: `Biochar batch produced - ${batch.biochar_output} kg`
                }))].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5).map((activity, idx) => (
                  <div key={idx} className={`flex items-start gap-4 pb-4 border-b last:border-b-0 ${theme === 'dark' ? 'border-slate-700' : 'border-gray-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === 'plot' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                      {activity.type === 'plot' ? <MapPin size={20} className="text-blue-600" /> : <Package size={20} className="text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{activity.id}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${activity.status === 'verified' ? 'bg-green-100 text-green-800' :
                          activity.status === 'flagged' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {activity.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'process' && (
          <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-6 border`}>
            <h3 className="text-lg font-semibold mb-6">{t('dashboard.process_status')}</h3>

            {/* Biochar Lifecycle Pipeline */}
            <div className="mb-8">
              <h4 className="font-medium text-gray-700 mb-4">Biochar Production Lifecycle</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Stage 1: Biomass Collection */}
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${biomassPlots.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    <MapPin size={24} className="text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Biomass Collection</p>
                  <p className="text-lg font-bold text-green-600">{biomassPlots.length}</p>
                  <p className="text-xs text-gray-500">plots</p>
                </div>

                {/* Stage 2: Quality Verification */}
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${dashboardStats.verified_plots > 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    <CheckCircle size={24} className="text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Plot Verification</p>
                  <p className="text-lg font-bold text-green-600">{dashboardStats.verified_plots}</p>
                  <p className="text-xs text-gray-500">verified</p>
                </div>

                {/* Stage 3: Pyrolysis Process */}
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${biocharBatches.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    <Flame size={24} className="text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Pyrolysis</p>
                  <p className="text-lg font-bold text-green-600">{biocharBatches.length}</p>
                  <p className="text-xs text-gray-500">batches</p>
                </div>

                {/* Stage 4: Biochar Production */}
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${dashboardStats.total_biochar_produced > 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    <Package size={24} className="text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Production</p>
                  <p className="text-lg font-bold text-green-600">{dashboardStats.total_biochar_produced?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">kg</p>
                </div>

                {/* Stage 5: Quality Testing */}
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${dashboardStats.verified_batches > 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    <ClipboardCheck size={24} className="text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Testing</p>
                  <p className="text-lg font-bold text-green-600">{dashboardStats.verified_batches}</p>
                  <p className="text-xs text-gray-500">verified</p>
                </div>

                {/* Stage 6: Carbon Credits */}
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${dashboardStats.co2_sequestered > 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    <Award size={24} className="text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Carbon Credits</p>
                  <p className="text-lg font-bold text-green-600">{(dashboardStats.co2_sequestered / 1000).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">tCO₂</p>
                </div>
              </div>
            </div>

            {/* Active Batches Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">Verified Batches</p>
                    <p className="text-2xl font-bold text-green-800">{dashboardStats.verified_batches}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-yellow-700 font-medium">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-800">{dashboardStats.flagged_batches}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Total Production</p>
                    <p className="text-2xl font-bold text-blue-800">{dashboardStats.total_batches}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'alldata' && (
          <div className="space-y-6">
            {/* Biomass Plots — Advanced DataTable */}
            <DataTable
              title="All Biomass Plots"
              subtitle="Complete list of registered biomass collection sites"
              icon={<MapPin size={20} />}
              accentColor="green"
              data={biomassPlots}
              pageSize={8}
              emptyMessage="No biomass plots registered yet."
              searchPlaceholder="Search plot ID, species, type…"
              columns={[
                {
                  key: 'plot_id', label: 'Plot ID', mobileMain: true,
                  render: v => <span className="font-bold text-green-700">{v}</span>
                },
                { key: 'type', label: 'Type' },
                { key: 'species', label: 'Species' },
                { key: 'area', label: 'Area (ac)', align: 'center' },
                { key: 'expected_biomass', label: 'Biomass (t)', align: 'center' },
                {
                  key: 'status', label: 'Status',
                  render: v => (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${v === 'verified' ? 'bg-green-100 text-green-800' :
                      v === 'suspicious' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-600'}`}>{v}</span>
                  )
                },
                {
                  key: 'created_at', label: 'Registered',
                  render: v => <span className="text-xs text-gray-500">{new Date(v).toLocaleDateString()}</span>
                },
              ]}
            />

            {/* Biochar Batches — Advanced DataTable */}
            <DataTable
              title="All Biochar Batches"
              subtitle="Complete production history with verification status"
              icon={<Package size={20} />}
              accentColor="blue"
              data={biocharBatches}
              pageSize={8}
              emptyMessage="No biochar batches recorded yet."
              searchPlaceholder="Search batch ID, kiln type, status…"
              columns={[
                {
                  key: 'batch_id', label: 'Batch ID', mobileMain: true,
                  render: v => <span className="font-bold text-blue-700">{v}</span>
                },
                { key: 'biomass_input', label: 'Biomass (kg)', align: 'center' },
                {
                  key: 'biochar_output', label: 'Biochar (kg)', align: 'center',
                  render: v => <span className="font-bold">{v}</span>
                },
                {
                  key: 'ratio', label: 'Ratio', align: 'center',
                  render: v => <span>{v?.toFixed(2)}</span>
                },
                {
                  key: 'co2_removed', label: 'CO₂ (kg)', align: 'center',
                  render: v => <span className="text-green-700 font-semibold">{v?.toFixed(2)}</span>
                },
                {
                  key: 'kiln_type', label: 'Kiln Type',
                  render: v => <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">{v || 'Standard'}</span>
                },
                {
                  key: 'status', label: 'Status',
                  render: v => (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${v === 'verified' ? 'bg-green-100 text-green-800' :
                      v === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>{v}</span>
                  )
                },
                {
                  key: 'created_at', label: 'Created',
                  render: v => <span className="text-xs text-gray-500">{new Date(v).toLocaleDateString()}</span>
                },
              ]}
            />

            {/* Biomass Harvests — Advanced DataTable */}
            <DataTable
              title="Biomass Harvests"
              subtitle="History of biomass collected from plots"
              icon={<Leaf size={20} />}
              accentColor="green"
              data={harvests}
              pageSize={8}
              emptyMessage="No harvests recorded yet."
              searchPlaceholder="Search harvest ID, plot…"
              columns={[
                {
                  key: 'biomass_batch_id', label: 'Harvest ID', mobileMain: true,
                  render: v => <span className="font-bold text-green-700">{v}</span>
                },
                { key: 'plot_id', label: 'Plot', render: v => `Plot #${v}` },
                {
                  key: 'actual_harvested_ton', label: 'Qty (tons)', align: 'center',
                  render: v => <span className="font-bold">{v}</span>
                },
                {
                  key: 'photo_path_1', label: 'Photos', sortable: false, noSearch: true,
                  render: (v, row) => (
                    <div className="flex gap-1">
                      {v && <img src={`${apiUrl}/uploads/${v.split('/').pop()}`} className="w-9 h-9 object-cover rounded-lg border" alt="p1" />}
                      {row.photo_path_2 && <img src={`${apiUrl}/uploads/${row.photo_path_2.split('/').pop()}`} className="w-9 h-9 object-cover rounded-lg border" alt="p2" />}
                    </div>
                  )
                },
                {
                  key: 'created_at', label: 'Date',
                  render: v => <span className="text-xs text-gray-500">{new Date(v).toLocaleDateString()}</span>
                },
              ]}
            />

            {/* Transport Logistics — Advanced DataTable */}
            <DataTable
              title="Logistics & Transport"
              subtitle="Inbound and outbound transport records"
              icon={<Truck size={20} />}
              accentColor="blue"
              data={transports}
              pageSize={8}
              emptyMessage="No transport records found."
              searchPlaceholder="Search shipment ID, vehicle, route…"
              columns={[
                {
                  key: 'shipment_id', label: 'Shipment ID', mobileMain: true,
                  render: v => <span className="font-bold font-mono text-sm">{v}</span>
                },
                {
                  key: 'transport_type', label: 'Type',
                  render: v => (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${v === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {v}
                    </span>
                  )
                },
                {
                  key: 'vehicle_number', label: 'Vehicle',
                  render: (v, row) => <div><div className="font-medium text-sm">{v}</div><div className="text-xs text-gray-400">{row.vehicle_type}</div></div>
                },
                {
                  key: 'route_from', label: 'Route', noSearch: false,
                  render: (v, row) => <span className="text-xs">{v} → {row.route_to}</span>
                },
                {
                  key: 'quantity_kg', label: 'Qty (kg)', align: 'center',
                  render: v => <span className="font-bold">{v}</span>
                },
                {
                  key: 'loading_photo_path', label: 'Photos', sortable: false, noSearch: true,
                  render: (v, row) => (
                    <div className="flex gap-1">
                      {v && <img src={`${apiUrl}/uploads/${v.split('/').pop()}`} className="w-9 h-9 object-cover rounded-lg border" alt="load" />}
                      {row.unloading_photo_path && <img src={`${apiUrl}/uploads/${row.unloading_photo_path.split('/').pop()}`} className="w-9 h-9 object-cover rounded-lg border" alt="unload" />}
                    </div>
                  )
                },
              ]}
            />
          </div>
        )}

        {/* Biochar Batches Table - Enhanced (DataTable) */}
        <DataTable
          title="Biochar Batches"
          subtitle="Click 'View Details' on any batch to see full information"
          icon={<Package size={20} />}
          accentColor="green"
          data={biocharBatches}
          pageSize={8}
          emptyMessage="No biochar batches recorded yet."
          searchPlaceholder="Search batch ID, kiln type, status…"
          columns={[
            {
              key: 'batch_id', label: 'Batch ID', mobileMain: true,
              render: v => <span className="font-bold text-green-700">{v}</span>
            },
            { key: 'biomass_input', label: 'Biomass (kg)', align: 'center' },
            {
              key: 'biochar_output', label: 'Biochar (kg)', align: 'center',
              render: v => <span className="font-bold">{v}</span>
            },
            {
              key: 'ratio', label: 'Ratio', align: 'center',
              render: v => <span>{v?.toFixed(2)}</span>
            },
            {
              key: 'co2_removed', label: 'CO₂ (kg)', align: 'center',
              render: v => <span className="font-semibold text-green-700">{v?.toFixed(2)}</span>
            },
            {
              key: 'kiln_type', label: 'Kiln Type',
              render: v => <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">{v || 'Standard'}</span>
            },
            {
              key: 'status', label: 'Status',
              render: v => (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${v === 'verified' ? 'bg-green-100 text-green-800' :
                  v === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}`}>{v}</span>
              )
            },
          ]}
          actions={[
            {
              label: 'View Details',
              icon: <span className="text-xs font-bold">→</span>,
              colorClass: 'hover:!text-green-700 hover:!bg-green-50',
              onClick: (row) => handleBatchClick(row),
            }
          ]}
        />

        {/* Batch Detail Modal */}
        {showBatchModal && selectedBatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowBatchModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Batch Details</h2>
                    <p className="text-green-100 mt-1">{selectedBatch.batch_id}</p>
                  </div>
                  <button
                    onClick={() => setShowBatchModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="width" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Production Information */}
                <div>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>
                    <Package size={20} className="text-green-600" />
                    Production Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className={`${theme === 'dark' ? 'bg-slate-700/50 text-slate-100' : 'bg-gray-50 text-gray-900'} p-4 rounded-xl`}>
                      <p className="text-sm text-gray-600">Biomass Input</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedBatch.biomass_input} kg</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Biochar Output</p>
                      <p className="text-2xl font-bold text-green-700">{selectedBatch.biochar_output} kg</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Conversion Ratio</p>
                      <p className="text-2xl font-bold text-blue-700">{selectedBatch.ratio.toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">CO₂ Sequestered</p>
                      <p className="text-2xl font-bold text-purple-700">{selectedBatch.co2_removed.toFixed(2)} kg</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Kiln Type</p>
                      <p className="text-lg font-semibold text-orange-700">{selectedBatch.kiln_type || 'Standard Kiln'}</p>
                    </div>
                    <div className={`${theme === 'dark' ? 'bg-slate-700/50 text-slate-100' : 'bg-gray-50 text-gray-900'} p-4 rounded-xl`}>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${selectedBatch.status === 'verified' ? 'bg-green-100 text-green-800' :
                        selectedBatch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {selectedBatch.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Photos & Media */}
                {selectedBatch.photo_path && (
                  <div>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>
                      <Camera size={20} className="text-green-600" />
                      Photos & Media
                    </h3>
                    <div className={`${theme === 'dark' ? 'bg-slate-700/50 text-slate-100' : 'bg-gray-50 text-gray-900'} p-4 rounded-xl`}>
                      <img
                        src={`${apiUrl}/uploads/${selectedBatch.photo_path.split('/').pop()}`}
                        alt="Batch"
                        className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200"
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">Batch Production Photo</p>
                    </div>
                  </div>
                )}

                {/* Quality Metrics */}
                <div>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>
                    <CheckCircle size={20} className="text-green-600" />
                    Quality Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'} border p-4 rounded-xl`}>
                      <p className="text-xs text-gray-500 uppercase">Carbon Content</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">Pending Analysis</p>
                    </div>
                    <div className={`${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'} border p-4 rounded-xl`}>
                      <p className="text-xs text-gray-500 uppercase">pH Level</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">Verify in Field</p>
                    </div>
                    <div className={`${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'} border p-4 rounded-xl`}>
                      <p className="text-xs text-gray-500 uppercase">Ash Content</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">QC Waiting</p>
                    </div>
                    <div className={`${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'} border p-4 rounded-xl`}>
                      <p className="text-xs text-gray-500 uppercase">Moisture</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">Testing...</p>
                    </div>
                  </div>
                </div>

                {/* Environmental Impact */}
                <div>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>
                    <Leaf size={20} className="text-green-600" />
                    Environmental Impact
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Carbon Sequestration</p>
                        <p className="text-3xl font-bold text-green-800 mt-2">{selectedBatch.co2_removed.toFixed(2)} kg CO₂</p>
                        <p className="text-sm text-green-600 mt-2">Equivalent to planting {Math.round(selectedBatch.co2_removed / 21)} trees</p>
                      </div>
                      <div>
                        <p className="text-sm text-green-700 font-medium">Carbon Credits</p>
                        <p className="text-3xl font-bold text-green-800 mt-2">{(selectedBatch.co2_removed / 1000).toFixed(3)} tCO₂</p>
                        <p className="text-sm text-green-600 mt-2">Verified carbon offset credits</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production Timeline */}
                <div>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>
                    <ClipboardCheck size={20} className="text-green-600" />
                    Production Timeline
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Batch Created</p>
                        <p className="text-sm text-gray-500">{new Date(selectedBatch.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Pyrolysis Completed</p>
                        <p className="text-sm text-gray-500">Duration: 4-6 hours at 400-500°C</p>
                      </div>
                    </div>
                    {selectedBatch.status === 'verified' && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle size={16} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Verified & Certified</p>
                          <p className="text-sm text-gray-500">Quality standards met</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ML Prediction */}
                {selectedBatch.ml_prediction && (
                  <div>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>
                      <AlertTriangle size={20} className="text-orange-600" />
                      ML Fraud Detection
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        Anomaly Score: <span className="font-bold">{selectedBatch.ml_prediction.anomaly_score || 'Normal'}</span>
                      </p>
                      <p className="text-xs text-blue-600 mt-2">This batch has been analyzed by our ML fraud detection system</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
                    Download Certificate
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    View on Blockchain
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============ BIOMASS ID COMPONENT ============



  // ============ MANUFACTURING COMPONENT ============



  // ============ MAIN RENDER ============


  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const userModules = modules[currentUser?.role] || [];

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-mesh-premium text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        userModules={userModules}
        moduleLabels={moduleLabels}
        currentUser={currentUser}
        isMobile={isMobile}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className={`${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/70 border-white/20'} backdrop-blur-2xl sticky top-0 z-30 border-b transition-all duration-500`}>
          <div className="px-6 md:px-10 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isMobile && (
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                >
                  <Menu size={24} />
                </button>
              )}
              {![
                'biomass-id', 'harvest', 'transport', 'manufacturing',
                'technical-ops', 'distribution', 'supply-chain',
                'my-plots', 'my-batches', 'all-plots', 'all-batches',
                'audit-submission', 'settings'
              ].includes(activeModule) && (
                  <div className="flex flex-col">
                    <h1 className={`text-lg md:text-2xl font-black uppercase tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-emerald-950'}`}>
                      {activeModule.replace('-', ' ')}
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest leading-none">Terminal Session Active</p>
                    </div>
                  </div>
                )}
            </div>

            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className={`hidden sm:flex items-center rounded-2xl px-3 py-1.5 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                <Globe size={14} className="text-emerald-600 mr-2" />
                <select
                  value={i18n.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent text-[11px] font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer outline-none text-slate-600"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                </select>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-500/20 transition-all active:scale-95"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">{t('auth.logout')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-50 flex items-center justify-center animate-in fade-in duration-300">
              <LoadingSpinner />
            </div>
          )}
          <div>
            {/* Welcome Card for First-Time Users */}
            {showWelcome && (
              <WelcomeCard
                user={currentUser}
                onDismiss={() => {
                  setShowWelcome(false);
                  localStorage.setItem(`welcome_seen_${currentUser.id}`, 'true');
                }}
                onGetStarted={() => {
                  setShowWelcome(false);
                  localStorage.setItem(`welcome_seen_${currentUser.id}`, 'true');
                  // Navigate based on role
                  if (currentUser.role === 'farmer') setActiveModule('biomass-id');
                  else if (currentUser.role === 'owner') setActiveModule('supply-chain');
                  else if (currentUser.role === 'auditor') setActiveModule('all-plots');
                  else setActiveModule('dashboard');
                }}
              />
            )}

            {activeModule === 'dashboard' && <DashboardView />}
            {activeModule === 'supply-chain' && (
              <SupplyChainWizard
                theme={theme}
                fetchWithAuth={fetchWithAuth}
                plotForm={plotForm}
                setPlotForm={setPlotForm}
                refreshData={() => {
                  fetchPlots();
                  fetchDashboardData();
                  showToast('Plot registered successfully!', 'success');
                }}
                plots={biomassPlots}
                batches={biocharBatches}
                distributions={distributions}
                harvests={harvests}
                transports={transports}
                fetchBatches={fetchBatches}
                fetchDashboardData={fetchDashboardData}
                onDelete={handleDeleteDistribution}
                onSuccess={fetchAllData}
              />
            )}
            {activeModule === 'biomass-id' && (
              <BiomassIdView
                plotForm={plotForm}
                setPlotForm={setPlotForm}
                fetchWithAuth={fetchWithAuth}
                theme={theme}
                refreshData={() => {
                  fetchPlots();
                  fetchDashboardData();
                  showToast('Plot registered successfully!', 'success');
                }}
              />
            )}
            {activeModule === 'harvest' && (
              <BiomassHarvestView
                plots={biomassPlots}
                fetchWithAuth={fetchWithAuth}
                theme={theme}
                onSuccess={() => {
                  fetchHarvests();
                  fetchDashboardData();
                }}
              />
            )}
            {activeModule === 'transport' && (
              <TransportView
                fetchWithAuth={fetchWithAuth}
                batches={biocharBatches}
                distributions={distributions}
                harvests={harvests}
                theme={theme}
                onSuccess={() => {
                  fetchTransports();
                  fetchDashboardData();
                }}
              />
            )}
            {activeModule === 'manufacturing' && (
              <ManufacturingView
                fetchWithAuth={fetchWithAuth}
                fetchBatches={fetchBatches}
                fetchDashboardData={fetchDashboardData}
                theme={theme}
              />
            )}
            {activeModule === 'distribution' && (
              <DistributionView
                batches={biocharBatches}
                distributions={distributions}
                fetchWithAuth={fetchWithAuth}
                onDelete={handleDeleteDistribution}
                theme={theme}
                onSuccess={() => {
                  fetchDistributions();
                  fetchDashboardData();
                }}
              />
            )}
            {activeModule === 'my-plots' && (
              <MyPlotsView
                plots={biomassPlots}
                onEdit={setEditingPlot}
                onDelete={handleDeletePlot}
                apiUrl={apiUrl}
                theme={theme}
              />
            )}
            {activeModule === 'my-batches' && (
              <MyBatchesView
                batches={biocharBatches}
                onDelete={handleDeleteBatch}
                theme={theme}
              />
            )}
            {activeModule === 'all-plots' && (
              <MyPlotsView
                plots={biomassPlots}
                onEdit={setEditingPlot}
                onDelete={handleDeletePlot}
                apiUrl={apiUrl}
                theme={theme}
              />
            )}
            {activeModule === 'all-batches' && (
              <MyBatchesView
                batches={biocharBatches}
                onDelete={handleDeleteBatch}
                theme={theme}
              />
            )}
            {activeModule === 'technical-ops' && (
              <TechnicalOperationsView
                fetchWithAuth={fetchWithAuth}
                harvests={harvests}
                batches={biocharBatches}
                theme={theme}
              />
            )}
            {activeModule === 'audit-submission' && (
              <AuditSubmissionView
                fetchWithAuth={fetchWithAuth}
                plots={biomassPlots}
                theme={theme}
              />
            )}
            {activeModule === 'settings' && (
              <ProfileView
                currentUser={currentUser}
                fetchWithAuth={fetchWithAuth}
                showToast={showToast}
                theme={theme}
                apiUrl={apiUrl}
                onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Edit Plot Modal */}
      {editingPlot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border animate-in zoom-in duration-300`}>
            <div className="gradient-primary p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Edit Plot Information</h3>
                  <p className="text-xs text-green-50/80">Updating ID: {editingPlot.plot_id}</p>
                </div>
              </div>
              <button onClick={() => setEditingPlot(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdatePlot} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold opacity-70">Biomass Classification</label>
                  <select
                    value={editingPlot.type}
                    onChange={e => setEditingPlot({ ...editingPlot, type: e.target.value })}
                    className={`w-full px-5 py-3 rounded-2xl border outline-none transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-600 focus:border-green-500' : 'bg-gray-50 border-gray-200 focus:border-green-600'}`}
                  >
                    <option value="Wood">Forestry / Wood Waste</option>
                    <option value="Agricultural Waste">Agro-Residues</option>
                    <option value="Invasive Species">Invasive Species</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold opacity-70">Flora Species</label>
                  <input
                    type="text"
                    value={editingPlot.species}
                    onChange={e => setEditingPlot({ ...editingPlot, species: e.target.value })}
                    className={`w-full px-5 py-3 rounded-2xl border outline-none transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-600 focus:border-green-500' : 'bg-gray-50 border-gray-200 focus:border-green-600'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold opacity-70">Area (ac)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingPlot.area}
                      onChange={e => setEditingPlot({ ...editingPlot, area: e.target.value })}
                      className={`w-full px-5 py-3 rounded-2xl border outline-none transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-600 focus:border-green-500' : 'bg-gray-50 border-gray-200 focus:border-green-600'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold opacity-70">Yield (t)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingPlot.expected_biomass}
                      onChange={e => setEditingPlot({ ...editingPlot, expected_biomass: e.target.value })}
                      className={`w-full px-5 py-3 rounded-2xl border outline-none transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-600 focus:border-green-500' : 'bg-gray-50 border-gray-200 focus:border-green-600'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingPlot(null)}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-lg shadow-green-600/20 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Success Animation */}
      {showSuccess && (
        <SuccessAnimation
          message={successMessage}
          onComplete={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
};

export default HaritSwarajMRV;

