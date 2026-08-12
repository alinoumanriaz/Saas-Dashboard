import type { Metadata } from "next";
import "./globals.css";
import ApolloWrapper from "@/helpers/ApolloProvider";
import { ToastContainer } from "react-toastify";
import { Providers } from "@/redux/providers";
import { cn } from "@/lib/utils";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { MantineProvider } from "@mantine/core";
import '@mantine/core/styles.css';        // 👈 must be imported
import '@mantine/tiptap/styles.css';      // 👈 must be imported
import './globals.css';

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
      <body className="antialiased overflow-x-hidden bg-gray-100">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <ApolloWrapper>
              <ToastContainer />
              <MantineProvider>
                {children}
              </MantineProvider>
            </ApolloWrapper>
          </Providers>
        </ThemeProvider>
        <Toaster
          position="top-center"
          className="my-toaster"
          toastOptions={{
            classNames: {
              toast: "cn-toast my-toast-class",
            },
          }}
        />
      </body>
    </html>
  );
}
