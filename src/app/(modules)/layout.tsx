import AdminHeader from "@/components/header/AdminHeader";
import LoadCurrentMember from "@/components/LoadCurrentMember";
import { MantineProvider } from "@mantine/core";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MantineProvider>
            <LoadCurrentMember>
                <TooltipProvider>
                    <SidebarProvider className="w-full">
                        <div className="flex w-full min-h-screen">
                            <AppSidebar />

                            <main className="flex-1 min-w-0 overflow-x-auto">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <SidebarTrigger />
                                    <AdminHeader />
                                </div>

                                <SidebarInset className="w-full">

                                    {children}
                                </SidebarInset>
                            </main>
                        </div>
                    </SidebarProvider>
                </TooltipProvider>
            </LoadCurrentMember>
        </MantineProvider>
    );
}