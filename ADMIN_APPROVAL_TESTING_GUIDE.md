# Admin Approval System - Testing Guide

## Overview
This guide covers testing the complete admin approval workflow that has been implemented in the Smart Food Redistribution platform.

## System Components

### 1. Database Schema Updates
- **UserProfile Model** (MongoDB): Added approval status fields
  - `approvalStatus`: PENDING | APPROVED | REJECTED
  - `approvedAt`: DateTime
  - `approvedBy`: String (admin user ID)
  - `rejectionReason`: String
  - `submittedForApprovalAt`: DateTime

### 2. New Pages Created
- `/pending-approval` - Shows users their approval status
- `/admin` - Admin dashboard for managing user approvals

### 3. API Endpoints
- `GET /api/admin/users` - Fetch users for admin
- `POST /api/admin/approve-user` - Approve a user
- `POST /api/admin/reject-user` - Reject a user with reason
- `PUT /api/admin/reject-user` - Update rejection reason

### 4. Updated Components
- Post-login flow now checks approval status
- Profile completion redirects to pending approval
- Middleware updated to allow pending approval page access

## Testing Scenarios

### Scenario 1: New User Registration Flow
**Steps:**
1. Sign up as a new user
2. Complete onboarding (role selection)
3. Fill out profile information
4. Submit profile

**Expected Result:**
- User should be redirected to `/pending-approval`
- Profile should have `approvalStatus: "PENDING"`
- `submittedForApprovalAt` should be set

### Scenario 2: Admin Approval Process
**Prerequisites:** 
- Create an admin user (set `mainRole: "ADMIN"` in Clerk metadata)

**Steps:**
1. Login as admin
2. Navigate to `/admin`
3. View pending users list
4. Click "View" on a pending user
5. Click "Approve User"

**Expected Result:**
- User status changes to "APPROVED"
- `approvedAt` and `approvedBy` fields are set
- Push notification sent to user (if FCM token available)
- User can now access their dashboard

### Scenario 3: Admin Rejection Process
**Steps:**
1. Login as admin
2. Navigate to `/admin`
3. Click "Reject" on a pending user
4. Provide rejection reason
5. Submit rejection

**Expected Result:**
- User status changes to "REJECTED"
- `rejectionReason` field is set
- Push notification sent to user
- User sees rejection feedback on pending approval page

### Scenario 4: Rejected User Re-submission
**Steps:**
1. Login as rejected user
2. User should see pending approval page with rejection reason
3. Click "Update Profile"
4. Modify profile information
5. Resubmit profile

**Expected Result:**
- Status changes back to "PENDING"
- `submittedForApprovalAt` is updated
- Previous rejection reason is cleared
- Admin can review the updated profile

### Scenario 5: Approved User Login
**Steps:**
1. Login as approved user
2. Complete authentication

**Expected Result:**
- User is redirected to appropriate dashboard based on role
- No pending approval page shown
- Full access to platform features

## Edge Cases to Test

### 1. Multiple Admin Actions
- Test concurrent approval/rejection by different admins
- Verify only pending users can be approved/rejected

### 2. Invalid States
- Try to approve already approved user
- Try to reject already rejected user
- Verify appropriate error messages

### 3. Admin Authentication
- Try to access admin pages without admin role
- Verify 403 Forbidden responses

### 4. Network Failures
- Test notification failures don't break approval process
- Verify graceful error handling

### 5. Data Validation
- Test empty rejection reasons
- Test invalid user IDs
- Test malformed requests

## Manual Testing Checklist

### User Flow Testing
- [ ] New user registration → pending approval
- [ ] Profile completion → pending approval redirect
- [ ] Pending approval page displays correctly
- [ ] Rejection feedback shows properly
- [ ] Profile update after rejection works
- [ ] Approved user dashboard access

### Admin Flow Testing
- [ ] Admin dashboard loads with user list
- [ ] User filtering and search works
- [ ] User detail modal displays correctly
- [ ] Approval process completes successfully
- [ ] Rejection process with reason works
- [ ] Statistics cards show correct counts

### API Testing
- [ ] All endpoints require proper authentication
- [ ] Admin endpoints check admin role
- [ ] Error responses are properly formatted
- [ ] Success responses include expected data

### Notification Testing
- [ ] Push notifications sent on approval
- [ ] Push notifications sent on rejection
- [ ] Notification failures don't break process
- [ ] Notification content is appropriate

## Environment Setup for Testing

### 1. Database
Ensure MongoDB is running and UserProfile model is updated with new fields.

### 2. Admin User Setup
Create an admin user in Clerk:
```javascript
// In Clerk dashboard, set user metadata:
{
  "mainRole": "ADMIN",
  "hasOnboarded": true
}
```

### 3. Environment Variables
Ensure these are set for notifications:
```
FIREBASE_SERVICE_ACCOUNT_KEY=<your-firebase-service-account>
FIREBASE_PROJECT_ID=<your-project-id>
```

### 4. Test Data
Create test users with different approval statuses for comprehensive testing.

## Known Limitations

1. **Email Notifications**: Currently only push notifications are implemented
2. **Bulk Operations**: No bulk approve/reject functionality
3. **Audit Trail**: Limited logging of admin actions
4. **Role Management**: Admin role assignment is manual via Clerk

## Future Enhancements

1. Email notification integration
2. Bulk user management operations
3. Advanced filtering and sorting
4. Audit trail and activity logs
5. Automated approval rules
6. User communication system

## Troubleshooting

### Common Issues
1. **Admin page not accessible**: Check user role in Clerk metadata
2. **Notifications not working**: Verify Firebase configuration
3. **Database errors**: Ensure MongoDB connection and schema updates
4. **Redirect loops**: Check middleware configuration

### Debug Steps
1. Check browser console for JavaScript errors
2. Review server logs for API errors
3. Verify database document structure
4. Test API endpoints directly with tools like Postman

## Success Criteria

The admin approval system is working correctly when:
- ✅ New users are automatically set to pending status
- ✅ Admins can view and manage pending users
- ✅ Approval/rejection processes work smoothly
- ✅ Users receive appropriate notifications
- ✅ Approved users can access their dashboards
- ✅ Rejected users can resubmit their profiles
- ✅ All security checks are in place
