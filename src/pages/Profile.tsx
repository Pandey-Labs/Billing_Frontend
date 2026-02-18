import React, { useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
import { getMyProfile, updateMyRazorpayKeyId, ApiError } from "../api/api";
import { toast } from "../utils/toast";

const Profile: React.FC = () => {
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
    <div className="container-fluid py-4 px-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-0 fw-bold">Profile</h4>
          <div className="text-muted small">Registered user details</div>
        </div>
      </div>

      {loading && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">Loading...</div>
        </div>
      )}

      {!loading && error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && profile && (
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 52, height: 52 }}
                  >
                    <i className="bi bi-person text-primary" style={{ fontSize: "1.5rem" }}></i>
                  </div>
                  <div>
                    <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                      {profile?.name || "-"}
                    </div>
                    <div className="text-muted small">{profile?.email || "-"}</div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted">Role</td>
                        <td className="fw-semibold text-capitalize">{profile?.role || "-"}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Contact</td>
                        <td className="fw-semibold">{profile?.contact || "-"}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Company</td>
                        <td className="fw-semibold">{profile?.companyName || "-"}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">State</td>
                        <td className="fw-semibold">{profile?.state || "-"}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">City</td>
                        <td className="fw-semibold">{profile?.city || "-"}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Org ID</td>
                        <td className="fw-semibold">{profile?.orgId || "-"}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Registered At</td>
                        <td className="fw-semibold">
                          {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {String(profile?.role || "").toLowerCase() === "admin" && (
                  <>
                    <hr />
                    <div className="fw-bold mb-2">Razorpay Configuration</div>
                    <div className="mb-2">
                      <label className="form-label small text-muted mb-1">
                        RAZORPAY_KEY_ID
                      </label>
                      <input
                        className="form-control"
                        value={razorpayKeyId}
                        onChange={(e) => setRazorpayKeyId(e.target.value)}
                        placeholder="rzp_test_..."
                        disabled={updatingKey}
                      />
                    </div>
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
                          toast.success("RAZORPAY_KEY_ID updated");
                        } catch (e) {
                          if (e instanceof ApiError) toast.error(e.message);
                          else toast.error("Failed to update Razorpay key");
                        } finally {
                          setUpdatingKey(false);
                        }
                      }}
                    >
                      {updatingKey ? "Updating..." : "Update"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !profile && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">No profile data available.</div>
        </div>
      )}
    </div>
  );
};

export default Profile;
