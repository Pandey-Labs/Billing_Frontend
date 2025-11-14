import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loginSuccess } from '../slices/authSlice'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types'
import { login as loginApi, ApiError } from '../api/api'


const roleMap: Record<string, User['role']> = {
    admin: 'Admin',
    cashier: 'Cashier',
    manager: 'Manager',
}

const Login: React.FC = () => {
    const [email, setEmail] = useState('admin@example.com')
    const [password, setPassword] = useState('Admin@123')
    const [captchaQuestion, setCaptchaQuestion] = useState<string>('')
    const [captchaAnswer, setCaptchaAnswer] = useState<number>(0)
    const [captchaInput, setCaptchaInput] = useState('')
    const [captchaError, setCaptchaError] = useState<string | null>(null)
    const [apiError, setApiError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const dispatch = useAppDispatch()
    const nav = useNavigate()
    const user = useAppSelector(s => s.auth.user)

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (user) {
            nav('/dashboard', { replace: true })
        }
    }, [user, nav])

    const generateCaptcha = () => {
        const a = Math.floor(Math.random() * 9) + 1
        const b = Math.floor(Math.random() * 9) + 1
        setCaptchaQuestion(`${a} + ${b} = ?`)
        setCaptchaAnswer(a + b)
        setCaptchaInput('')
    }

    useEffect(() => {
        generateCaptcha()
    }, [])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (Number(captchaInput) !== captchaAnswer) {
            setCaptchaError('Captcha answer is incorrect. Please try again.')
            generateCaptcha()
            return
        }
        setCaptchaError(null)
        setApiError(null)
        setLoading(true)
        try {
            const response = await loginApi({ email, password })
            if (!response || typeof response !== 'object' || !response.user || !response.token) {
                throw new Error('Invalid server response')
            }
            const mappedRole = roleMap[String(response?.user?.role || '').toLowerCase()] || 'Cashier'
            const user: User = {
                id: response?.user?.id ?? response?.user?.email ?? 'unknown',
                username: response?.user?.name ?? response?.user?.email ?? 'User',
                role: mappedRole,
                email: response?.user?.email ?? undefined,
                name: response?.user?.name ?? undefined,
            }
            const expiresAt =
                typeof response?.expiresIn === 'number'
                    ? Date.now() + response.expiresIn * 1000
                    : null
            dispatch(loginSuccess({ user, token: response.token, expiresAt }))
            nav('/dashboard')
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                setApiError(error.message)
            } else if (error instanceof Error) {
                setApiError(error.message || 'Unable to login. Please try again.')
            } else {
                setApiError('Unable to login. Please try again.')
            }
            generateCaptcha()
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="auth-page">
            <div className="auth-shell">
                <div className="auth-card border-0 shadow-lg overflow-hidden animate-auth-card">
                    <div className="row g-0 align-items-stretch h-100">
                        <div className="col-lg-6 auth-hero text-white d-none d-lg-flex flex-column justify-content-center p-4 p-xl-5 animate-auth-hero">
                            <div>
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="auth-logo-circle">
                                        <i className="bi bi-receipt-cutoff"></i>
                                    </div>
                                    <div>
                                        <h2 className="mb-0 fw-bold">Billing Sphere</h2>
                                        <small className="text-white-50 tracking-wide">
                                            Smart retail operations, simplified.
                                        </small>
                                    </div>
                                </div>
                                <h3 className="fw-bold mb-3 auth-hero-title">
                                    Welcome back to your billing hub.
                                </h3>
                                <p className="mb-4 text-white-75">
                                    Manage inventory, invoices, and analytics without breaking your flow.
                                </p>
                                <div className="d-flex flex-column gap-2">
                                    <div className="auth-hero-chip">
                                        <i className="bi bi-speedometer2"></i>
                                        Lightning-fast search and checkout
                                    </div>
                                    <div className="auth-hero-chip">
                                        <i className="bi bi-shield-check"></i>
                                        JWT-secured workspace access
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 bg-white d-flex align-items-center animate-auth-form">
                            <div className="w-100 p-4 p-md-5">
                                <div className="d-lg-none text-center mb-4">
                                    <div className="auth-logo-circle mx-auto mb-3">
                                        <i className="bi bi-receipt-cutoff"></i>
                                    </div>
                                    <h4 className="fw-bold mb-1 text-dark">Billing Sphere</h4>
                                    <p className="text-muted small mb-0">
                                        Manage billing, stock, and reports seamlessly.
                                    </p>
                                </div>
                                <div className="text-center mb-4">
                                    <h4 className="fw-bold mb-1">Sign in to your account</h4>
                                    <p className="text-muted mb-0">
                                        Use your admin credentials to continue.
                                    </p>
                                </div>
                                <form onSubmit={submit} className="auth-form">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-dark">Email address</label>
                                        <div className="input-group auth-input-group">
                                            <span className="input-group-text">
                                                <i className="bi bi-envelope"></i>
                                            </span>
                                            <input
                                                className="form-control auth-input"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                type="email"
                                                required
                                                autoComplete="email"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-dark">Password</label>
                                        <div className="input-group auth-input-group">
                                            <span className="input-group-text">
                                                <i className="bi bi-lock"></i>
                                            </span>
                                            <input
                                                className="form-control auth-input"
                                                type="password"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                minLength={6}
                                                autoComplete="current-password"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-dark d-flex justify-content-between align-items-center">
                                            <span>Solve captcha</span>
                                            <button
                                                type="button"
                                                className="btn btn-link p-0 auth-refresh-btn"
                                                onClick={() => {
                                                    setCaptchaError(null)
                                                    generateCaptcha()
                                                }}
                                            >
                                                <i className="bi bi-arrow-clockwise me-1"></i>
                                                Refresh
                                            </button>
                                        </label>
                                        <div className="input-group auth-input-group">
                                            <span className="input-group-text">{captchaQuestion}</span>
                                            <input
                                                className="form-control auth-input"
                                                value={captchaInput}
                                                onChange={e => setCaptchaInput(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="Answer"
                                                required
                                            />
                                        </div>
                                        {captchaError && <small className="text-danger d-block mt-1">{captchaError}</small>}
                                    </div>
                                    {apiError && (
                                        <div className="alert alert-danger py-2 px-3 auth-alert" role="alert">
                                            <i className="bi bi-exclamation-octagon me-2"></i>
                                            {apiError}
                                        </div>
                                    )}
                                    <button className="btn btn-primary w-100 auth-submit" disabled={loading}>
                                        {loading ? (
                                            <span className="d-inline-flex align-items-center gap-2">
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                Logging in...
                                            </span>
                                        ) : (
                                            'Log in securely'
                                        )}
                                    </button>
                                </form>
                                <div className="mt-4 text-center auth-footnote">
                                    <small className="text-muted">
                                        By logging in you agree to our{' '}
                                        <a href="#" className="text-decoration-none">terms of service</a> and{' '}
                                        <a href="#" className="text-decoration-none">privacy policy</a>.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


export default Login