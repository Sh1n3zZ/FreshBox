import { lazy } from 'react'
import { RouteObject } from 'react-router-dom'

const MainLayout = lazy(() => import('@/layouts/MainLayout'))
const AuthLayout = lazy(() => import('@/layouts/AuthLayout'))

const Home = lazy(() => import('@/pages/Home'))
const About = lazy(() => import('@/pages/About'))
const OCR = lazy(() => import('@/pages/OCR'))
const Explore = lazy(() => import('@/pages/task/Explore'))
const TaskDetail = lazy(() => import('@/pages/task/TaskDetail'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'))
const Settings = lazy(() => import('@/pages/admin/Settings'))
const Users = lazy(() => import('@/pages/admin/Users'))
const Orders = lazy(() => import('@/pages/admin/Orders'))
const TaskPanel = lazy(() => import('@/pages/admin/TaskPanel'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const BlindBoxPage = lazy(() => import('@/pages/blindbox/BlindBox'))
const Profile = lazy(() => import('@/pages/Profile'));
const BlindBoxMore = lazy(() => import('@/pages/blindbox/BlindBoxMore'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'ocr', element: <OCR /> },
      { path: 'profile', element: <Profile /> },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'admin',
        children: [
          {
            path: 'settings',
            element: <Settings />
          },
          {
            path: 'users',
            element: <Users />
          },
          {
            path: 'orders',
            element: <Orders />
          },
          {
            path: 'tasks',
            element: <TaskPanel />
          }
        ]
      },
      { path: 'BlindBox/:id', element: <BlindBoxPage /> },
      { path: 'BlindBox', element: <BlindBoxMore /> },
      { 
        path: '/task',
        children: [
          {
            path: 'explore',
            element: <Explore />
          },
          {
            path: 'detail/:id',
            element: <TaskDetail />
          }
        ]
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
