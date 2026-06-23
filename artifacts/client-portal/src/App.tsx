import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import ArchivePage from "@/pages/ArchivePage";
import VerifyPage from "@/pages/VerifyPage";
import MembersPage from "@/pages/MembersPage";
import AboutPage from "@/pages/AboutPage";
import EventsPage from "@/pages/EventsPage";
import AwardsPage from "@/pages/AwardsPage";
import MemberProfilePage from "@/pages/MemberProfilePage";
import PastMembersPage from "@/pages/PastMembersPage";
import ConstitutionPage from "@/pages/ConstitutionPage";

const queryClient = new QueryClient();

function AppLayout() {
  return (
    <Switch>
      {/* Admin pages have their own layout (no shared Navbar/Footer) */}
      <Route path="/admin">
        {() => (
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/login" component={AdminLoginPage} />

      {/* All other pages share Navbar + Footer */}
      <Route>
        {() => (
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/about" component={AboutPage} />
                <Route path="/members" component={MembersPage} />
                <Route path="/past-members" component={PastMembersPage} />
                <Route path="/constitution" component={ConstitutionPage} />
                <Route path="/events" component={EventsPage} />
                <Route path="/awards" component={AwardsPage} />
                <Route path="/members/:memberId">
                  {(params) => <MemberProfilePage memberId={params.memberId} />}
                </Route>
                <Route path="/archive/:year/:month">
                  {(params) => <ArchivePage year={params.year} month={params.month} />}
                </Route>
                <Route path="/verify/member/:memberId">
                  {(params) => <VerifyPage memberId={params.memberId} />}
                </Route>
                <Route>
                  {() => (
                    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
                      <div className="text-center">
                        <div className="text-7xl font-bold text-[#002147]/10 mb-4">404</div>
                        <h2 className="text-2xl font-bold text-[#002147] mb-2">Page Not Found</h2>
                        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
                        <a href="/" className="inline-flex items-center gap-2 bg-[#002147] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#003575] transition-colors">
                          Back to Home
                        </a>
                      </div>
                    </div>
                  )}
                </Route>
              </Switch>
            </main>
            <Footer />
          </div>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppLayout />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
