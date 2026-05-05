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
  Share2,
  Download,
  FileText,
  History,
  Clock
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
    className={`bg-white rounded-lg border border-gray-200 p-6 transition-colors duration-300 ${className}`}
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
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

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
      const landData = response.land;

      // Explicitly check if this land is liked by fetching user's liked lands
      try {
        const user = await apiService.getCurrentUser();
        const isLandLiked = user.likedLands?.some((likedLandId: string) =>
          likedLandId.toString() === landId.toString()
        );
        // Set the isLiked property on the land object
        landData.isLiked = isLandLiked;
      } catch (error) {
        console.error('Failed to check like status:', error);
        // Fallback to the value from the API response
        landData.isLiked = landData.isLiked ?? false;
      }

      setLand(landData);
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

  const handleRemove = () => {
    setShowRemoveConfirm(true);
  };

  const confirmRemove = async () => {
    if (!land || !land._id) return;

    try {
      setIsRemoving(true);
      await apiService.removeListing(land._id);
      // Navigate back to marketplace
      if (onBack) {
        onBack();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to remove listing');
      setShowRemoveConfirm(false);
    } finally {
      setIsRemoving(false);
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

  const handleDownloadDocument = async (id: string) => {
    try {
      setLoading(true);
      const blob = await apiService.downloadOwnershipDocument(id);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      let extension = '.pdf';
      if (blob.type === 'image/jpeg') extension = '.jpg';
      else if (blob.type === 'image/png') extension = '.png';
      else if (blob.type === 'image/webp') extension = '.webp';
      link.download = `land_document_${id}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      setError(error.message || 'Failed to download document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadOriginalDocument = async (id: string) => {
    try {
      setLoading(true);
      const blob = await apiService.downloadLandOriginalDocument(id);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      let extension = '.pdf';
      if (blob.type === 'image/jpeg') extension = '.jpg';
      else if (blob.type === 'image/png') extension = '.png';
      else if (blob.type === 'image/webp') extension = '.webp';
      link.download = `original_document_${id}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      setError(error.message || 'Failed to download original document');
    } finally {
      setLoading(false);
    }
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
      <div className="flex justify-center items-center min-h-96 bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4154f1]"></div>
      </div>
    );
  }

  if (error || !land) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 bg-white min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#012970] mb-4">Land Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => onBack && onBack()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4154f1] text-[#012970] rounded-lg hover:bg-[#3346d8] font-semibold transition-all"
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
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <button
            onClick={() => onBack && onBack()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#012970] group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <h1 className="text-3xl font-bold text-[#012970]">Land Details</h1>
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
              className="bg-white backdrop-blur-xl rounded-xl shadow-lg border border-gray-200 overflow-hidden relative group"
            >
              {/* Main Image */}
              <div className="relative h-96 bg-gray-100">
                {currentImage ? (
                  <img
                    src={getImageUrl(currentImage)}
                    alt={`Land image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                    <Camera className="w-16 h-16 text-gray-300 mb-2" />
                    <span className="text-sm text-gray-400 font-medium">No Image Available</span>
                  </div>
                )}

                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                      disabled={currentImageIndex === 0}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md text-[#012970] rounded-full hover:bg-white disabled:opacity-30 transition-all border border-gray-200/50"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                      disabled={currentImageIndex === images.length - 1}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md text-[#012970] rounded-full hover:bg-white disabled:opacity-30 transition-all border border-gray-200/50"
                    >
                      →
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md text-[#012970] px-4 py-2 rounded-full text-sm font-medium border border-gray-200/50">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="p-4 bg-gray-50">
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-[#4154f1] shadow-lg shadow-emerald-500/30' : 'border-gray-200 hover:border-gray-300'
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
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              {isOwner ? (
                // Owner actions
                <div className="space-y-3">
                  {land.status === "FOR_SALE" && (
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-[#4154f1]/50 text-[#4154f1] rounded-lg hover:bg-blue-50 hover:border-[#4154f1] transition-all font-medium"
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
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#4154f1] text-white rounded-lg hover:bg-[#3346d8] transition-all font-semibold"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat with Seller
                  </button>

                  <motion.button
                    onClick={handleLike}
                    whileTap={{ scale: 0.9 }}
                    animate={isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 border rounded-lg transition-all font-medium ${isLiked
                      ? 'border-red-500/50 text-red-400 bg-red-500/10'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
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
              <h3 className="font-semibold text-[#012970] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#4154f1]" />
                Owner Information
              </h3>
              <div className="space-y-2">
                <p className="text-[#012970] font-medium">{land.currentOwner?.fullName}</p>
                <p className="text-gray-600 text-sm">{land.currentOwner?.email}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Shield className="w-4 h-4 text-[#4154f1]" />
                  <span className="text-sm text-[#4154f1] font-medium">
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
              <h3 className="text-xl font-semibold text-[#012970] mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Survey Number</label>
                  <p className="text-[#012970]">{land.surveyNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Land Type</label>
                  <p className="text-[#012970]">{land.landType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Area</label>
                  <p className="text-[#012970]">{formatArea(land)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Asset ID</label>
                  <p className="text-[#012970] font-mono text-sm">{land.assetId}</p>
                </div>
              </div>
            </DetailCard>

            {/* Location */}
            <DetailCard delay={0.5}>
              <h3 className="text-xl font-semibold text-[#012970] mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#4154f1]" />
                Location
              </h3>
              <div className="space-y-2">
                <p className="text-[#012970]">{land.village}</p>
                <p className="text-[#012970]">{land.taluka}, {land.district}</p>
                <p className="text-[#012970]">{land.state} - {land.pincode}</p>
              </div>
            </DetailCard>

            {/* Ownership History */}
            <DetailCard delay={0.55}>
              <h3 className="text-xl font-semibold text-[#012970] mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-[#4154f1]" />
                Ownership History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Owner</th>
                      <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">From</th>
                      <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">To</th>
                      <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {land.ownershipHistory && land.ownershipHistory.length > 0 ? (
                      land.ownershipHistory.map((record, index) => (
                        <tr key={index} className="group">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#4154f1] flex items-center justify-center font-bold text-xs border border-blue-100">
                                {(record.ownerName || record.owner?.fullName || "N").charAt(0)}
                              </div>
                              <span className="text-[#012970] font-medium">
                                {record.ownerName || record.owner?.fullName || "NIL"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-gray-600">
                            {new Date(record.fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-4 text-sm text-gray-600">
                            {record.toDate 
                              ? new Date(record.toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : (index < (land.ownershipHistory?.length || 0) - 1
                                  ? new Date(land.ownershipHistory[index + 1].fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : <span className="text-emerald-500 font-bold uppercase text-[10px]">Present</span>
                                )
                            }
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">
                              {record.transactionType}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400 italic text-sm">
                          No historical ownership records available for this asset.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DetailCard>

            {/* Description */}
            {land.marketInfo?.description && (
              <DetailCard delay={0.6}>
                <h3 className="text-xl font-semibold text-[#012970] mb-4">Description</h3>
                <p className="text-gray-700 leading-relaxed">{land.marketInfo.description}</p>
              </DetailCard>
            )}

            {/* Features */}
            {land.marketInfo?.features && land.marketInfo.features.length > 0 && (
              <DetailCard delay={0.7}>
                <h3 className="text-xl font-semibold text-[#012970] mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#4154f1]" />
                  Features
                </h3>
                <div className="flex flex-wrap gap-2">
                  {land.marketInfo.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-50 text-[#4154f1] rounded-full text-sm border border-[#4154f1]/20 font-medium"
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
                <h3 className="text-xl font-semibold text-[#012970] mb-4">Nearby Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {land.marketInfo.nearbyAmenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-50 text-[#4154f1] rounded-full text-sm border border-blue-200 font-medium"
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
              <h3 className="font-semibold text-[#012970] mb-4">Property Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Classification</span>
                  <span className="text-[#012970]">{land.classification || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sub Division</span>
                  <span className="text-[#012970]">{land.subDivision || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="text-[#012970]">{land.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verification</span>
                  <span className="text-[#012970]">{land.verificationStatus}</span>
                </div>
              </div>
            </DetailCard>

            {/* Documents (Owner Only) */}
            {isOwner && (land.originalDocument || land.digitalDocument) && (
              <DetailCard delay={0.45}>
                <h3 className="font-semibold text-[#012970] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#4154f1]" />
                  Documents
                </h3>
                <div className="space-y-3">
                  {land.digitalDocument && (
                    <button
                      onClick={() => handleDownloadDocument(land._id!)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-50 text-[#4154f1] border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download Digitized Doc
                    </button>
                  )}
                  {land.originalDocument && (
                    <button
                      onClick={() => handleDownloadOriginalDocument(land._id!)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download Original Doc
                    </button>
                  )}
                </div>
              </DetailCard>
            )}

            {/* Listing Information */}
            <DetailCard delay={0.5}>
              <h3 className="font-semibold text-[#012970] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#4154f1]" />
                Listing Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed Date</span>
                  <span className="text-[#012970]">
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
                <h3 className="font-semibold text-[#012970] mb-4">Virtual Tour</h3>
                <a
                  href={land.marketInfo?.virtualTourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#4154f1] hover:text-[#4154f1] transition-colors"
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
            <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-gray-200 w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-[#012970]">
                  Chat with {land.currentOwner?.fullName || 'Land Owner'}
                </h2>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-gray-600 hover:text-[#012970] transition-colors"
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
        {/* Remove Confirmation Modal */}
        {showRemoveConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-[#012970] text-center mb-2">Remove Listing?</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to remove this land from the marketplace? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRemoveConfirm(false)}
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
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LandDetailPage;
