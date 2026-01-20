import React, { useState } from 'react';
import { Upload, Map, CheckCircle, AlertTriangle, Users, Leaf, Factory, TrendingUp } from 'lucide-react';

const HaritSwarajMRV = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [userRole, setUserRole] = useState('owner');

  // Sample data
  const [biocharBatches] = useState([
    { id: 'BCH-001', biomass: 500, biochar: 125, ratio: 0.25, co2: 458.33, status: 'verified' },
    { id: 'BCH-002', biomass: 450, biochar: 108, ratio: 0.24, co2: 396, status: 'pending' },
    { id: 'BCH-003', biomass: 600, biochar: 156, ratio: 0.26, co2: 572, status: 'flagged' }
  ]);

  const modules = {
    owner: ['dashboard', 'biomass-id', 'harvest', 'transport', 'manufacturing', 'distribution'],
    farmer: ['dashboard', 'biochar-apply', 'my-plots'],
    auditor: ['dashboard', 'audit-assign', 'audit-report'],
    admin: ['dashboard', 'analytics', 'all-modules']
  };

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Biochar</p>
              <p className="text-2xl font-bold text-green-700">389 kg</p>
            </div>
            <Leaf className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CO₂ Removed</p>
              <p className="text-2xl font-bold text-blue-700">1,426 kg</p>
            </div>
            <TrendingUp className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Batches</p>
              <p className="text-2xl font-bold text-purple-700">3</p>
            </div>
            <Factory className="text-purple-500" size={32} />
          </div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Audits</p>
              <p className="text-2xl font-bold text-orange-700">1</p>
            </div>
            <AlertTriangle className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Biochar Lifecycle Pipeline</h3>
        <div className="flex items-center justify-between mb-4">
          {['Biomass ID', 'Harvest', 'Transport', 'Production', 'Unburnable', 'Application', 'Audit'].map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i <= 3 ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                {i <= 3 ? <CheckCircle size={20} /> : i + 1}
              </div>
              {i < 6 && <div className={`w-12 h-1 ${i < 3 ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600">Current Stage: Biochar Production Complete</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Biochar Batches</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biomass (kg)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biochar (kg)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv. Ratio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CO₂ Seq. (kg)</th>
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
    </div>
  );

  const BiomassIdentificationForm = () => (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h3 className="text-xl font-semibold mb-6">Biomass Identification</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Plot ID</label>
            <input type="text" className="w-full border rounded px-3 py-2" placeholder="PLT-001" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Biomass Type</label>
            <select className="w-full border rounded px-3 py-2">
              <option>Wood</option>
              <option>Agricultural Waste</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Species</label>
            <select className="w-full border rounded px-3 py-2">
              <option>Bamboo</option>
              <option>Subabul</option>
              <option>Eucalyptus</option>
              <option>Rice Husk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Area (acres)</label>
            <input type="number" step="0.01" className="w-full border rounded px-3 py-2" placeholder="2.5" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expected Biomass (tons)</label>
          <input type="number" step="0.1" className="w-full border rounded px-3 py-2" placeholder="15.5" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">KML File Upload</label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm text-gray-600">Drop KML file or click to browse</p>
            <p className="text-xs text-gray-500 mt-1">Auto-calculates area from coordinates</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Geotagged Photos (4 required)</label>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="border-2 border-dashed rounded p-4 text-center">
                <Upload className="mx-auto text-gray-400" size={24} />
                <p className="text-xs text-gray-600 mt-1">Photo {i}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Timestamp and GPS coordinates will be automatically captured. Plot will be locked after submission.
          </p>
        </div>

        <button onClick={(e) => e.preventDefault()} className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700">
          Register Biomass Plot
        </button>
      </div>
    </div>
  );

  const ManufacturingForm = () => (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h3 className="text-xl font-semibold mb-6">Biochar Manufacturing - Batch Retort Kiln</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kiln Type</label>
            <select className="w-full border rounded px-3 py-2">
              <option>Batch Retort Kiln</option>
              <option>Continuous Retort</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Batch ID</label>
            <input type="text" className="w-full border rounded px-3 py-2" placeholder="BCH-004" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Input Biomass Weight (kg)</label>
            <input type="number" step="0.1" className="w-full border rounded px-3 py-2" placeholder="500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Biochar Output Weight (kg)</label>
            <input type="number" step="0.1" className="w-full border rounded px-3 py-2" placeholder="125" />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-sm text-yellow-800">
            <strong>ML Alert:</strong> Expected conversion ratio: 0.20-0.30. Values outside this range will be flagged for review.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Processing Video (Short)</label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm text-gray-600">Upload video showing production process</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Geotagged Photo</label>
          <div className="border-2 border-dashed rounded p-4 text-center">
            <Upload className="mx-auto text-gray-400" size={24} />
            <p className="text-xs text-gray-600">Photo of biochar output</p>
          </div>
        </div>

        <button onClick={(e) => e.preventDefault()} className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700">
          Record Biochar Production
        </button>
      </div>
    </div>
  );

  const AuditForm = () => (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h3 className="text-xl font-semibold mb-6">Independent Audit Report</h3>
      
      <div className="bg-orange-50 p-4 rounded mb-6">
        <p className="text-sm text-orange-800">
          <strong>Audit Assignment:</strong> PLT-042 | Scheduled: 24 hours notice | KML file only provided
        </p>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Satellite Image Match</label>
            <select className="w-full border rounded px-3 py-2">
              <option>Yes - Matches</option>
              <option>No - Discrepancy</option>
              <option>Partial Match</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ground Truth Status</label>
            <select className="w-full border rounded px-3 py-2">
              <option>Verified</option>
              <option>Not Verified</option>
              <option>Needs Review</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">4-Point Soil Sampling (Biochar Presence)</label>
          <div className="grid grid-cols-4 gap-2">
            {['Point 1', 'Point 2', 'Point 3', 'Point 4'].map(pt => (
              <div key={pt}>
                <label className="text-xs text-gray-600">{pt}</label>
                <select className="w-full border rounded px-2 py-1 text-sm mt-1">
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Estimated Biochar per Hectare (kg)</label>
          <input type="number" step="0.1" className="w-full border rounded px-3 py-2" placeholder="250" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Audit Notes</label>
          <textarea className="w-full border rounded px-3 py-2" rows="4" 
            placeholder="Detailed observations, discrepancies, recommendations..."></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Audit Evidence Photos</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="border-2 border-dashed rounded p-4 text-center">
                <Upload className="mx-auto text-gray-400" size={24} />
                <p className="text-xs text-gray-600 mt-1">Photo {i}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded">
          <p className="text-sm text-red-800">
            <strong>Important:</strong> This audit report is immutable and time-locked. Cannot be edited after submission.
          </p>
        </div>

        <button onClick={(e) => e.preventDefault()} className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
          Submit Audit Report
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Leaf size={32} />
            <div>
              <h1 className="text-2xl font-bold">Harit Swaraj</h1>
              <p className="text-sm text-green-100">Biochar MRV & Carbon Sequestration System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              className="bg-green-600 border-green-500 rounded px-3 py-2 text-sm"
            >
              <option value="owner">Project Owner</option>
              <option value="farmer">Farmer</option>
              <option value="auditor">Auditor</option>
              <option value="admin">Admin</option>
            </select>
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto py-3">
            {modules[userRole].map(mod => (
              <button
                key={mod}
                onClick={() => setActiveModule(mod)}
                className={`px-4 py-2 rounded whitespace-nowrap text-sm font-medium ${
                  activeModule === mod 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeModule === 'dashboard' && <DashboardView />}
        {activeModule === 'biomass-id' && <BiomassIdentificationForm />}
        {activeModule === 'manufacturing' && <ManufacturingForm />}
        {activeModule === 'audit-report' && <AuditForm />}
        
        {!['dashboard', 'biomass-id', 'manufacturing', 'audit-report'].includes(activeModule) && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">
              {activeModule.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </h3>
            <p className="text-gray-600">Module form interface would appear here</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-gray-300 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            Harit Swaraj - Biochar-based Carbon Dioxide Removal (CDR) | MRV-Compliant | Audit-Ready
          </p>
          <p className="text-xs text-gray-500 mt-2">
            CO₂ Sequestration Formula: CO₂ = Biochar Weight × 0.8 (carbon fraction) × (44/12)
          </p>
        </div>
      </div>
    </div>
  );
};

export default HaritSwarajMRV;