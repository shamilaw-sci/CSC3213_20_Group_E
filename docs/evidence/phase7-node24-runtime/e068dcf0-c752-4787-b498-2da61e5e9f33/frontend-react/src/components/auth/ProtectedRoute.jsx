import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/UserAuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    if (!user) {
        // Not logged in
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Logged in but incorrect role (e.g. buyer trying to access agent dashboard)
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
