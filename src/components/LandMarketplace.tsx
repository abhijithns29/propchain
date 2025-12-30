import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  MessageCircle,
  Eye,
  Heart,
  ShoppingCart,
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
      // Refresh current tab when window gets focus
      if (activeTab === "browse") {
        loadMarketplaceLands();
      } else if (activeTab === "liked") {
        loadLikedLands();
      } else if (activeTab === "my-ads") {
        loadMyListings();
      }
    };

    // Also refresh on mount
    handleFocus();

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
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
      setLikedLands(response.lands || []);
    } catch (error: any) {
      setError(error.message || "Failed to load liked lands");
    } finally {
      setLoading(false);
    }
  };

  const filterLands = () => {
    const sourceLands =
      activeTab === "browse"
        ? lands
        : activeTab === "my-ads"
        ? myListings
        : likedLands;

    let filtered = sourceLands.filter((land) => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          land.village?.toLowerCase().includes(searchLower) ||
          land.district?.toLowerCase().includes(searchLower) ||
          land.state?.toLowerCase().includes(searchLower) ||
          land.surveyNumber?.toLowerCase().includes(searchLower) ||
          land.marketInfo?.description?.toLowerCase().includes(searchLower);
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

      // Location filters
      if (filters.district && land.district) {
        if (
          !land.district.toLowerCase().includes(filters.district.toLowerCase())
        )
          return false;
      }
      if (filters.state && land.state) {
        if (!land.state.toLowerCase().includes(filters.state.toLowerCase()))
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

  const handleBuyNow = (land: Land) => {
    // Implement buy now functionality
    console.log("Buy now clicked for land:", land.assetId);
    // You can redirect to a purchase flow or show a modal
  };

  const handleLikeLand = async (land: Land) => {
    try {
      if (land._id) {
        await apiService.toggleLandLike(land._id as string);
        // Refresh the current tab data
        if (activeTab === "browse") {
          loadMarketplaceLands();
        } else if (activeTab === "liked") {
          loadLikedLands();
        }
      }
    } catch (error: any) {
      setError(error.message || "Failed to update like status");
    }
  };

  const handleEditListing = (land: Land) => {
    setSelectedLandForEdit(land);
    setShowEditForm(true);
  };

  const handleRemoveListing = async (land: Land) => {
    if (window.confirm("Are you sure you want to remove this listing?")) {
      try {
        if (land._id) {
          await apiService.removeListing(land._id);
          loadMyListings(); // Refresh the list
        }
      } catch (error: any) {
        setError(error.message || "Failed to remove listing");
      }
    }
  };

  const handleViewDetails = (land: Land) => {
    // Navigate to detailed view page
    if (land._id && onNavigateToLand) {
      onNavigateToLand(land._id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadMarketplaceLands}
          className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-2xl hover:bg-emerald-400 font-semibold shadow-md shadow-emerald-500/40 transition"
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
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
          Land Marketplace
        </h1>
        <p className="text-slate-400">
          Discover verified lands for sale across India
        </p>

        {/* Tab Navigation */}
        <div className="mt-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("browse")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "browse"
                  ? "border-emerald-500 text-emerald-300"
                  : "border-transparent text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              Browse All
            </button>
            <button
              onClick={() => setActiveTab("my-ads")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "my-ads"
                  ? "border-emerald-500 text-emerald-300"
                  : "border-transparent text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              My Ads
            </button>
            <button
              onClick={() => setActiveTab("liked")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "liked"
                  ? "border-emerald-500 text-emerald-300"
                  : "border-transparent text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              Liked Ads
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by location, survey number, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 border border-slate-700 bg-slate-900/50 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-slate-800/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Min Price (₹)
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Max Price (₹)
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="No limit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={filters.district}
                  onChange={(e) =>
                    handleFilterChange("district", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="Any district"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={filters.state}
                  onChange={(e) => handleFilterChange("state", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="Any state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Land Type
                </label>
                <select
                  value={filters.landType}
                  onChange={(e) =>
                    handleFilterChange("landType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Types</option>
                  <option value="AGRICULTURAL">Agricultural</option>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Area (acres)
                </label>
                <input
                  type="number"
                  value={filters.minArea}
                  onChange={(e) =>
                    handleFilterChange("minArea", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Max Area (acres)
                </label>
                <input
                  type="number"
                  value={filters.maxArea}
                  onChange={(e) =>
                    handleFilterChange("maxArea", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="No limit"
                  step="0.1"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-slate-400">
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
          <div className="text-slate-500 mb-4">
            <MapPin className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No lands found
          </h3>
          <p className="text-slate-400">
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
              onBuy={() => handleBuyNow(land)}
              onLike={handleLikeLand}
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
          <div className="rounded-lg border border-slate-800 bg-slate-900/90 backdrop-blur-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-white">
                Chat with {selectedLand.currentOwner?.fullName || "Seller"}
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-slate-400 hover:text-white transition-colors"
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
    </div>
  );
};

// Land Card Component
interface LandCardProps {
  land: Land;
  activeTab: "browse" | "my-ads" | "liked";
  onChat: () => void;
  onBuy: () => void;
  onLike: (land: Land) => void;
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
  onBuy,
  onLike,
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
    let initial = false;
    if (typeof land.isLiked !== "undefined") {
      initial = !!land.isLiked;
    } else if (auth.user && Array.isArray((auth.user as any).likedLands)) {
      initial = (auth.user as any).likedLands.some((id: any) => {
        try {
          return id.toString() === land._id.toString();
        } catch (e) {
          return id === land._id;
        }
      });
    }
    setIsFavorited(initial);
  }, [land._id, land.isLiked, auth.user]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
        onViewDetails();
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
  const amenities = land.marketInfo?.nearbyAmenities || [];

  const isOwner =
    auth.user?.id === land?.currentOwner?.id ||
    auth.user?.id === land?.currentOwner?._id;

  // Get status badge info
  const getStatusBadge = () => {
    if (land.status === "PENDING") {
      return { text: "Pending", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
    }
    if (land.status === "DRAFT") {
      return { text: "Draft", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      className="group rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1 flex flex-col h-full"
      onClick={handleCardClick}
    >
      {/* Image Section with Gradient Overlay */}
      <div className="relative h-56 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        {!imageError && primaryImage ? (
          <img
            src={imageUrl}
            alt={`${land.village}, ${land.district}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900/20 via-slate-900 to-teal-900/20">
            <Camera className="w-16 h-16 text-slate-700 mb-2" />
            <span className="text-xs text-slate-600 font-medium">No Image Available</span>
          </div>
        )}

        {/* Dark gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

        {/* Status Badge - Top Right */}
        {statusBadge && (
          <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${statusBadge.color}`}>
            {statusBadge.text}
          </div>
        )}

        {/* Favorite Button - Top Right (only in browse tab) */}
        {activeTab === "browse" && (
          <motion.button
            type="button"
            onClick={handleToggleLike}
            disabled={isProcessingLike}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            whileTap={{ scale: 0.9 }}
            animate={isFavorited ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`absolute top-3 ${
              statusBadge ? 'right-3' : 'right-3'
            } p-2.5 backdrop-blur-md rounded-full hover:scale-110 transition-all duration-200 border z-10 ${
              isFavorited
                ? 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30'
                : 'bg-slate-900/80 border-slate-700/50 hover:bg-slate-900'
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-all duration-300 ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </motion.button>
        )}

        {/* Price Badge - Bottom Left */}
        {land.marketInfo?.askingPrice && (
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 px-4 py-2 rounded-full text-base font-bold shadow-lg shadow-emerald-500/50">
            {formatPrice(land.marketInfo.askingPrice)}
          </div>
        )}
      </div>

      {/* Content Section - Fixed height with flex-grow */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Location */}
        <div className="flex items-center gap-1.5 text-slate-400 mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate">
            {land.village}, {land.district}, {land.state}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg text-white mb-2 line-clamp-1">
          {land.landType} Land - Survey No. {land.surveyNumber}
        </h3>

        {/* Area */}
        <p className="text-slate-300 text-sm font-medium mb-3">{formatArea(land)}</p>

        {/* Description - Truncated to 2 lines */}
        {land.marketInfo?.description && (
          <p className="text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-300 text-xs rounded-md border border-emerald-500/20"
                >
                  <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                  {feature}
                </span>
              ))}
              {features.length > 2 && (
                <span className="inline-flex items-center px-2.5 py-1 bg-slate-800/50 text-slate-400 text-xs rounded-md">
                  +{features.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-grow" />

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-4 border-t border-slate-800/50">
          {activeTab === "my-ads" || isOwner ? (
            // Owner actions
            <>
              {land.status === "FOR_SALE" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(land);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-emerald-500/50 text-emerald-300 rounded-lg hover:bg-emerald-500/10 hover:border-emerald-500 transition-all duration-200 font-medium text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {land.status === "FOR_SALE" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(land);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 hover:border-red-500 transition-all duration-200 font-medium text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </>
          ) : (
            // Buyer actions
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChat();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-all duration-200 font-semibold text-sm shadow-lg shadow-emerald-500/30"
              >
                <MessageCircle className="w-4 h-4" />
                Chat with Seller
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 font-medium text-sm"
              >
                <Eye className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-3 pt-3 border-t border-slate-800/30 flex items-center justify-between text-xs text-slate-500">
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
          <span className="flex items-center gap-1 text-emerald-400">
            <Eye className="w-3 h-3" />
            Verified
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
