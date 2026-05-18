import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import OTPPage from '../pages/OTPPage';
import DashboardPage from '../pages/DashboardPage';
import MarketPage from '../pages/MarketPage';
import OrdersPage from '../pages/OrdersPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import PaymentPage from '../pages/PaymentPage';
import SellWaitingPage from '../pages/SellWaitingPage';
import WalletPage from '../pages/WalletPage';
import CouponsPage from '../pages/CouponsPage';
import ReferralsPage from '../pages/ReferralsPage';
import HistoryPage from '../pages/HistoryPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';
import TransactionPinPage from '../pages/TransactionPinPage';
import ProfilePage from '../pages/ProfilePage';
import ProfileDetailsPage from '../pages/ProfileDetailsPage';
import TicketsPage from '../pages/TicketsPage';
import TicketDetailPage from '../pages/TicketDetailPage';
import NewTicketPage from '../pages/NewTicketPage';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/otp" element={<OTPPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/payment/:orderId" element={<PaymentPage />} />
            <Route path="/sell-waiting" element={<SellWaitingPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/coupons" element={<CouponsPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/account/profile" element={<ProfileDetailsPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/new" element={<NewTicketPage />} />
            <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/transaction-pin" element={<TransactionPinPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
