import type { Metadata } from "next";
import "./globals.css";
import ApolloWrapper from "@/helpers/ApolloProvider";
import { ToastContainer } from "react-toastify";
import { Providers } from "@/redux/providers";
import { cn } from "@/lib/utils";
import { Geist } from "next/font/google";

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="antialiased overflow-x-hidden">
        <Providers>
          <ApolloWrapper>
          <ToastContainer />
            {children}
          </ApolloWrapper>
        </Providers>
      </body>
    </html>
  );
}
