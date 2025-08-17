"use client";
import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useBookFoodListing } from "@/hooks/useBookings";
import {
  Bookmark,
  Loader2,
  Package,
  MapPin,
  ShoppingCart,
  X,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// --- Mock API to get full details of favorited items (replace with your actual API) ---
const fetchFavoriteListingsAPI = async (userId) => {
    console.log(`Fetching detailed favorites for user: ${userId}`);
    // In a real app, you would have a dedicated endpoint like GET /api/favorites?populate=true
    const favoriteIds = new Set(JSON.parse(localStorage.getItem("userFavorites") || "[]"));
    const allListingsResponse = await fetch('/api/food-listings'); // Assuming this endpoint exists and works
    const allListingsData = await allListingsResponse.json();

    if (allListingsData.success) {
        const favoriteItems = allListingsData.data.filter(item => favoriteIds.has(item.id));
        return { success: true, data: favoriteItems };
    }
    return { success: false, message: "Failed to fetch all listings" };
};
// --- End of Mock API ---

export default function FavoritesPage() {
    const { userId } = useAuth();
    const { user } = useUser();
    const bookFoodListingMutation = useBookFoodListing();

    const [favoriteItems, setFavoriteItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- State for managing the claim dialog ---
    const [selectedFood, setSelectedFood] = useState(null);
    const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
    const [requestedQuantity, setRequestedQuantity] = useState(1);
    const [requestMessage, setRequestMessage] = useState("");
    
    useEffect(() => {
        if (userId) {
            fetchFavorites();
        } else {
            // If there's no user, we can stop loading and show the empty state.
            setLoading(false);
            setFavoriteItems([]);
        }
    }, [userId]);
    
    const fetchFavorites = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchFavoriteListingsAPI(userId);
            if (response.success) {
                setFavoriteItems(response.data);
            } else {
                setError(response.message || "Failed to load favorites.");
            }
        } catch (err) {
            console.error("Error fetching favorites:", err);
            setError("Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };
    
    // --- Function to handle removing an item from favorites ---
    const handleRemoveFavorite = (foodId) => {
        // This would call your 'removeFromFavoritesAPI'
        let favorites = JSON.parse(localStorage.getItem("userFavorites") || "[]");
        favorites = favorites.filter(id => id !== foodId);
        localStorage.setItem("userFavorites", JSON.stringify(favorites));
        // Update the UI instantly
        setFavoriteItems(prev => prev.filter(item => item.id !== foodId));
    };

    // --- Functions to handle the claiming process ---
    const handleClaimFood = (foodItem) => {
        setSelectedFood(foodItem);
        setRequestedQuantity(1); // Reset to default
        setRequestMessage(""); // Reset to default
        setIsClaimDialogOpen(true);
    };

    const confirmClaim = async () => {
        if (!selectedFood || !userId || !user?.fullName) {
          alert("Missing required information for booking.");
          return;
        }
    
        try {
          const bookingData = {
            listingId: selectedFood.id,
            providerId: selectedFood.providerId,
            providerName: selectedFood.providerName,
            recipientId: userId,
            recipientName: user.fullName,
            requestedQuantity: requestedQuantity,
            requestMessage: requestMessage,
          };
    
          await bookFoodListingMutation.mutateAsync({ listingId: selectedFood.id, bookingData });
    
          alert("Food claimed successfully!");
          setIsClaimDialogOpen(false);
          // After claiming, remove it from favorites
          handleRemoveFavorite(selectedFood.id);
          setSelectedFood(null);
    
        } catch (error) {
          console.error('Error claiming food:', error);
          alert('Failed to claim food: ' + (error.message || 'Unknown error'));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <span className="ml-3 text-gray-300">Loading Favorites...</span>
            </div>
        );
    }
    
    if (error) {
        return <p className="text-center text-red-400">{error}</p>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-100">My Favorites</h2>
                    <p className="text-gray-400">Items you've saved for later.</p>
                </div>
                <Button
                    onClick={fetchFavorites}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 self-start sm:self-auto"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {favoriteItems.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-12 text-center">
                        <Bookmark className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                            No Favorite Foods Yet
                        </h3>
                        <p className="text-gray-400">
                            Click the bookmark icon on a food item to save it here.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favoriteItems.map(food => (
                        <Card key={food.id} className="bg-gray-800 border-gray-700 flex flex-col overflow-hidden hover:border-emerald-500/50 transition-colors">
                            <div className="h-48 bg-gray-700">
                                <img src={food.imageUrl} alt={food.title} className="w-full h-full object-cover" />
                            </div>
                            <CardContent className="p-4 flex flex-col flex-grow">
                                <h3 className="font-semibold text-gray-100 text-lg mb-2 truncate">{food.title}</h3>
                                <div className="space-y-1.5 text-sm text-gray-400">
                                    <div className="flex items-center space-x-2"><Package className="h-4 w-4 text-gray-500" /><span>{food.quantity} available</span></div>
                                    <div className="flex items-center space-x-2"><MapPin className="h-4 w-4 text-gray-500" /><span>{food.location}</span></div>
                                </div>
                                {/* --- UPDATED BUTTON CONTAINER --- */}
                                <div className="mt-auto pt-4 flex flex-col sm:flex-row lg:flex-col gap-2">
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => handleClaimFood(food)}
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Claim
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                        onClick={() => handleRemoveFavorite(food.id)}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog
                open={isClaimDialogOpen}
                onOpenChange={setIsClaimDialogOpen}
            >
                <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-gray-100">
                            Confirm Food Claim
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            You are about to claim "{selectedFood?.title}".
                        </DialogDescription>
                    </DialogHeader>

                    {selectedFood && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="requestedQuantity" className="text-gray-300">Requested Quantity</Label>
                                <input
                                id="requestedQuantity"
                                type="number"
                                min="1"
                                max={selectedFood?.quantity || 1}
                                value={requestedQuantity}
                                onChange={(e) => setRequestedQuantity(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="requestMessage" className="text-gray-300">
                                Special Instructions (Optional)
                                </Label>
                                <Textarea
                                id="requestMessage"
                                placeholder="Any special requirements or notes for the provider..."
                                className="bg-gray-700 border-gray-600 text-gray-100"
                                rows={2}
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                        variant="outline"
                        onClick={() => setIsClaimDialogOpen(false)}
                        className="border-gray-600 text-gray-300"
                        >
                        Cancel
                        </Button>
                        <Button
                        onClick={confirmClaim}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={bookFoodListingMutation.isPending}
                        >
                        {bookFoodListingMutation.isPending ? (
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                           <ShoppingCart className="h-4 w-4 mr-2" />
                        )}
                        Confirm Claim
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}