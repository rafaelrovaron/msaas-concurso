export default function Button({
  children,
  loading,
  type = 'button',
}: {
  children: React.ReactNode
  loading?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      disabled={loading}
      className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
    >
      {loading ? 'Carregando...' : children}
    </button>
  )
}
