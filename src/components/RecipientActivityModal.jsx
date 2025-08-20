import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  UserX,
  Activity,
  TrendingUp,
  Award,
  MapPin,
  Phone,
} from "lucide-react";

const RecipientActivityModal = ({
  isOpen,
  onClose,
  recipient,
  onReject,
  onActivate,
  isLoading,
}) => {
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    collected: 0,
    cancelled: 0,
    rejected: 0,
    impactScore: 0,
    positiveActions: 0,
    recentBookings: [],
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && recipient) {
      fetchRecipientStats();
    }
  }, [isOpen, recipient]);

  const fetchRecipientStats = async () => {
    if (!recipient?.userId) return;

    setStatsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/recipient-stats/${recipient.userId}`
      );
      const data = await response.json();

      if (data.success) {
        setBookingStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching recipient stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Active",
      },
      APPROVED: {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
        label: "Approved",
      },
      REJECTED: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Rejected",
      },
      BLOCKED: {
        color: "bg-gray-100 text-gray-800",
        icon: AlertTriangle,
        label: "Blocked",
      },
    };

    const badge = badges[status] || badges.ACTIVE;
    const Icon = badge.icon;

    return (
      <Badge className={`${badge.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </Badge>
    );
  };

  const getBookingStatusBadge = (status) => {
    const badges = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      collected: { color: "bg-green-100 text-green-800", icon: Package },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: XCircle },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <Badge className={`${badge.color} flex items-center gap-1 text-xs`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleReject = () => {
    const reason = prompt(
      "Please provide a reason for rejecting this recipient:"
    );
    if (reason) {
      onReject(recipient.userId, reason);
    }
  };

  const handleActivate = () => {
    const reason = prompt(
      "Please provide a reason for activating this recipient:"
    );
    if (reason) {
      onActivate(recipient.userId, reason);
    }
  };

  if (!recipient) return null;

  const userStatus =
    recipient.userStatus || recipient.approvalStatus || "ACTIVE";
  const isRejected = userStatus === "REJECTED";
  const isActive = userStatus === "ACTIVE" || userStatus === "APPROVED";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <User className="w-6 h-6 text-blue-600" />
            Recipient Activity Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {recipient.fullName}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <Mail className="w-4 h-4" />
                    <span>{recipient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined{" "}
                      {new Date(recipient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(userStatus)}
                <div className="text-sm text-gray-500 mt-2">
                  Role: {recipient.role} - {recipient.subrole}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {recipient.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{recipient.phoneNumber}</span>
                </div>
              )}
              {recipient.campusLocation && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{recipient.campusLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Booking Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {bookingStats.total}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Package className="w-4 h-4" />
                Total Bookings
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {bookingStats.collected}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Collected
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {bookingStats.pending}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                Pending
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {bookingStats.cancelled + bookingStats.rejected}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <XCircle className="w-4 h-4" />
                Cancelled/Rejected
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {bookingStats.impactScore}%
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Award className="w-4 h-4" />
                Impact Score
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {bookingStats.positiveActions} positive actions
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b">
              <h4 className="font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Recent Booking Activity
              </h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {statsLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading recent activity...
                </div>
              ) : bookingStats.recentBookings.length > 0 ? (
                <div className="divide-y">
                  {bookingStats.recentBookings.map((booking, index) => (
                    <div
                      key={index}
                      className="p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {booking.listingTitle}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(booking.createdAt).toLocaleDateString()} •
                          Qty: {booking.requestedQuantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getBookingStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No recent booking activity
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              Last updated:{" "}
              {recipient.updatedAt
                ? new Date(recipient.updatedAt).toLocaleString()
                : "N/A"}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Close
              </Button>

              {isRejected ? (
                <Button
                  onClick={handleActivate}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Activate User
                </Button>
              ) : isActive ? (
                <Button
                  onClick={handleReject}
                  disabled={isLoading}
                  variant="destructive"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Reject User
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipientActivityModal;
