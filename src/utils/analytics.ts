import type { UserProfile } from '../api/user'

// Placeholder analytics - implement based on your analytics provider
export function setAnalyticsUser(user: UserProfile | null) {
  // Example: integrate with your analytics provider
  // window.gtag?.('set', 'user_id', user?.id)
  console.debug('[Analytics] Set user:', user?.id)
}

export function trackEvent(event: string, data?: Record<string, unknown>) {
  console.debug('[Analytics] Track:', event, data)
}
