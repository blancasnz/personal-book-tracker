import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // Choose the weights you need
  variable: "--font-quicksand", // Optional: for CSS variable
});

export const metadata: Metadata = {
  title: "Book Tracker",
  description: "Track your reading lists",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={quicksand.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
