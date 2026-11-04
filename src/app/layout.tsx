import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Athar | Discover. Reflect. Remember.",
  description: "Athar: Discover. Reflect. Remember.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
