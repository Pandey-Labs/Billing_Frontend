import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loginSuccess } from '../slices/authSlice'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types'
import { login as loginApi, register as registerApi, ApiError } from '../api/api'
import { toast } from '../utils/toast'
import { isValidEmail, normalizeEmail, isValidContact, extractDigits, isValidPassword } from '../utils/validators'
import INDIA_STATES from '../data/indiaStates'
import INDIA_CITIES from '../data/indiaCities'


const roleMap: Record<string, User['role']> = {
    admin: 'admin',
    staffadmin: 'staffAdmin',
    staff: 'staff',
}

const Login: React.FC = () => {
    const [companyName, setCompanyName] = useState('')
    const [email, setEmail] = useState('admin@example.com')
    const [password, setPassword] = useState('Admin@123')
    const [captchaQuestion, setCaptchaQuestion] = useState<string>('')
    const [captchaAnswer, setCaptchaAnswer] = useState<number>(0)
    const [captchaInput, setCaptchaInput] = useState('')
    const [captchaError, setCaptchaError] = useState<string | null>(null)
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    // register fields
    const [regName, setRegName] = useState('')
    const [regContact, setRegContact] = useState('')
    const [regCompany, setRegCompany] = useState('')
    const [regState, setRegState] = useState('')
    const [regCity, setRegCity] = useState('')
    const [regPassword, setRegPassword] = useState('')
    const [apiError, setApiError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showRegPassword, setShowRegPassword] = useState(false)
    const [loginAsStaff, setLoginAsStaff] = useState(false)
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
        const companyVal = String(companyName || '').trim()
        if (!companyVal) {
            setApiError('Company name is required')
            return
        }
        // validate email and password before proceeding
        const emailVal = normalizeEmail(email)
        if (!isValidEmail(emailVal)) {
            setApiError('Please enter a valid email address')
            return
        }
        if (!isValidPassword(password)) {
            setApiError('Password must have at least one uppercase letter, one number, one special character and be > 6 characters')
            return
        }
        if (Number(captchaInput) !== captchaAnswer) {
            setCaptchaError('Captcha answer is incorrect. Please try again.')
            generateCaptcha()
            return
        }
        setCaptchaError(null)
        setApiError(null)
        setLoading(true)
        try {
            const response = await loginApi({ companyName: companyVal, email: emailVal, password, loginAsStaff })
            if (!response || typeof response !== 'object' || !response.user || !response.token) {
                throw new Error('Invalid server response')
            }
            const mappedRole = roleMap[String(response?.user?.role || '').toLowerCase()] || 'staff'
            const user: User = {
                id: response?.user?.id ?? response?.user?.email ?? 'unknown',
                username: response?.user?.name ?? response?.user?.email ?? 'User',
                role: mappedRole,
                permissions: Array.isArray(response?.user?.permissions) ? response.user.permissions : [],
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
                            <div className="w-100 p-4 p-md-3">
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
                                    <div className="d-flex justify-content-center mb-3">
                                        <div className="btn-group" role="group" aria-label="auth toggle">
                                            <button
                                                type="button"
                                                className={"btn " + (mode === 'signin' ? 'btn-primary' : 'btn-outline-primary')}
                                                onClick={() => setMode('signin')}
                                            >
                                                Sign In
                                            </button>
                                            <button
                                                type="button"
                                                className={"btn " + (mode === 'signup' ? 'btn-primary' : 'btn-outline-primary')}
                                                onClick={() => setMode('signup')}
                                            >
                                                Sign Up
                                            </button>
                                        </div>
                                    </div>
                                    <h4 className="fw-bold mb-1">{mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}</h4>
                                    <p className="text-muted mb-0">{mode === 'signin' ? 'Use your admin credentials to continue.' : ''}</p>
                                </div>
                                {mode === 'signin' ? (
                                    <form onSubmit={submit} className="auth-form">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold text-dark">Company name</label>
                                            <div className="input-group auth-input-group">
                                                <span className="input-group-text">
                                                    <i className="bi bi-building"></i>
                                                </span>
                                                <input
                                                    className="form-control auth-input"
                                                    value={companyName}
                                                    onChange={e => setCompanyName(e.target.value)}
                                                    placeholder="Your company"
                                                    type="text"
                                                    required
                                                    autoComplete="organization"
                                                />
                                            </div>
                                        </div>
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
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    minLength={6}
                                                    autoComplete="current-password"
                                                />
                                                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                                    <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="loginAsStaff"
                                                    checked={loginAsStaff}
                                                    onChange={e => setLoginAsStaff(e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor="loginAsStaff">
                                                    Login as Staff
                                                </label>
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
                                ) : (
                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault()
                                            setApiError(null)
                                            setLoading(true)
                                            try {
                                                const regEmailVal = normalizeEmail(email)
                                                if (!isValidEmail(regEmailVal)) {
                                                    setApiError('Please enter a valid email address')
                                                    return
                                                }
                                                if (!isValidContact(regContact)) {
                                                    setApiError('Contact must be exactly 10 digits')
                                                    return
                                                }
                                                if (!isValidPassword(regPassword)) {
                                                    setApiError('Password must have at least one uppercase letter, one number, one special character and be > 6 characters')
                                                    return
                                                }

                                                await registerApi({
                                                    name: regName,
                                                    contact: extractDigits(regContact),
                                                    email: regEmailVal,
                                                    companyName: regCompany,
                                                    state: regState,
                                                    city: regCity,
                                                    password: regPassword,
                                                })
                                                toast.success('Registered successfully. You can sign in now.')
                                                // reset register fields
                                                setRegName('')
                                                setRegContact('')
                                                setRegCompany('')
                                                setRegState('')
                                                setRegCity('')
                                                setRegPassword('')
                                                setMode('signin')
                                            } catch (err: any) {
                                                const message = err?.message || err?.error || 'Registration failed'
                                                setApiError(message)
                                            } finally {
                                                setLoading(false)
                                            }
                                        }}
                                        className="auth-form"
                                    >
                                        <div className="form-floating mb-3">
                                            <input id="regName" className="form-control" placeholder="Full name" value={regName} onChange={e => setRegName(e.target.value)} required />
                                            <label htmlFor="regName">Full name</label>
                                        </div>

                                        <div className="form-floating mb-3">
                                            <input id="regContact" className="form-control" placeholder="Contact" value={regContact} onChange={e => setRegContact(e.target.value)} required />
                                            <label htmlFor="regContact">Contact</label>
                                        </div>

                                        <div className="form-floating mb-3">
                                            <input id="regEmail" className="form-control" placeholder="you@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                            <label htmlFor="regEmail">Email address</label>
                                        </div>

                                        <div className="form-floating mb-3">
                                            <input id="regCompany" className="form-control" placeholder="Company name" value={regCompany} onChange={e => setRegCompany(e.target.value)} />
                                            <label htmlFor="regCompany">Company name</label>
                                        </div>

                                        <div className="row">
                                            <div className="col mb-3">
                                                <div className="form-floating">
                                                    <select id="regState" className="form-select" value={regState} onChange={e => setRegState(e.target.value)}>
                                                        <option value="">Select state</option>
                                                        {INDIA_STATES.map(s => (
                                                            <option key={s.code} value={s.name}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                    <label htmlFor="regState">State</label>
                                                </div>
                                            </div>
                                            <div className="col mb-3">
                                                <div className="form-floating">
                                                    <select id="regCity" className="form-select" value={regCity} onChange={e => setRegCity(e.target.value)} disabled={!regState}>
                                                        <option value="">{regState ? 'Select city' : 'Select state first'}</option>
                                                        {(INDIA_CITIES[regState] || []).map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                    <label htmlFor="regCity">City</label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-floating mb-3">
                                            <div className="password-wrapper">
                                                <input id="regPassword" className="form-control" type={showRegPassword ? 'text' : 'password'} placeholder="Password" value={regPassword} onChange={e => setRegPassword(e.target.value)} minLength={6} />
                                                <label htmlFor="regPassword">Password (min 6 chars)</label>
                                                <button type="button" className="password-toggle" onClick={() => setShowRegPassword(s => !s)} aria-label={showRegPassword ? 'Hide password' : 'Show password'}>
                                                    <i className={showRegPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                                </button>
                                            </div>
                                        </div>

                                        {apiError && (
                                            <div className="alert alert-danger py-2 px-3 auth-alert" role="alert">
                                                <i className="bi bi-exclamation-octagon me-2"></i>
                                                {apiError}
                                            </div>
                                        )}
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-primary w-100" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
                                        </div>
                                    </form>
                                )}
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