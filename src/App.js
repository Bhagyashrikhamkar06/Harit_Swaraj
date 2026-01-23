import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertTriangle, Users, Leaf, Factory, TrendingUp, Menu, X, Home, FileText, Truck, Droplet, MapPin, ClipboardCheck, Flame, Package } from 'lucide-react';

const HaritSwarajMRV = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [userRole, setUserRole] = useState('owner');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [biomassPlots, setBiomassPlots] = useState([
    { id: 'PLT-001', type: 'Wood', species: 'Bamboo', area: 2.5, expectedBiomass: 15.5, status: 'locked' }
  ]);
  
  const [biocharBatches, setBiocharBatches] = useState([
    { id: 'BCH-001', biomass: 500, biochar: 125, ratio: 0.25, co2: 458.33, status: 'verified' },
    { id: 'BCH-002', biomass: 450, biochar: 108, ratio: 0.24, co2: 396, status: 'pending' },
    { id: 'BCH-003', biomass: 600, biochar: 156, ratio: 0.26, co2: 572, status: 'flagged' }
  ]);

  const [applications, setApplications] = useState([
    { id: 'APP-001', batchId: 'BCH-001', quantity: 125, purpose: 'Agriculture', status: 'pending_audit' }
  ]);

  const modules = {
    owner: ['dashboard', 'biomass-id', 'harvest', 'transport', 'manufacturing', 'distribution', 'unburnable'],
    farmer: ['dashboard', 'biochar-apply', 'my-plots'],
    auditor: ['dashboard', 'audit-assign', 'audit-report'],
    admin: ['dashboard', 'analytics', 'all-data']
  };

  const moduleIcons = {
    dashboard: Home, 'biomass-id': MapPin, harvest: Leaf, transport: Truck,
    manufacturing: Factory, distribution: Package, unburnable: Flame,
    'biochar-apply': Droplet, 'my-plots': MapPin, 'audit-assign': ClipboardCheck,
    'audit-report': FileText, analytics: TrendingUp, 'all-data': Menu
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/manufacturing/batches');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setBiocharBatches(data);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateConversionRatio = (ratio) => {
    if (ratio < 0.20) return { flag: true, reason: 'Ratio below minimum (0.20)' };
    if (ratio > 0.30) return { flag: true, reason: 'Ratio above maximum (0.30)' };
    return { flag: false, reason: '' };
  };

  const calculateCO2 = (biocharKg) => {
    return (biocharKg * 0.8 * (44/12)).toFixed(2);
  };

  const totalBiochar = biocharBatches.reduce((sum, b) => sum + b.biochar, 0);
  const totalCO2 = biocharBatches.reduce((sum, b) => sum + b.co2, 0);
  const activeBatches = biocharBatches.filter(b => b.status === 'verified' || b.status === 'pending').length;
  const pendingAudits = applications.filter(a => a.status === 'pending_audit').length;

  const DashboardView = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-green-50 p-4 md:p-6 rounded-lg border-l-4 border-green-500">
          <p className="text-xs md:text-sm text-gray-600">Total Biochar</p>
          <p className="text-xl md:text-2xl font-bold text-green-700">{totalBiochar} kg</p>
        </div>
        <div className="bg-blue-50 p-4 md:p-6 rounded-lg border-l-4 border-blue-500">
          <p className="text-xs md:text-sm text-gray-600">CO₂ Removed</p>
          <p className="text-xl md:text-2xl font-bold text-blue-700">{totalCO2.toFixed(2)} kg</p>
        </div>
        <div className="bg-purple-50 p-4 md:p-6 rounded-lg border-l-4 border-purple-500">
          <p className="text-xs md:text-sm text-gray-600">Active Batches</p>
          <p className="text-xl md:text-2xl font-bold text-purple-700">{activeBatches}</p>
        </div>
        <div className="bg-orange-50 p-4 md:p-6 rounded-lg border-l-4 border-orange-500">
          <p className="text-xs md:text-sm text-gray-600">Pending Audits</p>
          <p className="text-xl md:text-2xl font-bold text-orange-700">{pendingAudits}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4">Biochar Lifecycle Pipeline</h3>
        <div className="hidden md:flex items-center justify-between mb-4">
          {['Biomass ID', 'Harvest', 'Transport', 'Production', 'Unburnable', 'Application', 'Audit'].map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${i <= 3 ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                {i <= 3 ? <CheckCircle size={20} /> : i + 1}
              </div>
              {i < 6 && <div className={`w-12 h-1 ${i < 3 ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="md:hidden space-y-2 mb-4">
          {['Biomass ID', 'Harvest', 'Transport', 'Production', 'Unburnable', 'Application', 'Audit'].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${i <= 3 ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                {i <= 3 ? <CheckCircle size={16} /> : i + 1}
              </div>
              <p className={`text-sm font-medium ${i <= 3 ? 'text-green-700' : 'text-gray-500'}`}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 md:p-6 border-b">
          <h3 className="text-base md:text-lg font-semibold">Biochar Batches</h3>
        </div>
        <div className="hidden md:block overflow-x-auto">
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
                <tr key={batch.id}>
                  <td className="px-6 py-4 font-medium">{batch.id}</td>
                  <td className="px-6 py-4">{batch.biomass}</td>
                  <td className="px-6 py-4">{batch.biochar}</td>
                  <td className="px-6 py-4">{batch.ratio.toFixed(2)}</td>
                  <td className="px-6 py-4">{batch.co2.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      batch.status === 'verified' ? 'bg-green-100 text-green-800' :
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
        <div className="md:hidden divide-y">
          {biocharBatches.map(batch => (
            <div key={batch.id} className="p-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">{batch.id}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  batch.status === 'verified' ? 'bg-green-100 text-green-800' :
                  batch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {batch.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Biomass:</span> {batch.biomass} kg</div>
                <div><span className="text-gray-500">Biochar:</span> {batch.biochar} kg</div>
                <div><span className="text-gray-500">Ratio:</span> {batch.ratio.toFixed(2)}</div>
                <div><span className="text-gray-500">CO₂:</span> {batch.co2.toFixed(2)} kg</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const BiomassIdentificationForm = () => {
    const [form, setForm] = useState({ plotId: '', type: 'Wood', species: 'Bamboo', area: '', biomass: '' });

    const submit = () => {
      setBiomassPlots([...biomassPlots, { ...form, id: form.plotId, status: 'locked' }]);
      alert('✅ Plot registered and locked!');
      setForm({ plotId: '', type: 'Wood', species: 'Bamboo', area: '', biomass: '' });
    };

    return (
      <div className="bg-white rounded-lg shadow p-4 md:p-6 max-w-2xl mx-auto">
        <h3 className="text-lg md:text-xl font-semibold mb-6">📍 Biomass Identification</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plot ID</label>
              <input value={form.plotId} onChange={e => setForm({...form, plotId: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="PLT-002" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Biomass Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border rounded px-3 py-2">
                <option>Wood</option>
                <option>Agricultural Waste</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Species</label>
              <select value={form.species} onChange={e => setForm({...form, species: e.target.value})} className="w-full border rounded px-3 py-2">
                <option>Bamboo</option>
                <option>Babul</option>
                <option>Neem</option>
                <option>Rice Husk</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Area (acres)</label>
              <input type="number" value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="2.5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expected Biomass (tons)</label>
            <input type="number" value={form.biomass} onChange={e => setForm({...form, biomass: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="15.5" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">KML File Upload</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="mx-auto mb-2 text-gray-400" size={28} />
              <p className="text-sm text-gray-600">Drop KML file or click to browse</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Geotagged Photos (4 required)</label>
            <div className="grid grid-cols-2 gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="border-2 border-dashed rounded p-4 text-center">
                  <Upload className="mx-auto text-gray-400" size={20} />
                  <p className="text-xs mt-1">Photo {i}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
            <p className="text-sm text-blue-800"><strong>Note:</strong> Plot will be locked after submission</p>
          </div>
          <button onClick={submit} className="w-full bg-green-600 text-white py-3 rounded font-medium hover:bg-green-700">
            🔒 Register & Lock Plot
          </button>
        </div>
      </div>
    );
  };

  const ManufacturingForm = () => {
    const [form, setForm] = useState({ batchId: '', kiln: 'Batch Retort Kiln', input: '', output: '' });
    const [alert, setAlert] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (field, value) => {
      const updated = { ...form, [field]: value };
      setForm(updated);
      if (updated.input && updated.output) {
        const ratio = parseFloat(updated.output) / parseFloat(updated.input);
        setAlert(validateConversionRatio(ratio));
      }
    };

    const submit = async () => {
      if (!form.batchId || !form.input || !form.output) {
        alert('❌ Please fill all fields');
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/manufacturing/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batch_id: form.batchId,
            biomass_input: parseFloat(form.input),
            biochar_output: parseFloat(form.output),
            kiln_type: form.kiln
          })
        });

        const data = await res.json();
        alert(`✅ Batch recorded!\nStatus: ${data.status}`);
        await fetchBatches();
        setForm({ batchId: '', kiln: 'Batch Retort Kiln', input: '', output: '' });
        setAlert(null);
      } catch (err) {
        alert(`❌ Error: ${err.message}`);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="bg-white rounded-lg shadow p-4 md:p-6 max-w-2xl mx-auto">
        <h3 className="text-lg md:text-xl font-semibold mb-6">🏭 Biochar Manufacturing</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Batch ID</label>
              <input value={form.batchId} onChange={e => handleChange('batchId', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="BCH-004" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kiln Type</label>
              <select value={form.kiln} onChange={e => handleChange('kiln', e.target.value)} className="w-full border rounded px-3 py-2">
                <option>Batch Retort Kiln</option>
                <option>Continuous Retort</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Input Biomass (kg)</label>
              <input type="number" value={form.input} onChange={e => handleChange('input', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Output Biochar (kg)</label>
              <input type="number" value={form.output} onChange={e => handleChange('output', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="125" />
            </div>
          </div>
          {alert && alert.flag && (
            <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
              <p className="text-sm text-red-800"><strong>⚠️ ML Alert:</strong> {alert.reason}</p>
            </div>
          )}
          {alert && !alert.flag && (
            <div className="bg-green-50 p-4 rounded border-l-4 border-green-500">
              <p className="text-sm text-green-800"><strong>✅ Valid:</strong> Ratio within expected range (0.20-0.30)</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Processing Video</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="mx-auto mb-2 text-gray-400" size={28} />
              <p className="text-sm text-gray-600">Upload production video</p>
            </div>
          </div>
          <button onClick={submit} disabled={submitting} className="w-full bg-green-600 text-white py-3 rounded font-medium hover:bg-green-700 disabled:bg-gray-400">
            {submitting ? 'Recording...' : '📝 Record Production'}
          </button>
        </div>
      </div>
    );
  };

  const AuditForm = () => (
    <div className="bg-white rounded-lg shadow p-4 md:p-6 max-w-2xl mx-auto">
      <h3 className="text-lg md:text-xl font-semibold mb-6">🔍 Independent Audit Report</h3>
      <div className="bg-orange-50 p-4 rounded mb-6 border-l-4 border-orange-500">
        <p className="text-sm text-orange-800"><strong>Assignment:</strong> PLT-042 | 24hr notice | KML only</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Audit Type</label>
          <select className="w-full border rounded px-3 py-2">
            <option>Land Use Verification</option>
            <option>Manufacturing Facility Check</option>
            <option>Biochar Soil Sampling</option>
            <option>Full MRV Audit</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Satellite Match</label>
            <select className="w-full border rounded px-3 py-2">
              <option>Yes - Matches</option>
              <option>No - Discrepancy</option>
              <option>Partial Match</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ground Truth</label>
            <select className="w-full border rounded px-3 py-2">
              <option>Verified</option>
              <option>Not Verified</option>
              <option>Needs Review</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">4-Point Soil Sampling</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['P1','P2','P3','P4'].map(p => (
              <div key={p}>
                <label className="text-xs text-gray-600">{p}</label>
                <select className="w-full border rounded px-2 py-1 text-sm mt-1">
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estimated Biochar/Hectare (kg)</label>
          <input type="number" className="w-full border rounded px-3 py-2" placeholder="250" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Audit Notes</label>
          <textarea className="w-full border rounded px-3 py-2" rows="4" placeholder="Detailed observations..."></textarea>
        </div>
        <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
          <p className="text-sm text-red-800"><strong>⚠️ Important:</strong> Report is immutable after submission</p>
        </div>
        <button className="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700">
          🔒 Submit Immutable Audit
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-green-700 text-white p-3 md:p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Leaf size={28} />
            <div>
              <h1 className="text-lg md:text-2xl font-bold">Harit Swaraj</h1>
              <p className="text-xs md:text-sm text-green-100 hidden sm:block">Biochar MRV & Carbon Sequestration</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <select value={userRole} onChange={e => setUserRole(e.target.value)} className="bg-green-600 rounded px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm">
              <option value="owner">Owner</option>
              <option value="farmer">Farmer</option>
              <option value="auditor">Auditor</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Users size={20} className="hidden md:block" />
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg border-b">
          <div className="p-4 space-y-2">
            {modules[userRole].map(mod => {
              const Icon = moduleIcons[mod] || Home;
              return (
                <button key={mod} onClick={() => { setActiveModule(mod); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium ${
                    activeModule === mod ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}>
                  <Icon size={18} />
                  {mod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="hidden md:block bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3">
            {modules[userRole].map(mod => {
              const Icon = moduleIcons[mod] || Home;
              return (
                <button key={mod} onClick={() => setActiveModule(mod)}
                  className={`flex items-center gap-2 px-4 py-2 rounded whitespace-nowrap text-sm font-medium ${
                    activeModule === mod ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  <Icon size={16} />
                  {mod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 md:p-6">
        {activeModule === 'dashboard' && <DashboardView />}
        {activeModule === 'biomass-id' && <BiomassIdentificationForm />}
        {activeModule === 'manufacturing' && <ManufacturingForm />}
        {activeModule === 'audit-report' && <AuditForm />}
        {!['dashboard', 'biomass-id', 'manufacturing', 'audit-report'].includes(activeModule) && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">
              {activeModule.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </h3>
            <p className="text-gray-600">Form interface for this module</p>
          </div>
        )}
      </div>

      <div className="bg-gray-800 text-gray-300 py-4 md:py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs md:text-sm">Harit Swaraj - Biochar CDR | MRV-Compliant | Audit-Ready</p>
          <p className="text-xs text-gray-500 mt-2">CO₂ = Biochar × 0.8 × (44/12)</p>
        </div>
      </div>
    </div>
  );
};

export default HaritSwarajMRV;
