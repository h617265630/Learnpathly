import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats, type AdminStats } from '@/api/admin'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminStats()
        setStats(data)
      } catch (e) {
        setError('Failed to load stats')
        console.error('Failed to load admin stats', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Dashboard Overview</h1>
        <p className="text-sm text-stone-500 mt-1">Platform statistics and metrics</p>
      </div>

      {/* Stats cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardDescription className="text-stone-500">Loading...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-stone-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-md border border-stone-200 bg-white p-6 mb-8">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardDescription className="text-stone-500">Total Users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">{stats.total_users.toLocaleString()}</p>
              {stats.users_last_7_days > 0 && (
                <p className="text-xs text-emerald-600 mt-1">+{stats.users_last_7_days} this week</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription className="text-stone-500">Active Users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">{stats.active_users.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription className="text-stone-500">Learning Paths</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">{stats.total_learning_paths.toLocaleString()}</p>
              {stats.paths_last_7_days > 0 && (
                <p className="text-xs text-emerald-600 mt-1">+{stats.paths_last_7_days} this week</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription className="text-stone-500">Resources</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">{stats.total_resources.toLocaleString()}</p>
              {stats.resources_last_7_days > 0 && (
                <p className="text-xs text-emerald-600 mt-1">+{stats.resources_last_7_days} this week</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/admin/users">
          <Button>Manage Users</Button>
        </Link>
        <Link to="/admin/resources">
          <Button variant="outline">Manage Resources</Button>
        </Link>
        <Link to="/admin/paths">
          <Button variant="outline">Manage Paths</Button>
        </Link>
        <Link to="/admin/analytics">
          <Button variant="outline">View Analytics</Button>
        </Link>
      </div>
    </div>
  )
}