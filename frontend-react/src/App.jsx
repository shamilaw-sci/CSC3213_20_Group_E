import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import MapSearch from './pages/MapSearch';
import AddProperty from './pages/AddProperty';
import Register from './pages/Register';
import MyProperties from './pages/MyProperties';
import Messages from './pages/Messages';



import { AdminAuthProvider } from './pages/admin/context/AdminAuthContext';
import AdminProtectedRoute from './pages/admin/components/AdminProtectedRoute';
import AdminLayout from './pages/admin/components/AdminLayout';
import AdminLogin from './pages/admin/pages/LoginPage';
import AdminDashboard from './pages/admin/pages/DashboardPage';
import AdminListings from './pages/admin/pages/ListingsPage';
import AdminUsers from './pages/admin/pages/UsersPage';
import AdminAnalytics from './pages/admin/pages/AnalyticsPage';
import AdminReports from './pages/admin/pages/ReportsPage';
import AdminSettings from './pages/admin/pages/SettingsPage';
import AdminAuditLogs from './pages/admin/pages/AuditLogsPage';
import AdminMessages from './pages/admin/pages/MessagesPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/map" element={<MapSearch />} />
        <Route path="/add-property" element={<AddProperty />} />
        <Route path="/my-properties" element={<MyProperties />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/register" element={<Register />} />

        

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminAuthProvider />}>
          <Route path="login" element={<AdminLogin />} />
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="listings" element={<AdminListings />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
