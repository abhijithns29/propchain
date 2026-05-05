import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MapPin,
  MessageCircle,
  Eye,
  Heart,
  Camera,
  Star,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import { Land } from "../types";
import apiService from "../services/api";
import RealtimeChat from "./RealtimeChat";
import EditLandListingForm from "./EditLandListingForm";
import { useAuth } from "../hooks/useAuth";

interface MarketplaceFilters {
  minPrice: string;
  maxPrice: string;
  district: string;
  state: string;
  landType: string;
  minArea: string;
  maxArea: string;
}

interface LandMarketplaceProps {
  onNavigateToLand?: (landId: string) => void;
}

const LandMarketplace: React.FC<LandMarketplaceProps> = ({
  onNavigateToLand,
}) => {
  const { refreshUser } = useAuth();
  const [lands, setLands] = useState<Land[]>([]);
  const [myListings, setMyListings] = useState<Land[]>([]);
  const [likedLands, setLikedLands] = useState<Land[]>([]);
  const [filteredLands, setFilteredLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedLandForEdit, setSelectedLandForEdit] = useState<Land | null>(
    null
  );
  const [landToRemove, setLandToRemove] = useState<Land | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "my-ads" | "liked">(
    "browse"
  );
  const [filters, setFilters] = useState<MarketplaceFilters>({
    minPrice: "",
    maxPrice: "",
    district: "",
    state: "",
    landType: "",
    minArea: "",
    maxArea: "",
  });

  useEffect(() => {
    if (activeTab === "browse") {
      loadMarketplaceLands();
    } else if (activeTab === "my-ads") {
      loadMyListings();
    } else if (activeTab === "liked") {
      loadLikedLands();
    }
  }, [activeTab]);

  // Refresh data when window gets focus (handles SPA navigation from details page)
  useEffect(() => {
    const handleFocus = () => {
      // Check if we're returning from details page
      const returnedFromDetails = sessionStorage.getItem('navigatedToDetails');
      if (returnedFromDetails) {
        sessionStorage.removeItem('navigatedToDetails');
        console.log('Returned from details page, refreshing data...');
        refreshUser();
      }

      // Refresh current tab when window gets focus
      if (activeTab === "browse") {
        loadMarketplaceLands();
      } else if (activeTab === "liked") {
        loadLikedLands();
      } else if (activeTab === "my-ads") {
        loadMyListings();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    // Check if returning from details page on mount
    const returnedFromDetails = sessionStorage.getItem('navigatedToDetails');
    if (returnedFromDetails) {
      sessionStorage.removeItem('navigatedToDetails');
      console.log('Component mounted after details page, refreshing...');
      refreshUser();
    }

    // Also refresh on mount
    handleFocus();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab]);

  useEffect(() => {
    filterLands();
  }, [lands, myListings, likedLands, searchTerm, filters, activeTab]);

  const loadMarketplaceLands = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMarketplaceLands({ limit: 100 });
      setLands(response.lands || []);
    } catch (error: any) {
      setError(error.message || "Failed to load marketplace lands");
    } finally {
      setLoading(false);
    }
  };

  const loadMyListings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyListings({ limit: 100 });
      setMyListings(response.lands || []);
    } catch (error: any) {
      setError(error.message || "Failed to load your listings");
    } finally {
      setLoading(false);
    }
  };

  const loadLikedLands = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLikedLands({ limit: 100 });
      // Ensure each land in the liked tab is explicitly marked as liked
      const processedLands = (response.lands || []).map((l: any) => ({
        ...l,
        isLiked: true
      }));
      setLikedLands(processedLands);
    } catch (error: any) {
      setError(error.message || "Failed to load liked lands");
    } finally {
      setLoading(false);
    }
  };

  // Fuzzy matching function - calculates similarity between two strings
  const fuzzyMatch = (str1: string, str2: string): boolean => {
    if (!str1 || !str2) return false;

    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Exact match or substring match
    if (s1.includes(s2) || s2.includes(s1)) return true;

    // Check if one string starts with the other (for partial matches)
    if (s1.startsWith(s2.substring(0, 3)) || s2.startsWith(s1.substring(0, 3))) {
      if (Math.abs(s1.length - s2.length) <= 3) return true;
    }

    // Calculate Levenshtein distance for fuzzy matching
    const getLevenshteinDistance = (a: string, b: string): number => {
      const matrix: number[][] = [];

      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }

      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }

      return matrix[b.length][a.length];
    };

    const distance = getLevenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = 1 - distance / maxLength;

    // Return true if similarity is above 60% (more lenient for typos)
    // This allows for bigger differences like "thamil" -> "tamil"
    return similarity >= 0.6;
  };

  const filterLands = () => {
    const sourceLands =
      activeTab === "browse"
        ? lands
        : activeTab === "my-ads"
          ? myListings
          : likedLands;

    let filtered = sourceLands.filter((land) => {
      // Search term filter with fuzzy matching on ALL text fields
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          fuzzyMatch(land.village || "", searchLower) ||
          fuzzyMatch(land.district || "", searchLower) ||
          fuzzyMatch(land.state || "", searchLower) ||
          fuzzyMatch(land.surveyNumber || "", searchLower) ||
          fuzzyMatch(land.subDivision || "", searchLower) ||
          fuzzyMatch(land.marketInfo?.description || "", searchLower) ||
          fuzzyMatch(land.landType || "", searchLower);
        if (!matchesSearch) return false;
      }

      // Price filters
      if (filters.minPrice && land.marketInfo?.askingPrice) {
        if (land.marketInfo.askingPrice < parseFloat(filters.minPrice))
          return false;
      }
      if (filters.maxPrice && land.marketInfo?.askingPrice) {
        if (land.marketInfo.askingPrice > parseFloat(filters.maxPrice))
          return false;
      }

      // Location filters with fuzzy matching
      if (filters.district && land.district) {
        if (!fuzzyMatch(land.district, filters.district))
          return false;
      }
      if (filters.state && land.state) {
        if (!fuzzyMatch(land.state, filters.state))
          return false;
      }

      // Land type filter
      if (filters.landType && land.landType !== filters.landType) return false;

      // Area filters
      if (filters.minArea && land.area?.acres) {
        if (land.area.acres < parseFloat(filters.minArea)) return false;
      }
      if (filters.maxArea && land.area?.acres) {
        if (land.area.acres > parseFloat(filters.maxArea)) return false;
      }

      return true;
    });

    setFilteredLands(filtered);
  };

  const handleFilterChange = (key: keyof MarketplaceFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      district: "",
      state: "",
      landType: "",
      minArea: "",
      maxArea: "",
    });
    setSearchTerm("");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatArea = (land: Land) => {
    const { acres, guntas, sqft } = land.area || {};
    let areaStr = "";
    if (acres && acres > 0) areaStr += `${acres} acres`;
    if (guntas && guntas > 0) areaStr += ` ${guntas} guntas`;
    if (sqft && sqft > 0) areaStr += ` ${sqft} sqft`;
    return areaStr || "Area not specified";
  };

  const getImageUrl = (imageHash: string) => {
    if (!imageHash) return "/placeholder-land.svg";
    return `http://localhost:5000/api/images/${imageHash}`;
  };

  const handleChatWithSeller = (land: Land) => {
    setSelectedLand(land);
    setShowChat(true);
  };



  const handleEditListing = (land: Land) => {
    setSelectedLandForEdit(land);
    setShowEditForm(true);
  };

  const handleRemoveListing = (land: Land) => {
    setLandToRemove(land);
  };

  const confirmRemove = async () => {
    if (!landToRemove || !landToRemove._id) return;
    try {
      setIsRemoving(true);
      const targetId = landToRemove._id;
      await apiService.removeListing(targetId);
      
      // Optimistically remove from state so it disappears instantly
      setMyListings(prev => prev.filter(land => land._id !== targetId));
      setLands(prev => prev.filter(land => land._id !== targetId));
      
      setLandToRemove(null);
      // Still refresh from server to ensure perfect sync
      loadMyListings();
    } catch (error: any) {
      setError(error.message || "Failed to remove listing");
      setLandToRemove(null);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleViewDetails = (land: Land) => {
    // Set a flag to indicate we're navigating to details
    sessionStorage.setItem('navigatedToDetails', 'true');

    // Navigate to detailed view page
    if (land._id && onNavigateToLand) {
      onNavigateToLand(land._id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4154f1]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadMarketplaceLands}
          className="bg-[#4154f1] text-white px-4 py-2 rounded-2xl hover:bg-[#3346d8] font-semibold shadow-md shadow-blue-500/40 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#012970] mb-2">
          Land Marketplace
        </h1>
        <p className="text-gray-600">
          Discover verified lands for sale across India
        </p>

        {/* Tab Navigation */}
        <div className="mt-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("browse")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "browse"
                ? "border-[#4154f1] text-[#4154f1]"
                : "border-transparent text-gray-500 hover:text-[#012970] hover:border-gray-300"
                }`}
            >
              Browse All
            </button>
            <button
              onClick={() => setActiveTab("my-ads")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "my-ads"
                ? "border-[#4154f1] text-[#4154f1]"
                : "border-transparent text-gray-500 hover:text-[#012970] hover:border-gray-300"
                }`}
            >
              My Ads
            </button>
            <button
              onClick={() => setActiveTab("liked")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "liked"
                ? "border-[#4154f1] text-[#4154f1]"
                : "border-transparent text-gray-500 hover:text-[#012970] hover:border-gray-300"
                }`}
            >
              Liked Ads
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by location, survey number, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1] placeholder-gray-400 transition-all"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-2.5 border rounded-lg font-medium transition-all ${showFilters
              ? 'bg-[#4154f1] text-white border-[#4154f1]'
              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
          >
            <Filter className="w-5 h-5" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Filter Results</h3>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Price Range (₹)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1] placeholder-gray-400"
                    placeholder="Min"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1] placeholder-gray-400"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Location</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={filters.district}
                  onChange={(e) => handleFilterChange("district", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1] placeholder-gray-400"
                  placeholder="District"
                />
                <input
                  type="text"
                  value={filters.state}
                  onChange={(e) => handleFilterChange("state", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1] placeholder-gray-400"
                  placeholder="State"
                />
              </div>
            </div>

            {/* Land Type & Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Land Type</label>
                <select
                  value={filters.landType}
                  onChange={(e) => handleFilterChange("landType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1]"
                >
                  <option value="">All Types</option>
                  <option value="AGRICULTURAL">Agricultural</option>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Area (acres)</label>
                <input
                  type="number"
                  value={filters.minArea}
                  onChange={(e) => handleFilterChange("minArea", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1] placeholder-gray-400"
                  placeholder="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Area (acres)</label>
                <input
                  type="number"
                  value={filters.maxArea}
                  onChange={(e) => handleFilterChange("maxArea", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1] placeholder-gray-400"
                  placeholder="No limit"
                  step="0.1"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredLands.length} of{" "}
          {activeTab === "browse"
            ? lands.length
            : activeTab === "my-ads"
              ? myListings.length
              : likedLands.length}{" "}
          {activeTab === "browse"
            ? "lands for sale"
            : activeTab === "my-ads"
              ? "your listings"
              : "liked lands"}
        </p>
      </div>

      {/* Land Cards Grid */}
      {filteredLands.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-300 mb-4">
            <MapPin className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No lands found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLands.map((land) => (
            <LandCard
              key={land._id}
              land={land}
              activeTab={activeTab}
              onChat={() => handleChatWithSeller(land)}
              onEdit={() => handleEditListing(land)}
              onRemove={() => handleRemoveListing(land)}
              onViewDetails={() => handleViewDetails(land)}
              getImageUrl={getImageUrl}
              formatPrice={formatPrice}
              formatArea={formatArea}
            />
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {showChat && selectedLand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg border border-gray-200 bg-white w-full max-w-4xl h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-[#012970]">
                Chat with {selectedLand.currentOwner?.fullName || "Seller"}
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <RealtimeChat
                landId={selectedLand._id}
                recipientId={selectedLand.currentOwner?.id}
                recipientName={selectedLand.currentOwner?.fullName}
                onClose={() => setShowChat(false)}
                showHeader={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {showEditForm && selectedLandForEdit && (
        <EditLandListingForm
          land={selectedLandForEdit}
          onClose={() => {
            setShowEditForm(false);
            setSelectedLandForEdit(null);
          }}
          onSuccess={() => {
            setShowEditForm(false);
            setSelectedLandForEdit(null);
            // Refresh the listings
            if (activeTab === "my-ads") {
              loadMyListings();
            } else {
              loadMarketplaceLands();
            }
          }}
        />
      )}

      {/* Remove Confirmation Modal */}
      {landToRemove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-[#012970] text-center mb-2">Remove Listing?</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to remove this land from the marketplace? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLandToRemove(null)}
                disabled={isRemoving}
                className="flex-1 py-2 px-4 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={isRemoving}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center shadow-md shadow-red-500/30 disabled:opacity-50"
              >
                {isRemoving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Yes, Remove'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Land Card Component
interface LandCardProps {
  land: Land;
  activeTab: "browse" | "my-ads" | "liked";
  onChat: () => void;
  onEdit: (land: Land) => void;
  onRemove: (land: Land) => void;
  onViewDetails: (land: Land) => void;
  getImageUrl: (hash: string) => string;
  formatPrice: (price: number) => string;
  formatArea: (land: Land) => string;
}

const LandCard: React.FC<LandCardProps> = ({
  land,
  activeTab,
  onChat,
  onEdit,
  onRemove,
  onViewDetails,
  getImageUrl,
  formatPrice,
  formatArea,
}) => {
  const { auth } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(
    Boolean(land.isLiked ?? false)
  );
  const [isProcessingLike, setIsProcessingLike] = useState<boolean>(false);

  useEffect(() => {
    let initial = !!land.isLiked;

    // Check user's likedLands as a definitive source if logged in
    if (auth.user && Array.isArray((auth.user as any).likedLands)) {
      const isActuallyLiked = (auth.user as any).likedLands.some((id: any) => {
        try {
          return id.toString() === land._id?.toString();
        } catch (e) {
          return id === land._id;
        }
      });

      // If the user's list says it's liked, respect that even if land.isLiked is false/missing
      if (isActuallyLiked) {
        initial = true;
      }
    }

    setIsFavorited(initial);
  }, [land._id, land.isLiked, auth.user]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!land._id) return;

    const previous = isFavorited;
    setIsFavorited(!previous);
    setIsProcessingLike(true);

    try {
      const res = await apiService.toggleLandLike(land._id as string);

      if (res && typeof res.liked === "boolean") {
        setIsFavorited(res.liked);
      } else {
        setIsFavorited(previous);
        console.error("Unexpected like response", res);
      }
    } catch (err) {
      setIsFavorited(previous);
      console.error("Failed to toggle like", err);
    } finally {
      setIsProcessingLike(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, svg, path")) {
      return;
    }

    if (onViewDetails) {
      try {
        onViewDetails(land);
      } catch (err) {
        // ignore
      }
    }
  };

  const primaryImage = land.marketInfo?.images?.[0];
  const imageUrl = primaryImage
    ? getImageUrl(primaryImage)
    : "/placeholder-land.svg";

  const features = land.marketInfo?.features || [];

  const isOwner =
    auth.user?.id === land?.currentOwner?.id ||
    auth.user?.id === land?.currentOwner?._id;

  // Get status badge info
  const getStatusBadge = () => {
    if (land.verificationStatus === "PENDING") {
      return { text: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    }
    if (land.verificationStatus === "NOT_SUBMITTED") {
      return { text: "Draft", color: "bg-blue-100 text-[#4154f1] border-blue-200" };
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      className="group rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      {/* Image Section - Clean and simple */}
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {!imageError && primaryImage ? (
          <img
            src={imageUrl}
            alt={`${land.village}, ${land.district}`}
            className="w-full h-full object-cover group-hover:opacity-95 transition-opacity duration-200"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            <Camera className="w-12 h-12 text-gray-300 mb-2" />
            <span className="text-xs text-gray-400">No Image Available</span>
          </div>
        )}

        {/* Sold Overlay */}
        {land.status === "SOLD" && (
          <div className="absolute inset-0 bg-white/95 flex items-center justify-center z-20">
            <div className="border-2 border-red-600 px-6 py-2 rounded">
              <span className="text-2xl font-bold text-red-600 uppercase">
                SOLD
              </span>
            </div>
          </div>
        )}

        {/* Status Badge - Top Left */}
        {statusBadge && (
          <div className={`absolute top-3 left-3 px-3 py-1 rounded text-xs font-medium border ${statusBadge.color}`}>
            {statusBadge.text}
          </div>
        )}

        {/* Favorite Button - Top Right (browse and liked tabs) */}
        {(activeTab === "browse" || activeTab === "liked") && (
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isProcessingLike}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className={`absolute top-3 right-3 p-2 bg-white rounded-full hover:scale-105 transition-transform duration-200 border z-10 ${isFavorited
              ? 'border-red-500'
              : 'border-gray-200'
              }`}
          >
            <Heart
              className={`w-4 h-4 transition-colors duration-200 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'
                }`}
            />
          </button>
        )}

        {/* Price Badge - Bottom */}
        {land.marketInfo?.askingPrice && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 px-4 py-2 border-t border-gray-200">
            <span className="text-lg font-bold text-[#4154f1]">
              {formatPrice(land.marketInfo.askingPrice)}
            </span>
          </div>
        )}
      </div>

      {/* Content Section - Fixed height with flex-grow */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Location */}
        <div className="flex items-center gap-1.5 text-gray-500 mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate">
            {land.village}, {land.district}, {land.state}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#012970] mb-2 truncate group-hover:text-[#4154f1] transition-colors">
          {land.landType} Land - Survey No. {land.surveyNumber}
        </h3>

        {/* Area */}
        <p className="text-gray-600 text-sm font-medium mb-3">{formatArea(land)}</p>

        {/* Description - Truncated to 2 lines */}
        {land.marketInfo?.description && (
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
            {land.marketInfo.description}
          </p>
        )}

        {/* Features - Show max 2 */}
        {features.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {features.slice(0, 2).map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-[#4154f1] text-xs rounded-md border border-[#4154f1]/20"
                >
                  <Star className="w-3 h-3 fill-[#4154f1] text-[#4154f1]" />
                  {feature}
                </span>
              ))}
              {features.length > 2 && (
                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                  +{features.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-grow" />

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
          {activeTab === "my-ads" || isOwner ? (
            // Owner actions
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(land);
                }}
                className="p-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                title="Edit Listing"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(land);
                }}
                className="p-2 rounded border border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                title="Remove Listing"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(land);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-[#4154f1] text-[#4154f1] rounded hover:bg-[#4154f1] hover:text-white transition-colors font-medium text-sm"
              >
                View Details
              </button>
            </div>
          ) : (
            // Buyer actions
            <div className="flex gap-2 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChat();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-[#4154f1] text-white rounded hover:bg-[#3346d8] transition-colors font-medium text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(land);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-[#4154f1] text-[#4154f1] rounded hover:bg-[#4154f1] hover:text-white transition-colors font-medium text-sm"
              >
                <Eye className="w-4 h-4" />
                Details
              </button>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span>
            Listed{" "}
            {new Date(
              land.marketInfo?.listedDate || land.createdAt
            ).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

// Scoped styles for heart icon (kept local to this file)
// If your project uses a different styling system, these can be moved accordingly.
// Note: In a TSX file without CSS-in-JS setup, this block is harmless but will be ignored by the bundler.
// If you prefer, add these classes to a CSS/SCSS file instead.

export default LandMarketplace;
