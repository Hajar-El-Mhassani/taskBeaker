import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title: 'TaskBreaker - AI-Powered Task Planning',
  description: 'Break down complex tasks into manageable subtasks with intelligent AI scheduling',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
