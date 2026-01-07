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
        } catch (err: any) {
            console.error("Error fetching blockchain data:", err);
            setError(err.message || "Failed to fetch blockchain data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mr-3" />
                <span className="text-gray-600 font-medium text-lg">Loading blockchain data...</span>
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
                                                        <span className="font-mono text-sm text-blue-600 font-bold max-w-[120px] truncate" title={tx.hash}>
                                                            {tx.hash}
                                                        </span>
                                                        <button className="ml-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-1 font-bold">BLOCK #{tx.blockNumber}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">
                                                        {tx.type === "LAND_REGISTRATION" ? "Registration" : "Transfer"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800 text-sm">{tx.surveyNumber}</div>
                                                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{tx.assetId.substring(0, 8)}...</div>
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
                            <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/20 active:scale-95 flex items-center justify-center group-hover:translate-x-1 duration-300">
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
