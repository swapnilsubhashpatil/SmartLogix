import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaSearch,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaBookOpen,
} from "react-icons/fa";
import { navigationStructure } from "./docs_constants";

// Enhanced search function with proper ranking
const searchDocuments = (query, navigationStructure) => {
  if (!query.trim()) return [];

  const results = [];
  const searchTerm = query.toLowerCase().trim();

  Object.entries(navigationStructure).forEach(([categoryKey, category]) => {
    category.sections.forEach((section) => {
      const titleLower = section.title.toLowerCase();
      const categoryTitleLower = category.title.toLowerCase();

      // Calculate relevance score
      let score = 0;

      // Exact match gets highest priority
      if (titleLower === searchTerm) {
        score = 1000;
      }
      // Title starts with search term
      else if (titleLower.startsWith(searchTerm)) {
        score = 900;
      }
      // Title contains search term as whole word
      else if (
        titleLower.includes(` ${searchTerm} `) ||
        titleLower.includes(`${searchTerm} `) ||
        titleLower.includes(` ${searchTerm}`)
      ) {
        score = 800;
      }
      // Title contains search term anywhere
      else if (titleLower.includes(searchTerm)) {
        score = 700;
      }
      // Category title matches
      else if (categoryTitleLower.includes(searchTerm)) {
        score = 600;
      }

      // Bonus points for shorter titles (more relevant)
      if (score > 0) {
        score += Math.max(0, 100 - section.title.length);

        results.push({
          id: section.id,
          title: section.title,
          category: categoryKey,
          categoryTitle: category.title,
          score: score,
        });
      }
    });
  });

  // Sort by score (highest first) and then alphabetically
  return results
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.title.localeCompare(b.title);
    })
    .slice(0, 10); // Limit to top 10 results
};

// Highlight matching text in search results
const highlightMatch = (text, query) => {
  if (!query.trim()) return text;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

// Move SidebarContent outside the Sidebar component
const SidebarContent = ({
  activeCategory,
  activeSection,
  onNavigate,
  searchQuery,
  onSearch,
  searchResults,
  onClose,
  expandedCategories,
  toggleCategory,
}) => {
  const handleNavigate = (category, sectionId) => {
    onNavigate(category, sectionId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FaBookOpen className="text-white text-sm" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              SmartLogix
            </h2>
          </div>
          {/* Close Button for Mobile Only */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {searchQuery.trim() && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto"
              >
                <div className="p-2 text-xs text-gray-500 border-b bg-gray-50 rounded-t-xl">
                  Found {searchResults.length} result
                  {searchResults.length !== 1 ? "s" : ""}
                </div>
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.category}-${result.id}`}
                    onClick={() => handleNavigate(result.category, result.id)}
                    className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 last:rounded-b-xl transition-colors"
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      {highlightMatch(result.title, searchQuery)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      in {result.categoryTitle}
                    </div>
                    {/* Show relevance indicator for top results */}
                    {index < 3 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-blue-600">
                          {index === 0 ? "Best match" : "Top result"}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
            {searchQuery.trim() && searchResults.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4 text-center"
              >
                <div className="text-sm text-gray-500">
                  No results found for "{searchQuery}"
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Try different keywords or browse categories below
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {Object.entries(navigationStructure).map(([categoryKey, category]) => (
          <div key={categoryKey} className="mb-4">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(categoryKey)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <category.icon className="text-gray-500 text-sm flex-shrink-0" />
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  {category.title}
                </h3>
              </div>
              {expandedCategories[categoryKey] ? (
                <FaChevronDown className="text-xs text-gray-400 group-hover:text-gray-600" />
              ) : (
                <FaChevronUp className="text-xs text-gray-400 group-hover:text-gray-600" />
              )}
            </button>

            {/* Category Sections */}
            <AnimatePresence>
              {expandedCategories[categoryKey] && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-4 mt-2 space-y-1 overflow-hidden"
                >
                  {category.sections.map((section) => (
                    <motion.li
                      key={section.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <button
                        onClick={() => handleNavigate(categoryKey, section.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center justify-between group text-sm ${
                          activeCategory === categoryKey &&
                          activeSection === section.id
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium border-l-4 border-blue-500 shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="flex-1">{section.title}</span>
                        <FaChevronRight className="text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          SmartLogix Documentation v2.0
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({
  isOpen,
  onClose,
  activeCategory,
  activeSection,
  onNavigate,
  searchQuery,
  onSearch,
}) => {
  const [expandedCategories, setExpandedCategories] = useState({
    overview: true,
    docs: true,
    support: true,
  });

  // Generate search results with improved ranking
  const searchResults = searchDocuments(searchQuery, navigationStructure);

  const toggleCategory = (categoryKey) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  // For mobile, render animated sidebar with transparent background and blur effect
  if (window.innerWidth < 1024) {
    return (
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 z-50 w-80 sm:w-72 xl:w-80 bg-white/80 backdrop-blur-md shadow-2xl overflow-hidden"
        style={{
          borderTopRightRadius: "1.5rem",
          borderBottomRightRadius: "1.5rem",
        }}
      >
        <SidebarContent
          activeCategory={activeCategory}
          activeSection={activeSection}
          onNavigate={onNavigate}
          searchQuery={searchQuery}
          onSearch={onSearch}
          searchResults={searchResults}
          onClose={onClose}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
        />
      </motion.aside>
    );
  }

  // For desktop, render static sidebar
  return (
    <aside
      className="w-80 sm:w-72 xl:w-80 bg-white shadow-lg rounded-r-3xl overflow-hidden"
      style={{
        borderTopRightRadius: "1.5rem",
        borderBottomRightRadius: "1.5rem",
      }}
    >
      <SidebarContent
        activeCategory={activeCategory}
        activeSection={activeSection}
        onNavigate={onNavigate}
        searchQuery={searchQuery}
        onSearch={onSearch}
        searchResults={searchResults}
        onClose={onClose}
        expandedCategories={expandedCategories}
        toggleCategory={toggleCategory}
      />
    </aside>
  );
};

export default Sidebar;
