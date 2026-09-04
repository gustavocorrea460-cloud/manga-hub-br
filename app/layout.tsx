import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Manga Hub BR — Mangás em Português",
    template: "%s — Manga Hub BR",
  },
  description:
    "Agregador de mangás traduzidos para o português brasileiro. Leia online os melhores mangás em PT-BR.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Manga Hub BR",
    title: "Manga Hub BR — Mangás em Português",
    description:
      "Agregador de mangás traduzidos para o português brasileiro. Leia online os melhores mangás em PT-BR.",
  },
}

export const viewport: Viewport = {
  themeColor: "#0d0d0f",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
