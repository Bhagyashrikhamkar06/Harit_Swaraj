// Simplified Dashboard - Original Layout
const DashboardView = () => {
    if (!dashboardStats) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="spinner"></div>
            </div>
        );
    }

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
                    className={`px-4 py-3 font-medium border-b-2 ${activeTab === 'dashboard' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('process')}
                    className={`px-4 py-3 font-medium border-b-2 ${activeTab === 'process' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'
                        }`}
                >
                    Process Status
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-3 font-medium border-b-2 ${activeTab === 'analytics' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'
                        }`}
                >
                    Analytics
                </button>
                <button
                    onClick={() => setActiveTab('alldata')}
                    className={`px-4 py-3 font-medium border-b-2 ${activeTab === 'alldata' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'
                        }`}
                >
                    All Data
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'dashboard' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Dashboard Overview</h3>
                    <p className="text-gray-600">Welcome to Harit Swaraj MRV Platform</p>
                </div>
            )}

            {activeTab === 'process' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Process Status</h3>
                    <p className="text-gray-600">Track your biochar production process</p>
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Analytics</h3>
                    <p className="text-gray-600">View analytics and reports</p>
                </div>
            )}

            {activeTab === 'alldata' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">All Data</h3>
                    <p className="text-gray-600">Access all your data</p>
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
        </div>
    );
};
