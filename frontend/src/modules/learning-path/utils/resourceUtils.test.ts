import { describe, it, expect } from 'vitest'
import { inferModuleType } from './resourceUtils'

// ─── inferModuleType ──────────────────────────────────────────────────────────

describe('inferModuleType', () => {
  describe('from presented resource_type (preferred)', () => {
    it('returns video for resource_type=video', () => {
      expect(inferModuleType({}, { resource_type: 'video' })).toBe('video')
    })

    it('returns document for resource_type=document', () => {
      expect(inferModuleType({}, { resource_type: 'document' })).toBe('document')
    })

    it('returns article for resource_type=article', () => {
      expect(inferModuleType({}, { resource_type: 'article' })).toBe('article')
    })

    it('returns clip for resource_type=clip', () => {
      expect(inferModuleType({}, { resource_type: 'clip' })).toBe('clip')
    })

    it('is case-insensitive', () => {
      expect(inferModuleType({}, { resource_type: 'VIDEO' })).toBe('video')
      expect(inferModuleType({}, { resource_type: 'Document' })).toBe('document')
    })
  })

  describe('from item.resource_type (fallback)', () => {
    it('uses item.resource_type when presented is empty', () => {
      expect(inferModuleType({ resource_type: 'document' }, {})).toBe('document')
      expect(inferModuleType({ resource_type: 'clip' }, {})).toBe('clip')
    })

    it('prefers presented over item', () => {
      expect(inferModuleType({ resource_type: 'clip' }, { resource_type: 'video' })).toBe('video')
    })
  })

  describe('link type inference from URL', () => {
    it('returns video for youtube.com links', () => {
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'https://youtube.com/watch?v=abc' })).toBe('video')
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'https://youtu.be/xyz' })).toBe('video')
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'http://youtube.com/watch?v=123' })).toBe('video')
    })

    it('returns document for .pdf links', () => {
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'https://example.com/file.pdf' })).toBe('document')
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'https://example.com/docs/report.PDF' })).toBe('document')
    })

    it('returns article for non-video, non-pdf links', () => {
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'https://blog.example.com/post' })).toBe('article')
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'https://github.com/user/repo' })).toBe('article')
    })

    it('strips query parameters before checking URL', () => {
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'https://youtube.com/watch?v=abc&utm_source=google' })).toBe('video')
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'https://example.com/doc.pdf?download=1' })).toBe('document')
    })

    it('uses base URL only (first ? segment)', () => {
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'https://example.com/path?query=value' })).toBe('article')
    })
  })

  describe('unknown type', () => {
    it('returns unknown for unrecognized resource_type', () => {
      expect(inferModuleType({}, { resource_type: 'unknown' })).toBe('unknown')
      expect(inferModuleType({}, { resource_type: 'podcast' })).toBe('unknown')
    })

    it('returns unknown when both resource_type fields are empty', () => {
      expect(inferModuleType({}, {})).toBe('unknown')
      expect(inferModuleType({ resource_type: '' }, {})).toBe('unknown')
    })

    it('returns unknown for null and undefined', () => {
      expect(inferModuleType({}, { resource_type: null })).toBe('unknown')
      expect(inferModuleType({}, { resource_type: undefined })).toBe('unknown')
      expect(inferModuleType({}, {})).toBe('unknown')
    })
  })

  describe('whitespace handling', () => {
    it('trims whitespace from resource_type', () => {
      expect(inferModuleType({}, { resource_type: '  video  ' })).toBe('video')
    })
  })

  describe('priority: presented > item > URL inference', () => {
    it('video presented takes priority over link with non-video URL', () => {
      expect(inferModuleType({}, { resource_type: 'video', source_url: 'https://example.com/doc.pdf' })).toBe('video')
    })

    it('link type falls back to URL inference', () => {
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'https://youtube.com/watch?v=x' })).toBe('video')
      expect(inferModuleType({}, { resource_type: 'link', source_url: 'https://example.com/file.pdf' })).toBe('document')
    })

    it('empty resource_type falls back to item.resource_type', () => {
      expect(inferModuleType({ resource_type: 'article' }, {})).toBe('article')
    })
  })
})
