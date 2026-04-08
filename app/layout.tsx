import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Knecht. | Je digitale wielrenknecht',
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
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23F5F7FA'/><text x='50%25' y='52%25' dominant-baseline='central' text-anchor='middle' font-size='20' font-weight='900' fill='%230B1220' font-family='sans-serif'>K</text></svg>"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
