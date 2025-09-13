import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { GQLProvider } from 'iso-gql-client'
import { gqlClient, cacheManager } from '../lib/gql-client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ISO GQL Client Demo',
  description: 'Demonstration of ISO/IEC 39075:2024 GQL Client with Merkle DAG',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GQLProvider client={gqlClient} cache={cacheManager}>
          <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  ISO GQL Client Demo
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Merkle DAG based GQL client following ISO/IEC 39075:2024 standard
                </p>
              </div>
            </header>
            <main>
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </GQLProvider>
      </body>
    </html>
  )
}
