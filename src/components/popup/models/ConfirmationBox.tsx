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
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

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
  // Variant configurations
  const variantConfig = {
    danger: {
      icon: Trash2,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      buttonVariant: "destructive" as const,
      titleColor: "text-red-600",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      buttonVariant: "default" as const,
      titleColor: "text-yellow-600",
    },
    info: {
      icon: AlertTriangle,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      buttonVariant: "default" as const,
      titleColor: "text-blue-600",
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AlertDialog open={true} onOpenChange={() => onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Icon Circle */}
            <div className={`rounded-full ${config.iconBg} p-3`}>
              <Icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>

            {/* Title */}
            <AlertDialogTitle className={`text-xl font-semibold ${config.titleColor}`}>
              {title}
            </AlertDialogTitle>

            {/* Message */}
            <div className="space-y-2">
              <p className="text-sm text-gray-700">{message}</p>
              {description && (
                <AlertDialogDescription className="text-xs text-gray-500">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex justify-center gap-3 sm:justify-center">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="min-w-[100px]"
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
          
          <AlertDialogAction asChild>
            <Button
              variant={config.buttonVariant}
              onClick={onDelete}
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
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