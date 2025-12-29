import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Users, Database, FileText, ShoppingCart, Sparkles } from 'lucide-react';
import { User, Land, BuyRequest } from '../types';
import apiService from '../services/api';
import OCRVerificationModal from './OCRVerificationModal';
import Tesseract from 'tesseract.js';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'users' | 'lands' | 'land-transactions' | 'all-transactions'>('users');
  const [pendingTransactions, setPendingTransactions] = useState<BuyRequest[]>([]);
  const [allTransactions, setAllTransactions] = useState<BuyRequest[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allLands, setAllLands] = useState<Land[]>([]);
  const [landTransactions, setLandTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // OCR Modal state
  const [ocrModal, setOcrModal] = useState<{
    isOpen: boolean;
    documentType: string;
    userProvidedNumber: string;
    documentUrl: string;
  }>({ isOpen: false, documentType: '', userProvidedNumber: '', documentUrl: '' });

  // AI Cross Check state
  const [crossCheckResults, setCrossCheckResults] = useState<{
    [userId: string]: {
      isChecking: boolean;
      results: Array<{ docType: string; matches: boolean; message: string }>;
    };
  }>({});

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      switch (activeTab) {
        case 'transactions':
          const transResponse = await apiService.getPendingTransactions();
          setPendingTransactions(transResponse.transactions);
          break;
        case 'all-transactions':
          try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/transactions', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            const allTransResponse = await response.json();
            setAllTransactions(allTransResponse.transactions || []);
          } catch (err) {
            console.error('Failed to fetch all transactions:', err);
            setAllTransactions([]);
          }
          break;
        case 'users':
          const usersResponse = await apiService.getPendingVerifications();
          setPendingUsers(usersResponse.users);
          break;
        case 'lands':
          const landsResponse = await apiService.getLands({ limit: 100 });
          setAllLands(landsResponse.lands);
          break;
        case 'land-transactions':
          const landTransResponse = await apiService.getPendingLandTransactions();
          setLandTransactions(landTransResponse.transactions);
          break;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransaction = async (transactionId: string) => {
    try {
      setError('');
      setProcessingId(transactionId);
      await apiService.approveTransaction(transactionId);

      // Show success animation
      setSuccessMessage('Transaction Approved Successfully! 🎉');
      setShowSuccessAnimation(true);

      // Hide animation after 3 seconds
      setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 3000);

      await loadData();
    } catch (error: any) {
      setError(error.message || 'Failed to approve transaction');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectTransaction = async (transactionId: string, reason: string) => {
    try {
      setError('');
      setProcessingId(transactionId);
      await apiService.rejectTransaction(transactionId, reason);
      await loadData();
    } catch (error: any) {
      setError(error.message || 'Failed to reject transaction');
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerifyUser = async (userId: string, status: 'VERIFIED' | 'REJECTED', rejectionReason?: string) => {
    try {
      setError('');
      setProcessingId(userId);
      await apiService.verifyUser(userId, {
        status,
        rejectionReason,
        verifiedDocuments: {
          panCard: true,
          aadhaarCard: true,
          drivingLicense: true,
          passport: true
        }
      });
      await loadData();
    } catch (error: any) {
      setError(error.message || 'Failed to verify user');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAICrossCheck = async (user: User) => {
    const userId = user._id;

    // Set checking state
    setCrossCheckResults(prev => ({
      ...prev,
      [userId]: { isChecking: true, results: [] }
    }));

    const results: Array<{ docType: string; matches: boolean; message: string }> = [];

    try {
      // Check PAN Card
      if (user.verificationDocuments?.panCard?.documentUrl && user.verificationDocuments?.panCard?.number) {
        try {
          const { data: { text } } = await Tesseract.recognize(
            user.verificationDocuments.panCard.documentUrl,
            'eng'
          );
          const cleanText = text.replace(/\s/g, '').toUpperCase();
          const cleanNumber = user.verificationDocuments.panCard.number.replace(/\s/g, '').toUpperCase();

          // Try to extract PAN number from text using regex (format: ABCDE1234F)
          const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/g;
          const extractedPANs = cleanText.match(panRegex);
          const extractedPAN = extractedPANs ? extractedPANs[0] : null;

          if (cleanText.includes(cleanNumber)) {
            results.push({ docType: 'PAN Card', matches: true, message: '✅ Number matches document' });
          } else {
            const extractedInfo = extractedPAN ? ` (Found in document: ${extractedPAN})` : '';
            results.push({ docType: 'PAN Card', matches: false, message: `❌ Number does NOT match document${extractedInfo}` });
          }
        } catch (err) {
          results.push({ docType: 'PAN Card', matches: false, message: '⚠️ OCR failed - unclear image' });
        }
      }

      // Check Aadhaar Card
      if (user.verificationDocuments?.aadhaarCard?.documentUrl && user.verificationDocuments?.aadhaarCard?.number) {
        try {
          const { data: { text } } = await Tesseract.recognize(
            user.verificationDocuments.aadhaarCard.documentUrl,
            'eng'
          );
          const cleanText = text.replace(/\s/g, '').toUpperCase();
          const cleanNumber = user.verificationDocuments.aadhaarCard.number.replace(/\s/g, '').toUpperCase();

          // Try to extract Aadhaar number (12 digits)
          const aadhaarRegex = /\d{12}/g;
          const extractedAadhaars = cleanText.match(aadhaarRegex);
          const extractedAadhaar = extractedAadhaars ? extractedAadhaars[0] : null;

          // For Aadhaar, check last 4 digits as it's often masked
          const last4 = cleanNumber.slice(-4);
          if (cleanText.includes(cleanNumber) || cleanText.includes(last4)) {
            results.push({ docType: 'Aadhaar Card', matches: true, message: '✅ Number matches document' });
          } else {
            const extractedInfo = extractedAadhaar ? ` (Found in document: ${extractedAadhaar})` : '';
            results.push({ docType: 'Aadhaar Card', matches: false, message: `❌ Number does NOT match document${extractedInfo}` });
          }
        } catch (err) {
          results.push({ docType: 'Aadhaar Card', matches: false, message: '⚠️ OCR failed - unclear image' });
        }
      }

      // Check Driving License
      if (user.verificationDocuments?.drivingLicense?.documentUrl && user.verificationDocuments?.drivingLicense?.number) {
        try {
          const { data: { text } } = await Tesseract.recognize(
            user.verificationDocuments.drivingLicense.documentUrl,
            'eng'
          );
          const cleanText = text.replace(/\s/g, '').toUpperCase();
          const cleanNumber = user.verificationDocuments.drivingLicense.number.replace(/\s/g, '').toUpperCase();

          // Try to extract DL number (format varies, look for alphanumeric sequences)
          const dlRegex = /[A-Z]{2}[0-9]{13,14}|[A-Z]{2}[-]?[0-9]{13,14}/g;
          const extractedDLs = cleanText.match(dlRegex);
          const extractedDL = extractedDLs ? extractedDLs[0] : null;

          if (cleanText.includes(cleanNumber)) {
            results.push({ docType: 'Driving License', matches: true, message: '✅ Number matches document' });
          } else {
            const extractedInfo = extractedDL ? ` (Found in document: ${extractedDL})` : '';
            results.push({ docType: 'Driving License', matches: false, message: `❌ Number does NOT match document${extractedInfo}` });
          }
        } catch (err) {
          results.push({ docType: 'Driving License', matches: false, message: '⚠️ OCR failed - unclear image' });
        }
      }

      // Check Passport
      if (user.verificationDocuments?.passport?.documentUrl && user.verificationDocuments?.passport?.number) {
        try {
          const { data: { text } } = await Tesseract.recognize(
            user.verificationDocuments.passport.documentUrl,
            'eng'
          );
          const cleanText = text.replace(/\s/g, '').toUpperCase();
          const cleanNumber = user.verificationDocuments.passport.number.replace(/\s/g, '').toUpperCase();

          // Try to extract Passport number (format: A1234567 or similar)
          const passportRegex = /[A-Z][0-9]{7,8}/g;
          const extractedPassports = cleanText.match(passportRegex);
          const extractedPassport = extractedPassports ? extractedPassports[0] : null;

          if (cleanText.includes(cleanNumber)) {
            results.push({ docType: 'Passport', matches: true, message: '✅ Number matches document' });
          } else {
            const extractedInfo = extractedPassport ? ` (Found in document: ${extractedPassport})` : '';
            results.push({ docType: 'Passport', matches: false, message: `❌ Number does NOT match document${extractedInfo}` });
          }
        } catch (err) {
          results.push({ docType: 'Passport', matches: false, message: '⚠️ OCR failed - unclear image' });
        }
      }

      // Update results
      setCrossCheckResults(prev => ({
        ...prev,
        [userId]: { isChecking: false, results }
      }));
    } catch (error: any) {
      setCrossCheckResults(prev => ({
        ...prev,
        [userId]: {
          isChecking: false,
          results: [{ docType: 'Error', matches: false, message: '❌ Cross-check failed: ' + error.message }]
        }
      }));
    }
  };

  const handleReviewLandTransaction = async (transactionId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    try {
      setError('');
      setProcessingId(transactionId);
      await apiService.reviewLandTransaction(transactionId, {
        action,
        rejectionReason,
        comments: action === 'approve' ? 'Transaction approved by admin' : 'Transaction rejected'
      });
      await loadData();
    } catch (error: any) {
      setError(error.message || 'Failed to review transaction');
    } finally {
      setProcessingId(null);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const renderUsers = () => (
    <div className="space-y-4">
      {pendingUsers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-slate-500" />
          <div className="text-slate-300 text-lg mt-4">No pending user verifications</div>
          <p className="text-slate-400 mt-2">All users have been processed.</p>
        </div>
      ) : (
        pendingUsers.map((user) => (
          <div key={user._id} className="bg-slate-900/60 rounded-lg shadow-lg border border-slate-800 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">{user.fullName}</h3>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PENDING VERIFICATION
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300 mb-4">
                  <div>
                    <span className="font-medium text-white">Email:</span> {user.email}
                  </div>
                  <div>
                    <span className="font-medium text-white">Wallet:</span> {user.walletAddress?.substring(0, 10)}...
                  </div>
                </div>

                <div className="bg-slate-800/40 rounded-md p-4 mb-4 border border-slate-700/50">
                  <h4 className="font-medium text-white mb-3">Submitted Verification Documents:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {user.verificationDocuments?.panCard && (
                      <div className="bg-slate-800/60 rounded p-3 border border-slate-700">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 text-emerald-400 mr-2" />
                          <span className="font-medium text-white">PAN Card</span>
                        </div>
                        <div className="text-slate-300">Number: {user.verificationDocuments.panCard.number}</div>
                        {user.verificationDocuments.panCard.documentUrl && (
                          <div className="mt-2">
                            <a
                              href={user.verificationDocuments.panCard.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center transition-colors"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {user.verificationDocuments?.aadhaarCard && (
                      <div className="bg-slate-800/60 rounded p-3 border border-slate-700">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 text-emerald-400 mr-2" />
                          <span className="font-medium text-white">Aadhaar Card</span>
                        </div>
                        <div className="text-slate-300">Number: {user.verificationDocuments.aadhaarCard.number}</div>
                        {user.verificationDocuments.aadhaarCard.documentUrl && (
                          <div className="mt-2">
                            <a
                              href={user.verificationDocuments.aadhaarCard.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center transition-colors"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {user.verificationDocuments?.drivingLicense && (
                      <div className="bg-slate-800/60 rounded p-3 border border-slate-700">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 text-emerald-400 mr-2" />
                          <span className="font-medium text-white">Driving License</span>
                        </div>
                        <div className="text-slate-300">Number: {user.verificationDocuments.drivingLicense.number}</div>
                        {user.verificationDocuments.drivingLicense.documentUrl && (
                          <div className="mt-2">
                            <a
                              href={user.verificationDocuments.drivingLicense.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center transition-colors"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {user.verificationDocuments?.passport && (
                      <div className="bg-slate-800/60 rounded p-3 border border-slate-700">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 text-emerald-400 mr-2" />
                          <span className="font-medium text-white">Passport</span>
                        </div>
                        <div className="text-slate-300">Number: {user.verificationDocuments.passport.number}</div>
                        {user.verificationDocuments.passport.documentUrl && (
                          <div className="mt-2">
                            <a
                              href={user.verificationDocuments.passport.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center transition-colors"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleVerifyUser(user._id, 'VERIFIED')}
                  disabled={processingId === user._id}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-emerald-500/40"
                >
                  {processingId === user._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950 mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Verify
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Please provide a reason for rejection:');
                    if (reason) {
                      handleVerifyUser(user._id, 'REJECTED', reason);
                    }
                  }}
                  disabled={processingId === user._id}
                  className="inline-flex items-center px-4 py-2 border border-slate-700 rounded-md text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleAICrossCheck(user)}
                  disabled={crossCheckResults[user._id]?.isChecking}
                  className="inline-flex items-center px-4 py-2 border border-purple-700 rounded-md text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {crossCheckResults[user._id]?.isChecking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Cross Check
                    </>
                  )}
                </button>
              </div>

              {/* Display Cross Check Results */}
              {crossCheckResults[user._id]?.results && crossCheckResults[user._id].results.length > 0 && (
                <div className="mt-4 ml-4 bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-sm font-medium text-white mb-2">AI Cross Check Results:</h4>
                  <div className="space-y-2">
                    {crossCheckResults[user._id].results.map((result, idx) => (
                      <div key={idx} className={`text-sm flex items-start ${result.matches ? 'text-emerald-300' : 'text-red-300'}`}>
                        <span className="font-medium mr-2">{result.docType}:</span>
                        <span>{result.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderAllTransactions = () => (
    <div className="space-y-4">
      {allTransactions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-slate-500" />
          <div className="text-slate-300 text-lg mt-4">No transactions found</div>
          <p className="text-slate-400 mt-2">Transaction history will appear here.</p>
        </div>
      ) : (
        allTransactions.map((transaction) => {
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'APPROVED':
              case 'COMPLETED':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
              case 'REJECTED':
              case 'CANCELLED':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
              case 'PENDING_ADMIN_APPROVAL':
                return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
              default:
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
            }
          };

          return (
            <div key={transaction._id} className="bg-slate-900/60 rounded-lg shadow-lg border border-slate-800 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="h-6 w-6 text-blue-400" />
                    <h3 className="text-xl font-bold text-white">
                      Transaction #{transaction._id.slice(-6)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${getStatusColor(transaction.status)}`}>
                      {transaction.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-slate-400 text-xs uppercase mb-1">Land Asset ID</div>
                      <div className="text-white font-semibold">{transaction.landId?.assetId || 'N/A'}</div>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-slate-400 text-xs uppercase mb-1">Agreed Price</div>
                      <div className="text-emerald-400 font-bold text-lg">{formatPrice(transaction.agreedPrice)}</div>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-slate-400 text-xs uppercase mb-1">Seller</div>
                      <div className="text-white font-semibold">{transaction.seller?.fullName || 'N/A'}</div>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-slate-400 text-xs uppercase mb-1">Buyer</div>
                      <div className="text-white font-semibold">{transaction.buyer?.fullName || 'N/A'}</div>
                    </div>
                  </div>

                  {transaction.adminReview && transaction.adminReview.reviewedAt && (
                    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-slate-400 text-xs uppercase mb-2">Admin Review</div>
                      <div className="text-sm text-slate-300">
                        <div>Reviewed: {new Date(transaction.adminReview.reviewedAt).toLocaleString()}</div>
                        {transaction.adminReview.comments && (
                          <div className="mt-1">Comments: {transaction.adminReview.comments}</div>
                        )}
                        {transaction.adminReview.rejectionReason && (
                          <div className="mt-1 text-red-300">Reason: {transaction.adminReview.rejectionReason}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      {pendingTransactions.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-slate-500" />
          <div className="text-slate-300 text-lg mt-4">No pending buy requests</div>
          <p className="text-slate-400 mt-2">All buy requests have been processed.</p>
        </div>
      ) : (
        pendingTransactions.map((transaction) => (
          <div key={transaction._id} className="bg-slate-900/60 rounded-lg shadow-lg border border-slate-800 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-6">
                  <ShoppingCart className="h-6 w-6 text-emerald-400" />
                  <h3 className="text-xl font-bold text-white">
                    Land Transfer Request
                  </h3>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Pending Approval
                  </span>
                </div>

                {/* Land Details Card */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 rounded-lg p-4 border border-slate-700/50 mb-4">
                  <div className="flex items-center mb-3">
                    <Database className="h-5 w-5 text-blue-400 mr-2" />
                    <h4 className="font-bold text-white text-lg">Property Details</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-900/40 rounded p-2 border border-slate-700/30">
                      <span className="text-slate-400 text-xs uppercase">Asset ID</span>
                      <div className="text-white font-semibold">{transaction.landId?.assetId || 'N/A'}</div>
                    </div>
                    <div className="bg-slate-900/40 rounded p-2 border border-slate-700/30">
                      <span className="text-slate-400 text-xs uppercase">Survey Number</span>
                      <div className="text-white font-semibold">{transaction.landId?.surveyNumber || 'N/A'}</div>
                    </div>
                    <div className="bg-slate-900/40 rounded p-2 border border-slate-700/30">
                      <span className="text-slate-400 text-xs uppercase">Location</span>
                      <div className="text-white font-semibold">{transaction.landId?.village || 'N/A'}, {transaction.landId?.district || 'N/A'}</div>
                    </div>
                    <div className="bg-slate-900/40 rounded p-2 border border-slate-700/30">
                      <span className="text-slate-400 text-xs uppercase">Type & Area</span>
                      <div className="text-white font-semibold">{transaction.landId?.landType || 'N/A'} - {transaction.landId?.area?.acres || 0} Acres</div>
                    </div>
                  </div>
                </div>

                {/* Transfer Details - From and To Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* FROM Box - Seller */}
                  <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-lg p-4 border-2 border-red-500/30">
                    <div className="flex items-center mb-3">
                      <div className="bg-red-500/20 rounded-full p-2 mr-3">
                        <Users className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <div className="text-red-300 text-xs font-bold uppercase tracking-wide">From (Seller)</div>
                        <div className="text-white font-bold text-lg">{transaction.seller?.fullName || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-slate-300">
                        <span className="text-slate-400 mr-2">📧</span>
                        {transaction.seller?.email || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                          Current Owner
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TO Box - Buyer */}
                  <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-lg p-4 border-2 border-emerald-500/30">
                    <div className="flex items-center mb-3">
                      <div className="bg-emerald-500/20 rounded-full p-2 mr-3">
                        <Users className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-emerald-300 text-xs font-bold uppercase tracking-wide">To (Buyer)</div>
                        <div className="text-white font-bold text-lg">{transaction.buyer?.fullName || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-slate-300">
                        <span className="text-slate-400 mr-2">📧</span>
                        {transaction.buyer?.email || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Prospective Owner
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Info */}
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400 text-xs uppercase">Agreed Price</span>
                      <div className="text-emerald-400 font-bold text-xl">{formatPrice(transaction.agreedPrice)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase">Request Date</span>
                      <div className="text-white font-semibold">{new Date(transaction.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 ml-6">
                <button
                  onClick={() => handleApproveTransaction(transaction._id)}
                  disabled={processingId === transaction._id}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60"
                >
                  {processingId === transaction._id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-950 mr-2"></div>
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Please provide a reason for rejection:');
                    if (reason) {
                      handleRejectTransaction(transaction._id, reason);
                    }
                  }}
                  disabled={processingId === transaction._id}
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-red-500/50 rounded-lg text-sm font-bold text-red-300 bg-red-900/20 hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderLands = () => (
    <div className="space-y-4">
      {allLands.length === 0 ? (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-slate-500" />
          <div className="text-slate-300 text-lg mt-4">No lands registered</div>
          <p className="text-slate-400 mt-2">No lands have been added to the database yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allLands.map((land) => (
            <div key={land._id} className="bg-slate-900/60 rounded-lg shadow-lg border border-slate-800 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Asset ID: {land.assetId}
                  </h3>
                  <p className="text-sm text-slate-400">Survey: {land.surveyNumber}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${land.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    land.status === 'FOR_SALE' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                      'bg-slate-700/50 text-slate-300 border border-slate-600'
                    }`}>
                    {land.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${land.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    land.verificationStatus === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                    {land.verificationStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <div><span className="font-medium text-white">Location:</span> {land.village}, {land.district}</div>
                <div><span className="font-medium text-white">Type:</span> {land.landType}</div>
                <div><span className="font-medium text-white">Area:</span> {land.area.acres || 0} Acres</div>
                {land.currentOwner && (
                  <div><span className="font-medium text-white">Owner:</span> {land.currentOwner.fullName}</div>
                )}
                <div><span className="font-medium text-white">Digitalized:</span> {land.digitalDocument?.isDigitalized ? 'Yes' : 'No'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLandTransactions = () => (
    <div className="space-y-4">
      {landTransactions.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-slate-500" />
          <div className="text-slate-300 text-lg mt-4">No pending land transactions</div>
          <p className="text-slate-400 mt-2">All land transactions have been processed.</p>
        </div>
      ) : (
        landTransactions.map((transaction) => (
          <div key={transaction._id} className="bg-slate-900/60 rounded-lg shadow-lg border border-slate-800 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <ShoppingCart className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Land Sale Transaction
                  </h3>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {transaction.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300 mb-4">
                  <div>
                    <span className="font-medium text-white">Asset ID:</span> {transaction.landId.assetId}
                  </div>
                  <div>
                    <span className="font-medium text-white">Location:</span> {transaction.landId.village}, {transaction.landId.district}
                  </div>
                  <div>
                    <span className="font-medium text-white">Seller:</span> {transaction.seller.fullName}
                  </div>
                  <div>
                    <span className="font-medium text-white">Buyer:</span> {transaction.buyer.fullName}
                  </div>
                  <div>
                    <span className="font-medium text-white">Agreed Price:</span> {formatPrice(transaction.agreedPrice)}
                  </div>
                  <div>
                    <span className="font-medium text-white">Date:</span> {new Date(transaction.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleReviewLandTransaction(transaction._id, 'approve')}
                  disabled={processingId === transaction._id}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-emerald-500/40"
                >
                  {processingId === transaction._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950 mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </button>

                <button
                  onClick={() => {
                    const reason = prompt('Please provide a reason for rejection:');
                    if (reason) {
                      handleReviewLandTransaction(transaction._id, 'reject', reason);
                    }
                  }}
                  disabled={processingId === transaction._id}
                  className="inline-flex items-center px-4 py-2 border border-slate-700 rounded-md text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage users, transactions, and land registry
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            User Verifications
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'transactions'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            Buy Requests
          </button>
          <button
            onClick={() => setActiveTab('all-transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all-transactions'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            All Transactions
          </button>
          <button
            onClick={() => setActiveTab('land-transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'land-transactions'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
          >
            <ShoppingCart className="inline h-4 w-4 mr-2" />
            Land Transactions
          </button>
          <button
            onClick={() => setActiveTab('lands')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'lands'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
          >
            <Database className="inline h-4 w-4 mr-2" />
            All Lands
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'all-transactions' && renderAllTransactions()}
          {activeTab === 'lands' && renderLands()}
          {activeTab === 'land-transactions' && renderLandTransactions()}
        </>
      )}

      {/* Success Animation Modal */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-emerald-900/90 to-emerald-800/90 rounded-2xl p-8 shadow-2xl border-2 border-emerald-500/50 animate-bounce-in">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-emerald-500/20 rounded-full p-4 animate-pulse">
                  <CheckCircle className="h-16 w-16 text-emerald-400" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{successMessage}</h2>
              <p className="text-emerald-300 text-lg">The ownership has been transferred successfully.</p>
            </div>
          </div>
        </div>
      )}

      {/* OCR Verification Modal */}
      <OCRVerificationModal
        isOpen={ocrModal.isOpen}
        onClose={() => setOcrModal({ ...ocrModal, isOpen: false })}
        documentType={ocrModal.documentType}
        userProvidedNumber={ocrModal.userProvidedNumber}
        documentUrl={ocrModal.documentUrl}
      />
    </div>
  );
};

export default AdminPanel;