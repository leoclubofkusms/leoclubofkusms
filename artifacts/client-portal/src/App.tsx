import SplashScreen from "@/components/SplashScreen";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalPhotoViewer from "@/components/GlobalPhotoViewer";

const HomePage = lazy(() => import("@/pages/HomePage"));
const AdminLoginPage = lazy(() => import("@/pages/AdminLoginPage"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const ArchivePage = lazy(() => import("@/pages/ArchivePage"));
const ArchiveIndexPage = lazy(() => import("@/pages/ArchiveIndexPage"));
const VerifyPage = lazy(() => import("@/pages/VerifyPage"));
const MembersPage = lazy(() => import("@/pages/MembersPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const EventsPage = lazy(() => import("@/pages/EventsPage"));
const EventDetailPage = lazy(() => import("@/pages/EventDetailPage"));
const AwardsPage = lazy(() => import("@/pages/AwardsPage"));
const MemberProfilePage = lazy(() => import("@/pages/MemberProfilePage"));
const PastMembersPage = lazy(() => import("@/pages/PastMembersPage"));
const ConstitutionPage = lazy(() => import("@/pages/ConstitutionPage"));
const WallOfFamePage = lazy(() => import("@/pages/WallOfFamePage"));
const ActivityPage = lazy(() => import("@/pages/ActivityPage"));
const StatsPage = lazy(() => import("@/pages/StatsPage"));

const queryClient = new QueryClient();

const SEO_DEFAULT = {
  title: "Leo Club of KUSMS | Leadership Through Service",
  description: "Official Leo Club of KUSMS portal for members, service activities, leadership, awards, events, and the club's community impact in Nepal.",
};

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

type GoogleAnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

function trackPageView(path: string, title: string) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;

  const analyticsWindow = window as GoogleAnalyticsWindow;
  if (!analyticsWindow.gtag) {
    analyticsWindow.dataLayer = [];
    analyticsWindow.gtag = (...args) => analyticsWindow.dataLayer?.push(args);
    analyticsWindow.gtag("js", new Date());
    analyticsWindow.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    script.dataset.googleAnalytics = GA_MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  analyticsWindow.gtag("event", "page_view", {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
}

function setMeta(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setProperty(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function SeoManager() {
  const [location] = useLocation();

  useEffect(() => {
    const path = location.split("?")[0].replace(/\/+$/, "") || "/";
    const segments = path.split("/").filter(Boolean);
    const isAdmin = path === "/admin" || path.startsWith("/admin/");
    const isPublicRoute =
      ["/", "/about", "/members", "/past-members", "/constitution", "/wall-of-fame", "/events", "/awards", "/archive", "/stats"].includes(path) ||
      (segments[0] === "event" && segments.length === 2) ||
      (segments[0] === "members" && segments.length === 2) ||
      (segments[0] === "activity" && segments.length === 2) ||
      (segments[0] === "archive" && segments.length === 3) ||
      (segments[0] === "verify" && segments[1] === "member" && segments.length === 3);
    const isNotFound = !isAdmin && !isPublicRoute;
    let title = SEO_DEFAULT.title;
    let description = SEO_DEFAULT.description;

    if (isAdmin) {
      title = path === "/admin/login" ? "Admin Sign In | Leo Club of KUSMS" : "Club Administration | Leo Club of KUSMS";
      description = "Private administration area for Leo Club of KUSMS.";
    } else if (path === "/about") {
      title = "About Leo Club of KUSMS | Service & Leadership";
      description = "Learn about the Leo Club of Kathmandu University School of Medical Sciences, our mission, leaders, charter, and commitment to community service.";
    } else if (path === "/members") {
      title = "Leo Club of KUSMS Members | Active Member Directory";
      description = "Explore the active member directory of Leo Club of KUSMS and view member roles, service activities, achievements, and verification profiles.";
    } else if (path === "/past-members") {
      title = "Past Members | Leo Club of KUSMS";
      description = "View past members and the service history of the Leo Club of Kathmandu University School of Medical Sciences.";
    } else if (path === "/events") {
      title = "Leo Club of KUSMS Events | Service Calendar";
      description = "See upcoming and completed service events, health initiatives, outreach programs, and club activities from Leo Club of KUSMS.";
    } else if (segments[0] === "event" && segments[1]) {
      title = "Event | Leo Club of KUSMS";
      description = "View event details, dates, location, and applications for this Leo Club of KUSMS event.";
    } else if (path === "/awards") {
      title = "Awards & Recognition | Leo Club of KUSMS";
      description = "Recognize the service awards and achievements of members and the Leo Club of Kathmandu University School of Medical Sciences.";
    } else if (path === "/constitution") {
      title = "Leo Club Constitution | Leo Club of KUSMS";
      description = "Read the constitution, governance, membership rules, and operating principles of Leo Club of KUSMS.";
    } else if (path === "/wall-of-fame") {
      title = "Wall of Fame | Leo Club of KUSMS";
      description = "Meet the leaders and outstanding contributors who have shaped the Leo Club of KUSMS through service.";
    } else if (path === "/stats") {
      title = "Club Statistics | Leo Club of KUSMS";
      description = "View activity, membership, service, and achievement statistics for Leo Club of KUSMS.";
    } else if (path === "/archive") {
      title = "Activity Archive | Leo Club of KUSMS";
      description = "Browse the monthly service activity archive of Leo Club of KUSMS.";
    } else if (segments[0] === "archive" && segments.length === 3) {
      const month = segments[2].charAt(0).toUpperCase() + segments[2].slice(1);
      const year = segments[1].replace(/-/g, "/");
      title = `${month} ${year} Service Archive | Leo Club of KUSMS`;
      description = `Browse Leo Club of KUSMS service activities from ${month} ${year}.`;
    } else if (segments[0] === "members" && segments[1]) {
      title = "Member Profile | Leo Club of KUSMS";
      description = "View this Leo Club of KUSMS member's service history, Leo Year roles, achievements, and verified activities.";
    } else if (segments[0] === "activity" && segments[1]) {
      title = "Service Activity | Leo Club of KUSMS";
      description = "Explore a service activity, participating members, photos, and impact from Leo Club of KUSMS.";
    } else if (segments[0] === "archive") {
      title = "Activity Archive | Leo Club of KUSMS";
      description = "Browse the monthly service activity archive of Leo Club of KUSMS.";
    } else if (segments[0] === "verify") {
      title = "Verify Leo Club Credentials | Leo Club of KUSMS";
      description = "Verify a Leo Club of KUSMS member credential and review their official club profile.";
    } else if (isNotFound) {
      title = "Page Not Found | Leo Club of KUSMS";
      description = "The requested page could not be found on the Leo Club of KUSMS website.";
    }

    const canonical = `https://leoclubofkusms.org${path}`;
    document.title = title;
    setMeta("description", description);
    setMeta("robots", isAdmin || isNotFound ? "noindex, nofollow" : "index, follow");
    setProperty("og:title", title);
    setProperty("og:description", description);
    setProperty("og:url", canonical);
    setProperty("og:type", "website");
    setProperty("og:image", "https://leoclubofkusms.org/opengraph.jpg");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", "https://leoclubofkusms.org/opengraph.jpg");
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;
    trackPageView(path, title);
  }, [location]);

  return null;
}

function RouteLoadingFallback({ label = "Loading page…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[50vh] items-center justify-center bg-[#F8FAFC]">
      <div className="flex items-center gap-3 text-sm text-[#002147]/70">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#002147] border-t-transparent" />
        {label}
      </div>
    </div>
  );
}

function AppLayout() {
  return (
    <Switch>
      <Route path="/admin">
        {() => (
          <Suspense fallback={<RouteLoadingFallback label="Loading admin tools…" />}>
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          </Suspense>
        )}
      </Route>
      <Route path="/admin/login">
        {() => (
          <Suspense fallback={<RouteLoadingFallback label="Loading admin sign in…" />}>
            <AdminLoginPage />
          </Suspense>
        )}
      </Route>

      <Route>
        {() => (
          <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F8FAFC]">
            <Navbar />
            <main className="min-w-0 w-full flex-1 bg-[#F8FAFC]">
              <Suspense fallback={<RouteLoadingFallback />}>
                <Switch>
                  <Route path="/" component={HomePage} />
                  <Route path="/about" component={AboutPage} />
                  <Route path="/members" component={MembersPage} />
                  <Route path="/past-members" component={PastMembersPage} />
                  <Route path="/constitution" component={ConstitutionPage} />
                  <Route path="/wall-of-fame" component={WallOfFamePage} />
                  <Route path="/events" component={EventsPage} />
                  <Route path="/event/:id">
                    {(params) => <EventDetailPage eventId={params.id} />}
                  </Route>
                  <Route path="/awards" component={AwardsPage} />
                  <Route path="/archive" component={ArchiveIndexPage} />
                  <Route path="/archive/:year/:month">
                    {(params) => <ArchivePage year={params.year} month={params.month} />}
                  </Route>
                  <Route path="/members/:memberId">
                    {(params) => <MemberProfilePage memberId={params.memberId} />}
                  </Route>
                  <Route path="/stats" component={StatsPage} />
                  <Route path="/activity/:id">
                    {(params) => <ActivityPage activityId={params.id} />}
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
              </Suspense>
            </main>
            <Footer />
          </div>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {showSplash && <SplashScreen onEnter={() => setShowSplash(false)} />}
          <SeoManager />
          <AppLayout />
          <GlobalPhotoViewer />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;