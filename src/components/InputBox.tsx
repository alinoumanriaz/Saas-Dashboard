"use client";

import React, { useState, ChangeEvent, FocusEvent } from "react";
import { IconType } from "react-icons";

interface InputBoxProps {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  name: string;
  type?: string;
  placeholder?: string;
  label?: string;
  firstIcon?: IconType;
  secondIcon?: IconType;
  thirdIcon?: IconType;
  value?: any;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  className?: string;
  error?: string;
}

const InputBox: React.FC<InputBoxProps> = ({
  onBlur,
  className = "rounded-lg",
  onFocus,
  onChange,
  name,
  placeholder,
  label,
  firstIcon: FirstIcon,
  secondIcon: SecondIcon,
  thirdIcon: ThirdIcon,
  type = "text",
  value,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPasswordField = Boolean(SecondIcon);

  return (
    <div className="w-full space-y-1">
      {/* Floating Label */}
      {label && (
        <label
          htmlFor={name}
          className={`block text-sm font-medium transition-colors ${
            error
              ? "text-red-500"
              : focused
              ? "text-blue-600"
              : "text-gray-500"
          }`}
        >
          {label}
        </label>
      )}

      <div
        className={`relative flex items-center ${className} border transition-all duration-200
          ${
            error
              ? "border-red-500 ring-1 ring-red-500/30"
              : focused
              ? "border-blue-500 ring-2 ring-blue-500/30"
              : "border-gray-300 hover:border-gray-400"
          }
        `}
      >
        {/* Left Icon */}
        {FirstIcon && (
          <span className="absolute left-3 text-gray-400">
            <FirstIcon className="size-5" />
          </span>
        )}

        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          type={
            isPasswordField ? (showPassword ? "text" : "password") : type
          }
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`
            w-full bg-transparent outline-none py-2.5 text-sm text-gray-800 placeholder-gray-400
            ${FirstIcon ? "pl-11" : "pl-4"}
            ${SecondIcon ? "pr-11" : "pr-4"}
            ${className}
          `}
        />

        {/* Password Toggle */}
        {SecondIcon && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute cursor-pointer right-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              ThirdIcon ? <ThirdIcon className="size-5" /> : null
            ) : (
              <SecondIcon className="size-5" />
            )}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={`${name}-error`}
          className="text-xs text-red-500 mt-1"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default InputBox;
