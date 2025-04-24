import { lazy } from 'react'
import { RouteObject } from 'react-router-dom'

const MainLayout = lazy(() => import('@/layouts/MainLayout'))
const AuthLayout = lazy(() => import('@/layouts/AuthLayout'))

const Home = lazy(() => import('@/pages/Home'))
const About = lazy(() => import('@/pages/About'))
const OCR = lazy(() => import('@/pages/OCR'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'ocr', element: <OCR /> },
      {
        path: 'dashboard',
        element: <Dashboard />
      }
    ]
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]

export default routes
