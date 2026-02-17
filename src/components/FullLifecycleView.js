import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import BiomassHarvestView from './BiomassHarvestView';
import TransportView from './TransportView';
import DistributionView from './DistributionView';

const FullLifecycleView = ({ fetchWithAuth, plots, batches }) => {
    const [subTab, setSubTab] = useState('harvest'); // 'harvest', 'transport', 'distribution'

    return (
        <div className="space-y-6">
            <div className="flex bg-white rounded-lg shadow p-1 overflow-x-auto">
                {['harvest', 'transport', 'distribution'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSubTab(tab)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                            ${subTab === tab ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {subTab === 'harvest' && (
                <BiomassHarvestView
                    plots={plots}
                    fetchWithAuth={fetchWithAuth}
                />
            )}

            {subTab === 'transport' && (
                <TransportView
                    fetchWithAuth={fetchWithAuth}
                />
            )}

            {subTab === 'distribution' && (
                <DistributionView
                    fetchWithAuth={fetchWithAuth}
                    batches={batches}
                />
            )}
        </div>
    );
};

export default FullLifecycleView;
