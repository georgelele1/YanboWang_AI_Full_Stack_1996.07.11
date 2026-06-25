import type { Metadata } from "next"
import "./globals.css"
import AppSidebar from "@/components/AppSidebar"

export const metadata: Metadata = {
  title: "HealthPath -- Your Personal Wellness Assessment",
  description:
    "Take our 2-minute science-backed health quiz and get a personalized nutrition and fitness plan tailored to your body and goals.",
  openGraph: {
    title: "HealthPath -- Your Personal Wellness Assessment",
    description:
      "Discover your optimal calorie targets, macro breakdown, and a week-by-week weight timeline in just 2 minutes.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#fcfbf8] min-h-screen">
        {children}
        <AppSidebar />
      </body>
    </html>
  )
}
