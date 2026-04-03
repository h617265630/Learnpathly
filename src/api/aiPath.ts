import request from './request'

export interface AiPathResourceLink {
  url: string
}

export interface AiPathSubNode {
  title: string
  description: string
  learning_points?: string[]
  resources?: AiPathResourceLink[]
}

export interface AiPathNode {
  title: string
  description: string
  explanation?: string
  tutorial?: string[]
  resources?: AiPathResourceLink[]
  sub_nodes?: AiPathSubNode[]
  order?: number
}

export interface AiPathData {
  title: string
  summary: string
  description?: string
  recommendations?: string[]
  nodes: AiPathNode[]
}

export interface AiPathGenerateResponse {
  data: AiPathData
  warnings: string[]
}

export function generateAiPath(query: string) {
  return request.post<AiPathGenerateResponse, AiPathGenerateResponse>('/ai-path/generate', { query }, {
    timeout: 60000,
  })
}