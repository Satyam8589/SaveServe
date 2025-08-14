// app/sign-up/[[...index]]/page.jsx
"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <SignUp redirectUrl="/post-login" />;
}
