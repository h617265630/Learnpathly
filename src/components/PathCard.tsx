import { Link } from 'react-router-dom'
import './card-ui.css' // 假设这个文件包含了基础的卡片样式
import { Badge } from '@/components/ui/Badge' // 引入您自己的 Badge 组件

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&h=506&fit=crop';

export type PathCardProps = {
  id: string
  title: string
  description: string
  category: string
  typeLabel: string
  level: string
  items?: number
  thumbnail: string
  hotScore?: number
  forkCount?: number
}

export type PoolPath = PathCardProps

interface PoolPathCardProps {
  path: PathCardProps
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  showTypeLabel?: boolean
}

// 辅助函数，根据类型标签返回对应的 Tailwind CSS 文本颜色类
function typeTextColor(typeLabel: string): string {
  const t = typeLabel.toLowerCase()
  if (t.includes('linear')) return 'text-cyan-600'
  if (t.includes('struct')) return 'text-violet-600'
  if (t.includes('pool') || t.includes('partical')) return 'text-amber-600'
  return 'text-stone-500' // 默认颜色稍微加深
}

// 辅助函数，根据类型标签返回对应的 Tailwind CSS 徽章背景色类
function typeBadgeBgColor(typeLabel: string): string {
    const t = typeLabel.toLowerCase()
    if (t.includes('linear')) return 'bg-cyan-50'
    if (t.includes('struct')) return 'bg-violet-50'
    if (t.includes('pool') || t.includes('partical')) return 'bg-amber-50'
    return 'bg-stone-100' // 默认背景
}

export function PathCard({ path, onEdit, onDelete, showTypeLabel = true }: PoolPathCardProps) {
  return (
    <article className="group shrink-0 w-full lg:w-72 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden border border-gray-100 bg-white cursor-pointer relative">
      {/* 使用 Link 包裹整个可点击区域，提供更好的可访问性 */}
      <Link to={`/learningpath/${path.id}`} className="flex flex-col h-full">
        {/* Thumbnail or Placeholder */}
        <div className="relative h-36 md:h-36 bg-gray-50 overflow-hidden mt-8 md:mt-0 mb-4 md:mb-0">
          {path.thumbnail ? (
            <img
              src={path.thumbnail}
              alt={path.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-4xl font-extrabold text-gray-400">{path.title.charAt(0)}</span>
            </div>
          )}

          {/* Type label overlay (using Badge for consistency) */}
          {showTypeLabel && path.typeLabel && path.typeLabel !== 'Path' && (
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="outline" className={`${typeBadgeBgColor(path.typeLabel)} ${typeTextColor(path.typeLabel)} border-none text-xs px-2 py-0.5 font-semibold`}>
                {path.typeLabel}
              </Badge>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Category */}
          <Badge variant="secondary" className="mb-2 w-fit text-xs font-medium text-gray-500 bg-gray-100">
            {path.category}
          </Badge>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 leading-tight">
            {path.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-3 mb-3 flex-grow">
            {path.description || '暂无描述。'}
          </p>

          {/* Hot Score & Level */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
            <Badge variant="outline" className="text-[10px] font-medium text-gray-600 bg-gray-100 border-none">
                {path.level}
            </Badge>
            <div className="flex items-center gap-3">
              {path.forkCount !== undefined && path.forkCount > 0 && (
                <span className="text-xs font-semibold text-stone-400 flex items-center gap-0.5" title={`${path.forkCount} forks`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                    <path d="M6 3a1 1 0 0 0-2 0v2H2a1 1 0 0 0-1 1v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1h-2V3a1 1 0 0 0-2 0v2h-2V3a1 1 0 0 0-2 0v2H8V3a1 1 0 0 0-2 0zm10 4H8v2h8V7zM6 7H2v6h4V7zm8 0v6h4V7h-4z"/>
                  </svg>
                  {path.forkCount}
                </span>
              )}
              {path.hotScore !== undefined && path.hotScore > 0 ? (
                <span className="text-xs font-semibold text-amber-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5 fill-current" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                  {path.hotScore}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>

      {/* Action buttons (only visible on hover for enhanced experience) */}
      {(onEdit || onDelete) && (
        <div className="absolute inset-x-0 bottom-0 py-2 px-4 bg-white bg-opacity-95 backdrop-blur-sm flex items-center gap-2 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out z-20 border-t border-gray-100">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(path.id); }}
              className="flex-1 h-8 text-xs font-semibold uppercase tracking-wider border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors rounded-md shadow-sm"
            >
              edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(path.id); }}
              className="flex-1 h-8 text-xs font-semibold uppercase tracking-wider border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors rounded-md shadow-sm"
            >
              delete
            </button>
          )}
        </div>
      )}
    </article>
  )
}