import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Prompts from './pages/Prompts';
import UploadPage from './pages/UploadPage';
import Auth from './pages/Auth';
import EbookPage from './pages/EbookPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import InstructionsPage from './pages/InstructionsPage';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import EbookPopup from './components/EbookPopup';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pb-20 md:pb-0">
          <Navbar />
          <EbookPopup />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/ebook" element={<EbookPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/instructions" element={<InstructionsPage />} />
          </Routes>
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
