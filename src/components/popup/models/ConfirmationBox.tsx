"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Info,
  Trash2,
  Loader2,
} from "lucide-react";

interface ConfirmationBoxProps {
  onCancel: () => void;
  onDelete: () => void;
  title?: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "danger" | "warning" | "info";
}

const ConfirmationBox: React.FC<ConfirmationBoxProps> = ({
  onCancel,
  onDelete,
  title = "Delete Confirmation",
  message = "Are you sure you want to delete this item?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  variant = "danger",
}) => {
  const variantConfig = {
    danger: {
      icon: Trash2,
      iconWrapper: "bg-red-50 text-red-600",
      button: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500",
    },
    warning: {
      icon: AlertTriangle,
      iconWrapper: "bg-amber-50 text-amber-600",
      button:
        "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500",
    },
    info: {
      icon: Info,
      iconWrapper: "bg-blue-50 text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500",
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !loading) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent
        className="
          w-[calc(100%-32px)]
          max-w-[440px]
          gap-0
          overflow-hidden
          rounded-xl
          border border-gray-200
          bg-white
          p-0
          shadow-2xl
        "
      >
        {/* Main content */}
        <div className="px-6 pb-6 pt-6 sm:px-7 sm:pb-7 sm:pt-7">
          <AlertDialogHeader className="space-y-0 text-left">
            {/* Icon */}
            <div
              className={`
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-lg
                ${config.iconWrapper}
              `}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={2}
              />
            </div>

            {/* Text */}
            <div className="mt-5">
              <AlertDialogTitle
                className="
                  text-[18px]
                  font-semibold
                  leading-6
                  tracking-[-0.01em]
                  text-gray-950
                "
              >
                {title}
              </AlertDialogTitle>

              <p
                className="
                  mt-2.5
                  text-[14px]
                  leading-[21px]
                  text-gray-600
                "
              >
                {message}
              </p>

              {description && (
                <AlertDialogDescription
                  className="
                    mt-1.5
                    text-[13px]
                    leading-5
                    text-gray-400
                  "
                >
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </AlertDialogHeader>
        </div>

        {/* Footer */}
        <AlertDialogFooter
          className="
            flex
            flex-col-reverse
            gap-2
            border-t
            border-gray-100
            bg-gray-50/60
            px-6
            py-4
            sm:flex-row
            sm:justify-end
            sm:px-7
          "
        >
          <AlertDialogCancel asChild>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="
                h-9
                w-full
                rounded-md
                border-gray-200
                bg-white
                px-4
                text-[13px]
                font-medium
                text-gray-700
                shadow-none
                hover:bg-gray-50
                hover:text-gray-900
                sm:w-auto
              "
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button
              type="button"
              onClick={onDelete}
              disabled={loading}
              className={`
                h-9
                w-full
                rounded-md
                mb-3
                px-4
                text-[13px]
                font-medium
                text-white
                shadow-none
                transition-colors
                focus-visible:ring-2
                focus-visible:ring-offset-2
                sm:w-auto
                ${config.button}
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Icon className="mr-1.5 h-4 w-4" />
                  {confirmText}
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationBox;
