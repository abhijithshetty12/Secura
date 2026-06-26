import { Route, Routes, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import { useAuth } from './firebase/useAuth'
import AuthPage from './pages/AuthPage'
import SetPinPage from './pages/SetPinPage'

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/set-pin"
        element={user ? <SetPinPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/auth" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}


