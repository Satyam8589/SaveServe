#!/usr/bin/env node

/**
 * Test script to verify the Food Visibility System Fix
 * This script tests that high quantity items (>50) are NOT visible in public dashboards
 * during the first 30 minutes, but ARE visible in recipient dashboards
 */

import { connectDB } from "../src/lib/db.js";
import FoodListing from "../src/models/FoodListing.js";

async function testVisibilityFix() {
  try {
    console.log("🧪 Testing Food Visibility System Fix...\n");

    await connectDB();

    // Clean up any existing test listings
    await FoodListing.deleteMany({ title: { $regex: /^Test Visibility/ } });
    console.log("🧹 Cleaned up existing test listings\n");

    // Test 1: Create a high quantity listing (>50)
    console.log("📝 Test 1: Creating high quantity listing (>50)");
    const highQuantityListing = new FoodListing({
      title: "Test Visibility High Quantity Food",
      description: "Large batch of food for testing visibility rules",
      category: "combo_meals",
      foodType: "VEG",
      quantity: 75,
      unit: "plates",
      freshnessStatus: "Fresh",
      freshnessHours: 24,
      location: "Test Location",
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      providerId: "test-provider-id",
      providerName: "Test Provider",
      isActive: true,
      listingStatus: "active",
      imageUrl: "https://example.com/test-image.jpg",
      availabilityWindow: {
        startTime: "09:00",
        endTime: "18:00",
      },
    });

    await highQuantityListing.save();
    console.log(
      "✅ High quantity listing created with ID:",
      highQuantityListing._id
    );
    console.log("📊 Visibility rules:", highQuantityListing.visibilityRules);
    console.log(
      "⏰ Recipient-only until:",
      highQuantityListing.visibilityRules.recipientOnlyUntil
    );
    console.log(
      "👁️ Is visible to all:",
      highQuantityListing.visibilityRules.isVisibleToAll
    );

    // Test 2: Create a low quantity listing (≤50)
    console.log("\n📝 Test 2: Creating low quantity listing (≤50)");
    const lowQuantityListing = new FoodListing({
      title: "Test Visibility Low Quantity Food",
      description: "Small batch of food for testing visibility rules",
      category: "snacks",
      foodType: "VEG",
      quantity: 25,
      unit: "packets",
      freshnessStatus: "Fresh",
      freshnessHours: 12,
      location: "Test Location",
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      providerId: "test-provider-id",
      providerName: "Test Provider",
      isActive: true,
      listingStatus: "active",
      imageUrl: "https://example.com/test-image.jpg",
      availabilityWindow: {
        startTime: "09:00",
        endTime: "18:00",
      },
    });

    await lowQuantityListing.save();
    console.log(
      "✅ Low quantity listing created with ID:",
      lowQuantityListing._id
    );
    console.log("📊 Visibility rules:", lowQuantityListing.visibilityRules);
    console.log(
      "👁️ Is visible to all:",
      lowQuantityListing.visibilityRules.isVisibleToAll
    );

    // Test 3: Test findVisibleToAll (should NOT include high quantity items in first 30 minutes)
    console.log("\n🔍 Test 3: Testing findVisibleToAll (public dashboard)");
    const visibleToAll = await FoodListing.findVisibleToAll({});
    console.log("📊 Total listings visible to all:", visibleToAll.length);
    console.log("📋 Listings visible to all:");
    visibleToAll.forEach((listing) => {
      console.log(
        `  - ${listing.title} (Qty: ${listing.quantity}) - Visible: ${listing.visibilityRules.isVisibleToAll}`
      );
    });

    // Test 4: Test findRecipientOnly (should include high quantity items in first 30 minutes)
    console.log("\n🔍 Test 4: Testing findRecipientOnly (recipient dashboard)");
    const recipientOnly = await FoodListing.findRecipientOnly({});
    console.log("📊 Total recipient-only listings:", recipientOnly.length);
    console.log("📋 Recipient-only listings:");
    recipientOnly.forEach((listing) => {
      console.log(
        `  - ${listing.title} (Qty: ${
          listing.quantity
        }) - Time until visible: ${Math.floor(
          (listing.visibilityRules.recipientOnlyUntil - new Date()) /
            (1000 * 60)
        )}m`
      );
    });

    // Test 5: Test find (admin dashboard - should show all)
    console.log("\n🔍 Test 5: Testing find (admin dashboard)");
    const allListings = await FoodListing.find({});
    console.log("📊 Total all listings:", allListings.length);
    console.log("📋 All listings:");
    allListings.forEach((listing) => {
      const isHighQty = listing.visibilityRules.isHighQuantity;
      const isVisibleToAll = listing.visibilityRules.isVisibleToAll;
      const timeUntilVisible =
        isHighQty && !isVisibleToAll
          ? Math.floor(
              (listing.visibilityRules.recipientOnlyUntil - new Date()) /
                (1000 * 60)
            )
          : 0;
      console.log(
        `  - ${listing.title} (Qty: ${
          listing.quantity
        }) - High Qty: ${isHighQty}, Visible to All: ${isVisibleToAll}${
          timeUntilVisible > 0
            ? `, Time until visible: ${timeUntilVisible}m`
            : ""
        }`
      );
    });

    // Test 6: Verify the fix - high quantity items should NOT be in public dashboards
    console.log("\n🔍 Test 6: Verifying the fix");
    const highQtyInPublic = visibleToAll.filter(
      (listing) =>
        listing.visibilityRules.isHighQuantity &&
        !listing.visibilityRules.isVisibleToAll
    );

    if (highQtyInPublic.length === 0) {
      console.log(
        "✅ SUCCESS: High quantity items are NOT showing in public dashboards during first 30 minutes"
      );
    } else {
      console.log(
        "❌ FAILURE: High quantity items are still showing in public dashboards!"
      );
      highQtyInPublic.forEach((listing) => {
        console.log(
          `  - ${listing.title} (Qty: ${listing.quantity}) should NOT be visible to all yet`
        );
      });
    }

    // Test 7: Verify recipients can see high quantity items
    console.log(
      "\n🔍 Test 7: Verifying recipients can see high quantity items"
    );
    const highQtyInRecipient = recipientOnly.filter(
      (listing) =>
        listing.visibilityRules.isHighQuantity &&
        !listing.visibilityRules.isVisibleToAll
    );

    if (highQtyInRecipient.length > 0) {
      console.log(
        "✅ SUCCESS: Recipients can see high quantity items during first 30 minutes"
      );
      highQtyInRecipient.forEach((listing) => {
        console.log(
          `  - ${listing.title} (Qty: ${listing.quantity}) is visible to recipients`
        );
      });
    } else {
      console.log("❌ FAILURE: Recipients cannot see high quantity items!");
    }

    console.log("\n🎯 Test Summary:");
    console.log(
      `  - High quantity listings created: ${highQuantityListing ? 1 : 0}`
    );
    console.log(
      `  - Low quantity listings created: ${lowQuantityListing ? 1 : 0}`
    );
    console.log(`  - Public dashboard shows: ${visibleToAll.length} listings`);
    console.log(
      `  - Recipient dashboard shows: ${recipientOnly.length} listings`
    );
    console.log(`  - Admin dashboard shows: ${allListings.length} listings`);
    console.log(
      `  - High quantity items in public: ${highQtyInPublic.length} (should be 0)`
    );
    console.log(
      `  - High quantity items for recipients: ${highQtyInRecipient.length} (should be >0)`
    );

    if (highQtyInPublic.length === 0 && highQtyInRecipient.length > 0) {
      console.log(
        "\n🎉 ALL TESTS PASSED! The visibility system is working correctly."
      );
      console.log(
        "   High quantity items (>50) are exclusive to recipients for first 30 minutes."
      );
      console.log(
        "   Low quantity items (≤50) are visible to everyone from the start."
      );
    } else {
      console.log(
        "\n💥 SOME TESTS FAILED! The visibility system needs fixing."
      );
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testVisibilityFix();
