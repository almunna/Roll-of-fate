import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roll of Fate",
  description: "Next.js + Tailwind port of the Pure CSS Roll of Fate app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
