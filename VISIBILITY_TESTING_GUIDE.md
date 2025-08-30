# Food Post Visibility System - Testing Guide

This guide explains how to test the new time-based visibility system for food posts.

## System Overview

The system implements the following rules:
- **High quantity posts (>50 servings)**: Visible only to NGOs for the first 30 minutes, then visible to everyone
- **Low quantity posts (≤50 servings)**: Visible to everyone immediately

## Testing Steps

### 1. Setup Test Users

You'll need at least two test accounts:

**NGO User:**
- Role: RECIPIENT
- Subrole: NGO
- Organization Name: (required for NGO)

**Regular User (Student/Staff):**
- Role: RECIPIENT  
- Subrole: STUDENT or STAFF

### 2. Test High Quantity Posts (>50 servings)

1. **Create a high quantity food post** (as a PROVIDER):
   - Set quantity to any number > 50 (e.g., 75 plates)
   - Submit the post
   - Check the server logs - you should see:
     ```
     📊 Quantity: 75 - NGO Exclusive: true
     ⏰ NGO exclusive until: [timestamp 30 minutes from now]
     ```

2. **Test NGO visibility**:
   - Login as NGO user
   - Go to recipient dashboard
   - You should see the NGO Priority Access banner
   - The high quantity post should be visible in the food listings

3. **Test regular user visibility**:
   - Login as Student/Staff user
   - Go to recipient dashboard
   - The high quantity post should NOT be visible
   - Only posts with ≤50 quantity should be visible

4. **Test after 30 minutes**:
   - Wait 30 minutes (or modify the database to set `ngoExclusiveUntil` to a past date)
   - Login as Student/Staff user
   - The high quantity post should now be visible

### 3. Test Low Quantity Posts (≤50 servings)

1. **Create a low quantity food post** (as a PROVIDER):
   - Set quantity to any number ≤ 50 (e.g., 25 servings)
   - Submit the post
   - Check the server logs - you should see:
     ```
     📊 Quantity: 25 - NGO Exclusive: false
     ```

2. **Test visibility for all users**:
   - Login as NGO user: post should be visible immediately
   - Login as Student/Staff user: post should be visible immediately

### 4. API Testing

You can also test the API endpoints directly:

**Get food listings:**
```bash
# This will return listings filtered based on the authenticated user's role
GET /api/food-listings
```

**Create a listing:**
```bash
POST /api/listings
{
  "title": "Test High Quantity Post",
  "quantity": 75,
  "category": "combo_meals",
  "foodType": "VEG",
  // ... other required fields
}
```

### 5. Database Verification

Check the database to verify the fields are set correctly:

```javascript
// High quantity posts should have:
{
  quantity: 75,
  isNGOExclusive: true,
  ngoExclusiveUntil: ISODate("2024-XX-XXTXX:XX:XX.XXXZ") // 30 minutes from creation
}

// Low quantity posts should have:
{
  quantity: 25,
  isNGOExclusive: false,
  ngoExclusiveUntil: null
}
```

### 6. Expected Behaviors

**NGO Users:**
- See a "NGO Priority Access" banner on their dashboard
- Can see all food posts immediately (both high and low quantity)
- Get early access to high-quantity posts

**Regular Users (Students/Staff):**
- Cannot see high-quantity posts during the first 30 minutes
- Can see low-quantity posts immediately
- Can see high-quantity posts after the 30-minute exclusive period

**Providers:**
- Can create posts as usual
- High quantity posts (>50) automatically get NGO exclusive period
- Low quantity posts (≤50) are immediately public

### 7. Troubleshooting

**If NGO users can't see high quantity posts:**
- Check user profile has `subrole: "NGO"`
- Check the listing has `isNGOExclusive: true`
- Check `ngoExclusiveUntil` is in the future

**If regular users can see NGO-exclusive posts:**
- Check the current time vs `ngoExclusiveUntil`
- Check the visibility query in server logs
- Verify user role/subrole in the database

**If posts aren't being marked as NGO exclusive:**
- Check the quantity is > 50
- Check the POST /api/listings logs
- Verify the listing creation logic

### 8. Server Logs to Monitor

When testing, watch for these log messages:

```
📊 Quantity: 75 - NGO Exclusive: true
⏰ NGO exclusive until: 2024-XX-XXTXX:XX:XX.XXXZ
🔍 Fetching food listings for user: { userId: 'xxx', role: 'RECIPIENT', subrole: 'NGO' }
📊 Found X listings matching visibility criteria
🔒 NGO exclusive listings currently active: X
```

## Automated Testing

Run the automated test script:

```bash
node src/scripts/test-visibility-system.js
```

This will create test listings and verify the visibility logic works correctly.
