import React, { useState } from 'react';
import { register as apiRegister } from '../api/api';
import { toast } from '../utils/toast';
import { isValidEmail, normalizeEmail, extractDigits, isValidContact, isValidPassword } from '../utils/validators';
import INDIA_STATES from '../data/indiaStates';
import INDIA_CITIES from '../data/indiaCities';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate email, contact, and password using shared validators
    const emailVal = normalizeEmail(email);
    const contactDigits = extractDigits(contact);

    if (!isValidEmail(emailVal)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!isValidContact(contactDigits)) {
      toast.error('Contact must be exactly 10 digits');
      return;
    }

    if (password && !isValidPassword(password)) {
      toast.error('Password must have at least one uppercase letter, one number, one special character and be > 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await apiRegister({ name, contact: contactDigits, email: emailVal, companyName, state: stateVal, city, password });
      toast.success('Registration successful');
      setName(''); setContact(''); setEmail(''); setCompanyName(''); setStateVal(''); setCity(''); setPassword('');
    } catch (err: any) {
      const msg = err?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="card mx-auto" style={{ maxWidth: 600 }}>
        <div className="card-header">Register</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-floating mb-3">
              <input id="rName" value={name} onChange={(e) => setName(e.target.value)} className="form-control" placeholder="Full name" required />
              <label htmlFor="rName">Name</label>
            </div>

            <div className="form-floating mb-3">
              <input id="rContact" value={contact} onChange={(e) => setContact(e.target.value)} className="form-control" placeholder="Contact" required />
              <label htmlFor="rContact">Contact</label>
            </div>

            <div className="form-floating mb-3">
              <input id="rEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" placeholder="you@example.com" required />
              <label htmlFor="rEmail">Email</label>
            </div>

            <div className="form-floating mb-3">
              <input id="rCompany" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="form-control" placeholder="Company name" required />
              <label htmlFor="rCompany">Company Name</label>
            </div>

            <div className="row">
                <div className="col mb-3">
                  <div className="form-floating">
                    <select id="rState" value={stateVal} onChange={(e) => setStateVal(e.target.value)} className="form-select" required>
                      <option value="">Select state</option>
                      {INDIA_STATES.map(s => (
                        <option key={s.code} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    <label htmlFor="rState">State</label>
                  </div>
                </div>
              <div className="col mb-3">
                <div className="form-floating">
                  <select id="rCity" value={city} onChange={(e) => setCity(e.target.value)} className="form-select" disabled={!stateVal} required>
                    <option value="">{stateVal ? 'Select city' : 'Select state first'}</option>
                    {(INDIA_CITIES[stateVal] || []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <label htmlFor="rCity">City</label>
                </div>
              </div>
            </div>

            <div className="form-floating mb-3">
              <div className="password-wrapper">
                <input id="rPassword" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" placeholder="Password" />
                <label htmlFor="rPassword">Password (min 6 chars)</label>
                <button type="button" className="password-toggle" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                </button>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
