import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Users, Database, FileText, ShoppingCart, Sparkles, Cpu } from 'lucide-react';
import BlockchainDashboard from './BlockchainDashboard';
import { User, Land, BuyRequest } from '../types';
import apiService from '../services/api';
import OCRVerificationModal from './OCRVerificationModal';
import Tesseract from 'tesseract.js';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'users' | 'lands' | 'all-transactions' | 'blockchain'>('users');
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
      results: Array<{ docType: string; matches: boolean; message: string; extractedText?: string }>;
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

    const results: Array<{ docType: string; matches: boolean; message: string; extractedText?: string }> = [];

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
            results.push({ docType: 'PAN Card', matches: true, message: '✅ Number matches document', extractedText: text });
          } else {
            const extractedInfo = extractedPAN ? ` (Found in document: ${extractedPAN})` : '';
            results.push({ docType: 'PAN Card', matches: false, message: `❌ Number does NOT match document${extractedInfo}`, extractedText: text });
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
            results.push({ docType: 'Aadhaar Card', matches: true, message: '✅ Number matches document', extractedText: text });
          } else {
            const extractedInfo = extractedAadhaar ? ` (Found in document: ${extractedAadhaar})` : '';
            results.push({ docType: 'Aadhaar Card', matches: false, message: `❌ Number does NOT match document${extractedInfo}`, extractedText: text });
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
            results.push({ docType: 'Driving License', matches: true, message: '✅ Number matches document', extractedText: text });
          } else {
            const extractedInfo = extractedDL ? ` (Found in document: ${extractedDL})` : '';
            results.push({ docType: 'Driving License', matches: false, message: `❌ Number does NOT match document${extractedInfo}`, extractedText: text });
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
            results.push({ docType: 'Passport', matches: true, message: '✅ Number matches document', extractedText: text });
          } else {
            const extractedInfo = extractedPassport ? ` (Found in document: ${extractedPassport})` : '';
            results.push({ docType: 'Passport', matches: false, message: `❌ Number does NOT match document${extractedInfo}`, extractedText: text });
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
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <div className="text-[#012970] text-lg font-bold mt-4">No pending user verifications</div>
          <p className="text-gray-500 mt-2">All users have been processed.</p>
        </div>
      ) : (
        pendingUsers.map((user) => (
          <div key={user._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="h-5 w-5 text-[#4154f1]" />
                  <h3 className="text-lg font-semibold text-[#012970]">{user.fullName}</h3>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                    PENDING VERIFICATION
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium text-[#012970]">Email:</span> {user.email}
                  </div>
                  <div>
                    <span className="font-medium text-[#012970]">Wallet:</span> {user.walletAddress?.substring(0, 10)}...
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                  <h4 className="font-medium text-[#012970] mb-3">Submitted Verification Documents:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {user.verificationDocuments?.panCard && (
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 text-[#4154f1] mr-2" />
                          <span className="font-medium text-[#012970]">PAN Card</span>
                        </div>
                        <div className="text-gray-600">Number: {user.verificationDocuments.panCard.number}</div>
                        {user.verificationDocuments.panCard.documentUrl && (
                          <div className="mt-2">
                            <a
                              href={user.verificationDocuments.panCard.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4154f1] hover:underline text-xs flex items-center transition-colors"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {user.verificationDocuments?.aadhaarCard && (
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 text-[#4154f1] mr-2" />
                          <span className="font-medium text-[#012970]">Aadhaar Card</span>
                        </div>
                        <div className="text-gray-600">Number: {user.verificationDocuments.aadhaarCard.number}</div>
                        {user.verificationDocuments.aadhaarCard.documentUrl && (
                          <div className="mt-2">
                            <a
                              href={user.verificationDocuments.aadhaarCard.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4154f1] hover:underline text-xs flex items-center transition-colors"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {user.verificationDocuments?.drivingLicense && (
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 text-[#4154f1] mr-2" />
                          <span className="font-medium text-[#012970]">Driving License</span>
                        </div>
                        <div className="text-gray-600">Number: {user.verificationDocuments.drivingLicense.number}</div>
                        {user.verificationDocuments.drivingLicense.documentUrl && (
                          <div className="mt-2">
                            <a
                              href={user.verificationDocuments.drivingLicense.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4154f1] hover:underline text-xs flex items-center transition-colors"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {user.verificationDocuments?.passport && (
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 text-[#4154f1] mr-2" />
                          <span className="font-medium text-[#012970]">Passport</span>
                        </div>
                        <div className="text-gray-600">Number: {user.verificationDocuments.passport.number}</div>
                        {user.verificationDocuments.passport.documentUrl && (
                          <div className="mt-2">
                            <a
                              href={user.verificationDocuments.passport.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4154f1] hover:underline text-xs flex items-center transition-colors"
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
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-green-500/20"
                >
                  {processingId === user._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-red-200 rounded-xl text-sm font-bold text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleAICrossCheck(user)}
                  disabled={crossCheckResults[user._id]?.isChecking}
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl text-sm font-bold text-white bg-[#012970] hover:bg-[#012970]/90 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/20"
                >
                  {crossCheckResults[user._id]?.isChecking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Audit
                    </>
                  )}
                </button>
              </div>
            </div>

            {crossCheckResults[user._id]?.results && crossCheckResults[user._id].results.length > 0 && (
              <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h4 className="text-sm font-bold text-[#012970] mb-4 uppercase tracking-wider">Automated Audit Summary:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {crossCheckResults[user._id].results.map((res, idx) => (
                    <div key={idx} className="flex flex-col space-y-2">
                      <div className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center ${res.matches ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        {res.matches ? (
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2 text-red-500" />
                        )}
                        <span className="opacity-70 mr-2">{res.docType}:</span>
                        {res.message}
                      </div>

                      {!res.matches && res.extractedText && (
                        <details className="px-2">
                          <summary className="text-xs font-bold text-gray-400 cursor-pointer hover:text-[#012970] transition-colors ml-1 mb-1">
                            View AI Reading
                          </summary>
                          <div className="bg-white p-3 rounded-lg border border-gray-100 text-[10px] font-mono text-gray-500 max-h-32 overflow-y-auto shadow-inner">
                            {res.extractedText}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderAllTransactions = () => (
    <div className="space-y-4">
      {allTransactions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <div className="text-[#012970] text-lg font-bold mt-4">No transactions found</div>
          <p className="text-gray-500 mt-2">Transaction history will appear here.</p>
        </div>
      ) : (
        allTransactions.map((transaction) => {
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'APPROVED':
              case 'COMPLETED':
                return 'bg-green-50 text-green-700 border-green-100';
              case 'REJECTED':
              case 'CANCELLED':
                return 'bg-red-50 text-red-700 border-red-100';
              case 'PENDING_ADMIN_APPROVAL':
                return 'bg-orange-50 text-orange-700 border-orange-100';
              default:
                return 'bg-gray-50 text-gray-700 border-gray-100';
            }
          };

          return (
            <div key={transaction._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="h-6 w-6 text-[#4154f1]" />
                    <h3 className="text-xl font-bold text-[#012970]">
                      Transaction #{transaction._id.slice(-6)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${getStatusColor(transaction.status)}`}>
                      {transaction.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Land Asset ID</div>
                      <div className="text-[#012970] font-bold">{transaction.landId?.assetId || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Agreed Price</div>
                      <div className="text-[#4154f1] font-bold text-lg">{formatPrice(transaction.agreedPrice)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Seller</div>
                      <div className="text-[#012970] font-bold">{transaction.seller?.fullName || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Buyer</div>
                      <div className="text-[#012970] font-bold">{transaction.buyer?.fullName || 'N/A'}</div>
                    </div>
                  </div>

                  {transaction.adminReview && transaction.adminReview.reviewedAt && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="text-gray-500 text-xs uppercase font-semibold mb-2">Admin Review</div>
                      <div className="text-sm text-gray-600">
                        <div><span className="font-bold">Reviewed:</span> {new Date(transaction.adminReview.reviewedAt).toLocaleString()}</div>
                        {transaction.adminReview.comments && (
                          <div className="mt-1"><span className="font-bold">Comments:</span> {transaction.adminReview.comments}</div>
                        )}
                        {transaction.adminReview.rejectionReason && (
                          <div className="mt-1 text-red-600 font-bold">Reason: {transaction.adminReview.rejectionReason}</div>
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
          <div key={transaction._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-6">
                  <ShoppingCart className="h-6 w-6 text-[#4154f1]" />
                  <h3 className="text-xl font-bold text-[#012970]">
                    Land Transfer Request
                  </h3>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100 uppercase">
                    Pending Approval
                  </span>
                </div>

                {/* Land Details Card */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
                  <div className="flex items-center mb-3">
                    <Database className="h-5 w-5 text-[#4154f1] mr-2" />
                    <h4 className="font-bold text-[#012970] text-lg">Property Details</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded p-3 border border-gray-200">
                      <span className="text-gray-500 text-xs uppercase font-semibold">Asset ID</span>
                      <div className="text-[#012970] font-bold">{transaction.landId?.assetId || 'N/A'}</div>
                    </div>
                    <div className="bg-white rounded p-3 border border-gray-200">
                      <span className="text-gray-500 text-xs uppercase font-semibold">Survey Number</span>
                      <div className="text-[#012970] font-bold">{transaction.landId?.surveyNumber || 'N/A'}</div>
                    </div>
                    <div className="bg-white rounded p-3 border border-gray-200">
                      <span className="text-gray-500 text-xs uppercase font-semibold">Location</span>
                      <div className="text-[#012970] font-bold">{transaction.landId?.village || 'N/A'}, {transaction.landId?.district || 'N/A'}</div>
                    </div>
                    <div className="bg-white rounded p-3 border border-gray-200">
                      <span className="text-gray-500 text-xs uppercase font-semibold">Type & Area</span>
                      <div className="text-[#012970] font-bold">{transaction.landId?.landType || 'N/A'} - {transaction.landId?.area?.acres || 0} Acres</div>
                    </div>
                  </div>
                </div>

                {/* Transfer Details - From and To Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* FROM Box - Seller */}
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center mb-3">
                      <div className="bg-white rounded-full p-2 mr-3 shadow-sm">
                        <Users className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="text-red-700 text-xs font-bold uppercase tracking-wide">From (Seller)</div>
                        <div className="text-[#012970] font-bold text-lg">{transaction.seller?.fullName || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="mr-2">📧</span>
                        {transaction.seller?.email || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-white text-red-700 border border-red-200">
                          Current Owner
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TO Box - Buyer */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center mb-3">
                      <div className="bg-white rounded-full p-2 mr-3 shadow-sm">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-green-700 text-xs font-bold uppercase tracking-wide">To (Buyer)</div>
                        <div className="text-[#012970] font-bold text-lg">{transaction.buyer?.fullName || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="mr-2">📧</span>
                        {transaction.buyer?.email || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-white text-green-700 border border-green-200">
                          Prospective Owner
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Info */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700 text-xs uppercase font-bold">Agreed Price</span>
                      <div className="text-[#4154f1] font-bold text-2xl">{formatPrice(transaction.agreedPrice)}</div>
                    </div>
                    <div>
                      <span className="text-blue-700 text-xs uppercase font-bold">Request Date</span>
                      <div className="text-[#012970] font-bold text-lg">{new Date(transaction.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 ml-6">
                <button
                  onClick={() => handleApproveTransaction(transaction._id)}
                  disabled={processingId === transaction._id}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-sm font-bold text-white bg-[#4154f1] hover:bg-[#3346d8] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
                >
                  {processingId === transaction._id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          <Database className="mx-auto h-12 w-12 text-gray-300" />
          <div className="text-[#012970] text-lg font-bold mt-4">No lands registered</div>
          <p className="text-gray-500 mt-2">No lands have been added to the database yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allLands.map((land) => (
            <div key={land._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#012970]">
                    Asset ID: {land.assetId}
                  </h3>
                  <p className="text-sm text-gray-500">Survey: {land.surveyNumber}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${land.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-100' :
                    land.status === 'FOR_SALE' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                      'bg-gray-50 text-gray-700 border-gray-100'
                    }`}>
                    {land.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${land.verificationStatus === 'VERIFIED' ? 'bg-blue-50 text-[#4154f1] border-blue-100' :
                    land.verificationStatus === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {land.verificationStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div><span className="font-bold text-[#012970]">Location:</span> {land.village}, {land.district}</div>
                <div><span className="font-bold text-[#012970]">Type:</span> {land.landType}</div>
                <div><span className="font-bold text-[#012970]">Area:</span> {land.area.acres || 0} Acres</div>
                {land.currentOwner && (
                  <div><span className="font-bold text-[#012970]">Owner:</span> {land.currentOwner.fullName}</div>
                )}
                <div><span className="font-bold text-[#012970]">Digitalized:</span> {land.digitalDocument?.isDigitalized ? 'Yes' : 'No'}</div>
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
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
          <div className="text-[#012970] text-lg font-bold mt-4">No pending land transactions</div>
          <p className="text-gray-500 mt-2">All land transactions have been processed.</p>
        </div>
      ) : (
        landTransactions.map((transaction) => (
          <div key={transaction._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <ShoppingCart className="h-5 w-5 text-[#4154f1]" />
                  <h3 className="text-lg font-bold text-[#012970]">
                    Land Sale Transaction
                  </h3>
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                    {transaction.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-bold text-[#012970]">Asset ID:</span> {transaction.landId.assetId}
                  </div>
                  <div>
                    <span className="font-bold text-[#012970]">Location:</span> {transaction.landId.village}, {transaction.landId.district}
                  </div>
                  <div>
                    <span className="font-bold text-[#012970]">Seller:</span> {transaction.seller.fullName}
                  </div>
                  <div>
                    <span className="font-bold text-[#012970]">Buyer:</span> {transaction.buyer.fullName}
                  </div>
                  <div>
                    <span className="font-bold text-[#012970]">Agreed Price:</span> {formatPrice(transaction.agreedPrice)}
                  </div>
                  <div>
                    <span className="font-bold text-[#012970]">Date:</span> {new Date(transaction.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleReviewLandTransaction(transaction._id, 'approve')}
                  disabled={processingId === transaction._id}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-green-500/20"
                >
                  {processingId === transaction._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                  className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <h1 className="text-2xl font-bold text-[#012970]">Admin Panel</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage users, transactions, and land registry
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-bold text-sm transition-all ${activeTab === 'users'
              ? 'border-[#4154f1] text-[#4154f1]'
              : 'border-transparent text-gray-500 hover:text-[#012970] hover:border-gray-300'
              }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            User Verifications
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-bold text-sm transition-all ${activeTab === 'transactions'
              ? 'border-[#4154f1] text-[#4154f1]'
              : 'border-transparent text-gray-500 hover:text-[#012970] hover:border-gray-300'
              }`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            Buy Requests
          </button>
          <button
            onClick={() => setActiveTab('all-transactions')}
            className={`py-4 px-1 border-b-2 font-bold text-sm transition-all ${activeTab === 'all-transactions'
              ? 'border-[#4154f1] text-[#4154f1]'
              : 'border-transparent text-gray-500 hover:text-[#012970] hover:border-gray-300'
              }`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            All Transactions
          </button>
          <button
            onClick={() => setActiveTab('lands')}
            className={`py-4 px-1 border-b-2 font-bold text-sm transition-all ${activeTab === 'lands'
              ? 'border-[#4154f1] text-[#4154f1]'
              : 'border-transparent text-gray-500 hover:text-[#012970] hover:border-gray-300'
              }`}
          >
            <Database className="inline h-4 w-4 mr-2" />
            All Lands
          </button>
          <button
            onClick={() => setActiveTab('blockchain')}
            className={`py-4 px-1 border-b-2 font-bold text-sm transition-all ${activeTab === 'blockchain'
              ? 'border-[#4154f1] text-[#4154f1]'
              : 'border-transparent text-gray-500 hover:text-[#012970] hover:border-gray-300'
              }`}
          >
            <Cpu className="inline h-4 w-4 mr-2" />
            Blockchain
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-4 rounded-xl text-sm font-medium flex items-center">
          <XCircle className="h-5 w-5 mr-3 text-red-500" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4154f1]"></div>
        </div>
      ) : (
        <>
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'all-transactions' && renderAllTransactions()}
          {activeTab === 'lands' && renderLands()}

          {activeTab === 'blockchain' && <BlockchainDashboard />}
        </>
      )}

      {/* Success Animation Modal */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100 animate-bounce-in max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="bg-green-50 rounded-full p-6">
                  <CheckCircle className="h-20 w-20 text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#012970] mb-3">{successMessage}</h2>
              <p className="text-gray-500 font-medium">The operation has been completed successfully.</p>
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