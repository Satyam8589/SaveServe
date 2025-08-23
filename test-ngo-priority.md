# NGO Priority Feature Testing Guide

## Overview
This feature implements a 30-minute NGO priority period for food listings with quantity > 50. During this period, only users with subrole 'NGO' can see these listings.

## Testing Steps

### 1. Setup Test Users
You need two types of users:
- **NGO User**: role='RECIPIENT', subrole='NGO'
- **Regular User**: role='RECIPIENT', subrole='STUDENT' (or any non-NGO subrole)

### 2. Test High Quantity Food Listing (>50)

#### Create a High Quantity Listing
1. Login as a Provider
2. Create a food listing with quantity > 50 (e.g., 75)
3. Verify the listing is created with:
   - `isNGOPriority: true`
   - `ngoOnlyUntil: [30 minutes from creation time]`

#### Test NGO User Access
1. Login as NGO user
2. Go to recipient dashboard
3. Verify you can see the high quantity listing
4. Verify the listing shows "🏢 NGO Priority" badge
5. Verify the purple info banner appears explaining NGO priority

#### Test Regular User Access (During NGO Period)
1. Login as regular recipient user
2. Go to recipient dashboard
3. Verify you CANNOT see the high quantity listing
4. Verify other listings (quantity ≤ 50) are still visible

#### Test Regular User Access (After NGO Period)
1. Wait 30 minutes OR manually update the `ngoOnlyUntil` field in database to a past time
2. Login as regular recipient user
3. Go to recipient dashboard
4. Verify you CAN now see the high quantity listing
5. Verify the NGO priority badge is no longer shown

### 3. Test Low Quantity Food Listing (≤50)

#### Create a Low Quantity Listing
1. Login as a Provider
2. Create a food listing with quantity ≤ 50 (e.g., 25)
3. Verify the listing is created with:
   - `isNGOPriority: false`
   - `ngoOnlyUntil: null`

#### Test Both User Types Can See It
1. Login as NGO user - verify listing is visible
2. Login as regular user - verify listing is visible
3. Verify no NGO priority badges are shown

### 4. Test Provider Dashboard
1. Login as the provider who created high quantity listing
2. Go to provider dashboard
3. During NGO period, verify listing shows:
   - Purple "NGO Priority Active" indicator
   - Time until NGO period ends
4. After NGO period, verify indicator disappears

## Database Verification

### Check Listing Fields
```javascript
// In MongoDB or your database tool
db.foodlistings.find({
  quantity: { $gt: 50 }
}).forEach(listing => {
  console.log({
    title: listing.title,
    quantity: listing.quantity,
    isNGOPriority: listing.isNGOPriority,
    ngoOnlyUntil: listing.ngoOnlyUntil,
    createdAt: listing.createdAt
  });
});
```

### Check User Profiles
```javascript
// Verify NGO users
db.userprofiles.find({
  role: 'RECIPIENT',
  subrole: 'NGO'
});

// Verify regular users
db.userprofiles.find({
  role: 'RECIPIENT',
  subrole: { $ne: 'NGO' }
});
```

## API Testing

### Test Food Listings API
```bash
# Test as NGO user (should see all listings)
curl -H "Authorization: Bearer [NGO_USER_TOKEN]" \
     http://localhost:3000/api/food-listings

# Test as regular user (should not see NGO priority listings during period)
curl -H "Authorization: Bearer [REGULAR_USER_TOKEN]" \
     http://localhost:3000/api/food-listings
```

## Expected Behavior Summary

1. **Quantity > 50**: 
   - NGO users see immediately
   - Regular users see after 30 minutes
   - Provider sees NGO priority indicator

2. **Quantity ≤ 50**: 
   - All users see immediately
   - No special indicators

3. **Visual Indicators**:
   - Recipients see "🏢 NGO Priority" badge during period
   - Providers see "NGO Priority Active" with countdown
   - Info banner explains the system

## Troubleshooting

### Common Issues
1. **User not recognized as NGO**: Check user profile has exact values `role='RECIPIENT'` and `subrole='NGO'`
2. **Listings always visible**: Check server time vs `ngoOnlyUntil` field
3. **API errors**: Check authentication and database connection

### Debug Logs
Check console for:
- User profile fetch results
- NGO priority calculations
- API filtering logic
