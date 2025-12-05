import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer'; // Ensure Footer is imported
import Home from './pages/Home';
import Prompts from './pages/Prompts';
import PromptDetail from './pages/PromptDetail'; // Import PromptDetail
import UploadPage from './pages/UploadPage';
import Auth from './pages/Auth';
import EbookPage from './pages/EbookPage';
import { About as AboutPage, Privacy as PrivacyPage, Terms as TermsPage } from './pages/Legal';
import InstructionsPage from './pages/Instructions';
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
                <Route path="/prompt/:id" element={<PromptDetail />} /> {/* Added Route */}
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/ebook" element={<EbookPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/instructions" element={<InstructionsPage />} />
              </Routes>
            </div>
            <Footer /> {/* Added Footer */}
            <BottomNav />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
