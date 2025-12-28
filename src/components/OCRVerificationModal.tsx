import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Loader } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface OCRVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentType: string;
    userProvidedNumber: string;
    documentUrl: string;
}

const OCRVerificationModal: React.FC<OCRVerificationModalProps> = ({
    isOpen,
    onClose,
    documentType,
    userProvidedNumber,
    documentUrl,
}) => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        extractedText?: string;
    } | null>(null);

    const handleVerify = async () => {
        setIsVerifying(true);
        setResult(null);

        try {
            // Perform OCR on the document image
            const { data: { text } } = await Tesseract.recognize(documentUrl, 'eng', {
                logger: (m) => console.log(m),
            });

            // Clean both the extracted text and user-provided number
            const cleanExtractedText = text.replace(/\s/g, '').toUpperCase();
            const cleanUserNumber = userProvidedNumber.replace(/\s/g, '').toUpperCase();

            // Check if the user-provided number exists in the extracted text
            if (cleanExtractedText.includes(cleanUserNumber)) {
                setResult({
                    success: true,
                    message: `✅ MATCH: ${documentType} number found in document`,
                    extractedText: text,
                });
            } else {
                setResult({
                    success: false,
                    message: `❌ NO MATCH: ${documentType} number not found in document`,
                    extractedText: text,
                });
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: `❌ OCR failed: ${error.message}. Try a clearer image.`,
            });
        } finally {
            setIsVerifying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg shadow-xl border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-xl font-semibold text-white">AI Cross Check - {documentType}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Document Info */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <h3 className="text-sm font-medium text-slate-300 mb-2">Document Information</h3>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-slate-400">Type:</span>{' '}
                                <span className="text-white font-medium">{documentType}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">User Provided Number:</span>{' '}
                                <span className="text-white font-medium">{userProvidedNumber}</span>
                            </div>
                        </div>
                    </div>

                    {/* Document Preview */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Document Preview</h3>
                        <img
                            src={documentUrl}
                            alt={documentType}
                            className="w-full rounded border border-slate-600"
                        />
                    </div>

                    {/* Verify Button */}
                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-500/40 disabled:shadow-none flex items-center justify-center"
                    >
                        {isVerifying ? (
                            <>
                                <Loader className="h-5 w-5 mr-2 animate-spin" />
                                Analyzing Document...
                            </>
                        ) : (
                            'Run AI Cross Check'
                        )}
                    </button>

                    {/* Result */}
                    {result && (
                        <div
                            className={`rounded-lg p-4 border ${result.success
                                    ? 'bg-emerald-500/20 border-emerald-500/30'
                                    : 'bg-red-500/20 border-red-500/30'
                                }`}
                        >
                            <div className="flex items-center mb-2">
                                {result.success ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-400 mr-2" />
                                )}
                                <span
                                    className={`font-medium ${result.success ? 'text-emerald-300' : 'text-red-300'
                                        }`}
                                >
                                    {result.message}
                                </span>
                            </div>
                            {result.extractedText && (
                                <details className="mt-3">
                                    <summary className="text-sm text-slate-300 cursor-pointer hover:text-white">
                                        View Extracted Text
                                    </summary>
                                    <pre className="mt-2 text-xs text-slate-400 bg-slate-950/50 p-3 rounded border border-slate-700 overflow-x-auto">
                                        {result.extractedText}
                                    </pre>
                                </details>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OCRVerificationModal;
