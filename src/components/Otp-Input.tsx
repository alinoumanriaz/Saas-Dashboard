// components/Otp-Input.tsx
"use client"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

interface OTPInputProps {
  value?: string
  onChange?: (value: string) => void
}

export function OTPInput({ value, onChange }: OTPInputProps) {
  return (
    <InputOTP 
      maxLength={6} 
      className="w-full" 
      value={value}
      onChange={onChange}
    >
      <InputOTPGroup className="w-full flex justify-center items-center">
        <InputOTPSlot index={0} className="w-14 h-14 text-lg" />
        <InputOTPSlot index={1} className="w-14 h-14 text-lg" />
        <InputOTPSlot index={2} className="w-14 h-14 text-lg" />
        <InputOTPSlot index={3} className="w-14 h-14 text-lg" />
        <InputOTPSlot index={4} className="w-14 h-14 text-lg" />
        <InputOTPSlot index={5} className="w-14 h-14 text-lg" />
      </InputOTPGroup>
    </InputOTP>
  )
}