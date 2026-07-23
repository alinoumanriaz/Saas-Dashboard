"use client";

import * as LucideIcons from "lucide-react";
import { Package } from "lucide-react";

interface Props {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: Props) {
  const Icon =
    (LucideIcons[
      name as keyof typeof LucideIcons
    ] as React.ComponentType<any>) ?? Package;

  return <Icon className={className} />;
}