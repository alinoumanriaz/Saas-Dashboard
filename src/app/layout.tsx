import type { Metadata } from "next";
import "./globals.css";
import ApolloWrapper from "@/helpers/ApolloProvider";
import { ToastContainer } from "react-toastify";
import { Providers } from "@/redux/providers";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { MantineProvider } from "@mantine/core";
import '@mantine/core/styles.css';        // 👈 must be imported
import '@mantine/tiptap/styles.css';      // 👈 must be imported
import './globals.css';
import { mainFont } from "@/lib/fonts";


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
    <html lang="en" className={`${mainFont.variable}`} suppressHydrationWarning>
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
