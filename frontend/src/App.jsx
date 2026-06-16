import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RotaProtegida from './components/layout/RotaProtegida'
import RotaAdmin from './components/layout/RotaAdmin'
import GuardaOnboarding from './components/layout/GuardaOnboarding'
import Layout from './components/layout/Layout'
import LayoutAdmin from './components/layout/LayoutAdmin'
import Login from './pages/auth/Login'
import Cadastro from './pages/auth/Cadastro'
import Dashboard from './pages/dashboard/Dashboard'
import ShapeScore from './pages/shape-score/ShapeScore'
import ShapeFuture from './pages/shape-future/ShapeFuture'
import CoachIA from './pages/coach-ia/CoachIA'
import Treinos from './pages/treinos/Treinos'
import Dieta from './pages/dieta/Dieta'
import Evolucao from './pages/evolucao/Evolucao'
import Mais from './pages/mais/Mais'
import AdminDashboard from './pages/admin/AdminDashboard'
import AlunoList from './pages/admin/AlunoList'
import AlunoForm from './pages/admin/AlunoForm'
import TreinoList from './pages/admin/TreinoList'
import TreinoForm from './pages/admin/TreinoForm'
import ExercicioList from './pages/admin/ExercicioList'
import ExercicioForm from './pages/admin/ExercicioForm'
import AdminDieta from './pages/admin/AdminDieta'
import DietaForm from './pages/admin/DietaForm'
import AdminPersonais from './pages/admin/AdminPersonais'
import PersonalForm from './pages/admin/PersonalForm'
import AdminNutricionistas from './pages/admin/AdminNutricionistas'
import NutricionistaForm from './pages/admin/NutricionistaForm'
import AvaliacaoList from './pages/admin/AvaliacaoList'
import AvaliacaoView from './pages/admin/AvaliacaoView'
import QuestionarioList from './pages/admin/QuestionarioList'
import QuestionarioForm from './pages/admin/QuestionarioForm'
import Onboarding from './pages/onboarding/Onboarding'
import MinhaAvaliacao from './pages/avaliacao/MinhaAvaliacao'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          {/* Aluno */}
          <Route element={<RotaProtegida />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<GuardaOnboarding />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/shape-score" element={<ShapeScore />} />
              <Route path="/shape-future" element={<ShapeFuture />} />
              <Route path="/coach-ia" element={<CoachIA />} />
              <Route path="/treinos" element={<Treinos />} />
              <Route path="/dieta" element={<Dieta />} />
              <Route path="/evolucao" element={<Evolucao />} />
              <Route path="/mais" element={<Mais />} />
              <Route path="/minha-avaliacao" element={<MinhaAvaliacao />} />
            </Route>
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<RotaAdmin />}>
            <Route element={<LayoutAdmin />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/alunos" element={<AlunoList />} />
              <Route path="/admin/alunos/novo" element={<AlunoForm />} />
              <Route path="/admin/alunos/:id" element={<AlunoForm />} />
              <Route path="/admin/treinos" element={<TreinoList />} />
              <Route path="/admin/treinos/novo" element={<TreinoForm />} />
              <Route path="/admin/treinos/:id" element={<TreinoForm />} />
              <Route path="/admin/exercicios" element={<ExercicioList />} />
              <Route path="/admin/exercicios/novo" element={<ExercicioForm />} />
              <Route path="/admin/exercicios/:id" element={<ExercicioForm />} />
              <Route path="/admin/avaliacoes" element={<AvaliacaoList />} />
              <Route path="/admin/avaliacoes/:id" element={<AvaliacaoView />} />
              <Route path="/admin/questionario" element={<QuestionarioList />} />
              <Route path="/admin/questionario/novo" element={<QuestionarioForm />} />
              <Route path="/admin/questionario/:id" element={<QuestionarioForm />} />
              <Route path="/admin/dieta" element={<AdminDieta />} />
              <Route path="/admin/dieta/novo" element={<DietaForm />} />
              <Route path="/admin/dieta/:id" element={<DietaForm />} />
              <Route path="/admin/personais" element={<AdminPersonais />} />
              <Route path="/admin/personais/novo" element={<PersonalForm />} />
              <Route path="/admin/personais/:id" element={<PersonalForm />} />
              <Route path="/admin/nutricionistas" element={<AdminNutricionistas />} />
              <Route path="/admin/nutricionistas/novo" element={<NutricionistaForm />} />
              <Route path="/admin/nutricionistas/:id" element={<NutricionistaForm />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
