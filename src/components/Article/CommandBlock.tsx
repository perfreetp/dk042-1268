import type { Command } from '@/types';
import { Badge } from '@/components/UI/Badge';
import CopyButton from '@/components/UI/CopyButton';
import { cn } from '@/lib/utils';

interface CommandBlockProps {
  command: Command;
  className?: string;
}

const riskLevelConfig: Record<
  'low' | 'medium' | 'high',
  { variant: 'success' | 'warning' | 'danger'; label: string }
> = {
  low: { variant: 'success', label: '低风险' },
  medium: { variant: 'warning', label: '中风险' },
  high: { variant: 'danger', label: '高风险' },
};

export default function CommandBlock({ command, className }: CommandBlockProps) {
  const riskConfig = riskLevelConfig[command.riskLevel];

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white overflow-hidden',
        'transition-all duration-200 hover:border-slate-300',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 min-w-0">
          <h4 className="text-base font-semibold text-slate-900 truncate">
            {command.name}
          </h4>
          <Badge variant={riskConfig.variant}>
            {riskConfig.label}
          </Badge>
        </div>
        <CopyButton text={command.content} />
      </div>

      <div className="relative group">
        <pre className="bg-slate-900 text-slate-100 p-5 overflow-x-auto">
          <code className="font-mono text-sm leading-relaxed">
            {command.content}
          </code>
        </pre>
      </div>

      {command.description && (
        <div className="px-5 py-4 bg-slate-50/30 border-t border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed">
            {command.description}
          </p>
        </div>
      )}
    </div>
  );
}
