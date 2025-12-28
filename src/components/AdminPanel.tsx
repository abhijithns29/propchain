import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Users, Database, FileText, ShoppingCart, Sparkles } from 'lucide-react';
import { User, Land, Transaction } from '../types';
import apiService from '../services/api';
import OCRVerificationModal from './OCRVerificationModal';
import Tesseract from 'tesseract.js';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'users' | 'lands' | 'land-transactions'>('users');
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allLands, setAllLands] = useState<Land[]>([]);
  const [landTransactions, setLandTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

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
          {activeTab === 'lands' && renderLands()}
          {activeTab === 'land-transactions' && renderLandTransactions()}
        </>
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