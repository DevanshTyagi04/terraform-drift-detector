import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Workspaces from '@/pages/Workspaces';
import WorkspaceDetails from '@/pages/WorkspaceDetails';
import CreateWorkspace from '@/pages/CreateWorkspace';
import ScanDetails from '@/pages/ScanDetails';
import History from '@/pages/History';
import Settings from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workspaces" element={<Workspaces />} />
            <Route path="/workspaces/new" element={<CreateWorkspace />} />
            <Route path="/workspaces/:id" element={<WorkspaceDetails />} />
            <Route path="/scans/:id" element={<ScanDetails />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
