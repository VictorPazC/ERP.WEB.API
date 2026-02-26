import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import InventoryPage from './pages/Inventory';
import Tags from './pages/Tags';
import Promotions from './pages/Promotions';
import ProductImages from './pages/ProductImages';
import Users from './pages/Users';
import ArticulosDisponibles from './pages/ArticulosDisponibles';
import Consumptions from './pages/Consumptions';
import Login from './pages/Login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ThemedToaster() {
  const isDark = document.documentElement.classList.contains('dark');
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          color: isDark ? '#f9fafb' : '#111827',
          border: isDark ? '1px solid rgba(55, 65, 81, 0.5)' : '1px solid rgba(229, 231, 235, 0.8)',
          borderRadius: '14px',
          fontSize: '14px',
          padding: '12px 16px',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        },
        success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
  );
}

function AppRoutes() {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="categories" element={<Categories />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="tags" element={<Tags />} />
        <Route path="promotions" element={<Promotions />} />
        <Route path="product-images" element={<ProductImages />} />
        <Route path="users" element={<Users />} />
        <Route path="articulos" element={<ArticulosDisponibles />} />
        <Route path="consumptions" element={<Consumptions />} />
        <Route path="login" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <ThemedToaster />
        </QueryClientProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
