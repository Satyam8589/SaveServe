// app/dashboard/page.jsx
import { currentUser } from "@clerk/nextjs";

export default async function Dashboard() {
  const user = await currentUser();
  return (
    <div>
      <h1>Welcome, {user?.firstName}</h1>
      <p>Your role: {user?.publicMetadata?.role}</p>
    </div>
  );
}
