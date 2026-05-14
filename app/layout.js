 'use client' // Required for ErrorBoundary and client components

import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata = {
  title: 'KUSMS Leo Club - Leadership Through Service',
  description: 'Official Management System for Leo Club of KUSMS',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-medical-bg min-h-screen flex flex-col">
        <ErrorBoundary>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </ErrorBoundary>
      </body>
    </html>
  )
}
