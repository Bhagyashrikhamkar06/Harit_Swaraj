import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, AlertTriangle, Users, Leaf, Factory, TrendingUp, Menu, X, Home, FileText, Truck, Droplet, MapPin, ClipboardCheck, Flame, Package, Camera, Trash2, Check, LogOut, LogIn, BarChart3, Database, Globe, Wifi, WifiOff, Download, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BiomassIdView from './components/BiomassIdView';
import BiomassHarvestView from './components/BiomassHarvestView';
import TransportView from './components/TransportView';
import DistributionView from './components/DistributionView';
import Sidebar from './components/Sidebar';
import { Toast, LoadingSpinner, EmptyState, WelcomeCard, SuccessAnimation } from './components/UXComponents';
// Dynamic API URL: Use localhost in dev, relative path in prod (when served by backend)
const API_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8000'
  : '';


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

  // PWA state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false); // Disabled PWA prompt
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Data state - now fetched from backend
  const [biomassPlots, setBiomassPlots] = useState([]);
  const [biocharBatches, setBiocharBatches] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [transports, setTransports] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Form state for Biomass ID
  const [plotForm, setPlotForm] = useState({
    plot_id: '',
    type: 'Wood',
    species: '',
    area: '',
    expected_biomass: '',
    photos: [null, null, null, null],
    kml_file: null
  });

  // Form state for Manufacturing
  const [batchForm, setBatchForm] = useState({
    batch_id: '',
    biomass_input: '',
    biochar_output: '',
    kiln_type: 'Batch Retort Kiln',
    species: '',
    video: null,
    photo: null
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
    if (isAuthenticated && currentUser) {
      const hasSeenWelcome = localStorage.getItem(`welcome_seen_${currentUser.id}`);
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    }
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
      fetchDashboardData();
      fetchPlots();
      fetchBatches();
      fetchHarvests();
      fetchTransports();
      fetchDistributions();
    }
  }, [isAuthenticated, token]);

  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_URL}${url}`, {
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
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
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
      const data = await res.json();
      setTransports(data);
    } catch (err) {
      console.error('Error fetching transports:', err);
    }
  };

  const fetchDistributions = async () => {
    try {
      const res = await fetchWithAuth('/distribution/list');
      const data = await res.json();
      setDistributions(data);
    } catch (err) {
      console.error('Error fetching distributions:', err);
    }
  };

  const handleDeleteDistribution = async (id) => {
    if (!window.confirm('Are you sure you want to delete this distribution record?')) return;
    try {
      const res = await fetchWithAuth(`/distribution/distributions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Distribution record deleted successfully', 'success');
        fetchDistributions();
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
    owner: ['dashboard', 'biomass-id', 'harvest', 'transport', 'manufacturing', 'distribution', 'my-plots', 'my-batches'],
    farmer: ['dashboard', 'biomass-id', 'harvest', 'my-plots'],
    auditor: ['dashboard', 'all-plots', 'all-batches'],
    admin: ['dashboard', 'all-plots', 'harvest', 'transport', 'manufacturing', 'distribution', 'all-batches', 'analytics']
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
    analytics: TrendingUp
  };

  const moduleLabels = {
    dashboard: t('dashboard.title'),
    'biomass-id': t('biomass.title'),
    harvest: 'Biomass Harvest',
    transport: 'Transportation',
    manufacturing: t('manufacturing.title'),
    distribution: 'Distribution & Application',
    'my-plots': t('biomass.my_plots'),
    'my-batches': t('manufacturing.my_batches'),
    'all-plots': t('biomass.all_plots'),
    'all-batches': t('manufacturing.all_batches'),
    analytics: t('dashboard.analytics')
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

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Leaf className="text-green-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">{t('app_name')}</h1>
            <p className="text-gray-600 mt-2">{t('tagline')}</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${isLogin ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${!isLogin ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.username')}</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
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
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">Demo Accounts:</p>
              <div className="text-xs text-blue-800 space-y-1">
                <p>👨‍🌾 Farmer: <code className="bg-blue-100 px-1 rounded">farmer1 / farmer123</code></p>
                <p>🏭 Owner: <code className="bg-blue-100 px-1 rounded">owner1 / owner123</code></p>
                <p>🔍 Auditor: <code className="bg-blue-100 px-1 rounded">auditor1 / auditor123</code></p>
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

    // Effect to handle fetch errors from parent or self
    useEffect(() => {
      if (!dashboardStats) {
        // Retry fetch if not loaded? Or assume parent fetched?
        // Actually, parent fetches. If parent failed, dashboardStats is null.
        // We should check if parent is loading?
        // Parent has 'loading' state but doesn't pass it.
        // Let's rely on dashboardStats being null.
        const timer = setTimeout(() => {
          if (!dashboardStats) setFetchError("Loading timeout. Check connection.");
        }, 10000);
        return () => clearTimeout(timer);
      }
    }, [dashboardStats]);

    if (fetchError && !dashboardStats) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Failed to load dashboard</h3>
          <p className="text-gray-600 mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Retry
          </button>
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
        {/* Statistics Cards - Simple Version */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Biochar</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {dashboardStats.total_biochar_kg} kg
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">CO₂ Sequestered</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {dashboardStats.total_co2_removed_kg} kg
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Verified Batches</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {dashboardStats.verified_batches}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Pending Review</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {dashboardStats.flagged_batches}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b bg-white px-4 rounded-t-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <Home size={18} className="inline mr-2" />
            {t('dashboard.overview')}
          </button>
          <button
            onClick={() => setActiveTab('process')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'process' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <ClipboardCheck size={18} className="inline mr-2" />
            {t('dashboard.process_status')}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <BarChart3 size={18} className="inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('alldata')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'alldata' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <Database size={18} className="inline mr-2" />
            {t('dashboard.all_data')}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Biomass Plots Section */}
            <div className="bg-white rounded-lg shadow p-6">
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
                    <div key={plot.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                                  src={`${API_URL}/uploads/${photo.photo_path.split('/').pop()}`}
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
            <div className="bg-white rounded-lg shadow p-6">
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
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
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
          <div className="bg-white rounded-lg shadow p-6">
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
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${dashboardStats.total_biochar_kg > 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    <Package size={24} className="text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Production</p>
                  <p className="text-lg font-bold text-green-600">{dashboardStats.total_biochar_kg}</p>
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
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${dashboardStats.total_co2_removed_kg > 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    <Award size={24} className="text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Carbon Credits</p>
                  <p className="text-lg font-bold text-green-600">{(dashboardStats.total_co2_removed_kg / 1000).toFixed(2)}</p>
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

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-6">Analytics & Insights</h3>

            {/* Production Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-700 mb-4">Production Overview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Batches:</span>
                    <span className="text-2xl font-bold text-gray-900">{dashboardStats.total_batches}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Verified:</span>
                    <span className="text-xl font-semibold text-green-600">{dashboardStats.verified_batches}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Flagged:</span>
                    <span className="text-xl font-semibold text-yellow-600">{dashboardStats.flagged_batches}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="text-xl font-bold text-green-600">
                        {dashboardStats.total_batches > 0 ? ((dashboardStats.verified_batches / dashboardStats.total_batches) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-700 mb-4">Environmental Impact</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">CO₂ Sequestered:</span>
                    <span className="text-2xl font-bold text-green-600">{dashboardStats.total_co2_removed_kg} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Carbon Credits:</span>
                    <span className="text-xl font-semibold text-blue-600">{(dashboardStats.total_co2_removed_kg / 1000).toFixed(3)} tCO₂</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Trees Equivalent:</span>
                    <span className="text-xl font-semibold text-green-600">{Math.round(dashboardStats.total_co2_removed_kg / 21)}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Avg CO₂/Batch:</span>
                      <span className="text-xl font-bold text-green-600">
                        {dashboardStats.total_batches > 0 ? (dashboardStats.total_co2_removed_kg / dashboardStats.total_batches).toFixed(2) : 0} kg
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Biomass Plots Analytics */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-700 mb-4">Biomass Collection Analytics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Plots</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats.total_plots}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Verified Plots</p>
                  <p className="text-3xl font-bold text-green-600">{dashboardStats.verified_plots}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Area</p>
                  <p className="text-3xl font-bold text-blue-600">{biomassPlots.reduce((sum, p) => sum + p.area, 0).toFixed(1)}</p>
                  <p className="text-xs text-gray-500">acres</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Expected Biomass</p>
                  <p className="text-3xl font-bold text-purple-600">{biomassPlots.reduce((sum, p) => sum + p.expected_biomass, 0).toFixed(1)}</p>
                  <p className="text-xs text-gray-500">tons</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alldata' && (
          <div className="space-y-6">
            {/* Biomass Plots Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">All Biomass Plots</h3>
                <p className="text-sm text-gray-500 mt-1">Complete list of registered biomass collection sites</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plot ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Species</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area (acres)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biomass (tons)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {biomassPlots.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          No biomass plots found
                        </td>
                      </tr>
                    ) : (
                      biomassPlots.map(plot => (
                        <tr key={plot.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-green-600">{plot.plot_id}</td>
                          <td className="px-6 py-4">{plot.type}</td>
                          <td className="px-6 py-4">{plot.species}</td>
                          <td className="px-6 py-4">{plot.area}</td>
                          <td className="px-6 py-4">{plot.expected_biomass}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${plot.status === 'verified' ? 'bg-green-100 text-green-800' :
                              plot.status === 'suspicious' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {plot.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(plot.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Biochar Batches Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">All Biochar Batches</h3>
                <p className="text-sm text-gray-500 mt-1">Complete production history with verification status</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biomass (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biochar (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ratio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CO₂ (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kiln Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {biocharBatches.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                          No biochar batches found
                        </td>
                      </tr>
                    ) : (
                      biocharBatches.map(batch => (
                        <tr key={batch.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleBatchClick(batch)}>
                          <td className="px-6 py-4 font-medium text-green-600">{batch.batch_id}</td>
                          <td className="px-6 py-4">{batch.biomass_input}</td>
                          <td className="px-6 py-4 font-semibold">{batch.biochar_output}</td>
                          <td className="px-6 py-4">{batch.ratio.toFixed(2)}</td>
                          <td className="px-6 py-4 text-green-700 font-semibold">{batch.co2_removed.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{batch.kiln_type}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${batch.status === 'verified' ? 'bg-green-100 text-green-800' :
                              batch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {batch.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(batch.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Biomass Harvests Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Biomass Harvests</h3>
                <p className="text-sm text-gray-500 mt-1">History of biomass collected from plots</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harvest ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plot</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity (Tons)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {harvests.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No harvests found</td>
                      </tr>
                    ) : (
                      harvests.map(h => (
                        <tr key={h.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-green-600">{h.biomass_batch_id}</td>
                          <td className="px-6 py-4 text-sm">Plot #{h.plot_id}</td>
                          <td className="px-6 py-4 font-semibold">{h.actual_harvested_ton}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1">
                              {h.photo_path_1 && (
                                <img
                                  src={`${API_URL}/uploads/${h.photo_path_1.split('/').pop()}`}
                                  className="w-10 h-10 object-cover rounded border" alt="h1"
                                />
                              )}
                              {h.photo_path_2 && (
                                <img
                                  src={`${API_URL}/uploads/${h.photo_path_2.split('/').pop()}`}
                                  className="w-10 h-10 object-cover rounded border" alt="h2"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(h.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transport Logistics Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Logistics & Transport</h3>
                <p className="text-sm text-gray-500 mt-1">Inbound and outbound transport records</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipment ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transports.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No transport records found</td>
                      </tr>
                    ) : (
                      transports.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-green-600">{t.shipment_id}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                              {t.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {t.vehicle_number}
                            <p className="text-xs text-gray-500">{t.vehicle_type}</p>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {t.route_from} → {t.route_to}
                          </td>
                          <td className="px-6 py-4 font-medium">{t.quantity_kg} kg</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1">
                              {t.loading_photo_path && (
                                <img
                                  src={`${API_URL}/uploads/${t.loading_photo_path.split('/').pop()}`}
                                  className="w-10 h-10 object-cover rounded border" alt="load"
                                />
                              )}
                              {t.unloading_photo_path && (
                                <img
                                  src={`${API_URL}/uploads/${t.unloading_photo_path.split('/').pop()}`}
                                  className="w-10 h-10 object-cover rounded border" alt="unload"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Biochar Batches Table - Enhanced */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Biochar Batches</h3>
              <p className="text-sm text-gray-500 mt-1">Click on any batch to view detailed information</p>
            </div>
            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold">{biocharBatches.length}</span> batches
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biomass (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biochar (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ratio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CO₂ (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kiln Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {biocharBatches.map(batch => (
                  <tr
                    key={batch.id}
                    className="hover:bg-green-50 transition-colors cursor-pointer"
                    onClick={() => handleBatchClick(batch)}
                  >
                    <td className="px-6 py-4 font-medium text-green-600">{batch.batch_id}</td>
                    <td className="px-6 py-4">{batch.biomass_input}</td>
                    <td className="px-6 py-4 font-semibold">{batch.biochar_output}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">{batch.ratio.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-green-700">{batch.co2_removed.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{batch.kiln_type || 'Standard'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${batch.status === 'verified' ? 'bg-green-100 text-green-800' :
                        batch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBatchClick(batch); }}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package size={20} className="text-green-600" />
                    Production Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
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
                    <div className="bg-gray-50 p-4 rounded-lg">
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
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Camera size={20} className="text-green-600" />
                      Photos & Media
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <img
                        src={`${API_URL}/uploads/${selectedBatch.photo_path.split('/').pop()}`}
                        alt="Batch"
                        className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200"
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">Batch Production Photo</p>
                    </div>
                  </div>
                )}

                {/* Quality Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    Quality Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border border-gray-200 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Carbon Content</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">75-85%</p>
                    </div>
                    <div className="border border-gray-200 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">pH Level</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">8.5</p>
                    </div>
                    <div className="border border-gray-200 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Ash Content</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">12%</p>
                    </div>
                    <div className="border border-gray-200 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Moisture</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">5%</p>
                    </div>
                  </div>
                </div>

                {/* Environmental Impact */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
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

  const ManufacturingView = () => {
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setMessage('');

      try {
        const formData = new FormData();
        formData.append('batch_id', batchForm.batch_id);
        formData.append('biomass_input', batchForm.biomass_input);
        formData.append('biochar_output', batchForm.biochar_output);
        formData.append('kiln_type', batchForm.kiln_type);
        formData.append('species', batchForm.species);

        if (batchForm.video) {
          formData.append('video', batchForm.video);
        }
        if (batchForm.photo) {
          formData.append('photo', batchForm.photo);
        }

        const response = await fetchWithAuth('/manufacturing/record', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to record batch');
        }

        setMessage(`✅ Batch recorded successfully! Status: ${data.status}, Ratio: ${data.ratio}`);
        setBatchForm({
          batch_id: '',
          biomass_input: '',
          biochar_output: '',
          kiln_type: 'Batch Retort Kiln',
          species: '',
          video: null,
          photo: null
        });

        // Refresh batches
        fetchBatches();
        fetchDashboardData();
      } catch (err) {
        setMessage(`❌ Error: ${err.message}`);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Factory className="text-green-600" size={24} />
          <h2 className="text-xl font-bold">{t('manufacturing.title')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('manufacturing.batch_id')}</label>
              <input
                type="text"
                value={batchForm.batch_id}
                onChange={(e) => setBatchForm({ ...batchForm, batch_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="BCH-005"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('manufacturing.kiln_type')}</label>
              <select
                value={batchForm.kiln_type}
                onChange={(e) => setBatchForm({ ...batchForm, kiln_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="Batch Retort Kiln">Batch Retort Kiln</option>
                <option value="Continuous Retort">Continuous Retort</option>
                <option value="TLUD">TLUD</option>
                <option value="Rocket Kiln">Rocket Kiln</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('manufacturing.biomass_input')}</label>
              <input
                type="number"
                step="0.1"
                value={batchForm.biomass_input}
                onChange={(e) => setBatchForm({ ...batchForm, biomass_input: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('manufacturing.biochar_output')}</label>
              <input
                type="number"
                step="0.1"
                value={batchForm.biochar_output}
                onChange={(e) => setBatchForm({ ...batchForm, biochar_output: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="125"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('manufacturing.species')}</label>
              <input
                type="text"
                value={batchForm.species}
                onChange={(e) => setBatchForm({ ...batchForm, species: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Mixed Wood"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('manufacturing.video')}</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setBatchForm({ ...batchForm, video: e.target.files[0] })}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer text-green-600 text-sm font-medium">
                  {batchForm.video ? batchForm.video.name : 'Choose video file'}
                </label>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="mx-auto text-gray-400 mb-2" size={32} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBatchForm({ ...batchForm, photo: e.target.files[0] })}
                  className="hidden"
                  id="photo-upload-batch"
                />
                <label htmlFor="photo-upload-batch" className="cursor-pointer text-green-600 text-sm font-medium">
                  {batchForm.photo ? batchForm.photo.name : 'Choose photo file'}
                </label>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {submitting ? t('common.loading') : t('manufacturing.record_batch')}
          </button>
        </form>
      </div>
    );
  };

  // ============ MY PLOTS COMPONENT ============

  const MyPlotsView = ({ onDelete }) => {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">My Biomass Plots</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plot ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Species</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area (acres)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biomass (tons)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {biomassPlots.map(plot => (
                <tr key={plot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{plot.plot_id}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {plot.photos && plot.photos.slice(0, 2).map((photo, pIdx) => (
                        <img
                          key={pIdx}
                          src={`${API_URL}/uploads/${photo.photo_path.split('/').pop()}`}
                          alt="plot"
                          className="w-10 h-10 object-cover rounded border"
                        />
                      ))}
                      {plot.photos && plot.photos.length > 2 && (
                        <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                          +{plot.photos.length - 2}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{plot.type}</span>
                    <p className="text-xs text-gray-500">{plot.species}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">{plot.area}</td>
                  <td className="px-6 py-4 text-sm">{plot.expected_biomass}</td>
                  <td className="px-6 py-4">
                    <div className="relative group inline-block">
                      <span className={`px-2 py-1 rounded text-xs cursor-help ${plot.status === 'verified' ? 'bg-green-100 text-green-800' :
                        plot.status === 'suspicious' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {plot.status}
                      </span>
                      {plot.status === 'suspicious' && plot.verification_data?.anomaly_reasons && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          <p className="font-semibold mb-1 text-yellow-400">⚠️ Suspicious Activity Detected:</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {plot.verification_data.anomaly_reasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onDelete(plot.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============ MY BATCHES COMPONENT ============

  const MyBatchesView = ({ onDelete }) => {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">My Manufacturing Batches</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biomass (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biochar (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ratio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CO₂ (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {biocharBatches.map(batch => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{batch.batch_id}</td>
                  <td className="px-6 py-4">{batch.biomass_input}</td>
                  <td className="px-6 py-4">{batch.biochar_output}</td>
                  <td className="px-6 py-4">{batch.ratio.toFixed(2)}</td>
                  <td className="px-6 py-4">{batch.co2_removed.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${batch.status === 'verified' ? 'bg-green-100 text-green-800' :
                      batch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onDelete(batch.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div >
    );
  };

  // ============ MAIN RENDER ============


  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const userModules = modules[currentUser?.role] || [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        userModules={userModules}
        moduleLabels={moduleLabels}
        currentUser={currentUser}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-200">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="text-green-600" size={28} />
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">Harit Swaraj</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Biochar MRV & Carbon Sequestration</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1">
                <Globe size={16} className="text-gray-600 mr-1" />
                <select
                  value={i18n.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent text-gray-900 text-sm border-none focus:ring-0 cursor-pointer"
                >
                  <option value="en">EN</option>
                  <option value="hi">HI</option>
                  <option value="mr">MR</option>
                </select>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">{t('auth.logout')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
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
                  else if (currentUser.role === 'owner') setActiveModule('manufacturing');
                  else if (currentUser.role === 'auditor') setActiveModule('all-plots');
                  else setActiveModule('analytics');
                }}
              />
            )}

            {activeModule === 'dashboard' && <DashboardView />}
            {activeModule === 'biomass-id' && (
              <BiomassIdView
                plotForm={plotForm}
                setPlotForm={setPlotForm}
                fetchWithAuth={fetchWithAuth}
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
              />
            )}
            {activeModule === 'transport' && (
              <TransportView
                fetchWithAuth={fetchWithAuth}
                batches={biocharBatches}
                distributions={[]}
                harvests={[]}
              />
            )}
            {activeModule === 'manufacturing' && <ManufacturingView />}
            {activeModule === 'distribution' && (
              <DistributionView
                batches={biocharBatches}
                distributions={distributions}
                fetchWithAuth={fetchWithAuth}
                onDelete={handleDeleteDistribution}
              />
            )}
            {activeModule === 'my-plots' && <MyPlotsView onDelete={handleDeletePlot} />}
            {activeModule === 'my-batches' && <MyBatchesView onDelete={handleDeleteBatch} />}
            {activeModule === 'all-plots' && <MyPlotsView onDelete={handleDeletePlot} />}
            {activeModule === 'all-batches' && <MyBatchesView onDelete={handleDeleteBatch} />}
          </div>
        </div>
      </div>

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

