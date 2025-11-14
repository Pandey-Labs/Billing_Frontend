import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import CustomerForm from "./pages/CustomerForm";
import Billing from "./pages/Billing";
import Invoice from "./pages/Invoice";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import Sidebar from "./components/Sidebar";
import { useState } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductForm from "./pages/ProductForm";


// Sidebar context to sync collapsed/hovered state
const SidebarContext = React.createContext<{ sidebarClass: string; setSidebarClass: (c: string) => void }>({ sidebarClass: '', setSidebarClass: () => {} });

const App: React.FC = () => {
  const [sidebarClass, setSidebarClass] = useState('collapsed');
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  return (
    <SidebarContext.Provider value={{ sidebarClass, setSidebarClass }}>
      <div className="d-flex">
        {!isLoginPage && <SidebarWithContext />}
        <div className={`flex-grow-1 ${!isLoginPage ? `content-with-sidebar${sidebarClass === 'collapsed' ? ' collapsed' : ''}` : ''}`}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/edit/:id" element={<ProductForm />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/new" element={<CustomerForm />} />
              <Route path="/customers/edit/:id" element={<CustomerForm />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/invoice/:id" element={<Invoice />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Routes>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

// Sidebar wrapper to sync state with context
const SidebarWithContext: React.FC = () => {
  const { setSidebarClass } = React.useContext(SidebarContext);
  return <Sidebar onSidebarClassChange={setSidebarClass} />;
};

export default App;
