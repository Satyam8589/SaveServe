"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RecipientActivityModal from "@/components/RecipientActivityModal";
import {
  Users,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  Filter,
  FileText,
  File,
  Image,
  Download,
  ZoomIn,
  Shield,
  Ban,
  UserMinus,
  Activity,
  TrendingUp,
  Utensils,
  Package,
  Trash2,
  MapPin,
  Calendar,
} from "lucide-react";
import DocumentViewer from "../../components/DocumentViewer";
import FoodListingModal from "../../components/FoodListingModal";

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingDocument, setViewingDocument] = useState(null);
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    approved: 0,
    rejected: 0,
    blocked: 0,
  });

  // Food management state
  const [activeTab, setActiveTab] = useState("users"); // "users", "providers", "recipients"
  const [foodListings, setFoodListings] = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  // Recipient activity modal state
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [foodStats, setFoodStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0,
  });
  const [foodFilter, setFoodFilter] = useState("all");
  const [foodSearchTerm, setFoodSearchTerm] = useState("");

  // Impact scores state
  const [impactScores, setImpactScores] = useState({});
  const [impactScoresLoading, setImpactScoresLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (isLoaded && user) {
      const userRole = user.publicMetadata?.mainRole;
      if (userRole !== "ADMIN") {
        router.push("/");
        return;
      }
      fetchUsers();
    }
  }, [isLoaded, user, router]);

  // Fetch food listings when providers tab is active
  useEffect(() => {
    if (activeTab === "providers") {
      fetchFoodListings();
    }
  }, [activeTab, foodFilter, foodSearchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        setAllUsers(users);

        // Calculate user statistics
        const stats = {
          total: users.length,
          active: users.filter(
            (u) => (u.userStatus || u.approvalStatus) === "ACTIVE"
          ).length,
          approved: users.filter(
            (u) => (u.userStatus || u.approvalStatus) === "APPROVED"
          ).length,
          rejected: users.filter(
            (u) => (u.userStatus || u.approvalStatus) === "REJECTED"
          ).length,
          blocked: users.filter((u) => u.userStatus === "BLOCKED").length,
        };
        setUserStats(stats);

        // Fetch impact scores for recipients
        const recipients = users.filter((u) => u.role === "RECIPIENT");
        if (recipients.length > 0) {
          fetchImpactScores(recipients);
        }
      } else {
        setError("Failed to fetch users");
      }
    } catch (err) {
      setError("Error fetching users");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // New user status management functions
  const handleUserAction = async (userId, action, reason = "") => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/user-status/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason:
            reason ||
            `${action.charAt(0).toUpperCase() + action.slice(1)}ed by admin`,
          adminUserId: user.id,
        }),
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
        setSelectedUser(null);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${action} user`);
      }
    } catch (err) {
      setError(`Error ${action}ing user`);
      console.error("Error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (userId, reason) =>
    handleUserAction(userId, "approve", reason);
  const handleReject = (userId, reason) =>
    handleUserAction(userId, "reject", reason);
  const handleBlock = (userId, reason) =>
    handleUserAction(userId, "block", reason);
  const handleUnblock = (userId, reason) =>
    handleUserAction(userId, "unblock", reason);
  const handleActivate = (userId, reason) =>
    handleUserAction(userId, "activate", reason);

  // Special handler for reactivating rejected users
  const handleReactivateRejected = async (userId, reason) => {
    const confirmReason =
      reason || prompt("Reason for reactivating this user:");
    if (confirmReason) {
      await handleUserAction(userId, "activate", confirmReason);
    }
  };

  // Recipient activity handlers
  const handleViewRecipientActivity = (recipient) => {
    setSelectedRecipient(recipient);
    setIsRecipientModalOpen(true);
  };

  const handleCloseRecipientModal = () => {
    setIsRecipientModalOpen(false);
    setSelectedRecipient(null);
  };

  const handleRecipientReject = async (userId, reason) => {
    await handleUserAction(userId, "reject", reason);
    // Refresh the user list
    fetchUsers();
  };

  const handleRecipientActivate = async (userId, reason) => {
    await handleUserAction(userId, "activate", reason);
    // Refresh the user list
    fetchUsers();
  };

  // Fetch impact scores for recipients
  const fetchImpactScores = async (recipients) => {
    setImpactScoresLoading(true);
    const scores = {};

    try {
      // Fetch impact scores for all recipients in parallel
      const promises = recipients.map(async (user) => {
        try {
          const response = await fetch(
            `/api/users/impact-score/${user.userId}`
          );
          if (response.ok) {
            const data = await response.json();
            return { userId: user.userId, score: data.data.impactScore };
          }
          return { userId: user.userId, score: null };
        } catch (error) {
          console.error(
            `Error fetching impact score for ${user.userId}:`,
            error
          );
          return { userId: user.userId, score: null };
        }
      });

      const results = await Promise.all(promises);
      results.forEach(({ userId, score }) => {
        scores[userId] = score;
      });

      setImpactScores(scores);
    } catch (error) {
      console.error("Error fetching impact scores:", error);
    } finally {
      setImpactScoresLoading(false);
    }
  };

  // Food listing modal handlers
  const handleCloseFoodModal = () => {
    setSelectedListing(null);
  };

  // Food management functions
  const fetchFoodListings = async () => {
    try {
      setFoodLoading(true);
      const params = new URLSearchParams({
        status: foodFilter,
        search: foodSearchTerm,
        limit: "50",
      });

      const response = await fetch(`/api/admin/food-listings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFoodListings(data.listings || []);
        setFoodStats(
          data.stats || { total: 0, active: 0, inactive: 0, expired: 0 }
        );
      } else {
        setError("Failed to fetch food listings");
      }
    } catch (err) {
      setError("Error fetching food listings");
      console.error("Error:", err);
    } finally {
      setFoodLoading(false);
    }
  };

  const handleDeleteListing = async (listingId, reason) => {
    try {
      setActionLoading(true);
      const params = new URLSearchParams({
        id: listingId,
        adminId: user.id,
        reason: reason || "Inappropriate or incorrect listing",
      });

      const response = await fetch(`/api/admin/food-listings?${params}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchFoodListings(); // Refresh the list
        setSelectedListing(null);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete listing");
      }
    } catch (err) {
      setError("Error deleting listing");
      console.error("Error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = allUsers.filter((user) => {
    // Handle both new userStatus and legacy approvalStatus
    const userCurrentStatus =
      user.userStatus || user.approvalStatus || "ACTIVE";
    const matchesFilter = filter === "ALL" || userCurrentStatus === filter;
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      APPROVED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xl">Loading Admin Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Manage users, providers, and food listings
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab("providers")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "providers"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Package className="w-5 h-5 inline mr-2" />
              Provider Food Management
            </button>
            <button
              onClick={() => setActiveTab("recipients")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "recipients"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Utensils className="w-5 h-5 inline mr-2" />
              Recipient Activity
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "users" && (
        <>
          {/* Enhanced Stats Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              {/* Total Users */}
              <button
                onClick={() => setFilter("ALL")}
                className={`bg-white rounded-lg shadow p-6 text-left transition-all hover:shadow-lg hover:scale-105 ${
                  filter === "ALL" ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userStats.total}
                    </p>
                  </div>
                </div>
              </button>

              {/* Active Users */}
              <button
                onClick={() => setFilter("ACTIVE")}
                className={`bg-white rounded-lg shadow p-6 text-left transition-all hover:shadow-lg hover:scale-105 ${
                  filter === "ACTIVE" ? "ring-2 ring-green-500" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userStats.active}
                    </p>
                  </div>
                </div>
              </button>

              {/* Approved Users */}
              <button
                onClick={() => setFilter("APPROVED")}
                className={`bg-white rounded-lg shadow p-6 text-left transition-all hover:shadow-lg hover:scale-105 ${
                  filter === "APPROVED" ? "ring-2 ring-emerald-500" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Approved
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userStats.approved}
                    </p>
                  </div>
                </div>
              </button>

              {/* Rejected Users */}
              <button
                onClick={() => setFilter("REJECTED")}
                className={`bg-white rounded-lg shadow p-6 text-left transition-all hover:shadow-lg hover:scale-105 ${
                  filter === "REJECTED" ? "ring-2 ring-red-500" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Rejected
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userStats.rejected}
                    </p>
                  </div>
                </div>
              </button>

              {/* Blocked Users */}
              <button
                onClick={() => setFilter("BLOCKED")}
                className={`bg-white rounded-lg shadow p-6 text-left transition-all hover:shadow-lg hover:scale-105 ${
                  filter === "BLOCKED" ? "ring-2 ring-gray-500" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Ban className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Blocked</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userStats.blocked}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ALL">All Users ({userStats.total})</option>
                      <option value="ACTIVE">
                        Active ({userStats.active})
                      </option>
                      <option value="APPROVED">
                        Approved ({userStats.approved})
                      </option>
                      <option value="REJECTED">
                        Rejected ({userStats.rejected})
                      </option>
                      <option value="BLOCKED">
                        Blocked ({userStats.blocked})
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.role}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            {user.subrole}
                            {user.verificationDocuments &&
                              user.verificationDocuments.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                    <FileText className="w-3 h-3" />
                                    {user.verificationDocuments.length}
                                  </span>
                                  {(() => {
                                    const reviewedCount =
                                      user.verificationDocuments.filter(
                                        (doc) => doc.viewedByAdmin
                                      ).length;
                                    const totalCount =
                                      user.verificationDocuments.length;
                                    const isFullyReviewed =
                                      reviewedCount === totalCount;

                                    return (
                                      <span
                                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                                          isFullyReviewed
                                            ? "bg-green-100 text-green-800"
                                            : reviewedCount > 0
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                      >
                                        {isFullyReviewed ? (
                                          <>
                                            <svg
                                              className="w-3 h-3"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                            Reviewed
                                          </>
                                        ) : reviewedCount > 0 ? (
                                          <>
                                            <svg
                                              className="w-3 h-3"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                            {reviewedCount}/{totalCount}
                                          </>
                                        ) : (
                                          <>
                                            <svg
                                              className="w-3 h-3"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                            Pending
                                          </>
                                        )}
                                      </span>
                                    );
                                  })()}
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.approvalStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.submittedForApprovalAt
                            ? new Date(
                                user.submittedForApprovalAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            {user.approvalStatus === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleApprove(user.userId)}
                                  disabled={actionLoading}
                                  className="text-green-600 hover:text-green-900 flex items-center gap-1 disabled:opacity-50"
                                >
                                  <UserCheck className="w-4 h-4" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt(
                                      "Please provide a reason for rejection:"
                                    );
                                    if (reason)
                                      handleReject(user.userId, reason);
                                  }}
                                  disabled={actionLoading}
                                  className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50"
                                >
                                  <UserX className="w-4 h-4" />
                                  Reject
                                </button>
                              </>
                            )}
                            {(user.userStatus === "REJECTED" ||
                              user.approvalStatus === "REJECTED") && (
                              <button
                                onClick={() =>
                                  handleReactivateRejected(user.userId)
                                }
                                disabled={actionLoading}
                                className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1 disabled:opacity-50 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200"
                              >
                                <UserCheck className="w-4 h-4" />
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No users found
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "No users match the current filter."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User Detail Modal */}
          {selectedUser && (
            <UserDetailModal
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onApprove={handleApprove}
              onReject={handleReject}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              onActivate={handleActivate}
              actionLoading={actionLoading}
              onViewDocument={setViewingDocument}
              onRefreshUsers={fetchUsers}
            />
          )}

          {/* Document Viewer */}
          {viewingDocument && (
            <DocumentViewer
              document={viewingDocument}
              onClose={() => {
                console.log("Closing document viewer");
                setViewingDocument(null);
              }}
            />
          )}

          {/* Recipient Activity Modal */}
          {isRecipientModalOpen && selectedRecipient && (
            <RecipientActivityModal
              isOpen={isRecipientModalOpen}
              onClose={handleCloseRecipientModal}
              recipient={selectedRecipient}
              onReject={handleRecipientReject}
              onActivate={handleRecipientActivate}
              isLoading={actionLoading}
            />
          )}
        </>
      )}

      {/* Provider Food Management Tab */}
      {activeTab === "providers" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Food Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Listings
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {foodStats.total}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {foodStats.active}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {foodStats.inactive}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {foodStats.expired}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Food Management Interface */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Food Listings Management
                </h2>
                <button
                  onClick={fetchFoodListings}
                  disabled={foodLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search listings by title, description, or location..."
                      value={foodSearchTerm}
                      onChange={(e) => setFoodSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={foodFilter}
                  onChange={(e) => setFoodFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Listings</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Food Listings Table */}
            <div className="overflow-x-auto">
              {foodLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : foodListings.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No food listings found</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Food Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {foodListings.map((listing) => (
                      <tr key={listing._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {listing.imageUrl ? (
                                <img
                                  className="h-10 w-10 rounded-lg object-cover"
                                  src={listing.imageUrl}
                                  alt={listing.title}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <Utensils className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {listing.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {listing.category} • {listing.quantity}{" "}
                                {listing.unit}
                              </div>
                              {listing.foodType && (
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                    listing.foodType === "VEG"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {listing.foodType === "VEG"
                                    ? "🌱 Veg"
                                    : "🍖 Non-Veg"}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {listing.providerId?.fullName || "Unknown Provider"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {listing.providerId?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              listing.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {listing.isActive ? "Active" : "Inactive"}
                          </span>
                          {new Date(listing.expiryTime) < new Date() && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedListing(listing)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Reason for deletion:");
                              if (reason)
                                handleDeleteListing(listing._id, reason);
                            }}
                            className="text-red-600 hover:text-red-900"
                            disabled={actionLoading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recipient Activity Tab */}
      {activeTab === "recipients" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recipient Activity Management
            </h2>
            <p className="text-gray-600 mb-4">
              View and manage recipient booking activities and account status.
            </p>
            {/* Recipients Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Impact Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers
                    .filter((user) => user.role === "RECIPIENT")
                    .map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.subrole}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.phoneNumber || "No phone"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-purple-600">
                            {impactScoresLoading ||
                            impactScores[user.userId] === undefined
                              ? "Loading..."
                              : impactScores[user.userId] !== null
                              ? `${impactScores[user.userId]}%`
                              : "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Impact Score
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(
                            user.userStatus || user.approvalStatus
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewRecipientActivity(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View Activity
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Food Listing Modal */}
      {selectedListing && (
        <FoodListingModal
          isOpen={!!selectedListing}
          onClose={handleCloseFoodModal}
          listing={selectedListing}
          onDelete={async (listingId, reason) => {
            try {
              const response = await fetch(`/api/admin/listings/${listingId}`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason }),
              });

              if (response.ok) {
                alert("Listing deleted successfully");
                handleCloseFoodModal();
                fetchFoodListings(); // Refresh the listings
              } else {
                alert("Failed to delete listing");
              }
            } catch (error) {
              console.error("Error deleting listing:", error);
              alert("Error deleting listing");
            }
          }}
          isLoading={false}
        />
      )}
    </div>
  );
}

// User Detail Modal Component
function UserDetailModal({
  user,
  onClose,
  onApprove,
  onReject,
  onBlock,
  onUnblock,
  onActivate,
  actionLoading,
  onViewDocument,
  onRefreshUsers,
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleRejectSubmit = () => {
    if (rejectionReason.trim()) {
      onReject(user.userId, rejectionReason);
      setShowRejectForm(false);
      setRejectionReason("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <p className="text-gray-900">{user.fullName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <p className="text-gray-900">{user.phoneNumber || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campus Location
              </label>
              <p className="text-gray-900">{user.campusLocation || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <p className="text-gray-900">{user.role}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-role
              </label>
              <p className="text-gray-900">{user.subrole}</p>
            </div>
            {user.organizationName && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <p className="text-gray-900">{user.organizationName}</p>
              </div>
            )}
            {user.description && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <p className="text-gray-900">{user.description}</p>
              </div>
            )}
          </div>
          {/* Verification Documents */}
          <div className="mb-6">
            {user.verificationDocuments &&
            user.verificationDocuments.length > 0 ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  Verification Documents
                  <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {user.verificationDocuments.length} document
                    {user.verificationDocuments.length !== 1 ? "s" : ""}
                  </span>
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {user.verificationDocuments.map((doc, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Document Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getDocumentIcon(doc.mimeType)}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-900 block">
                              {getDocumentTypeLabel(doc.type)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(doc.uploadedAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.mimeType?.startsWith("image/") && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                              Image
                            </span>
                          )}
                          {doc.mimeType === "application/pdf" && (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                              PDF
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Document Info */}
                      <div className="mb-4">
                        <p
                          className="text-sm text-gray-700 truncate mb-1"
                          title={doc.name}
                        >
                          📄 {doc.name}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          📊 Size: {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>

                        {/* Submission Status */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600">
                            Submitted:
                          </span>
                          {doc.viewedByAdmin ? (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Yes
                              </span>
                              {doc.viewedAt && (
                                <span className="text-xs text-gray-500">
                                  {new Date(doc.viewedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Pending Review
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Open the document viewer
                            onViewDocument(doc);

                            // Mark as viewed in background
                            setTimeout(async () => {
                              try {
                                const response = await fetch(
                                  "/api/admin/mark-document-viewed",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      userId: user.userId,
                                      documentIndex: index,
                                    }),
                                  }
                                );

                                if (response.ok) {
                                  onRefreshUsers();
                                }
                              } catch (error) {
                                console.error(
                                  "Error marking document as viewed:",
                                  error
                                );
                              }
                            }, 100);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Document
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = doc.url;
                            link.download = doc.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center shadow-sm"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Document Summary */}
                <div className="mt-4 space-y-3">
                  {/* Review Status Summary */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        📊 Review Progress
                      </span>
                      <span className="text-xs text-gray-500">
                        {
                          user.verificationDocuments.filter(
                            (doc) => doc.viewedByAdmin
                          ).length
                        }{" "}
                        of {user.verificationDocuments.length} reviewed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (user.verificationDocuments.filter(
                              (doc) => doc.viewedByAdmin
                            ).length /
                              user.verificationDocuments.length) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Review Checklist */}
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>📋 Review Checklist:</strong> Verify that all
                      documents are clear, valid, and match the user's
                      information. Look for proper identification, institutional
                      affiliation, and document authenticity.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FileText className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        No Documents Uploaded
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        This user has not uploaded any verification documents
                        yet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Status Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">
              Status Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Status
                </label>
                <div>{getStatusBadge(user.approvalStatus)}</div>
              </div>
              {user.submittedForApprovalAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Submitted
                  </label>
                  <p className="text-gray-900">
                    {new Date(user.submittedForApprovalAt).toLocaleString()}
                  </p>
                </div>
              )}
              {user.approvedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approved At
                  </label>
                  <p className="text-gray-900">
                    {new Date(user.approvedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {user.approvedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approved By
                  </label>
                  <p className="text-gray-900">{user.approvedBy}</p>
                </div>
              )}
            </div>
            {user.rejectionReason && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason
                </label>
                <p className="text-red-600 bg-red-50 p-3 rounded border">
                  {user.rejectionReason}
                </p>
              </div>
            )}
          </div>
          {/* Enhanced Actions */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              User Actions
            </h3>

            {/* Current Status Display */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Current Status:</p>
              <p className="font-semibold text-gray-900">
                {(
                  user.userStatus ||
                  user.approvalStatus ||
                  "ACTIVE"
                ).toUpperCase()}
              </p>
            </div>

            {!showRejectForm ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Approve Button */}
                <button
                  onClick={() => onApprove(user.userId, "Approved by admin")}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Approve
                </button>

                {/* Reject Button */}
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  Reject
                </button>

                {/* Block Button */}
                <button
                  onClick={() => {
                    const reason = prompt("Reason for blocking this user:");
                    if (reason) onBlock(user.userId, reason);
                  }}
                  disabled={actionLoading}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Block
                </button>

                {/* Unblock Button (only show if user is blocked) */}
                {user.userStatus === "BLOCKED" && (
                  <button
                    onClick={() => onUnblock(user.userId, "Unblocked by admin")}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Unblock
                  </button>
                )}

                {/* Activate Button */}
                <button
                  onClick={() => onActivate(user.userId, "Activated by admin")}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Activate
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejection..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleRejectSubmit}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason("");
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for document display
function getDocumentTypeLabel(type) {
  const labels = {
    ID_CARD: "Government ID Card",
    STUDENT_ID: "Student ID Card",
    STAFF_ID: "Staff ID Card",
    NGO_CERTIFICATE: "NGO Registration Certificate",
    OTHER: "Other Document",
  };
  return labels[type] || type;
}

function getDocumentIcon(mimeType) {
  if (mimeType?.startsWith("image/")) {
    return <Image className="w-4 h-4 text-blue-600" />;
  } else if (mimeType === "application/pdf") {
    return <FileText className="w-4 h-4 text-red-600" />;
  }
  return <File className="w-4 h-4 text-gray-600" />;
}

function getStatusBadge(status) {
  const badges = {
    PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    APPROVED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle },
  };

  const badge = badges[status] || badges.PENDING;
  const Icon = badge.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
    >
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}
