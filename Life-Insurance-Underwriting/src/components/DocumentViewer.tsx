import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, File, Loader2 } from 'lucide-react';
import { BlobDocument, listDocuments } from '@/utils/blobStorage';

interface DocumentViewerProps {
  applicationId: string;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ applicationId, onClose }) => {
  const [documents, setDocuments] = useState<BlobDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<BlobDocument | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const documentDisplayRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [applicationId]);

  useEffect(() => {
    if (documents.length > 0 && !selectedDocument) {
      setSelectedDocument(documents[0]);
      setCurrentIndex(0);
    }
  }, [documents]);

  useEffect(() => {
    // Scroll to top when document changes
    if (documentDisplayRef.current) {
      documentDisplayRef.current.scrollTop = 0;
    }
  }, [selectedDocument]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(`Attempting to load documents for application: ${applicationId}`);
      
      const docs = await listDocuments(applicationId);
      
      setDebugInfo(`Successfully loaded ${docs.length} documents`);
      
      if (docs.length === 0) {
        setError(`No documents found in directory "001"`);
      } else {
        setDocuments(docs);
      }
    } catch (err: any) {
      console.error('Error loading documents:', err);
      const errorMessage = err?.message || 'Failed to load documents';
      setError(errorMessage);
      setDebugInfo(`Error: ${errorMessage}\nCheck browser console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedDocument(documents[newIndex]);
      setZoom(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < documents.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedDocument(documents[newIndex]);
      setZoom(1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async () => {
    if (!selectedDocument) return;

    try {
      const response = await fetch(selectedDocument.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedDocument.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document');
    }
  };

  const getFileIcon = (doc: BlobDocument) => {
    switch (doc.type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Document Viewer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading documents...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-2xl px-4">
              <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold mb-2">Unable to Load Documents</p>
              <p className="text-gray-600 mb-4 text-sm">{error}</p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-semibold text-yellow-800 mb-2">Debug Information:</p>
                <pre className="text-xs text-yellow-700 whitespace-pre-wrap font-mono">
                  {debugInfo}
                </pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-semibold text-blue-800 mb-2">Expected Path:</p>
                <p className="text-xs text-blue-700 font-mono">
                  Storage: dataexc<br/>
                  Container: lifeinsurance<br/>
                  Directory: 001<br/>
                  Full URL: https://dataexc.blob.core.windows.net/lifeinsurance?restype=container&comp=list&prefix=001
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-semibold text-gray-800 mb-2">Checklist:</p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Container "lifeinsurance" exists in storage account "dataexc"</li>
                  <li>Directory "001" exists in the container</li>
                  <li>Files (images/PDFs) exist in the "001" directory</li>
                  <li>Container has public read access OR CORS is configured</li>
                  <li>Check browser console (F12) for detailed error messages</li>
                </ol>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={loadDocuments}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Document List Sidebar */}
            <div className="w-64 border-r bg-gray-50 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Documents ({documents.length})
                </h3>
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedDocument(doc);
                        setCurrentIndex(index);
                        setZoom(1);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedDocument === doc
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-white border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`p-1.5 rounded ${
                          doc.type === 'image' ? 'bg-green-100 text-green-600' :
                          doc.type === 'pdf' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getFileIcon(doc)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(doc.size)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Viewer */}
            <div className="flex-1 flex flex-col">
              {selectedDocument && (
                <>
                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Previous"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="text-sm text-gray-600">
                        {currentIndex + 1} / {documents.length}
                      </span>
                      <button
                        onClick={handleNext}
                        disabled={currentIndex === documents.length - 1}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Next"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedDocument.type === 'image' && (
                        <>
                          <button
                            onClick={handleZoomOut}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Zoom Out"
                          >
                            <ZoomOut className="h-5 w-5" />
                          </button>
                          <span className="text-sm text-gray-600 min-w-[4rem] text-center">
                            {Math.round(zoom * 100)}%
                          </span>
                          <button
                            onClick={handleZoomIn}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Zoom In"
                          >
                            <ZoomIn className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors ml-2"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Document Display */}
                  <div ref={documentDisplayRef} className="flex-1 overflow-auto bg-gray-100 p-6">
                    <div className="flex items-center justify-center min-h-full">
                      {selectedDocument.type === 'image' ? (
                        <img
                          src={selectedDocument.url}
                          alt={selectedDocument.name}
                          className="max-w-full h-auto shadow-lg"
                          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                        />
                      ) : selectedDocument.type === 'pdf' ? (
                        <iframe
                          src={selectedDocument.url}
                          className="w-full h-full min-h-[600px] shadow-lg bg-white"
                          title={selectedDocument.name}
                        />
                      ) : (
                        <div className="text-center">
                          <File className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">
                            Preview not available for this file type
                          </p>
                          <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download File
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
