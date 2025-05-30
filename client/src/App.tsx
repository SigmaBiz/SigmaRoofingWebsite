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
import TornadoDamage from "@/pages/tornado-damage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hail-damage" component={HailDamage} />
      <Route path="/tornado-damage" component={TornadoDamage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/sitemap" component={Sitemap} />
      <Route path="/admin" component={Admin} />
      <Route path="/google-photos-test" component={GooglePhotosTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LogoBackground />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
