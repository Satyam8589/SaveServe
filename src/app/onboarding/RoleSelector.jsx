// RoleSelector.jsx
"use client";

import { useState } from "react";
import { ArrowRight, Users, Building2, UserCheck, GraduationCap, Shield, Heart } from "lucide-react";

export default function RoleSelector({ onRoleSelect }) {
  const [mainRole, setMainRole] = useState("");
  const [subRole, setSubRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!mainRole || !subRole) {
      alert("Please select both main role and sub role.");
      return;
    }

    setLoading(true);
    try {
      // Call the parent component's handler with just mainRole and subRole
      // Remove the third parameter as it's not expected by the parent function
      await onRoleSelect(mainRole, subRole);
    } catch (error) {
      console.error("Error selecting roles:", error);
      alert("Failed to save role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = {
    PROVIDER: {
      title: "Food Provider",
      description: "Provide food to the community",
      icon: Building2,
      subRoles: [
        { value: "CANTEEN", label: "Canteen", icon: Users, description: "Restaurant or canteen operator" },
        { value: "HOSTEL", label: "Hostel", icon: Building2, description: "Hostel or accommodation provider" },
        { value: "EVENT_ORGANIZER", label: "Event Organizer", icon: UserCheck, description: "Event and catering organizer" }
      ]
    },
    RECIPIENT: {
      title: "Food Recipient",
      description: "Receive food from the community",
      icon: Users,
      subRoles: [
        { value: "STUDENT", label: "Student", icon: GraduationCap, description: "Student seeking meals" },
        { value: "STAFF", label: "Staff", icon: Shield, description: "Staff member" },
        { value: "NGO", label: "NGO", icon: Heart, description: "NGO or charity organization" }
      ]
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to Our Food Community
        </h1>
        <p className="text-xl text-gray-300">
          Let's start by understanding your role in our ecosystem
        </p>
      </div>

      {/* Main Role Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">
          What describes you best?
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(roleOptions).map(([key, role]) => {
            const IconComponent = role.icon;
            return (
              <button
                key={key}
                onClick={() => {
                  setMainRole(key);
                  setSubRole(""); // Reset sub role when main role changes
                }}
                className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  mainRole === key
                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                    : "border-gray-600 hover:border-gray-500 text-gray-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  <IconComponent className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-xl font-semibold">{role.title}</div>
                    <div className="text-sm opacity-80">{role.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub Role Selection */}
      {mainRole && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Which best describes your specific role?
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {roleOptions[mainRole].subRoles.map((role) => {
              const IconComponent = role.icon;
              return (
                <button
                  key={role.value}
                  onClick={() => setSubRole(role.value)}
                  className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    subRole === role.value
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-gray-600 hover:border-gray-500 text-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <IconComponent className="w-8 h-8 mx-auto mb-3" />
                    <div className="text-lg font-semibold">{role.label}</div>
                    <div className="text-sm opacity-80">{role.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Continue Button */}
      {mainRole && subRole && (
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={loading}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-semibold rounded-xl transition-all transform hover:scale-105 disabled:scale-100"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}