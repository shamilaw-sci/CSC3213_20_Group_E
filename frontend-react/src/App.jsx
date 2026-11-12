import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { UserAuthProvider } from './context/UserAuthContext';
import { ThemeProvider } from './context/ThemeProvider';
import { CompareProvider } from './context/CompareContext';
import { AdminAuthProvider } from './pages/admin/context/AdminAuthContext';
import { MotionConfig, LazyMotion, domAnimation } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents excessive refetching when switching tabs
      retry: 1, // Only retry failed requests once
    },
  },
});

// Components that should load immediately
import FloatingAIChat from './components/ai/FloatingAIChat';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './pages/admin/components/AdminProtectedRoute';
import AdminLayout from './pages/admin/components/AdminLayout';
import CompareActionBar from './components/compare/CompareActionBar';
import CompareMatrixModal from './components/compare/CompareMatrixModal';

// Set global axios configuration
axios.defaults.withCredentials = true;

// Lazy Loaded Pages
const Home = lazy(() => import('./pages/Home'));
const MapSearch = lazy(() => import('./pages/MapSearch'));
const BuyPage = lazy(() => import('./pages/BuyPage'));
const AddProperty = lazy(() => import('./pages/AddProperty'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const MyProperties = lazy(() => import('./pages/MyProperties'));
const Messages = lazy(() => import('./pages/Messages'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const AgentSearch = lazy(() => import('./pages/AgentSearch'));
const AgentProfile = lazy(() => import('./pages/AgentProfile'));
const AgentDashboard = lazy(() => import('./pages/agent/Dashboard'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard'));
const MyFavorites = lazy(() => import('./pages/MyFavorites'));
const PropertyDetails = lazy(() => import('./pages/PropertyDetails'));
const SearchResults = lazy(() => import('./pages/SearchResults'));

// Lazy Loaded Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/pages/LoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/pages/DashboardPage'));
const AdminListings = lazy(() => import('./pages/admin/pages/ListingsPage'));
const AdminUsers = lazy(() => import('./pages/admin/pages/UsersPage'));
const AdminAgentApprovals = lazy(() => import('./pages/admin/pages/AgentApprovalsPage'));
const AdminAnalytics = lazy(() => import('./pages/admin/pages/AnalyticsPage'));
const AdminReports = lazy(() => import('./pages/admin/pages/ReportsPage'));
const AdminSettings = lazy(() => import('./pages/admin/pages/SettingsPage'));
const AdminAuditLogs = lazy(() => import('./pages/admin/pages/AuditLogsPage'));
const AdminMessages = lazy(() => import('./pages/admin/pages/MessagesPage'));
const AdminInquiries = lazy(() => import('./pages/admin/pages/InquiriesPage'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
      <QueryClientProvider client={queryClient}>
      <UserAuthProvider>
        <ThemeProvider>
          <CompareProvider>
          <Router>
          <Toaster position="bottom-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-slate-200' }} />
          <FloatingAIChat />
          <CompareActionBar />
          <CompareMatrixModal />
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/agents" element={<AgentSearch />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/agent/:id" element={<AgentProfile />} />
            <Route path="/agent-dashboard" element={
              <ProtectedRoute allowedRoles={['AGENT', 'PENDING_AGENT', 'REJECTED_AGENT']}>
                <AgentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/seller-dashboard" element={
              <ProtectedRoute allowedRoles={['SELLER']}>
                <SellerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/buyer-dashboard" element={
              <ProtectedRoute allowedRoles={['BUYER', 'USER', 'ADMIN', 'AGENT', 'SELLER']}>
                <BuyerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/buy" element={<BuyPage />} />
            <Route path="/map" element={<MapSearch />} />
            <Route path="/feasibility" element={<Navigate to="/map?feasibility=1" replace />} />
            <Route path="/rent" element={<MapSearch />} />
            <Route path="/add-property" element={
              <ProtectedRoute allowedRoles={['SELLER', 'AGENT']}>
                <AddProperty />
              </ProtectedRoute>
            } />
            <Route path="/my-properties" element={
              <ProtectedRoute allowedRoles={['SELLER', 'AGENT']}>
                <MyProperties />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute>
                <MyFavorites />
              </ProtectedRoute>
            } />
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
                  <Route path="agent-approvals" element={<AdminAgentApprovals />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="messages" element={<AdminMessages />} />
                  <Route path="inquiries" element={<AdminInquiries />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="audit-logs" element={<AdminAuditLogs />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          </Router>
          </CompareProvider>
        </ThemeProvider>
      </UserAuthProvider>
      </QueryClientProvider>
      </LazyMotion>
    </MotionConfig>
  );
}

export default App;
