import React from "react";
import { Land } from "../types";

interface LandDetailsModalProps {
  land: Land | any;
  onClose: () => void;
}

export default function LandDetailsModal({ land, onClose }: LandDetailsModalProps) {
  if (!land) return null;
  const mi = land.marketInfo || {};

  // Helper for area display
  const formatArea = (area: any) => {
    if (typeof area === "object" && area !== null) {
      return `${area.acres || 0} Acres, ${area.guntas || 0} Guntas`;
    }
    return area || "N/A";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Land Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
        <p>
          <strong>Survey Number:</strong> {land.surveyNumber}
        </p>
        <p>
          <strong>Village:</strong> {land.village}
        </p>
        <p>
          <strong>District:</strong> {land.district}
        </p>
        <p>
          <strong>Area:</strong> {formatArea(land.area)}
        </p>
        <p>
          <strong>Asset ID:</strong> {land.assetId}
        </p>
        <p>
          <strong>Type:</strong> {land.landType}
        </p>
        <p>
          <strong>Status:</strong> {land.status}
        </p>
        <p>
          <strong>Verification Status:</strong> {land.verificationStatus}
        </p>
        {mi && (
          <div className="mt-3">
            <p>
              <strong>Asking Price:</strong> {mi.askingPrice ?? "N/A"}
            </p>
            <p>
              <strong>Description:</strong> {mi.description ?? "No description"}
            </p>
            <div>
              <strong>Features:</strong>
              {mi.features?.length > 0 ? (
                <span className="ml-2">{mi.features.join(", ")}</span>
              ) : (
                <span className="ml-2 text-gray-500">None</span>
              )}
            </div>
            <div>
              <strong>Nearby Amenities:</strong>
              {mi.nearbyAmenities?.length > 0 ? (
                <span className="ml-2">{mi.nearbyAmenities.join(", ")}</span>
              ) : (
                <span className="ml-2 text-gray-500">None</span>
              )}
            </div>
            <div className="mt-3">
              <strong>Images:</strong>
              {mi.images?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {mi.images.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Land ${i}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ))}
                </div>
              ) : (
                <span className="ml-2 text-gray-500">None</span>
              )}
            </div>
          </div>
        )}
        {/* Ownership History */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ownership History
          </h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {land.ownershipHistory && land.ownershipHistory.length > 0 ? (
                  land.ownershipHistory.map((record: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                        {record.ownerName || record.owner?.fullName || "NIL"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {record.fromDate ? new Date(record.fromDate).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {record.toDate 
                          ? new Date(record.toDate).toLocaleDateString('en-IN') 
                          : (idx < (land.ownershipHistory?.length || 0) - 1
                              ? new Date(land.ownershipHistory[idx + 1].fromDate).toLocaleDateString('en-IN')
                              : 'Present'
                            )
                        }
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          record.transactionType === 'SALE' ? 'bg-emerald-100 text-emerald-700' : 
                          record.transactionType === 'INITIAL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {record.transactionType || 'TRANSFER'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-sm text-center text-gray-500 italic">
                      No historical records available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
