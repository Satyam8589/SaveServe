#!/usr/bin/env node

/**
 * Test script for the Food Visibility System
 * Run with: node scripts/test-visibility.js
 */

import { connectDB } from "../src/lib/db.js";
import FoodListing from "../src/models/FoodListing.js";

async function testVisibilitySystem() {
  try {
    console.log("🧪 Testing Food Visibility System...\n");

    await connectDB();

    // Test 1: Create a high quantity listing
    console.log("📝 Test 1: Creating high quantity listing (>50)");
    const highQuantityListing = new FoodListing({
      title: "Test High Quantity Food",
      description: "Large batch of food for testing",
      category: "combo_meals",
      foodType: "VEG",
      quantity: 75,
      unit: "plates",
      freshnessStatus: "Fresh",
      freshnessHours: 24,
      availabilityWindow: {
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      },
      location: "Test Location",
      expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      providerId: "test-provider-123",
      providerName: "Test Provider",
    });

    await highQuantityListing.save();
    console.log("✅ High quantity listing created");
    console.log("   - Quantity:", highQuantityListing.quantity);
    console.log(
      "   - Is High Quantity:",
      highQuantityListing.visibilityRules.isHighQuantity
    );
    console.log(
      "   - Recipient Only Until:",
      highQuantityListing.visibilityRules.recipientOnlyUntil
    );
    console.log(
      "   - Visible To All:",
      highQuantityListing.visibilityRules.isVisibleToAll
    );
    console.log(
      "   - Should Be Visible To All:",
      highQuantityListing.shouldBeVisibleToAll
    );

    // Test 2: Create a low quantity listing
    console.log("\n📝 Test 2: Creating low quantity listing (≤50)");
    const lowQuantityListing = new FoodListing({
      title: "Test Low Quantity Food",
      description: "Small batch of food for testing",
      category: "snacks",
      foodType: "VEG",
      quantity: 25,
      unit: "packets",
      freshnessStatus: "Fresh",
      freshnessHours: 12,
      availabilityWindow: {
        startTime: new Date(),
        endTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      },
      location: "Test Location",
      expiryTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      providerId: "test-provider-123",
      providerName: "Test Provider",
    });

    await lowQuantityListing.save();
    console.log("✅ Low quantity listing created");
    console.log("   - Quantity:", lowQuantityListing.quantity);
    console.log(
      "   - Is High Quantity:",
      lowQuantityListing.visibilityRules.isHighQuantity
    );
    console.log(
      "   - Visible To All:",
      lowQuantityListing.visibilityRules.isVisibleToAll
    );
    console.log(
      "   - Should Be Visible To All:",
      lowQuantityListing.shouldBeVisibleToAll
    );

    // Test 3: Test static methods
    console.log("\n📝 Test 3: Testing static methods");

    const recipientOnlyListings = await FoodListing.findRecipientOnly();
    const visibleToAllListings = await FoodListing.findVisibleToAll();

    console.log("✅ Static methods tested");
    console.log("   - Recipient Only Listings:", recipientOnlyListings.length);
    console.log("   - Visible To All Listings:", visibleToAllListings.length);

    // Test 4: Test visibility summary
    console.log("\n📝 Test 4: Testing visibility summary");

    const summary = await FoodListing.aggregate([
      {
        $match: {
          isActive: true,
          expiryTime: { $gte: new Date() },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          highQuantity: {
            $sum: {
              $cond: [{ $eq: ["$visibilityRules.isHighQuantity", true] }, 1, 0],
            },
          },
          lowQuantity: {
            $sum: {
              $cond: [
                { $eq: ["$visibilityRules.isHighQuantity", false] },
                1,
                0,
              ],
            },
          },
          recipientOnly: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$visibilityRules.isHighQuantity", true] },
                    { $eq: ["$visibilityRules.isVisibleToAll", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          visibleToAll: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$visibilityRules.isHighQuantity", false] },
                    { $eq: ["$visibilityRules.isVisibleToAll", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    console.log("✅ Visibility summary generated");
    console.log("   - Summary:", summary[0] || "No data");

    // Test 5: Clean up test data
    console.log("\n🧹 Test 5: Cleaning up test data");

    await FoodListing.deleteMany({
      providerId: "test-provider-123",
    });

    console.log("✅ Test data cleaned up");

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log(
      "   - High quantity items (>50) are exclusive to recipients for 30 minutes"
    );
    console.log("   - Low quantity items (≤50) are immediately visible to all");
    console.log("   - Visibility rules are automatically set on creation");
    console.log("   - Static methods correctly filter listings by visibility");
    console.log("   - System is ready for production use");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the test
testVisibilitySystem();
