// Helper component for document display with AI Cross Check
const DocumentCard = ({
    docType,
    number,
    documentUrl,
    onCrossCheck
}: {
    docType: string;
    number: string;
    documentUrl: string;
    onCrossCheck: () => void;
}) => (
    <div className="bg-slate-800/60 rounded p-3 border border-slate-700">
        <div className="flex items-center mb-2">
            <FileText className="h-4 w-4 text-emerald-400 mr-2" />
            <span className="font-medium text-white">{docType}</span>
        </div>
        <div className="text-slate-300">Number: {number}</div>
        {documentUrl && (
            <div className="mt-2 flex gap-2 flex-wrap">
                <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center transition-colors"
                >
                    <Eye className="h-3 w-3 mr-1" />
                    View Document
                </a>
                <button
                    onClick={onCrossCheck}
                    className="text-purple-400 hover:text-purple-300 text-xs flex items-center transition-colors"
                >
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Cross Check
                </button>
            </div>
        )}
    </div>
);

// Add this inside AdminPanel component, before renderUsers function
