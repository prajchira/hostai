import type { Metadata } from 'next'
import './globals.css'
import { sohne } from './fonts'  // Import from local fonts.ts

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export const revalidate = 3600 // Revalidate every hour

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sohne.variable} font-sans`}>
      <body>{children}</body>
    </html>
  )
}
