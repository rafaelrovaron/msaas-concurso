import StudyByMateria from '@/components/study/StudyByMateria'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Carrega matérias existentes (MVP: carrega todas e deduplica)
  const { data, error } = await supabase
    .from('questions')
    .select('materia')

  const materias = Array.from(new Set((data ?? []).map((x) => x.materia))).sort()

  return (
    <div className="p-8">
      <StudyByMateria materias={materias} />
    </div>
  )
}
