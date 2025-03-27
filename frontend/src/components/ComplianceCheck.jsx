import React, { useState } from "react";
import { Tooltip } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import axios from "axios";
import ComplianceResponse from "./ComplianceResponse";

const ComplianceForm = () => {
  const [formData, setFormData] = useState({
    ShipmentDetails: {
      "Origin Country": "US",
      "Destination Country": "CA",
      "HS Code": "610910",
      "Product Description":
        "Men's Cotton T-Shirts, 100% Organic Cotton, White, Size M",
      Quantity: "500",
      "Gross Weight": "250",
    },
    TradeAndRegulatoryDetails: {
      "Incoterms 2020": "FOB",
      "Declared Value": { currency: "USD", amount: "7500" },
      "Currency of Transaction": "USD",
      "Trade Agreement Claimed": "USMCA",
      "Dual-Use Goods": "No",
      "Hazardous Material": "No",
      Perishable: "No",
    },
    PartiesAndIdentifiers: {
      "Shipper/Exporter":
        "ABC Exports Inc., 123 Trade St, Los Angeles, CA 90001, USA",
      "Consignee/Importer":
        "XYZ Imports Ltd., 456 Maple Ave, Vancouver, BC V6B 2L3, Canada",
      "Manufacturer Information":
        "Textile Co. Ltd., 789 Factory Rd, Atlanta, GA 30301, USA",
      "EORI/Tax ID": "US123456789",
    },
    LogisticsAndHandling: {
      "Means of Transport": "Sea",
      "Port of Loading": "Port of Los Angeles",
      "Port of Discharge": "Port of Vancouver",
      "Special Handling": "Keep Dry, Handle with Care",
      "Temperature Requirements": "",
    },
    DocumentVerification: {
      "Commercial Invoice": {
        checked: true,
        subItems: {
          "Invoice number present": true,
          "Details match shipment": true,
          "Customs compliant": true,
        },
      },
      "Packing List": {
        checked: true,
        subItems: {
          "Contents accurate": true,
          "Quantities match": true,
          "Matches invoice": true,
        },
      },
      "Certificate of Origin": {
        checked: true,
        subItems: {
          "Origin verified": true,
          "Trade agreement compliant": true,
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
        checked: true,
        subItems: {
          "Accurate details": true,
          "Shipping regulations compliant": true,
        },
      },
    },
    IntendedUseDetails: {
      "Intended Use": "Retail Sale in Canadian Markets",
    },
  });

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
    try {
      const res = await axios.post(
        "http://localhost:5000/api/compliance-check",
        formData, // Send the entire formData object directly
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setResponse(res.data);
    } catch (error) {
      console.error("Error submitting compliance check:", error);
      setResponse({ message: "Failed to submit compliance check" });
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
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
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
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
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
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
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
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
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
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              mandatory && !value ? "border-red-500" : "border-neutral-300"
            }`}
            placeholder={placeholder}
            required={mandatory}
          />
        );

      case "Text input (Currency) & Number input (Amount)":
        return (
          <div className="flex gap-4">
            <select
              value={value?.currency || ""}
              onChange={(e) =>
                handleInputChange(section, field, e.target.value, "currency")
              }
              className={`w-1/3 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
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
              className={`w-2/3 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
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
              <span className="text-sm text-neutral-700">{field}</span>
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
                    <span className="text-sm text-neutral-700">
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
    <div className="min-h-screen bg-neutral-100 p-6">
      <h1 className="text-3xl font-bold text-tertiary-500 mb-6">
        Compliance Check
      </h1>
      <div className="bg-white shadow-custom-light rounded-lg mb-6">
        <div className="flex border-b border-neutral-200">
          {tabOrder.map((tab) => (
            <button
              key={tab}
              className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab
                  ? "border-b-2 border-primary-500 text-primary-500"
                  : "text-neutral-700 hover:text-primary-500"
              }`}
            >
              {tab.replace(/([A-Z])/g, " $1").trim()}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white shadow-custom-medium rounded-lg p-6">
        <h2 className="text-2xl font-bold text-tertiary-500 mb-6">
          {activeTab.replace(/([A-Z])/g, " $1").trim()}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevTab}
            disabled={tabOrder.indexOf(activeTab) === 0}
            className={`py-3 px-6 text-lg font-medium rounded-lg transition-colors duration-200 ${
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
              className={`py-3 px-6 text-lg font-medium rounded-lg transition-colors duration-200 ${
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
              className={`py-3 px-6 text-lg font-medium rounded-lg transition-colors duration-200 ${
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
      {response && <ComplianceResponse response={response} />}
    </div>
  );
};

export default ComplianceForm;
