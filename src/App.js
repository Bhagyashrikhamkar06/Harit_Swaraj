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
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
    owner: ['dashboard', 'supply-chain', 'biomass-id', 'harvest', 'transport', 'manufacturing', 'technical-ops', 'distribution', 'customer-id', 'my-plots', 'my-batches', 'settings'],
    farmer: ['dashboard', 'biomass-id', 'harvest', 'my-plots', 'settings'],
    auditor: ['dashboard', 'audit-submission', 'all-plots', 'all-batches', 'settings'],
    admin: ['dashboard', 'supply-chain', 'biomass-id', 'all-plots', 'harvest', 'transport', 'manufacturing', 'technical-ops', 'distribution', 'customer-id', 'all-batches', 'settings']
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
    'technical-ops': 'Manufacturing Record',
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
          <h2 className="text-[26px] font-bold text-slate-800 mb-6 font-serif tracking-tight">Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              {
                label: "Tons of Biomass Identified",
                value: (biomassPlots.reduce((acc, p) => acc + (parseFloat(p.expected_biomass) || 0), 0)).toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0',
                icon: <div className="text-green-700 bg-white p-2 rounded shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14-4-4h2.5L8 5h8l-2.5 5H16z" /><path d="M12 14v6" /></svg></div>
              },
              {
                label: "Tons of Biomass Transported",
                value: (transports?.filter(t => t.type === 'inbound').reduce((acc, t) => acc + (parseFloat(t.quantity_kg) || 0) / 1000, 0)).toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0',
              },
              {
                label: "Tons of Biomass Processed",
                value: (biocharBatches?.reduce((acc, b) => acc + (parseFloat(b.biomass_input) || 0) / 1000, 0)).toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0',
              },
              {
                label: "Tons of Biochar Manufactured",
                value: (dashboardStats?.total_biochar_produced ? (dashboardStats.total_biochar_produced / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '0'),
              },
              {
                label: "Tons of Biochar Shipped",
                value: (transports?.filter(t => t.type === 'outbound').reduce((acc, t) => acc + (parseFloat(t.quantity_kg) || 0) / 1000, 0)).toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0',
              },
              {
                label: "Tons of Biochar Applied",
                value: (distributions?.filter(d => d.applications && d.applications.length > 0).reduce((acc, d) => acc + (parseFloat(d.quantity_kg) || 0) / 1000, 0)).toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0',
              }
            ].map((kpi, idx) => (
              <div key={idx} className="bg-[#e6d5b8] rounded-lg p-6 shadow-sm border border-[#d8c3a0] relative overflow-hidden flex flex-col justify-between" style={{ minHeight: '130px' }}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[15px] font-serif text-gray-800 leading-tight w-2/3">{kpi.label}</h3>
                  {kpi.icon && kpi.icon}
                </div>
                <span className="text-3xl font-serif tracking-tight text-gray-900">{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Map Section */}
          <div className="relative rounded-lg border border-gray-200 overflow-hidden shadow-sm h-[400px] mb-12">
            <div className="w-full h-full z-0">
              <MapContainer center={[18.5204, 73.8567]} zoom={9} scrollWheelZoom={false} attributionControl={false} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {biomassPlots.map((plot, idx) => {
                  // Use stable seed-based offset so pins don't jump on re-render
                  const seedLat = ((idx * 37 + 13) % 100 - 50) / 250;
                  const seedLng = ((idx * 53 + 7) % 100 - 50) / 250;
                  const lat = parseFloat(plot.latitude) || (18.5204 + seedLat);
                  const lng = parseFloat(plot.longitude) || (73.8567 + seedLng);
                  return (
                    <Marker key={`p-${plot.plot_id || idx}`} position={[lat, lng]} icon={BiomassIcon}>
                      <Popup>
                        <strong>Biomass Plot: {plot.plot_id}</strong><br />
                        {plot.type} — {plot.species}<br />
                        Expected: {plot.expected_biomass} tons
                      </Popup>
                    </Marker>
                  );
                })}

                {distributions?.filter(d => d.applications && d.applications.length > 0).map((d, dIdx) => {
                  const sLat = ((dIdx * 41 + 19) % 100 - 50) / 330;
                  const sLng = ((dIdx * 61 + 11) % 100 - 50) / 330;
                  const appLat = parseFloat(d.latitude) || (18.4804 + sLat);
                  const appLng = parseFloat(d.longitude) || (73.8267 + sLng);
                  return (
                    <Marker key={`d-${d.distribution_id || dIdx}`} position={[appLat, appLng]} icon={ApplicationIcon}>
                      <Popup>
                        <strong>Biochar Application: {d.distribution_id}</strong><br />
                        Quantity: {d.quantity_kg} kg
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-row gap-2 z-[400]">
              <button className="px-5 py-2.5 bg-white text-gray-900 font-bold text-[13px] shadow-lg cursor-default border border-gray-100 whitespace-nowrap"><span className="inline-block w-3 h-3 rounded-full bg-[#10b981] mr-2"></span>Biomass Locations</button>
              <button className="px-5 py-2.5 bg-white text-gray-900 font-bold text-[13px] shadow-lg cursor-default border border-gray-100 whitespace-nowrap"><span className="inline-block w-3 h-3 rounded-full bg-[#3b82f6] mr-2"></span>Biochar Applications</button>
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
              <div className="space-y-6 max-w-3xl mx-auto pt-10 pb-16 animate-fade-in">
                <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                    <Users size={30} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Customer Identification</h2>
                  <p className="text-gray-500 text-sm max-w-md">
                    This section will allow you to register and manage end-customers who receive and apply biochar. Linking customers to distribution records enables full supply chain traceability.
                  </p>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
                    Coming Soon
                  </span>
                </div>
              </div>
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

