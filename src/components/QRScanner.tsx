import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, MapPin, User, Shield, Home } from 'lucide-react';
import jsQR from 'jsqr';
import apiService from '../services/api';

interface QRScannerProps {
  onClose: () => void;
}

interface LandData {
  assetId: string;
  surveyNumber: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  landType: string;
  area: {
    acres?: number;
    guntas?: number;
    sqft?: number;
  };
  currentOwner?: {
    fullName: string;
    email: string;
    verificationStatus: string;
  };
  verificationStatus: string;
  status: string;
  digitalDocument?: {
    isDigitalized: boolean;
  };
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [landData, setLandData] = useState<LandData | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const startScanning = async () => {
    try {
      setScanning(true);
      setError('');
      setLandData(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start scanning for QR codes
        scanIntervalRef.current = window.setInterval(scanQRCode, 500);
      }
    } catch (error) {
      setError('Camera access denied. Please allow camera access to scan QR codes.');
      setScanning(false);
    }
  };

  const scanQRCode = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        
        if (code && code.data) {
          handleQRCodeDetected(code.data);
        }
      }
    }
  };

  const handleQRCodeDetected = async (data: string) => {
    // Stop scanning
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    stopScanning();
    
    setLoading(true);
    setError('');
    
    try {
      // Try to parse QR data
      let assetId = data;
      try {
        const parsed = JSON.parse(data);
        assetId = parsed.assetId || parsed.landId || data;
      } catch {
        // If not JSON, use as-is
      }
      
      // Verify with backend
      const response = await apiService.searchLand(assetId);
      if (response.land) {
        setLandData(response.land);
      } else {
        setError('Land not found. Please check the QR code and try again.');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to verify QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  const handleManualInput = async () => {
    const input = prompt('Enter Asset ID manually:');
    if (input && input.trim()) {
      setLoading(true);
      setError('');
      try {
        const response = await apiService.searchLand(input.trim());
        if (response.land) {
          setLandData(response.land);
        } else {
          setError('Land not found. Please check the Asset ID and try again.');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to verify Asset ID. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const formatArea = (area: any) => {
    const { acres, guntas, sqft } = area || {};
    let areaStr = '';
    if (acres && acres > 0) areaStr += `${acres} acres`;
    if (guntas && guntas > 0) areaStr += ` ${guntas} guntas`;
    if (sqft && sqft > 0) areaStr += ` ${sqft} sqft`;
    return areaStr || 'Area not specified';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-[#012970]">QR Code Verification</h2>
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-[#012970]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center shadow-sm">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4154f1]"></div>
            </div>
          )}

          {landData && !loading && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center shadow-sm">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 text-emerald-600" />
                <span className="font-semibold">Verified Successfully!</span>
              </div>

              {/* Land Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-[#012970] mb-4">Land Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Asset ID</label>
                    <p className="text-[#012970] mt-1 font-mono font-medium">{landData.assetId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Survey Number</label>
                    <p className="text-[#012970] mt-1 font-medium">{landData.surveyNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Land Type</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Home className="h-4 w-4 text-[#4154f1]" />
                      <p className="text-[#012970] font-medium">{landData.landType}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Area</label>
                    <p className="text-[#012970] mt-1 font-medium">{formatArea(landData.area)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-[#012970] mt-1 font-medium">{landData.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Verification</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                      landData.verificationStatus === 'VERIFIED' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}>
                      {landData.verificationStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-[#012970] mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#4154f1]" />
                  Location
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">{landData.village}</p>
                  <p className="text-gray-700">{landData.taluka}, {landData.district}</p>
                  <p className="text-gray-700">{landData.state}</p>
                </div>
              </div>

              {/* Owner Information */}
              {landData.currentOwner && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold text-[#012970] mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#4154f1]" />
                    Current Owner
                  </h3>
                  <div className="space-y-2">
                    <p className="text-[#012970] font-medium">{landData.currentOwner.fullName}</p>
                    <p className="text-gray-600 text-sm">{landData.currentOwner.email}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-600 font-medium">
                        {landData.currentOwner.verificationStatus === 'VERIFIED' ? 'Verified Owner' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setLandData(null);
                  setError('');
                }}
                className="w-full px-4 py-3 bg-[#4154f1] text-white rounded-xl hover:bg-[#3346d8] font-semibold shadow-md shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
              >
                Scan Another QR Code
              </button>
            </div>
          )}

          {!scanning && !landData && !loading && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Camera className="h-10 w-10 text-[#4154f1]" />
                </div>
                <h3 className="text-lg font-semibold text-[#012970] mb-2">Scan Document</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                  Scan the QR code on the digitized land certificate to instantly verify ownership and land details.
                </p>
                <button
                  onClick={startScanning}
                  className="w-full bg-[#4154f1] text-white py-3.5 px-4 rounded-xl hover:bg-[#3346d8] font-semibold shadow-md shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                >
                  Start Camera
                </button>
              </div>
              
              <div className="text-center pb-4">
                <p className="text-sm text-gray-400 mb-3">Or verify manually</p>
                <button
                  onClick={handleManualInput}
                  className="text-[#4154f1] hover:text-[#3346d8] text-sm font-semibold transition-colors hover:underline"
                >
                  Enter Asset ID manually
                </button>
              </div>
            </div>
          )}

          {scanning && !landData && (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-xl shadow-lg border-2 border-[#4154f1]/20">
                <video
                  ref={videoRef}
                  className="w-full h-80 bg-gray-900 object-cover"
                  autoPlay
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="relative w-64 h-64">
                    <div className="absolute inset-0 border-2 border-[#4154f1] rounded-lg"></div>
                    <div className="absolute inset-0 border-2 border-white/50 rounded-lg animate-ping"></div>
                    
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                    
                    {/* Scanning line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#4154f1] shadow-[0_0_8px_#4154f1] animate-[scan_2s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium mb-4">
                  Position the QR code within the frame to scan
                </p>
                <button
                  onClick={stopScanning}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-200 shadow-sm"
                >
                  Cancel Scanning
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;