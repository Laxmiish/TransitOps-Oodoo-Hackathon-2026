import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Sign from './pages/Sign';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import FuelExpenses from './pages/FuelExpenses';
import Reports from './pages/Reports';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/sign" element={<Sign />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<ProtectedRoute section="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute section="vehicles"><Vehicles /></ProtectedRoute>} />
            <Route path="/drivers" element={<ProtectedRoute section="drivers"><Drivers /></ProtectedRoute>} />
            <Route path="/trips" element={<ProtectedRoute section="trips"><Trips /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute section="maintenance"><Maintenance /></ProtectedRoute>} />
            <Route path="/fuel-expenses" element={<ProtectedRoute section="fuel"><FuelExpenses /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute section="reports"><Reports /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
