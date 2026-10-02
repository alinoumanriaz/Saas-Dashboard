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
                        
                        <div className="relative flex w-full min-h-screen  bg-gray-100">
                            <AppSidebar />

                            <main className="flex-1 min-w-0">
                                <div className="sticky top-0 z-50 flex items-center justify-between px-4 pt-2 bg-gray-100">
                                    <SidebarTrigger />
                                    <AdminHeader />
                                </div>

                                <SidebarInset className="w-full bg-sidebar">

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