import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Knecht — Jouw digitale wielrenassistent',
  description: 'Upload je GPX-route en weet precies wat je mee moet nemen.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl" className="h-full">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
