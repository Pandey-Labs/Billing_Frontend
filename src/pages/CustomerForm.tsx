import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addCustomer, updateCustomer } from '../slices/customersSlice';
import { useNavigate, useParams } from 'react-router-dom';

const CustomerForm: React.FC = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const customers = useAppSelector(s => s.customers.items);
  const editing = Boolean(id);
  const existing = editing ? customers.find(c => c.id === id) : undefined;
  const [form, setForm] = useState(existing || { name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const validate = () => {
    const errs: { phone?: string; email?: string; name?: string } = {};
    // Name required
    if (!form.name.trim()) {
      errs.name = 'Name is required';
    }
        // Phone: required and allow 10-15 digits, optional +, spaces, dashes
        if (!(form.phone || '').trim()) {
          errs.phone = 'Phone is required';
        } else if (!/^\+?[0-9\s-]{10,15}$/.test((form.phone || '').trim())) {
          errs.phone = 'Enter a valid phone number';
        }
    // Email: required and simple regex
        if (!(form.email || '').trim()) {
          errs.email = 'Email is required';
        } else if (!/^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/.test((form.email || '').trim())) {
          errs.email = 'Enter a valid email address';
        }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const customer = { ...form, name: capitalizeFirst(form.name.trim()) };
    if (editing && existing) {
      dispatch(updateCustomer({ ...existing, ...customer }));
    } else {
      dispatch(addCustomer(customer));
    }
    navigate('/customers');
  };

  return (
    <div className="container">
      <h3>{editing ? 'Edit' : 'Add'} Customer</h3>
      <form onSubmit={submit} className="row g-2" noValidate>
        <div className="col-md-6">
          <input className={`form-control mb-2${errors.name ? ' is-invalid' : ''}`} placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
        </div>
        <div className="col-md-6">
          <input className={`form-control mb-2${errors.phone ? ' is-invalid' : ''}`} placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} maxLength={10} />
          {errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
        </div>
        <div className="col-md-6">
          <input className={`form-control mb-2${errors.email ? ' is-invalid' : ''}`} placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
        </div>
        <div className="col-12">
          <button className="btn btn-primary">{editing ? 'Update' : 'Add'} Customer</button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
