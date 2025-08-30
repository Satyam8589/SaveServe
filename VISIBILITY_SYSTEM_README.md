# Food Visibility System

This document explains the new food visibility system implemented in the Smart Food Redistribution platform.

## Overview

The system automatically manages food listing visibility based on quantity and time, ensuring that:

- **High quantity items (>50)** are initially exclusive to recipients (NGOs) for the first 30 minutes
- **Low quantity items (≤50)** are immediately visible to all users
- After 30 minutes, high quantity items become visible to everyone

## How It Works

### 1. Automatic Visibility Rules

When a food listing is created:

- If `quantity > 50`:
  - `visibilityRules.isHighQuantity = true`
  - `visibilityRules.recipientOnlyUntil = createdAt + 30 minutes`
  - `visibilityRules.isVisibleToAll = false`
- If `quantity ≤ 50`:
  - `visibilityRules.isHighQuantity = false`
  - `visibilityRules.isVisibleToAll = true`

### 2. API Endpoints

#### For Recipients (NGOs)

- **Endpoint**: `/api/food-listings/recipient`
- **Shows**: Both recipient-only listings AND listings visible to all
- **Use Case**: Recipient dashboard

#### For General Users

- **Endpoint**: `/api/food-listings/public`
- **Shows**: Only listings visible to all users
- **Use Case**: Public food browsing

#### For Providers

- **Endpoint**: `/api/food-listings/provider`
- **Shows**: Provider's own listings (all) + public listings from others
- **Use Case**: Provider dashboard

#### For Backward Compatibility

- **Endpoint**: `/api/food-listings`
- **Shows**: Only listings visible to all users
- **Use Case**: Existing integrations

### 3. Visibility Management

#### Automatic Updates

- Background job updates visibility rules every minute
- High quantity items automatically become visible to all after 30 minutes
- Cron endpoint: `/api/cron/update-visibility`

#### Manual Updates

- **Endpoint**: `/api/food-listings/visibility`
- **Actions**:
  - Update all visibility rules
  - Update specific listing
  - Get visibility summary

### 4. Database Schema Changes

The `FoodListing` model now includes:

```javascript
visibilityRules: {
  isHighQuantity: Boolean,        // true if quantity > 50
  recipientOnlyUntil: Date,       // when recipient-only period ends
  isVisibleToAll: Boolean         // true if visible to everyone
}
```

#### New Indexes

- `visibilityRules.isHighQuantity`
- `visibilityRules.recipientOnlyUntil`

#### New Virtual Fields

- `shouldBeVisibleToAll`: Computes current visibility status

#### New Static Methods

- `findRecipientOnly()`: Finds listings exclusive to recipients
- `findVisibleToAll()`: Finds listings visible to all users

## Recent Fixes

### Issue Resolved: High Quantity Items Showing in All Dashboards

**Problem**: High quantity food items (>50) were appearing in all dashboards during the first 30 minutes, instead of being exclusive to recipients.

**Root Cause**: Multiple API endpoints were not properly filtering by visibility rules:

- `/api/listings` - Used by provider dashboard
- `/api/food-listings` - Used by general dashboards
- Admin dashboard was intentionally showing all listings

**Solution Implemented**:

1. **Updated `/api/listings`** to use `findVisibleToAll()` method
2. **Updated `/api/food-listings`** to use `findVisibleToAll()` method
3. **Created `/api/food-listings/provider`** endpoint for provider-specific needs
4. **Updated listing service** to use appropriate endpoints based on context
5. **Updated history page** to use recipient-specific endpoint

**Result**:

- ✅ High quantity items (>50) are now exclusive to recipients for first 30 minutes
- ✅ Low quantity items (≤50) remain visible to everyone from the start
- ✅ Providers can see their own listings regardless of visibility rules
- ✅ Public dashboards only show items that should be visible to all users

## Implementation Details

### Frontend Changes

#### Recipient Dashboard

- Shows visibility badges for each listing
- Real-time countdown for recipient-only items
- Stats card showing count of exclusive listings
- Auto-refresh every 30 seconds for listings, every minute for countdown

#### Visibility Badges

- **Purple/Pink**: Recipient exclusive (with countdown)
- **Green**: Now visible to all
- **Blue**: Low quantity (always visible)

### Backend Changes

#### Model Updates

- Pre-save middleware sets visibility rules
- Automatic updates for existing listings
- Validation and indexing

#### API Updates

- New endpoints for different user types
- Visibility filtering logic
- Real-time countdown calculations

## Usage Examples

### 1. Creating a New Listing

```javascript
// High quantity item (51 plates)
const listing = new FoodListing({
  title: "Large Event Catering",
  quantity: 51,
  // ... other fields
});

// Automatically sets:
// visibilityRules.isHighQuantity = true
// visibilityRules.recipientOnlyUntil = now + 30 minutes
// visibilityRules.isVisibleToAll = false
```

### 2. Fetching Listings for Recipients

```javascript
// Recipients see both exclusive and public listings
const response = await fetch("/api/food-listings/recipient");
const data = await response.json();

// data.visibilitySummary shows:
// - recipientOnly: count of exclusive listings
// - visibleToAll: count of public listings
// - highQuantity: total high quantity items
// - lowQuantity: total low quantity items
```

### 3. Fetching Listings for General Users

```javascript
// General users only see public listings
const response = await fetch("/api/food-listings/public");
const data = await response.json();

// Only shows listings visible to all users
```

### 4. Manual Visibility Update

```javascript
// Update all visibility rules
const response = await fetch("/api/food-listings/visibility", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "update_all" }),
});

// Update specific listing
const response = await fetch("/api/food-listings/visibility", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "update_listing",
    listingId: "listing_id_here",
  }),
});
```

## Monitoring and Maintenance

### 1. Visibility Summary

```javascript
// Get current visibility status
const response = await fetch("/api/food-listings/visibility?action=summary");
const summary = await response.json();

// Returns:
// {
//   total: 100,
//   highQuantity: 25,
//   lowQuantity: 75,
//   recipientOnly: 5,
//   visibleToAll: 95
// }
```

### 2. Cron Job Setup

To automatically update visibility rules, set up a cron job to call:

```
GET /api/cron/update-visibility
```

**Recommended frequency**: Every minute

**External services**:

- Vercel Cron
- GitHub Actions
- AWS EventBridge
- Traditional cron (Linux/Unix)

### 3. Health Checks

Monitor the visibility system by:

- Checking cron job success rates
- Monitoring visibility summary changes
- Tracking listing visibility transitions

## Migration Notes

### Existing Listings

- All existing listings will have `visibilityRules.isHighQuantity = false`
- All existing listings will be visible to all users
- No data migration required

### API Compatibility

- Existing `/api/food-listings` endpoint continues to work
- Returns only listings visible to all users
- No breaking changes for existing integrations

### Performance Considerations

- New indexes may slightly increase write time
- Read performance improved with targeted queries
- Background updates run independently of user requests

## Troubleshooting

### Common Issues

1. **Visibility not updating**

   - Check cron job is running
   - Verify database connection
   - Check for errors in `/api/cron/update-visibility`

2. **Incorrect visibility rules**

   - Verify listing creation timestamp
   - Check quantity field value
   - Manually trigger update via API

3. **Performance issues**
   - Monitor database query performance
   - Check index usage
   - Consider reducing update frequency

### Debug Endpoints

- `/api/food-listings/visibility?action=summary`: Get visibility summary
- `/api/food-listings/visibility`: Update all rules
- `/api/cron/update-visibility`: Manual cron trigger

## Future Enhancements

1. **Configurable time periods**: Allow different exclusive periods for different food types
2. **Role-based visibility**: More granular control based on user roles
3. **Geographic restrictions**: Location-based visibility rules
4. **Analytics dashboard**: Track visibility rule effectiveness
5. **Webhook notifications**: Real-time updates when visibility changes

## Support

For questions or issues with the visibility system:

1. Check this documentation
2. Review API response logs
3. Test with debug endpoints
4. Contact development team
