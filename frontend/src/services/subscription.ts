import request from "./request";

export type EffectivePlan = "Free" | "Basic" | "Pro";

export interface SubscriptionMeResponse {
  effective_plan: EffectivePlan;
  plan_code?: string | null;
  status?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
}

export function getMySubscription(): Promise<SubscriptionMeResponse> {
  return request.get("/subscriptions/me");
}
