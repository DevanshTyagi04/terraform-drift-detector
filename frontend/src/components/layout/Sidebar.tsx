import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Boxes, Clock, Settings, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/workspaces', label: 'Workspaces', icon: Boxes },
    { to: '/history', label: 'History', icon: Clock },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col">
      {/* Brand Header */}
      <div className="p-6 border-b border-border flex items-center space-x-3">
        <Layers className="h-6 w-6 text-terraform" />
        <div>
          <h1 className="font-bold text-lg text-foreground tracking-tight">driftctl</h1>
          <p className="text-xs text-muted-foreground font-mono">Drift Detector</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-terraform/10 text-terraform border-l-2 border-terraform'
                    : 'text-muted-foreground hover:bg-border/50 hover:text-foreground'
                )
              }
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-background/30 text-center">
        <p className="text-2xs text-muted-foreground font-mono">v2.0.0-react</p>
      </div>
    </aside>
  );
}
