import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, AlertTriangle, Users, Leaf, Factory, TrendingUp, Menu, X, Home, FileText, Truck, Droplet, MapPin, ClipboardCheck, Flame, Package, Camera, Trash2, Check, LogOut, LogIn } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000';

const HaritSwarajMRV = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);

  // UI state
  const [activeModule, setActiveModule] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data state - now fetched from backend
  const [biomassPlots, setBiomassPlots] = useState([]);
  const [biocharBatches, setBiocharBatches] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

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
    dashboard: 'Dashboard',
    'biomass-id': 'Register Plot',
    manufacturing: 'Manufacturing',
    'my-plots': 'My Plots',
    'my-batches': 'My Batches',
    'all-plots': 'All Plots',
    'all-batches': 'All Batches',
    analytics: 'Analytics'
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
            <h1 className="text-3xl font-bold text-gray-800">Harit Swaraj</h1>
            <p className="text-gray-600 mt-2">Biochar Carbon Credit MRV System</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
                  {isLogin ? 'Login' : 'Register'}
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
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-green-50 p-4 md:p-6 rounded-lg border-l-4 border-green-500">
            <p className="text-xs md:text-sm text-gray-600">Total Biochar</p>
            <p className="text-xl md:text-2xl font-bold text-green-700">{dashboardStats.total_biochar_kg} kg</p>
          </div>
          <div className="bg-blue-50 p-4 md:p-6 rounded-lg border-l-4 border-blue-500">
            <p className="text-xs md:text-sm text-gray-600">CO₂ Removed</p>
            <p className="text-xl md:text-2xl font-bold text-blue-700">{dashboardStats.total_co2_removed_kg} kg</p>
          </div>
          <div className="bg-purple-50 p-4 md:p-6 rounded-lg border-l-4 border-purple-500">
            <p className="text-xs md:text-sm text-gray-600">Verified Batches</p>
            <p className="text-xl md:text-2xl font-bold text-purple-700">{dashboardStats.verified_batches}</p>
          </div>
          <div className="bg-orange-50 p-4 md:p-6 rounded-lg border-l-4 border-orange-500">
            <p className="text-xs md:text-sm text-gray-600">Total Plots</p>
            <p className="text-xl md:text-2xl font-bold text-orange-700">{dashboardStats.total_plots}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 md:p-6 border-b">
            <h3 className="text-base md:text-lg font-semibold">Recent Biochar Batches</h3>
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
                {biocharBatches.slice(0, 5).map(batch => (
                  <tr key={batch.id}>
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
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Leaf className="text-green-600" size={32} />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Harit Swaraj</h1>
              <p className="text-xs text-gray-600">Carbon Credit MRV</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-800">{currentUser?.full_name || currentUser?.username}</p>
              <p className="text-xs text-gray-600 capitalize">{currentUser?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
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
          {activeModule === 'biomass-id' && <div className="bg-white p-6 rounded-lg shadow">Plot Registration - Coming Soon</div>}
          {activeModule === 'manufacturing' && <div className="bg-white p-6 rounded-lg shadow">Manufacturing - Coming Soon</div>}
          {activeModule === 'my-plots' && <div className="bg-white p-6 rounded-lg shadow">My Plots - Coming Soon</div>}
          {activeModule === 'my-batches' && <div className="bg-white p-6 rounded-lg shadow">My Batches - Coming Soon</div>}
        </div>
      </div>
    </div>
  );
};

export default HaritSwarajMRV;
