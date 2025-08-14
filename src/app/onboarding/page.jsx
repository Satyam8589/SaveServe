"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { completeOnboarding } from "@/actions/user";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState("");
  const [preferences, setPreferences] = useState({
    dietaryRestrictions: [],
    notificationRadius: 1000,
    emailNotifications: true,
    pushNotifications: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useUser();

  const dietaryOptions = [
    "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Nut-Free", "Dairy-Free"
  ];

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setError(""); // Clear any previous errors
    setCurrentStep(2);
  };

  const handleDietaryChange = (restriction) => {
    setPreferences(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const handleComplete = async () => {
    if (!userType) {
      setError("Please select a user type");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      console.log("Completing onboarding with:", { userType, preferences });
      
      // Complete onboarding in database
      await completeOnboarding(userType, preferences);
      
      console.log("Database onboarding completed successfully");
      
      // Update Clerk metadata on client side (more reliable)
      if (user) {
        try {
          await user.update({
            publicMetadata: {
              userType: userType,
              onboardingCompleted: true
            }
          });
          console.log("Clerk metadata updated successfully");
        } catch (clerkError) {
          console.error("Failed to update Clerk metadata:", clerkError);
          // Don't fail the onboarding if Clerk update fails
        }
      }
      
      // Small delay to ensure all updates are processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect based on user type
      console.log("Redirecting user type:", userType);
      if (userType === "provider") {
        console.log("Redirecting to provider dashboard");
        router.push('/provider-dashboard');
      } else if (userType === "receiver") {
        console.log("Redirecting to receiver dashboard");
        router.push('/receiver-dashboard');
      } else {
        console.log("Redirecting to default dashboard");
        router.push('/dashboard'); // fallback
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError(error.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-400">{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl p-8 shadow-2xl">
          {/* Step 1: User Type Selection */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">🍽️</div>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome to SaveServe!</h1>
                <p className="text-gray-400">Let's get you started. What best describes you?</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-lg mx-auto">
                <button
                  onClick={() => handleUserTypeSelect("provider")}
                  className="group p-6 border-2 border-gray-600 rounded-xl hover:border-emerald-500 transition-all duration-200 hover:bg-emerald-500/10"
                >
                  <div className="text-4xl mb-3">🏪</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Food Provider</h3>
                  <p className="text-gray-400 text-sm">I want to share surplus food from my cafeteria, restaurant, or events</p>
                </button>

                <button
                  onClick={() => handleUserTypeSelect("receiver")}
                  className="group p-6 border-2 border-gray-600 rounded-xl hover:border-amber-500 transition-all duration-200 hover:bg-amber-500/10"
                >
                  <div className="text-4xl mb-3">👥</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Food Receiver</h3>
                  <p className="text-gray-400 text-sm">I want to find and collect free food to reduce waste</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Dietary Preferences */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Dietary Preferences</h2>
              <p className="text-gray-400 text-center mb-8">Select any dietary restrictions or preferences (optional)</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {dietaryOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleDietaryChange(option)}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      preferences.dietaryRestrictions.includes(option)
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-700 transition-all duration-200"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-amber-500 text-white rounded-lg hover:from-emerald-600 hover:to-amber-600 transition-all duration-200"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Notification Settings */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Notification Preferences</h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white font-medium">Email Notifications</label>
                    <p className="text-gray-400 text-sm">Get updates about new food listings</p>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                    className={`relative inline-flex w-12 h-6 rounded-full transition-colors ${
                      preferences.emailNotifications ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block w-4 h-4 rounded-full bg-white transition-transform m-1 ${
                      preferences.emailNotifications ? 'translate-x-6' : 'translate-x-0'
                    }`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white font-medium">Push Notifications</label>
                    <p className="text-gray-400 text-sm">Get instant alerts on your device</p>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
                    className={`relative inline-flex w-12 h-6 rounded-full transition-colors ${
                      preferences.pushNotifications ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block w-4 h-4 rounded-full bg-white transition-transform m-1 ${
                      preferences.pushNotifications ? 'translate-x-6' : 'translate-x-0'
                    }`}></span>
                  </button>
                </div>

                <div>
                  <label className="text-white font-medium mb-2 block">Notification Radius</label>
                  <p className="text-gray-400 text-sm mb-3">How far should we look for food near you?</p>
                  <select 
                    value={preferences.notificationRadius}
                    onChange={(e) => setPreferences(prev => ({ ...prev, notificationRadius: parseInt(e.target.value) }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value={500}>500m - On campus only</option>
                    <option value={1000}>1km - Campus area</option>
                    <option value={2000}>2km - Nearby area</option>
                    <option value={5000}>5km - Extended area</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-700 transition-all duration-200"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isSubmitting || !userType}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-amber-500 text-white rounded-lg hover:from-emerald-600 hover:to-amber-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting ? 'Setting up your account...' : 'Complete Setup & Go to Dashboard'}
                </button>
              </div>

              {/* Success Message */}
              {isSubmitting && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg">
                  <p className="text-emerald-400 text-center">Setting up your personalized dashboard...</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-center">{error}</p>
                  <button 
                    onClick={() => setError("")}
                    className="mt-2 text-sm text-red-300 hover:text-red-200 underline mx-auto block"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-800/30 rounded-lg text-xs text-gray-500">
            <p>Debug: User Type = {userType || 'Not selected'}</p>
            <p>Debug: Current Step = {currentStep}</p>
            <p>Debug: User ID = {user?.id || 'Not loaded'}</p>
          </div>
        )}
      </div>
    </div>
  );
}