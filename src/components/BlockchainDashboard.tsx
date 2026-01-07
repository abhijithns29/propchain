import React, { useState, useEffect } from "react";
import {
    Activity,
    Database,
    Shield,
    Cpu,
    Wallet,
    ExternalLink,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    FileText,
    Clock,
    Hash
} from "lucide-react";
import apiService from "../services/api";

const BlockchainDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Explorer State
    const [showExplorer, setShowExplorer] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<any>(null);
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [recentBlocks, setRecentBlocks] = useState<any[]>([]);
    const [explorerLoading, setExplorerLoading] = useState(false);

    // Verification State
    const [searchAssetId, setSearchAssetId] = useState('');
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [verifying, setVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const [statsRes, transRes, healthRes] = await Promise.all([
                apiService.getBlockchainStats(),
                apiService.getBlockchainTransactions(10),
                apiService.getBlockchainHealth()
            ]);

            setStats(statsRes.data);
            setTransactions(transRes.data);
            setHealth(healthRes.data);
            setError(null);

            // If explorer is open, fetch recent blocks too
            if (showExplorer) {
                fetchRecentBlocks(statsRes.data.network.blockNumber);
            }
        } catch (err: any) {
            console.error("Error fetching blockchain data:", err);
            setError(err.message || "Failed to fetch blockchain data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchRecentBlocks = async (latestBlock: number) => {
        try {
            const blocks = [];
            const count = Math.min(5, latestBlock + 1);
            for (let i = 0; i < count; i++) {
                const blockRes = await apiService.getBlock(latestBlock - i);
                if (blockRes.success) blocks.push(blockRes.data);
            }
            setRecentBlocks(blocks);
        } catch (err) {
            console.error("Error fetching blocks:", err);
        }
    };

    const handleViewBlock = async (number: number) => {
        try {
            setExplorerLoading(true);
            const res = await apiService.getBlock(number);
            if (res.success) {
                setSelectedBlock(res.data);
                setSelectedTx(null);
            }
        } catch (err) {
            console.error("Error viewing block:", err);
        } finally {
            setExplorerLoading(false);
        }
    };

    const handleViewTx = async (hash: string) => {
        try {
            setExplorerLoading(true);
            const res = await apiService.getTransactionById(hash);
            if (res.success) {
                setSelectedTx(res.data);
                setSelectedBlock(null);
            }
        } catch (err) {
            console.error("Error viewing tx:", err);
        } finally {
            setExplorerLoading(false);
        }
    };

    const handleVerifyOwnership = async () => {
        if (!searchAssetId.trim()) {
            setVerificationError('Please enter an Asset ID');
            return;
        }

        try {
            setVerifying(true);
            setVerificationError(null);
            setVerificationResult(null);

            const result = await apiService.verifyLandOwnership(searchAssetId.trim());
            setVerificationResult(result);
        } catch (error: any) {
            setVerificationError(error.message || 'Failed to verify ownership');
        } finally {
            setVerifying(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [showExplorer]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mr-3" />
                <span className="text-gray-600 font-medium text-lg">Loading blockchain data...</span>
            </div>
        );
    }

    if (showExplorer) {
        return (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <button
                            onClick={() => setShowExplorer(false)}
                            className="mr-4 p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition-all"
                        >
                            <AlertCircle className="h-6 w-6 rotate-180" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Blockchain Explorer</h2>
                            <p className="text-gray-500 text-sm font-medium">Inspecting blocks and transactions in real-time</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Recent Blocks */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-blue-600" />
                            Recent Blocks
                        </h3>
                        <div className="space-y-3">
                            {recentBlocks.map((block) => (
                                <button
                                    key={block.number}
                                    onClick={() => handleViewBlock(block.number)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedBlock?.number === block.number
                                        ? "border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]"
                                        : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm"
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-blue-700">Block #{block.number}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(block.timestamp * 1000).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-gray-500 truncate">{block.hash}</div>
                                    <div className="mt-2 flex items-center text-[10px] font-bold text-gray-400">
                                        <Activity className="h-3 w-3 mr-1" />
                                        {block.transactions.length} Transactions
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Details View */}
                    <div className="lg:col-span-2">
                        {explorerLoading ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-20 flex flex-col items-center justify-center">
                                <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                                <span className="text-gray-500 font-bold">Fetching technical data...</span>
                            </div>
                        ) : selectedBlock ? (
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="bg-gray-50 p-6 border-b border-gray-100">
                                    <h4 className="text-xl font-bold text-gray-900 flex items-center">
                                        <Database className="h-6 w-6 text-blue-600 mr-3" />
                                        Block Details: #{selectedBlock.number}
                                    </h4>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hash</p>
                                            <div className="font-mono text-xs text-gray-800 break-all bg-gray-50 p-3 rounded-lg border border-gray-100 font-bold">{selectedBlock.hash}</div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Parent Hash</p>
                                            <div className="font-mono text-xs text-gray-500 truncate bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedBlock.parentHash}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Gas Used</p>
                                            <div className="font-bold text-blue-900">{selectedBlock.gasUsed?._hex ? parseInt(selectedBlock.gasUsed._hex, 16).toLocaleString() : selectedBlock.gasUsed?.toString() || 'N/A'}</div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                            <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Mining Reward</p>
                                            <div className="font-bold text-green-900 underline decoration-dotted">Base 0.0 ETH</div>
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Nonce</p>
                                            <div className="font-bold text-amber-900">{selectedBlock.nonce}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                                            <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                            Transactions in Block
                                        </h5>
                                        <div className="space-y-2">
                                            {selectedBlock.transactions.map((tx: any, i: number) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleViewTx(tx.hash || tx)}
                                                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-100 transition-all text-left group"
                                                >
                                                    <div className="flex items-center">
                                                        <Hash className="h-3.5 w-3.5 text-gray-400 mr-2 group-hover:text-blue-600" />
                                                        <span className="font-mono text-xs text-gray-600 truncate max-w-[300px]">{tx.hash || tx}</span>
                                                    </div>
                                                    <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : selectedTx ? (
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h4 className="text-xl font-bold text-gray-900 flex items-center">
                                        <Hash className="h-6 w-6 text-blue-600 mr-3" />
                                        Transaction Details
                                    </h4>
                                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 flex items-center">
                                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                        Confirmed
                                    </span>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Transaction Hash</p>
                                        <div className="font-mono text-xs text-blue-600 font-bold break-all">{selectedTx.hash}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">From</p>
                                            <div className="font-mono text-xs text-gray-700 break-all p-3 bg-gray-50 rounded-lg border border-gray-100">{selectedTx.from}</div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">To (Contract/Recipient)</p>
                                            <div className="font-mono text-xs text-indigo-600 break-all p-3 bg-gray-50 rounded-lg border border-gray-100 font-bold">{selectedTx.to}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="p-4 bg-white rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Block</p>
                                            <div className="font-bold text-gray-900">#{selectedTx.blockNumber}</div>
                                        </div>
                                        <div className="p-4 bg-white rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Value</p>
                                            <div className="font-bold text-gray-900">0.0 ETH</div>
                                        </div>
                                        <div className="p-4 bg-white rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Confirmations</p>
                                            <div className="font-bold text-green-600">{selectedTx.confirmations}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Technical Input Data</p>
                                        <div className="font-mono text-[10px] text-gray-400 break-all bg-gray-900 p-4 rounded-xl max-h-[150px] overflow-y-auto">
                                            {selectedTx.data}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-100 p-20 flex flex-col items-center justify-center text-center opacity-70">
                                <Cpu className="h-16 w-16 text-gray-200 mb-4 transition-transform hover:scale-110 duration-1000" />
                                <h4 className="text-xl font-bold text-gray-400">Select an item to inspect</h4>
                                <p className="text-gray-400 text-sm mt-1">Pick a block from the left or a transaction hash to see technical details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Cpu className="h-7 w-7 text-blue-600 mr-3" />
                        Blockchain Dashboard
                    </h2>
                    <p className="text-gray-500 mt-1">Real-time monitoring of land registry blockchain operations</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${health?.connected
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                        <span className={`h-2.5 w-2.5 rounded-full mr-2.5 ${health?.connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                        {health?.connected ? `Connected: ${health.networkType}` : "Disconnected"}
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={refreshing}
                        className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        title="Refresh dashboard"
                    >
                        <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center shadow-sm">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Blockchain Verification Search */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-100">
                <div className="flex items-center mb-4">
                    <Shield className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">Blockchain Ownership Verification</h3>
                </div>
                <p className="text-gray-600 mb-4">Search by Asset ID to verify current ownership directly from the blockchain</p>

                <div className="flex gap-3 mb-4">
                    <input
                        type="text"
                        value={searchAssetId}
                        onChange={(e) => setSearchAssetId(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleVerifyOwnership()}
                        placeholder="Enter Asset ID (e.g., F641A34F-5D0F-4CF6-A72D-60D1632D1475)"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleVerifyOwnership}
                        disabled={verifying}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-lg shadow-blue-500/20"
                    >
                        {verifying ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                            'Verify on Blockchain'
                        )}
                    </button>
                </div>

                {verificationError && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center">
                        <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="font-medium">{verificationError}</span>
                    </div>
                )}

                {verificationResult && (
                    <div className="mt-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        {!verificationResult.onBlockchain ? (
                            <div className="text-center py-4">
                                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">{verificationResult.message}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Verification Status */}
                                <div className={`p-4 rounded-xl flex items-center ${verificationResult.isMatch
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                    }`}>
                                    {verificationResult.isMatch ? (
                                        <>
                                            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                                            <div>
                                                <p className="font-bold text-green-900">✅ VERIFIED</p>
                                                <p className="text-sm text-green-700">Blockchain and database records match</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                                            <div>
                                                <p className="font-bold text-red-900">❌ TAMPERED</p>
                                                <p className="text-sm text-red-700">Blockchain and database records DO NOT match!</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Land Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Asset ID</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{verificationResult.land.assetId}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Survey Number</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{verificationResult.land.surveyNumber}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Location</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{verificationResult.land.village}, {verificationResult.land.district}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Blockchain ID</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">#{verificationResult.land.blockchainId}</p>
                                    </div>
                                </div>

                                {/* Ownership Comparison */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <p className="text-xs text-blue-600 font-bold uppercase mb-2">Blockchain Owner</p>
                                        <p className="text-xs font-mono text-gray-600 break-all">{verificationResult.blockchainOwner.address}</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                                        <p className="text-xs text-purple-600 font-bold uppercase mb-2">Database Owner</p>
                                        <p className="text-sm font-bold text-gray-900">{verificationResult.databaseOwner.name}</p>
                                        <p className="text-xs font-mono text-gray-600 break-all mt-1">{verificationResult.databaseOwner.walletAddress}</p>
                                    </div>
                                </div>

                                {/* Transaction History */}
                                {verificationResult.transactionHistory && verificationResult.transactionHistory.length > 0 && (
                                    <div>
                                        <p className="font-bold text-gray-900 mb-2">Transaction History (from Blockchain)</p>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {verificationResult.transactionHistory.map((tx: any, idx: number) => (
                                                <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-blue-600">{tx.transactionType}</span>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${tx.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {tx.approved ? 'Approved' : 'Pending'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600">From: {tx.from.slice(0, 10)}...{tx.from.slice(-8)}</p>
                                                    <p className="text-xs text-gray-600">To: {tx.to.slice(0, 10)}...{tx.to.slice(-8)}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{new Date(tx.timestamp).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Database className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md uppercase tracking-wider">On-Chain</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Registered Lands</p>
                    <div className="flex items-end gap-2 mt-1">
                        <h3 className="text-3xl font-black text-gray-900 leading-none">{stats?.lands?.onBlockchain || 0}</h3>
                        <span className="text-gray-400 text-sm font-bold mb-1">/ {stats?.lands?.total || 0} Total</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Activity className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">Total transactions</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Transactions</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1 leading-none">{stats?.contract?.transactionCounter || 0}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                            <Clock className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md uppercase tracking-wider">Current Block</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Block Height</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1 leading-none">#{stats?.network?.blockNumber || 0}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-all">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider">Admin Balance</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Available ETH</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1 leading-none">{stats?.wallet?.balanceEth || "0.000"} ETH</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Transactions */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <FileText className="h-5 w-5 text-gray-400 mr-2" />
                            Recent Blockchain Transactions
                        </h3>
                        <button className="text-sm font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">View All</button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Transaction</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Land ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Time</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transactions.length > 0 ? (
                                        transactions.map((tx, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <Hash className="h-3.5 w-3.5 text-gray-400 mr-2" />
                                                        <button
                                                            onClick={() => {
                                                                setShowExplorer(true);
                                                                handleViewTx(tx.hash);
                                                            }}
                                                            className="font-mono text-sm text-blue-600 font-bold max-w-[120px] truncate hover:underline"
                                                            title={tx.hash || ""}
                                                        >
                                                            {tx.hash || "0x..."}
                                                        </button>
                                                        <button className="ml-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-1 font-bold">BLOCK #{tx.blockNumber || "Pending"}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${tx.type === "LAND_REGISTRATION"
                                                        ? "bg-blue-50 text-blue-700"
                                                        : tx.type === "SALE"
                                                            ? "bg-green-50 text-green-700"
                                                            : "bg-indigo-50 text-indigo-700"
                                                        }`}>
                                                        {(tx.type || "Unknown").charAt(0) + (tx.type || "Unknown").slice(1).toLowerCase().replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800 text-sm">{tx.surveyNumber || "N/A"}</div>
                                                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                                                        {tx.assetId ? (tx.assetId.length > 8 ? `${tx.assetId.substring(0, 8)}...` : tx.assetId) : "Unknown"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                    {new Date(tx.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Success
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                                                No transactions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Network & Contract Details */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <Shield className="h-5 w-5 text-gray-400 mr-2" />
                        Infrastructure
                    </h3>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Smart Contract Address</p>
                            <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                                <code className="text-xs font-mono text-gray-700 font-bold truncate flex-1">
                                    {stats?.contract?.address || "N/A"}
                                </code>
                                <button className="ml-2 text-gray-400 group-hover:text-blue-600 transition-all active:scale-95">
                                    <ExternalLink className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Network</p>
                                <div className="font-bold text-gray-800 text-sm truncate">{stats?.network?.name || "Unknown"}</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Chain ID</p>
                                <div className="font-bold text-gray-800 text-sm">{stats?.network?.chainId || "N/A"}</div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Admin Wallet</p>
                            <div className="font-mono text-[10px] text-gray-600 font-bold truncate mb-2">{stats?.wallet?.address || "N/A"}</div>
                            <div className="flex justify-between items-center text-xs font-bold text-blue-600">
                                <span>Registration Power</span>
                                <span className="px-2 py-0.5 bg-blue-100 rounded text-[10px]">Active</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-gray-700">Health Check</span>
                                <span className="text-xs font-bold text-green-600 flex items-center">
                                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                                    OPERATIONAL
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-bold">Contract Verification</span>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-bold">Node Sync Status</span>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-bold">Admin Authorization</span>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg border border-blue-500 group overflow-hidden relative">
                        <div className="relative z-10">
                            <h4 className="text-white font-bold text-lg mb-2">Blockchain Explorer</h4>
                            <p className="text-blue-100 text-xs font-medium mb-4 leading-relaxed">
                                View all blocks and transactions on the private ledger network.
                            </p>
                            <button
                                onClick={() => setShowExplorer(true)}
                                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/20 active:scale-95 flex items-center justify-center group-hover:translate-x-1 duration-300"
                            >
                                Launch Explorer
                                <Activity className="h-4 w-4 ml-2" />
                            </button>
                        </div>
                        {/* Background pattern */}
                        <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700">
                            <Cpu className="h-40 w-40 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlockchainDashboard;
