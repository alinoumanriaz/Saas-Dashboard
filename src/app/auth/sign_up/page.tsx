import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/signupForm";

export const metadata: Metadata = {
  title: "Sign Up | My Packaging Hub",
  description: "Create a new account on My Packaging Hub",
};

export default async function SignupPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token");
  
  // Redirect to home if already logged in
  if (authToken) {
    redirect("/");
  }

  return (
    <div className="min-h-screen w-full flex bg-gray-200">
      <div className="w-full flex items-center justify-center px-4">
        <SignupForm />
      </div>
    </div>
  );
}