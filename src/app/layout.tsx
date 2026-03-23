import './globals.css'
import Header from '@/components/layout/Header'

export const metadata = {
  title: 'Concurso Boost',
  description: 'Micro-SaaS para prática de concursos públicos',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 pt-16">
        <Header />
        {children}
      </body>
    </html>
  )
}
