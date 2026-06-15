import { useState } from 'react';
import {
  ShoppingCart,
  CreditCard,
  Users,
  MessageSquare,
  Search as SearchIcon,
  Network,
  Database,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import type { ServiceType } from '@/types';
import { useArticleStore } from '@/store/articleStore';
import { cn } from '@/lib/utils';

const serviceConfig: Array<{
  key: ServiceType | 'all';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'all', label: '全部服务', icon: LayoutGrid },
  { key: 'order', label: '订单服务', icon: ShoppingCart },
  { key: 'payment', label: '支付服务', icon: CreditCard },
  { key: 'user', label: '用户服务', icon: Users },
  { key: 'message', label: '消息服务', icon: MessageSquare },
  { key: 'search', label: '搜索服务', icon: SearchIcon },
  { key: 'gateway', label: '网关服务', icon: Network },
  { key: 'database', label: '数据库', icon: Database },
  { key: 'cache', label: '缓存服务', icon: HardDrive },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { filter, setFilter, getArticlesByService } = useArticleStore();
  const counts = getArticlesByService();

  const handleServiceClick = (service: ServiceType | 'all') => {
    setFilter({ service });
    onMobileClose?.();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      <div
        className={cn(
          'flex-1 overflow-y-auto py-4',
          collapsed ? 'px-2' : 'px-3'
        )}
      >
        <nav className="space-y-1">
          {serviceConfig.map(({ key, label, icon: Icon }) => {
            const isActive = filter.service === key;
            const count = counts[key] || 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleServiceClick(key)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg transition-all duration-200',
                  collapsed ? 'justify-center py-3 px-0' : 'py-2.5 px-3',
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/10 to-blue-500/10 text-teal-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive ? 'text-teal-600' : ''
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-sm">{label}</span>
                    <span
                      className={cn(
                        'inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full text-xs font-medium',
                        isActive
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {count}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center justify-center rounded-lg py-2.5',
            'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
            'transition-colors'
          )}
          title={collapsed ? '展开' : '折叠'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="ml-2 text-sm">折叠</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'hidden md:flex flex-col transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[240px]'
        )}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="absolute left-0 top-0 h-full w-[260px] shadow-xl animate-in slide-in-from-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
