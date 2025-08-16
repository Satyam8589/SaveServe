import mongoose from "mongoose";

const UserProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required."],
      unique: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address.",
      },
    },
    role: {
      type: String,
      required: [true, "Role is required."],
      enum: {
        values: ["PROVIDER", "RECIPIENT"],
        message: "Role must be either PROVIDER or RECIPIENT.",
      },
      index: true,
    },
    subrole: {
      type: String,
      required: [true, "Subrole is required."],
      enum: {
        values: [
          "CANTEEN",
          "HOSTEL",
          "EVENTORGANIZER",
          "STUDENT",
          "STAFF",
          "NGO",
        ],
        message: "Invalid subrole selected.",
      },
      index: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      validate: {
        validator: function (v) {
          const cleanPhone = v.replace(/[\s\-\(\)]/g, "");
          return /^[\+]?[1-9][\d]{0,15}$/.test(cleanPhone);
        },
        message: "Please enter a valid phone number.",
      },
    },
    campusLocation: {
      type: String,
      required: [true, "Campus location is required."],
      trim: true,
      maxlength: [100, "Campus location cannot exceed 100 characters."],
      index: true,
    },
    organizationName: {
      type: String,
      required: function () {
        return this.subrole === "NGO";
      },
      trim: true,
      maxlength: [100, "Organization name cannot exceed 100 characters."],
      default: "",
      validate: {
        validator: function (v) {
          if (this.subrole === "NGO") {
            return v && v.trim().length > 0;
          }
          return true;
        },
        message: "Organization name is required for NGO subrole.",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters."],
      default: "",
    },
    isProfileComplete: {
      type: Boolean,
      // ⭐ CHANGE 1: The default value is now true.
      default: true,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    profileVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    minimize: false,
  }
);

// Virtuals, Methods, and Statics remain unchanged
UserProfileSchema.virtual("formattedPhone").get(function () {
  if (!this.phoneNumber) return "";
  const phone = this.phoneNumber.replace(/\D/g, "");
  if (phone.length === 10) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return this.phoneNumber;
});

UserProfileSchema.index({ role: 1, subrole: 1 });
UserProfileSchema.index({ campusLocation: 1, isActive: 1 });

// Enhanced pre-save middleware
UserProfileSchema.pre("save", function (next) {
  console.log("🔄 Pre-save middleware triggered for user:", this.userId);

  // ⭐ CHANGE 2: The old logic has been completely replaced with this new, simpler rule.
  // The profile is considered complete by default for everyone.
  this.isProfileComplete = true;

  // The ONLY exception: if the subrole is NGO and the organization name is missing.
  if (
    this.subrole === "NGO" &&
    (!this.organizationName || this.organizationName.trim() === "")
  ) {
    this.isProfileComplete = false;
    console.log(
      "❌ NGO subrole requires an organization name. Profile marked as incomplete."
    );
  }

  // Update other fields as before
  if (!this.isNew) {
    this.lastLoginAt = new Date();
    this.profileVersion = (this.profileVersion || 1) + 1;
  }
  if (this.isActive === undefined) this.isActive = true;
  if (!this.profileVersion) this.profileVersion = 1;

  console.log(
    "✅ Pre-save completed. Final 'isProfileComplete' status:",
    this.isProfileComplete
  );
  next();
});

// Post-save middleware
UserProfileSchema.post("save", function (doc) {
  console.log("💾 Profile saved successfully for user:", doc.userId);
});

// Instance methods
UserProfileSchema.methods.canProvideFood = function () {
  return (
    this.role === "PROVIDER" &&
    ["CANTEEN", "HOSTEL", "EVENTORGANIZER"].includes(this.subrole)
  );
};

// Static methods
UserProfileSchema.statics.findByRoleAndLocation = function (role, location) {
  return this.find({
    role: role,
    campusLocation: { $regex: location, $options: "i" },
    isActive: true,
  }).sort({ lastLoginAt: -1 });
};

// ... (all other methods and statics remain the same)

export default mongoose.models.UserProfile ||
  mongoose.model("UserProfile", UserProfileSchema);
