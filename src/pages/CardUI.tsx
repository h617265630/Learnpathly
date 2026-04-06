import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const sampleCards = [
  { id: 1, title: 'Getting Started with React', category: 'Frontend', type: 'video', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop' },
  { id: 2, title: 'Python Data Analysis', category: 'Data', type: 'document', thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop' },
  { id: 3, title: 'Machine Learning Basics', category: 'AI/ML', type: 'article', thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=400&fit=crop' },
]

export default function CardUI() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Card UI
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 leading-[0.9]">
                Card
                <br />
                <span className="text-amber-500">Showcase.</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sampleCards.map((card) => (
            <article
              key={card.id}
              className="overflow-hidden rounded-md bg-white border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-500 cursor-pointer"
            >
              <div className="relative bg-stone-100 overflow-hidden" style={{ width: '100%', aspectRatio: '16 / 9' }}>
                <img
                  src={card.thumbnail || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop'}
                  alt={card.title}
                  className="block w-full h-full object-cover object-center"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                    {card.type}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                  {card.category}
                </span>
                <h3 className="mt-1.5 text-sm font-semibold text-stone-800 leading-snug line-clamp-2">
                  {card.title}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}