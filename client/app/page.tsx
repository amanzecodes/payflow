"use client";

import Compare from "@/components/Compare";
import { FeaturesSectionDemo as Features } from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Sponsor from "@/components/Sponsor";
import TargetCustomer from "@/components/TargetCustomer";

const page = () => {
  return (
    <div>
      <Header />
      <Hero />
      <Sponsor />
      <Problem />
      <Features />
      <TargetCustomer />
      <Compare />
      <Footer />
    </div>
  );
};

export default page;
