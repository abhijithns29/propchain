import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Eye, 
  Heart, 
  MessageCircle,
  Camera,
  Star,
  User,
  Shield,
  Edit2,
  Trash2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Land } from '../types';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import RealtimeChat from './RealtimeChat';
import EditLandListingForm from './EditLandListingForm';

interface LandDetailPageProps {
  landId: string;
  onBack?: (tab?: string, landId?: string, sellerId?: string) => void;
  onNavigateToChat?: (landId: string, sellerId: string, isFirstChat?: boolean) => void;
}

const DetailCard: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.04)" }}
    className={`bg-slate-900/60 backdrop-blur-xl rounded-xl shadow-lg border border-slate-800 p-6 hover:border-emerald-500/30 transition-colors duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

const LandDetailPage: React.FC<LandDetailPageProps> = ({ landId, onBack, onNavigateToChat }) => {
  const { auth } = useAuth();
  const [land, setLand] = useState<Land | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    loadLandDetails();
  }, [landId]);

  // Sync like state with land data
  useEffect(() => {
    if (land) {
      setIsLiked(land.isLiked ?? false);
    }
  }, [land]);

  const loadLandDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLandDetails(landId);
      setLand(response.land);
    } catch (error: any) {
      setError(error.message || 'Failed to load land details');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!land || !land._id) return;
    
    // Optimistic update
    const previousState = isLiked;
    setIsLiked(!previousState);
    
    try {
      const res = await apiService.toggleLandLike(land._id);
      // Use the response from the API to set the final state
      if (res && typeof res.liked === 'boolean') {
        setIsLiked(res.liked);
        // Update the land object so the state persists
        if (land) {
          setLand({ ...land, isLiked: res.liked } as Land);
        }
      }
    } catch (error: any) {
      // Revert on error
      setIsLiked(previousState);
      setError(error.message || 'Failed to update like status');
    }
  };

  const handleChat = () => {
    console.log('Chat button clicked');
    console.log('Land data:', land);
    console.log('Current owner:', land?.currentOwner);
    console.log('Owner ID:', land?.currentOwner?.id);
    console.log('Owner _id:', land?.currentOwner?._id);
    
    // Show chat modal instead of redirecting - use _id instead of id
    if (land && (land.currentOwner?.id || land.currentOwner?._id)) {
      console.log('Opening chat modal');
      setShowChatModal(true);
    } else {
      console.error('Cannot open chat - missing land or owner data');
    }
  };



  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleRemove = async () => {
    if (!land || !land._id) return;
    
    if (window.confirm('Are you sure you want to remove this listing?')) {
      try {
        await apiService.removeListing(land._id);
        // Navigate back to marketplace
        if (onBack) {
          onBack();
        }
      } catch (error: any) {
        setError(error.message || 'Failed to remove listing');
      }
    }
  };


  const formatArea = (land: Land) => {
    const { acres, guntas, sqft } = land.area || {};
    let areaStr = '';
    if (acres && acres > 0) areaStr += `${acres} acres`;
    if (guntas && guntas > 0) areaStr += ` ${guntas} guntas`;
    if (sqft && sqft > 0) areaStr += ` ${sqft} sqft`;
    return areaStr || 'Area not specified';
  };

  const getImageUrl = (imageHash: string) => {
    if (!imageHash) return '/placeholder-land.svg';
    return `http://localhost:5000/api/images/${imageHash}`;
  };

  const isOwner = auth.user?.id === land?.currentOwner?.id || auth.user?.id === land?.currentOwner?._id;
  
  // Debug logging
  console.log('Land detail page debug:', {
    authUserId: auth.user?.id,
    landOwnerId: land?.currentOwner?.id,
    landOwner_Id: land?.currentOwner?._id,
    isOwner,
    land: !!land,
    currentOwner: !!land?.currentOwner
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96 bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !land) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 bg-slate-950 min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Land Not Found</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => onBack && onBack()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-lg hover:from-emerald-400 hover:to-teal-400 font-semibold shadow-lg shadow-emerald-500/30 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const images = land.marketInfo?.images || [];
  const currentImage = images[currentImageIndex];

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <button
            onClick={() => onBack && onBack()}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-white group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Land Details</h1>
        </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image Gallery */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <motion.div 
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/60 backdrop-blur-xl rounded-xl shadow-lg border border-slate-800 overflow-hidden relative group"
          >
            {/* Main Image */}
            <div className="relative h-96 bg-gradient-to-br from-slate-800 to-slate-900">
              {currentImage ? (
                <img
                  src={getImageUrl(currentImage)}
                  alt={`Land image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900/20 via-slate-900 to-teal-900/20">
                  <Camera className="w-16 h-16 text-slate-700 mb-2" />
                  <span className="text-sm text-slate-600 font-medium">No Image Available</span>
                </div>
              )}

              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                    disabled={currentImageIndex === 0}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-slate-900/80 backdrop-blur-md text-white rounded-full hover:bg-slate-900 disabled:opacity-30 transition-all border border-slate-700/50"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                    disabled={currentImageIndex === images.length - 1}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-slate-900/80 backdrop-blur-md text-white rounded-full hover:bg-slate-900 disabled:opacity-30 transition-all border border-slate-700/50"
                  >
                    →
                  </button>
                </>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-slate-700/50">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="p-4 bg-slate-900/40">
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex ? 'border-emerald-500 shadow-lg shadow-emerald-500/30' : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Details Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <DetailCard delay={0.2} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            {isOwner ? (
              // Owner actions
              <div className="space-y-3">
                {land.status === "FOR_SALE" && (
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-emerald-500/50 text-emerald-300 rounded-lg hover:bg-emerald-500/10 hover:border-emerald-500 transition-all font-medium"
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Listing
                  </button>
                )}
                {land.status === "FOR_SALE" && (
                  <button
                    onClick={handleRemove}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 hover:border-red-500 transition-all font-medium"
                  >
                    <Trash2 className="w-5 h-5" />
                    Remove Listing
                  </button>
                )}
              </div>
            ) : (
              // Buyer actions
              <div className="space-y-3">
                <button
                  onClick={handleChat}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-all font-semibold shadow-lg shadow-emerald-500/30"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat with Seller
                </button>

                <motion.button
                  onClick={handleLike}
                  whileTap={{ scale: 0.9 }}
                  animate={isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 border rounded-lg transition-all font-medium ${
                    isLiked
                      ? 'border-red-500/50 text-red-400 bg-red-500/10'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 transition-all duration-300 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  {isLiked ? 'Liked' : 'Add to Favorites'}
                </motion.button>
              </div>
            )}
          </DetailCard>

          {/* Owner Info */}
          <DetailCard delay={0.3}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              Owner Information
            </h3>
            <div className="space-y-2">
              <p className="text-white font-medium">{land.currentOwner?.fullName}</p>
              <p className="text-slate-400 text-sm">{land.currentOwner?.email}</p>
              <div className="flex items-center gap-2 mt-3">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">
                  {land.currentOwner?.verificationStatus === 'VERIFIED' ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </DetailCard>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <DetailCard delay={0.4}>
            <h3 className="text-xl font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-400">Survey Number</label>
                <p className="text-white">{land.surveyNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">Land Type</label>
                <p className="text-white">{land.landType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">Area</label>
                <p className="text-white">{formatArea(land)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">Asset ID</label>
                <p className="text-white font-mono text-sm">{land.assetId}</p>
              </div>
            </div>
          </DetailCard>

          {/* Location */}
          <DetailCard delay={0.5}>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Location
            </h3>
            <div className="space-y-2">
              <p className="text-white">{land.village}</p>
              <p className="text-white">{land.taluka}, {land.district}</p>
              <p className="text-white">{land.state} - {land.pincode}</p>
            </div>
          </DetailCard>

          {/* Description */}
          {land.marketInfo?.description && (
            <DetailCard delay={0.6}>
              <h3 className="text-xl font-semibold text-white mb-4">Description</h3>
              <p className="text-slate-300 leading-relaxed">{land.marketInfo.description}</p>
            </DetailCard>
          )}

          {/* Features */}
          {land.marketInfo?.features && land.marketInfo.features.length > 0 && (
            <DetailCard delay={0.7}>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-400" />
                Features
              </h3>
              <div className="flex flex-wrap gap-2">
                {land.marketInfo.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-300 rounded-full text-sm border border-emerald-500/20 font-medium"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </DetailCard>
          )}

          {/* Nearby Amenities */}
          {land.marketInfo?.nearbyAmenities && land.marketInfo.nearbyAmenities.length > 0 && (
            <DetailCard delay={0.8}>
              <h3 className="text-xl font-semibold text-white mb-4">Nearby Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {land.marketInfo.nearbyAmenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-teal-500/10 text-teal-300 rounded-full text-sm border border-teal-500/20 font-medium"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </DetailCard>
          )}
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Property Details */}
          <DetailCard delay={0.4}>
            <h3 className="font-semibold text-white mb-4">Property Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Classification</span>
                <span className="text-white">{land.classification || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sub Division</span>
                <span className="text-white">{land.subDivision || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-white">{land.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verification</span>
                <span className="text-white">{land.verificationStatus}</span>
              </div>
            </div>
          </DetailCard>

          {/* Listing Information */}
          <DetailCard delay={0.5}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Listing Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Listed Date</span>
                <span className="text-white">
                  {land.marketInfo?.listedDate 
                    ? new Date(land.marketInfo.listedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Not available'
                  }
                </span>
              </div>
            </div>
          </DetailCard>

          {/* Virtual Tour */}
          {land.marketInfo?.virtualTourUrl && (
            <DetailCard delay={0.6}>
              <h3 className="font-semibold text-white mb-4">Virtual Tour</h3>
              <a
                href={land.marketInfo?.virtualTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Virtual Tour
              </a>
            </DetailCard>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {console.log('Modal render check:', { showChatModal, land: !!land })}
      {showChatModal && land && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-800 w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">
                Chat with {land.currentOwner?.fullName || 'Land Owner'}
              </h2>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <RealtimeChat
                landId={land._id || land.id}
                recipientId={land.currentOwner?.id || land.currentOwner?._id}
                recipientName={land.currentOwner?.fullName}
                onClose={() => setShowChatModal(false)}
                showHeader={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {showEditForm && land && (
        <EditLandListingForm
          land={land}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            // Refresh land details
            loadLandDetails();
          }}
        />
      )}
      </div>
    </div>
  );
};

export default LandDetailPage;
