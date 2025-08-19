"use client";

import { useState } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

const DocumentViewer = ({ document, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!document) return null;

  const isImage = document.mimeType?.startsWith("image/");
  const isPDF = document.mimeType === "application/pdf";

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = document.url;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-6xl max-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-800 rounded-t-lg p-4">
          <div className="flex items-center gap-4">
            <h3 className="text-white font-semibold truncate">
              {document.name}
            </h3>
            <span className="text-gray-400 text-sm">
              {(document.fileSize / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-gray-400 text-sm min-w-[60px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </>
            )}

            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="bg-gray-900 rounded-b-lg h-[calc(100%-80px)] overflow-auto flex items-center justify-center">
          {isImage ? (
            !imageError ? (
              <img
                src={document.url}
                alt={document.name}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
                onError={() => {
                  console.error("Failed to load image:", document.url);
                  setImageError(true);
                }}
                onLoad={() => {
                  console.log("Image loaded successfully:", document.url);
                }}
              />
            ) : (
              <div className="text-center p-8 text-white">
                <div className="text-red-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Failed to Load Image
                </h3>
                <p className="text-gray-300 mb-4">
                  The image could not be displayed. It may be corrupted or the
                  URL is invalid.
                </p>
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Download File
                </button>
              </div>
            )
          ) : isPDF ? (
            <iframe
              src={document.url}
              className="w-full h-full border-0"
              title={document.name}
            />
          ) : (
            <div className="text-center text-gray-400 p-8">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">Preview not available</p>
              <p className="text-sm mb-4">
                This file type cannot be previewed in the browser.
              </p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Download to View
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
