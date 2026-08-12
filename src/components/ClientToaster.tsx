"use client";  // 👈 Mark as Client Component

import { Toaster } from "@/components/ui/sonner";

export function ClientToaster() {
    return (
        <Toaster
            position="top-center"
            toastOptions={{
                className: ((t: any) => {
                    const base = "rounded-xl shadow-lg px-4 py-3 font-medium border";
                    switch (t.type) {
                        case "success": return `${base} bg-emerald-50 border-emerald-400 text-emerald-800`;
                        case "error": return `${base} bg-rose-50 border-rose-400 text-rose-800`;
                        case "warning": return `${base} bg-amber-50 border-amber-400 text-amber-800`;
                        case "info": return `${base} bg-sky-50 border-sky-400 text-sky-800`;
                        default: return `${base} bg-gray-50 border-gray-300 text-gray-800`;
                    }
                }) as any, // 👈 bypass type check
            }}
        />
    );
}