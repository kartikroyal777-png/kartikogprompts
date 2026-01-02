import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer'; 
import Home from './pages/Home';
import Prompts from './pages/Prompts';
import PromptDetail from './pages/PromptDetail';
import UploadPage from './pages/UploadPage';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import { About as AboutPage, Privacy as PrivacyPage, Terms as TermsPage } from './pages/Legal';
import InstructionsPage from './pages/Instructions';
import Profile from './pages/Profile';
import BuyCredits from './pages/BuyCredits';
import BecomeCreator from './pages/BecomeCreator';
import CreatorProfile from './pages/CreatorProfile';
import ProductPrompts from './pages/ProductPrompts';
import ImageToJson from './pages/ImageToJson';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import WelcomeFlow from './components/WelcomeFlow';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  // Check if we should show the welcome flow on mount
  useEffect(() => {
    // If it's a direct link to a specific page (e.g. prompt detail), skip onboarding
    if (window.location.pathname !== '/') {
      setShowWelcome(false);
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        {showWelcome ? (
          <WelcomeFlow onComplete={() => setShowWelcome(false)} />
        ) : (
          <Router>
            <ScrollToTop />
            <Toaster 
              position="top-center" 
              reverseOrder={false}
              toastOptions={{
                style: {
                  background: '#333',
                  color: '#fff',
                  borderRadius: '12px',
                },
              }} 
            />
            <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/prompts" element={<Prompts />} />
                  <Route path="/product-prompts" element={<ProductPrompts />} />
                  <Route path="/image-to-json" element={<ImageToJson />} />
                  <Route path="/prompt/:id" element={<PromptDetail />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/instructions" element={<InstructionsPage />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/buy-credits" element={<BuyCredits />} />
                  <Route path="/become-creator" element={<BecomeCreator />} />
                  <Route path="/creator/:id" element={<CreatorProfile />} />
                </Routes>
              </div>
              <Footer />
              <BottomNav />
            </div>
          </Router>
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
