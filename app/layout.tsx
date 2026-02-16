import './globals.css'
import Header from '@/components/layout/Header'


export const metadata = {
  title: 'Micro-SaaS Concurso',
  description: 'MVP - Fase 0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">
        <Header />
        {children}
      </body>
    </html>
  )
}
