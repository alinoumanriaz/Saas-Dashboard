import type { Metadata } from "next";
import "./globals.css";
import ApolloWrapper from "@/helpers/ApolloProvider";
import { ToastContainer } from "react-toastify";
import { Providers } from "@/redux/providers";
import { cn } from "@/lib/utils";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="antialiased overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <ApolloWrapper>
              <ToastContainer />
              {children}
            </ApolloWrapper>
          </Providers>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
