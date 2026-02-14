import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Communities from './pages/Communities';
import Upload from './pages/Upload';
import DataExplorer from './pages/DataExplorer';
import Search from './pages/Search';
import SearchArchive from './pages/SearchArchive';
import KnowledgeGraph from './pages/KnowledgeGraph';
import Contributions from './pages/Contributions';
import LayoutWrapper from './components/layout/Layout';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Simple Layout for pages that don't use the new Main Layout (like login)
const SimpleLayout = ({ children }) => {
  return (
    <div className="app-layout">
      {/* We are removing the old Navbar from the global layout since new Layout has Header/Sidebar */}
      <div className="container">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Unprotected Routes */}
          <Route path="/login" element={<SimpleLayout><Login /></SimpleLayout>} />
          <Route path="/register" element={<SimpleLayout><Register /></SimpleLayout>} />

          {/* Protected Routes using New LayoutWrapper */}
          <Route element={<ProtectedRoute><LayoutWrapper /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
            <Route path="/search" element={<SearchArchive />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/communities/:id" element={<Community />} />
            <Route path="/communities/:id/upload" element={<Upload />} />
            <Route path="/upload" element={<Navigate to="/communities" replace />} />
            <Route path="/data" element={<DataExplorer />} />
            <Route path="/semantic-search" element={<Search />} />
            <Route path="/contributions" element={<Contributions />} />
            <Route path="/settings" element={<div>Settings (Coming Soon)</div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
