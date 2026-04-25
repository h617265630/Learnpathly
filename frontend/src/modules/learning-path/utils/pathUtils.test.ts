import { describe, it, expect } from 'vitest'
import {
  normalizePresentedType,
  toUiResource,
  toCardResource,
  toAbsoluteImageUrl,
  toManualWeight,
} from './pathUtils'
import {
  mapPublicLearningPathToDisplayBase,
  type PublicLearningPath,
} from '@/services/learningPath'

// ─── normalizePresentedType ────────────────────────────────────────────────────

describe('normalizePresentedType', () => {
  it('returns exact match for valid types', () => {
    expect(normalizePresentedType('video')).toBe('video')
    expect(normalizePresentedType('document')).toBe('document')
    expect(normalizePresentedType('article')).toBe('article')
    expect(normalizePresentedType('clip')).toBe('clip')
    expect(normalizePresentedType('link')).toBe('link')
  })

  it('is case-insensitive', () => {
    expect(normalizePresentedType('VIDEO')).toBe('video')
    expect(normalizePresentedType('Document')).toBe('document')
    expect(normalizePresentedType('ARTICLE')).toBe('article')
  })

  it('trims whitespace', () => {
    expect(normalizePresentedType('  video  ')).toBe('video')
  })

  it('returns article for unknown types', () => {
    expect(normalizePresentedType('unknown')).toBe('article')
    expect(normalizePresentedType('podcast')).toBe('article')
    expect(normalizePresentedType('')).toBe('article')
  })

  it('returns article for null and undefined', () => {
    expect(normalizePresentedType(null)).toBe('article')
    expect(normalizePresentedType(undefined)).toBe('article')
  })
})

// ─── toUiResource ─────────────────────────────────────────────────────────────

describe('toUiResource', () => {
  it('maps a full resource object correctly', () => {
    const input = {
      id: 42,
      title: 'React Basics',
      summary: 'Learn React fundamentals',
      source_url: 'https://react.dev',
      resource_type: 'video',
      platform: 'web',
      thumbnail: 'https://example.com/thumb.png',
    }
    const result = toUiResource(input)
    expect(result.id).toBe(42)
    expect(result.title).toBe('React Basics')
    expect(result.summary).toBe('Learn React fundamentals')
    expect(result.source_url).toBe('https://react.dev')
    expect(result.type).toBe('video')
    expect(result.platform).toBe('web')
    expect(result.thumbnail).toBe('https://example.com/thumb.png')
  })

  it('fills in defaults for missing fields', () => {
    const result = toUiResource({ id: 0 })
    expect(result.id).toBe(0)
    expect(result.title).toBe('Resource 0')
    expect(result.summary).toBe('')
    expect(result.source_url).toBeNull()
    expect(result.type).toBe('article')
    expect(result.platform).toBe('')
    expect(result.thumbnail).toBe('')
  })

  it('trims title and summary', () => {
    const result = toUiResource({
      id: 1,
      title: '  Spaces  ',
      summary: '  trimmed  ',
    })
    expect(result.title).toBe('Spaces')
    expect(result.summary).toBe('trimmed')
  })

  it('falls back to Resource {id} for empty title', () => {
    const result = toUiResource({ id: 99, title: '' })
    expect(result.title).toBe('Resource 99')
  })

  it('handles numeric id', () => {
    const result = toUiResource({ id: BigInt(123) } as any)
    expect(result.id).toBe(123)
  })

  it('normalizes resource_type to known type', () => {
    const result = toUiResource({ id: 1, resource_type: 'VIDEO' })
    expect(result.type).toBe('video')
  })

  it('handles null source_url', () => {
    const result = toUiResource({ id: 1, source_url: null })
    expect(result.source_url).toBeNull()
  })
})

// ─── toCardResource ──────────────────────────────────────────────────────────

describe('toCardResource', () => {
  it('maps video type correctly', () => {
    const ui = {
      id: 1,
      title: 'Test',
      summary: '',
      source_url: null,
      type: 'video' as const,
      platform: 'youtube',
      thumbnail: '',
    }
    const result = toCardResource(ui)
    expect(result.typeLabel).toBe('Video')
    expect(result.platform).toBe('youtube')
    expect(result.platformLabel).toBe('youtube')
    expect(result.categoryLabel).toBe('Resource')
    expect(result.categoryColor).toBe('#6b7280')
  })

  it('maps document type correctly', () => {
    const ui = {
      id: 1,
      title: 'Test',
      summary: '',
      source_url: null,
      type: 'document' as const,
      platform: 'pdf',
      thumbnail: '',
    }
    const result = toCardResource(ui)
    expect(result.typeLabel).toBe('Doc')
  })

  it('maps article type correctly', () => {
    const ui = {
      id: 1,
      title: 'Test',
      summary: '',
      source_url: null,
      type: 'article' as const,
      platform: 'web',
      thumbnail: '',
    }
    const result = toCardResource(ui)
    expect(result.typeLabel).toBe('Article')
  })

  it('maps clip type correctly', () => {
    const ui = {
      id: 1,
      title: 'Test',
      summary: '',
      source_url: null,
      type: 'clip' as const,
      platform: 'youtube',
      thumbnail: '',
    }
    const result = toCardResource(ui)
    expect(result.typeLabel).toBe('Clip')
  })

  it('maps link type to Link', () => {
    const ui = {
      id: 1,
      title: 'Test',
      summary: '',
      source_url: null,
      type: 'link' as const,
      platform: '',
      thumbnail: '',
    }
    const result = toCardResource(ui)
    expect(result.typeLabel).toBe('Link')
  })

  it('sets platformLabel to Web for empty platform', () => {
    const ui = {
      id: 1,
      title: 'Test',
      summary: '',
      source_url: null,
      type: 'article' as const,
      platform: '',
      thumbnail: '',
    }
    const result = toCardResource(ui)
    expect(result.platformLabel).toBe('Web')
  })
})

// ─── toAbsoluteImageUrl ───────────────────────────────────────────────────────

describe('toAbsoluteImageUrl', () => {
  it('passes through http and https URLs', () => {
    expect(toAbsoluteImageUrl('https://example.com/img.png')).toBe('https://example.com/img.png')
    expect(toAbsoluteImageUrl('http://example.com/img.png')).toBe('http://example.com/img.png')
  })

  it('passes through data URLs', () => {
    expect(toAbsoluteImageUrl('data:image/png;base64,abc123')).toBe('data:image/png;base64,abc123')
  })

  it('returns empty string for empty input', () => {
    expect(toAbsoluteImageUrl('')).toBe('')
    expect(toAbsoluteImageUrl('  ')).toBe('')
  })

  it('returns empty string for null/undefined', () => {
    expect(toAbsoluteImageUrl(null as any)).toBe('')
    expect(toAbsoluteImageUrl(undefined as any)).toBe('')
  })

  it('returns input as-is for relative URLs (no transformation)', () => {
    expect(toAbsoluteImageUrl('/relative/path.png')).toBe('/relative/path.png')
  })
})

// ─── toManualWeight ───────────────────────────────────────────────────────────

describe('toManualWeight', () => {
  it('maps all tier weights correctly', () => {
    expect(toManualWeight('tier-gold')).toBe(1)
    expect(toManualWeight('tier-diamond')).toBe(2)
    expect(toManualWeight('tier-prismatic')).toBe(3)
    expect(toManualWeight('tier-obsidian')).toBe(4)
  })

  it('maps all gradient weights correctly', () => {
    expect(toManualWeight('gradient-emerald')).toBe(5)
    expect(toManualWeight('gradient-sapphire')).toBe(6)
    expect(toManualWeight('gradient-ruby')).toBe(7)
    expect(toManualWeight('gradient-amethyst')).toBe(8)
    expect(toManualWeight('gradient-gold')).toBe(9)
  })

  it('maps special styles correctly', () => {
    expect(toManualWeight('neu')).toBe(10)
    expect(toManualWeight('holo')).toBe(11)
    expect(toManualWeight('sketch')).toBe(12)
    expect(toManualWeight('newspaper')).toBe(13)
  })

  it('maps neon weights correctly', () => {
    expect(toManualWeight('neon-cyan')).toBe(14)
    expect(toManualWeight('neon-pink')).toBe(15)
    expect(toManualWeight('neon-green')).toBe(16)
    expect(toManualWeight('neon-purple')).toBe(17)
    expect(toManualWeight('neon-gold')).toBe(18)
  })

  it('maps metallic weights correctly', () => {
    expect(toManualWeight('metallic-steel')).toBe(19)
    expect(toManualWeight('metallic-copper')).toBe(20)
    expect(toManualWeight('metallic-titanium')).toBe(21)
    expect(toManualWeight('metallic-rose-gold')).toBe(22)
    expect(toManualWeight('metallic-gunmetal')).toBe(23)
  })

  it('maps papercut weights correctly', () => {
    expect(toManualWeight('papercut-coral')).toBe(24)
    expect(toManualWeight('papercut-sky')).toBe(25)
    expect(toManualWeight('papercut-mint')).toBe(26)
    expect(toManualWeight('papercut-lavender')).toBe(27)
    expect(toManualWeight('papercut-peach')).toBe(28)
  })

  it('maps default to 100', () => {
    expect(toManualWeight('default')).toBe(100)
  })

  it('returns 100 for unknown weight values', () => {
    expect(toManualWeight('unknown-style')).toBe(100)
    expect(toManualWeight('')).toBe(100)
    expect(toManualWeight('tier-gold-extra')).toBe(100)
  })
})

// ─── mapPublicLearningPathToDisplayBase ──────────────────────────────────────

describe('mapPublicLearningPathToDisplayBase', () => {
  it('maps a full path object correctly', () => {
    const input: PublicLearningPath = {
      id: 10,
      title: 'Learn React',
      description: 'A comprehensive guide',
      is_public: true,
      is_active: true,
      cover_image_url: 'https://example.com/cover.png',
      category_name: 'Frontend',
      item_count: 5,
      fork_count: 12,
      status: 'published',
    }
    const result = mapPublicLearningPathToDisplayBase(input)
    expect(result.id).toBe('10')
    expect(result.title).toBe('Learn React')
    expect(result.description).toBe('A comprehensive guide')
    expect(result.thumbnail).toBe('https://example.com/cover.png')
    expect(result.categoryName).toBe('Frontend')
    expect(result.itemCount).toBe(5)
    expect(result.forkCount).toBe(12)
    expect(result.status).toBe('published')
  })

  it('handles missing optional fields', () => {
    const input: PublicLearningPath = {
      id: 1,
      title: '',
      is_public: false,
      is_active: true,
    }
    const result = mapPublicLearningPathToDisplayBase(input)
    expect(result.id).toBe('1')
    expect(result.title).toBe('Path 1')
    expect(result.description).toBe('')
    expect(result.thumbnail).toBe('')
    expect(result.categoryName).toBe('')
    expect(result.itemCount).toBe(0)
    expect(result.forkCount).toBeUndefined()
    expect(result.status).toBeUndefined()
  })

  it('trims whitespace from string fields', () => {
    const input: PublicLearningPath = {
      id: 2,
      title: '  Title  ',
      description: '  Desc  ',
      is_public: true,
      is_active: true,
      cover_image_url: '  https://img.png  ',
      category_name: '  Tech  ',
    }
    const result = mapPublicLearningPathToDisplayBase(input)
    expect(result.title).toBe('Title')
    expect(result.description).toBe('Desc')
    expect(result.thumbnail).toBe('https://img.png')
    expect(result.categoryName).toBe('Tech')
  })

  it('uses item_count fallback to 0', () => {
    const input: PublicLearningPath = {
      id: 1,
      title: 'Test',
      is_public: true,
      is_active: true,
    }
    const result = mapPublicLearningPathToDisplayBase(input)
    expect(result.itemCount).toBe(0)
  })

  it('handles null values in optional fields', () => {
    const input: PublicLearningPath = {
      id: 3,
      title: 'Test',
      description: null,
      is_public: true,
      is_active: true,
      cover_image_url: null,
      category_name: null,
      fork_count: undefined,
    }
    const result = mapPublicLearningPathToDisplayBase(input)
    expect(result.description).toBe('')
    expect(result.thumbnail).toBe('')
    expect(result.categoryName).toBe('')
    expect(result.forkCount).toBeUndefined()
  })

  it('converts string id to string', () => {
    const input: PublicLearningPath = {
      id: '42' as any,
      title: 'Test',
      is_public: true,
      is_active: true,
    }
    const result = mapPublicLearningPathToDisplayBase(input)
    expect(result.id).toBe('42')
  })
})
