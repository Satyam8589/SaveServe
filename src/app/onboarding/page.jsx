// app/onboarding/page.jsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/update-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });

    if (res.ok) {
      router.push("/dashboard");
    }
  };

  return (
    <div>
      <h1>Complete Your Profile</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Select Role:
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="">Select...</option>
            <option value="coach">Coach</option>
            <option value="player">Player</option>
          </select>
        </label>
        <button type="submit">Finish Onboarding</button>
      </form>
    </div>
  );
}
