import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, AlertTriangle, Users, Leaf, Factory, TrendingUp, Menu, X, Home, FileText, Truck, Droplet, MapPin, ClipboardCheck, Flame, Package, Camera, Trash2, Check, LogOut, LogIn, BarChart3, Database, Globe, Wifi, WifiOff, Download, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_URL = process.env.REACT_APP_API_URL || '';


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
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Data state - now fetched from backend
  const [biomassPlots, setBiomassPlots] = useState([]);
  const [biocharBatches, setBiocharBatches] = useState([]);
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
    video: null
  });

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

  // PWA install prompt listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
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
    }
  }, [isAuthenticated, token]);

  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveModule('dashboard');
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
    owner: ['dashboard', 'biomass-id', 'manufacturing', 'my-plots', 'my-batches'],
    farmer: ['dashboard', 'biomass-id', 'my-plots'],
    auditor: ['dashboard', 'all-plots', 'all-batches'],
    admin: ['dashboard', 'all-plots', 'all-batches', 'analytics']
  };

  const moduleIcons = {
    dashboard: Home,
    'biomass-id': MapPin,
    manufacturing: Factory,
    'my-plots': Leaf,
    'my-batches': Package,
    'all-plots': MapPin,
    'all-batches': Package,
    analytics: TrendingUp
  };

  const moduleLabels = {
    dashboard: t('dashboard.title'),
    'biomass-id': t('biomass.title'),
    manufacturing: t('manufacturing.title'),
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
    if (!dashboardStats) {
      return <div className="text-center py-8">Loading dashboard...</div>;
    }

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome Back, {currentUser?.full_name}</h2>
          <p className="opacity-90">Harit Swaraj Platform - {currentUser?.role === 'farmer' ? 'Farmer Portal' : currentUser?.role === 'owner' ? 'Owner Biochar MRV' : 'Auditor Console'}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b bg-white px-4 rounded-t-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Home size={18} className="inline mr-2" />
            {t('dashboard.overview')}
          </button>
          <button
            onClick={() => setActiveTab('process')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'process' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <ClipboardCheck size={18} className="inline mr-2" />
            {t('dashboard.process_status')}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <BarChart3 size={18} className="inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('alldata')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'alldata' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Database size={18} className="inline mr-2" />
            {t('dashboard.all_data')}
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Biochar</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{dashboardStats.total_biochar_kg} <span className="text-sm font-normal text-gray-500">kg</span></p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg text-green-600">
                    <Package size={20} />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">CO₂ Sequestered</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{dashboardStats.total_co2_removed_kg} <span className="text-sm font-normal text-gray-500">kg</span></p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Leaf size={20} />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Batches</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{dashboardStats.verified_batches}</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    <CheckCircle size={20} />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending Actions</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{dashboardStats.flagged_batches}</p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                    <AlertTriangle size={20} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Tasks Panel */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
                <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <ClipboardCheck size={18} className="text-orange-500" />
                    Pending Tasks (Phase 1)
                  </h3>
                </div>
                <div className="p-4">
                  {biocharBatches.filter(b => b.status === 'pending').length > 0 ? (
                    <div className="space-y-3">
                      {biocharBatches.filter(b => b.status === 'pending').map(batch => (
                        <div key={batch.id} className="p-3 border border-orange-100 bg-orange-50 rounded-lg flex justify-between items-center group cursor-pointer hover:bg-orange-100 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-800">Verify Batch #{batch.batch_id}</p>
                            <p className="text-xs text-gray-500">Biomass Input: {batch.biomass_input}kg</p>
                          </div>
                          <span className="text-orange-600 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <CheckCircle size={32} className="mx-auto mb-2 text-green-500 opacity-50" />
                      <p>All tasks completed! Great job.</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Process Health</h4>
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="text-gray-600">Data Uploads</span>
                      <span className="text-green-600 font-medium">Healthy</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>

                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="text-gray-600">Verification Queue</span>
                      <span className="text-blue-600 font-medium">{dashboardStats.flagged_batches} pending</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Biochar Lifecycle Pipeline */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
                <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Factory size={18} className="text-blue-500" />
                    Process Flow & Overview
                  </h3>
                </div>
                <div className="p-6">
                  <div className="relative">
                    {/* Connection Lines */}
                    <div className="absolute top-8 left-0 w-full h-1 bg-gray-100 -z-10"></div>

                    <div className="flex justify-between items-start text-center">
                      {[
                        { title: 'Biomass ID', icon: MapPin, desc: 'Register Plot & Verify Photos' },
                        { title: 'Harvesting', icon: Package, desc: 'Collect & Weigh Biomass' },
                        { title: 'Pyrolysis', icon: Flame, desc: 'Carbonization Process' },
                        { title: 'Verification', icon: ClipboardCheck, desc: 'Quality & Ratio Check' },
                        { title: 'Credit Minting', icon: Award, desc: 'Blockchain Carbon Credits' }
                      ].map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center max-w-[100px]">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm border-2 ${idx < 3 ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-green-600 text-green-600'}`}>
                            <step.icon size={24} />
                          </div>
                          <h4 className="text-xs font-bold text-gray-800">{step.title}</h4>
                          <p className="text-[10px] text-gray-500 leading-tight mt-1">{step.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-800 mb-2">How it works:</h4>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      1. <strong>Farmers</strong> register biomass plots with geotagged photos.<br />
                      2. <strong>Owners</strong> record manufacturing batches, inputting biomass weight using verified sources.<br />
                      3. System automatically calculates <strong>Conversion Ratio</strong> and <strong>CO₂ Sequestered</strong>.<br />
                      4. Anomalies are flagged for <strong>Auditor</strong> review.<br />
                      5. Verified batches automatically mint <strong>NFT Certificates</strong> on the blockchain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'process' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-xl font-bold mb-4">Detailed Process Map</h3>
            <p className="text-gray-600 mb-6">Interactive process tracking for all active batches.</p>
            {/* This would be a more detailed view in future */}
            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {biocharBatches.map(batch => (
                <div key={batch.id} className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                      {batch.batch_id.split('-')[1] || '01'}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800">{batch.batch_id}</p>
                      <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${batch.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {batch.status.toUpperCase()}
                    </span>
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${batch.status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: batch.status === 'verified' ? '100%' : '60%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Biochar Batches Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Biochar Batches</h3>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {
          activeTab === 'analytics' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
              <p className="text-gray-600">Advanced analytics and charts coming soon...</p>
            </div>
          )
        }

        {
          activeTab === 'alldata' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">All Data</h3>
              <p className="text-gray-600">Complete data export and management coming soon...</p>
            </div>
          )
        }
      </div >
    );
  };

  // ============ BIOMASS ID COMPONENT ============

  const BiomassIdView = () => {
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handlePhotoChange = (index, file) => {
      const newPhotos = [...plotForm.photos];
      newPhotos[index] = file;
      setPlotForm({ ...plotForm, photos: newPhotos });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setMessage('');

      try {
        const formData = new FormData();
        formData.append('plot_id', plotForm.plot_id);
        formData.append('type', plotForm.type);
        formData.append('species', plotForm.species);
        formData.append('area', plotForm.area);
        formData.append('expected_biomass', plotForm.expected_biomass);

        plotForm.photos.forEach((photo, idx) => {
          if (photo) formData.append(`photo_${idx}`, photo);
        });

        if (plotForm.kml_file) {
          formData.append('kml_file', plotForm.kml_file);
        }

        const response = await fetchWithAuth('/biomass/register-plot', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to register plot');
        }

        setMessage(`✅ Plot registered successfully! Status: ${data.status}`);
        setPlotForm({
          plot_id: '',
          type: 'Wood',
          species: '',
          area: '',
          expected_biomass: '',
          photos: [null, null, null, null],
          kml_file: null
        });

        // Refresh plots
        fetchPlots();
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
          <MapPin className="text-green-600" size={24} />
          <h2 className="text-xl font-bold">{t('biomass.title')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('biomass.plot_id')}</label>
              <input
                type="text"
                value={plotForm.plot_id}
                onChange={(e) => setPlotForm({ ...plotForm, plot_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="PLT-002"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('biomass.type')}</label>
              <select
                value={plotForm.type}
                onChange={(e) => setPlotForm({ ...plotForm, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="Wood">Wood</option>
                <option value="Agricultural Waste">Agricultural Waste</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('biomass.species')}</label>
              <input
                type="text"
                value={plotForm.species}
                onChange={(e) => setPlotForm({ ...plotForm, species: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Bamboo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('biomass.area')}</label>
              <input
                type="number"
                step="0.1"
                value={plotForm.area}
                onChange={(e) => setPlotForm({ ...plotForm, area: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="2.5"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('biomass.expected_biomass')}</label>
              <input
                type="number"
                step="0.1"
                value={plotForm.expected_biomass}
                onChange={(e) => setPlotForm({ ...plotForm, expected_biomass: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="15.5"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('biomass.kml_upload')}</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-600 mb-2">Drop KML file or click to browse</p>
              <input
                type="file"
                accept=".kml"
                onChange={(e) => setPlotForm({ ...plotForm, kml_file: e.target.files[0] })}
                className="hidden"
                id="kml-upload"
                required
              />
              <label htmlFor="kml-upload" className="cursor-pointer text-green-600 text-sm font-medium">
                {plotForm.kml_file ? plotForm.kml_file.name : 'Choose file'}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('biomass.photos')}</label>
            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Camera className="mx-auto text-gray-400 mb-2" size={24} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(idx, e.target.files[0])}
                    className="hidden"
                    id={`photo-${idx}`}
                    required
                  />
                  <label htmlFor={`photo-${idx}`} className="cursor-pointer text-green-600 text-xs font-medium">
                    {plotForm.photos[idx] ? plotForm.photos[idx].name : `Photo ${idx + 1}`}
                  </label>
                </div>
              ))}
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
            {submitting ? t('common.loading') : t('biomass.register_plot')}
          </button>
        </form>
      </div>
    );
  };

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
          video: null
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

  const MyPlotsView = () => {
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {biomassPlots.map(plot => (
                <tr key={plot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{plot.plot_id}</td>
                  <td className="px-6 py-4">{plot.type}</td>
                  <td className="px-6 py-4">{plot.species}</td>
                  <td className="px-6 py-4">{plot.area}</td>
                  <td className="px-6 py-4">{plot.expected_biomass}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${plot.status === 'verified' ? 'bg-green-100 text-green-800' :
                      plot.status === 'suspicious' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {plot.status}
                    </span>
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

  const MyBatchesView = () => {
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============ MAIN RENDER ============

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const userModules = modules[currentUser?.role] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Leaf className="text-white" size={32} />
            <div>
              <h1 className="text-xl font-bold text-white">Harit Swaraj</h1>
              <p className="text-xs text-green-100">Biochar MRV & Carbon Sequestration</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center bg-green-700 rounded-lg px-2 py-1">
              <Globe size={16} className="text-green-100 mr-1" />
              <select
                value={i18n.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-white text-sm border-none focus:ring-0 cursor-pointer"
              >
                <option value="en" className="text-gray-900">English</option>
                <option value="hi" className="text-gray-900">हिन्दी</option>
                <option value="mr" className="text-gray-900">मराठी</option>
              </select>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-white">{currentUser?.full_name || currentUser?.username}</p>
              <p className="text-xs text-green-100 capitalize">{currentUser?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">{t('auth.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {userModules.map(module => {
            const Icon = moduleIcons[module];
            return (
              <button
                key={module}
                onClick={() => setActiveModule(module)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeModule === module
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Icon size={18} />
                {moduleLabels[module]}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div>
          {activeModule === 'dashboard' && <DashboardView />}
          {activeModule === 'biomass-id' && <BiomassIdView />}
          {activeModule === 'manufacturing' && <ManufacturingView />}
          {activeModule === 'my-plots' && <MyPlotsView />}
          {activeModule === 'my-batches' && <MyBatchesView />}
          {activeModule === 'all-plots' && <MyPlotsView />}
          {activeModule === 'all-batches' && <MyBatchesView />}
        </div>
      </div>
    </div>
  );
};

export default HaritSwarajMRV;
