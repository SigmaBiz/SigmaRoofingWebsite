import Header from "@/components/header";
import Hero from "@/components/hero";
import Services from "@/components/services";
import Process from "@/components/process";
import About from "@/components/about";
import Projects from "@/components/projects";
import Testimonials from "@/components/testimonials";
import FAQ from "@/components/faq";
import MVP3ContactForm from "@/components/mvp3-contact-form";
import Footer from "@/components/footer";
import DebugPanel from "@/components/debug-panel";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Services />
      <Process />
      <About />
      <Projects />
      <Testimonials />
      <FAQ />
      <MVP3ContactForm />
      <Footer />
      <DebugPanel />
    </div>
  );
}
