import React, { useState } from "react";
import { Tooltip } from "@mui/material";
import { InfoOutlined, Home } from "@mui/icons-material";
import axios from "axios";
import ComplianceResponse from "./ComplianceResponse";
import { useNavigate } from "react-router-dom";
import CsvUpload from "./CsvUpload";
import ComplianceResponseSkeleton from "./Skeleton/ComplianceResponseSkeleton";

<link
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&display=swap"
  rel="stylesheet"
/>;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ComplianceForm = () => {
  const navigate = useNavigate();

  const toHome = () => {
    navigate("/dashboard");
  };

  const storedData =
    JSON.parse(localStorage.getItem("productAnalysisData")) || {};

  const initialFormData = {
    ShipmentDetails: {
      "Origin Country": "",
      "Destination Country": "",
      "HS Code": storedData["HS Code"] || "",
      "Product Description": storedData["Product Description"] || "",
      Quantity: "",
      "Gross Weight": "",
    },
    TradeAndRegulatoryDetails: {
      "Incoterms 2020": "",
      "Declared Value": { currency: "", amount: "" },
      "Currency of Transaction": "",
      "Trade Agreement Claimed": "",
      "Dual-Use Goods": "No",
      "Hazardous Material": storedData.Hazardous ? "Yes" : "No",
      Perishable: storedData.Perishable ? "Yes" : "No",
    },
    PartiesAndIdentifiers: {
      "Shipper/Exporter": "",
      "Consignee/Importer": "",
      "Manufacturer Information": "",
      "EORI/Tax ID": "",
    },
    LogisticsAndHandling: {
      "Means of Transport": "",
      "Port of Loading": "",
      "Port of Discharge": "",
      "Special Handling": "",
      "Temperature Requirements": "",
    },
    DocumentVerification: {
      "Commercial Invoice": {
        checked: true,
        subItems: {
          "Invoice number present": false,
          "Details match shipment": false,
          "Customs compliant": false,
        },
      },
      "Packing List": {
        checked: true,
        subItems: {
          "Contents accurate": false,
          "Quantities match": false,
          "Matches invoice": false,
        },
      },
      "Certificate of Origin": {
        checked: false,
        subItems: {
          "Origin verified": false,
          "Trade agreement compliant": false,
        },
      },
      "Licenses/Permits": {
        checked: false,
        subItems: {
          "Valid number": false,
          "Not expired": false,
          "Authority verified": false,
        },
      },
      "Bill of Lading": {
        checked: false,
        subItems: {
          "Accurate details": false,
          "Shipping regulations compliant": false,
        },
      },
    },
    IntendedUseDetails: {
      "Intended Use": "",
    },
  };

  const [formData, setFormData] = useState(initialFormData);

  const [activeTab, setActiveTab] = useState("ShipmentDetails");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const tabOrder = [
    "ShipmentDetails",
    "TradeAndRegulatoryDetails",
    "PartiesAndIdentifiers",
    "LogisticsAndHandling",
    "DocumentVerification",
    "IntendedUseDetails",
  ];

  const formStructure = {
    ShipmentDetails: [
      {
        field: "Origin Country",
        type: "Categorical",
        why_checked:
          "Determines export/import regulations, trade agreements, and restrictions.",
        option_type: "Dropdown (ISO 3166-1 alpha-2)",
        mandatory: true,
      },
      {
        field: "Destination Country",
        type: "Categorical",
        why_checked:
          "Identifies import regulations, duties, prohibited goods, and required documentation.",
        option_type: "Dropdown (ISO 3166-1 alpha-2)",
        mandatory: true,
      },
      {
        field: "HS Code",
        type: "Numeric",
        why_checked:
          "Essential for tariff classification, import duties, trade statistics, and product regulations.",
        option_type: "Number input",
        mandatory: true,
        placeholder: "e.g., 12345678",
      },
      {
        field: "Product Description",
        type: "Text",
        why_checked:
          "Verifies HS Code, identifies restricted items, assesses safety, and determines handling/documentation needs.",
        option_type: "Text area",
        mandatory: true,
        placeholder: "e.g., Woven cotton fabric, Electronic components",
      },
      {
        field: "Quantity",
        type: "Numeric",
        why_checked:
          "Needed for customs valuation, duty calculation, inventory control, and document verification.",
        option_type: "Number input",
        mandatory: true,
        placeholder: "e.g., 100, 2500",
      },
      {
        field: "Gross Weight",
        type: "Numeric",
        why_checked:
          "Used for shipping costs, transportation requirements, and compliance with weight restrictions.",
        option_type: "Number input",
        mandatory: true,
        placeholder: "e.g., 50.5 (kg), 110 (lbs)",
      },
    ],
    TradeAndRegulatoryDetails: [
      {
        field: "Incoterms 2020",
        type: "Categorical",
        why_checked:
          "Defines responsibilities for costs, risks, and documentation in international trade.",
        option_type: "Dropdown",
        mandatory: true,
      },
      {
        field: "Declared Value",
        type: "Alphanumeric & Numeric",
        why_checked:
          "Used for calculating import duties/taxes, insurance, and customs valuation.",
        option_type: "Text input (Currency) & Number input (Amount)",
        mandatory: true,
        placeholder: "e.g., USD 1000.00",
      },
      {
        field: "Currency of Transaction",
        type: "Categorical",
        why_checked:
          "Relevant for financial compliance, currency exchange, and customs valuation.",
        option_type: "Dropdown",
        mandatory: true,
      },
      {
        field: "Trade Agreement Claimed",
        type: "Text",
        why_checked:
          "Determines eligibility for preferential duty treatment; requires specific documentation.",
        option_type: "Text input",
        mandatory: false,
        placeholder: "e.g., NAFTA, USMCA",
      },
      {
        field: "Dual-Use Goods",
        type: "Boolean",
        why_checked:
          "Subject to export controls and licensing due to potential military applications.",
        option_type: "Dropdown (Yes/No)",
        mandatory: false,
      },
      {
        field: "Hazardous Material",
        type: "Boolean",
        why_checked:
          "Subject to regulations for packaging, labeling, transportation, and documentation to ensure safety.",
        option_type: "Dropdown (Yes/No)",
        mandatory: false,
      },
      {
        field: "Perishable",
        type: "Boolean",
        why_checked:
          "Determines if special handling and temperature control are required.",
        option_type: "Dropdown (Yes/No)",
        mandatory: true,
      },
    ],
    PartiesAndIdentifiers: [
      {
        field: "Shipper/Exporter",
        type: "Text",
        why_checked:
          "Relevant for export regulations, documentation, and communication.",
        option_type: "Text input",
        mandatory: false,
        placeholder: "e.g., ABC Company Inc.",
      },
      {
        field: "Consignee/Importer",
        type: "Text",
        why_checked:
          "Relevant for import regulations, delivery arrangements, and communication.",
        option_type: "Text input",
        mandatory: false,
        placeholder: "e.g., XYZ Corporation",
      },
      {
        field: "Manufacturer Information",
        type: "Text",
        why_checked:
          "May be required for certificates of origin, product safety, and compliance.",
        option_type: "Text input",
        mandatory: false,
        placeholder: "e.g., Acme Manufacturing",
      },
      {
        field: "EORI/Tax ID",
        type: "Alphanumeric",
        why_checked:
          "Used for customs identification and tracking of economic operators.",
        option_type: "Text input",
        mandatory: false,
        placeholder: "e.g., EU1234567, 12-3456789",
      },
    ],
    LogisticsAndHandling: [
      {
        field: "Means of Transport",
        type: "Categorical",
        why_checked:
          "Affects regulations, documentation, and handling requirements.",
        option_type: "Dropdown",
        mandatory: true,
      },
      {
        field: "Port of Loading",
        type: "Text",
        why_checked:
          "Relevant for customs procedures, port regulations, and logistics.",
        option_type: "Text input",
        mandatory: false,
        placeholder: "e.g., Shanghai, Rotterdam",
      },
      {
        field: "Port of Discharge",
        type: "Text",
        why_checked:
          "Relevant for customs procedures, port regulations, and logistics.",
        option_type: "Text input",
        mandatory: false,
        placeholder: "e.g., Long Beach, Hamburg",
      },
      {
        field: "Special Handling",
        type: "Text",
        why_checked:
          "Ensures proper care during transport/storage, especially for fragile/sensitive items.",
        option_type: "Text area",
        mandatory: false,
        placeholder: "e.g., Fragile, Keep Dry",
      },
      {
        field: "Temperature Requirements",
        type: "Text",
        why_checked:
          "Critical for perishable/sensitive goods to maintain quality and safety.",
        option_type: "Text input",
        mandatory: false,
        placeholder: "e.g., 2-8°C, -10°F",
      },
    ],
    DocumentVerification: [
      {
        field: "Commercial Invoice",
        type: "Checkbox",
        why_checked:
          "Mandatory document for customs clearance; verifies transaction details.",
        option_type: "Checkbox",
        mandatory: true,
        placeholder: "Check if available",
        sub_items: [
          {
            field: "Invoice number present",
            type: "Checkbox",
            why_checked:
              "Verifies the presence of a unique invoice identifier.",
            option_type: "Checkbox",
            placeholder: "Check if present",
          },
          {
            field: "Details match shipment",
            type: "Checkbox",
            why_checked: "Ensures consistency with other shipment information.",
            option_type: "Checkbox",
            placeholder: "Check if details match",
          },
          {
            field: "Customs compliant",
            type: "Checkbox",
            why_checked: "Confirms the invoice meets customs requirements.",
            option_type: "Checkbox",
            placeholder: "Check if compliant",
          },
        ],
      },
      {
        field: "Packing List",
        type: "Checkbox",
        why_checked:
          "Mandatory document; details contents and quantities of the shipment.",
        option_type: "Checkbox",
        mandatory: true,
        placeholder: "Check if available",
        sub_items: [
          {
            field: "Contents accurate",
            type: "Checkbox",
            why_checked: "Verifies the accuracy of the listed contents.",
            option_type: "Checkbox",
            placeholder: "Check if accurate",
          },
          {
            field: "Quantities match",
            type: "Checkbox",
            why_checked:
              "Ensures quantities align with the invoice and other documents.",
            option_type: "Checkbox",
            placeholder: "Check if match",
          },
          {
            field: "Matches invoice",
            type: "Checkbox",
            why_checked: "Confirms consistency with the invoice.",
            option_type: "Checkbox",
            placeholder: "Check if matches",
          },
        ],
      },
      {
        field: "Certificate of Origin",
        type: "Checkbox",
        why_checked:
          "Verifies the country where the goods were produced; may be required for trade agreements.",
        option_type: "Checkbox",
        mandatory: false,
        placeholder: "Check if available",
        sub_items: [
          {
            field: "Origin verified",
            type: "Checkbox",
            why_checked: "Confirms the origin of the goods is verified.",
            option_type: "Checkbox",
            placeholder: "Check if verified",
          },
          {
            field: "Trade agreement compliant",
            type: "Checkbox",
            why_checked: "Checks compliance with trade agreement rules.",
            option_type: "Checkbox",
            placeholder: "Check if compliant",
          },
        ],
      },
      {
        field: "Licenses/Permits",
        type: "Checkbox",
        why_checked:
          "Verifies the presence of required licenses or permits for export/import.",
        option_type: "Checkbox",
        mandatory: false,
        placeholder: "Check if available",
        sub_items: [
          {
            field: "Valid number",
            type: "Checkbox",
            why_checked: "Checks if the license/permit number is valid.",
            option_type: "Checkbox",
            placeholder: "Check if valid",
          },
          {
            field: "Not expired",
            type: "Checkbox",
            why_checked: "Ensures the license/permit is not expired.",
            option_type: "Checkbox",
            placeholder: "Check if not expired",
          },
          {
            field: "Authority verified",
            type: "Checkbox",
            why_checked:
              "Verifies the issuing authority of the license/permit.",
            option_type: "Checkbox",
            placeholder: "Check if verified",
          },
        ],
      },
      {
        field: "Bill of Lading",
        type: "Checkbox",
        why_checked:
          "Mandatory document for sea transport; acts as a receipt for the goods.",
        option_type: "Checkbox",
        mandatory: false,
        placeholder: "Check if available",
        sub_items: [
          {
            field: "Accurate details",
            type: "Checkbox",
            why_checked:
              "Checks if the details on the bill of lading are accurate.",
            option_type: "Checkbox",
            placeholder: "Check if accurate",
          },
          {
            field: "Shipping regulations compliant",
            type: "Checkbox",
            why_checked: "Ensures compliance with shipping regulations.",
            option_type: "Checkbox",
            placeholder: "Check if compliant",
          },
        ],
      },
    ],
    IntendedUseDetails: [
      {
        field: "Intended Use",
        type: "Text",
        why_checked:
          "Relevant for regulatory compliance, product safety, and determining applicable standards.",
        option_type: "Text area",
        mandatory: false,
        placeholder: "e.g., Retail sale, Manufacturing use",
      },
    ],
  };

  const countryOptions = [
    { value: "US", label: "United States" },
    { value: "CA", label: "Canada" },
    { value: "MX", label: "Mexico" },
    { value: "GB", label: "United Kingdom" },
    { value: "AU", label: "Australia" },
    { value: "CN", label: "China" },
    { value: "JP", label: "Japan" },
  ];

  const incotermsOptions = [
    { value: "EXW", label: "EXW" },
    { value: "FOB", label: "FOB" },
    { value: "CIF", label: "CIF" },
  ];

  const currencyOptions = [
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
  ];

  const booleanOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];

  const transportOptions = [
    { value: "Sea", label: "Sea" },
    { value: "Air", label: "Air" },
    { value: "Road", label: "Road" },
  ];

  const areCurrentTabMandatoryFieldsFilled = () => {
    for (const fieldData of formStructure[activeTab]) {
      if (fieldData.mandatory) {
        if (activeTab === "DocumentVerification") {
          const doc = formData.DocumentVerification[fieldData.field];
          if (
            fieldData.mandatory &&
            (!doc.checked || !Object.values(doc.subItems).every((item) => item))
          ) {
            return false;
          }
        } else {
          const value = formData[activeTab][fieldData.field];
          if (
            fieldData.option_type ===
            "Text input (Currency) & Number input (Amount)"
          ) {
            if (!value.currency || !value.amount) return false;
          } else if (!value) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleInputChange = (section, field, value, subField = null) => {
    setFormData((prev) => {
      const updatedSection = { ...prev[section] };
      if (subField) {
        updatedSection[field] = { ...updatedSection[field], [subField]: value };
      } else {
        updatedSection[field] = value;
      }
      return { ...prev, [section]: updatedSection };
    });
  };

  const handleDocChange = (docName, checked) => {
    setFormData((prev) => ({
      ...prev,
      DocumentVerification: {
        ...prev.DocumentVerification,
        [docName]: { ...prev.DocumentVerification[docName], checked },
      },
    }));
  };

  const handleSubItemChange = (docName, subItem, checked) => {
    setFormData((prev) => ({
      ...prev,
      DocumentVerification: {
        ...prev.DocumentVerification,
        [docName]: {
          ...prev.DocumentVerification[docName],
          subItems: {
            ...prev.DocumentVerification[docName].subItems,
            [subItem]: checked,
          },
        },
      },
    }));
  };

  const handleNextTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  const handlePrevTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    console.log(BACKEND_URL);
    try {
      const token = localStorage.getItem("token"); // Retrieve token from localStorage
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const res = await axios.post(
        `${BACKEND_URL}/api/compliance-check`,
        formData, // Send the entire formData object directly
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Add Authorization header with Bearer token
          },
        }
      );
      setResponse(res.data);
    } catch (error) {
      console.error("Error submitting compliance check:", error);
      setResponse({
        message:
          error.response?.data?.message || "Failed to submit compliance check",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (section, fieldData) => {
    const { field, type, option_type, mandatory, placeholder } = fieldData;
    const value = formData[section][field];

    switch (option_type) {
      case "Dropdown (ISO 3166-1 alpha-2)":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base ${
              mandatory && !value ? "border-red-500" : "border-neutral-300"
            }`}
            required={mandatory}
          >
            <option value="" disabled>
              Select
            </option>
            {countryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "Dropdown":
      case "Dropdown (Yes/No)":
        const options =
          field === "Incoterms 2020"
            ? incotermsOptions
            : field === "Currency of Transaction"
            ? currencyOptions
            : field === "Means of Transport"
            ? transportOptions
            : booleanOptions;
        return (
          <select
            value={value || ""}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base ${
              mandatory && !value ? "border-red-500" : "border-neutral-300"
            }`}
            required={mandatory}
          >
            <option value="" disabled>
              Select
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "Number input":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base ${
              mandatory && !value ? "border-red-500" : "border-neutral-300"
            }`}
            placeholder={placeholder}
            required={mandatory}
            min="0"
          />
        );

      case "Text input":
      case "Text area":
        return option_type === "Text area" ? (
          <textarea
            value={value || ""}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base ${
              mandatory && !value ? "border-red-500" : "border-neutral-300"
            }`}
            placeholder={placeholder}
            rows={3}
            required={mandatory}
          />
        ) : (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base ${
              mandatory && !value ? "border-red-500" : "border-neutral-300"
            }`}
            placeholder={placeholder}
            required={mandatory}
          />
        );

      case "Text input (Currency) & Number input (Amount)":
        return (
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={value?.currency || ""}
              onChange={(e) =>
                handleInputChange(section, field, e.target.value, "currency")
              }
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base ${
                mandatory && !value?.currency
                  ? "border-red-500"
                  : "border-neutral-300"
              }`}
              required={mandatory}
            >
              <option value="" disabled>
                Select
              </option>
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={value?.amount || ""}
              onChange={(e) =>
                handleInputChange(section, field, e.target.value, "amount")
              }
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base ${
                mandatory && !value?.amount
                  ? "border-red-500"
                  : "border-neutral-300"
              }`}
              placeholder={placeholder}
              required={mandatory}
              min="0"
            />
          </div>
        );

      case "Checkbox":
        const doc = formData.DocumentVerification[field];
        return (
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={doc.checked || fieldData.mandatory}
                onChange={(e) =>
                  !fieldData.mandatory &&
                  handleDocChange(field, e.target.checked)
                }
                disabled={fieldData.mandatory}
                className="mr-2"
              />
              <span className="text-sm md:text-base text-neutral-700">
                {field}
              </span>
            </div>
            {(doc.checked || fieldData.mandatory) && (
              <div className="ml-6 mt-2 space-y-2">
                {fieldData.sub_items.map((subItem) => (
                  <div key={subItem.field} className="flex items-center">
                    <Tooltip title={subItem.why_checked} placement="top">
                      <InfoOutlined
                        className="text-secondary-500 mr-2 cursor-pointer"
                        fontSize="small"
                      />
                    </Tooltip>
                    <input
                      type="checkbox"
                      checked={doc.subItems[subItem.field]}
                      onChange={(e) =>
                        handleSubItemChange(
                          field,
                          subItem.field,
                          e.target.checked
                        )
                      }
                      className="mr-2"
                    />
                    <span className="text-sm md:text-base text-neutral-700">
                      {subItem.field}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6">
      <header className="relative bg-gradient-to-r from-teal-200 to-blue-400 text-white py-6 sm:py-8 rounded-b-3xl overflow-hidden">
        {/* Wavy Background Shape */}
        <div className="absolute inset-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 100C240 30 480 170 720 100C960 30 1200 170 1440 100V200H0V100Z"
              fill="white"
              fillOpacity="0.1"
            />
            <path
              d="M0 150C240 80 480 220 720 150C960 80 1200 220 1440 150V200H0V150Z"
              fill="white"
              fillOpacity="0.2"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#f4ce14] rounded-full flex items-center justify-center">
              <Home onClick={toHome} />
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Compliance Check
            </h1>
          </div>
          <button
            onClick={() => navigate("/product-analysis")}
            className="mt-4 sm:mt-0 py-2 px-4 bg-white text-teal-600 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Product Analysis
          </button>
        </div>
      </header>
      {activeTab === "ShipmentDetails" && (
        <div className="bg-white mt-4 shadow-custom-light rounded-lg mb-4 sm:mb-6 overflow-x-auto">
          <CsvUpload setFormData={setFormData} />
        </div>
      )}

      <div className="bg-white mt-4 shadow-custom-light rounded-lg mb-4 sm:mb-6 overflow-x-auto">
        <div className="flex border-b border-neutral-200 whitespace-nowrap">
          {tabOrder.map((tab) => (
            <button
              key={tab}
              // onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${
                activeTab === tab
                  ? "border-b-2 border-primary-500 text-primary-500"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              {tab.replace(/([A-Z])/g, " $1").trim()}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white shadow-custom-medium rounded-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-tertiary-500 mb-4 sm:mb-6">
          {activeTab.replace(/([A-Z])/g, " $1").trim()}
        </h2>
        {/* Render CsvUpload Component only on ShipmentDetails Tab */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {formStructure[activeTab].map((fieldData) => (
            <div key={fieldData.field} className="flex flex-col">
              <div className="flex items-center mb-2">
                <Tooltip title={fieldData.why_checked} placement="top">
                  <InfoOutlined
                    className="text-secondary-500 mr-2 cursor-pointer"
                    fontSize="small"
                  />
                </Tooltip>
                <label className="text-sm font-medium text-tertiary-500">
                  {fieldData.field}{" "}
                  {fieldData.mandatory && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
              </div>
              {renderInput(activeTab, fieldData)}
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-between mt-4 sm:mt-6 gap-4">
          <button
            onClick={handlePrevTab}
            disabled={tabOrder.indexOf(activeTab) === 0}
            className={`py-2 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-medium rounded-lg transition-colors duration-200 w-full sm:w-auto ${
              tabOrder.indexOf(activeTab) === 0
                ? "bg-neutral-400 cursor-not-allowed"
                : "bg-secondary-500 text-white hover:bg-secondary-600"
            }`}
          >
            Previous
          </button>
          {activeTab !== "IntendedUseDetails" ? (
            <button
              onClick={handleNextTab}
              disabled={!areCurrentTabMandatoryFieldsFilled()}
              className={`py-2 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-medium rounded-lg transition-colors duration-200 w-full sm:w-auto ${
                !areCurrentTabMandatoryFieldsFilled()
                  ? "bg-neutral-400 cursor-not-allowed"
                  : "bg-primary-500 text-white hover:bg-primary-600"
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`py-2 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-medium rounded-lg transition-colors duration-200 w-full sm:w-auto ${
                loading
                  ? "bg-neutral-400 cursor-not-allowed"
                  : "bg-primary-500 text-white hover:bg-primary-600"
              }`}
            >
              {loading ? "Checking Compliance..." : "Compliance Check"}
            </button>
          )}
        </div>
      </div>
      {loading && <ComplianceResponseSkeleton />}
      {response && !loading && <ComplianceResponse response={response} />}
    </div>
  );
};

export default ComplianceForm;
