import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-border bg-card/30 flex items-center justify-between px-8 sticky top-0 backdrop-blur-md z-10">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-go animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono">Engine Connected (AWS/Local)</span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Server Badge */}
            <span className="px-2.5 py-1 rounded bg-go/10 text-go border border-go/20 text-xs font-mono">
              Go REST API v1
            </span>
          </div>
        </header>

        {/* Page Content wrapper */}
        <div className="p-8 max-w-7xl w-full mx-auto flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
