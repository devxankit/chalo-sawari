import TopNavigation from '../components/TopNavigation';
import HeroSection from '../components/HeroSection';
import OffersSection from '../components/OffersSection';
import WhyChooseUs from '../components/WhyChooseUs';
import BookingBenefits from '../components/BookingBenefits';
import HowToBook from '../components/HowToBook';
import PartnersSection from '../components/PartnersSection';
import RoutesTable from '../components/RoutesTable';
import AppDownloadSection from '../components/AppDownloadSection';
import Footer from '../components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <TopNavigation />
      <HeroSection />
      <OffersSection />
      <WhyChooseUs />
      <BookingBenefits />
      <HowToBook />
      <PartnersSection />
      <Footer />
    </div>
  );
};

export default Index;