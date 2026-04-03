import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppLayout from './App'
import { useAuthStore } from './stores/auth'
import type { SeoMeta } from './stores/auth'

export interface RouteMeta {
  seo?: SeoMeta
  requiresAdmin?: boolean
}

const Home = lazy(() => import('./pages/Home'))
const MyLearningPath = lazy(() => import('./pages/MyLearningPath'))
const LearningPool = lazy(() => import('./pages/LearningPool'))
const LearningPoolCategory = lazy(() => import('./pages/LearningPoolCategory'))
const LearningPathDetail = lazy(() => import('./pages/LearningPathDetail'))
const LearningPathLinear = lazy(() => import('./pages/LearningPathLinear'))
const LearningPathEdit = lazy(() => import('./pages/LearningPathEdit'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ResourceLibrary = lazy(() => import('./pages/ResourceLibrary'))
const ResourceVideo = lazy(() => import('./pages/ResourceVideo'))
const ResourceDocument = lazy(() => import('./pages/ResourceDocument'))
const ResourceArticle = lazy(() => import('./pages/ResourceArticle'))
const AddResourceToPath = lazy(() => import('./pages/AddResourceToPath'))
const MyResource = lazy(() => import('./pages/MyResource'))
const AddResource = lazy(() => import('./pages/AddResource'))
const MyResourceEdit = lazy(() => import('./pages/MyResourceEdit'))
const Partical = lazy(() => import('./pages/Partical'))
const ParticalImage = lazy(() => import('./pages/ParticalImage'))
const ParticalFlashedIdeas = lazy(() => import('./pages/ParticalFlashedIdeas'))
const MyPartical = lazy(() => import('./pages/MyPartical'))
const MyParticalHome = lazy(() => import('./pages/MyParticalHome'))
const CreatePath = lazy(() => import('./pages/CreatePath'))
const Notification = lazy(() => import('./pages/Notification'))
const Creator = lazy(() => import('./pages/Creator'))
const Deck = lazy(() => import('./pages/Deck'))
const AIPath = lazy(() => import('./pages/AIPath'))
const AIPathDetail = lazy(() => import('./pages/AIPathDetail'))
const UiUxProMax = lazy(() => import('./pages/UiUxProMax'))
const Account = lazy(() => import('./pages/Account'))
const AccountMyResources = lazy(() => import('./pages/AccountMyResources'))
const AccountMyPaths = lazy(() => import('./pages/AccountMyPaths'))
const AccountUserInfo = lazy(() => import('./pages/AccountUserInfo'))
const AccountChangePassword = lazy(() => import('./pages/AccountChangePassword'))
const AccountPlan = lazy(() => import('./pages/AccountPlan'))
const About = lazy(() => import('./pages/About'))
const AboutResources = lazy(() => import('./pages/AboutResources'))
const AboutLearningPaths = lazy(() => import('./pages/AboutLearningPaths'))
const AboutProgress = lazy(() => import('./pages/AboutProgress'))
const Plan = lazy(() => import('./pages/Plan'))
const Tool = lazy(() => import('./pages/Tool'))
const Stack = lazy(() => import('./pages/Stack'))
const CardUI = lazy(() => import('./pages/CardUI'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminUserManagement = lazy(() => import('./pages/admin/UserManagement'))
const AdminResourceManagement = lazy(() => import('./pages/admin/ResourceManagement'))
const AdminLearningPathManagement = lazy(() => import('./pages/admin/LearningPathManagement'))
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'))

function RouteLoader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-stone-400">Loading...</div></div>}>
      {children}
    </Suspense>
  )
}

function DocumentTitle({ seo }: { seo?: SeoMeta }) {
  if (seo?.title) {
    document.title = seo.title
  }
  return null
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthed, user } = useAuthStore()
  const isAdmin = (user as { is_superuser?: boolean })?.is_superuser === true

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      {
        path: '/home',
        element: <RouteLoader><Home /><DocumentTitle seo={{ title: 'Learnpathly - Discover, Learn, Grow', description: 'Discover learning resources, build learning paths, and generate AI-guided study plans. Your personal learning companion.' }} /></RouteLoader>,
      },
      {
        path: '/notification',
        element: <RouteLoader><Notification /><DocumentTitle seo={{ title: 'Notifications - Learnpathly', description: 'Your learning notifications and updates.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/creator',
        element: <RouteLoader><Creator /><DocumentTitle seo={{ title: 'Content Creator - Learnpathly', description: 'Create and share learning content on Learnpathly.' }} /></RouteLoader>,
      },
      {
        path: '/deck',
        element: <RouteLoader><Deck /><DocumentTitle seo={{ title: 'Deck - Learnpathly', description: 'Browse your flashcard decks for active recall learning.' }} /></RouteLoader>,
      },
      {
        path: '/ai-path',
        element: <RouteLoader><AIPath /><DocumentTitle seo={{ title: 'AI Path Generator - Learnpathly', description: 'Describe what you want to learn and get an AI-generated learning path with structured stages and curated resources.' }} /></RouteLoader>,
      },
      {
        path: '/ai-path-detail',
        element: <RouteLoader><AIPathDetail /><DocumentTitle seo={{ title: 'AI Path Detail - Learnpathly', description: 'Your personalized AI-generated learning path.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/learningpool',
        element: <RouteLoader><LearningPool /><DocumentTitle seo={{ title: 'Learning Pool - Learnpathly', description: 'Explore public learning paths shared by the community. Find structured learning resources on any topic.' }} /></RouteLoader>,
      },
      {
        path: '/learningpool/category/:category',
        element: <RouteLoader><LearningPoolCategory /><DocumentTitle seo={{ title: 'Learning Pool - Learnpathly', description: 'Browse learning paths by category.' }} /></RouteLoader>,
      },
      {
        path: '/my-paths',
        element: <RouteLoader><MyLearningPath /><DocumentTitle seo={{ title: 'My Learning Paths - Learnpathly', description: 'Your personal learning paths.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/createpath',
        element: <RouteLoader><CreatePath /><DocumentTitle seo={{ title: 'Create Learning Path - Learnpathly', description: 'Create a new learning path to organize your studies.', noindex: true }} /></RouteLoader>,
      },
      { path: '/learningpath-detail', element: <Navigate to="/learningpool" replace /> },
      { path: '/learningpath-pool', element: <Navigate to="/learningpool" replace /> },
      {
        path: '/login',
        element: <RouteLoader><Login /><DocumentTitle seo={{ title: 'Sign In - Learnpathly', description: 'Sign in to your Learnpathly account.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/register',
        element: <RouteLoader><Register /><DocumentTitle seo={{ title: 'Create Account - Learnpathly', description: 'Create your free Learnpathly account and start learning.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/resources',
        element: <RouteLoader><ResourceLibrary /><DocumentTitle seo={{ title: 'Resource Library - Learnpathly', description: 'Browse curated learning resources including videos, documents, and articles. Find quality materials for any topic.' }} /></RouteLoader>,
      },
      {
        path: '/my-resources',
        element: <RouteLoader><MyResource /><DocumentTitle seo={{ title: 'My Resources - Learnpathly', description: 'Your saved and uploaded learning resources.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/my-resources/add',
        element: <RouteLoader><AddResource /><DocumentTitle seo={{ title: 'Add Resource - Learnpathly', description: 'Add a new learning resource to your collection.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/my-resources/video/:id',
        element: <RouteLoader><ResourceVideo /><DocumentTitle seo={{ title: 'My Video Resource - Learnpathly', description: 'Your saved video resource.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/my-resources/document/:id',
        element: <RouteLoader><ResourceDocument /><DocumentTitle seo={{ title: 'My Document Resource - Learnpathly', description: 'Your saved document resource.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/my-resources/article/:id',
        element: <RouteLoader><ResourceArticle /><DocumentTitle seo={{ title: 'My Article Resource - Learnpathly', description: 'Your saved article resource.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/my-resources/:id',
        element: <Navigate to="/my-resources/video/:id" replace />,
      },
      {
        path: '/my-resources/:id/edit',
        element: <RouteLoader><MyResourceEdit /><DocumentTitle seo={{ title: 'Edit Resource - Learnpathly', description: 'Edit your learning resource.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/resources/video/:id',
        element: <RouteLoader><ResourceVideo /><DocumentTitle seo={{ title: 'Video Resource - Learnpathly', description: 'Watch and learn from this video resource.' }} /></RouteLoader>,
      },
      {
        path: '/resources/document/:id',
        element: <RouteLoader><ResourceDocument /><DocumentTitle seo={{ title: 'Document Resource - Learnpathly', description: 'Read and learn from this document resource.' }} /></RouteLoader>,
      },
      {
        path: '/resources/article/:id',
        element: <RouteLoader><ResourceArticle /><DocumentTitle seo={{ title: 'Article Resource - Learnpathly', description: 'Read and learn from this article resource.' }} /></RouteLoader>,
      },
      {
        path: '/resources/:type/:id/add-to-path',
        element: <RouteLoader><AddResourceToPath /><DocumentTitle seo={{ title: 'Add to Learning Path - Learnpathly', description: 'Add this resource to one of your learning paths.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/account',
        element: <RouteLoader><Account /><DocumentTitle seo={{ title: 'Account - Learnpathly', description: 'Manage your account settings.', noindex: true }} /></RouteLoader>,
        children: [
          { index: true, element: <Navigate to="/account/user-info" replace /> },
          {
            path: 'my-resources',
            element: <RouteLoader><AccountMyResources /><DocumentTitle seo={{ title: 'My Resources - Learnpathly', description: 'Your saved resources.', noindex: true }} /></RouteLoader>,
          },
          {
            path: 'my-paths',
            element: <RouteLoader><AccountMyPaths /><DocumentTitle seo={{ title: 'My Learning Paths - Learnpathly', description: 'Your created paths.', noindex: true }} /></RouteLoader>,
          },
          {
            path: 'user-info',
            element: <RouteLoader><AccountUserInfo /><DocumentTitle seo={{ title: 'Profile - Learnpathly', description: 'Your profile information.', noindex: true }} /></RouteLoader>,
          },
          {
            path: 'plan',
            element: <RouteLoader><AccountPlan /><DocumentTitle seo={{ title: 'My Plan - Learnpathly', description: 'Your subscription plan.', noindex: true }} /></RouteLoader>,
          },
          {
            path: 'change-password',
            element: <RouteLoader><AccountChangePassword /><DocumentTitle seo={{ title: 'Change Password - Learnpathly', description: 'Update your password.', noindex: true }} /></RouteLoader>,
          },
        ],
      },
      {
        path: '/learningpath/:id/edit',
        element: <RouteLoader><LearningPathEdit /><DocumentTitle seo={{ title: 'Edit Learning Path - Learnpathly', description: 'Edit your learning path.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/learningpath/:id/detail',
        element: <RouteLoader><LearningPathDetail /><DocumentTitle seo={{ title: 'Learning Path - Learnpathly', description: 'View this learning path.', type: 'article' }} /></RouteLoader>,
      },
      {
        path: '/learningpath/:id/linear',
        element: <RouteLoader><LearningPathLinear /><DocumentTitle seo={{ title: 'Learning Path (Linear View) - Learnpathly', description: 'View this learning path in linear format.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/learningpath/:id',
        element: <RouteLoader><LearningPathDetail /><DocumentTitle seo={{ title: 'Learning Path - Learnpathly', description: 'View this learning path.', type: 'article' }} /></RouteLoader>,
      },
      {
        path: '/partical',
        element: <RouteLoader><Partical /><DocumentTitle seo={{ title: 'Partical - Learnpathly', description: 'Create flashcards from your learning materials.', noindex: true }} /></RouteLoader>,
        children: [
          { index: true, element: <Navigate to="/partical/image" replace /> },
          {
            path: 'image',
            element: <RouteLoader><ParticalImage /><DocumentTitle seo={{ title: 'Image Flashcards - Learnpathly', description: 'Create flashcards from images.', noindex: true }} /></RouteLoader>,
          },
          {
            path: 'flashed-ideas',
            element: <RouteLoader><ParticalFlashedIdeas /><DocumentTitle seo={{ title: 'Flashed Ideas - Learnpathly', description: 'Quick flashcards for active recall.', noindex: true }} /></RouteLoader>,
          },
        ],
      },
      {
        path: '/my-partical',
        element: <RouteLoader><MyPartical /><DocumentTitle seo={{ title: 'My Flashcards - Learnpathly', description: 'Your flashcard decks for active recall learning.', noindex: true }} /></RouteLoader>,
        children: [
          { index: true, element: <Navigate to="/my-partical/home" replace /> },
          {
            path: 'home',
            element: <RouteLoader><MyParticalHome /><DocumentTitle seo={{ title: 'My Flashcards - Learnpathly', description: 'Your flashcard decks.', noindex: true }} /></RouteLoader>,
          },
          {
            path: 'image',
            element: <RouteLoader><ParticalImage /><DocumentTitle seo={{ title: 'My Image Flashcards - Learnpathly', description: 'Your image-based flashcards.', noindex: true }} /></RouteLoader>,
          },
          {
            path: 'flashed-ideas',
            element: <RouteLoader><ParticalFlashedIdeas /><DocumentTitle seo={{ title: 'My Flashed Ideas - Learnpathly', description: 'Your quick recall flashcards.', noindex: true }} /></RouteLoader>,
          },
        ],
      },
      {
        path: '/plan',
        element: <RouteLoader><Plan /><DocumentTitle seo={{ title: 'Pricing Plans - Learnpathly', description: 'Choose the plan that fits your learning journey. Free and Pro options available.' }} /></RouteLoader>,
      },
      {
        path: '/tools',
        element: <RouteLoader><Tool /><DocumentTitle seo={{ title: 'Learning Tools - Learnpathly', description: 'Tools to enhance your learning: flashcards, spaced repetition, and more.' }} /></RouteLoader>,
      },
      {
        path: '/stack',
        element: <RouteLoader><Stack /><DocumentTitle seo={{ title: 'UI Components - Learnpathly', description: 'UI component showcase.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/card-ui',
        element: <RouteLoader><CardUI /><DocumentTitle seo={{ title: 'Card UI - Learnpathly', description: 'Card component showcase.', noindex: true }} /></RouteLoader>,
      },
      {
        path: '/about',
        element: <RouteLoader><About /><DocumentTitle seo={{ title: 'About Learnpathly', description: 'Learn how Learnpathly helps you organize resources, build learning paths, and track your progress.' }} /></RouteLoader>,
      },
      {
        path: '/about/resources',
        element: <RouteLoader><AboutResources /><DocumentTitle seo={{ title: 'About Resources - Learnpathly', description: 'How Learnpathly helps you discover and organize learning resources.' }} /></RouteLoader>,
      },
      {
        path: '/about/learning-paths',
        element: <RouteLoader><AboutLearningPaths /><DocumentTitle seo={{ title: 'About Learning Paths - Learnpathly', description: 'How structured learning paths help you achieve your goals.' }} /></RouteLoader>,
      },
      {
        path: '/about/progress',
        element: <RouteLoader><AboutProgress /><DocumentTitle seo={{ title: 'About Progress Tracking - Learnpathly', description: 'Track your learning progress and stay motivated.' }} /></RouteLoader>,
      },
      {
        path: '/admin',
        element: <AdminGuard><RouteLoader><AdminLayout /><DocumentTitle seo={{ title: 'Admin - Learnpathly', description: 'Admin dashboard.', noindex: true }} /></RouteLoader></AdminGuard>,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          {
            path: 'dashboard',
            element: <RouteLoader><AdminDashboard /><DocumentTitle seo={{ title: 'Dashboard - Admin - Learnpathly', description: 'Admin dashboard overview.', noindex: true }} /></RouteLoader>,
          },
          {
            path: 'users',
            element: <RouteLoader><AdminUserManagement /><DocumentTitle seo={{ title: 'User Management - Admin - Learnpathly', description: 'Manage platform users.', noindex: true }} /></RouteLoader>,
          },
          {
            path: 'resources',
            element: <RouteLoader><AdminResourceManagement /><DocumentTitle seo={{ title: 'Resource Management - Admin - Learnpathly', description: 'Manage platform resources.', noindex: true }} /></RouteLoader>,
          },
          {
            path: 'paths',
            element: <RouteLoader><AdminLearningPathManagement /><DocumentTitle seo={{ title: 'Path Management - Admin - Learnpathly', description: 'Manage learning paths.', noindex: true }} /></RouteLoader>,
          },
          {
            path: 'analytics',
            element: <RouteLoader><AdminAnalytics /><DocumentTitle seo={{ title: 'Analytics - Admin - Learnpathly', description: 'Platform analytics and insights.', noindex: true }} /></RouteLoader>,
          },
        ],
      },
    ],
  },
])

export default router