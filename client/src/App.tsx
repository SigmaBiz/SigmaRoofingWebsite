import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import Sitemap from "@/pages/sitemap";
import Admin from "@/pages/admin";
import HailDamage from "@/pages/hail-damage";
import HailLandingPage from "@/pages/hail-landingpage";
import TornadoDamage from "@/pages/tornado-damage";
import SocHub from "@/pages/sochub";
import NotFound from "@/pages/not-found";

// /estimate — lazy-loaded so Three.js stays out of the main/funnel bundle.
// NOTE: the parked 3D dev/experimental pages (housetest, inspect, skins, cube, cascade, grid, scrub,
// scroller, transitions, citygrid, roof, pullback, scene3d, zelda, shingletest, captest, sidingtest,
// overhangtest, veneertest, sketchtest, …) are intentionally NOT routed here so they don't ship to
// production. The full snapshot of that work lives on the `design-reskin` archive branch (+ .context/).
const Estimate = lazy(() => import("@/pages/estimate"));

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
      <Route path="/estimate">
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Estimate />
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
