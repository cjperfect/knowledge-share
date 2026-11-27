import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { UserAuthForm } from './user-auth-form'

const FORM_MESSAGES = {
  usernameEmpty: '请输入用户名。',
  passwordEmpty: '请输入密码。',
} as const

const navigate = vi.fn()
const setUserMock = vi.fn()
const loginMock = vi.fn()
const user = {
  id: 'user-id',
  username: 'admin',
  role: 'super_admin',
  token: 'test-access-token',
  expiresAt: Date.now() + 60_000,
}

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: {
      setUser: setUserMock,
    },
  }),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('@/api/auth', () => ({
  authApi: { login: (...args: unknown[]) => loginMock(...args) },
}))

beforeEach(() => {
  vi.clearAllMocks()
  loginMock.mockResolvedValue(user)
})

describe('UserAuthForm', () => {
  describe('Rendering without redirectTo', () => {
    let screen: RenderResult
    let usernameInput: Locator
    let passwordInput: Locator
    let signInButton: Locator

    beforeEach(async () => {
      vi.clearAllMocks()
      screen = await render(<UserAuthForm />)
      usernameInput = screen.getByRole('textbox', { name: /^用户名$/i })
      passwordInput = screen.getByLabelText(/^密码$/i)
      signInButton = screen.getByRole('button', { name: /^登录$/i })
    })

    it('renders the username, password, and submit controls', async () => {
      await expect.element(usernameInput).toBeInTheDocument()
      await expect.element(passwordInput).toBeInTheDocument()
      await expect.element(signInButton).toBeInTheDocument()
    })

    it('shows validation messages when submitting empty form', async () => {
      await userEvent.click(signInButton)

      await expect
        .element(screen.getByText(FORM_MESSAGES.usernameEmpty))
        .toBeInTheDocument()
      await expect
        .element(screen.getByText(FORM_MESSAGES.passwordEmpty))
        .toBeInTheDocument()
    })

    it('authenticates and navigates to default route on success', async () => {
      await userEvent.fill(usernameInput, 'admin')
      await userEvent.fill(passwordInput, 'admin')

      await userEvent.click(signInButton)

      await vi.waitFor(() => expect(setUserMock).toHaveBeenCalledOnce())
      expect(loginMock).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin',
      })
      expect(setUserMock).toHaveBeenCalledWith(user)

      await vi.waitFor(() =>
        expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true })
      )
    })
  })

  it('navigates to redirectTo when provided', async () => {
    const { getByRole, getByLabelText } = await render(
      <UserAuthForm redirectTo='/activities' />
    )

    await userEvent.fill(getByRole('textbox', { name: /用户名/i }), 'demo_user')
    await userEvent.fill(getByLabelText('密码'), '12345678')

    await userEvent.click(getByRole('button', { name: /登录/i }))

    await vi.waitFor(() => expect(setUserMock).toHaveBeenCalledOnce())

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/activities',
        replace: true,
      })
    )
  })
})
