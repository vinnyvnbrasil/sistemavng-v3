import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loading das páginas para otimizar performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Companies = lazy(() => import('./pages/Companies'));
const BlingIntegration = lazy(() => import('./pages/BlingIntegration'));
const Documents = lazy(() => import('./pages/Documents'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Orders = lazy(() => import('./pages/Orders'));
const Profile = lazy(() => import('./pages/Profile'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

// Componente de loading
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Suspense fallback={<LoadingSpinner />}>
            <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Rotas protegidas */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresas"
              element={
                <ProtectedRoute>
                  <Companies />
                </ProtectedRoute>
              }
            />
            <Route path="/bling" element={
                  <ProtectedRoute>
                    <BlingIntegration />
                  </ProtectedRoute>
                } />
                <Route path="/documentos" element={
                <ProtectedRoute>
                  <Documents />
                </ProtectedRoute>
              } />
              <Route path="/tickets" element={
                <ProtectedRoute>
                  <Tickets />
                </ProtectedRoute>
              } />
              <Route path="/pedidos" element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                } />
                <Route path="/perfil" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
            
            {/* Rota padrão */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Rota 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Página não encontrada</p>
                    <a
                      href="/dashboard"
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium transition-colors duration-200"
                    >
                      Voltar ao Dashboard
                    </a>
                  </div>
                </div>
              }
            />
            </Routes>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
