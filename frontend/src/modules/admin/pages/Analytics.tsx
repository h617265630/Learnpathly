import { useState, useEffect } from "react";
import { getAdminStats } from "@/services/admin";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/Card";

export default function Analytics() {
  const [stats, setStats] = useState<{
    total_users: number;
    active_users: number;
    total_learning_paths: number;
    total_resources: number;
    users_last_7_days: number;
    paths_last_7_days: number;
    resources_last_7_days: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (e) {
        console.error("Failed to load analytics", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
        <p className="text-sm text-stone-500 mt-1">
          Platform analytics and insights
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardDescription>Loading...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-stone-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardDescription>Total Users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {stats.total_users.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                +{stats.users_last_7_days} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Active Users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {stats.active_users.toLocaleString()}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {stats.total_users > 0
                  ? ((stats.active_users / stats.total_users) * 100).toFixed(1)
                  : 0}
                % of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Learning Paths</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {stats.total_learning_paths.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                +{stats.paths_last_7_days} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Resources</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {stats.total_resources.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                +{stats.resources_last_7_days} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Avg. Resources per Path</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {stats.total_learning_paths > 0
                  ? (
                      stats.total_resources / stats.total_learning_paths
                    ).toFixed(1)
                  : "0"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>User Engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {stats.total_users > 0
                  ? ((stats.active_users / stats.total_users) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="rounded-md border border-stone-200 bg-white p-6">
          <p className="text-sm text-red-500">Failed to load analytics data</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Growth Overview</CardTitle>
            <CardDescription>New activity this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-500">New Users</span>
                  <span className="font-semibold text-stone-900">
                    +{stats?.users_last_7_days ?? 0}
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: "60%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-500">New Paths</span>
                  <span className="font-semibold text-stone-900">
                    +{stats?.paths_last_7_days ?? 0}
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: "40%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-500">New Resources</span>
                  <span className="font-semibold text-stone-900">
                    +{stats?.resources_last_7_days ?? 0}
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: "75%" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Summary</CardTitle>
            <CardDescription>Current state of the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Total Users</span>
                <span className="font-semibold text-stone-900">
                  {stats?.total_users.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Active Users</span>
                <span className="font-semibold text-stone-900">
                  {stats?.active_users.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Learning Paths</span>
                <span className="font-semibold text-stone-900">
                  {stats?.total_learning_paths.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Resources</span>
                <span className="font-semibold text-stone-900">
                  {stats?.total_resources.toLocaleString() ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
