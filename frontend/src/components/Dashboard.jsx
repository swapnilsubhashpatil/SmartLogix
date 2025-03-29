import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaUserCircle,
  FaRoute,
  FaCheckCircle,
  FaDollarSign,
  FaClock,
  FaLeaf,
  FaBars,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { useInView } from "react-intersection-observer";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Theme Configuration
const theme = {
  primary: "#FFFFFF",
  secondary: "#3B82F6",
  tertiary: "#10B981",
  accent: "#F59E0B",
  text: "#1F2937",
  cardBg: "#F9FAFB",
};

// Styled Components
const StyledApp = styled.div`
  background: ${theme.primary};
  color: ${theme.text};
  font-family: "Inter", sans-serif;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
`;

const GlassNav = styled.nav`
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.8),
    rgba(255, 255, 255, 0.6)
  );
  backdrop-filter: blur(20px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
  padding: 1rem 2rem;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 20px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")
      no-repeat bottom;
    background-size: cover;
  }
`;

const GradientButton = styled(motion.button)`
  background: linear-gradient(135deg, ${theme.secondary}, ${theme.tertiary});
  border: none;
  border-radius: 50px;
  padding: 1rem 2rem;
  color: ${theme.primary};
  font-weight: 600;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const Card = styled(motion.div)`
  background: ${theme.cardBg};
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const AboutSection = styled.section`
  position: relative;
  padding: 6rem 2rem;
  background: ${theme.primary};
  overflow: hidden;
  z-index: 10;
`;

const DynamicPattern = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-conic-gradient(
    ${theme.secondary}20 0deg 10deg,
    transparent 10deg 20deg
  );
  opacity: 0.3;
  z-index: 0;
`;

const AboutContent = styled(motion.div)`
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(255, 255, 255, 0.85)
  );
  backdrop-filter: blur(15px);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  text-align: center;
  z-index: 1;
`;

function MovexDashboard() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [user, setUser] = useState({ firstName: "", lastName: "", email: "" });
  const [solvesInView, solvesVisible] = useInView({ threshold: 0.2 });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      try {
        const response = await axios.get(`${BACKEND_URL}/protectedRoute`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser({
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          email: response.data.user.emailAddress,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/");
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <StyledApp>
      <GlassNav>
        <motion.h1
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold"
          style={{ color: theme.secondary }}
        >
          Smartlogix
        </motion.h1>
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="md:hidden"
        >
          <FaBars size={24} style={{ color: theme.text }} />
        </button>
        <div className="hidden md:flex space-x-6 items-center">
          {["About"].map((tab) => (
            <motion.a
              key={tab}
              href={`#${tab.toLowerCase()}`}
              whileHover={{ scale: 1.1, color: theme.tertiary }}
              className="text-lg"
              style={{ color: theme.text }}
            >
              {tab}
            </motion.a>
          ))}
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2"
            style={{ color: theme.tertiary }}
          >
            <FaUserCircle size={20} />
            <span>Profile</span>
          </button>
        </div>
      </GlassNav>

      {showSidebar && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          className="fixed top-0 left-0 h-full w-64 bg-cardBg z-50 p-6 md:hidden"
        >
          <button onClick={() => setShowSidebar(false)} className="mb-6">
            <IoMdClose size={24} style={{ color: theme.text }} />
          </button>
          {["About"].map((tab) => (
            <motion.a
              key={tab}
              href={`#${tab.toLowerCase()}`}
              whileHover={{ scale: 1.1, color: theme.tertiary }}
              className="block text-lg mb-4"
              style={{ color: theme.text }}
              onClick={() => setShowSidebar(false)}
            >
              {tab}
            </motion.a>
          ))}
        </motion.div>
      )}

      <section className="relative h-screen flex items-center justify-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="text-center"
        >
          <motion.h1
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 120 }}
            className="text-6xl md:text-8xl font-extrabold"
            style={{
              color: theme.secondary,
              textShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            Smartlogix
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-xl md:text-2xl max-w-xl mx-auto mt-4"
            style={{ color: theme.text }}
          >
            Innovating Logistics for the Future
          </motion.p>
          <div className="mt-12 flex justify-center gap-8">
            <GradientButton
              whileHover={{ scale: 1.15, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/compliance-check")}
            >
              <FaCheckCircle className="inline mr-2" /> Compliance Check
            </GradientButton>
            <GradientButton
              whileHover={{ scale: 1.15, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/route-optimization")}
            >
              <FaRoute className="inline mr-2" /> Route Optimization
            </GradientButton>
          </div>
        </motion.div>
      </section>

      <AboutSection id="about">
        <DynamicPattern
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 0.3, rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <AboutContent
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2
            className="text-4xl font-bold mb-4"
            style={{
              color: theme.secondary,
              background: `linear-gradient(90deg, ${theme.secondary}, ${theme.tertiary})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            About Smartlogix
          </h2>
          <p
            style={{ color: theme.text, fontSize: "1.1rem", lineHeight: "1.8" }}
          >
            Smartlogix is a cutting-edge logistics platform designed to
            streamline operations, reduce costs, and promote sustainability. By
            leveraging advanced technology, we empower businesses to navigate
            modern supply chain complexities with ease and precision.
          </p>
        </AboutContent>
      </AboutSection>

      <section
        ref={solvesInView}
        className="py-20 px-6 relative z-10"
        id="solves"
      >
        <motion.h2
          initial={{ opacity: 0 }}
          animate={solvesVisible ? { opacity: 1 } : {}}
          className="text-4xl md:text-5xl font-bold text-center mb-12"
          style={{ color: theme.text }}
        >
          Problems We Solve
        </motion.h2>
        <div className="max-w-5xl mx-auto space-y-12">
          {[
            {
              problem: "Inefficient Route Selection",
              solution: "Route Optimization",
              icon: <FaRoute />,
            },
            {
              problem: "Compliance Complexities",
              solution: "Compliance Check",
              icon: <FaCheckCircle />,
            },
            {
              problem: "High Operational Costs",
              solution: "Cost Optimization",
              icon: <FaDollarSign />,
            },
            {
              problem: "Transit Delays",
              solution: "Transit Time Optimization",
              icon: <FaClock />,
            },
            {
              problem: "Environmental Impact",
              solution: "Carbon Emission Checker",
              icon: <FaLeaf />,
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={solvesVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-cardBg rounded-lg shadow-md"
            >
              <div className="flex-1 text-center md:text-left">
                <h3
                  className="text-2xl font-semibold"
                  style={{ color: theme.accent }}
                >
                  {item.problem}
                </h3>
              </div>
              <motion.div
                className="w-16 h-16 rounded-full bg-tertiary flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
              >
                {item.icon}
              </motion.div>
              <div className="flex-1 text-center md:text-right">
                <h3
                  className="text-2xl font-semibold"
                  style={{ color: theme.secondary }}
                >
                  {item.solution}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer
        className="py-6 px-6 text-center relative z-10"
        style={{ background: theme.cardBg }}
      >
        <p style={{ color: theme.text }}>
          © {new Date().getFullYear()} Smartlogix. All rights reserved.
        </p>
      </footer>
    </StyledApp>
  );
}

export default MovexDashboard;
