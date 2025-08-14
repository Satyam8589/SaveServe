
// app/sign-up/[[...index]]/page.jsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <SignUp afterSignUpUrl="/post-login" />;
}