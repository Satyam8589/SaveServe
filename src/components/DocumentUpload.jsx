"use client";

import { useState, useRef } from "react";
import {
  Upload,
  File,
  X,
  Check,
  AlertCircle,
  FileText,
  Image,
  FileCheck,
  XCircle,
  CheckCircle,
} from "lucide-react";

const DocumentUpload = ({
  documents = [],
  onDocumentsChange,
  userRole,
  userSubrole,
}) => {
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Get required document types based on user role
  const getRequiredDocuments = () => {
    const baseRequirements = ["ID_CARD"]; // Everyone needs ID

    // For providers and recipients, documents are mandatory
    if (userRole === "PROVIDER" || userRole === "RECIPIENT") {
      if (userSubrole === "STUDENT") {
        return [...baseRequirements, "STUDENT_ID"];
      } else if (userSubrole === "STAFF") {
        return [...baseRequirements, "STAFF_ID"];
      } else if (userSubrole === "NGO") {
        return [...baseRequirements, "NGO_CERTIFICATE"];
      }
      return baseRequirements;
    }

    // For other roles, no documents required
    return [];
  };

  const requiredDocs = getRequiredDocuments();

  const documentTypeLabels = {
    ID_CARD: "Government ID Card",
    STUDENT_ID: "Student ID Card",
    STAFF_ID: "Staff ID Card",
    NGO_CERTIFICATE: "NGO Registration Certificate",
    OTHER: "Other Document",
  };

  const handleFileSelect = async (files, documentType) => {
    if (!files || files.length === 0) return;

    setUploadingDocs((prev) => ({ ...prev, [documentType]: true }));
    const file = files[0];

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (file.size > maxSize) {
      setError("File size must be less than 5MB");
      setUploadingDocs((prev) => ({ ...prev, [documentType]: false }));
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and PDF files are allowed");
      setUploadingDocs((prev) => ({ ...prev, [documentType]: false }));
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      // Convert file to base64 for storage (in a real app, you'd upload to cloud storage)
      const base64 = await fileToBase64(file);

      const newDocument = {
        id: Date.now().toString(),
        name: file.name,
        url: base64, // In production, this would be a cloud storage URL
        type: documentType,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type,
      };

      // Remove existing document of same type and add new one
      const updatedDocs = documents.filter((doc) => doc.type !== documentType);
      updatedDocs.push(newDocument);

      onDocumentsChange(updatedDocs);
      setSuccess(`${documentTypeLabels[documentType]} uploaded successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Error uploading file. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const removeDocument = (documentId) => {
    const updatedDocs = documents.filter((doc) => doc.id !== documentId);
    onDocumentsChange(updatedDocs);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, documentType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files, documentType);
    }
  };

  const getDocumentIcon = (mimeType) => {
    if (mimeType?.startsWith("image/")) {
      return <Image className="w-5 h-5" />;
    } else if (mimeType === "application/pdf") {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const isDocumentUploaded = (docType) => {
    return documents.some((doc) => doc.type === docType);
  };

  const getUploadedDocument = (docType) => {
    return documents.find((doc) => doc.type === docType);
  };

  // Don't render anything if no documents are required
  if (requiredDocs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-200">{success}</p>
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <FileCheck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-blue-400 font-semibold text-lg">
              Document Verification
            </h3>
            <p className="text-blue-200 text-sm">
              Upload required documents for identity verification
            </p>
          </div>
        </div>

        <div className="bg-blue-950/50 rounded-lg p-4">
          <p className="text-blue-100 text-sm leading-relaxed">
            <strong>Why do we need these documents?</strong>
            <br />
            Document verification helps us ensure the safety and authenticity of
            our community members. All documents are securely stored and only
            visible to authorized administrators.
            {(userRole === "PROVIDER" || userRole === "RECIPIENT") && (
              <>
                <br />
                <br />
                <strong className="text-yellow-300">
                  ⚠️ Document upload is required for {userRole.toLowerCase()}s
                  to complete registration.
                </strong>
              </>
            )}
          </p>
        </div>
      </div>

      {requiredDocs.map((docType) => {
        const isUploaded = isDocumentUploaded(docType);
        const uploadedDoc = getUploadedDocument(docType);

        return (
          <div
            key={docType}
            className="bg-gray-800/50 rounded-xl p-6 border border-gray-600/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isUploaded ? "bg-green-500/20" : "bg-gray-500/20"
                  }`}
                >
                  {isUploaded ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-white font-medium">
                    {documentTypeLabels[docType]}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {isUploaded
                      ? "Document uploaded"
                      : "Required for verification"}
                  </p>
                </div>
              </div>
              {isUploaded && (
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                  Uploaded
                </span>
              )}
            </div>

            {isUploaded && uploadedDoc ? (
              <div className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-gray-400">
                    {getDocumentIcon(uploadedDoc.mimeType)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{uploadedDoc.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(uploadedDoc.fileSize / 1024 / 1024).toFixed(2)} MB •
                      Uploaded{" "}
                      {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeDocument(uploadedDoc.id)}
                  className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleDrop(e, docType)}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gray-700/50 rounded-full">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-2">
                      Drop your {documentTypeLabels[docType].toLowerCase()} here
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      or click to browse files
                    </p>
                    <button
                      onClick={() => {
                        // Create a temporary file input for this specific document type
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*,.pdf";
                        input.onchange = (e) => {
                          handleFileSelect(e.target.files, docType);
                        };
                        input.click();
                      }}
                      disabled={uploadingDocs[docType]}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                    >
                      {uploadingDocs[docType] ? "Uploading..." : "Choose File"}
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Supported formats: JPEG, PNG, PDF • Max size: 5MB
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {documents.length > 0 && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400">
            <Check className="w-5 h-5" />
            <span className="font-medium">
              {documents.length} of {requiredDocs.length} required documents
              uploaded
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
