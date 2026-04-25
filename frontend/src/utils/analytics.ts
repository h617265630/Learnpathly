import type { UserProfile } from "@/services/user";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function setAnalyticsUser(user: UserProfile | null) {
  if (user?.id) {
    window.gtag?.("set", "user_id", user.id);
  }
}

export function trackEvent(event: string, data?: Record<string, unknown>) {
  window.gtag?.("event", event, data);
}
