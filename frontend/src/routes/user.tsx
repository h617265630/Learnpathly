import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { RouteLoader, DocumentTitle } from "./common";

const Login = lazy(() => import("@/modules/user/pages/Login"));
const Register = lazy(() => import("@/modules/user/pages/Register"));
const Account = lazy(() => import("@/modules/user/pages/Account"));
const AccountMyResources = lazy(() => import("@/modules/user/pages/AccountMyResources"));
const AccountMyPaths = lazy(() => import("@/modules/user/pages/AccountMyPaths"));
const AccountUserInfo = lazy(() => import("@/modules/user/pages/AccountUserInfo"));
const AccountPlan = lazy(() => import("@/modules/user/pages/AccountPlan"));
const AccountChangePassword = lazy(() => import("@/modules/user/pages/AccountChangePassword"));
const Plan = lazy(() => import("@/modules/user/pages/Plan"));

export const authRoutes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <RouteLoader>
        <Login />
        <DocumentTitle
          seo={{
            title: "Sign In - Learnpathly",
            description: "Sign in to your Learnpathly account.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/register",
    element: (
      <RouteLoader>
        <Register />
        <DocumentTitle
          seo={{
            title: "Create Account - Learnpathly",
            description: "Create your free Learnpathly account and start learning.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/account",
    element: (
      <RouteLoader>
        <Account />
        <DocumentTitle
          seo={{
            title: "Account - Learnpathly",
            description: "Manage your account settings.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/account/user-info" replace />,
      },
      {
        path: "my-resources",
        element: (
          <RouteLoader>
            <AccountMyResources />
            <DocumentTitle
              seo={{
                title: "My Resources - Learnpathly",
                description: "Your saved resources.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
      {
        path: "my-paths",
        element: (
          <RouteLoader>
            <AccountMyPaths />
            <DocumentTitle
              seo={{
                title: "My Learning Paths - Learnpathly",
                description: "Your created paths.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
      // Shortcut routes
      {
        path: "resources",
        element: <Navigate to="/my-resources" replace />,
      },
      {
        path: "paths",
        element: <Navigate to="/my-paths" replace />,
      },
      {
        path: "user-info",
        element: (
          <RouteLoader>
            <AccountUserInfo />
            <DocumentTitle
              seo={{
                title: "Profile - Learnpathly",
                description: "Your profile information.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
      {
        path: "plan",
        element: (
          <RouteLoader>
            <AccountPlan />
            <DocumentTitle
              seo={{
                title: "My Plan - Learnpathly",
                description: "Your subscription plan.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
      {
        path: "change-password",
        element: (
          <RouteLoader>
            <AccountChangePassword />
            <DocumentTitle
              seo={{
                title: "Change Password - Learnpathly",
                description: "Update your password.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
    ],
  },
  {
    path: "/plan",
    element: (
      <RouteLoader>
        <Plan />
        <DocumentTitle
          seo={{
            title: "Pricing Plans - Learnpathly",
            description:
              "Choose the plan that fits your learning journey. Free and Pro options available.",
          }}
        />
      </RouteLoader>
    ),
  },
];
