import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DynamicStormContent {
  S: string; // Storm type
  DOL: string; // Date of loss
  X: string; // Location
  HS: string; // Hail size
  phrase: string; // Trending phrase
  hail_less_than_1_5: boolean;
}

interface RecentStormReportProps {
  isLoadingStormData: boolean;
  stormDataError: string | null;
  stormContent: DynamicStormContent | null;
  backgroundImage?: string;
}

export const RecentStormReport: React.FC<RecentStormReportProps> = ({
  isLoadingStormData,
  stormDataError,
  stormContent,
  backgroundImage
}) => {
  return (
    <div className="max-w-3xl mx-auto mb-16">
      {isLoadingStormData ? (
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      ) : stormDataError ? (
        <div className="text-center text-red-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p>Unable to load storm data. Please try again later.</p>
        </div>
      ) : stormContent && (
        <div 
          className="glass-card hover-lift bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-l-4 border-red-500 rounded-2xl p-8 lg:p-12 shadow-xl relative overflow-hidden"
          style={{
            backgroundImage: backgroundImage 
              ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${backgroundImage})`
              : undefined,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '320px'
          }}
        >
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white text-shadow-lg mb-2">Recent Storm Report</h3>
                <p className="text-gray-200 text-shadow-md">NOAA Verified Storm Data</p>
              </div>
              <div className="mt-4 lg:mt-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Active Alert
                </span>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-gray-200 text-shadow-md">Storm Type</dt>
                    <dd className="text-xl font-semibold text-white text-shadow-lg">{stormContent.S}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-200 text-shadow-md">Date of Loss</dt>
                    <dd className="text-xl font-semibold text-white text-shadow-lg">{stormContent.DOL}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-gray-200 text-shadow-md">Location</dt>
                    <dd className="text-xl font-semibold text-white text-shadow-lg">{stormContent.X}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-200 text-shadow-md">Hail Size</dt>
                    <dd className="text-xl font-semibold text-white text-shadow-lg">{stormContent.HS}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <p className="text-lg font-semibold text-amber-800">
                ⚡ High demand after recent storms - Our crews are booking fast. Call now to secure your spot.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 