import { getCategoryConfig } from '@/lib/categoryConfig';

export default function CategoryBadge({ category, size = 'md' }) {
  const config = getCategoryConfig(category);
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-${config.color}-100 text-${config.color}-600 ${sizeClasses}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}