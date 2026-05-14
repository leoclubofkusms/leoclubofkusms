
```javascript
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'KUSMS Leo Club - Leadership Through Service',
  description: 'Official Management System for Leo Club of KUSMS',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-medical-bg min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
