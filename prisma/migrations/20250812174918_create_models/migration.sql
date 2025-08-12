-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('STUDENT', 'STAFF', 'FACULTY', 'NGO', 'ADMIN', 'CANTEEN_MANAGER', 'EVENT_ORGANIZER');

-- CreateEnum
CREATE TYPE "public"."FoodCategory" AS ENUM ('PREPARED_FOOD', 'SNACKS', 'FRUITS', 'VEGETABLES', 'DAIRY', 'BEVERAGES', 'DESSERTS', 'BAKERY', 'GRAINS', 'LEFTOVERS', 'EVENT_FOOD', 'CANTEEN_SURPLUS');

-- CreateEnum
CREATE TYPE "public"."QuantityUnit" AS ENUM ('KG', 'GRAMS', 'LITERS', 'ML', 'PIECES', 'PLATES', 'BOWLS', 'PACKETS', 'BOXES');

-- CreateEnum
CREATE TYPE "public"."SpiceLevel" AS ENUM ('MILD', 'MEDIUM', 'SPICY', 'VERY_SPICY');

-- CreateEnum
CREATE TYPE "public"."FoodStatus" AS ENUM ('AVAILABLE', 'PARTIALLY_CLAIMED', 'FULLY_CLAIMED', 'EXPIRED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PickupStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."UrgencyLevel" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."ContactMethod" AS ENUM ('APP', 'PHONE', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('FOOD_AVAILABLE', 'PICKUP_REQUEST', 'PICKUP_CONFIRMED', 'PICKUP_READY', 'PICKUP_COMPLETED', 'PICKUP_CANCELLED', 'EXPIRY_WARNING', 'ACHIEVEMENT_UNLOCKED', 'LEVEL_UP', 'REMINDER', 'SYSTEM_UPDATE');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."ReviewType" AS ENUM ('DONOR_TO_REQUESTER', 'REQUESTER_TO_DONOR', 'FOOD_QUALITY');

-- CreateEnum
CREATE TYPE "public"."AchievementCategory" AS ENUM ('FOOD_SAVER', 'FOOD_RESCUER', 'COMMUNITY_HELPER', 'ENVIRONMENTAL', 'STREAK', 'MILESTONE', 'SOCIAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('SEMINAR', 'WORKSHOP', 'CONFERENCE', 'FEST', 'CULTURAL_EVENT', 'SPORTS_EVENT', 'MEETING', 'PARTY', 'WEDDING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."EventAction" AS ENUM ('FOOD_LISTED', 'FOOD_CLAIMED', 'FOOD_COMPLETED', 'EVENT_LOGGED', 'WASTE_REPORTED', 'USER_JOINED', 'USER_ACHIEVEMENT');

-- CreateEnum
CREATE TYPE "public"."BulkRequestStatus" AS ENUM ('ACTIVE', 'PAUSED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."AdminRole" AS ENUM ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'CAMPUS_ADMIN', 'CANTEEN_ADMIN', 'NGO_COORDINATOR', 'MODERATOR');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('INAPPROPRIATE_CONTENT', 'FAKE_LISTING', 'FOOD_SAFETY_CONCERN', 'USER_MISCONDUCT', 'SPAM', 'TECHNICAL_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'STUDENT',
    "phoneNumber" TEXT,
    "hostel" TEXT,
    "roomNumber" TEXT,
    "department" TEXT,
    "year" TEXT,
    "campusLocation" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "notificationRadius" INTEGER NOT NULL DEFAULT 1000,
    "dietaryRestrictions" TEXT[],
    "allergies" TEXT[],
    "foodPreferences" TEXT[],
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "totalFoodSaved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCarbonSaved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWaterSaved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."food_listings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."FoodCategory" NOT NULL,
    "cuisine" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "quantityUnit" "public"."QuantityUnit" NOT NULL DEFAULT 'KG',
    "estimatedServings" INTEGER,
    "originalPrice" DOUBLE PRECISION,
    "ingredients" TEXT[],
    "allergens" TEXT[],
    "dietaryTags" TEXT[],
    "spiceLevel" "public"."SpiceLevel",
    "preparedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "safeUntil" TIMESTAMP(3) NOT NULL,
    "storageInstructions" TEXT,
    "reheatingInstructions" TEXT,
    "images" TEXT[],
    "pickupLocation" TEXT NOT NULL,
    "pickupInstructions" TEXT,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableUntil" TIMESTAMP(3) NOT NULL,
    "contactInfo" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "public"."FoodStatus" NOT NULL DEFAULT 'AVAILABLE',
    "totalClaimedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingQty" DOUBLE PRECISION NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "interestedCount" INTEGER NOT NULL DEFAULT 0,
    "carbonFootprintSaved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waterFootprintSaved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "food_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pickup_requests" (
    "id" TEXT NOT NULL,
    "requestedQty" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "urgency" "public"."UrgencyLevel" NOT NULL DEFAULT 'NORMAL',
    "preferredPickupTime" TIMESTAMP(3),
    "actualPickupTime" TIMESTAMP(3),
    "estimatedArrival" TIMESTAMP(3),
    "status" "public"."PickupStatus" NOT NULL DEFAULT 'PENDING',
    "donorConfirmedAt" TIMESTAMP(3),
    "requesterArrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "specialInstructions" TEXT,
    "contactMethod" "public"."ContactMethod" NOT NULL DEFAULT 'APP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "foodListingId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,

    CONSTRAINT "pickup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "userId" TEXT NOT NULL,
    "foodListingId" TEXT,
    "pickupRequestId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reviewType" "public"."ReviewType" NOT NULL,
    "qualityRating" INTEGER,
    "quantityRating" INTEGER,
    "timelinessRating" INTEGER,
    "communicationRating" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "foodListingId" TEXT,
    "pickupRequestId" TEXT,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."achievements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "public"."AchievementCategory" NOT NULL,
    "criteria" JSONB NOT NULL,
    "points" INTEGER NOT NULL,
    "badgeColor" TEXT NOT NULL DEFAULT '#10B981',
    "badgeImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_achievements" (
    "id" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."EventType" NOT NULL,
    "location" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "organizerId" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "contactInfo" TEXT,
    "expectedFoodWaste" DOUBLE PRECISION,
    "actualFoodWaste" DOUBLE PRECISION,
    "foodSaved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "public"."EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_logs" (
    "id" TEXT NOT NULL,
    "action" "public"."EventAction" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "foodListingId" TEXT,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ngo_profiles" (
    "id" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "description" TEXT,
    "website" TEXT,
    "primaryContact" TEXT NOT NULL,
    "alternateContact" TEXT,
    "address" TEXT NOT NULL,
    "pincode" TEXT,
    "serviceAreas" TEXT[],
    "maxCapacity" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationDocs" TEXT[],
    "preferredFoodTypes" TEXT[],
    "pickupVehicles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ngo_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bulk_pickup_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "minQuantity" DOUBLE PRECISION NOT NULL,
    "maxQuantity" DOUBLE PRECISION,
    "neededBy" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringDays" TEXT[],
    "preferredCategories" "public"."FoodCategory"[],
    "avoidAllergens" TEXT[],
    "pickupLocation" TEXT NOT NULL,
    "canCollectFrom" TEXT[],
    "status" "public"."BulkRequestStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ngoId" TEXT NOT NULL,

    CONSTRAINT "bulk_pickup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."volunteers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "availableDays" TEXT[],
    "availableHours" TEXT NOT NULL,
    "hasVehicle" BOOLEAN NOT NULL DEFAULT false,
    "vehicleType" TEXT,
    "maxDistance" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ngoId" TEXT NOT NULL,

    CONSTRAINT "volunteers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_profiles" (
    "id" TEXT NOT NULL,
    "role" "public"."AdminRole" NOT NULL,
    "department" TEXT,
    "permissions" TEXT[],
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "canManageFood" BOOLEAN NOT NULL DEFAULT false,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "canManageReports" BOOLEAN NOT NULL DEFAULT false,
    "canManageSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reports" (
    "id" TEXT NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "public"."ReportSeverity" NOT NULL DEFAULT 'MEDIUM',
    "images" TEXT[],
    "attachments" TEXT[],
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "foodListingId" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "public"."users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_name_key" ON "public"."achievements"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "public"."user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "event_logs_foodListingId_key" ON "public"."event_logs"("foodListingId");

-- CreateIndex
CREATE UNIQUE INDEX "ngo_profiles_registrationNumber_key" ON "public"."ngo_profiles"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ngo_profiles_userId_key" ON "public"."ngo_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "public"."admin_profiles"("userId");

-- AddForeignKey
ALTER TABLE "public"."food_listings" ADD CONSTRAINT "food_listings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pickup_requests" ADD CONSTRAINT "pickup_requests_foodListingId_fkey" FOREIGN KEY ("foodListingId") REFERENCES "public"."food_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pickup_requests" ADD CONSTRAINT "pickup_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pickup_requests" ADD CONSTRAINT "pickup_requests_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_pickupRequestId_fkey" FOREIGN KEY ("pickupRequestId") REFERENCES "public"."pickup_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_foodListingId_fkey" FOREIGN KEY ("foodListingId") REFERENCES "public"."food_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_pickupRequestId_fkey" FOREIGN KEY ("pickupRequestId") REFERENCES "public"."pickup_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "public"."achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_logs" ADD CONSTRAINT "event_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_logs" ADD CONSTRAINT "event_logs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_logs" ADD CONSTRAINT "event_logs_foodListingId_fkey" FOREIGN KEY ("foodListingId") REFERENCES "public"."food_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ngo_profiles" ADD CONSTRAINT "ngo_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bulk_pickup_requests" ADD CONSTRAINT "bulk_pickup_requests_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "public"."ngo_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteers" ADD CONSTRAINT "volunteers_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "public"."ngo_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_foodListingId_fkey" FOREIGN KEY ("foodListingId") REFERENCES "public"."food_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
