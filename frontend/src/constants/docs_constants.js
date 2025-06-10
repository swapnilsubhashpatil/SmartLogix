import {
  FaShieldAlt,
  FaRoute,
  FaBox,
  FaUser,
  FaNewspaper,
  FaDownload,
  FaEnvelope,
  FaUsers,
  FaInfoCircle,
} from "react-icons/fa";
import ProfileCards from "../pages/documentation/ProfileCards";

export const navigationStructure = {
  overview: {
    title: "Overview",
    id: "dashboard",
    icon: FaInfoCircle,
    sections: [
      {
        id: "about",
        title: "About SmartLogix",
        description:
          "Discover SmartLogix, an AI-powered logistics intelligence platform revolutionizing global supply chain management with advanced compliance, routing, and inventory solutions.",
        linkId: "/dashboard",
        content: `
          # Welcome to SmartLogix ✨
          
          ### Revolutionizing Global Logistics with Intelligent AI-Powered Solutions
          
          SmartLogix is the next-generation logistics intelligence platform that transforms how businesses navigate complex global and domestic shipment challenges. Powered by cutting-edge MERN stack architecture and enhanced with advanced AI technologies including Gemini Pro and Google Cloud Vision, we deliver unprecedented efficiency and intelligence to your entire supply chain ecosystem.
          
          ## Our Mission 🎯
          
          Empowering businesses worldwide with intelligent, scalable logistics solutions that seamlessly ensure regulatory compliance, optimize shipping routes, and promote environmental sustainability through breakthrough AI-driven insights and analytics.
          
          ## Intelligent Core Features
          
          ### 🛡️ Smart Compliance Engine
          Advanced AI validation system that automatically verifies shipments against complex international trade regulations, ensuring 100% compliance accuracy across global markets.
          
          ### 🚀 Dynamic Route Optimization
          Intelligent algorithm that calculates optimal shipping routes by analyzing cost-effectiveness, time efficiency, and environmental impact in real-time.
          
          ### 📊 Intelligent Inventory Management  
          Comprehensive shipment tracking system with seamless workflow integration, providing complete visibility across your entire logistics pipeline.
          
          ### 👤 Advanced Profile Management
          Sophisticated user account system that maintains detailed historical data, compliance records, and route preferences for personalized logistics experiences.
          
          ### 📰 Real-Time News Intelligence
          Curated logistics news feed that keeps you informed about critical global events, trade developments, and industry insights affecting your operations.
          
          ### 📋 Professional Resources Hub
          Comprehensive library of essential shipping document templates, compliance guides, and industry-standard forms for streamlined operations.
          
          ## Why Choose SmartLogix? 🌟
          
          ### 🔄 99.99% Uptime Guarantee
          Enterprise-grade cloud infrastructure ensures your logistics operations never stop, with redundant systems and 24/7 monitoring.
          
          ### ⚡ Lightning-Fast Insights
          Instantaneous compliance verification and route optimization powered by advanced AI algorithms and real-time data processing.
          
          ### 🌍 Global Compliance Mastery
          Comprehensive support for international trade regulations across 200+ countries with automatic updates for changing compliance requirements.
          
          ### 🌱 Sustainability Leadership
          Carbon-intelligent routing algorithms that significantly reduce environmental impact while maintaining operational efficiency and cost-effectiveness.
          
          ### 🔒 Enterprise Security
          Bank-level security protocols with end-to-end encryption, ensuring your sensitive logistics data remains protected at all times.
          
          ## Quick Start Guide 🚀
          
          ### Step 1: Instant Registration
          Sign up effortlessly using Google authentication or create a custom account with our streamlined registration process.
          
          ### Step 2: Profile Optimization
          Complete your comprehensive profile setup to unlock the full potential of our intelligent features and personalized recommendations.
          
          ### Step 3: Explore & Optimize
          Dive into our powerful dashboard and start leveraging features like AI compliance checking and intelligent route optimization immediately.
          
          ### Experience the future of logistics intelligence with SmartLogix – where artificial intelligence meets supply chain excellence.
          `,
        examples: [
          "Validate 1,000+ shipments in minutes with AI compliance checks.",
          "Reduce shipping costs by up to 30% with optimized routes.",
          "Track inventory status of shipment from anywhere.",
        ],
      },
    ],
  },
  profile: {
    title: "Profile",
    id: "profile",
    icon: FaUser,
    sections: [
      {
        id: "profile",
        title: "Profile Overview",
        description:
          "Manage your SmartLogix account and access your personalized dashboard.",
        linkId: "/profile/:userId",
        content: `
### About Profile

The Profile section is your central hub for managing your SmartLogix account. It provides access to your saved data, account settings, and historical records.

## Features

- **Dashboard Access**: View your compliance, routing, and inventory activities.
- **Data Security**: Protected sessions with bcrypt hashing for manual logins.
- **Multi-Device Support**: Access your profile from any device with secure login.

## Getting Started

1. Log in via Google OAuth or manual credentials.
2. Navigate to the Profile section from the sidebar.
3. Explore your saved history and account settings.
        `,
        examples: [
          "View all your saved compliance reports in one place.",
          "Update your account details securely.",
          "Access your profile from mobile or desktop devices.",
        ],
      },
      {
        id: "manage-account",
        title: "Manage Account",
        description: "Update your personal information and account settings.",
        linkId: "/manage-account/:userId",
        content: `
### Smart Account

Customize your SmartLogix account by updating personal details, passwords, and other details. Options such as company name, email, and contact information are available. Please note that if you have signed up using Google, you can only update your email and password.

## Features

- **Update Information**: Change your name, email, and contact details.
- **Password Management**: Securely update your password with bcrypt encryption.
- **Delete Account**: Permanently remove your account and associated data.

## Steps to Update

1. Navigate to Profile > Manage Account.
2. Edit your details in the provided form.
3. Save changes to update your account.

## Steps to Delete

1. Navigate to Profile > Manage Account.
2. Scroll to the bottom of the page.
3. Click the "Delete Account" button.
4. Enter your email to confirm account deletion.
        `,
        examples: [
          "Update your email to receive compliance notifications.",
          "Change your password for enhanced security.",
          "Set preferences for metric or imperial units.",
        ],
      },
      {
        id: "history",
        title: "History",
        description:
          "Access your past compliance reports, product analyses, and saved shipment records.",
        linkId: "/history/:userId",
        content: `
### Record History

History provides a record of your past activities, including compliance reports, saved routes, and product analyses. Providing a detailed overview of your past activities with SmartLogix's features.

## Features

- **Compliance History**: View all past compliance check reports.
- **Route History**: Access saved optimized routes.
- **Analysis History**: Review previous product analyses.

## How to Access

1. Go to Profile > History.
2. Select the desired tab (Compliance, Routes, Analysis).
3. Click on any record to view details or delete it.
        `,
        examples: [
          "Review a compliance report from last month.",
          "Revisit a saved route for a recurring shipment.",
          "Check past product analysis for HS Code accuracy.",
        ],
      },
      {
        id: "analysis",
        title: "Analysis",
        description:
          "Review AI-driven insights from your product and compliance analyses.",
        linkId: "/analysis/:userId",
        content: `
### Analysis

The Analysis section provides detailed insights from AI-driven product and compliance analyses, helping you make informed decisions.

## Features

- **Product Insights**: AI-generated HS Codes, document requirements, and safety info.
- **Compliance Insights**: Risk scores, violations, and recommendations.
- **Exportable Reports**: Download analysis reports for records.

## Accessing Analysis

1. Navigate to Profile > Analysis.
2. View summaries of past analyses.
3. Export reports in PDF format.
        `,
        examples: [
          "Export a product analysis report for customs.",
          "Review AI-suggested HS Codes for accuracy.",
          "Check compliance risk scores for past shipments.",
        ],
      },
    ],
  },
  compliance: {
    title: "Compliance Check",
    id: "compliance",
    icon: FaShieldAlt,
    sections: [
      {
        id: "overview",
        title: "Compliance Option Overview",
        description:
          "Understand how SmartLogix ensures your shipments meet global trade regulations.",
        linkId: "/compliance",
        content: `
          ### How Does It Work?
          
          Experience next-generation compliance management with SmartLogix's AI-powered Compliance Check system. Leveraging advanced Gemini Pro AI technology, our platform automatically validates shipments against complex international trade regulations while offering flexible input methods and comprehensive automation capabilities.
          
          ## Core Intelligence Features
          
          - **🤖 Advanced AI Validation**: Sophisticated algorithms analyze your shipment data against global regulatory frameworks, ensuring 99.9% compliance accuracy with real-time validation
          - **📊 Flexible Input Methods**: Seamlessly process data through multiple channels including intuitive manual forms, bulk CSV uploads, and cutting-edge product image recognition technology  
          - **📋 Intelligent Reporting**: Generate comprehensive compliance reports featuring detailed status indicators, risk assessment scores, regulatory recommendations, and actionable insights
          
          ## Essential Data Requirements
          
          ### 🌍 Geographic Information
          - **Origin/Destination Countries**: ISO 3166-1 alpha-2 standard codes (US, CA, GB, etc.)
          
          ### 🏷️ Product Classification  
          - **HS Code**: Precise 6-10 digit harmonized system codes following WCO international standards
          - **Product Description**: Detailed specifications that accurately align with designated HS classifications
          
          ### 📦 Shipment Details
          - **Quantity & Weight**: Verified positive values with proper unit specifications
          - **Documentation**: Complete commercial invoices and packing lists with validation stamps
          
          ## Smart Sustainability Integration
          
          ### 🌱 Eco-Intelligence Recommendations
          Our AI analyzes your shipment patterns to deliver personalized sustainability insights including:
          
          - **Green Packaging Solutions**: Biodegradable and recyclable material recommendations
          - **Load Optimization Strategies**: Smart consolidation techniques to reduce carbon footprint
          - **Environmental Impact Analytics**: Real-time carbon footprint calculations and offset suggestions
          - **Sustainable Route Planning**: Eco-friendly shipping corridor recommendations
          
          Transform your compliance process into a competitive advantage with intelligent automation and environmental responsibility.
          `,
        examples: [
          "Validate a shipment to Canada for compliance.",
          "Generate a compliance report for a bulk order.",
          "Check import restrictions for a specific HS Code.",
        ],
      },
      {
        id: "csv-upload",
        title: "CSV Upload",
        description: "Bulk validate shipments by uploading CSV files.",
        linkId: "/csv-upload",
        content: `
# Understanding CSV Upload

The CSV Upload functionality in SmartLogix enables efficient validation of multiple shipments simultaneously by seamlessly importing data in CSV format, significantly reducing manual tasks and streamlining lengthy processes while ensuring robust compliance checks and enhanced operational accuracy.

## How It Works

1. Download the CSV template from the Compliance Check page.
2. Fill in shipment details (Origin Country, HS Code, etc.).
3. Upload the CSV file via drag-and-drop or file selection.
4. Receive a compliance report for all entries.

## CSV Format

- **Columns**: OriginCountry, DestinationCountry, HSCode, ProductDescription, Quantity, GrossWeight, etc.
- **Format**: Follow the template to avoid errors.
- **Validation**: Each row is checked against trade regulations.
        `,
        examples: [
          "Upload a CSV with 500 shipment records.",
          "Validate bulk shipments for EU compliance.",
          "Download a template for correct CSV formatting.",
        ],
      },
      {
        id: "product-analysis",
        title: "Product Analysis",
        description:
          "Use AI to analyze product images and generate compliance data.",
        linkId: "/product-analysis",
        content: `
# Why it is used

Leverage Google Cloud Vision and Gemini Pro AI to analyze product images and generate compliance-related insights. SmartLogix analyzes product images to extract critical details, accurately identifies products, and generates actionable compliance-related insights. Additionally, it provides tailored document suggestions for regulatory adherence, which can be seamlessly sent to the Compliance Tab for streamlined processing and review.

## Features

- **HS Code Suggestions**: AI identifies appropriate HS Codes.
- **Document Requirements**: Lists necessary export documents.
- **Safety Information**: Flags hazardous or perishable items.
- **Send to Compliance**: Autofills compliance forms with analysis data.

## Steps to Use

1. Go to Compliance Check > Product Analysis.
2. Upload a product image.
3. Review AI-generated insights.
4. Click "Send to Compliance" to autofill the form.
        `,
        examples: [
          "Analyze an image of a mattress to get HS Code 9404.29.00.",
          "Identify required documents for a hazardous chemical.",
          "Autofill compliance form with product analysis data.",
        ],
      },
      {
        id: "manual-form",
        title: "Manual Form",
        description:
          "Enter shipment details manually for compliance validation.",
        content: `
# Form Overview

The Manual Form feature in SmartLogix enables users to input shipment details individually for accurate compliance checks. This user-friendly interface supports precise data entry for fields like Origin Country and HS Code, ensuring regulatory adherence and seamless integration with AI-driven logistics insights.

## Features

- **Tabbed Interface**: Organized fields for Shipment Details, Documents, and Regulatory Details.
- **Real-Time Validation**: Instant feedback on field accuracy.
- **Guided Input**: Tooltips and error messages for compliance.

## Steps to Use

1. Navigate to Compliance Check > Manual Form.
2. Fill in mandatory fields (Origin Country, HS Code, etc.).
3. Submit for AI validation.
4. Review the compliance report.
        `,
        examples: [
          "Enter details for a single shipment to Japan.",
          "Validate Incoterms like FOB for accuracy.",
          "Check compliance for a perishable product.",
        ],
      },
    ],
  },
  route: {
    title: "Route Optimization",
    id: "route-optimization",
    icon: FaRoute,
    sections: [
      {
        id: "route-optimization",
        title: "Route Optimization Overview",
        description:
          "View detailed route options with cost, time, and carbon metrics.",
        linkId: "/route-optimization",
        content: `
          ### Route Optimization Feature
          
          Transform your logistics decision-making with our intelligent Route Optimization system that delivers personalized shipping solutions through an intuitive, interactive interface.
          
          ## Key Features
          
          - **Smart Route Analytics**: Comprehensive insights including strategic checkpoints, multi-modal transport options, precise distance calculations, real-time cost estimates, accurate transit predictions, and detailed carbon footprint analysis
          - **Interactive Route Cards**: Seamlessly explore route options with dynamic card selection that reveals comprehensive route intelligence and detailed logistics breakdowns
          - **Intelligent Save System**: Bookmark and organize your preferred routes with our advanced save functionality for quick access and future reference
          
          ## Optimization Categories
          
          ### 🌟 Popular Routes
          Discover the three most trusted and frequently utilized shipping corridors, backed by proven performance metrics and user preferences.
          
          ### 💰 Cost Optimized
          Access the most economical shipping solutions designed to maximize your budget efficiency while maintaining service quality.
          
          ### ⚡ Time Optimized  
          Leverage the fastest available routes engineered for speed-critical shipments and time-sensitive logistics operations.
          
          ### 🌱 Carbon Efficient
          Choose environmentally responsible routes that minimize your carbon footprint while supporting sustainable logistics practices.
          `,
        examples: [
          "Evaluate cost-effective routes for a shipment.",
          "Store an eco-friendly route for recurring use.",
          "Check waypoints for a cross-continental shipment.",
        ],
      },
      {
        id: "route-card",
        title: "Route Card Page",
        description:
          "View detailed route options with cost, time, and carbon metrics.",
        content: `
### Route Card 

The Route Card Page displays optimized shipping routes in a card format, providing key metrics for decision-making. It provides complete details for each route, including checkpoints, transport modes, total distance, estimated cost, transit time, and carbon footprint.

## Features

- **Route Details**: Checkpoints, transport modes, distance, cost, time, and carbon score.
- **Interactive Cards**: Click to view detailed route information.
- **Save Option**: Store routes for future reference.

## Route Card Action Buttons

- **Map View**: Visualize routes on a map.
- **Carbon Emission Analysis**: Analyze carbon emissions.
- **Save Route**: Store for later use.
- **Select Route**: Choose for shipment optimization.
        `,
        examples: [
          "Compare cost-optimized routes for a shipment.",
          "Save a carbon-efficient route for a client.",
          "View checkpoints for a transatlantic shipment.",
        ],
      },
      {
        id: "map-view",
        title: "Map View",
        description: "Visualize optimized routes on an interactive map.",
        content: `
### What is Map View

The Map View feature uses Google Maps API to display multi-modal routes on an interactive map. It provides a visual representation of the route, including checkpoints, transport modes, and distance.

## Features

- **Interactive Map**: Zoom and pan to explore routes.
- **Color-Coded Paths**: Different colors for each transport mode.
- **Route Details**: Hover to see checkpoints and distances.

## How to Use

1. Go to Route Optimization > Map View.
2. Select a route from the Route Card Page.
3. Explore the route on the interactive map.
        `,
        examples: [
          "Visualize a route from New York to London.",
          "Check transport modes for a multi-leg shipment.",
          "Explore carbon-efficient paths on the map.",
        ],
      },
      {
        id: "carbon-analysis",
        title: "Detailed Carbon Analysis",
        description:
          "Analyze the environmental impact of your shipping routes.",
        content: `
### Detailed Carbon Analysis

The Detailed Carbon Analysis provides insights about carbon emission breakdown based on industrial standards. It provides a detailed analysis of the carbon footprint of each route type or mode. Also providing environmental impact overview.

## Features

- **Emission Breakdown**: Emissions by transport mode and distance.
- **Carbon Score**: Rates routes based on environmental impact.
- **Eco-Friendly Suggestions**: Recommends greener alternatives.

## How to Use

1. Navigate to Route Optimization > Carbon Analysis.
2. Select a route to view its carbon footprint.
3. Apply suggestions to reduce emissions.
        `,
        examples: [
          "Reduce emissions by 20% with suggested routes.",
          "Compare carbon scores for air vs. sea transport.",
          "Export a carbon analysis report for stakeholders.",
        ],
      },
    ],
  },
  inventory: {
    title: "Inventory",
    id: "inventory-management",
    icon: FaBox,
    sections: [
      {
        id: "inventory-management",
        title: "Inventory Tabs",
        description: "Manage shipments through various status tabs.",
        linkId: "/inventory-management",
        content: `
### Tabs Overview

The Inventory section organizes shipments into tabs based on their status, streamlining management. It provides complete details for each shipment, including draft entries, compliant shipments, noncompliant shipments, and ready for shipment, making management easier.

## Available Tabs

- **Yet to be Checked**: New shipments added as drafts.
- **Compliant**: Shipments that passed compliance checks.
- **Noncompliant**: Shipments requiring corrections.
- **Ready for Shipment**: Shipments with optimized routes.

## How to Use

1. Go to Inventory.
2. Select a tab to view shipments.
3. Take actions like sending to compliance or exporting reports.
        `,
        examples: [
          "View all noncompliant shipments in one tab.",
          "Send compliant shipments to route optimization.",
          "Check draft shipments before submission.",
        ],
      },
      {
        id: "add-draft",
        title: "Add Draft",
        description: "Create new shipment drafts for compliance checks.",
        content: `
### Draft Feature 

The Add Draft feature allows you to create new shipment entries for later validation.

## Features

- **Quick Entry**: Input basic shipment details.
- **Save as Draft**: Store incomplete entries for later.
- **Send to Compliance**: Submit drafts for validation.

## Steps to Use

1. Navigate to Inventory > Add Draft.
2. Enter shipment details (e.g., Origin, Destination).
3. Save as draft or send to compliance.
        `,
        examples: [
          "Create a draft for a shipment to Asia.",
          "Save partial shipment details for later.",
          "Send a draft to compliance check directly.",
        ],
      },
      {
        id: "export-report",
        title: "Export Report",
        description: "Generate and download reports for ready shipments.",
        content: `
### Export Report

The Export Report feature allows you to download detailed reports for shipments ready for transport, providing all responses from compliance checks and route optimization along with carbon emissions breakdown for further documentation requirements.

## Features

- **PDF Reports**: Comprehensive shipment details.
- **Customizable**: Select fields to include in the report.
- **Secure Sharing**: Share reports with stakeholders.

## Steps to Use

1. Go to Inventory > Ready for Shipment.
2. Select a shipment.
3. Click "Export Report" to download as PDF.
        `,
        examples: [
          "Download a report for a compliant shipment.",
          "Share a PDF report with customs authorities.",
          "Customize a report to include carbon scores.",
        ],
      },
    ],
  },
  news: {
    title: "News Page",
    id: "news",
    icon: FaNewspaper,
    sections: [
      {
        id: "news",
        title: "News Search",
        description:
          "Stay updated with logistics-related news and global events.",
        linkId: "/news",
        content: `
### About the News Page

The News Page keeps you informed about logistics-related events, including wars, pandemics, and disasters that may impact shipping, helping you make informed decisions for your shipments and routes. Suggestions are also provided to logistics providers regarding any current news events or weather conditions.

## Features

- **Search Bar**: Find news by keywords or topics.
- **Summarized Search**: Filtered articles on critical events.
- **Real-Time Updates**: Latest news from reliable sources.
- **Curated Recommendations**: Suggestions for shipping providers related to current events.

## How to Use

1. Navigate to the News Page.
2. Enter keywords (e.g., "port strike") in the search bar.
3. Browse articles and save relevant ones.
        `,
        examples: [
          "Search for news on Red Sea shipping disruptions.",
          "Save an article about new EU trade regulations.",
          "View curated news on global pandemics.",
        ],
      },
    ],
  },
  resources: {
    title: "Resources",
    icon: FaDownload,
    sections: [
      {
        id: "sample-document",
        title: "Sample Document",
        description: "Download empty document templates for shipping.",
        content: `
### About Sample Document

Download empty templates for essential shipping documents to streamline your logistics process.

## Available Templates

- **Commercial Invoice**: Template for detailing shipment value and items.
- **Packing List**: Template for listing shipment contents.
- **Certificate of Origin**: Template for certifying product origin.
- **Bill of Lading**: Template for transport contract.

## How to Use

1. Go to Resources > Sample Document.
2. Click on a template to download.
3. Fill in the template with your shipment details.
        `,
        downloads: [
          {
            name: "Commercial Invoice Template",
            url: "/docs/feature01.pdf",
            filename: "commercial-invoice-template.pdf",
          },
          {
            name: "Packing List Template",
            url: "/docs/sample-packing-list-empty.pdf",
            filename: "packing-list-template.pdf",
          },
          {
            name: "Certificate of Origin Template",
            url: "/docs/sample-certificate-of-origin-empty.pdf",
            filename: "certificate-of-origin-template.pdf",
          },
          {
            name: "Bill of Lading Template",
            url: "/docs/sample-bill-of-lading-empty.pdf",
            filename: "bill-of-lading-template.pdf",
          },
        ],
        examples: [
          "Download a Commercial Invoice template.",
          "Use a Packing List template for a shipment.",
          "Fill a Bill of Lading for sea transport.",
        ],
      },
      {
        id: "filled-document",
        title: "Filled Document",
        description: "Download sample filled documents for reference.",
        content: `
### About Filled Document

View and download filled samples of shipping documents to understand their structure and content.

## Available Samples

- **Commercial Invoice**: Sample with completed fields.
- **Packing List**: Sample detailing shipment contents.
- **Certificate of Origin**: Sample with origin details.
- **Bill of Lading**: Sample transport contract.

## How to Use

1. Go to Resources > Filled Document.
2. Click on a sample to download.
3. Use as a reference for filling your own documents.
        `,
        downloads: [
          {
            name: "Filled Commercial Invoice",
            url: "/docs/sample-commercial-invoice-filled.pdf",
            filename: "filled-commercial-invoice-sample.pdf",
          },
          {
            name: "Filled Packing List",
            url: "/docs/sample-packing-list-filled.pdf",
            filename: "filled-packing-list-sample.pdf",
          },
          {
            name: "Filled Certificate of Origin",
            url: "/docs/sample-certificate-of-origin-filled.pdf",
            filename: "filled-certificate-of-origin-sample.pdf",
          },
          {
            name: "Filled Bill of Lading",
            url: "/docs/sample-bill-of-lading-filled.pdf",
            filename: "filled-bill-of-lading-sample.pdf",
          },
        ],
        examples: [
          "Reference a filled Commercial Invoice for accuracy.",
          "Study a sample Packing List for formatting.",
          "Use a filled Bill of Lading as a guide.",
        ],
      },
    ],
  },
  support: {
    title: "Support",
    icon: FaEnvelope,
    sections: [
      {
        id: "contact-email",
        title: "Contact Email",
        description: "Reach out to our support team for assistance.",
        content: `### official.smartlogix@gmail.com`,
        examples: [
          "Email support for a compliance check issue.",
          "Contact sales for enterprise plan details.",
          "Use live chat for real-time assistance.",
        ],
      },
    ],
  },
  contributors: {
    title: "Contributors",
    icon: FaUsers,
    sections: [
      {
        id: "contributors",
        title: "Our Contributors",
        description:
          "The talented individuals who make SmartLogix's vision a reality",
        component: ProfileCards,
      },
    ],
  },
};

export const getSectionById = (categoryId, sectionId) => {
  const category = navigationStructure[categoryId];
  if (!category) return null;

  return category.sections.find((section) => section.id === sectionId);
};

export const getAllSections = () => {
  const allSections = [];
  Object.entries(navigationStructure).forEach(([categoryKey, category]) => {
    category.sections.forEach((item) => {
      allSections.push({
        ...item,
        category: categoryKey,
        categoryTitle: category.title,
      });
    });
  });
  return allSections;
};
