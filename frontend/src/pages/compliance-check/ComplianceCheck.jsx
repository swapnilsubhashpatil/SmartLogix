import React, { useState, useEffect } from "react";
import { Tooltip } from "@mui/material";
import { InfoOutlined, Home } from "@mui/icons-material";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import ComplianceResponse from "./ComplianceResponse";
import ComplianceResponseSkeleton from "../../components/Skeleton/ComplianceResponseSkeleton";
import {
  initialFormData,
  formStructure,
  tabOrder,
  countryOptions,
  incotermsOptions,
  currencyOptions,
  booleanOptions,
  transportOptions,
} from "../../constants/constants";
import Header from "../../components/Header";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ComplianceForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState(initialFormData);
  const [activeTab, setActiveTab] = useState("ShipmentDetails");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [toastProps, setToastProps] = useState(null);
  const [responseReceived, setResponseReceived] = useState(false);

  const isButtonDisabled = loading || responseReceived;

  const fetchDraft = async (draftId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setToastProps({ type: "error", message: "Please log in." });
        navigate("/");
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/drafts/${draftId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const draft = response.data.draft || response.data;
      if (!draft || !draft.formData) {
        throw new Error("Invalid draft data received");
      }

      const updatedFormData = {
        ...initialFormData,
        ShipmentDetails: {
          ...initialFormData.ShipmentDetails,
          "Origin Country":
            draft.formData.ShipmentDetails?.["Origin Country"] || "",
          "Destination Country":
            draft.formData.ShipmentDetails?.["Destination Country"] || "",
          "HS Code": draft.formData.ShipmentDetails?.["HS Code"] || "",
          "Product Description":
            draft.formData.ShipmentDetails?.["Product Description"] || "",
          Quantity: draft.formData.ShipmentDetails?.Quantity
            ? String(draft.formData.ShipmentDetails.Quantity)
            : "",
          "Gross Weight": draft.formData.ShipmentDetails?.["Gross Weight"]
            ? String(draft.formData.ShipmentDetails["Gross Weight"])
            : "",
        },
        TradeAndRegulatoryDetails: {
          ...initialFormData.TradeAndRegulatoryDetails,
          "Incoterms 2020":
            draft.formData.TradeAndRegulatoryDetails?.["Incoterms 2020"] || "",
          "Declared Value": {
            currency:
              draft.formData.TradeAndRegulatoryDetails?.["Declared Value"]
                ?.currency || "",
            amount:
              draft.formData.TradeAndRegulatoryDetails?.["Declared Value"]
                ?.amount || "",
          },
          "Currency of Transaction":
            draft.formData.TradeAndRegulatoryDetails?.[
              "Currency of Transaction"
            ] || "",
          "Trade Agreement Claimed":
            draft.formData.TradeAndRegulatoryDetails?.[
              "Trade Agreement Claimed"
            ] || "",
          "Dual-Use Goods":
            draft.formData.TradeAndRegulatoryDetails?.["Dual-Use Goods"] ||
            "No",
          "Hazardous Material":
            draft.formData.TradeAndRegulatoryDetails?.["Hazardous Material"] ||
            "No",
          Perishable:
            draft.formData.TradeAndRegulatoryDetails?.["Perishable"] || "No",
        },
        PartiesAndIdentifiers: {
          ...initialFormData.PartiesAndIdentifiers,
          "Shipper/Exporter":
            draft.formData.PartiesAndIdentifiers?.["Shipper/Exporter"] || "",
          "Consignee/Importer":
            draft.formData.PartiesAndIdentifiers?.["Consignee/Importer"] || "",
          "Manufacturer Information":
            draft.formData.PartiesAndIdentifiers?.[
              "Manufacturer Information"
            ] || "",
          "EORI/Tax ID":
            draft.formData.PartiesAndIdentifiers?.["EORI/Tax ID"] || "",
        },
        LogisticsAndHandling: {
          ...initialFormData.LogisticsAndHandling,
          "Means of Transport":
            draft.formData.LogisticsAndHandling?.["Means of Transport"] || "",
          "Port of Loading":
            draft.formData.LogisticsAndHandling?.["Port of Loading"] || "",
          "Port of Discharge":
            draft.formData.LogisticsAndHandling?.["Port of Discharge"] || "",
          "Special Handling":
            draft.formData.LogisticsAndHandling?.["Special Handling"] || "",
          "Temperature Requirements":
            draft.formData.LogisticsAndHandling?.["Temperature Requirements"] ||
            "",
        },
        DocumentVerification: {
          ...initialFormData.DocumentVerification,
          "Commercial Invoice": {
            checked:
              draft.formData.DocumentVerification?.["Commercial Invoice"]
                ?.checked || false,
            subItems: {
              "Invoice number present":
                draft.formData.DocumentVerification?.["Commercial Invoice"]
                  ?.subItems?.["Invoice number present"] || false,
              "Details match shipment":
                draft.formData.DocumentVerification?.["Commercial Invoice"]
                  ?.subItems?.["Details match shipment"] || false,
              "Customs compliant":
                draft.formData.DocumentVerification?.["Commercial Invoice"]
                  ?.subItems?.["Customs compliant"] || false,
            },
          },
          "Packing List": {
            checked:
              draft.formData.DocumentVerification?.["Packing List"]?.checked ||
              false,
            subItems: {
              "Contents accurate":
                draft.formData.DocumentVerification?.["Packing List"]
                  ?.subItems?.["Contents accurate"] || false,
              "Quantities match":
                draft.formData.DocumentVerification?.["Packing List"]
                  ?.subItems?.["Quantities match"] || false,
              "Matches invoice":
                draft.formData.DocumentVerification?.["Packing List"]
                  ?.subItems?.["Matches invoice"] || false,
            },
          },
          "Certificate of Origin": {
            checked:
              draft.formData.DocumentVerification?.["Certificate of Origin"]
                ?.checked || false,
            subItems: {
              "Origin verified":
                draft.formData.DocumentVerification?.["Certificate of Origin"]
                  ?.subItems?.["Origin verified"] || false,
              "Trade agreement compliant":
                draft.formData.DocumentVerification?.["Certificate of Origin"]
                  ?.subItems?.["Trade agreement compliant"] || false,
            },
          },
          "Licenses/Permits": {
            checked:
              draft.formData.DocumentVerification?.["Licenses/Permits"]
                ?.checked || false,
            subItems: {
              "Valid number":
                draft.formData.DocumentVerification?.["Licenses/Permits"]
                  ?.subItems?.["Valid number"] || false,
              "Not expired":
                draft.formData.DocumentVerification?.["Licenses/Permits"]
                  ?.subItems?.["Not expired"] || false,
              "Authority verified":
                draft.formData.DocumentVerification?.["Licenses/Permits"]
                  ?.subItems?.["Authority verified"] || false,
            },
          },
          "Bill of Lading": {
            checked:
              draft.formData.DocumentVerification?.["Bill of Lading"]
                ?.checked || false,
            subItems: {
              "Accurate details":
                draft.formData.DocumentVerification?.["Bill of Lading"]
                  ?.subItems?.["Accurate details"] || false,
              "Shipping regulations compliant":
                draft.formData.DocumentVerification?.["Bill of Lading"]
                  ?.subItems?.["Shipping regulations compliant"] || false,
            },
          },
        },
        IntendedUseDetails: {
          ...initialFormData.IntendedUseDetails,
          "Intended Use":
            draft.formData.IntendedUseDetails?.["Intended Use"] || "",
        },
      };

      setFormData(updatedFormData);
    } catch (error) {
      console.error("Error fetching draft:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch draft.";
      setToastProps({ type: "error", message: errorMessage });
      navigate("/inventory-management");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const draftId = params.get("draftId");
    if (draftId) {
      fetchDraft(draftId);
    }
  }, [location]);

  const toHome = () => navigate("/dashboard");

  const areCurrentTabMandatoryFieldsFilled = () => {
    for (const fieldData of formStructure[activeTab]) {
      if (fieldData.mandatory) {
        if (activeTab === "DocumentVerification") {
          const doc = formData.DocumentVerification[fieldData.field];
          if (!Object.values(doc.subItems).every((item) => item)) {
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
    if (responseReceived) return; // Prevent input changes if response received
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
    if (responseReceived) return; // Prevent doc changes if response received
    setFormData((prev) => ({
      ...prev,
      DocumentVerification: {
        ...prev.DocumentVerification,
        [docName]: { ...prev.DocumentVerification[docName], checked },
      },
    }));
  };

  const handleSubItemChange = (docName, subItem, checked) => {
    if (responseReceived) return; // Prevent sub-item changes if response received
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
    if (responseReceived) return; // Prevent tab navigation if response received
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  const handlePrevTab = () => {
    if (responseReceived) return; // Prevent tab navigation if response received
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (responseReceived) return; // Prevent re-submission if response received
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const params = new URLSearchParams(location.search);
      const draftId = params.get("draftId");

      const res = await axios.post(
        `${BACKEND_URL}/api/compliance-check`,
        { draftId, ...formData },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setResponse(res.data);
      setResponseReceived(true);
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
    const { field, option_type, mandatory, placeholder } = fieldData;
    const value = formData[section][field];

    switch (option_type) {
      case "Dropdown (ISO 3166-1 alpha-2)":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base ${
              mandatory && !value ? "border-red-500" : "border-neutral-300"
            } ${responseReceived ? "bg-neutral-200 cursor-not-allowed" : ""}`}
            required={mandatory}
            disabled={responseReceived}
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
            } ${responseReceived ? "bg-neutral-200 cursor-not-allowed" : ""}`}
            required={mandatory}
            disabled={responseReceived}
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
            } ${responseReceived ? "bg-neutral-200 cursor-not-allowed" : ""}`}
            placeholder={placeholder}
            required={mandatory}
            min="0"
            disabled={responseReceived}
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
            } ${responseReceived ? "bg-neutral-200 cursor-not-allowed" : ""}`}
            placeholder={placeholder}
            rows={3}
            required={mandatory}
            disabled={responseReceived}
          />
        ) : (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base ${
              mandatory && !value ? "border-red-500" : "border-neutral-300"
            } ${responseReceived ? "bg-neutral-200 cursor-not-allowed" : ""}`}
            placeholder={placeholder}
            required={mandatory}
            disabled={responseReceived}
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
              } ${responseReceived ? "bg-neutral-200 cursor-not-allowed" : ""}`}
              required={mandatory}
              disabled={responseReceived}
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
              } ${responseReceived ? "bg-neutral-200 cursor-not-allowed" : ""}`}
              placeholder={placeholder}
              required={mandatory}
              min="0"
              disabled={responseReceived}
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
                disabled={fieldData.mandatory || responseReceived}
                className={`mr-2 ${
                  responseReceived ? "cursor-not-allowed opacity-50" : ""
                }`}
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
                      className={`mr-2 ${
                        responseReceived ? "cursor-not-allowed opacity-50" : ""
                      }`}
                      disabled={responseReceived}
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
      <Header
        title="Compliance Check Form"
        response={response}
        page="compliance-check"
      />
      <div className="max-w-7xl mx-auto bg-white mt-4 shadow-custom-light rounded-lg mb-4 sm:mb-6 overflow-x-auto">
        <div className="flex border-b border-neutral-200 whitespace-nowrap">
          {tabOrder.map((tab) => (
            <button
              key={tab}
              onClick={() => !responseReceived && setActiveTab(tab)}
              className={`px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${
                activeTab === tab
                  ? "border-b-2 border-primary-500 text-primary-500"
                  : responseReceived
                  ? "text-neutral-400 cursor-not-allowed"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              {tab.replace(/([A-Z])/g, " $1").trim()}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto bg-white shadow-custom-medium rounded-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-tertiary-500 mb-4 sm:mb-6">
          {activeTab.replace(/([A-Z])/g, " $1").trim()}
        </h2>
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
            disabled={tabOrder.indexOf(activeTab) === 0 || responseReceived}
            className={`py-2 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-medium rounded-lg transition-colors duration-200 w-full sm:w-auto ${
              tabOrder.indexOf(activeTab) === 0 || responseReceived
                ? "bg-neutral-400 cursor-not-allowed"
                : "bg-secondary-500 text-white hover:bg-secondary-600"
            }`}
          >
            Previous
          </button>
          {activeTab !== "IntendedUseDetails" ? (
            <button
              onClick={handleNextTab}
              disabled={
                !areCurrentTabMandatoryFieldsFilled() || responseReceived
              }
              className={`py-2 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-medium rounded-lg transition-colors duration-200 w-full sm:w-auto ${
                !areCurrentTabMandatoryFieldsFilled() || responseReceived
                  ? "bg-neutral-400 cursor-not-allowed"
                  : "bg-primary-500 text-white hover:bg-primary-600"
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isButtonDisabled}
              className={`py-2 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-medium rounded-lg transition-colors duration-200 w-full sm:w-auto ${
                isButtonDisabled
                  ? "bg-neutral-400 cursor-not-allowed"
                  : "bg-primary-500 text-white hover:bg-primary-600"
              }`}
            >
              {loading
                ? "Checking Compliance..."
                : responseReceived
                ? "Compliance Checked"
                : "Compliance Check"}
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
