// app/login/page.tsx
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// import LoginForm from "@/components/auth/loginForm";
// import { LoginForm } from "@/components/login-form";
import LoginForm from "@/components/auth/loginForm";

export const metadata: Metadata = {
  title: "Login | MDOR",
  description: "Login to your MDOR account",
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token");

  if (authToken) {
    redirect("/");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm />
      </div>
    </div>
  );
}