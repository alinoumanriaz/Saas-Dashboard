/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";

import InputBox from "@/components/InputBox";
import LoaderSpin from "@/components/LoaderSpin";

import { LOGIN_MEMBER } from "@/graphql/query/member.query";
import { useAppDispatch } from "@/redux/hooks";
import { setMember } from "@/redux/slicers/currentMember";

import { TiUser } from "react-icons/ti";
import { TbPasswordFingerprint } from "react-icons/tb";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import Link from "next/dist/client/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";
import { Field, FieldDescription, FieldGroup, FieldSeparator } from "../ui/field";
import { Button } from "../ui/button";

const LoginForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [loginMember] = useMutation<any>(LOGIN_MEMBER);

  const [loading, setLoading] = useState(false);
  const [newError, setNewError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onsubmithandler = async () => {
    setLoading(true);
    setNewError("");

    console.log({
      email: form.email,
      password: form.password,
    })

    try {
      const { data, error } = await loginMember({
        variables: {
          input: {
            email: form.email,
            password: form.password,
          },
        },
        fetchPolicy: "no-cache",
      });

      console.log({ loginRes: data, error });
      if (error) {
        setNewError(error.message || "An error occurred during login. Please try again.");
        setLoading(false);
        return;
      }

      if (data?.loginMember) {
        dispatch(setMember(data?.loginMember));

        // Set cookie for server-side auth if needed
        // if (rememberMe) {
        //   document.cookie = `auth-token=${data.loginMember.token}; path=/; max-age=${60 * 60 * 24 * 30}`;
        // } else {
        //   document.cookie = `auth-token=${data.loginMember.token}; path=/`;
        // }

        router.push("/");
        router.refresh(); // Refresh server components
        setLoading(false);
      } else {
        setNewError("Invalid email or password");
        setLoading(false);
      }
    } catch (err) {
      setNewError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="px-6 space-y-2">
        <CardHeader className="text-center">
          <CardTitle className="text-xl ">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>

        </CardHeader>
        <FieldGroup>
          <Field>
            <Button className="py-5" variant="outline" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                  fill="currentColor"
                />
              </svg>
              Login with Apple
            </Button>
            <Button className="py-5" variant="outline" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Login with Google
            </Button>
          </Field>
        </FieldGroup>

        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
          Or continue with
        </FieldSeparator>

        <CardContent className="px-0 pt-2">
          <div className=" text-blue-500 ">
            <div>
              {/* ERROR */}
              {newError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-center text-sm text-red-600">
                  {newError}
                </div>
              )}

              {/* EMAIL */}
              <div className="mb-4">
                <InputBox
                  firstIcon={TiUser}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleOnChange}
                  placeholder="Email Address"
                  className="bg-white rounded-lg "
                />
              </div>

              {/* PASSWORD */}
              <div className="mb-4">
                <InputBox
                  firstIcon={TbPasswordFingerprint}
                  secondIcon={PiEye}
                  thirdIcon={PiEyeClosed}
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleOnChange}
                  placeholder="Password"
                  className="bg-white rounded-lg"
                />
              </div>


              {/* REMEMBER + FORGOT */}
              <div className="flex items-center justify-between mb-4 px-1">
                <FieldDescription className="text-center">
                  <Link href={"/auth/forget_password"} className="underline text-black">
                    Forgot password?
                  </Link>
                </FieldDescription>

                {/* <Link href="/auth/sign_up" className="text-sm text-blue-600 hover:underline cursor-pointer">
                  Sign up
                </Link> */}
              </div>

              {/* BUTTON */}
              <button
                disabled={loading}
                onClick={onsubmithandler}
                className="w-full mb-4 cursor-pointer text-sm disabled:opacity-50 bg-primary hover:bg-primary transition text-white font-semibold py-3 rounded-lg flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex justify-center items-center">
                    <LoaderSpin color="text-white" />
                    <span className="pl-3">Signing in...</span>
                  </div>
                ) : (
                  "Log in"
                )}
              </button>
            </div>

            <FieldDescription className="text-center">
              Don&apos;t have an account?
              <Link href={"/signup"} className="underline text-black font-medium">
                Sign up
              </Link>
            </FieldDescription>

          </div>
        </CardContent>
      </Card>
      <FieldDescription className="text-center">
        By signing up or logging in, you consent to MyPackagingHub&apos;s <Link href={"/terms-conditions"} className="underline text-black font-medium">Terms of Use</Link>  and <Link href={"/privacy-policy"} className="underline text-black font-medium">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
};

export default LoginForm;