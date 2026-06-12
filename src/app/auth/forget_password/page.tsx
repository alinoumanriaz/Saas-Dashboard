/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { OTPInput } from "@/components/Otp-Input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FORGET_PASSWORD, VERIFY_PASSWORD } from "@/graphql/query/member.query"
import { useMutation } from "@apollo/client/react"
import { AlertCircle, ArrowLeft, CheckCircle, Mail } from "lucide-react"
import { useState } from "react"

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("")
    const [isEmailSent, setIsEmailSent] = useState(false)
    const [showOTP, setShowOTP] = useState(false)
    const [resetPassword, setResetPassword] = useState(false)
    const [error, setError] = useState("")
    const [otpValue, setOtpValue] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [forgetPassword] = useMutation<any>(FORGET_PASSWORD)
    const [verifyPassword] = useMutation<any>(VERIFY_PASSWORD)
    // const [forgetPassword, { loading: forgetLoading }] = useMutation<any>(FORGET_PASSWORD)
    // const [verifyPassword, { loading: verifyLoading }] = useMutation<any>(VERIFY_PASSWORD)

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!email) {
            setError("Please enter your email address")
            return
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("Please enter a valid email address")
            return
        }

        try {
            const res = await forgetPassword({
                variables: {
                    email: email,
                },
                fetchPolicy: "no-cache",
            })
            console.log("Forget password response: ", res)

            if (res?.data?.forgetPassword?.success) {
                setError("")
                setIsEmailSent(true)
                setShowOTP(true)
                setOtpValue("")
            } else {
                setError(res?.data?.forgetPassword?.message || "Failed to send verification code. Please try again.")
                return
            }

            setIsEmailSent(true)
            // setShowOTP(true)
            setOtpValue("")
        } catch (err: any) {
            setError("Failed to send verification code. Please try again.")
        }
    }

    const handleResendCode = async () => {
        setError("")
        try {
            await forgetPassword({
                variables: {
                    input: {
                        email: email,
                    },
                },
                fetchPolicy: "no-cache",
            })
            setOtpValue("")
            setIsEmailSent(true)
        } catch (err: any) {
            setError("Failed to resend verification code. Please try again.")
        }
    }

    const handleBackToEmail = () => {
        setShowOTP(false)
        setIsEmailSent(false)
        setError("")
        setOtpValue("")
    }

    const handleVerifyOTP = async () => {
        setError("")
        if (!otpValue || otpValue.length !== 6) {
            setError("Please enter the complete 6-digit verification code")
            return
        }

        try {
            const res = await verifyPassword({
                variables: {
                    input: {
                        email: email,
                        passwordResetToken: otpValue,
                    },
                },
                fetchPolicy: "no-cache",
            })

            console.log({ verifypasswordResponse: res })
            if (res.data?.verifyPassword.success) {
                setResetPassword(true)
                setShowOTP(false)
            } else {
                setError(res.data?.verifyPassword?.message || "Invalid verification code. Please try again.")
            }
        } catch (err: any) {
            setError("Invalid verification code. Please try again.")
        }
    }

    const handleResetPassword = async () => {
        if (!newPassword) {
            setError("Please enter a new password")
            return
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long")
            return
        }

        try {
            // Add your reset password mutation here
            // const { data } = await resetPasswordMutation({
            //     variables: {
            //         input: {
            //             email: email,
            //             code: otpValue,
            //             password: newPassword
            //         }
            //     }
            // })

            // Redirect to login page on success
            window.location.href = "/auth/sign_in"
        } catch (err: any) {
            setError("Failed to reset password. Please try again.")
        }
    }

    const handleOtpChange = (value: string) => {
        setOtpValue(value)
        setError("")
    }

    const renderContent = () => {
        if (resetPassword) {
            return (
                <div className="space-y-4">
                    {/* <div className="text-center space-y-2">
                        <Label className="text-lg font-semibold">Reset Password</Label>
                        <CardDescription>
                            Enter your new password below
                        </CardDescription>
                    </div> */}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-11"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleResetPassword}
                        className="w-full h-11 cursor-pointer"
                        size="lg"
                    >
                        Reset Password
                    </Button>

                    <Button
                        variant="link"
                        onClick={() => {
                            setResetPassword(false)
                            setShowOTP(true)
                            setError("")
                        }}
                        className="w-full gap-2 cursor-pointer"
                    >
                        <ArrowLeft onClick={() => {
                            setResetPassword(false)
                            setShowOTP(true)
                            setError("")
                        }} className="h-4 w-4" />
                        Back to verification
                    </Button>
                </div>
            )
        }

        if (showOTP) {
            return (
                <div className="space-y-6">
                    <Alert className="bg-muted/60 border-none text-center">
                        <AlertDescription className="text-sm">
                            Verification code sent to <span className="font-medium">{email}</span>
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        <Label className="text-center block">
                            Verification Code
                        </Label>

                        <div className="flex justify-center">
                            <OTPInput value={otpValue} onChange={handleOtpChange} />
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                            Enter the 6-digit verification code you received
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={handleVerifyOTP}
                            className="w-full h-11 cursor-pointer"
                            size="lg"
                        >
                            Verify Code
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleResendCode}
                            className="w-full h-11 cursor-pointer"
                        >
                            Resend Code
                        </Button>

                        <Button
                            variant="link"
                            onClick={handleBackToEmail}
                            className="w-full gap-2 cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to email
                        </Button>
                    </div>
                </div>
            )
        }

        // Default: Email form
        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="h-11"
                        autoComplete="email"
                    />
                </div>

                <Button
                    onClick={handleSendOTP}
                    className="w-full h-11"
                    size="lg"
                >
                    Send Reset Instructions
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                    We&apos;ll send a 6-digit verification code to your email
                </p>
            </div>
        )
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <Card className="px-2">
                    <CardHeader className="text-center space-y-3">
                        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-2xl">
                                {resetPassword
                                    ? "Reset your password"
                                    : !showOTP
                                        ? "Enter your email address "
                                        : "Verify your email"}
                            </CardTitle>
                            <CardDescription>
                                {resetPassword
                                    ? "Create a new password for your account"
                                    : !showOTP
                                        ? "Enter your email address and we'll send you a verification code"
                                        : "Enter the 6-digit code sent to your email"}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {renderContent()}

                        {isEmailSent && !showOTP && !resetPassword && (
                            <Alert className="border-green-500/20 bg-green-50 dark:bg-green-950/20">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertDescription className="text-green-700 dark:text-green-300">
                                    Reset instructions sent to your email!
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Links */}
                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Remember your password?{" "}
                        <Button variant="link" className="px-0 h-auto" asChild>
                            <a href="/auth/sign_in">Back to Login</a>
                        </Button>
                    </p>

                    <p className="text-xs text-muted-foreground">
                        Didn&apos;t receive the code? Check your spam folder or{" "}
                        <Button variant="link" className="px-0 h-auto text-xs" asChild>
                            <a href="/support">contact support</a>
                        </Button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ForgotPasswordPage