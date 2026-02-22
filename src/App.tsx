import React, { useState, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "./utils/toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PageLoader from "./components/PageLoader";
import RequirePermission from "./components/RequirePermission";

/* =======================
   LAZY LOADED PAGES
======================= */
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const ProductForm = lazy(() => import("./pages/ProductForm"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerForm = lazy(() => import("./pages/CustomerForm"));
const Billing = lazy(() => import("./pages/Billing"));
const Invoice = lazy(() => import("./pages/Invoice"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const BillingHistory = lazy(() => import("./pages/BillingHistory"));
const Profile = lazy(() => import("./pages/Profile"));
const StaffForm = lazy(() => import("./pages/StaffForm"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const NotFound = lazy(() => import("./pages/NotFound"));

/* =======================
   SIDEBAR CONTEXT
======================= */
type SidebarContextType = {
  sidebarClass: string;
  setSidebarClass: (c: string) => void;
};

export const SidebarContext = React.createContext<SidebarContextType>({
  sidebarClass: "",
  setSidebarClass: () => {},
});

const App: React.FC = () => {
  const [sidebarClass, setSidebarClass] = useState("collapsed");
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

  return (
    <SidebarContext.Provider value={{ sidebarClass, setSidebarClass }}>
      <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
        {!isLoginPage && <Header />}

        <div className="d-flex flex-grow-1">
          {!isLoginPage && <SidebarWithContext />}

          <div
            className={`flex-grow-1 d-flex flex-column ${
              !isLoginPage
                ? `content-with-sidebar${
                    sidebarClass === "collapsed" ? " collapsed" : ""
                  }`
                : ""
            }`}
          >
            <div className="flex-grow-1">
              {/* =======================
                 ROUTES WITH SUSPENSE
              ======================= */}
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Login />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route
                      path="/products"
                      element={
                        <RequirePermission permission="products">
                          <Products />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="/products/new"
                      element={
                        <RequirePermission permission="products">
                          <ProductForm />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="/products/edit/:id"
                      element={
                        <RequirePermission permission="products">
                          <ProductForm />
                        </RequirePermission>
                      }
                    />

                    <Route
                      path="/customers"
                      element={
                        <RequirePermission permission="customers">
                          <Customers />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="/customers/new"
                      element={
                        <RequirePermission permission="customers">
                          <CustomerForm />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="/customers/edit/:id"
                      element={
                        <RequirePermission permission="customers">
                          <CustomerForm />
                        </RequirePermission>
                      }
                    />

                    <Route
                      path="/billing"
                      element={
                        <RequirePermission permission="billing">
                          <Billing />
                        </RequirePermission>
                      }
                    />
                    <Route path="/invoice/:id" element={<Invoice />} />
                    <Route
                      path="/billing-history"
                      element={
                        <RequirePermission permission="billing">
                          <BillingHistory />
                        </RequirePermission>
                      }
                    />

                    <Route
                      path="/reports"
                      element={
                        <RequirePermission permission="reports">
                          <Reports />
                        </RequirePermission>
                      }
                    />
                    <Route path="/profile" element={<Profile />} />
                    <Route
                      path="/settings"
                      element={
                        <RequirePermission permission="settings">
                          <Settings />
                        </RequirePermission>
                      }
                    />
                    {/* <Route
                      path="/admin"
                      element={
                        <RequirePermission permission="admin">
                          <Admin />
                        </RequirePermission>
                      }
                    /> */}
                    <Route
                      path="/admin/staff/new"
                      element={
                        <RequirePermission permission="admin">
                          <StaffForm />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="/admin/staff"
                      element={
                        <RequirePermission permission="admin">
                          <StaffManagement />
                        </RequirePermission>
                      }
                    />
                  </Route>

                  {/* Catch-all route for 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>

            {!isLoginPage && <Footer />}
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
      />
    </SidebarContext.Provider>
  );
};

/* =======================
   SIDEBAR WRAPPER
======================= */
const SidebarWithContext: React.FC = () => {
  const { setSidebarClass } = React.useContext(SidebarContext);
  return <Sidebar onSidebarClassChange={setSidebarClass} />;
};

export default App;
