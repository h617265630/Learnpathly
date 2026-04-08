import { Badge } from '@/components/ui/Badge'
import './card-ui.css'

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
  source?: string
  status?: string
}

export type PoolPath = PathCardProps

interface PoolPathCardProps {
  path: PathCardProps
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showTypeLabel?: boolean
  showSource?: boolean
}

function typeTextColor(typeLabel: string): string {
  const t = typeLabel.toLowerCase()
  if (t.includes('linear')) return 'text-cyan-600'
  if (t.includes('struct')) return 'text-violet-600'
  if (t.includes('pool') || t.includes('partical')) return 'text-amber-600'
  return 'text-stone-500'
}

function typeBadgeBgColor(typeLabel: string): string {
  const t = typeLabel.toLowerCase()
  if (t.includes('linear')) return 'bg-cyan-50'
  if (t.includes('struct')) return 'bg-violet-50'
  if (t.includes('pool') || t.includes('partical')) return 'bg-amber-50'
  return 'bg-stone-100'
}

function sourceBadgeStyle(source: string | undefined): { bg: string; text: string } {
  if (source === 'forked') return { bg: 'bg-violet-50', text: 'text-violet-700' }
  if (source === 'saved') return { bg: 'bg-emerald-50', text: 'text-emerald-700' }
  if (source === 'created') return { bg: 'bg-amber-50', text: 'text-amber-700' }
  return { bg: 'bg-stone-100', text: 'text-stone-600' }
}

export function PathCard({ path, onClick, onEdit, onDelete, showTypeLabel = true, showSource = false }: PoolPathCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick()
    } else {
      window.location.href = `/learningpath/${path.id}`
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onEdit?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onDelete?.()
  }

  return (
    <article
      className="group w-full shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border border-stone-100 bg-white cursor-pointer rounded-none hover:scale-[1.02]"
      onClick={handleCardClick}
    >
      <div className="flex flex-col">
        {/* Thumbnail */}
        <div className="relative bg-stone-100 overflow-hidden aspect-video">
          {path.thumbnail ? (
            <img
              src={path.thumbnail}
              alt={path.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
              <span className="text-4xl font-black text-stone-300">{path.title.charAt(0)}</span>
            </div>
          )}

          {showTypeLabel && path.typeLabel && path.typeLabel !== 'Path' && (
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="outline" className={`${typeBadgeBgColor(path.typeLabel)} ${typeTextColor(path.typeLabel)} border-none text-[10px] px-2 py-0.5 font-bold tracking-wide`}>
                {path.typeLabel}
              </Badge>
            </div>
          )}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
            {showSource && path.source && (
              <Badge variant="outline" className={`${sourceBadgeStyle(path.source).bg} ${sourceBadgeStyle(path.source).text} border-none text-[10px] px-2 py-0.5 font-bold tracking-wide`}>
                {path.source}
              </Badge>
            )}
            {path.status === 'draft' && (
              <Badge variant="outline" className="bg-stone-800 text-white border-none text-[10px] px-2 py-0.5 font-bold tracking-wide">
                Draft
              </Badge>
            )}
          </div>

          {/* Edit / Delete action row — only visible on hover */}
          {(onEdit || onDelete) && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {onEdit && (
                <button
                  type="button"
                  onClick={handleEdit}
                  title="Edit"
                  className="flex items-center justify-center w-8 h-8 rounded-sm bg-white border border-stone-200 text-amber-600 hover:text-amber-700 hover:border-amber-300 transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  title="Delete"
                  className="flex items-center justify-center w-8 h-8 rounded-sm bg-white border border-stone-200 text-rose-600 hover:text-rose-700 hover:border-rose-300 transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-3 flex flex-col">
          <Badge variant="secondary" className="mb-1.5 w-fit text-[10px] font-semibold text-stone-500 bg-stone-100 tracking-wide uppercase">
            {path.category}
          </Badge>

          <h3 className="text-sm font-bold text-stone-900 line-clamp-2 mb-1.5 leading-snug">
            {path.title}
          </h3>

          <p className="text-xs text-stone-400 line-clamp-2 mb-3">
            {path.description || '暂无描述。'}
          </p>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] font-medium text-stone-400 bg-stone-50 border-none tracking-wide">
              {path.level}
            </Badge>
            <div className="flex items-center gap-3">
              {path.forkCount !== undefined && path.forkCount > 0 && (
                <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M6 3a1 1 0 0 0-2 0v2H2a1 1 0 0 0-1 1v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1h-2V3a1 1 0 0 0-2 0v2h-2V3a1 1 0 0 0-2 0v2H8V3a1 1 0 0 0-2 0zm10 4H8v2h8V7zM6 7H2v6h4V7zm8 0v6h4V7h-4z"/>
                  </svg>
                  {path.forkCount}
                </span>
              )}
              {path.hotScore !== undefined && path.hotScore > 0 ? (
                <span className="text-[11px] font-semibold text-amber-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-0.5 fill-current" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                  {path.hotScore}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
