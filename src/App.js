import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, AlertTriangle, Users, Leaf, Factory, TrendingUp, Menu, X, Home, FileText, Truck, Droplet, MapPin, ClipboardCheck, Flame, Package, Camera, Trash2, Check, LogOut, LogIn, BarChart3, Database, Globe, Wifi, WifiOff, Download, Award, ArrowUpRight, Activity, Clock, Settings, Sliders, Server, ShieldCheck } from 'lucide-react';
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
import CustomerIdentificationView from './components/CustomerIdentificationView';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const LeafletIcon = (color) => L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#ffffff" stroke="none" /></svg>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const BiomassIcon = LeafletIcon('#10b981'); // Green
const ApplicationIcon = LeafletIcon('#3b82f6'); // Blue

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
  const [dashboardSelectedPlot, setDashboardSelectedPlot] = useState(null);
  const [dashboardPlotTab, setDashboardPlotTab] = useState('Farmer Details');

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
  const [customers, setCustomers] = useState([]);
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
    /* 
    const savedUrl = localStorage.getItem('api_url');
    if (savedUrl && savedUrl.endsWith('/')) {
      const cleanUrl = savedUrl.replace(/\/$/, '');
      setApiUrl(cleanUrl);
      localStorage.setItem('api_url', cleanUrl);
    }
    */
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
      fetchDistributions(),
      fetchCustomers()
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

  const fetchCustomers = async () => {
    try {
      const res = await fetchWithAuth('/customers/all');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
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
    owner: ['dashboard', 'supply-chain', 'biomass-id', 'harvest', 'transport', 'technical-ops', 'manufacturing', 'customer-id', 'distribution', 'my-plots', 'my-batches', 'settings'],
    farmer: ['dashboard', 'biomass-id', 'harvest', 'my-plots', 'settings'],
    auditor: ['dashboard', 'audit-submission', 'all-plots', 'all-batches', 'settings'],
    admin: ['dashboard', 'supply-chain', 'biomass-id', 'all-plots', 'harvest', 'transport', 'technical-ops', 'manufacturing', 'customer-id', 'distribution', 'all-batches', 'settings']
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
    'technical-ops': Sliders,
    'audit-submission': ShieldCheck,
    'supply-chain': Activity,
    'customer-id': Users,
    settings: Settings
  };

  const moduleLabels = {
    'biomass-id': t('biomass.title'),
    harvest: 'Biomass Harvest',
    transport: 'Transportation',
    manufacturing: t('manufacturing.title'),
    distribution: 'Biochar Distribution & Application',
    'my-plots': t('biomass.my_plots'),
    'my-batches': t('manufacturing.my_batches'),
    'all-plots': t('biomass.all_plots'),
    'all-batches': t('manufacturing.all_batches'),
    dashboard: t('dashboard.title'),
    'technical-ops': 'Biomass Pre-processing',
    'audit-submission': 'Independent Audit',
    'supply-chain': 'Process Workflow',
    'customer-id': 'Customer Identification',
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
    const [showBiomassLayer, setShowBiomassLayer] = useState(true);
    const [showAppLayer, setShowAppLayer] = useState(true);

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

        {/* Dashboard Content */}
        <div>
          {/* Premium Dashboard Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                </span>
                Dashboard
              </h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Real-time biochar supply chain overview</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-4 py-2 rounded-2xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              Live Data
            </div>
          </div>

          {/* KPI Dashboard Section mimicking Reference */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            {/* Header of the white card */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center gap-2 mb-8">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                  Supply Chain Performance
                </h3>
              </div>

              {/* Grid of 6 metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-8 mb-4">
                {[
                  {
                    label: "Biomass Identified",
                    value: (biomassPlots.reduce((acc, p) => acc + (parseFloat(p.expected_biomass) || 0), 0)).toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 6v6l4 2" /><circle cx="12" cy="12" r="10" opacity=".3" /><path d="m8 14 4-8 4 8" /><path d="M9.5 11h5" /></svg>
                  },
                  {
                    label: "Biomass Transported",
                    value: (transports?.filter(t => t.type === 'inbound').reduce((acc, t) => acc + (parseFloat(t.quantity_kg) || 0) / 1000, 0)).toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8Z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                  },
                  {
                    label: "Biomass Processed",
                    value: (biocharBatches?.reduce((acc, b) => acc + (parseFloat(b.biomass_input) || 0) / 1000, 0)).toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20" /><path d="M5 20V10l7-7 7 7v10" /><path d="M9 20v-5h6v5" /></svg>
                  },
                  {
                    label: "Biochar Manufactured",
                    value: (dashboardStats?.total_biochar_produced ? (dashboardStats.total_biochar_produced / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '0'),
                    icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v-4a4 4 0 0 0-8 0v4" /><path d="M3 16h18" /><path d="M2 20h20" /><path d="M12 8V4" /><path d="M8 8V6" /><path d="M16 8V6" /></svg>
                  },
                  {
                    label: "Biochar Shipped",
                    value: (transports?.filter(t => t.type === 'outbound').reduce((acc, t) => acc + (parseFloat(t.quantity_kg) || 0) / 1000, 0)).toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" /><path d="m7.5 4.27 9 5.15" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /><circle cx="18.5" cy="15.5" r="2.5" /><path d="M20.27 17.27 22 19" /></svg>
                  },
                  {
                    label: "Biochar Applied",
                    value: (distributions?.filter(d => d.applications && d.applications.length > 0).reduce((acc, d) => acc + (parseFloat(d.quantity_kg) || 0) / 1000, 0)).toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>
                  }
                ].map((kpi, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="text-[34px] md:text-[40px] font-semibold text-gray-900 leading-none mb-3 tracking-tight">
                      {kpi.value}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-widest">
                      <span className="text-[#10b981]">
                        {kpi.icon}
                      </span>
                      {kpi.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom info banner (like the yellow one in the reference) */}
            <div className="bg-[#fffdf2] px-8 py-3.5 border-t border-[#fef3c7] text-[11px] font-bold text-amber-800 flex items-center gap-2">
              <span className="text-amber-500" style={{ fontSize: '14px' }}>💡</span>
              Considering the current operations, investors and auditors can expect these real-time MRV figures to update automatically upon new batch submissions.
            </div>
          </div>


          {/* Plot Performance Container (Reference UI Match) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 mt-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Plot performance</h2>
                <p className="text-sm text-gray-500">
                  All information provided here is verified and authentic* 
                  <span className="text-amber-500 ml-1 cursor-pointer hover:underline font-medium">Check Sources</span> for more information.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row h-[500px] border border-gray-200 rounded-xl overflow-hidden">
              {/* Left Panel: Plot List or Details */}
              <div className="w-full md:w-1/3 bg-gray-50 p-4 border-r border-gray-200 overflow-y-auto custom-scrollbar relative">
                {!dashboardSelectedPlot ? (
                  <>
                    <div className="mb-4 relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      </div>
                      <input type="text" placeholder="Search plots here" className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block pl-10 p-2.5 placeholder-gray-400" />
                      <div className="absolute inset-y-0 right-3 flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-400 cursor-pointer hover:text-emerald-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                        <svg className="w-4 h-4 text-gray-400 cursor-pointer hover:text-emerald-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                      {biomassPlots.map((plot, i) => {
                        const sizeHa = (parseFloat(plot.expected_biomass) / 10).toFixed(1);
                        const isFaved = i % 3 === 0;
                        const randomImgId = 1579737482596 + (i * 100);
                        return (
                          <div
                            key={plot.plot_id}
                            className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all relative group"
                            onClick={() => setDashboardSelectedPlot(plot)}
                          >
                            <div className="h-[84px] relative overflow-hidden bg-gray-100">
                              <img
                                src={`https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=150&fit=crop&q=80&sig=${randomImgId}`}
                                alt={plot.species}
                                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-1.5 right-1.5 bg-black/40 p-1 rounded-full backdrop-blur-sm">
                                <svg className={`w-3.5 h-3.5 ${isFaved ? 'text-red-500 fill-current' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </div>
                            </div>
                            <div className="p-2.5">
                              <div className="text-emerald-900 text-[11px] font-bold truncate mb-0.5">{plot.plot_id} Afforestation</div>
                              <div className="text-gray-500 text-[9.5px] truncate line-clamp-1 opacity-90">{plot.village || plot.location_name || 'Farmer: Local SHG'}, {plot.district || plot.species}</div>
                              <div className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[9.5px] mt-1.5 font-semibold inline-flex items-center gap-1 border border-emerald-100">
                                <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V10z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 21V9h6v12"></path></svg>
                                {plot.area || sizeHa} (ha)
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="animate-fade-in flex flex-col h-full text-gray-800">
                    <div className="flex items-center gap-3 mb-4 cursor-pointer text-gray-500 hover:text-emerald-700 transition-colors" onClick={() => setDashboardSelectedPlot(null)}>
                      <div className="bg-emerald-50 p-1.5 rounded-md border border-emerald-100 text-emerald-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                      </div>
                      <span className="text-sm font-bold truncate flex-1 text-gray-900">{dashboardSelectedPlot.plot_id} Afforestation...</span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 shrink-0"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Farmer {dashboardSelectedPlot.farmer_name || 'Local'}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded ml-1 shrink-0 font-medium">{dashboardSelectedPlot.area || (parseFloat(dashboardSelectedPlot.expected_biomass) / 10).toFixed(1)} (ha)</span>
                    </div>

                    <div className="flex bg-white rounded-lg p-1 mb-4 border border-gray-200 text-[10px] font-semibold text-center overflow-x-auto whitespace-nowrap custom-scrollbar shrink-0 shadow-sm">
                      {['Overview', 'Scientific Data', 'Impact', 'Plot & Farmer Details'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setDashboardPlotTab(tab)}
                          className={`flex-1 min-w-[80px] px-2 py-1.5 rounded-md transition-all ${dashboardPlotTab === tab ? 'bg-emerald-600 text-white font-bold shadow-md' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {dashboardPlotTab === 'Plot & Farmer Details' && (
                      <div className="bg-white p-5 rounded-xl border border-gray-200 flex-1 overflow-y-auto custom-scrollbar shadow-inner">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                          <div>
                            <div className="text-gray-900 text-base font-bold mb-0.5">{dashboardSelectedPlot.village || 'N/A'}</div>
                            <div className="text-gray-400 text-[9px] tracking-widest uppercase font-bold">VILLAGE</div>
                          </div>
                          <div>
                            <div className="text-gray-900 text-base font-bold mb-0.5">{dashboardSelectedPlot.taluka || 'N/A'}</div>
                            <div className="text-gray-400 text-[9px] tracking-widest uppercase font-bold">TALUKA</div>
                          </div>

                          <div>
                            <div className="text-gray-900 text-[13px] font-bold mb-0.5 tracking-wide">{dashboardSelectedPlot.district || 'N/A'}</div>
                            <div className="text-gray-400 text-[9px] tracking-widest uppercase font-bold">DISTRICT</div>
                          </div>
                          <div>
                            <div className="text-gray-900 text-[13px] font-bold mb-0.5 tracking-wide">{dashboardSelectedPlot.survey_number || 'N/A'}</div>
                            <div className="text-gray-400 text-[9px] tracking-widest uppercase font-bold">SURVEY / GAT NUMBER</div>
                          </div>

                          <div>
                            <div className="text-gray-900 text-[13px] font-bold mb-0.5 tracking-wide">{dashboardSelectedPlot.species || 'N/A'}</div>
                            <div className="text-gray-400 text-[9px] tracking-widest uppercase font-bold">SPECIES</div>
                          </div>
                          <div>
                            <div className="text-gray-900 text-[13px] font-bold mb-0.5 tracking-wide">{dashboardSelectedPlot.type || 'N/A'}</div>
                            <div className="text-gray-400 text-[9px] tracking-widest uppercase font-bold">TYPE</div>
                          </div>

                          <div>
                            <div className="text-gray-900 text-[13px] font-bold mb-0.5">{dashboardSelectedPlot.area || 'N/A'}</div>
                            <div className="text-gray-400 text-[9px] tracking-widest uppercase font-bold flex items-center gap-1">PLOT AREA <span className="normal-case opacity-70">(ha)</span></div>
                          </div>
                          <div>
                            <div className="text-gray-900 text-[13px] font-bold mb-0.5">{dashboardSelectedPlot.expected_biomass || '0.0'}</div>
                            <div className="text-gray-400 text-[9px] tracking-widest uppercase font-bold">ESTIMATED YIELD (t)</div>
                          </div>

                          <div className="col-span-2 mt-2 pt-4 border-t border-gray-100 flex gap-2">
                            <div>
                              <div className="inline-block border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 rounded-full text-emerald-700 text-[10px] font-bold mb-0.5">VERIFIED</div>
                              <div className="text-gray-400 text-[9px] tracking-widest uppercase font-bold mt-1">STATUS</div>
                            </div>
                            <div>
                              <div className="inline-block border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 rounded-full text-emerald-700 text-[10px] font-bold mb-0.5">PRIVATE</div>
                              <div className="text-gray-400 text-[9px] tracking-widest uppercase font-bold mt-1">LAND OWNERSHIP</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {dashboardPlotTab === 'Scientific Data' && (
                      <div className="bg-white p-5 rounded-xl border border-gray-200 flex-1 flex flex-col items-center">
                        <div className="text-gray-800 font-bold text-sm self-start mb-6 flex items-center gap-2">
                          Soil data
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        {/* Fake Gauge Chart */}
                        <div className="relative w-48 h-24 overflow-hidden mb-2">
                          <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-gray-100 border-t-red-500 border-r-amber-500 border-b-emerald-500 border-l-gray-100 transform -rotate-[45deg]"></div>
                          <div className="absolute bottom-[-10px] left-1/2 w-1.5 h-20 bg-gray-900 shadow-md transform origin-bottom -translate-x-1/2 rotate-[35deg] rounded-full border-b-[20px] border-b-gray-800"></div>
                          <div className="absolute bottom-[-3px] left-1/2 w-3 h-3 bg-white border-2 border-emerald-500 rounded-full transform -translate-x-1/2"></div>
                        </div>
                        <div className="text-emerald-600 font-black text-lg">Excellent</div>
                        <div className="text-gray-500 text-xs mb-6 font-medium">Soil health</div>

                        <div className="w-full text-xs font-semibold">
                          <div className="grid grid-cols-4 gap-2 text-gray-400 border-b border-gray-100 pb-2 mb-2 px-2 uppercase text-[9px] tracking-wider font-bold">
                            <span className="col-span-1">Parameter</span>
                            <span className="col-span-1 text-right">Value</span>
                            <span className="col-span-1 pl-2 border-l border-gray-100">Parameter</span>
                            <span className="col-span-1 text-right">Value</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-gray-800 px-2 mb-2">
                            <span className="col-span-1 text-gray-500 text-[10px]">Mn <span className="font-normal">(mg/kg)</span></span>
                            <span className="col-span-1 text-right font-bold">2.5</span>
                            <span className="col-span-1 pl-2 border-l border-gray-100 text-gray-500 text-[10px]">Zn <span className="font-normal">(mg/kg)</span></span>
                            <span className="col-span-1 text-right font-bold">1.2</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {(dashboardPlotTab === 'Overview' || dashboardPlotTab === 'Impact') && (
                      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex-1 flex flex-col items-center justify-center text-gray-500 text-sm text-center font-medium">
                        <svg className="w-8 h-8 opacity-50 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Detailed data for {dashboardPlotTab} will be available in the next sync.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Panel: Satellite Map */}
              <div className="w-full md:w-2/3 h-full relative z-0 bg-slate-900 border-l border-[#164235]">
                <MapContainer center={[18.5204, 73.8567]} zoom={9} scrollWheelZoom={false} attributionControl={false} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                  {showBiomassLayer && biomassPlots.map((plot, idx) => {
                    const seedLat = ((idx * 37 + 13) % 100 - 50) / 250;
                    const seedLng = ((idx * 53 + 7) % 100 - 50) / 250;
                    const lat = parseFloat(plot.latitude) || (18.5204 + seedLat);
                    const lng = parseFloat(plot.longitude) || (73.8567 + seedLng);

                    // Generate a fake irregular polygon around coordinates to make it look like a real farm plot
                    const sizeH = 0.007 + (idx % 3) * 0.002;
                    const sizeV = 0.005 + (idx % 2) * 0.003;
                    const polygonCoords = [
                      [lat - sizeV, lng - sizeH],
                      [lat - sizeV * 0.8, lng + sizeH * 1.2],
                      [lat + sizeV * 1.1, lng + sizeH * 0.9],
                      [lat + sizeV, lng - sizeH * 0.7],
                      [lat, lng - sizeH * 1.1]
                    ];

                    return (
                      <Polygon
                        key={`poly-${plot.plot_id || idx}`}
                        positions={polygonCoords}
                        pathOptions={{ color: '#f97316', weight: 2.5, fillColor: '#f97316', fillOpacity: 0.15 }}
                      >
                        <Popup>
                          <div style={{ minWidth: 160 }}>
                            <div style={{ fontWeight: 800, marginBottom: 4, color: '#065f46', fontSize: 13 }}>{plot.plot_id}</div>
                            <div style={{ fontSize: 12, color: '#555', marginBottom: 8, lineHeight: 1.4 }}>
                              <strong>Location:</strong> {plot.village || 'N/A'}, {plot.district || 'N/A'}<br />
                              <strong>Survey No:</strong> {plot.survey_number || 'N/A'}<br />
                              <strong>Species:</strong> {plot.species}<br />
                              <strong>Type:</strong> {plot.type}<br />
                              <strong>Plot Area:</strong> {plot.area || ((parseFloat(plot.expected_biomass) / 10).toFixed(1))} ha<br />
                              <strong>Est. Yield:</strong> {plot.expected_biomass} t
                            </div>
                            <button
                              onClick={() => { setDashboardSelectedPlot(plot); }}
                              style={{ background: '#059669', color: '#ffffff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 800, width: '100%', boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}
                            >
                              Open Details ←
                            </button>
                          </div>
                        </Popup>
                      </Polygon>
                    );
                  })}

                  {/* Biochar Application layer as standard markers, if enabled */}
                  {showAppLayer && distributions?.filter(d => d.applications && d.applications.length > 0).map((d, dIdx) => {
                    const sLat = ((dIdx * 41 + 19) % 100 - 50) / 330;
                    const sLng = ((dIdx * 61 + 11) % 100 - 50) / 330;
                    const appLat = parseFloat(d.latitude) || (18.4804 + sLat);
                    const appLng = parseFloat(d.longitude) || (73.8267 + sLng);
                    return (
                      <Marker key={`d-${d.distribution_id || dIdx}`} position={[appLat, appLng]} icon={ApplicationIcon}>
                        <Popup>
                          <div style={{ minWidth: 160 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4, color: '#1e40af' }}>{d.distribution_id}</div>
                            <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>
                              Quantity: <strong>{d.quantity_kg} kg</strong>
                            </div>
                            <button
                              onClick={() => setActiveModule('distribution')}
                              style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, width: '100%' }}
                            >
                              View Distribution →
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>

                {/* Map style toggles overlay (like reference) */}
                <div className="absolute bottom-5 left-5 z-[400] flex gap-2">
                  <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-3 shadow-md">
                    <span className="text-gray-700 text-[11px] font-bold flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      Map Style
                    </span>
                    <button className="bg-amber-500 hover:bg-amber-600 transition-colors text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
                      RGB
                    </button>
                    <button className="bg-transparent hover:bg-gray-100 transition-colors text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-300">
                      False Colour
                    </button>
                    <button className="bg-transparent hover:bg-gray-100 transition-colors text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-300 flex items-center gap-1">
                      Labels
                      <div className="w-5 h-3 bg-emerald-500 rounded-full relative ml-1">
                        <div className="w-2.5 h-2.5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Process Tables Stacked */}
          <div className="space-y-8 pb-4">
            {/* Process Status: Biomass */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Process Status — Biomass</h3>
              </div>
              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                <MyPlotsView
                  plots={biomassPlots}
                  harvests={harvests}
                  transports={transports}
                  batches={biocharBatches}
                  onEdit={setEditingPlot}
                  onDelete={handleDeletePlot}
                  apiUrl={apiUrl}
                  theme={theme}
                  variant="minimal"
                />
              </div>
            </div>

            {/* Process Status: Biochar */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Process Status — Biochar</h3>
              </div>
              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                <MyBatchesView
                  batches={biocharBatches}
                  transports={transports}
                  distributions={distributions}
                  onDelete={handleDeleteBatch}
                  theme={theme}
                  variant="minimal"
                />
              </div>
            </div>

            {/* All Data Section */}
            <AllDataSection
              biomassPlots={biomassPlots}
              harvests={harvests}
              transports={transports}
              biocharBatches={biocharBatches}
              theme={theme}
            />
          </div>
        </div>
      </div>
    );
  };

  // ---- All Data Accordion Component (inside DashboardView) ----
  const AllDataSection = ({ biomassPlots, harvests, transports, biocharBatches, theme }) => {
    const [openSection, setOpenSection] = React.useState(null);
    const toggle = (key) => setOpenSection(prev => prev === key ? null : key);

    const sectionStyle = "rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white";
    const headerStyle = "w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors";

    const chevronIcon = (key) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className={`text-gray-400 transition-transform duration-200 ${openSection === key ? 'rotate-180' : ''}`}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );

    // Column sets for each table
    const biomassIdColumns = [
      { key: 'plot_id', label: 'Plot ID', render: v => <span className="font-semibold text-emerald-700">{v}</span> },
      { key: 'owner_name', label: 'Owner Name', render: (_, r) => r.owner_name || r.owner || '—' },
      { key: 'type', label: 'Type' },
      { key: 'species', label: 'Species' },
      { key: 'area_hectares', label: 'Area (ha)', align: 'center' },
      { key: 'expected_biomass', label: 'Expected Biomass (t)', align: 'center' },
      { key: 'location', label: 'Location', render: (_, r) => r.location || r.district || '—' },
    ];

    const harvestColumns = [
      { key: 'id', label: 'Harvest ID', render: v => <span className="font-semibold text-emerald-700">{v}</span> },
      { key: 'plot_id', label: 'Plot ID' },
      { key: 'actual_harvested_ton', label: 'Harvested (t)', align: 'center' },
      { key: 'harvesting_method', label: 'Method', render: v => v || '—' },
      { key: 'created_at', label: 'Date', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    ];

    const transportColumns = [
      { key: 'id', label: 'Transport ID', render: v => <span className="font-semibold text-emerald-700">{v}</span> },
      { key: 'type', label: 'Type', render: v => <span className={`font-bold text-xs uppercase ${v === 'inbound' ? 'text-blue-600' : 'text-orange-600'}`}>{v}</span> },
      { key: 'quantity_kg', label: 'Quantity (kg)', align: 'center' },
      { key: 'vehicle_type', label: 'Vehicle', render: v => v || '—' },
      { key: 'date', label: 'Date', render: (v, r) => v ? new Date(v).toLocaleDateString('en-IN') : (r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—') },
    ];

    const preprocessColumns = [
      { key: 'batch_id', label: 'Batch ID', render: v => <span className="font-semibold text-emerald-700">{v}</span> },
      { key: 'species', label: 'Species', render: v => v || '—' },
      { key: 'biomass_input', label: 'Biomass Input (kg)', align: 'center' },
      { key: 'preprocessing_method', label: 'Method', render: (_, r) => r.preprocessing_method || 'Drying' },
      { key: 'created_at', label: 'Date', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    ];

    const mfgColumns = [
      { key: 'batch_id', label: 'Batch ID', render: v => <span className="font-semibold text-emerald-700">{v}</span> },
      { key: 'biomass_input', label: 'Biomass Used (kg)', align: 'center' },
      { key: 'species', label: 'Species', render: v => v || '—' },
      { key: 'biochar_output', label: 'Biochar Output (kg)', align: 'center', render: v => <span className="font-bold text-emerald-700">{v}</span> },
      { key: 'pyrolysis_temp', label: 'Temp (°C)', align: 'center', render: v => v || '—' },
      { key: 'created_at', label: 'Mfg Date', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    ];

    const sections = [
      { key: 'biomass-id', label: 'Biomass Identification', count: biomassPlots.length, columns: biomassIdColumns, data: biomassPlots },
      { key: 'harvesting', label: 'Biomass Harvesting', count: harvests?.length || 0, columns: harvestColumns, data: harvests || [] },
      { key: 'transport', label: 'Transportation', count: transports?.length || 0, columns: transportColumns, data: transports || [] },
      { key: 'preprocessing', label: 'Pre-processing', count: biocharBatches?.length || 0, columns: preprocessColumns, data: biocharBatches || [] },
      { key: 'manufacturing', label: 'Biomass Manufacturing', count: biocharBatches?.length || 0, columns: mfgColumns, data: biocharBatches || [] },
    ];

    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-gray-400" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">All Data</h3>
        </div>
        <div className="space-y-2">
          {sections.map(({ key, label, count, columns, data }) => (
            <div key={key} className={sectionStyle}>
              <button className={headerStyle} onClick={() => toggle(key)}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">{label}</span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-100">{count}</span>
                </div>
                {chevronIcon(key)}
              </button>
              {openSection === key && (
                <div className="border-t border-gray-100">
                  <DataTable
                    columns={columns}
                    data={data}
                    pageSize={8}
                    accentColor="green"
                    emptyMessage={`No ${label.toLowerCase()} records found.`}
                    searchPlaceholder={`Search ${label}...`}
                    variant="default"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
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
            {activeModule === 'customer-id' && (
              <CustomerIdentificationView
                fetchWithAuth={fetchWithAuth}
                theme={theme}
                showToast={showToast}
                onSuccess={fetchAllData}
              />
            )}
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
                customers={customers}
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
                harvests={harvests}
                transports={transports}
                batches={biocharBatches}
                onEdit={setEditingPlot}
                onDelete={handleDeletePlot}
                onProceed={setActiveModule}
                apiUrl={apiUrl}
                theme={theme}
              />
            )}
            {activeModule === 'my-batches' && (
              <MyBatchesView
                batches={biocharBatches}
                transports={transports}
                distributions={distributions}
                onDelete={handleDeleteBatch}
                onProceed={setActiveModule}
                theme={theme}
              />
            )}
            {activeModule === 'all-plots' && (
              <MyPlotsView
                plots={biomassPlots}
                harvests={harvests}
                transports={transports}
                batches={biocharBatches}
                onEdit={setEditingPlot}
                onDelete={handleDeletePlot}
                onProceed={setActiveModule}
                apiUrl={apiUrl}
                theme={theme}
              />
            )}
            {activeModule === 'all-batches' && (
              <MyBatchesView
                batches={biocharBatches}
                transports={transports}
                distributions={distributions}
                onDelete={handleDeleteBatch}
                onProceed={setActiveModule}
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

