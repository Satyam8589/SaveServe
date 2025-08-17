"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
// NEW: More icons imported for a richer UI
import { 
  Bell, Eye, Loader2, AlertCircle, Trash2, XCircle, CheckCircle2,
  UtensilsCrossed, Flame, BellRing, UserPlus, Slash
} from "lucide-react"; 
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// (Helper function - no changes)
const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
};

// NEW: A configuration object to map notification types to icons and colors
const notificationConfig = {
  'new-food':     { Icon: UtensilsCrossed, color: 'text-sky-400',       bgColor: 'bg-sky-900/50' },
  'urgent':       { Icon: Flame,           color: 'text-red-400',        bgColor: 'bg-red-900/50' },
  'reminder':     { Icon: BellRing,        color: 'text-amber-400',      bgColor: 'bg-amber-900/50' },
  'confirmation': { Icon: CheckCircle2,    color: 'text-emerald-400',    bgColor: 'bg-emerald-900/50' },
  'request':      { Icon: UserPlus,        color: 'text-indigo-400',     bgColor: 'bg-indigo-900/50' },
  'rejection':    { Icon: XCircle,         color: 'text-rose-400',       bgColor: 'bg-rose-900/50' },
  'cancellation': { Icon: Slash,           color: 'text-gray-400',       bgColor: 'bg-gray-700/50' },
  default:        { Icon: Bell,            color: 'text-gray-400',       bgColor: 'bg-gray-700/50' }
};

const getNotificationConfig = (type) => notificationConfig[type] || notificationConfig.default;


export default function NotificationsPage() {
    // (State and data fetching logic - no changes)
    const { user, isLoaded } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [prefs, setPrefs] = useState({
        "new-food": true, "urgent": true, "reminder": true, "confirmation": true,
        "request": true, "cancellation": true, "rejection": true,
    });

    useEffect(() => {
        if (!isLoaded || !user) {
            setIsLoading(false);
            if (!user) setError("Please sign in to view notifications.");
            return;
        }
        const fetchNotifications = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [listingsRes, bookingsRes] = await Promise.all([
                    fetch('/api/listings'),
                    fetch(`/api/bookings?userId=${user.id}&role=all`)
                ]);
                if (!listingsRes.ok || !bookingsRes.ok) throw new Error('Failed to fetch data from the server.');
                const listingsData = await listingsRes.json();
                const bookingsData = await bookingsRes.json();
                const combinedNotifications = [];

                if (listingsData.success && Array.isArray(listingsData.data)) {
                    listingsData.data.forEach(listing => {
                         const timeSinceCreation = Date.now() - new Date(listing.createdAt).getTime();
                         if (timeSinceCreation < 24 * 60 * 60 * 1000) {
                            combinedNotifications.push({ id: `listing-${listing._id}`, title: 'New Food Available', message: `${listing.title} at ${listing.location}`, time: getTimeAgo(listing.createdAt), createdAt: new Date(listing.createdAt), type: 'new-food', urgent: getListingStatus(listing.expiryTime).text === 'Urgent', read: false });
                         }
                        if (getListingStatus(listing.expiryTime).text === 'Urgent') {
                            combinedNotifications.push({ id: `urgent-${listing._id}`, title: 'Food Expiring Soon', message: `${listing.title} is expiring soon`, time: getTimeAgo(listing.createdAt), createdAt: new Date(listing.createdAt), type: 'urgent', urgent: true, read: false });
                        }
                    });
                }
                
                if (bookingsData.success && Array.isArray(bookingsData.data)) {
                    bookingsData.data.forEach(booking => {
                        const foodTitle = booking.listingId?.title || 'a food item';
                        if (booking.userRole === 'recipient') {
                            switch (booking.status) {
                                case 'approved':
                                    combinedNotifications.push({ id: `booking-conf-${booking._id}`, title: 'Claim Confirmed', message: `Your claim for ${foodTitle} is confirmed.`, time: getTimeAgo(booking.approvedAt || booking.updatedAt), createdAt: new Date(booking.approvedAt || booking.updatedAt), type: 'confirmation', urgent: false, read: false });
                                    if (booking.timeUntilPickup && booking.timeUntilPickup < (2 * 60 * 60 * 1000)) {
                                        combinedNotifications.push({ id: `reminder-${booking._id}`, title: 'Pickup Reminder', message: `Don't forget to pickup ${foodTitle} soon!`, time: getTimeAgo(booking.updatedAt), createdAt: new Date(booking.updatedAt), type: 'reminder', urgent: true, read: false });
                                    }
                                    break;
                                case 'cancelled':
                                    combinedNotifications.push({ id: `booking-cancel-${booking._id}`, title: 'Claim Cancelled', message: `Your claim for ${foodTitle} was cancelled.`, time: getTimeAgo(booking.cancelledAt || booking.updatedAt), createdAt: new Date(booking.cancelledAt || booking.updatedAt), type: 'cancellation', urgent: false, read: false });
                                    break;
                                case 'rejected':
                                    combinedNotifications.push({ id: `booking-reject-${booking._id}`, title: 'Claim Rejected', message: `Unfortunately, your claim for ${foodTitle} was rejected.`, time: getTimeAgo(booking.rejectedAt || booking.updatedAt), createdAt: new Date(booking.rejectedAt || booking.updatedAt), type: 'rejection', urgent: false, read: false });
                                    break;
                            }
                        } else if (booking.userRole === 'provider') {
                            switch (booking.status) {
                                case 'pending':
                                     combinedNotifications.push({ id: `booking-req-${booking._id}`, title: 'New Claim Request', message: `You have a new claim request for ${foodTitle}.`, time: getTimeAgo(booking.createdAt), createdAt: new Date(booking.createdAt), type: 'request', urgent: true, read: false });
                                    break;
                                case 'cancelled':
                                    combinedNotifications.push({ id: `prov-booking-cancel-${booking._id}`, title: 'Claim Cancelled', message: `The claim for your item "${foodTitle}" has been cancelled.`, time: getTimeAgo(booking.cancelledAt || booking.updatedAt), createdAt: new Date(booking.cancelledAt || booking.updatedAt), type: 'cancellation', urgent: false, read: false });
                                    break;
                            }
                        }
                    });
                }
                
                const uniqueNotifications = Array.from(new Map(combinedNotifications.map(item => [item.id, item])).values());
                uniqueNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setNotifications(uniqueNotifications);
            } catch (err) {
                console.error("Notification fetch error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        const getListingStatus = (expiryTimeString) => {
            const now = new Date();
            const expiryTime = new Date(expiryTimeString);
            const totalMinutes = Math.floor((expiryTime - now) / (1000 * 60));
            if (totalMinutes <= 60) return { text: "Urgent" };
            return { text: "Active" };
        };
        fetchNotifications();
    }, [user, isLoaded]);

    const handlePrefChange = (prefKey, value) => setPrefs(prev => ({ ...prev, [prefKey]: value }));
    const handleMarkAsRead = (id) => setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    const handleMarkAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const handleDeleteNotification = (idToDelete) => setNotifications(prev => prev.filter(n => n.id !== idToDelete));
    const handleClearAll = () => setNotifications([]);
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
    const filteredNotifications = useMemo(() => notifications.filter(n => prefs[n.type] !== false), [notifications, prefs]);

    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-12 w-12 text-gray-400 animate-spin" /></div>;
        if (error) return <Card className="bg-red-900/20 border-red-500/30"><CardContent className="p-6 text-center text-red-300 flex flex-col items-center"><AlertCircle className="h-12 w-12 mb-4" /><h3 className="text-lg font-semibold mb-2">Error</h3><p>{error}</p></CardContent></Card>;
        if (filteredNotifications.length === 0) return <Card className="bg-gray-800 border-gray-700"><CardContent className="p-12 text-center"><Bell className="h-16 w-16 text-gray-500 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-300">No New Notifications</h3><p className="text-gray-400">You're all caught up!</p></CardContent></Card>;

        return (
            // NEW: Redesigned notification list
            <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                    const config = getNotificationConfig(notification.type);
                    return (
                        <div key={notification.id} className={`group relative flex items-start gap-x-4 p-4 rounded-lg bg-gray-800/50 border border-transparent hover:border-gray-700 hover:bg-gray-800 transition-all ${notification.read ? "opacity-60" : ""}`}>
                            {/* Icon with colored background */}
                            <div className={`flex h-12 w-12 flex-none items-center justify-center rounded-lg ${config.bgColor}`}>
                                <config.Icon className={`h-6 w-6 ${config.color}`} aria-hidden="true" />
                            </div>

                            {/* Text Content */}
                            <div className="flex-auto">
                                <p className="font-semibold text-gray-100">{notification.title}</p>
                                <p className="mt-1 text-sm text-gray-400">{notification.message}</p>
                                <p className="mt-2 text-xs text-gray-500">{notification.time}</p>
                            </div>
                            
                            {/* Hover Actions */}
                            <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {!notification.read && (
                                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-100 h-8 w-8 bg-gray-900/50 hover:bg-gray-700" onClick={() => handleMarkAsRead(notification.id)} aria-label="Mark as read">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400 h-8 w-8 bg-gray-900/50 hover:bg-gray-700" onClick={() => handleDeleteNotification(notification.id)} aria-label="Delete notification">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 p-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-100">Notifications {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>}</h2>
                    <p className="text-gray-400">Stay updated on food availability and your claims</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="border-gray-600 text-gray-300" onClick={handleMarkAllRead} disabled={unreadCount === 0 || isLoading}>Mark All Read</Button>
                    <Button variant="destructive" onClick={handleClearAll} disabled={notifications.length === 0 || isLoading}><Trash2 className="h-4 w-4 mr-2" />Clear All</Button>
                </div>
            </div>

            {/* (Preferences card - no major changes, just ensuring it looks good) */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-gray-100">Notification Preferences</CardTitle>
                    <CardDescription className="text-gray-400">Customize which notifications you see below</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex items-center justify-between"><div className="pr-4"><Label className="text-gray-300">New Food Available</Label><p className="text-sm text-gray-400">Alerts when new food is listed</p></div><Switch checked={prefs['new-food']} onCheckedChange={(val) => handlePrefChange('new-food', val)} /></div>
                    <div className="flex items-center justify-between"><div className="pr-4"><Label className="text-gray-300">Urgent Food Alerts</Label><p className="text-sm text-gray-400">Alerts for food expiring soon</p></div><Switch checked={prefs['urgent']} onCheckedChange={(val) => handlePrefChange('urgent', val)} /></div>
                    <div className="flex items-center justify-between"><div className="pr-4"><Label className="text-gray-300">Pickup Reminders</Label><p className="text-sm text-gray-400">Reminders for confirmed pickups</p></div><Switch checked={prefs['reminder']} onCheckedChange={(val) => handlePrefChange('reminder', val)} /></div>
                    <div className="flex items-center justify-between"><div className="pr-4"><Label className="text-gray-300">Claim Confirmations</Label><p className="text-sm text-gray-400">Updates when claims are approved</p></div><Switch checked={prefs['confirmation']} onCheckedChange={(val) => handlePrefChange('confirmation', val)} /></div>
                    <div className="flex items-center justify-between"><div className="pr-4"><Label className="text-gray-300">New Claim Requests</Label><p className="text-sm text-gray-400">(Providers) Alerts for new requests</p></div><Switch checked={prefs['request']} onCheckedChange={(val) => handlePrefChange('request', val)} /></div>
                    <div className="flex items-center justify-between"><div className="pr-4"><Label className="text-gray-300">Claim Rejections</Label><p className="text-sm text-gray-400">Alerts when your claim is rejected</p></div><Switch checked={prefs['rejection']} onCheckedChange={(val) => handlePrefChange('rejection', val)} /></div>
                    <div className="flex items-center justify-between"><div className="pr-4"><Label className="text-gray-300">Claim Cancellations</Label><p className="text-sm text-gray-400">Alerts when a claim is cancelled</p></div><Switch checked={prefs['cancellation']} onCheckedChange={(val) => handlePrefChange('cancellation', val)} /></div>
                </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle className="text-gray-100">Recent Notifications</CardTitle></CardHeader>
                <CardContent>{renderContent()}</CardContent>
            </Card>
        </div>
    );
}