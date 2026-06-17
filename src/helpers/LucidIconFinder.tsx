
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

export const getLucideIcon = (iconName: string): LucideIcon => {
  return (
    (LucideIcons[
      iconName as keyof typeof LucideIcons
    ] as LucideIcon) || LucideIcons.Package
  );
};