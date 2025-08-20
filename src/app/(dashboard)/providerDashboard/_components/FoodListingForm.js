// File: /components/FoodListingForm.js
"use client";

import { useState, useRef, useEffect } from "react";
import { useCreateListing } from "@/hooks/useListings";
import { useUserProfile } from "@/hooks/useProfile";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";

const FRESHNESS_OPTIONS = [
  { value: "Fresh", hours: 24, label: "Fresh (24 hours)" },
  {
    value: "Safe to Eat for 12 hours",
    hours: 12,
    label: "Safe to Eat for 12 hours",
  },
  {
    value: "Safe to Eat for 8 hours",
    hours: 8,
    label: "Safe to Eat for 8 hours",
  },
  {
    value: "Safe to Eat for 6 hours",
    hours: 6,
    label: "Safe to Eat for 6 hours",
  },
  {
    value: "Safe to Eat for 4 hours",
    hours: 4,
    label: "Safe to Eat for 4 hours",
  },
  {
    value: "Safe to Eat for 2 hours",
    hours: 2,
    label: "Safe to Eat for 2 hours",
  },
];

const FOOD_CATEGORIES = [
  {
    value: "rice_based",
    label: "Rice Based Items",
    unit: "servings",
    examples: "Rice, Biryani, Pulao",
  },
  {
    value: "curry_gravy",
    label: "Curry/Gravy Items",
    unit: "servings",
    examples: "Dal, Sabzi, Curry",
  },
  {
    value: "bread_roti",
    label: "Bread/Roti Items",
    unit: "pieces",
    examples: "Roti, Naan, Paratha",
  },
  {
    value: "snacks",
    label: "Snacks",
    unit: "pieces",
    examples: "Samosa, Pakora, Sandwich",
  },
  {
    value: "sweets",
    label: "Sweets/Desserts",
    unit: "pieces",
    examples: "Cake, Gulab Jamun, Laddu",
  },
  {
    value: "fruits",
    label: "Fruits",
    unit: "pieces",
    examples: "Apple, Banana, Orange",
  },
  {
    value: "beverages",
    label: "Beverages",
    unit: "glasses",
    examples: "Juice, Lassi, Tea",
  },
  {
    value: "combo_meals",
    label: "Combo Meals",
    unit: "plates",
    examples: "Thali, Combo Plate",
  },
  {
    value: "other",
    label: "Other",
    unit: "units",
    examples: "Specify in description",
  },
];

export default function FoodListingForm({ onSuccess, onCancel }) {
  const { userId } = useAuth(); // Get the current user's Clerk ID
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useUserProfile();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    quantity: "",
    unit: "",
    freshnessStatus: "Fresh",
    freshnessHours: 24,
    availabilityWindow: {
      startTime: "",
      endTime: "",
    },
    location: "",
    providerName: "",
    providerId: userId || "",
    imageUrl: "",
  });

  console.log("Fetched userProfile:", userProfile);

  useEffect(() => {

    
    // This effect runs when the user profile is loaded or the user changes.
    if (userProfile) {
      // Pre-fill the form with data from the user's profile.
      setFormData((prev) => ({
        ...prev,
        providerName: userProfile.providerName || userProfile.fullName || "",
        location: userProfile.campusLocation || "",
        providerId: userId || "", // Ensure providerId is set from the authenticated user
      }));
    }
  }, [userProfile, userId]); // FIX: Dependency array ensures this runs when data is ready.

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const createListingMutation = useCreateListing();

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("availabilityWindow.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        availabilityWindow: {
          ...prev.availabilityWindow,
          [field]: value,
        },
      }));
    } else if (name === "category") {
      const selectedCategory = FOOD_CATEGORIES.find(
        (cat) => cat.value === value
      );
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        unit: selectedCategory ? selectedCategory.unit : "",
      }));
    } else if (name === "freshnessStatus") {
      const selectedOption = FRESHNESS_OPTIONS.find(
        (opt) => opt.value === value
      );
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        freshnessHours: selectedOption ? selectedOption.hours : 24,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) {
      console.log("❌ No image file to upload");
      return null;
    }

    console.log("📤 Starting image upload...");
    setUploadingImage(true);

    try {
      const uploadResult = await uploadImageToCloudinary(imageFile);
      console.log("✅ Upload successful:", uploadResult);

      if (!uploadResult || !uploadResult.url) {
        throw new Error("Upload result is missing URL");
      }

      return uploadResult.url;
    } catch (error) {
      console.error("❌ Image upload failed:", error);
      throw new Error("Failed to upload image: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const calculateExpiryTime = () => {
    if (!formData.availabilityWindow.startTime || !formData.freshnessHours) {
      return null;
    }

    const startTime = new Date(formData.availabilityWindow.startTime);
    const expiryTime = new Date(
      startTime.getTime() + formData.freshnessHours * 60 * 60 * 1000
    );
    return expiryTime;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🚀 Form submission started");
    console.log("📝 Initial form data:", formData);
    console.log("🖼️ Image file present:", !!imageFile);

    try {
      let finalImageUrl = formData.imageUrl || "";

      // Upload new image if selected
      if (imageFile) {
        console.log("📤 Uploading image...");
        const uploadedUrl = await uploadImage();

        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
          console.log("✅ Final image URL:", finalImageUrl);
        } else {
          console.log("⚠️ Image upload returned no URL");
        }
      } else {
        console.log("ℹ️ No image selected, using existing URL:", finalImageUrl);
      }

      // Calculate expiry time
      const expiryTime = calculateExpiryTime();
      if (!expiryTime) {
        throw new Error(
          "Cannot calculate expiry time. Please check availability start time."
        );
      }

      // ✅ CRITICAL: Ensure imageUrl is always included, even if empty
      const listingPayload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        quantity: parseInt(formData.quantity, 10),
        unit: formData.unit,
        freshnessStatus: formData.freshnessStatus,
        freshnessHours: formData.freshnessHours,
        availabilityWindow: formData.availabilityWindow,
        location: formData.location,
        providerId: formData.providerId,
        providerName: formData.providerName,
        imageUrl: finalImageUrl, // ✅ Always include imageUrl
        expiryTime: expiryTime.toISOString(),
        bookedBy: [],
        remainingQuantity: parseInt(formData.quantity, 10),
        isActive: true,
      };

      console.log("📦 Final payload being sent to API:");
      console.log("🔍 imageUrl in payload:", listingPayload.imageUrl);
      console.log("📋 Full payload:", JSON.stringify(listingPayload, null, 2));

      const result = await createListingMutation.mutateAsync(listingPayload);
      console.log("✅ API response:", result);

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        quantity: "",
        unit: "",
        freshnessStatus: "Fresh",
        freshnessHours: 24,
        availabilityWindow: {
          startTime: "",
          endTime: "",
        },
        location: "",
        providerId: "temp-provider-id",
        providerName: "Sample Provider",
        imageUrl: "",
      });
      setImageFile(null);
      setImagePreview(null);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("❌ Failed to create listing:", error);
      alert("Failed to create listing: " + error.message);
    }
  };

  const formatDateTimeLocal = (date) => {
    const now = new Date(date || Date.now());
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const selectedCategory = FOOD_CATEGORIES.find(
    (cat) => cat.value === formData.category
  );

  if (isProfileLoading) {
    return <div>Loading user information...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center">
          <span className="bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text text-transparent mr-3">
            🍽️
          </span>
          Create Food Listing
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-orange-400 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Food Image (Optional)
          </label>

          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="space-y-2">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <p className="text-gray-400">Click to upload food image</p>
                <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Choose Image
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Use regular img tag for base64 data URLs */}
              <img
                src={imagePreview}
                alt="Food preview"
                className="w-full h-48 object-cover rounded-lg"
                style={{ maxWidth: "100%", height: "192px" }}
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Rest of your form fields remain the same */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Food Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 transition-colors"
              placeholder="e.g., Fresh Chicken Biryani"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Food Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="">Select Category</option>
              {FOOD_CATEGORIES.map((category) => (
                <option
                  key={category.value}
                  value={category.value}
                  className="bg-gray-700"
                >
                  {category.label}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <p className="text-xs text-gray-400 mt-1">
                Examples: {selectedCategory.examples}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Quantity *
            </label>
            <div className="flex">
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                min="1"
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 transition-colors"
                placeholder="10"
              />
              <div className="px-4 py-3 bg-gray-600 border border-gray-600 border-l-0 rounded-r-lg text-gray-300 flex items-center">
                {formData.unit || "units"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Freshness Duration *
            </label>
            <select
              name="freshnessStatus"
              value={formData.freshnessStatus}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              {FRESHNESS_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-gray-700"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 transition-colors"
            placeholder="Additional details about the food, ingredients, spice level, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Pickup Location *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location} // This value is now controlled by the state
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 transition-colors"
            placeholder="e.g., Main Campus Canteen, Ground Floor"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Available From *
            </label>
            <input
              type="datetime-local"
              name="availabilityWindow.startTime"
              value={formData.availabilityWindow.startTime}
              onChange={handleInputChange}
              required
              min={formatDateTimeLocal()}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Available Until *
            </label>
            <input
              type="datetime-local"
              name="availabilityWindow.endTime"
              value={formData.availabilityWindow.endTime}
              onChange={handleInputChange}
              required
              min={formData.availabilityWindow.startTime}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Expiry Time Preview */}
        {formData.availabilityWindow.startTime && formData.freshnessHours && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-amber-400 font-medium mb-2">
              📅 Calculated Expiry Time
            </h4>
            <p className="text-gray-300">
              This food will expire on:{" "}
              <span className="font-medium text-white">
                {calculateExpiryTime()?.toLocaleString()}
              </span>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Based on availability start time + freshness duration (
              {formData.freshnessHours} hours)
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createListingMutation.isPending || uploadingImage}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-orange-500 text-white rounded-lg hover:from-emerald-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {createListingMutation.isPending || uploadingImage ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {uploadingImage ? "Uploading Image..." : "Creating..."}
              </span>
            ) : (
              "Create Listing"
            )}
          </button>
        </div>

        {createListingMutation.isError && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-400 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {createListingMutation.error?.message ||
                "Failed to create listing"}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
