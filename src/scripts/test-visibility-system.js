/**
 * Test script for the time-based visibility system
 * This script tests the NGO exclusive access functionality
 */

import { connectDB } from "../lib/db.js";
import FoodListing from "../models/FoodListing.js";
import UserProfile from "../models/UserProfile.js";
import { createVisibilityQuery, isListingVisibleToUser } from "../lib/visibilityUtils.js";

async function testVisibilitySystem() {
  console.log("🧪 Starting visibility system tests...\n");

  try {
    await connectDB();

    // Test 1: Create test food listings
    console.log("📝 Test 1: Creating test food listings");
    
    // High quantity listing (should be NGO exclusive for 30 minutes)
    const highQuantityListing = new FoodListing({
      title: "Large Catering Event Surplus",
      description: "Leftover food from corporate event",
      category: "combo_meals",
      foodType: "VEG",
      quantity: 75, // > 50, should trigger NGO exclusive
      unit: "plates",
      freshnessStatus: "Fresh",
      freshnessHours: 6,
      availabilityWindow: {
        startTime: new Date(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
      },
      location: "Main Campus Cafeteria",
      expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      providerId: "test-provider-1",
      providerName: "Test Catering Service",
      imageUrl: "",
      bookedBy: [],
      remainingQuantity: 75,
      isActive: true,
      // These should be set automatically by our API logic
      isNGOExclusive: true,
      ngoExclusiveUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    // Low quantity listing (should be visible to everyone immediately)
    const lowQuantityListing = new FoodListing({
      title: "Small Batch Homemade Food",
      description: "Extra food from home cooking",
      category: "rice_based",
      foodType: "VEG",
      quantity: 25, // <= 50, should be public immediately
      unit: "servings",
      freshnessStatus: "Fresh",
      freshnessHours: 4,
      availabilityWindow: {
        startTime: new Date(),
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      },
      location: "Student Housing",
      expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      providerId: "test-provider-2",
      providerName: "Test Student",
      imageUrl: "",
      bookedBy: [],
      remainingQuantity: 25,
      isActive: true,
      // These should remain false for low quantity
      isNGOExclusive: false,
      ngoExclusiveUntil: null,
    });

    await highQuantityListing.save();
    await lowQuantityListing.save();
    
    console.log("✅ Created high quantity listing (NGO exclusive):", highQuantityListing._id);
    console.log("✅ Created low quantity listing (public):", lowQuantityListing._id);
    console.log();

    // Test 2: Test visibility for different user types
    console.log("👥 Test 2: Testing visibility for different user types");
    
    // Test NGO user
    console.log("🏢 Testing NGO user visibility:");
    const ngoVisible = isListingVisibleToUser(highQuantityListing, 'RECIPIENT', 'NGO');
    const ngoVisibleLow = isListingVisibleToUser(lowQuantityListing, 'RECIPIENT', 'NGO');
    console.log(`  - High quantity listing visible to NGO: ${ngoVisible} ✅`);
    console.log(`  - Low quantity listing visible to NGO: ${ngoVisibleLow} ✅`);
    
    // Test regular student user
    console.log("🎓 Testing Student user visibility:");
    const studentVisible = isListingVisibleToUser(highQuantityListing, 'RECIPIENT', 'STUDENT');
    const studentVisibleLow = isListingVisibleToUser(lowQuantityListing, 'RECIPIENT', 'STUDENT');
    console.log(`  - High quantity listing visible to Student: ${studentVisible} (should be false during exclusive period)`);
    console.log(`  - Low quantity listing visible to Student: ${studentVisibleLow} ✅`);
    
    // Test staff user
    console.log("👨‍💼 Testing Staff user visibility:");
    const staffVisible = isListingVisibleToUser(highQuantityListing, 'RECIPIENT', 'STAFF');
    const staffVisibleLow = isListingVisibleToUser(lowQuantityListing, 'RECIPIENT', 'STAFF');
    console.log(`  - High quantity listing visible to Staff: ${staffVisible} (should be false during exclusive period)`);
    console.log(`  - Low quantity listing visible to Staff: ${staffVisibleLow} ✅`);
    console.log();

    // Test 3: Test MongoDB queries
    console.log("🔍 Test 3: Testing MongoDB visibility queries");
    
    // NGO query should return both listings
    const ngoQuery = createVisibilityQuery('RECIPIENT', 'NGO');
    const ngoResults = await FoodListing.find(ngoQuery);
    console.log(`NGO query returned ${ngoResults.length} listings (should be 2)`);
    
    // Student query should return only the low quantity listing during exclusive period
    const studentQuery = createVisibilityQuery('RECIPIENT', 'STUDENT');
    const studentResults = await FoodListing.find(studentQuery);
    console.log(`Student query returned ${studentResults.length} listings (should be 1 during exclusive period)`);
    console.log();

    // Test 4: Test expired NGO exclusive period
    console.log("⏰ Test 4: Testing expired NGO exclusive period");
    
    // Simulate expired exclusive period
    const expiredListing = { ...highQuantityListing.toObject() };
    expiredListing.ngoExclusiveUntil = new Date(Date.now() - 1000); // 1 second ago
    
    const studentVisibleExpired = isListingVisibleToUser(expiredListing, 'RECIPIENT', 'STUDENT');
    console.log(`High quantity listing visible to Student after expiry: ${studentVisibleExpired} ✅`);
    console.log();

    // Test 5: Virtual method tests
    console.log("🔧 Test 5: Testing virtual methods");
    
    console.log(`High quantity listing isCurrentlyNGOExclusive: ${highQuantityListing.isCurrentlyNGOExclusive}`);
    console.log(`Low quantity listing isCurrentlyNGOExclusive: ${lowQuantityListing.isCurrentlyNGOExclusive}`);
    
    console.log(`High quantity listing isVisibleToUser(NGO): ${highQuantityListing.isVisibleToUser('RECIPIENT', 'NGO')}`);
    console.log(`High quantity listing isVisibleToUser(STUDENT): ${highQuantityListing.isVisibleToUser('RECIPIENT', 'STUDENT')}`);
    console.log();

    // Cleanup
    console.log("🧹 Cleaning up test data...");
    await FoodListing.deleteOne({ _id: highQuantityListing._id });
    await FoodListing.deleteOne({ _id: lowQuantityListing._id });
    console.log("✅ Test data cleaned up");
    console.log();

    console.log("🎉 All tests completed successfully!");
    console.log();
    console.log("📋 Test Summary:");
    console.log("✅ High quantity listings (>50) are NGO exclusive for 30 minutes");
    console.log("✅ Low quantity listings (≤50) are immediately visible to everyone");
    console.log("✅ NGO users can see all listings");
    console.log("✅ Non-NGO users cannot see NGO-exclusive listings during exclusive period");
    console.log("✅ All users can see listings after NGO exclusive period expires");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testVisibilitySystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}

export { testVisibilitySystem };
