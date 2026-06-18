import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RotaProtegida from './components/layout/RotaProtegida'
import RotaAdmin from './components/layout/RotaAdmin'
import RotaNutricionista from './components/layout/RotaNutricionista'
import GuardaOnboarding from './components/layout/GuardaOnboarding'
import LayoutAdmin from './components/layout/LayoutAdmin'
import Login from './pages/auth/Login'
import Cadastro from './pages/auth/Cadastro'
import EsqueciSenha from './pages/auth/EsqueciSenha'
import RedefinirSenha from './pages/auth/RedefinirSenha'
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
import AdminMenuConfig from './pages/admin/AdminMenuConfig'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import UsuarioForm from './pages/admin/UsuarioForm'
import AdminPlanos from './pages/admin/AdminPlanos'
import PlanoForm from './pages/admin/PlanoForm'
import AdminAssinaturas from './pages/admin/AdminAssinaturas'
import AssinaturaForm from './pages/admin/AssinaturaForm'
import AdminEvolucaoAlunos from './pages/admin/AdminEvolucaoAlunos'
import AdminEvolucaoAluno from './pages/admin/AdminEvolucaoAluno'
import AdminIntegracoes from './pages/admin/AdminIntegracoes'
import AdminLogs from './pages/admin/AdminLogs'
import AdminDesafios from './pages/admin/AdminDesafios'
import AdminConfiguracoes from './pages/admin/AdminConfiguracoes'
import AdminPagamentos from './pages/admin/AdminPagamentos'
import Feed from './pages/Feed'
import Conquistas from './pages/Conquistas'
import Desafios from './pages/Desafios'
import Ranking from './pages/Ranking'
import Perfil from './pages/Perfil'
import NutriDashboard from './pages/nutri/NutriDashboard'
import AvaliacaoList from './pages/admin/AvaliacaoList'
import AvaliacaoView from './pages/admin/AvaliacaoView'
import QuestionarioList from './pages/admin/QuestionarioList'
import QuestionarioForm from './pages/admin/QuestionarioForm'
import Onboarding from './pages/onboarding/Onboarding'
import MinhaAvaliacao from './pages/avaliacao/MinhaAvaliacao'
import Termos from './pages/Termos'
import Privacidade from './pages/Privacidade'

function EmConstrucao() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', color: '#8A7F76', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Página em construção</p>
      <p style={{ fontSize: 14 }}>Esta funcionalidade estará disponível em breve.</p>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Privacidade />} />

          {/* Todas as rotas autenticadas — layout único */}
          <Route element={<RotaProtegida />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<GuardaOnboarding />}>
              <Route element={<LayoutAdmin />}>

                {/* Aluno */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/shape-score" element={<ShapeScore />} />
                <Route path="/shape-future" element={<ShapeFuture />} />
                <Route path="/coach-ia" element={<CoachIA />} />
                <Route path="/treinos" element={<Treinos />} />
                <Route path="/dieta" element={<Dieta />} />
                <Route path="/evolucao" element={<Evolucao />} />
                <Route path="/mais" element={<Mais />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/minha-avaliacao" element={<MinhaAvaliacao />} />
                <Route path="/comunidade" element={<Feed />} />
                <Route path="/comunidade/feed" element={<Feed />} />
                <Route path="/comunidade/ranking" element={<Ranking />} />
                <Route path="/comunidade/desafios" element={<Desafios />} />
                <Route path="/comunidade/conquistas" element={<Conquistas />} />

                {/* Nutricionista */}
                <Route element={<RotaNutricionista />}>
                  <Route path="/nutri" element={<NutriDashboard />} />
                  <Route path="/nutri/dietas" element={<AdminDieta />} />
                  <Route path="/nutri/dietas/novo" element={<DietaForm />} />
                  <Route path="/nutri/dietas/:id" element={<DietaForm />} />
                  <Route path="/nutri/alunos" element={<AlunoList />} />
                  <Route path="/nutri/alunos/:id" element={<AlunoForm />} />
                </Route>

                {/* Admin */}
                <Route element={<RotaAdmin />}>
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
                  <Route path="/admin/menu" element={<AdminMenuConfig />} />
                  <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                  <Route path="/admin/usuarios/novo" element={<UsuarioForm />} />
                  <Route path="/admin/usuarios/:id" element={<UsuarioForm />} />
                  <Route path="/admin/planos" element={<AdminPlanos />} />
                  <Route path="/admin/planos/novo" element={<PlanoForm />} />
                  <Route path="/admin/planos/:id" element={<PlanoForm />} />
                  <Route path="/admin/assinaturas" element={<AdminAssinaturas />} />
                  <Route path="/admin/assinaturas/nova" element={<AssinaturaForm />} />
                  <Route path="/admin/assinaturas/:id" element={<AssinaturaForm />} />
                  <Route path="/admin/integracoes" element={<AdminIntegracoes />} />
                  <Route path="/admin/logs" element={<AdminLogs />} />
                  <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
                  <Route path="/admin/pagamentos" element={<AdminPagamentos />} />
                  <Route path="/admin/desafios" element={<AdminDesafios />} />

                  {/* Gestão */}
                  <Route path="/gestao" element={<AdminDashboard />} />
                  <Route path="/gestao/alunos" element={<AlunoList />} />
                  <Route path="/gestao/alunos/novo" element={<AlunoForm />} />
                  <Route path="/gestao/alunos/:id" element={<AlunoForm />} />
                  <Route path="/gestao/avaliacoes" element={<AvaliacaoList />} />
                  <Route path="/gestao/avaliacoes/:id" element={<AvaliacaoView />} />
                  <Route path="/gestao/evolucao-alunos"     element={<AdminEvolucaoAlunos />} />
                  <Route path="/gestao/evolucao-alunos/:id" element={<AdminEvolucaoAluno />} />

                  {/* Conteúdo */}
                  <Route path="/conteudo/treinos" element={<TreinoList />} />
                  <Route path="/conteudo/treinos/novo" element={<TreinoForm />} />
                  <Route path="/conteudo/treinos/:id" element={<TreinoForm />} />
                  <Route path="/conteudo/dietas" element={<AdminDieta />} />
                  <Route path="/conteudo/dietas/novo" element={<DietaForm />} />
                  <Route path="/conteudo/dietas/:id" element={<DietaForm />} />
                  <Route path="/conteudo/exercicios" element={<ExercicioList />} />
                  <Route path="/conteudo/exercicios/novo" element={<ExercicioForm />} />
                  <Route path="/conteudo/exercicios/:id" element={<ExercicioForm />} />
                  <Route path="/conteudo/questionarios" element={<QuestionarioList />} />
                  <Route path="/conteudo/questionarios/novo" element={<QuestionarioForm />} />
                  <Route path="/conteudo/questionarios/:id" element={<QuestionarioForm />} />
                  <Route path="/conteudo/protocolos" element={<TreinoList />} />
                  <Route path="/conteudo/protocolos/novo" element={<TreinoForm />} />
                  <Route path="/conteudo/protocolos/:id" element={<TreinoForm />} />

                  {/* Equipe */}
                  <Route path="/equipe/personais" element={<AdminPersonais />} />
                  <Route path="/equipe/personais/novo" element={<PersonalForm />} />
                  <Route path="/equipe/personais/:id" element={<PersonalForm />} />
                  <Route path="/equipe/nutricionistas" element={<AdminNutricionistas />} />
                  <Route path="/equipe/nutricionistas/novo" element={<NutricionistaForm />} />
                  <Route path="/equipe/nutricionistas/:id" element={<NutricionistaForm />} />
                </Route>

                {/* Qualquer caminho desconhecido mantém o layout */}
                <Route path="*" element={<EmConstrucao />} />

              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
