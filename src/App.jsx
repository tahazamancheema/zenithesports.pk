import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';
import ScrollToTop from './components/ScrollToTop';

// Lazy-load all pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const TournamentsPage = lazy(() => import('./pages/TournamentsPage'));
const TournamentDetailsPage = lazy(() => import('./pages/TournamentDetailsPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const DailyScrimsPage = lazy(() => import('./pages/DailyScrimsPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

// Pages that don't show the main footer
const NO_FOOTER_ROUTES = ['/admin', '/profile'];

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
    // ── Deployment Recovery ──
    // If a chunk fails to load (usually after a new deployment), force a reload to get fresh assets
    if (error?.message?.includes('Failed to fetch dynamically imported module') || 
        error?.message?.includes('loading chunk')) {
      window.location.reload();
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
          <div className="max-w-2xl w-full text-center space-y-6">
            <h1 className="font-bebas text-6xl font-black italic text-[#dbb462]">SYSTEM FAULT</h1>
            <p className="font-body text-[#d1c5b3] opacity-60">
              The Zenith engine encountered an unexpected exception. Protocol requires a tactical reset.
            </p>
            <div className="bg-[#1a1a1a] p-4 text-left font-mono text-red-400 text-sm overflow-auto">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="zenith-gradient text-[#402d00] font-bebas font-bold text-lg px-12 py-4 tracking-widest hover:brightness-110 active:scale-95 transition-all"
            >
              INITIALIZE REBOOT
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-1 zenith-gradient animate-pulse" />
        <span className="font-bebas text-3xl font-bold italic text-[#dbb462] animate-pulse">
          ZENITH
        </span>
        <div className="w-12 h-1 zenith-gradient animate-pulse" />
      </div>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const showFooter = !NO_FOOTER_ROUTES.some((r) => location.pathname.startsWith(r));

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Main */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/reset" element={<ResetPasswordPage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
            <Route path="/scrims" element={<DailyScrimsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Protected */}
            <Route
              path="/register/:tournamentId"
              element={
                <ProtectedRoute requireAuth>
                  <RegistrationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requireAuth>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAuth requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

const TOAST_STYLE = {
  style: {
    background: '#1f1f1f',
    color: '#e2e2e2',
    border: '1px solid rgba(78, 70, 56, 0.3)',
    fontFamily: "'Saira', 'Segoe UI', sans-serif",
    fontSize: '16px',
    borderRadius: '0px',
  },
  success: { iconTheme: { primary: '#dbb462', secondary: '#402d00' } },
  error: { iconTheme: { primary: '#ffb4ab', secondary: '#690005' } },
};

export default function App() {
  // EXTREME FAILSAFE: Force clear physical memory if the browser lock engine corrupts
  useEffect(() => {
    if (window.location.search.includes('panic_reset')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <Toaster position="top-right" toastOptions={TOAST_STYLE} />
          <AppLayout />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
