import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LogoBackground from "@/components/logo-background";
import Home from "@/pages/home";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import Sitemap from "@/pages/sitemap";
import Admin from "@/pages/admin";
import GooglePhotosTest from "@/pages/google-photos-test";
import DynamicLanding from "@/pages/dynamic-landing";
import StormLanding from "@/pages/storm-landing";
import HailDamage from "@/pages/hail-damage";
import HailLandingPage from "@/pages/hail-landingpage";
import TornadoDamage from "@/pages/tornado-damage";
import SocHub from "@/pages/sochub";
import NotFound from "@/pages/not-found";

// 3D experience page — lazy-loaded so Three.js stays out of the main/funnel bundle.
const Cascade = lazy(() => import("@/pages/cascade"));
const Cube = lazy(() => import("@/pages/cube"));
const Scrub = lazy(() => import("@/pages/scrub"));
const Showcase = lazy(() => import("@/pages/showcase"));
const Scroller = lazy(() => import("@/pages/scroller"));
const Grid = lazy(() => import("@/pages/grid"));
const Transitions = lazy(() => import("@/pages/transitions"));
const CityGrid = lazy(() => import("@/pages/citygrid"));
const Roof = lazy(() => import("@/pages/roof"));
const PullBack = lazy(() => import("@/pages/pullback"));
const Scene3D = lazy(() => import("@/pages/scene3d"));
const Zelda = lazy(() => import("@/pages/zelda"));
const Skins = lazy(() => import("@/pages/skins"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hail-damage" component={HailDamage} />
      <Route path="/hail-landingpage" component={HailLandingPage} />
      <Route path="/tornado-damage" component={TornadoDamage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/sitemap" component={Sitemap} />
      <Route path="/admin" component={Admin} />
      <Route path="/social" component={SocHub} />
      <Route path="/google-photos-test" component={GooglePhotosTest} />
      <Route path="/cascade">
        <Suspense fallback={<div className="min-h-screen bg-[#0b1b30]" />}>
          <Cascade />
        </Suspense>
      </Route>
      <Route path="/cube">
        <Suspense fallback={<div className="min-h-screen bg-[#F5F0EA]" />}>
          <Cube />
        </Suspense>
      </Route>
      <Route path="/scrub">
        <Suspense fallback={<div className="min-h-screen bg-[#F5F0EA]" />}>
          <Scrub />
        </Suspense>
      </Route>
      <Route path="/showcase">
        <Suspense fallback={<div className="min-h-screen bg-[#F5F0EA]" />}>
          <Showcase />
        </Suspense>
      </Route>
      <Route path="/scroller">
        <Suspense fallback={<div className="min-h-screen bg-[#211F1D]" />}>
          <Scroller />
        </Suspense>
      </Route>
      <Route path="/grid">
        <Suspense fallback={<div className="min-h-screen bg-[#0E1116]" />}>
          <Grid />
        </Suspense>
      </Route>
      <Route path="/transitions">
        <Suspense fallback={<div className="min-h-screen bg-[#F5F0EA]" />}>
          <Transitions />
        </Suspense>
      </Route>
      <Route path="/citygrid">
        <Suspense fallback={<div className="min-h-screen bg-[#F5F0EA]" />}>
          <CityGrid />
        </Suspense>
      </Route>
      <Route path="/roof">
        <Suspense fallback={<div className="min-h-screen bg-[#E8D8C4]" />}>
          <Roof />
        </Suspense>
      </Route>
      <Route path="/pullback">
        <Suspense fallback={<div className="min-h-screen bg-[#F5F0EA]" />}>
          <PullBack />
        </Suspense>
      </Route>
      <Route path="/scene3d">
        <Suspense fallback={<div className="min-h-screen bg-[#EAE2D2]" />}>
          <Scene3D />
        </Suspense>
      </Route>
      <Route path="/zelda">
        <Suspense fallback={<div className="min-h-screen bg-[#97CDEC]" />}>
          <Zelda />
        </Suspense>
      </Route>
      <Route path="/skins">
        <Suspense fallback={<div className="min-h-screen bg-[#15171c]" />}>
          <Skins />
        </Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
