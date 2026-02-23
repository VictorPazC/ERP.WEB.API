import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import InventoryPage from './pages/Inventory';
import Tags from './pages/Tags';
import Promotions from './pages/Promotions';
import ProductImages from './pages/ProductImages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="tags" element={<Tags />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="product-images" element={<ProductImages />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(17, 24, 39, 0.9)',
            backdropFilter: 'blur(16px)',
            color: '#f9fafb',
            border: '1px solid rgba(55, 65, 81, 0.5)',
            borderRadius: '14px',
            fontSize: '14px',
            padding: '12px 16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
