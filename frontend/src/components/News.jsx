import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaNewspaper,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import Header from "./Header";
import Toast from "./Toast";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  IconButton,
  Collapse,
  Pagination,
  Button,
  PaginationItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const News = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("direct"); // New state for search mode
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [toastProps, setToastProps] = useState({ type: "", message: "" });
  const [page, setPage] = useState(1);
  const [totalPages] = useState(5); // Fixed 5 pages for 5 days
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [rowSummaries, setRowSummaries] = useState({});
  const [rowLoading, setRowLoading] = useState({});

  const fetchNews = async (currentPage = 1, search = "") => {
    setTableLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/news`, {
        params: { search: search || undefined, page: currentPage, searchMode },
      });

      setNews(response.data.articles);
      setQuery(response.data.query);
      setFromDate(response.data.fromDate);
      setToDate(response.data.toDate);
    } catch (error) {
      console.error("Error fetching news:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch news.";
      setToastProps({ type: "error", message: errorMessage });
    } finally {
      setTableLoading(false);
      if (currentPage === 1 && !search) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(1);
  }, []);

  const handleSearch = () => {
    setSearchQuery(tempSearchQuery);
    setPage(1);
    fetchNews(1, tempSearchQuery);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    fetchNews(newPage, searchQuery);
  };

  const handleSearchModeToggle = () => {
    setSearchMode((prev) => (prev === "direct" ? "summarized" : "direct"));
  };

  const handleRowToggle = async (article) => {
    const isExpanded = expandedRows[article.link];
    setExpandedRows((prev) => ({
      ...prev,
      [article.link]: !isExpanded,
    }));

    if (!isExpanded && !rowSummaries[article.link]) {
      setRowLoading((prev) => ({ ...prev, [article.link]: true }));
      try {
        const response = await axios.post(`${BACKEND_URL}/api/summarize`, {
          content: `${article.title}\n${article.summary}`,
          url: article.link,
        });
        setRowSummaries((prev) => ({
          ...prev,
          [article.link]: {
            summary: response.data.summary,
            suggestions: response.data.suggestions,
          },
        }));
      } catch (error) {
        console.error("Error summarizing article:", error);
        setToastProps({
          type: "error",
          message: "Failed to summarize article.",
        });
      } finally {
        setRowLoading((prev) => ({ ...prev, [article.link]: false }));
      }
    }
  };

  // Helper function to get display text for the date
  const getDateDisplayText = () => {
    const today = new Date();
    const targetDate = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - (page - 1)
      )
    );
    const daysDiff = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return "today";
    if (daysDiff === 1) return "yesterday";
    return targetDate.toLocaleDateString();
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const Row = ({ article }) => {
    const open = expandedRows[article.link] || false;
    const summaryData = rowSummaries[article.link] || {};
    const isRowLoading = rowLoading[article.link] || false;

    return (
      <>
        <TableRow className="hover:bg-gray-50 transition-all duration-200">
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => handleRowToggle(article)}
            >
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
          <TableCell>{article.title}</TableCell>
          <TableCell>{article.source}</TableCell>
          <TableCell>{new Date(article.date).toLocaleDateString()}</TableCell>
          <TableCell>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Read More
            </a>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  margin: 2,
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                {isRowLoading ? (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                      Summary
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {summaryData.summary || "No summary available"}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                      Suggestions
                    </h3>
                    <p className="text-sm text-gray-600">
                      {summaryData.suggestions || "No suggestions available"}
                    </p>
                  </>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6">
      <Header title="News" />
      {loading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <FaNewspaper /> News
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Showing news for {getDateDisplayText()}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative w-full max-w-md flex-1">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                <input
                  type="text"
                  id="search"
                  value={tempSearchQuery}
                  onChange={(e) => setTempSearchQuery(e.target.value)}
                  placeholder=" "
                  className="peer w-full pl-12 pr-4 py-4 bg-white/40 backdrop-blur-sm border-2 border-gray-300/40 rounded-2xl text-gray-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/60 transition-all duration-300 hover:bg-white/50 hover:scale-[1.02] hover:shadow-lg hover:border-gray-400/60 active:scale-[0.98]"
                />
                <label
                  htmlFor="search"
                  className="absolute left-12 -top-2.5 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-sm font-medium text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:left-12 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:left-12 peer-focus:bg-white/80 peer-focus:text-blue-600 z-10"
                >
                  Search News (e.g., "china us tariff what happened")
                </label>
              </div>
              <FormControlLabel
                control={
                  <Switch
                    checked={searchMode === "summarized"}
                    onChange={handleSearchModeToggle}
                    color="primary"
                  />
                }
                label={
                  searchMode === "direct"
                    ? "Direct Search"
                    : "Summarized Search"
                }
                sx={{ alignSelf: "center" }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                startIcon={<FaSearch />}
                sx={{ height: "50px", borderRadius: "12px" }}
              >
                Search
              </Button>
            </div>

            <TableContainer
              component={Paper}
              sx={{ boxShadow: "none", border: "1px solid rgba(0, 0, 0, 0.1)" }}
            >
              <Table aria-label="news table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f1f5f9" }}>
                    <TableCell />
                    <TableCell sx={{ fontWeight: "bold", color: "#1f2937" }}>
                      Title
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#1f2937" }}>
                      Source
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#1f2937" }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#1f2937" }}>
                      Link
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : news.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-gray-500"
                      >
                        No news articles found for {getDateDisplayText()}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    news.map((article) => (
                      <Row key={article.link} article={article} />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <div className="flex justify-center mt-6">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                renderItem={(item) => (
                  <PaginationItem
                    components={{
                      previous: () => (
                        <div className="flex items-center">
                          <FaChevronLeft className="mr-1" />
                          Newer
                        </div>
                      ),
                      next: () => (
                        <div className="flex items-center">
                          Older
                          <FaChevronRight className="ml-1" />
                        </div>
                      ),
                    }}
                    {...item}
                  />
                )}
              />
            </div>
          </div>
        </motion.div>
      )}
      <Toast type={toastProps.type} message={toastProps.message} />
    </div>
  );
};

export default News;
