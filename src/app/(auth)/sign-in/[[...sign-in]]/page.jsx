// app/sign-in/[[...index]]/page.jsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignIn afterSignInUrl="/post-login" />;
}