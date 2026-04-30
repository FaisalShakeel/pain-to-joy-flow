import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Privacy from "./pages/legal/Privacy.tsx";
import Terms from "./pages/legal/Terms.tsx";
import Encryption from "./pages/legal/Encryption.tsx";
import Contact from "./pages/legal/Contact.tsx";
import PatentPending from "./pages/legal/PatentPending.tsx";
import ScrollToTop from "./components/ScrollToTop.tsx";
import { SpotlightProvider } from "./components/app/SpotlightContext.tsx";
import { NotificationsProvider } from "./components/app/NotificationsContext.tsx";
import { MessagesProvider } from "./components/app/MessagesContext.tsx";
import { RequestsProvider } from "./components/app/RequestsContext.tsx";

// Marketing extras
import Pricing from "./pages/Pricing.tsx";
import Faq from "./pages/Faq.tsx";

// Auth
import SignUp from "./pages/auth/SignUp.tsx";
import Login from "./pages/auth/Login.tsx";
import ForgotPassword from "./pages/auth/ForgotPassword.tsx";
import ResetPassword from "./pages/auth/ResetPassword.tsx";
import Onboarding from "./pages/auth/Onboarding.tsx";

// App (authenticated shell)
import Dashboard from "./pages/app/Dashboard.tsx";
import Contacts from "./pages/app/Contacts.tsx";
import ContactProfile from "./pages/app/ContactProfile.tsx";
import ContactLog from "./pages/app/ContactLog.tsx";
import LiveCall from "./pages/app/LiveCall.tsx";
import Availability from "./pages/app/Availability.tsx";
import SlotBuilder from "./pages/app/SlotBuilder.tsx";
import QuickSyncBuilder from "./pages/app/QuickSyncBuilder.tsx";
import ScheduleCall from "./pages/app/ScheduleCall.tsx";
import AccessRequests from "./pages/app/AccessRequests.tsx";
import ApprovalFlow from "./pages/app/ApprovalFlow.tsx";
import ApprovalQueues from "./pages/app/ApprovalQueues.tsx";
import Messages from "./pages/app/Messages.tsx";
import Notifications from "./pages/app/Notifications.tsx";
import Analytics from "./pages/app/Analytics.tsx";
import ShareProfile from "./pages/app/ShareProfile.tsx";
import AccountSettings from "./pages/app/AccountSettings.tsx";
import EditProfile from "./pages/app/EditProfile.tsx";
import Upgrade from "./pages/app/Upgrade.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <SpotlightProvider>
        <NotificationsProvider>
        <MessagesProvider>
        <RequestsProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/encryption" element={<Encryption />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/patent-pending" element={<PatentPending />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<Faq />} />
          {/* Auth */}
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          {/* App */}
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/contacts" element={<Contacts />} />
          <Route path="/app/contact/:id" element={<ContactProfile />} />
          <Route path="/app/contact/:id/log" element={<ContactLog />} />
          <Route path="/app/contact/:id/call" element={<LiveCall />} />
          <Route path="/app/availability" element={<Availability />} />
          <Route path="/app/availability/builder" element={<SlotBuilder />} />
          <Route path="/app/availability/quick-sync" element={<QuickSyncBuilder />} />
          <Route path="/app/schedule/:id" element={<ScheduleCall />} />
          <Route path="/app/requests" element={<AccessRequests />} />
          <Route path="/app/requests/manage" element={<ApprovalFlow />} />
          <Route path="/app/requests/queues" element={<ApprovalQueues />} />
          <Route path="/app/messages" element={<Messages />} />
          <Route path="/app/notifications" element={<Notifications />} />
          <Route path="/app/analytics" element={<Analytics />} />
          <Route path="/app/share" element={<ShareProfile />} />
          <Route path="/app/settings" element={<AccountSettings />} />
          <Route path="/app/settings/edit" element={<EditProfile />} />
          <Route path="/app/upgrade" element={<Upgrade />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </RequestsProvider>
        </MessagesProvider>
        </NotificationsProvider>
        </SpotlightProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
