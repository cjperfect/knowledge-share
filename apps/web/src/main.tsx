import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ApiError } from '@/util/request'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (import.meta.env.DEV || failureCount > 3) return false
        return !(
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : '操作失败，请稍后重试。'
        )
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (!(error instanceof ApiError) || error.status !== 401) return

      toast.error('登录已失效，请重新登录。')
      useAuthStore.getState().auth.reset()
      const redirect = router.history.location.href
      void router.navigate({ to: '/sign-in', search: { redirect } })
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
