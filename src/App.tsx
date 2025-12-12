import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer'; 
import Home from './pages/Home';
import Prompts from './pages/Prompts';
import PromptDetail from './pages/PromptDetail';
import UploadPage from './pages/UploadPage';
import Auth from './pages/Auth';
import EbookPage from './pages/EbookPage';
import Admin from './pages/Admin';
import { About as AboutPage, Privacy as PrivacyPage, Terms as TermsPage } from './pages/Legal';
import InstructionsPage from './pages/Instructions';
import Profile from './pages/Profile';
import BuyCredits from './pages/BuyCredits';
import BecomeCreator from './pages/BecomeCreator';
import CreatorProfile from './pages/CreatorProfile'; // Import new page
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import EbookPopup from './components/EbookPopup';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
            <Navbar />
            <EbookPopup />
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/prompts" element={<Prompts />} />
                <Route path="/prompt/:id" element={<PromptDetail />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/ebook" element={<EbookPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/instructions" element={<InstructionsPage />} />
                
                {/* New Routes */}
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
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
