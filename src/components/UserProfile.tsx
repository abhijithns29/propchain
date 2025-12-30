import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Wallet,
  MapPin,
  Phone,
  Edit2,
  Save,
  X,
  QrCode,
  Copy,
  Map,
  Calendar,
  DollarSign,
  Eye,
  ShoppingCart,
  Scissors,
  Settings,
  Download,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import QRCode from "qrcode";
import apiService from "../services/api";
import LandListingForm from "./LandListingForm";
import { z } from "zod";

interface UserProfileProps {
  onNavigateToLand?: (landId: string) => void;
}

// Validation schema
const profileSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  email: z.string()
    .email("Invalid email format")
    .min(1, "Email is required"),
  phoneNumber: z.string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  address: z.object({
    street: z.string()
      .min(5, "Street address must be at least 5 characters")
      .optional()
      .or(z.literal("")),
    city: z.string()
      .regex(/^[a-zA-Z\s]+$/, "City must contain only letters")
      .min(2, "City must be at least 2 characters")
      .optional()
      .or(z.literal("")),
    state: z.string()
      .regex(/^[a-zA-Z\s]+$/, "State must contain only letters")
      .min(2, "State must be at least 2 characters")
      .optional()
      .or(z.literal("")),
    zipCode: z.string()
      .regex(/^[0-9]{6}$/, "ZIP code must be exactly 6 digits")
      .optional()
      .or(z.literal("")),
  }),
});

type FormErrors = {
  [K in keyof z.infer<typeof profileSchema>]?: string;
} & {
  address?: {
    [K in keyof z.infer<typeof profileSchema>["address"]]?: string;
  };
};

const UserProfile: React.FC<UserProfileProps> = ({ onNavigateToLand }) => {
  const { auth, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [ownedLands, setOwnedLands] = useState<any[]>([]);
  const [landsLoading, setLandsLoading] = useState(false);
  const [showOwnedLands, setShowOwnedLands] = useState(false);
  const [showListingForm, setShowListingForm] = useState(false);
  const [showPartitionModal, setShowPartitionModal] = useState(false);
  const [selectedLand, setSelectedLand] = useState<any>(null);
  const [partitionData, setPartitionData] = useState({
    partitionType: "partial", // 'partial' or 'whole'
    partitionArea: "",
    askingPrice: "",
    description: "",
  });
  const [formData, setFormData] = useState({
    fullName: auth.user?.fullName || "",
    email: auth.user?.email || "",
    phoneNumber: auth.user?.profile?.phoneNumber || "",
    address: {
      street: auth.user?.profile?.address?.street || "",
      city: auth.user?.profile?.address?.city || "",
      state: auth.user?.profile?.address?.state || "",
      zipCode: auth.user?.profile?.address?.zipCode || "",
    },
  });

  // Generate QR code for user ID
  useEffect(() => {
    const generateQRCode = async () => {
      if (auth.user?.id) {
        try {
          const qrUrl = await QRCode.toDataURL(auth.user.id, {
            width: 200,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCodeUrl(qrUrl);
        } catch (error) {
          console.error("Error generating QR code:", error);
        }
      }
    };

    generateQRCode();
  }, [auth.user?.id]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const fetchOwnedLands = async () => {
    if (!auth.user?.id) {
      console.log("No user ID available");
      return;
    }

    console.log("Fetching owned lands for user:", auth.user.id);
    setLandsLoading(true);
    setError(""); // Clear any previous errors

    try {
      const response = await apiService.getOwnedLandsByUserId(auth.user.id, {
        limit: 10,
      });
      console.log("Owned lands response:", response);
      setOwnedLands(response.lands || []);
    } catch (error) {
      console.error("Error fetching owned lands:", error);
      setError(
        `Failed to load owned lands: ${error.message || "Unknown error"}`
      );
    } finally {
      setLandsLoading(false);
    }
  };

  const toggleOwnedLands = () => {
    if (!showOwnedLands && ownedLands.length === 0) {
      fetchOwnedLands();
    }
    setShowOwnedLands(!showOwnedLands);
  };

  const handleListForSale = (land: any) => {
    setSelectedLand(land);
    setShowListingForm(true);
  };

  const handleListingSuccess = () => {
    setShowListingForm(false);
    setSelectedLand(null);
    fetchOwnedLands(); // Refresh the owned lands list
  };

  const handleViewDetails = (landId: string) => {
    if (onNavigateToLand) {
      onNavigateToLand(landId);
    } else {
      console.warn('Navigation function not provided');
    }
  };

  const handleDownloadDocument = async (landId: string) => {
    try {
      setLoading(true);
      
      // Create a temporary link to download the PDF
      const token = localStorage.getItem('token');
      const downloadUrl = `http://localhost:5000/api/lands/${landId}/download-document`;
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `land_document_${landId}.pdf`;
      
      // Add authorization header by creating a fetch request first
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download document');
      }
      
      // Get the blob and create a download URL
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Trigger download
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (error: any) {
      setError(error.message || 'Failed to download document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadOriginalDocument = async (landId: string) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const downloadUrl = `http://localhost:5000/api/lands/${landId}/download-original-document`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `original_document_${landId}.pdf`;
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download original document');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      link.href = blobUrl;
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


  const handlePartitionLand = (land: any) => {
    setSelectedLand(land);
    setPartitionData({
      partitionType: "partial",
      partitionArea: "",
      askingPrice: "",
      description: "",
    });
    setShowPartitionModal(true);
  };


  const handlePartitionSubmit = async () => {
    if (!selectedLand || !partitionData.askingPrice) return;

    try {
      setLoading(true);
      // For now, we'll treat partition as a regular sale
      // In the future, this could create a new land record for the partitioned area
      const response = await apiService.listLandForSale(selectedLand._id, {
        askingPrice: partitionData.askingPrice,
        description: partitionData.description,
        features: `Partition: ${partitionData.partitionType}`,
        nearbyAmenities: "",
      });

      console.log("Land partitioned and listed:", response);
      await fetchOwnedLands();
      setShowPartitionModal(false);
      setError("");
    } catch (error) {
      console.error("Error partitioning land:", error);
      setError("Failed to partition land");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
      
      // Clear field error when user types
      setFieldErrors((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormErrors] as any),
          [child]: undefined,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      
      // Clear field error when user types
      setFieldErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      setFieldErrors({});
      
      // Validate form data
      const validationResult = profileSchema.safeParse(formData);
      
      if (!validationResult.success) {
        // Convert Zod errors to field errors
        const errors: any = {};
        validationResult.error.issues.forEach((err: z.ZodIssue) => {
          const path = err.path;
          if (path.length === 1) {
            errors[path[0]] = err.message;
          } else if (path.length === 2 && path[0] === 'address') {
            if (!errors.address) errors.address = {};
            errors.address[path[1]] = err.message;
          }
        });
        
        setFieldErrors(errors);
        setError("Please fix the validation errors below");
        setLoading(false);
        return;
      }
      
      // Call the API to update the profile
      const response = await apiService.updateProfile({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
      });
      
      console.log("Profile updated successfully:", response);
      
      // Refresh the user data in the auth context
      await refreshUser();
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      setError(error.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError("");
    setFormData({
      fullName: auth.user?.fullName || "",
      email: auth.user?.email || "",
      phoneNumber: auth.user?.profile?.phoneNumber || "",
      address: {
        street: auth.user?.profile?.address?.street || "",
        city: auth.user?.profile?.address?.city || "",
        state: auth.user?.profile?.address?.state || "",
        zipCode: auth.user?.profile?.address?.zipCode || "",
      },
    });
    setIsEditing(false);
  };

  if (!auth.user) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-slate-400">Loading profile...</div>
      </div>
    );
  }

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    const fields = [
      auth.user?.fullName,
      auth.user?.email,
      auth.user?.profile?.phoneNumber,
      auth.user?.profile?.address?.street,
      auth.user?.profile?.address?.city,
      auth.user?.profile?.address?.state,
      auth.user?.profile?.address?.zipCode,
      auth.user?.walletAddress,
    ];
    
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const completionPercentage = calculateProfileCompletion();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">User Profile</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your account information and preferences
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 border border-slate-700 rounded-lg text-sm font-medium text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-2xl text-sm font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/40 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950 mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-slate-700 rounded-lg text-sm font-medium text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Profile Completion Indicator */}
      {completionPercentage < 100 && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-emerald-300">Complete Your Profile</h3>
              <p className="text-xs text-emerald-200/70">Add missing information to unlock all features</p>
            </div>
            <span className="text-lg font-bold text-emerald-300">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-900/50 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800/50">
          <div className="flex items-center">
            <div className="h-16 w-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/40">
              <User className="h-8 w-8 text-slate-950" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-white">
                {auth.user.fullName}
              </h2>
              <p className="text-sm text-slate-400">
                {auth.user.role === "ADMIN"
                  ? "Administrator"
                  : "Property Owner"}
              </p>
              <div className="flex items-center mt-1">
                {auth.user.verificationStatus === "VERIFIED" ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Verified Account
                  </span>
                ) : auth.user.verificationStatus === "PENDING" ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    Pending Verification
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                    Verification Required
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User ID and QR Code Section */}
        <div className="px-6 py-4 bg-slate-800/30 border-b border-slate-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                User ID (MongoDB ObjectId)
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm font-mono text-white break-all">
                  {auth.user?.id || "Not available"}
                </code>
                <button
                  onClick={() => copyToClipboard(auth.user?.id || "")}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                  title="Copy User ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copySuccess && (
                <p className="text-xs text-emerald-300 mt-1">
                  Copied to clipboard!
                </p>
              )}
            </div>

            {/* QR Code */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <QrCode className="inline h-4 w-4 mr-1" />
                User ID QR Code
              </label>
              <div className="flex justify-center">
                {qrCodeUrl ? (
                  <div className="bg-white p-4 rounded-lg border border-slate-700 shadow-sm">
                    <img
                      src={qrCodeUrl}
                      alt="User ID QR Code"
                      className="w-32 h-32"
                    />
                    <p className="text-xs text-slate-600 text-center mt-2 font-medium">
                      Scan to get User ID
                    </p>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-slate-800/50 border border-slate-700 rounded-lg flex items-center justify-center">
                    <QrCode className="h-8 w-8 text-slate-600" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 text-center mt-2">
                Share this QR code for quick identity verification
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Full Name
              </label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${fieldErrors.fullName ? 'border-red-500' : 'border-slate-700'} bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500`}
                  />
                  {fieldErrors.fullName && (
                    <p className="text-red-400 text-xs mt-1">{fieldErrors.fullName}</p>
                  )}
                </>
              ) : (
                <p className="text-white">{auth.user.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address
              </label>
              {isEditing ? (
                <>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-slate-700'} bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500`}
                  />
                  {fieldErrors.email && (
                    <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </>
              ) : (
                <p className="text-white">{auth.user.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone Number
              </label>
              {isEditing ? (
                <>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${fieldErrors.phoneNumber ? 'border-red-500' : 'border-slate-700'} bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500`}
                    placeholder="Enter phone number"
                  />
                  {fieldErrors.phoneNumber && (
                    <p className="text-red-400 text-xs mt-1">{fieldErrors.phoneNumber}</p>
                  )}
                </>
              ) : (
                <p className={auth.user.profile?.phoneNumber ? "text-white" : "text-slate-500 italic"}>
                  {auth.user.profile?.phoneNumber || "Click 'Edit Profile' to add"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Wallet className="inline h-4 w-4 mr-1" />
                Wallet Address
              </label>
              <p className="text-white font-mono text-sm break-all">
                {auth.user.walletAddress}
              </p>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Street Address
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${fieldErrors.address?.street ? 'border-red-500' : 'border-slate-700'} bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500`}
                      placeholder="Enter street address"
                    />
                    {fieldErrors.address?.street && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.address.street}</p>
                    )}
                  </>
                ) : (
                  <p className={auth.user.profile?.address?.street ? "text-white" : "text-slate-500 italic"}>
                    {auth.user.profile?.address?.street || "Click 'Edit Profile' to add"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  City
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${fieldErrors.address?.city ? 'border-red-500' : 'border-slate-700'} bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500`}
                      placeholder="Enter city"
                    />
                    {fieldErrors.address?.city && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.address.city}</p>
                    )}
                  </>
                ) : (
                  <p className={auth.user.profile?.address?.city ? "text-white" : "text-slate-500 italic"}>
                    {auth.user.profile?.address?.city || "Click 'Edit Profile' to add"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  State
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${fieldErrors.address?.state ? 'border-red-500' : 'border-slate-700'} bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500`}
                      placeholder="Enter state"
                    />
                    {fieldErrors.address?.state && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.address.state}</p>
                    )}
                  </>
                ) : (
                  <p className={auth.user.profile?.address?.state ? "text-white" : "text-slate-500 italic"}>
                    {auth.user.profile?.address?.state || "Click 'Edit Profile' to add"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  ZIP Code
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${fieldErrors.address?.zipCode ? 'border-red-500' : 'border-slate-700'} bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500`}
                      placeholder="Enter ZIP code"
                    />
                    {fieldErrors.address?.zipCode && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.address.zipCode}</p>
                    )}
                  </>
                ) : (
                  <p className={auth.user.profile?.address?.zipCode ? "text-white" : "text-slate-500 italic"}>
                    {auth.user.profile?.address?.zipCode || "Click 'Edit Profile' to add"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Account Statistics */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Account Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald-300">
                  {auth.user.ownedProperties?.length ?? 0}
                </div>
                <div className="text-sm text-emerald-200">Properties Owned</div>
              </div>

              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald-300">
                  {/* This would be calculated from transactions */}0
                </div>
                <div className="text-sm text-emerald-200">
                  Completed Transactions
                </div>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">
                  {/* This would be calculated from pending transactions */}0
                </div>
                <div className="text-sm text-yellow-300">
                  Pending Transactions
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Owned Lands Section */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Map className="h-5 w-5 mr-2" />
              Owned Lands
            </h3>
            <button
              onClick={toggleOwnedLands}
              className="inline-flex items-center px-3 py-2 border border-slate-700 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-slate-800/50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
            >
              {showOwnedLands ? "Hide" : "Show"} Lands
            </button>
          </div>

          {showOwnedLands && (
            <div className="space-y-4">
              {landsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  <span className="ml-2 text-slate-400">Loading lands...</span>
                </div>
              ) : ownedLands.length === 0 ? (
                <div className="text-center py-8">
                  <Map className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No lands owned yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ownedLands.map((land) => (
                    <div
                      key={land._id}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white truncate">
                          {land.surveyNumber} - {land.subDivision}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            land.status === "FOR_SALE"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : land.status === "DIGITIZED"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-800/50 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {land.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-slate-400">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {land.village}, {land.district}, {land.state}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            Added:{" "}
                            {new Date(land.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {land.area && (
                          <div className="flex items-center">
                            <span className="font-medium text-white">Area: </span>
                            <span className="ml-1">
                              {typeof land.area === "string"
                                ? JSON.parse(land.area).acres + " acres"
                                : land.area.acres + " acres"}
                            </span>
                          </div>
                        )}

                        {/* Document Information */}
                        <div className="space-y-1">
                          {land.originalDocument && (
                            <div className="flex items-center text-sm text-slate-400">
                              <Download className="h-3 w-3 mr-1" />
                              <span>Original Doc: {land.originalDocument.filename || 'Available'}</span>
                            </div>
                          )}
                          {land.digitalDocument && (
                            <div className="flex items-center text-sm text-emerald-300">
                              <Download className="h-3 w-3 mr-1" />
                              <span>Digitized Doc: Available</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={() => handleViewDetails(land._id)}
                              className="inline-flex items-center text-emerald-300 hover:text-emerald-200 text-sm transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </button>
                            {land.digitalDocument && (
                              <button 
                                onClick={() => handleDownloadDocument(land._id)}
                                className="inline-flex items-center text-emerald-300 hover:text-emerald-200 text-sm transition-colors"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download Digitized Doc
                              </button>
                            )}
                            {land.originalDocument && (
                              <button 
                                onClick={() => handleDownloadOriginalDocument(land._id)}
                                className="inline-flex items-center text-slate-400 hover:text-slate-300 text-sm transition-colors"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download Original Doc
                              </button>
                            )}
                          </div>

                          {land.status !== "FOR_SALE" && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleListForSale(land)}
                                className="inline-flex items-center px-3 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-sm transition-colors"
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                List for Sale
                              </button>
                              <button
                                onClick={() => handlePartitionLand(land)}
                                className="inline-flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-sm transition-colors"
                              >
                                <Scissors className="h-4 w-4 mr-1" />
                                Partition
                              </button>
                            </div>
                          )}

                          {land.status === "FOR_SALE" && (
                            <div className="flex space-x-2">
                              <span className="inline-flex items-center px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm">
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Listed for Sale
                              </span>
                              <button
                                onClick={() => handlePartitionLand(land)}
                                className="inline-flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-sm transition-colors"
                              >
                                <Scissors className="h-4 w-4 mr-1" />
                                Partition
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Listing Form Modal */}
      {showListingForm && selectedLand && (
        <LandListingForm
          land={selectedLand}
          onClose={() => setShowListingForm(false)}
          onSuccess={handleListingSuccess}
        />
      )}

      {/* Partition Modal */}
      {showPartitionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Partition Land</h3>
              <button
                onClick={() => setShowPartitionModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Partition Type
                </label>
                <select
                  value={partitionData.partitionType}
                  onChange={(e) =>
                    setPartitionData({
                      ...partitionData,
                      partitionType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="partial">Partial Sale</option>
                  <option value="whole">Sale as Whole</option>
                </select>
              </div>

              {partitionData.partitionType === "partial" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Partition Area (acres)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={partitionData.partitionArea}
                    onChange={(e) =>
                      setPartitionData({
                        ...partitionData,
                        partitionArea: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                    placeholder="Enter area to partition"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Asking Price (₹)
                </label>
                <input
                  type="number"
                  value={partitionData.askingPrice}
                  onChange={(e) =>
                    setPartitionData({
                      ...partitionData,
                      askingPrice: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="Enter asking price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={partitionData.description}
                  onChange={(e) =>
                    setPartitionData({
                      ...partitionData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  rows={3}
                  placeholder="Describe the partitioned land..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPartitionModal(false)}
                className="flex-1 px-4 py-2 border border-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePartitionSubmit}
                disabled={loading || !partitionData.askingPrice}
                className="flex-1 px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 disabled:opacity-50 font-semibold shadow-md shadow-emerald-500/40 transition-colors"
              >
                {loading ? "Processing..." : "Partition & List"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
