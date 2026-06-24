import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Sidebar from "@/components/dashboard/Sidebar";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Payflow Console",
  description: "Automated real-time payment reconciliation tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${manrope.variable} font-manrope-scope antialiased bg-zinc-50`}
    >
      <Sidebar>{children}</Sidebar>
    </div>
  );
}
