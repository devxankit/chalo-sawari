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
import UserBottomNavigation from '../components/UserBottomNavigation';

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
      <div className="pb-24 md:pb-0">
        <Footer />
      </div>
      <UserBottomNavigation />
    </div>
  );
};

export default Index;