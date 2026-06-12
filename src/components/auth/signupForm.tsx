/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";

import InputBox from "@/components/InputBox";
import LoaderSpin from "@/components/LoaderSpin";

import { REGISTER_MEMBER } from "@/graphql/query/member.query";
import { useAppDispatch } from "@/redux/hooks";
import { setMember } from "@/redux/slicers/currentMember";

import { TiUser } from "react-icons/ti";
import { TbPasswordFingerprint } from "react-icons/tb";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { MdEmail, MdPerson, MdPhone } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";

const SignupForm = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [registerMember] = useMutation<any>(REGISTER_MEMBER);

  const [loading, setLoading] = useState(false);
  const [newError, setNewError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.firstName.trim()) {
      setNewError("First name is required");
      return false;
    }
    if (!form.lastName.trim()) {
      setNewError("Last name is required");
      return false;
    }
    if (!form.email.trim()) {
      setNewError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setNewError("Please enter a valid email address");
      return false;
    }
    if (!form.password) {
      setNewError("Password is required");
      return false;
    }
    if (form.password.length < 6) {
      setNewError("Password must be at least 6 characters");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setNewError("Passwords do not match");
      return false;
    }
    return true;
  };

  const onsubmithandler = async () => {
    setLoading(true);
    setNewError("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    console.log({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });

    try {
      const { data, error } = await registerMember({
        variables: {
          input: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone || undefined,
            password: form.password,
          },
        },
        fetchPolicy: "no-cache",
      });

      console.log({ signupRes: data, error });

      if (data?.registerMember) {
        // Auto-login after signup
        dispatch(setMember(data?.registerMember));
        
        // Set cookie for server-side auth if needed
        // document.cookie = `auth-token=${data.registerMember.token}; path=/; max-age=${60 * 60 * 24 * 30}`;
        
        router.push("/");
        router.refresh();
      } else {
        setNewError(error?.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      setNewError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="w-full max-w-110 text-blue-500 p-8">
      <div>
        {/* HEADER */}
        <div className="flex flex-col justify-center items-center mb-8 space-y-2">
          <Image
            src="/mph-logo.png"
            alt="Logo"
            width={80}
            height={50}
            className=""
          />
          <h2 className="text-2xl text-center font-bold">
            Create Account
          </h2>
          <p className="text-sm text-gray-500 text-center">
            Join My Packaging Hub today
          </p>
        </div>

        {/* ERROR */}
        {newError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-center text-sm text-red-600">
            {newError}
          </div>
        )}

        {/* FIRST NAME & LAST NAME - Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <InputBox
              firstIcon={MdPerson}
              name="firstName"
              type="text"
              value={form.firstName}
              onChange={handleOnChange}
              placeholder="First Name"
              className="bg-white rounded-4xl p-1"
            />
          </div>
          <div>
            <InputBox
              firstIcon={MdPerson}
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={handleOnChange}
              placeholder="Last Name"
              className="bg-white rounded-4xl p-1"
            />
          </div>
        </div>

        {/* EMAIL */}
        <div className="mb-4">
          <InputBox
            firstIcon={MdEmail}
            name="email"
            type="email"
            value={form.email}
            onChange={handleOnChange}
            placeholder="Email Address"
            className="bg-white rounded-4xl p-1"
          />
        </div>

        {/* PHONE (Optional) */}
        <div className="mb-4">
          <InputBox
            firstIcon={MdPhone}
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleOnChange}
            placeholder="Phone Number (Optional)"
            className="bg-white rounded-4xl p-1"
          />
        </div>

        {/* PASSWORD */}
        <div className="mb-4">
          <InputBox
            firstIcon={TbPasswordFingerprint}
            secondIcon={showPassword ? PiEyeClosed : PiEye}
            onSecondIconClick={togglePasswordVisibility}
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleOnChange}
            placeholder="Password"
            className="bg-white rounded-4xl p-1"
          />
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="mb-4">
          <InputBox
            firstIcon={TbPasswordFingerprint}
            secondIcon={showConfirmPassword ? PiEyeClosed : PiEye}
            onSecondIconClick={toggleConfirmPasswordVisibility}
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={form.confirmPassword}
            onChange={handleOnChange}
            placeholder="Confirm Password"
            className="bg-white rounded-4xl p-1"
          />
        </div>

        {/* Password requirements */}
        <div className="text-xs text-gray-500 mb-4 px-1">
          Password must be at least 6 characters long
        </div>

        <div className="text-xs text-gray-500 mb-4 px-1">
          By signing up, you consent to MyPackagingHub&apos;s{" "}
          <span className="underline text-black font-semibold">Terms of Use</span> and{" "}
          <span className="underline text-black font-semibold">Privacy Policy</span>.
        </div>

        {/* Sign Up Button */}
        <button
          disabled={loading}
          onClick={onsubmithandler}
          className="w-full mb-4 cursor-pointer text-sm disabled:opacity-50 bg-blue-500 hover:bg-blue-600 transition text-white font-semibold py-3 rounded-4xl flex items-center justify-center"
        >
          {loading ? (
            <div className="flex justify-center items-center">
              <LoaderSpin color="text-white" />
              <span className="pl-3">Creating account...</span>
            </div>
          ) : (
            "Sign Up"
          )}
        </button>

        {/* Login Link */}
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
            Log in
          </Link>
        </div>
      </div>

      <button 
        className="text-sm text-blue-600 hover:underline cursor-pointer w-full text-center mt-4" 
        onClick={() => router.push("/auth/login")}
      >
        Sign up with Google (Coming Soon)
      </button>
    </div>
  );
};

export default SignupForm;