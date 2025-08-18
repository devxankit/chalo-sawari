import TopNavigation from "@/components/TopNavigation";
import HeroSection from "@/components/HeroSection";
import OffersSection from "@/components/OffersSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import BookingBenefits from "@/components/BookingBenefits";
import HowToBook from "@/components/HowToBook";
import PartnersSection from "@/components/PartnersSection";
import RoutesTable from "@/components/RoutesTable";
import LiveTrackingSection from "@/components/LiveTrackingSection";
import AppDownloadSection from "@/components/AppDownloadSection";
import Footer from "@/components/Footer";
import { useEffect, useRef, useState } from "react";

// Animation wrapper component
const AnimatedSection = ({ children, delay = 0, direction = "up" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const getAnimationClasses = () => {
    const baseClasses = "transition-all duration-1000 ease-out";
    const delayClass = `delay-${delay * 100}`;
    
    if (direction === "up") {
      return `${baseClasses} ${delayClass} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`;
    } else if (direction === "left") {
      return `${baseClasses} ${delayClass} ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
      }`;
    } else if (direction === "right") {
      return `${baseClasses} ${delayClass} ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`;
    } else if (direction === "scale") {
      return `${baseClasses} ${delayClass} ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`;
    }
    
    return baseClasses;
  };

  return (
    <div ref={ref} className={getAnimationClasses()}>
      {children}
    </div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen">
      <TopNavigation />
      <HeroSection />
      
      <AnimatedSection delay={1} direction="up">
        <OffersSection />
      </AnimatedSection>
      
      <AnimatedSection delay={2} direction="scale">
        <WhyChooseUs />
      </AnimatedSection>
      
      <AnimatedSection delay={1} direction="left">
        <BookingBenefits />
      </AnimatedSection>
      
      <AnimatedSection delay={2} direction="right">
        <HowToBook />
      </AnimatedSection>
      
      <AnimatedSection delay={1} direction="scale">
        <PartnersSection />
      </AnimatedSection>
      
      <AnimatedSection delay={2} direction="up">
        <Footer />
      </AnimatedSection>
    </div>
  );
};

export default Index;