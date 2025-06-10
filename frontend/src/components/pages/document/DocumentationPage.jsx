import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import Header from "../../Header";
import Sidebar from "./Sidebar";
import ContentRenderer from "./ContentRenderer";
import { navigationStructure, getAllSections } from "./docs_constants";

const DocumentationPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("overview");
  const [activeSection, setActiveSection] = useState("about");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const contentRef = useRef(null);

  const allSections = getAllSections();
  const currentSectionIndex = allSections.findIndex(
    (section) =>
      section.id === activeSection && section.category === activeCategory
  );

  // Handle search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    const results = allSections.filter(
      (section) =>
        section.title.toLowerCase().includes(query.toLowerCase()) ||
        section.description.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  // Navigation handlers
  const navigateToSection = (category, sectionId) => {
    setActiveCategory(category);
    setActiveSection(sectionId);
    setSearchResults([]);
    setSearchQuery("");
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  };

  const goToNextSection = () => {
    if (currentSectionIndex < allSections.length - 1) {
      const nextSection = allSections[currentSectionIndex + 1];
      navigateToSection(nextSection.category, nextSection.id);
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      const prevSection = allSections[currentSectionIndex - 1];
      navigateToSection(prevSection.category, prevSection.id);
    }
  };

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6">
      <Header title="Documentation" />

      <div className="max-w-7xl mx-auto mt-4 sm:mt-6">
        <div className="flex gap-4 sm:gap-6 relative">
          {/* Desktop Sidebar - Always Visible */}
          <div className="hidden lg:block w-80 sm:w-72 xl:w-80 flex-shrink-0">
            <Sidebar
              isOpen={true}
              onClose={() => {}}
              activeCategory={activeCategory}
              activeSection={activeSection}
              onNavigate={navigateToSection}
              searchQuery={searchQuery}
              onSearch={handleSearch}
              searchResults={searchResults}
            />
          </div>

          {/* Mobile Sidebar - Toggle */}
          <AnimatePresence>
            {isSidebarOpen && (
              <>
                <Sidebar
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                  activeCategory={activeCategory}
                  activeSection={activeSection}
                  onNavigate={navigateToSection}
                  searchQuery={searchQuery}
                  onSearch={handleSearch}
                  searchResults={searchResults}
                />

                {/* Mobile Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-transparent backdrop-blur-md z-40 lg:hidden"
                />
              </>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1" ref={contentRef}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[80vh]">
              <ContentRenderer
                activeCategory={activeCategory}
                activeSection={activeSection}
                currentSectionIndex={currentSectionIndex}
                allSections={allSections}
                onNavigateNext={goToNextSection}
                onNavigatePrevious={goToPreviousSection}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
