import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { AuthLayout } from "@/components/auth-layout";
import {ThemeProvider} from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AWS SSO Manager",
  description: "Centrally manage AWS SSO roles and permission sets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthLayout>{children}</AuthLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
