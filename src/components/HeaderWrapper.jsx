// src/components/HeaderWrapper.jsx (Server Component)
import { checkUser } from "@/actions/user";
import Header from "@/components/header";
import React from "react";
import OnboardingChecker from "./OnboardingChecker";

export default async function HeaderWrapper() {
  const userData = await checkUser();
  
  return (
    <OnboardingChecker userData={userData}>
      <Header userData={userData} />
    </OnboardingChecker>
  );
}