import Navbar from './Navbar'
import { Box } from '@mui/material'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import About from './pages/About'
import Portfolio from './pages/Portfolio'
import Services from './pages/Services'
import Contact from './pages/Contact'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import OrganizerDashboard from './pages/dashboards/OrganizerDashboard'
import ProviderDashboard from './pages/dashboards/ProviderDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import OrganizerAnalytics from './pages/dashboards/OrganizerAnalytics'
import ProviderAnalytics from './pages/dashboards/ProviderAnalytics'
import AdminServiceApproval from './pages/AdminServiceApproval'
import AdminTicketReports from './pages/AdminTicketReports'
import EventsNearYou from './pages/EventsNearYou'
import CreateEvent from './pages/CreateEvent'
import BrowseVendors from './pages/BrowseVendors'
import VendorProfile from './pages/VendorProfile'
import Messaging from './pages/Messaging'
import Settings from './pages/Settings'
import VendorServices from './pages/VendorServices'
import VendorAvailabilityCalendar from './pages/VendorAvailabilityCalendar'
import Support from './pages/Support'
import TicketListPage from './pages/TicketListPage'
import TicketDetail from './pages/TicketDetail'
import EventDetail from './pages/EventDetail'
import EventRegistrantsAndTickets from './pages/EventRegistrantsAndTickets'
import ProtectedRoute from './components/ProtectedRoute'
import { ThemeProvider } from './themes/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'

// Layout component with navbar
const LayoutWithNavbar = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', pt: '88px' }}>
    <Navbar navState="active" activeIndex={0} />
    {children}
  </Box>
)

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Routes>
            {/* Auth routes - no navbar */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

          {/* Dashboard routes - role-based */}
          <Route
            path="/organizer-dashboard"
            element={
              <ProtectedRoute requiredRole="organizer">
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/registrants-tickets"
            element={
              <ProtectedRoute requiredRole="organizer">
                <EventRegistrantsAndTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider-dashboard"
            element={
              <ProtectedRoute requiredRole="provider">
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/analytics"
            element={
              <ProtectedRoute requiredRole="organizer">
                <OrganizerAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/analytics"
            element={
              <ProtectedRoute requiredRole="provider">
                <ProviderAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor-profile"
            element={
              <ProtectedRoute requiredRole="provider">
                <VendorProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/service-approval"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminServiceApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ticket-sales"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminTicketReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messaging"
            element={
              <ProtectedRoute>
                <Messaging />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor-services"
            element={
              <ProtectedRoute requiredRole="provider">
                <VendorServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor-availability"
            element={
              <ProtectedRoute requiredRole="provider">
                <VendorAvailabilityCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support/tickets"
            element={
              <ProtectedRoute>
                <TicketListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support/tickets/:ticketId"
            element={
              <ProtectedRoute>
                <TicketDetail />
              </ProtectedRoute>
            }
          />

          {/* Main routes - with navbar */}
          <Route
            path="/"
            element={
              <LayoutWithNavbar>
                <HomePage />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/browse-vendors"
            element={
              <LayoutWithNavbar>
                <BrowseVendors />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/events-nearby"
            element={
              <LayoutWithNavbar>
                <EventsNearYou />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/create-event"
            element={
              <ProtectedRoute requiredRole="organizer">
                <LayoutWithNavbar>
                  <CreateEvent />
                </LayoutWithNavbar>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <LayoutWithNavbar>
                <EventDetail />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/about"
            element={
              <LayoutWithNavbar>
                <About />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/portfolio"
            element={
              <LayoutWithNavbar>
                <Portfolio />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/services"
            element={
              <LayoutWithNavbar>
                <Services />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/contact"
            element={
              <LayoutWithNavbar>
                <Contact />
              </LayoutWithNavbar>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
    </AuthProvider>
  )
}

export default App
