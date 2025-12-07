import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: '终末地拼图解谜工具',
  description: '一个用于解决「明日方舟：终末地」拼图谜题的工具',
  keywords: ['终末地', '明日方舟终末地', '终末地 拼图', '终末地 谜题', '终末地 解谜'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
