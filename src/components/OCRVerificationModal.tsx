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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-[#012970]">AI Cross Check - {documentType}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-[#012970] transition-colors p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Document Info */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <h3 className="text-sm font-bold text-[#012970] mb-3 uppercase tracking-wider">Document Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <span className="text-gray-500 w-32">Type:</span>
                                <span className="text-[#012970] font-bold">{documentType}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-gray-500 w-32">Specified ID:</span>
                                <span className="text-[#012970] font-bold">{userProvidedNumber}</span>
                            </div>
                        </div>
                    </div>

                    {/* Document Preview */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <h3 className="text-sm font-bold text-[#012970] mb-4 uppercase tracking-wider">Document Preview</h3>
                        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                            <img
                                src={documentUrl}
                                alt={documentType}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Verify Button */}
                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className="w-full px-6 py-4 bg-[#4154f1] hover:bg-[#3346d8] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none flex items-center justify-center transform active:scale-[0.98]"
                    >
                        {isVerifying ? (
                            <>
                                <Loader className="h-5 w-5 mr-3 animate-spin" />
                                Analyzing Document...
                            </>
                        ) : (
                            'Run AI Cross Check'
                        )}
                    </button>

                    {/* Result */}
                    {result && (
                        <div
                            className={`rounded-xl p-5 border ${result.success
                                ? 'bg-green-50 border-green-100'
                                : 'bg-red-50 border-red-100'
                                }`}
                        >
                            <div className="flex items-center mb-3">
                                {result.success ? (
                                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-red-500 mr-3" />
                                )}
                                <span
                                    className={`font-bold ${result.success ? 'text-green-700' : 'text-red-700'
                                        }`}
                                >
                                    {result.message}
                                </span>
                            </div>
                            {result.extractedText && (
                                <details className="mt-4">
                                    <summary className="text-sm font-bold text-gray-600 cursor-pointer hover:text-[#012970] transition-colors">
                                        View Extracted Text
                                    </summary>
                                    <div className="mt-3 text-xs text-gray-500 bg-white p-4 rounded-lg border border-gray-100 overflow-x-auto font-mono max-h-40 overflow-y-auto">
                                        {result.extractedText}
                                    </div>
                                </details>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                    {result?.success && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                        >
                            Proceed with Verification
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OCRVerificationModal;
