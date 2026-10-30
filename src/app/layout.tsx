import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/components/store-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rove-vans.vercel.app"),
  title: {
    default: "Rove — Van rental, done plainly",
    template: "%s · Rove",
  },
  description:
    "Three well-kept camper vans for rent by the day. Check availability, book online in a minute, and unlock your van from your booking page.",
  openGraph: {
    title: "Rove — Van rental, done plainly",
    description:
      "Three well-kept camper vans for rent by the day. Book online, unlock from your phone.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f5f1",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <StoreProvider>{children}</StoreProvider>
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  );
}
