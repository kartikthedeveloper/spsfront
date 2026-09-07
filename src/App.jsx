import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import Academics from './pages/Academics';
import Students from './pages/Students';
import Fees from './pages/Fees';
import Attendance from './pages/Attendance';
import Leads from './pages/Leads';
import Expenses from './pages/Expenses';
import Salary from './pages/Salary';
import Reports from './pages/Reports';
import Campaigns from './pages/Campaigns';
import Settings from './pages/Settings';

// Each page component wraps itself in <AppShell> (sidebar + topbar), so
// here we only need to apply route protection / role gating.
const page = (Component, roles) => (
  <ProtectedRoute roles={roles}>
    <Component />
  </ProtectedRoute>
);

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: '13px' } }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={page(Dashboard)} />
        <Route path="/branches" element={page(Branches, ['admin'])} />
        <Route path="/academics" element={page(Academics)} />
        <Route path="/students" element={page(Students)} />
        <Route path="/fees" element={page(Fees)} />
        <Route path="/attendance" element={page(Attendance)} />
        <Route path="/leads" element={page(Leads)} />
        <Route path="/expenses" element={page(Expenses)} />
        <Route path="/salary" element={page(Salary, ['admin', 'branch_manager'])} />
        <Route path="/reports" element={page(Reports, ['admin', 'branch_manager'])} />
        <Route path="/campaigns" element={page(Campaigns, ['admin', 'branch_manager'])} />
        <Route path="/settings" element={page(Settings, ['admin'])} />
      </Routes>
    </>
  );
}
