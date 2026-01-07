import React, { useState } from 'react';
import { X, MapPin, Home, Navigation, XCircle, CheckCircle, Edit } from 'lucide-react';
import apiService from '../services/api';
import MapView from './MapView';
import { Land } from '../types';

interface EditLandFormProps {
    land: Land;
    onClose: () => void;
    onSuccess: () => void;
}

const EditLandForm: React.FC<EditLandFormProps> = ({ land, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        surveyNumber: land.surveyNumber || '',
        subDivision: land.subDivision || '',
        village: land.village || '',
        taluka: land.taluka || '',
        district: land.district || '',
        state: land.state || '',
        pincode: land.pincode || '',
        area: {
            acres: land.area?.acres?.toString() || '',
            guntas: land.area?.guntas?.toString() || '',
            sqft: land.area?.sqft?.toString() || ''
        },
        boundaries: {
            north: land.boundaries?.north || '',
            south: land.boundaries?.south || '',
            east: land.boundaries?.east || '',
            west: land.boundaries?.west || ''
        },
        landType: land.landType || '',
        classification: land.classification || '',
        coordinates: land.coordinates || null,
        soilType: (land as any).soilType || '',
        waterSource: (land as any).waterSource || '',
        roadAccess: (land as any).roadAccess || false,
        electricityConnection: (land as any).electricityConnection || false,
        hasProperty: land.hasProperty || false,
        propertyDetails: {
            propertyType: land.propertyDetails?.propertyType || '',
            buildingType: land.propertyDetails?.buildingType || '',
            constructionYear: land.propertyDetails?.constructionYear || '',
            totalFloors: land.propertyDetails?.totalFloors || '',
            builtUpArea: land.propertyDetails?.builtUpArea || '',
            numberOfRooms: land.propertyDetails?.numberOfRooms || '',
            numberOfBathrooms: land.propertyDetails?.numberOfBathrooms || '',
            parkingSpaces: land.propertyDetails?.parkingSpaces || '',
            additionalFeatures: land.propertyDetails?.additionalFeatures || ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, value, type, checked } = target;

        if (success) {
            setSuccess('');
        }

        if (type === 'checkbox') {
            if (name.includes('.')) {
                const [parent, child] = name.split('.');
                setFormData(prev => ({
                    ...prev,
                    [parent]: {
                        ...(prev as any)[parent],
                        [child]: checked,
                    },
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [name]: checked,
                }));
            }
            return;
        }

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value,
                },
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData(prev => ({
            ...prev,
            coordinates: { latitude: lat, longitude: lng }
        }));
        setShowMap(false);
    };

    const validateForm = () => {
        const required = ['surveyNumber', 'village', 'taluka', 'district', 'state', 'pincode', 'landType'];
        const missing = required.filter(field => !formData[field as keyof typeof formData]);

        if (missing.length > 0) {
            setError(`Please fill in all required fields: ${missing.join(', ')}`);
            return false;
        }

        if (!/^\d{6}$/.test(formData.pincode)) {
            setError('Please enter a valid 6-digit PIN code');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const updateData = {
                ...formData,
                area: {
                    acres: formData.area.acres ? parseFloat(formData.area.acres) : undefined,
                    guntas: formData.area.guntas ? parseInt(formData.area.guntas) : undefined,
                    sqft: formData.area.sqft ? parseInt(formData.area.sqft) : undefined,
                }
            };

            const response = await apiService.updateLand(land._id || land.id, updateData);

            if (response.success) {
                setSuccess('Land updated successfully!');
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            } else {
                setError(response.message || 'Failed to update land');
            }
        } catch (err: any) {
            console.error('Update land error:', err);
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setError('');

        try {
            const response = await apiService.deleteLand(land._id || land.id);

            if (response.success) {
                setSuccess('Land deleted successfully!');
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            } else {
                setError(response.message || 'Failed to delete land');
            }
        } catch (err: any) {
            console.error('Delete land error:', err);
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-gray-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Edit className="h-5 w-5 text-[#4154f1]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[#012970]">Edit Land Details</h2>
                            <p className="text-sm text-gray-500">Asset ID: {land.assetId}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setSuccess('');
                            setError('');
                            onClose();
                        }}
                        className="text-gray-400 hover:text-[#012970] transition-colors p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[#012970] border-l-4 border-[#4154f1] pl-3">Basic Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Survey Number *
                                </label>
                                <input
                                    type="text"
                                    name="surveyNumber"
                                    required
                                    value={formData.surveyNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="123/1A"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Sub Division
                                </label>
                                <input
                                    type="text"
                                    name="subDivision"
                                    value={formData.subDivision}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="1A1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Asset ID
                                </label>
                                <input
                                    type="text"
                                    value={land.assetId}
                                    disabled
                                    className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-500 rounded-xl cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
                            </div>
                        </div>
                    </div>

                    {/* Location Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[#012970] flex items-center border-l-4 border-[#4154f1] pl-3">
                            <MapPin className="h-5 w-5 mr-2 text-[#4154f1]" />
                            Location Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Village *
                                </label>
                                <input
                                    type="text"
                                    name="village"
                                    required
                                    value={formData.village}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="Village name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Taluka *
                                </label>
                                <input
                                    type="text"
                                    name="taluka"
                                    required
                                    value={formData.taluka}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="Taluka name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    District *
                                </label>
                                <input
                                    type="text"
                                    name="district"
                                    required
                                    value={formData.district}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="District name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    State *
                                </label>
                                <select
                                    name="state"
                                    required
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all cursor-pointer"
                                >
                                    <option value="">Select State</option>
                                    <option value="Karnataka">Karnataka</option>
                                    <option value="Maharashtra">Maharashtra</option>
                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                    <option value="Gujarat">Gujarat</option>
                                    <option value="Rajasthan">Rajasthan</option>
                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                    <option value="West Bengal">West Bengal</option>
                                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                                    <option value="Telangana">Telangana</option>
                                    <option value="Kerala">Kerala</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Pincode *
                                </label>
                                <input
                                    type="text"
                                    name="pincode"
                                    required
                                    value={formData.pincode}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="560001"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Geographic Location
                                </label>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowMap(true)}
                                        className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-[#012970] bg-gray-50 hover:bg-gray-100 transition-all border-dashed"
                                    >
                                        <Navigation className="h-4 w-4 mr-2 text-[#4154f1]" />
                                        {formData.coordinates ? 'Update Location' : 'Set Location'}
                                    </button>
                                    {formData.coordinates && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, coordinates: null }))}
                                            className="px-4 py-3 border border-red-100 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                {formData.coordinates && (
                                    <p className="text-xs text-gray-500 mt-2 font-medium">
                                        📍 Lat: {formData.coordinates.latitude.toFixed(6)},
                                        Lng: {formData.coordinates.longitude.toFixed(6)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Land Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[#012970] flex items-center border-l-4 border-[#4154f1] pl-3">
                            <Home className="h-5 w-5 mr-2 text-[#4154f1]" />
                            Land Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Land Type *
                                </label>
                                <select
                                    name="landType"
                                    required
                                    value={formData.landType}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all cursor-pointer"
                                >
                                    <option value="">Select Type</option>
                                    <option value="AGRICULTURAL">Agricultural</option>
                                    <option value="RESIDENTIAL">Residential</option>
                                    <option value="COMMERCIAL">Commercial</option>
                                    <option value="INDUSTRIAL">Industrial</option>
                                    <option value="GOVERNMENT">Government</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Classification
                                </label>
                                <select
                                    name="classification"
                                    value={formData.classification}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all cursor-pointer"
                                >
                                    <option value="">Select Classification</option>
                                    <option value="DRY">Dry</option>
                                    <option value="WET">Wet</option>
                                    <option value="GARDEN">Garden</option>
                                    <option value="INAM">Inam</option>
                                    <option value="SARKAR">Sarkar</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Area (Acres)
                                </label>
                                <input
                                    type="number"
                                    name="area.acres"
                                    step="0.01"
                                    min="0"
                                    value={formData.area.acres}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="2.5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Area (Guntas)
                                </label>
                                <input
                                    type="number"
                                    name="area.guntas"
                                    min="0"
                                    value={formData.area.guntas}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Area (Sq Ft)
                                </label>
                                <input
                                    type="number"
                                    name="area.sqft"
                                    min="0"
                                    value={formData.area.sqft}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="1000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Soil Type
                                </label>
                                <input
                                    type="text"
                                    name="soilType"
                                    value={formData.soilType}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="Black soil, Red soil, etc."
                                />
                            </div>
                        </div>

                        {/* Additional Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Water Source
                                </label>
                                <input
                                    type="text"
                                    name="waterSource"
                                    value={formData.waterSource}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="Borewell, Canal, River, etc."
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">
                                    Infrastructure
                                </label>
                                <div className="flex space-x-8">
                                    <label className="flex items-center group cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="roadAccess"
                                            checked={formData.roadAccess}
                                            onChange={handleInputChange}
                                            className="rounded-lg border-gray-300 text-[#4154f1] bg-white focus:ring-[#4154f1]/30 h-5 w-5 transition-all"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-[#012970]">Road Access</span>
                                    </label>
                                    <label className="flex items-center group cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="electricityConnection"
                                            checked={formData.electricityConnection}
                                            onChange={handleInputChange}
                                            className="rounded-lg border-gray-300 text-[#4154f1] bg-white focus:ring-[#4154f1]/30 h-5 w-5 transition-all"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-[#012970]">Electricity</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Boundaries */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[#012970] border-l-4 border-[#4154f1] pl-3">Boundaries</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    North
                                </label>
                                <input
                                    type="text"
                                    name="boundaries.north"
                                    value={formData.boundaries.north}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="Road / Survey No. / Owner name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    South
                                </label>
                                <input
                                    type="text"
                                    name="boundaries.south"
                                    value={formData.boundaries.south}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="Road / Survey No. / Owner name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    East
                                </label>
                                <input
                                    type="text"
                                    name="boundaries.east"
                                    value={formData.boundaries.east}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="Road / Survey No. / Owner name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    West
                                </label>
                                <input
                                    type="text"
                                    name="boundaries.west"
                                    value={formData.boundaries.west}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                    placeholder="Road / Survey No. / Owner name"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Property Details (Optional) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#012970] flex items-center border-l-4 border-[#4154f1] pl-3">
                                <Home className="h-5 w-5 mr-2 text-[#4154f1]" />
                                Property on Land (Optional)
                            </h3>
                            <label className="flex items-center group cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="hasProperty"
                                    checked={formData.hasProperty}
                                    onChange={handleInputChange}
                                    className="rounded-lg border-gray-300 text-[#4154f1] bg-white focus:ring-[#4154f1]/30 h-5 w-5 transition-all"
                                />
                                <span className="ml-3 text-sm font-bold text-gray-700 group-hover:text-[#012970]">
                                    Has Building/Structure
                                </span>
                            </label>
                        </div>

                        {formData.hasProperty && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 space-y-6 animate-fadeIn">
                                <p className="text-sm text-gray-600 font-medium">
                                    Provide details about any buildings, houses, or structures on this land.
                                </p>

                                {/* Property Type & Building Type */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Property Type
                                        </label>
                                        <select
                                            name="propertyDetails.propertyType"
                                            value={formData.propertyDetails.propertyType}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all cursor-pointer"
                                        >
                                            <option value="">Select Property Type</option>
                                            <option value="HOUSE">House</option>
                                            <option value="VILLA">Villa</option>
                                            <option value="APARTMENT">Apartment</option>
                                            <option value="FARMHOUSE">Farmhouse</option>
                                            <option value="WAREHOUSE">Warehouse</option>
                                            <option value="FACTORY">Factory</option>
                                            <option value="SHOP">Shop</option>
                                            <option value="OFFICE">Office Building</option>
                                            <option value="MIXED_USE">Mixed Use</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Building Type
                                        </label>
                                        <select
                                            name="propertyDetails.buildingType"
                                            value={formData.propertyDetails.buildingType}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all cursor-pointer"
                                        >
                                            <option value="">Select Building Type</option>
                                            <option value="INDEPENDENT">Independent</option>
                                            <option value="ROW_HOUSE">Row House</option>
                                            <option value="DUPLEX">Duplex</option>
                                            <option value="PENTHOUSE">Penthouse</option>
                                            <option value="STUDIO">Studio</option>
                                            <option value="BUNGALOW">Bungalow</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Construction Year & Floors */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Construction Year
                                        </label>
                                        <input
                                            type="number"
                                            name="propertyDetails.constructionYear"
                                            min="1900"
                                            max={new Date().getFullYear()}
                                            value={formData.propertyDetails.constructionYear}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                            placeholder="2020"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Total Floors
                                        </label>
                                        <input
                                            type="number"
                                            name="propertyDetails.totalFloors"
                                            min="1"
                                            value={formData.propertyDetails.totalFloors}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                            placeholder="2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Built-up Area (Sq Ft)
                                        </label>
                                        <input
                                            type="number"
                                            name="propertyDetails.builtUpArea"
                                            min="0"
                                            value={formData.propertyDetails.builtUpArea}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                            placeholder="1500"
                                        />
                                    </div>
                                </div>

                                {/* Rooms, Bathrooms & Parking */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Number of Rooms
                                        </label>
                                        <input
                                            type="number"
                                            name="propertyDetails.numberOfRooms"
                                            min="0"
                                            value={formData.propertyDetails.numberOfRooms}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                            placeholder="3"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Number of Bathrooms
                                        </label>
                                        <input
                                            type="number"
                                            name="propertyDetails.numberOfBathrooms"
                                            min="0"
                                            value={formData.propertyDetails.numberOfBathrooms}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                            placeholder="2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Parking Spaces
                                        </label>
                                        <input
                                            type="number"
                                            name="propertyDetails.parkingSpaces"
                                            min="0"
                                            value={formData.propertyDetails.parkingSpaces}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all"
                                            placeholder="1"
                                        />
                                    </div>
                                </div>

                                {/* Additional Features */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Additional Features
                                    </label>
                                    <textarea
                                        name="propertyDetails.additionalFeatures"
                                        value={formData.propertyDetails.additionalFeatures}
                                        onChange={(e) => {
                                            const { name, value } = e.target;
                                            const [parent, child] = name.split('.');
                                            setFormData(prev => ({
                                                ...prev,
                                                [parent]: {
                                                    ...(prev as any)[parent],
                                                    [child]: value,
                                                },
                                            }));
                                        }}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 bg-white text-[#012970] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4154f1]/20 focus:border-[#4154f1] transition-all resize-none"
                                        placeholder="e.g., Swimming pool, Garden, Solar panels, Security system, etc."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-4 rounded-xl text-sm font-medium flex items-center">
                            <XCircle className="h-5 w-5 mr-3 text-red-500" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-4 rounded-xl text-sm font-medium flex items-center">
                            <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                            {success}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-8 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-6 py-3 border border-red-200 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-all font-bold text-sm"
                        >
                            Delete Land
                        </button>

                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-[#4154f1] text-white rounded-xl hover:bg-[#3346d8] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-lg shadow-blue-500/20"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Updating...
                                    </div>
                                ) : (
                                    'Update Land'
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
                        <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full shadow-2xl">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                                    <XCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-[#012970] text-center mb-2">Delete Land Record</h3>
                                <p className="text-gray-600 text-center mb-6">
                                    Are you sure you want to delete this land record? This action cannot be undone.
                                </p>
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-red-700 font-medium">
                                        <strong>Asset ID:</strong> {land.assetId}
                                    </p>
                                    <p className="text-sm text-red-700 font-medium mt-1">
                                        <strong>Survey Number:</strong> {land.surveyNumber}
                                    </p>
                                    <p className="text-sm text-red-700 font-medium mt-1">
                                        <strong>Location:</strong> {land.village}, {land.district}
                                    </p>
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={deleting}
                                        className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all font-bold text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="flex-1 px-6 py-3 border border-transparent rounded-xl text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-lg shadow-red-500/20"
                                    >
                                        {deleting ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Deleting...
                                            </div>
                                        ) : (
                                            'Delete Permanently'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Map Modal */}
                {showMap && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                        <div className="bg-white border border-gray-200 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-[#012970]">Select Land Location</h3>
                                <button
                                    onClick={() => setShowMap(false)}
                                    className="text-gray-400 hover:text-[#012970] transition-colors p-1 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-600 mb-6 font-medium">
                                    Click on the map to set the geographic location of the land
                                </p>
                                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-[50vh]">
                                    <MapView
                                        lands={[]}
                                        onLocationSelect={handleLocationSelect}
                                        showLocationPicker={true}
                                        selectedLocation={formData.coordinates}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditLandForm;
