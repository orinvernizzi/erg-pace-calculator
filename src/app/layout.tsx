import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { getSession } from "@/lib/auth";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "ErgCalc",
  description: "Plan a piece. Save what you did.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
        <Nav user={session} />
        <main className="shell">{children}</main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
