import { Salad } from 'lucide-react'

export default function AdminDieta() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Dieta</h1>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>Monte e gerencie planos alimentares dos alunos</p>
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <Salad size={36} color="#C4B9A8" />
        <p style={{ fontSize: 15, fontWeight: 600, color: '#8A7F76' }}>Planos alimentares em breve</p>
        <p style={{ fontSize: 13, color: '#C4B9A8' }}>Aqui você vai criar dietas personalizadas por aluno</p>
      </div>
    </div>
  )
}
