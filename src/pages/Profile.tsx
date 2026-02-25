import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { getMyProfile, updateMyRazorpayKeyId, ApiError } from "../api/api";
import { toast } from "../utils/toast";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const token = useAppSelector((s) => s.auth.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [updatingKey, setUpdatingKey] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getMyProfile({ token });
        if (!mounted) return;
        const user = res?.user || null;
        setProfile(user);
        setRazorpayKeyId(String(user?.razorpayKeyId || ""));
      } catch (e) {
        if (!mounted) return;
        if (e instanceof ApiError) setError(e.message);
        else setError("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="billing-page themed-page py-4 px-3">
      <div className="container-fluid">
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-2">
            <div
              className="bg-primary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: '50px', height: '50px' }}
            >
              <i className="bi bi-person-badge text-primary" style={{ fontSize: '1.5rem' }}></i>
            </div>
            <div>
              <h4 className="mb-0 fw-bold text-dark">Profile</h4>
              <p className="mb-0 small text-muted">Account details & configuration</p>
            </div>
          </div>
        </div>

      {loading && (
        <div className="card shadow-sm themed-card">
          <div className="card-body d-flex align-items-center gap-2">
            <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
            <span className="text-muted">Loading profile...</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {!loading && !error && profile && (
        <div className="row g-3">
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm themed-card h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 56, height: 56 }}
                  >
                    <i className="bi bi-person text-primary" style={{ fontSize: '1.6rem' }}></i>
                  </div>
                  <div>
                    <div className="fw-bold" style={{ fontSize: '1.1rem' }}>
                      {profile?.name || '-'}
                    </div>
                    <div className="text-muted small">{profile?.email || '-'}</div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted">Role</td>
                        <td className="fw-semibold text-capitalize">{profile?.role || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Contact</td>
                        <td className="fw-semibold">{profile?.contact || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Company</td>
                        <td className="fw-semibold">{profile?.companyName || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">State</td>
                        <td className="fw-semibold">{profile?.state || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">City</td>
                        <td className="fw-semibold">{profile?.city || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Org ID</td>
                        <td className="fw-semibold">{profile?.orgId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Registered At</td>
                        <td className="fw-semibold">
                          {profile?.createdAt
                            ? new Date(profile.createdAt).toLocaleString()
                            : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card shadow-sm themed-card h-100">
              <div className="card-header bg-white fw-bold d-flex align-items-center justify-content-between">
                <span>Tools & Settings</span>
                <span className="badge bg-light text-dark text-capitalize">{profile?.role || 'user'}</span>
              </div>
              <div className="card-body">
                {String(profile?.role || '').toLowerCase() === 'admin' ? (
                  <>
                    <div className="mb-4">
                      <div className="d-flex align-items-start justify-content-between gap-3">
                        <div>
                          <div className="fw-bold">Staff Management</div>
                          <div className="text-muted small">Create staff and assign permissions</div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => navigate('/admin/staff/new')}
                        >
                          <i className="bi bi-person-plus me-2"></i>
                          Create Staff
                        </button>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="fw-bold">Razorpay Configuration</div>
                      <div className="text-muted small">Stored in database (tenant admin)</div>
                    </div>

                    <div className="row g-2 align-items-end">
                      <div className="col-12 col-md-8">
                        <label className="form-label small text-muted mb-1">RAZORPAY_KEY_ID</label>
                        <input
                          className="form-control"
                          value={razorpayKeyId}
                          onChange={(e) => setRazorpayKeyId(e.target.value)}
                          placeholder="rzp_test_..."
                          disabled={updatingKey}
                        />
                      </div>
                      <div className="col-12 col-md-4 d-grid">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={updatingKey || !razorpayKeyId.trim()}
                          onClick={async () => {
                            if (!token) return;
                            try {
                              setUpdatingKey(true);
                              const res = await updateMyRazorpayKeyId(
                                { razorpayKeyId: razorpayKeyId.trim() },
                                { token }
                              );
                              setProfile(res?.user || profile);
                              toast.success('RAZORPAY_KEY_ID updated');
                            } catch (e) {
                              if (e instanceof ApiError) toast.error(e.message);
                              else toast.error('Failed to update Razorpay key');
                            } finally {
                              setUpdatingKey(false);
                            }
                          }}
                        >
                          {updatingKey ? 'Updating...' : 'Update'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="alert alert-info mb-0" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    No admin tools available for your role.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !profile && (
        <div className="card shadow-sm themed-card">
          <div className="card-body text-center py-5">
            <i className="bi bi-inbox fs-2 mb-3 d-block text-muted"></i>
            <div className="text-muted">No profile data available.</div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Profile;
