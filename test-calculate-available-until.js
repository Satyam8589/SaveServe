// Test script for calculateAvailableUntil function
// This tests the automatic calculation of "Available Until" from "Available From" + "Freshness Duration"

// Helper function to calculate and format "Available Until" time
const calculateAvailableUntil = (startTime, freshnessHours) => {
  if (!startTime || !freshnessHours) return "";
  
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + freshnessHours * 60 * 60 * 1000);
  
  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  const year = endDate.getFullYear();
  const month = String(endDate.getMonth() + 1).padStart(2, '0');
  const day = String(endDate.getDate()).padStart(2, '0');
  const hours = String(endDate.getHours()).padStart(2, '0');
  const minutes = String(endDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Test cases
console.log("🧪 Testing calculateAvailableUntil function...\n");

// Test 1: Basic calculation
const test1StartTime = "2024-01-15T10:00";
const test1FreshnessHours = 24;
const test1Result = calculateAvailableUntil(test1StartTime, test1FreshnessHours);
console.log(`Test 1 - Basic 24-hour calculation:`);
console.log(`  Available From: ${test1StartTime}`);
console.log(`  Freshness Duration: ${test1FreshnessHours} hours`);
console.log(`  Available Until: ${test1Result}`);
console.log(`  Expected: 2024-01-16T10:00`);
console.log(`  ✅ ${test1Result === "2024-01-16T10:00" ? "PASS" : "FAIL"}\n`);

// Test 2: 12-hour calculation
const test2StartTime = "2024-01-15T14:30";
const test2FreshnessHours = 12;
const test2Result = calculateAvailableUntil(test2StartTime, test2FreshnessHours);
console.log(`Test 2 - 12-hour calculation:`);
console.log(`  Available From: ${test2StartTime}`);
console.log(`  Freshness Duration: ${test2FreshnessHours} hours`);
console.log(`  Available Until: ${test2Result}`);
console.log(`  Expected: 2024-01-16T02:30`);
console.log(`  ✅ ${test2Result === "2024-01-16T02:30" ? "PASS" : "FAIL"}\n`);

// Test 3: 4-hour calculation
const test3StartTime = "2024-01-15T20:15";
const test3FreshnessHours = 4;
const test3Result = calculateAvailableUntil(test3StartTime, test3FreshnessHours);
console.log(`Test 3 - 4-hour calculation:`);
console.log(`  Available From: ${test3StartTime}`);
console.log(`  Freshness Duration: ${test3FreshnessHours} hours`);
console.log(`  Available Until: ${test3Result}`);
console.log(`  Expected: 2024-01-16T00:15`);
console.log(`  ✅ ${test3Result === "2024-01-16T00:15" ? "PASS" : "FAIL"}\n`);

// Test 4: Edge case - empty inputs
const test4Result = calculateAvailableUntil("", 24);
const test5Result = calculateAvailableUntil("2024-01-15T10:00", 0);
console.log(`Test 4 - Empty start time:`);
console.log(`  Result: "${test4Result}"`);
console.log(`  ✅ ${test4Result === "" ? "PASS" : "FAIL"}`);
console.log(`Test 5 - Zero freshness hours:`);
console.log(`  Result: "${test5Result}"`);
console.log(`  ✅ ${test5Result === "" ? "PASS" : "FAIL"}\n`);

console.log("🎉 All tests completed!");
