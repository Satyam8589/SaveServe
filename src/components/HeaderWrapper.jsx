// src/components/HeaderWrapper.jsx (Server Component)
import { checkUser } from "@/lib/queries/user";
import Header from "./Header";

export default async function HeaderWrapper() {
  const userData = await checkUser();

  return <Header userData={userData} />;
}
