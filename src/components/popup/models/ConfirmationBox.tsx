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
      iconWrapper:
        "bg-red-50 text-red-600 ring-8 ring-red-50/60",
      title: "text-gray-900",
      button:
        "bg-red-600 hover:bg-red-700 focus-visible:ring-red-600",
    },

    warning: {
      icon: AlertTriangle,
      iconWrapper:
        "bg-amber-50 text-amber-600 ring-8 ring-amber-50/60",
      title: "text-gray-900",
      button:
        "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500",
    },

    info: {
      icon: Info,
      iconWrapper:
        "bg-blue-50 text-blue-600 ring-8 ring-blue-50/60",
      title: "text-gray-900",
      button:
        "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-600",
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AlertDialog
      open={true}
      onOpenChange={(open) => {
        if (!open && !loading) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent
        className="
          w-[calc(100%-2rem)]
          max-w-md
          overflow-hidden
          rounded-2xl
          border
          border-gray-200
          bg-white
          p-0
          shadow-2xl
        "
      >
        {/* Top Section */}
        <div className="px-6 pt-7 text-center sm:px-8 sm:pt-8">
          {/* Icon */}
          <div
            className={`
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              ${config.iconWrapper}
            `}
          >
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>

          {/* Header */}
          <AlertDialogHeader className="mt-6 space-y-3">
            <AlertDialogTitle
              className={`
                text-xl
                font-semibold
                tracking-tight
                ${config.title}
              `}
            >
              {title}
            </AlertDialogTitle>

            <div className="space-y-2">
              <p className="text-sm leading-6 text-gray-600">
                {message}
              </p>

              {description && (
                <AlertDialogDescription className="text-xs leading-5 text-gray-400">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </AlertDialogHeader>
        </div>

        {/* Footer */}
        <AlertDialogFooter
          className="
            mt-7
            flex
            flex-col-reverse
            gap-3
            border-t
            border-gray-100
            bg-gray-50/70
            px-6
            py-5
            sm:flex-row
            sm:justify-center
            sm:px-8
          "
        >
          <AlertDialogCancel asChild>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="
                h-10
                w-full
                rounded-lg
                border-gray-200
                bg-white
                px-5
                text-sm
                font-medium
                text-gray-700
                shadow-sm
                transition-all
                hover:bg-gray-50
                hover:text-gray-900
                sm:w-auto
                sm:min-w-[110px]
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
                h-10
                w-full
                rounded-lg
                px-5
                text-sm
                font-medium
                text-white
                shadow-sm
                transition-all
                focus-visible:ring-2
                focus-visible:ring-offset-2
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:w-auto
                sm:min-w-[110px]
                ${config.button}
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  {variant === "danger" && (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}

                  {variant === "warning" && (
                    <AlertTriangle className="mr-2 h-4 w-4" />
                  )}

                  {variant === "info" && (
                    <Info className="mr-2 h-4 w-4" />
                  )}

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