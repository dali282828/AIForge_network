import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import Models from './pages/Models'
import ModelUpload from './pages/ModelUpload'
import ModelDetail from './pages/ModelDetail'
import Chat from './pages/Chat'
import NFT from './pages/NFT'
import Infrastructure from './pages/Infrastructure'
import Wallets from './pages/Wallets'
import Marketplace from './pages/Marketplace'
import Revenue from './pages/Revenue'
import Nodes from './pages/Nodes'
import Training from './pages/Training'
import Admin from './pages/Admin'
import Experiments from './pages/Experiments'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  if (!isAdmin) {
    return <Navigate to="/" />
  }
  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Public Marketplace Route */}
        <Route
          path="/marketplace"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Marketplace />} />
        </Route>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="groups" element={<Groups />} />
          <Route path="groups/:id" element={<GroupDetail />} />
          <Route path="groups/:groupId/models" element={<Models />} />
          <Route path="groups/:groupId/models/upload" element={<ModelUpload />} />
          <Route path="groups/:groupId/models/:modelId" element={<ModelDetail />} />
          <Route path="chat" element={<Chat />} />
          <Route path="nft" element={<NFT />} />
          <Route path="infrastructure" element={<Infrastructure />} />
          <Route path="wallets" element={<Wallets />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="nodes" element={<Nodes />} />
          <Route path="training" element={<Training />} />
          <Route path="experiments/:experimentId" element={<Experiments />} />
          <Route 
            path="admin" 
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } 
          />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

