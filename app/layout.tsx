import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { GoalProvider } from "./context/GoalContext";

export const metadata: Metadata = {
  title: "GoalStream Portal",
  description: "Enterprise Goal Setting & Tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background min-h-screen text-on-surface flex flex-col md:flex-row" suppressHydrationWarning>
        <AuthProvider>
          <GoalProvider>
            {children}
          </GoalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
