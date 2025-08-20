import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  MapPin,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Phone,
  Mail,
} from "lucide-react";

const FoodListingModal = ({
  isOpen,
  onClose,
  listing,
  onDelete,
  isLoading,
}) => {
  if (!listing) return null;

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const isExpired = new Date(listing.expiryTime) < new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Package className="w-6 h-6 text-blue-600" />
            Food Listing Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Listing Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {listing.title}
                </h3>
                <p className="text-gray-600 mb-3">{listing.description}</p>
                <div className="flex items-center gap-4">
                  {getStatusBadge(listing.isActive)}
                  {isExpired && (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Expired
                    </Badge>
                  )}
                </div>
              </div>
              {listing.imageUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Listing Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Food Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity Available:</span>
                    <span className="font-medium">{listing.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Food Type:</span>
                    <span className="font-medium">
                      {listing.foodType || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">
                      {listing.category || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Location & Timing
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{listing.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>
                      Expires: {new Date(listing.expiryTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      Posted: {new Date(listing.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Provider Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{listing.providerName || "Unknown Provider"}</span>
                  </div>
                </div>
              </div>

              {listing.specialInstructions && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Special Instructions
                  </h4>
                  <p className="text-sm text-gray-600">
                    {listing.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              Last updated: {new Date(listing.updatedAt).toLocaleString()}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Close
              </Button>

              <Button
                onClick={() => {
                  const reason = prompt(
                    "Please provide a reason for deleting this listing:"
                  );
                  if (reason) {
                    onDelete(listing._id, reason);
                  }
                }}
                disabled={isLoading}
                variant="destructive"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete Listing
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FoodListingModal;
