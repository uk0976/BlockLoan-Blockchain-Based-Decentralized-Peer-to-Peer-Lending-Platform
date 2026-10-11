import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { WalletProvider } from './context/WalletContext';
import { AppLayout } from './components/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { BorrowerDashboardPage } from './pages/BorrowerDashboardPage';
import { CreateLoanPage } from './pages/CreateLoanPage';
import { LenderDashboardPage } from './pages/LenderDashboardPage';
import { LoanDetailsPage } from './pages/LoanDetailsPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <WalletProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="marketplace" element={<MarketplacePage />} />
              <Route path="borrower" element={<BorrowerDashboardPage />} />
              <Route path="borrower/create" element={<CreateLoanPage />} />
              <Route path="create-loan" element={<Navigate to="/borrower/create" replace />} />
              <Route path="lender" element={<LenderDashboardPage />} />
              <Route path="loans/:id" element={<LoanDetailsPage />} />
              <Route path="transactions" element={<TransactionHistoryPage />} />
              <Route path="admin" element={<AdminDashboardPage />} />
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </WalletProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
