import React, { useState, useEffect } from "react";
import {
  MapPin,
  Home,
  Plus,
  Eye,
  Search,
  CheckCircle,
  ShoppingCart,
  User,
  Shield,
  X,
  XCircle,
  Edit
} from "lucide-react";
import { Land } from "../types";
import { useAuth } from "../hooks/useAuth";
import apiService from "../services/api";
import AddLandForm from "./AddLandForm";
import EditLandForm from "./EditLandForm";

const LandDatabase: React.FC = () => {
  const { auth } = useAuth();
  const [lands, setLands] = useState<Land[]>([]);
  const [filteredLands, setFilteredLands] = useState<Land[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    district: "",
    state: "",
    landType: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [landToEdit, setLandToEdit] = useState<Land | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadLands();
  }, []);

  useEffect(() => {
    filterLands();
  }, [lands, searchTerm, filters]);

  const loadLands = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLands({ limit: 100 });
      setLands(response.lands);
    } catch (error: any) {
      setError(error.message || "Failed to load lands");
    } finally {
      setLoading(false);
    }
  };

  const filterLands = () => {
    let filtered = [...lands];

    if (searchTerm) {
      filtered = filtered.filter(
        (land) =>
          land.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          land.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
          land.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
          land.surveyNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((land) =>
          (land as any)[key]?.toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    setFilteredLands(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClaimOwnership = async (landId: string) => {
    try {
      if (auth.user?.verificationStatus !== "VERIFIED") {
        setError(
          "You must be verified to claim land ownership. Please complete your verification first."
        );
        return;
      }

      await apiService.claimLandOwnership(landId);
      loadLands();
    } catch (error: any) {
      setError(error.message || "Failed to claim ownership");
    }
  };

  const handleDigitalize = async (landId: string) => {
    try {
      console.log("Digitalizing land with ID:", landId);
      await apiService.digitalizeLand(landId);
      loadLands();
    } catch (error: any) {
      setError(error.message || "Failed to digitalize land");
    }
  };

  const handleUnDigitalize = async (landId: string) => {
    try {
      console.log("Un-digitalizing land with ID:", landId);
      await apiService.unDigitalizeLand(landId);
      loadLands();
    } catch (error: any) {
      setError(error.message || "Failed to un-digitalize land");
    }
  };

  const handleDownloadOriginalDocument = async (landId: string, assetId: string) => {
    try {
      // Check document status first
      const status = await apiService.checkDocumentStatus(landId);

      if (!status.data.originalDocument || !status.data.originalDocument.exists) {
        setError("Original document not found or not available for download");
        return;
      }

      const blob = await apiService.downloadOriginalDocument(landId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `land-document-${assetId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.message || "Failed to download original document");
    }
  };

  const handleDownloadCertificate = async (landId: string, assetId: string) => {
    try {
      // Check document status first
      const status = await apiService.checkDocumentStatus(landId);

      if (!status.data.digitalDocument || !status.data.digitalDocument.exists || !status.data.digitalDocument.isDigitalized) {
        setError("Digital certificate not found or land is not digitalized");
        return;
      }

      const blob = await apiService.downloadCertificate(landId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `land-certificate-${assetId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.message || "Failed to download certificate");
    }
  };

  const handleListForSale = async (landId: string, saleData: any) => {
    try {
      await apiService.listLandForSale(landId, saleData);
      loadLands();
    } catch (error: any) {
      setError(error.message || "Failed to list land for sale");
    }
  };

  const handleSearchById = async (assetId: string) => {
    try {
      setLoading(true);
      const response = await apiService.searchLand(assetId);
      setLands([response.land]);
      setFilteredLands([response.land]);
    } catch (error: any) {
      setError(error.message || "Land not found");
      setLands([]);
      setFilteredLands([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
      case "FOR_SALE":
        return "bg-green-50 text-green-700 border border-green-100";
      case "UNDER_TRANSACTION":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      case "SOLD":
        return "bg-gray-50 text-gray-700 border border-gray-100";
      case "DISPUTED":
        return "bg-red-50 text-red-700 border border-red-100";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-100";
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-blue-50 text-[#4154f1] border border-blue-100";
      case "PENDING":
        return "bg-orange-50 text-orange-700 border border-orange-100";
      case "REJECTED":
        return "bg-red-50 text-red-700 border border-red-100";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#012970]">Land Database</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive database of all registered lands
          </p>
        </div>
        {auth.user?.role === "ADMIN" && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-md shadow-blue-500/20 text-sm font-bold text-white bg-[#4154f1] hover:bg-[#3346d8] transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Land
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 text-red-300 hover:text-red-200 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        {/* Asset ID Search */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-[#012970] mb-3 uppercase tracking-wider">
            Search by Asset ID
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter Asset ID (e.g., KA001123456)"
              className="flex-1 px-4 py-2.5 border border-gray-200 bg-gray-50 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] border-transparent placeholder-gray-400 transition-all font-medium"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    handleSearchById(target.value.trim());
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector(
                  'input[placeholder*="Asset ID"]'
                ) as HTMLInputElement;
                if (input?.value.trim()) {
                  handleSearchById(input.value.trim());
                }
              }}
              className="px-6 py-2.5 bg-[#4154f1] text-white rounded-lg hover:bg-[#3346d8] font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Search
            </button>
            <button
              onClick={() => {
                const input = document.querySelector(
                  'input[placeholder*="Asset ID"]'
                ) as HTMLInputElement;
                if (input) input.value = "";
                setSearchTerm("");
                setFilters({
                  district: "",
                  state: "",
                  landType: "",
                  status: "",
                });
                loadLands();
              }}
              className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all font-bold"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-6 border-t border-gray-100">
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by Village, District, Survey Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] placeholder-gray-400 transition-all"
              />
            </div>
          </div>

          <select
            value={filters.state}
            onChange={(e) => handleFilterChange("state", e.target.value)}
            className="px-3 py-2.5 border border-gray-200 bg-gray-50 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] font-medium"
          >
            <option value="">All States</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
          </select>

          <select
            value={filters.landType}
            onChange={(e) => handleFilterChange("landType", e.target.value)}
            className="px-3 py-2.5 border border-gray-200 bg-gray-50 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] font-medium"
          >
            <option value="">All Types</option>
            <option value="AGRICULTURAL">Agricultural</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="INDUSTRIAL">Industrial</option>
            <option value="GOVERNMENT">Government</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2.5 border border-gray-200 bg-gray-50 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] font-medium"
          >
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="FOR_SALE">For Sale</option>
            <option value="UNDER_TRANSACTION">Under Transaction</option>
            <option value="SOLD">Sold</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>
      </div>

      {/* Lands Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4154f1]"></div>
        </div>
      ) : filteredLands.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-gray-300 mb-4 flex justify-center">
            <MapPin className="w-16 h-16" />
          </div>
          <h3 className="text-xl font-bold text-[#012970]">No lands found</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            {lands.length === 0
              ? "No lands have been added to the database yet. Click 'Add Land' to start."
              : "Try adjusting your search or filter criteria to find what you're looking for."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLands.map((land) => (
            <div
              key={land._id || land.id}
              className="group rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:border-[#4154f1]/30 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
            >
              <div className="p-6 flex flex-col flex-1">
                {/* Header Section */}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-[#012970] mb-1 group-hover:text-[#4154f1] transition-colors">
                    {land.assetId}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Survey No: {land.surveyNumber}
                  </p>

                  {/* Status Badges - Horizontal */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(
                        land.status
                      )}`}
                    >
                      {land.status.replace("_", " ")}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getVerificationColor(
                        land.verificationStatus
                      )}`}
                    >
                      {land.verificationStatus}
                    </span>
                    {land.digitalDocument?.isDigitalized && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        ✓ Digitalized
                      </span>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 mb-5"></div>

                {/* Location */}
                <div className="flex items-start gap-2 mb-5">
                  <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:text-[#4154f1] group-hover:bg-blue-50 transition-colors">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-gray-600 font-medium leading-relaxed">
                    {land.village} • {land.taluka} • {land.district}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Type</p>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-[#4154f1]/50" />
                      <p className="text-sm text-[#012970] font-bold">{land.landType}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Area</p>
                    <p className="text-sm text-[#012970] font-bold">{land.area.acres || 0} Acres</p>
                  </div>
                </div>

                {/* Market Info - If For Sale */}
                {land.marketInfo.isForSale && (
                  <div className="bg-[#4154f1]/5 rounded-xl p-4 border border-[#4154f1]/10 mb-6 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-[#4154f1] uppercase tracking-wider mb-1">Listed for Sale</p>
                        <p className="text-xl font-black text-[#012970]">
                          ₹{land.marketInfo.askingPrice?.toLocaleString()}
                        </p>
                      </div>
                      <ShoppingCart className="h-6 w-6 text-[#4154f1]/20" />
                    </div>
                  </div>
                )}

                {/* Owner Section */}
                {land.currentOwner ? (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-6 group-hover:bg-white transition-colors">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Current Owner</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4154f1] text-white flex items-center justify-center font-bold text-xs">
                        {land.currentOwner.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#012970] truncate">
                          {land.currentOwner.fullName}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {land.currentOwner.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 mb-6">
                    <p className="text-sm font-bold text-orange-600">
                      Unclaimed Asset
                    </p>
                    {auth.user?.verificationStatus !== "VERIFIED" && (
                      <p className="text-[10px] text-orange-500 font-medium mt-1 uppercase tracking-tight">
                        Complete verification to claim
                      </p>
                    )}
                  </div>
                )}

                {/* Spacer to push buttons to bottom */}
                <div className="flex-grow"></div>

                {/* Divider */}
                <div className="border-t border-gray-100 mb-5"></div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedLand(land);
                        setShowModal(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>

                    {!land.currentOwner &&
                      auth.user?.verificationStatus === "VERIFIED" && (
                        <button
                          onClick={() => handleClaimOwnership(land._id || land.id)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all font-bold"
                        >
                          Claim
                        </button>
                      )}

                    {land.currentOwner?.id === auth.user?.id &&
                      !land.marketInfo.isForSale &&
                      auth.user?.role === "USER" && (
                        <button
                          onClick={() => {
                            const askingPrice = prompt("Enter asking price (₹):");
                            const description = prompt(
                              "Enter description (optional):"
                            );

                            if (askingPrice) {
                              handleListForSale(land._id || land.id, {
                                askingPrice: parseFloat(askingPrice),
                                description: description || "",
                              });
                            }
                          }}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-bold text-white bg-[#4154f1] hover:bg-[#3346d8] shadow-md shadow-blue-500/20 transition-all"
                        >
                          List for Sale
                        </button>
                      )}

                    {auth.user?.role === "ADMIN" &&
                      !land.digitalDocument?.isDigitalized && (
                        <button
                          onClick={() => handleDigitalize(land._id || land.id)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-bold text-white bg-[#4154f1] hover:bg-[#3346d8] shadow-md shadow-blue-500/20 transition-all"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Digitalize
                        </button>
                      )}

                    {auth.user?.role === "ADMIN" &&
                      land.digitalDocument?.isDigitalized && (
                        <button
                          onClick={() => handleUnDigitalize(land._id || land.id)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-orange-200 rounded-lg text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-all shadow-sm"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Un-digitalize
                        </button>
                      )}

                    {auth.user?.role === "ADMIN" && (
                      <button
                        onClick={() => {
                          setLandToEdit(land);
                          setShowEditForm(true);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                    )}

                  </div>

                  {land.digitalDocument?.isDigitalized && (
                    <button
                      onClick={() => handleDownloadCertificate(land._id || land.id, land.assetId)}
                      className="w-full text-xs text-[#4154f1] hover:text-[#3346d8] font-bold uppercase tracking-widest transition-colors py-2.5 bg-blue-50 rounded-lg border border-blue-100/50"
                    >
                      📄 Download Digital Certificate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && selectedLand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#012970]/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-[#012970] mb-1">
                  Land Details
                </h2>
                <p className="text-sm text-gray-400">Asset ID: {selectedLand.assetId}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-[#012970]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-[#012970] mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#4154f1]/10 flex items-center justify-center">
                    <Home className="w-4 h-4 text-[#4154f1]" />
                  </div>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] whitespace-nowrap font-bold text-gray-400 uppercase tracking-widest mb-1 block">Survey Number</label>
                    <p className="text-[#012970] font-bold text-lg">{selectedLand.surveyNumber}</p>
                  </div>
                  <div>
                    <label className="text-[10px] whitespace-nowrap font-bold text-gray-400 uppercase tracking-widest mb-1 block">Land Type</label>
                    <p className="text-[#012970] font-bold text-lg">{selectedLand.landType}</p>
                  </div>
                  <div>
                    <label className="text-[10px] whitespace-nowrap font-bold text-gray-400 uppercase tracking-widest mb-1 block">Area</label>
                    <p className="text-[#012970] font-bold text-lg">{selectedLand.area.acres || 0} Acres</p>
                  </div>
                  <div>
                    <label className="text-[10px] whitespace-nowrap font-bold text-gray-400 uppercase tracking-widest mb-1 block">Classification</label>
                    <p className="text-gray-700 font-semibold">{selectedLand.classification || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] whitespace-nowrap font-bold text-gray-400 uppercase tracking-widest mb-1 block">Sub Division</label>
                    <p className="text-gray-700 font-semibold">{selectedLand.subDivision || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] whitespace-nowrap font-bold text-gray-400 uppercase tracking-widest mb-1 block">Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${getStatusColor(selectedLand.status)}`}>
                      {selectedLand.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location & Ownership */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location */}
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#012970] mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#4154f1]/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-[#4154f1]" />
                    </div>
                    Location
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm text-gray-500 font-medium">Village</span>
                      <span className="text-sm text-[#012970] font-bold">{selectedLand.village}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm text-gray-500 font-medium">Taluka / District</span>
                      <span className="text-sm text-[#012970] font-bold text-right">{selectedLand.taluka}, {selectedLand.district}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">State</span>
                      <span className="text-sm text-[#012970] font-bold">{selectedLand.state}</span>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#012970] mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#4154f1]/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#4154f1]" />
                    </div>
                    Owner Information
                  </h3>
                  {selectedLand.currentOwner ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4154f1] to-[#3346d8] flex items-center justify-center text-white font-bold text-lg">
                          {selectedLand.currentOwner.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[#012970] font-bold leading-tight">{selectedLand.currentOwner.fullName}</p>
                          <p className="text-xs text-gray-500">{selectedLand.currentOwner.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <div className={`px - 3 py - 1 rounded - full text - [10px] font - bold uppercase tracking - widest ${selectedLand.currentOwner.verificationStatus === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'} `}>
                          {selectedLand.currentOwner.verificationStatus === 'VERIFIED' ? 'Verified Owner' : 'Unverified'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                      <p className="text-orange-600 font-bold text-sm">No current owner assigned</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Market Information */}
              {selectedLand.marketInfo.isForSale && (
                <div className="bg-gradient-to-br from-[#4154f1]/5 to-blue-600/5 rounded-2xl border border-[#4154f1]/10 p-6">
                  <h3 className="text-lg font-bold text-[#012970] mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#4154f1]/10 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-[#4154f1]" />
                    </div>
                    Market Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <label className="text-[10px] font-bold text-[#4154f1] uppercase tracking-widest mb-1 block">Asking Price</label>
                      <p className="text-3xl font-black text-[#012970]">
                        ₹{selectedLand.marketInfo.askingPrice?.toLocaleString()}
                      </p>
                    </div>
                    {selectedLand.marketInfo.listedDate && (
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Listed Date</label>
                        <p className="text-lg font-bold text-gray-700">
                          {new Date(selectedLand.marketInfo.listedDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Property Details */}
              {selectedLand.hasProperty && selectedLand.propertyDetails && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-100 p-6">
                  <h3 className="text-lg font-bold text-[#012970] mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Home className="w-4 h-4 text-purple-600" />
                    </div>
                    Property on Land
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedLand.propertyDetails.propertyType && (
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Property Type</label>
                        <p className="text-sm text-[#012970] font-bold">{selectedLand.propertyDetails.propertyType}</p>
                      </div>
                    )}

                    {selectedLand.propertyDetails.buildingType && (
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Building Type</label>
                        <p className="text-sm text-[#012970] font-bold">{selectedLand.propertyDetails.buildingType}</p>
                      </div>
                    )}

                    {selectedLand.propertyDetails.constructionYear && (
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Construction Year</label>
                        <p className="text-sm text-[#012970] font-bold">{selectedLand.propertyDetails.constructionYear}</p>
                      </div>
                    )}

                    {selectedLand.propertyDetails.totalFloors && (
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Total Floors</label>
                        <p className="text-sm text-[#012970] font-bold">{selectedLand.propertyDetails.totalFloors}</p>
                      </div>
                    )}

                    {selectedLand.propertyDetails.builtUpArea && (
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Built-up Area</label>
                        <p className="text-sm text-[#012970] font-bold">{selectedLand.propertyDetails.builtUpArea} Sq Ft</p>
                      </div>
                    )}

                    {selectedLand.propertyDetails.numberOfRooms && (
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Rooms</label>
                        <p className="text-sm text-[#012970] font-bold">{selectedLand.propertyDetails.numberOfRooms}</p>
                      </div>
                    )}

                    {selectedLand.propertyDetails.numberOfBathrooms && (
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Bathrooms</label>
                        <p className="text-sm text-[#012970] font-bold">{selectedLand.propertyDetails.numberOfBathrooms}</p>
                      </div>
                    )}

                    {selectedLand.propertyDetails.parkingSpaces && (
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Parking Spaces</label>
                        <p className="text-sm text-[#012970] font-bold">{selectedLand.propertyDetails.parkingSpaces}</p>
                      </div>
                    )}
                  </div>

                  {selectedLand.propertyDetails.additionalFeatures && (
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mt-4">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Additional Features</label>
                      <p className="text-sm text-gray-700">{selectedLand.propertyDetails.additionalFeatures}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Verification & Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-[#012970] mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#4154f1]/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-[#4154f1]" />
                    </div>
                    Verification Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status</span>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getVerificationColor(selectedLand.verificationStatus)}`}>
                        {selectedLand.verificationStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Asset Digitization</span>
                      {selectedLand.digitalDocument?.isDigitalized ? (
                        <span className="text-emerald-600 font-bold text-[10px] uppercase flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Digitalized
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold text-[10px] uppercase">Original Only</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#012970] mb-6 whitespace-nowrap">📄 Land Documents</h3>
                  <div className="space-y-3">
                    {selectedLand.originalDocument?.url && (
                      <button
                        onClick={() => handleDownloadOriginalDocument(selectedLand._id || selectedLand.id, selectedLand.assetId)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm"
                      >
                        📄 Download Original Land Document
                      </button>
                    )}

                    {selectedLand.digitalDocument?.url && selectedLand.digitalDocument.isDigitalized && (
                      <button
                        onClick={() => handleDownloadCertificate(selectedLand._id || selectedLand.id, selectedLand.assetId)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all"
                      >
                        🔒 Download Digitalized Certificate
                      </button>
                    )}

                    {!selectedLand.originalDocument?.url && !selectedLand.digitalDocument?.url && (
                      <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No Documents Available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <AddLandForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            loadLands();
          }}
        />
      )}

      {showEditForm && landToEdit && (
        <EditLandForm
          land={landToEdit}
          onClose={() => {
            setShowEditForm(false);
            setLandToEdit(null);
          }}
          onSuccess={() => {
            setShowEditForm(false);
            setLandToEdit(null);
            loadLands();
          }}
        />
      )}
    </div>
  );
};

export default LandDatabase;
