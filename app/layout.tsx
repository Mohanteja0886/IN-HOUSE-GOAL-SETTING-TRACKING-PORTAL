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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" 
        />
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" 
        />
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/icon?family=Material+Icons" 
        />
      </head>
      <body className="bg-background min-h-screen text-on-surface antialiased overflow-x-hidden" suppressHydrationWarning>
        <AuthProvider>
          <GoalProvider>
            {children}
          </GoalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
