import type { Metadata } from "next";
import AuthBootstrap from "@/components/auth/AuthBootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreshMart Grocery",
  description: "Fresh groceries delivered to your door.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}
