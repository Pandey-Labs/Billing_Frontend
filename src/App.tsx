import React, { useState, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "./utils/toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PageLoader from "./components/PageLoader";

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

                    <Route path="/products" element={<Products />} />
                    <Route path="/products/new" element={<ProductForm />} />
                    <Route path="/products/edit/:id" element={<ProductForm />} />

                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/new" element={<CustomerForm />} />
                    <Route
                      path="/customers/edit/:id"
                      element={<CustomerForm />}
                    />

                    <Route path="/billing" element={<Billing />} />
                    <Route path="/invoice/:id" element={<Invoice />} />
                    <Route path="/billing-history" element={<BillingHistory />} />

                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin" element={<Admin />} />
                  </Route>
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
        pauseOnHover
        theme="light"
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
