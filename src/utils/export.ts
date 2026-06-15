import type { Article, Step, Command, Incident, Case } from '@/data/mockArticles';
import { serviceLabels } from '@/data/mockArticles';

export interface ExportOptions {
  title?: string;
  includeSteps?: boolean;
  includeCommands?: boolean;
  includeIncidents?: boolean;
  includeCases?: boolean;
  includeMeta?: boolean;
  includeAttention?: boolean;
  generateTableOfContents?: boolean;
  author?: string;
}

const defaultOptions: Required<Omit<ExportOptions, 'title' | 'author'>> & { title: string; author: string } = {
  title: '故障处理值班手册',
  includeSteps: true,
  includeCommands: true,
  includeIncidents: true,
  includeCases: true,
  includeMeta: true,
  includeAttention: true,
  generateTableOfContents: true,
  author: '知识库系统'
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeMarkdown(text: string): string {
  return text
    .replace(/\|/g, '\\|')
    .replace(/\n{3,}/g, '\n\n');
}

function formatAttention(attention: string | string[]): string {
  if (Array.isArray(attention)) {
    return attention.map(item => `> ⚠️ - ${escapeMarkdown(item)}`).join('\n');
  }
  return `> ⚠️ ${escapeMarkdown(attention)}`;
}

function getStepTitle(step: Step | { title?: string; description: string }, index: number): string {
  if (step.title && step.title.trim()) {
    return escapeMarkdown(step.title);
  }
  return `步骤 ${index + 1}`;
}

function getCommandContent(cmd: Command | { name: string; cmd?: string; content?: string; description: string }): string {
  const cmdRecord = cmd as Record<string, unknown>;
  return (cmdRecord.cmd ?? cmdRecord.content ?? '') as string;
}

function getIncidentDate(inc: Incident | { date?: string; happenedAt?: string; title?: string; impact?: string; duration?: string }): string {
  const incRecord = inc as Record<string, unknown>;
  return (incRecord.date ?? incRecord.happenedAt ?? '-') as string;
}

function getIncidentTitle(inc: Incident | { date?: string; happenedAt?: string; title?: string; impact?: string; duration?: string }): string {
  const incRecord = inc as Record<string, unknown>;
  return (incRecord.title ?? incRecord.impact ?? '未命名事故') as string;
}

function getIncidentImpact(inc: Incident | { date?: string; happenedAt?: string; title?: string; impact?: string; duration?: string }): string {
  const incRecord = inc as Record<string, unknown>;
  return (incRecord.impact ?? incRecord.title ?? '-') as string;
}

function getIncidentDuration(inc: Incident | { date?: string; happenedAt?: string; title?: string; impact?: string; duration?: string }): string {
  const incRecord = inc as Record<string, unknown>;
  return (incRecord.duration ?? '-') as string;
}

function getCaseField(c: Case | { title?: string; environment?: string; description?: string; solution?: string }, field: 'title' | 'environment' | 'description' | 'solution'): string {
  const value = (c as Record<string, unknown>)[field];
  return (value ?? '-') as string;
}

function generateArticleMarkdown(
  article: Article,
  index: number,
  options: Required<ExportOptions>
): string {
  const lines: string[] = [];

  lines.push(`## ${index}. ${article.title}`);
  lines.push('');

  if (options.includeMeta) {
    lines.push('### 基本信息');
    lines.push('');
    lines.push('| 属性 | 内容 |');
    lines.push('| :--- | :--- |');
    lines.push(`| 文章ID | ${escapeMarkdown(article.id)} |`);
    lines.push(`| 所属服务 | ${serviceLabels[article.service]} (${article.service}) |`);
    lines.push(`| 错误码 | ${escapeMarkdown(article.errorCodes.join('、'))} |`);
    lines.push(`| 影响版本 | ${escapeMarkdown(article.versions.join('、'))} |`);
    lines.push(`| 标签 | ${escapeMarkdown(article.tags.map(t => `\`${t}\``).join(' '))} |`);
    lines.push(`| 作者 | ${escapeMarkdown(article.author)} |`);
    lines.push(`| 创建时间 | ${formatDate(article.createdAt)} |`);
    lines.push(`| 更新时间 | ${formatDate(article.updatedAt)} |`);
    lines.push(`| 阅读量 | ${article.viewCount} |`);
    lines.push(`| 平均评分 | ${article.ratingAvg.toFixed(1)} / 5.0 (${article.ratingCount}人评价) |`);
    lines.push('');
  }

  lines.push('### 故障现象');
  lines.push('');
  lines.push(escapeMarkdown(article.phenomenon));
  lines.push('');

  if (options.includeAttention && article.attention) {
    lines.push('### 注意事项');
    lines.push('');
    lines.push(formatAttention(article.attention as string | string[]));
    lines.push('');
  }

  if (options.includeSteps && article.steps.length > 0) {
    lines.push('### 排查步骤');
    lines.push('');
    article.steps.forEach((step, i) => {
      lines.push(`**步骤 ${i + 1}：${getStepTitle(step, i)}**`);
      lines.push('');
      lines.push(escapeMarkdown(step.description));
      lines.push('');
    });
  }

  if (options.includeCommands && article.commands.length > 0) {
    lines.push('### 常用命令');
    lines.push('');
    article.commands.forEach(cmd => {
      lines.push(`**${escapeMarkdown(cmd.name)}**`);
      lines.push('');
      lines.push(`> ${escapeMarkdown(cmd.description)}`);
      lines.push('');
      lines.push('```bash');
      lines.push(escapeMarkdown(getCommandContent(cmd)));
      lines.push('```');
      lines.push('');
    });
  }

  if (options.includeIncidents && article.incidents.length > 0) {
    lines.push('### 历史故障记录');
    lines.push('');
    lines.push('| 日期 | 故障标题 | 影响范围 | 持续时间 |');
    lines.push('| :--- | :--- | :--- | :--- |');
    article.incidents.forEach(inc => {
      lines.push(
        `| ${escapeMarkdown(getIncidentDate(inc))} | ${escapeMarkdown(getIncidentTitle(inc))} | ${escapeMarkdown(getIncidentImpact(inc))} | ${escapeMarkdown(getIncidentDuration(inc))} |`
      );
    });
    lines.push('');

    article.incidents.forEach((inc, i) => {
      lines.push(`#### ${i + 1}. ${escapeMarkdown(getIncidentTitle(inc))} (${escapeMarkdown(getIncidentDate(inc))})`);
      lines.push('');
      lines.push(`- **影响范围**：${escapeMarkdown(getIncidentImpact(inc))}`);
      lines.push(`- **持续时间**：${escapeMarkdown(getIncidentDuration(inc))}`);
      lines.push('');
    });
  }

  if (options.includeCases && article.cases.length > 0) {
    lines.push('### 典型案例');
    lines.push('');
    article.cases.forEach((c, i) => {
      lines.push(`#### 案例 ${i + 1}：${escapeMarkdown(getCaseField(c, 'title'))}`);
      lines.push('');
      lines.push(`- **环境**：${escapeMarkdown(getCaseField(c, 'environment'))}`);
      lines.push('');
      lines.push('**问题描述**');
      lines.push('');
      lines.push(escapeMarkdown(getCaseField(c, 'description')));
      lines.push('');
      lines.push('**解决方案**');
      lines.push('');
      lines.push(escapeMarkdown(getCaseField(c, 'solution')));
      lines.push('');
    });
  }

  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

export function generateOnCallManual(
  articles: Article[],
  options: ExportOptions = {}
): string {
  const mergedOptions: Required<ExportOptions> = { ...defaultOptions, ...options };
  const lines: string[] = [];

  lines.push(`# ${mergedOptions.title}`);
  lines.push('');

  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  lines.push(`**生成时间**：${dateStr}`);
  lines.push('');
  lines.push(`**整理人**：${mergedOptions.author}`);
  lines.push('');
  lines.push(`**收录文章**：${articles.length} 篇`);
  lines.push('');

  const serviceGroup = new Map<string, Article[]>();
  articles.forEach(a => {
    const label = serviceLabels[a.service];
    if (!serviceGroup.has(label)) {
      serviceGroup.set(label, []);
    }
    serviceGroup.get(label)!.push(a);
  });

  lines.push('**服务分布**：');
  lines.push('');
  serviceGroup.forEach((list, label) => {
    lines.push(`- ${label}：${list.length} 篇`);
  });
  lines.push('');

  lines.push('---');
  lines.push('');

  if (mergedOptions.generateTableOfContents && articles.length > 0) {
    lines.push('## 目录');
    lines.push('');

    let articleIndex = 1;
    serviceGroup.forEach((list, label) => {
      lines.push(`### ${label}`);
      lines.push('');
      list.forEach(article => {
        const anchor = article.title
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
          .replace(/\s+/g, '-');
        lines.push(`${articleIndex}. [${escapeMarkdown(article.title)}](#${anchor}-${articleIndex})`);
        articleIndex++;
      });
      lines.push('');
    });

    lines.push('---');
    lines.push('');
  }

  serviceGroup.forEach((list, label) => {
    lines.push(`# ${label}`);
    lines.push('');

    list.forEach((article) => {
      const globalIndex =
        articles.indexOf(article) + 1;
      lines.push(generateArticleMarkdown(article, globalIndex, mergedOptions));
    });
  });

  lines.push('## 附录');
  lines.push('');
  lines.push('### 错误码速查表');
  lines.push('');
  lines.push('| 错误码 | 所属文章 | 服务 |');
  lines.push('| :--- | :--- | :--- |');
  articles.forEach(a => {
    a.errorCodes.forEach(ec => {
      lines.push(`| ${escapeMarkdown(ec)} | ${escapeMarkdown(a.title)} | ${serviceLabels[a.service]} |`);
    });
  });
  lines.push('');

  lines.push('*本文档由故障知识库系统自动生成*');
  lines.push('');

  return lines.join('\n');
}

export function downloadMarkdown(content: string, filename?: string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');

    const finalFilename = filename || `值班手册_${timestamp}.md`;

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/markdown;charset=utf-8' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    return true;
  } catch {
    return false;
  }
}

export function exportOnCallManual(
  articles: Article[],
  options?: ExportOptions & { filename?: string }
): boolean {
  const { filename, ...exportOptions } = options || {};
  const markdown = generateOnCallManual(articles, exportOptions);
  return downloadMarkdown(markdown, filename);
}
