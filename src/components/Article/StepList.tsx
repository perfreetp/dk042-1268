import { useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import type { Step } from '@/types';
import CopyButton from '@/components/UI/CopyButton';
import { Badge } from '@/components/UI/Badge';
import { cn } from '@/lib/utils';

interface StepListProps {
  steps: Step[];
  className?: string;
}

interface StepItemProps {
  step: Step;
  index: number;
  isLast: boolean;
}

function StepItem({ step, index, isLast }: StepItemProps) {
  const [completed, setCompleted] = useState(false);

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => setCompleted(!completed)}
          className={cn(
            'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
            completed
              ? 'border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-500/30'
              : 'border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-600'
          )}
        >
          {completed ? (
            <Check className="h-5 w-5" />
          ) : (
            <span className="text-sm font-semibold">{index + 1}</span>
          )}
        </button>
        {!isLast && (
          <div
            className={cn(
              'absolute top-12 bottom-0 w-0.5 transition-colors duration-500',
              completed ? 'bg-teal-200' : 'bg-slate-200'
            )}
          />
        )}
      </div>

      <div
        className={cn(
          'flex-1 rounded-2xl border p-5 transition-all duration-300',
          completed
            ? 'border-teal-100 bg-teal-50/30'
            : 'border-slate-200 bg-white hover:border-slate-300'
        )}
      >
        <h4 className="text-base font-semibold text-slate-900 mb-2">
          {step.description.split('。')[0]}
        </h4>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          {step.description}
        </p>

        {step.checkCommand && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">检查命令</span>
              <CopyButton text={step.checkCommand} />
            </div>
            <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
              <code className="font-mono">{step.checkCommand}</code>
            </pre>
          </div>
        )}

        {step.expectedResult && (
          <div className="mb-3 p-3 rounded-lg bg-green-50 border border-green-100">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-green-700">预期结果：</span>
                <p className="text-sm text-green-700 mt-1">{step.expectedResult}</p>
              </div>
            </div>
          </div>
        )}

        {step.abnormalHandle && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <Badge variant="warning" className="mb-1">异常处理</Badge>
                <p className="text-sm text-amber-800">{step.abnormalHandle}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StepList({ steps, className }: StepListProps) {
  if (steps.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        暂无排查步骤
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, index) => (
        <StepItem
          key={step.id || `${index}`}
          step={step}
          index={index}
          isLast={index === steps.length - 1}
        />
      ))}
    </div>
  );
}
