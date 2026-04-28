import Nav from "@/components/availock/Nav";
import Hero from "@/components/availock/Hero";
import WhatChanged from "@/components/availock/WhatChanged";
import AccessControl from "@/components/availock/AccessControl";
import Protocols from "@/components/availock/Protocols";
import HowItWorks from "@/components/availock/HowItWorks";
import ExplainerVideo from "@/components/availock/ExplainerVideo";
import Cost from "@/components/availock/Cost";
import Audience from "@/components/availock/Audience";
import Manifesto from "@/components/availock/Manifesto";
import Pricing from "@/components/availock/Pricing";
import Claim from "@/components/availock/Claim";
import Footer from "@/components/availock/Footer";
import WhatsAppChat from "@/components/availock/WhatsAppChat";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <WhatChanged />
        <AccessControl />
        <Protocols />
        <HowItWorks />
        <ExplainerVideo />
        <Cost />
        <Audience />
        <Manifesto />
        <Pricing />
        <Claim />
      </main>
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default Index;
