import React, { useState, useEffect } from 'react';
import { Search, MapPin, Eye, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Land } from '../types';
import apiService from '../services/api';
import MinimalHeader from './layout/MinimalHeader';

const MarketplacePreview: React.FC = () => {
  const navigate = useNavigate();
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPreviewLands();
  }, []);

  const loadPreviewLands = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMarketplaceLands();
      // Show only first 6 listings for preview
      setLands(response.lands?.slice(0, 6) || []);
    } catch (error) {
      console.error('Error loading preview:', error);
      setLands([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)}Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)}L`;
    return `₹${price.toLocaleString()}`;
  };

  const formatArea = (land: Land) => {
    const { acres, guntas, squareFeet } = land.area;
    if (acres) return `${acres} Acres`;
    if (guntas) return `${guntas} Guntas`;
    return `${squareFeet} sq.ft`;
  };

  const getImageUrl = (imageHash: string) => {
    return `http://localhost:5000/api/lands/image/${imageHash}`;
  };

  const filteredLands = lands.filter(land =>
    land.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
    land.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    land.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <MinimalHeader />
      <div className="min-h-screen bg-[#f6f9ff] pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header with Sign In CTA */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#012970] mb-4">
              Browse Land Listings
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Preview available properties. Sign in to contact sellers and make offers.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#4154f1] text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/40 hover:bg-[#3346d8] transition-all"
            >
              Sign In to Unlock Full Access
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4154f1] shadow-sm"
              />
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredLands.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400">No listings available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLands.map((land) => (
                <div
                  key={land._id}
                  className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-slate-800 overflow-hidden">
                    {land.images && land.images.length > 0 ? (
                      <img
                        src={getImageUrl(land.images[0])}
                        alt={`${land.village}, ${land.district}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-slate-600" />
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="h-8 w-8 text-[#4154f1] mx-auto mb-2" />
                        <p className="text-white font-semibold mb-1">Sign in to view details</p>
                        <button
                          onClick={() => navigate('/login')}
                          className="text-blue-300 text-sm hover:text-blue-200 transition-colors"
                        >
                          Sign In →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[#012970] mb-1">
                          {land.village}, {land.district}
                        </h3>
                        <p className="text-sm text-gray-500">{land.state}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-[#4154f1] rounded-full text-xs font-medium">
                        {land.landType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{formatArea(land)}</span>
                      </div>
                      <div className="text-lg font-bold text-[#4154f1]">
                        {formatPrice(land.price || 0)}
                      </div>
                    </div>

                    {/* Blurred Contact Info */}
                    <div className="relative">
                      <div className="blur-sm select-none pointer-events-none">
                        <p className="text-xs text-gray-400">Owner: John Doe</p>
                        <p className="text-xs text-gray-400">Contact: +91 98765 43210</p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-[#4154f1] font-medium bg-white/90 shadow-sm px-3 py-1 rounded-full border border-gray-100">
                          <Lock className="h-3 w-3 inline mr-1" />
                          Sign in to view
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Disabled */}
                  <div className="px-5 pb-5 flex gap-2">
                    <button
                      disabled
                      className="flex-1 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      View Details
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="flex-1 py-2 bg-blue-50 text-[#4154f1] rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-[#012970] mb-3">
                Ready to explore more?
              </h3>
              <p className="text-gray-600 mb-6">
                Sign in to contact sellers, make offers, and list your own property
              </p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#4154f1] text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/40 hover:bg-[#3346d8] transition-all"
              >
                Get Started Now
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarketplacePreview;
