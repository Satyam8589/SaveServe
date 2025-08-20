import React from 'react';
import { AlertTriangle, X, Clock, User } from 'lucide-react';

const SuspensionNotification = ({ 
  isOpen, 
  onClose, 
  message, 
  suspensionInfo,
  userStatus 
}) => {
  if (!isOpen) return null;

  const getStatusColor = () => {
    switch (userStatus) {
      case 'REJECTED':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'BLOCKED':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const getStatusIcon = () => {
    switch (userStatus) {
      case 'REJECTED':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'BLOCKED':
        return <X className="w-6 h-6 text-gray-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getTitle = () => {
    switch (userStatus) {
      case 'REJECTED':
        return 'Account Suspended';
      case 'BLOCKED':
        return 'Account Blocked';
      default:
        return 'Access Restricted';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full rounded-lg border-2 p-6 shadow-xl ${getStatusColor()}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {getStatusIcon()}
            <h3 className="ml-3 text-lg font-semibold">
              {getTitle()}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {suspensionInfo && (
          <div className="bg-white bg-opacity-50 rounded-md p-3 mb-4">
            <h4 className="font-medium text-sm mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Suspension Details
            </h4>
            <div className="space-y-1 text-xs">
              {suspensionInfo.reason && (
                <div className="flex items-start">
                  <span className="font-medium mr-2">Reason:</span>
                  <span>{suspensionInfo.reason}</span>
                </div>
              )}
              {suspensionInfo.suspendedAt && (
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-2" />
                  <span className="font-medium mr-2">Date:</span>
                  <span>{new Date(suspensionInfo.suspendedAt).toLocaleDateString()}</span>
                </div>
              )}
              {suspensionInfo.suspendedBy && (
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-2" />
                  <span className="font-medium mr-2">By:</span>
                  <span>Admin</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-medium py-2 px-4 rounded-md transition-all duration-200"
          >
            I Understand
          </button>
          <button
            onClick={() => {
              // You can add contact support functionality here
              window.location.href = 'mailto:support@foodredistribution.com?subject=Account Suspension Appeal';
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Contact Support
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs opacity-75">
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuspensionNotification;
