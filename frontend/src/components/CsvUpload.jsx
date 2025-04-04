import React, { useState, useRef } from "react";
import Papa from "papaparse";
import Toast from "./Toast";

const CsvUpload = ({ setFormData }) => {
  const [csvError, setCsvError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null); // Track the uploaded file
  const fileInputRef = useRef(null);
  const [toastProps, setToastProps] = useState({ type: "", message: "" });

  // Handle CSV parsing logic
  const handleCsvUpload = (file) => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        try {
          const data = result.data[0]; // Single row assumption
          const mappedData = {
            ShipmentDetails: {
              "Origin Country": data["Origin Country"] || "",
              "Destination Country": data["Destination Country"] || "",
              "HS Code": data["HS Code"] || "",
              "Product Description": data["Product Description"] || "",
              Quantity: data["Quantity"] || "",
              "Gross Weight": data["Gross Weight"] || "",
            },
            TradeAndRegulatoryDetails: {
              "Incoterms 2020": data["Incoterms 2020"] || "",
              "Declared Value": {
                currency: data["Currency"] || "",
                amount: data["Declared Value"] || "",
              },
              "Currency of Transaction": data["Currency of Transaction"] || "",
              "Trade Agreement Claimed": data["Trade Agreement Claimed"] || "",
              "Dual-Use Goods": data["Dual-Use Goods"] || "No",
              "Hazardous Material": data["Hazardous Material"] || "No",
              Perishable: data["Perishable"] || "No",
            },
            PartiesAndIdentifiers: {
              "Shipper/Exporter": data["Shipper/Exporter"] || "",
              "Consignee/Importer": data["Consignee/Importer"] || "",
              "Manufacturer Information":
                data["Manufacturer Information"] || "",
              "EORI/Tax ID": data["EORI/Tax ID"] || "",
            },
            LogisticsAndHandling: {
              "Means of Transport": data["Means of Transport"] || "",
              "Port of Loading": data["Port of Loading"] || "",
              "Port of Discharge": data["Port of Discharge"] || "",
              "Special Handling": data["Special Handling"] || "",
              "Temperature Requirements":
                data["Temperature Requirements"] || "",
            },
            DocumentVerification: {
              "Commercial Invoice": {
                checked: data["Commercial Invoice"] === "true" || false,
                subItems: {
                  "Invoice number present":
                    data["Invoice number present"] === "true" || false,
                  "Details match shipment":
                    data["Details match shipment"] === "true" || false,
                  "Customs compliant":
                    data["Customs compliant"] === "true" || false,
                },
              },
              "Packing List": {
                checked: data["Packing List"] === "true" || false,
                subItems: {
                  "Contents accurate":
                    data["Contents accurate"] === "true" || false,
                  "Quantities match":
                    data["Quantities match"] === "true" || false,
                  "Matches invoice":
                    data["Matches invoice"] === "true" || false,
                },
              },
              "Certificate of Origin": {
                checked: data["Certificate of Origin"] === "true" || false,
                subItems: {
                  "Origin verified":
                    data["Origin verified"] === "true" || false,
                  "Trade agreement compliant":
                    data["Trade agreement compliant"] === "true" || false,
                },
              },
              "Licenses/Permits": {
                checked: data["Licenses/Permits"] === "true" || false,
                subItems: {
                  "Valid number": data["Valid number"] === "true" || false,
                  "Not expired": data["Not expired"] === "true" || false,
                  "Authority verified":
                    data["Authority verified"] === "true" || false,
                },
              },
              "Bill of Lading": {
                checked: data["Bill of Lading"] === "true" || false,
                subItems: {
                  "Accurate details":
                    data["Accurate details"] === "true" || false,
                  "Shipping regulations compliant":
                    data["Shipping regulations compliant"] === "true" || false,
                },
              },
            },
            IntendedUseDetails: {
              "Intended Use": data["Intended Use"] || "",
            },
          };

          setFormData(mappedData);
          setUploadedFile(file); // Set the uploaded file
          setCsvError(null);
          setToastProps({
            type: "success",
            message: `CSV file "${file.name}" uploaded successfully!`,
          });
        } catch (error) {
          setCsvError(
            "Error parsing CSV file. Please ensure it matches the required format."
          );
          setToastProps({
            type: "error",
            message: `Error parsing "${file.name}". Check the format and try again.`,
          });
          console.error(error);
        }
      },
      error: (error) => {
        setCsvError("Failed to upload CSV file. Please try again.");
        setToastProps({
          type: "error",
          message: `Failed to upload "${file.name}". Please try again.`,
        });
        console.error(error);
      },
    });
  };

  // Handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (uploadedFile) {
      setToastProps({
        type: "warn",
        message: `Please remove the previous file before uploading a new one.`,
      });
      return;
    }
    handleCsvUpload(file);
  };

  // Handle drag-and-drop
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (uploadedFile) {
      setToastProps({
        type: "warn",
        message: `Please remove the previous file before uploading a new one.`,
      });
      return;
    }
    if (file && file.type === "text/csv") {
      handleCsvUpload(file);
    } else {
      setCsvError("Please drop a valid CSV file.");
      setToastProps({
        type: "warn",
        message: "Invalid file type. Please drop a CSV file.",
      });
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setCsvError(null);
    setToastProps({
      type: "info",
      message: "Uploaded file removed successfully.",
    });

    // Reload the website after the toast message disappears.
    setFormData({
      ShipmentDetails: {
        "Origin Country": "",
        "Destination Country": "",
        "HS Code": "",
        "Product Description": "",
        Quantity: "",
        "Gross Weight": "",
      },
      TradeAndRegulatoryDetails: {
        "Incoterms 2020": "",
        "Declared Value": { currency: "", amount: "" },
        "Currency of Transaction": "",
        "Trade Agreement Claimed": "",
        "Dual-Use Goods": "No",
        "Hazardous Material": "No",
        Perishable: "No",
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
    });
  };
  // Download empty CSV template
  const handleDownloadTemplate = () => {
    const headers = [
      "Origin Country",
      "Destination Country",
      "HS Code",
      "Product Description",
      "Quantity",
      "Gross Weight",
      "Incoterms 2020",
      "Currency",
      "Declared Value",
      "Currency of Transaction",
      "Trade Agreement Claimed",
      "Dual-Use Goods",
      "Hazardous Material",
      "Perishable",
      "Shipper/Exporter",
      "Consignee/Importer",
      "Manufacturer Information",
      "EORI/Tax ID",
      "Means of Transport",
      "Port of Loading",
      "Port of Discharge",
      "Special Handling",
      "Temperature Requirements",
      "Commercial Invoice",
      "Invoice number present",
      "Details match shipment",
      "Customs compliant",
      "Packing List",
      "Contents accurate",
      "Quantities match",
      "Matches invoice",
      "Certificate of Origin",
      "Origin verified",
      "Trade agreement compliant",
      "Licenses/Permits",
      "Valid number",
      "Not expired",
      "Authority verified",
      "Bill of Lading",
      "Accurate details",
      "Shipping regulations compliant",
      "Intended Use",
    ];
    const csvContent = Papa.unparse({ fields: headers, data: [{}] });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "shipment_template.csv";
    link.click();
    toast.info("CSV template downloaded successfully!", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  return (
    <div className="mb-10 p-6 bg-white">
      <label className="text-sm font-medium text-gray-700 mb-4 block">
        Upload Shipment Details via CSV
      </label>

      {/* Drag-and-Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
          isDragging
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 bg-gray-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploadedFile ? (
          <div>
            <p className="text-gray-600 mb-4">
              Uploaded File:{" "}
              <span className="font-semibold">{uploadedFile.name}</span>
            </p>
            <button
              onClick={handleRemoveFile}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            >
              Remove File
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              {isDragging
                ? "Drop your CSV file here"
                : "Drag and drop a CSV file here, or click to select"}
            </p>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            >
              Select CSV File
            </button>
          </>
        )}
      </div>

      {/* Download Template Button */}
      <button
        onClick={handleDownloadTemplate}
        className="w-full px-4 py-2 mb-6 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
      >
        Download Empty CSV Template
      </button>

      {/* Error Message */}
      {csvError && (
        <p className="text-red-500 text-sm mt-4 text-center">{csvError}</p>
      )}

      {/* Instructions */}
      <p className="text-sm text-gray-500 text-center">
        Upload a CSV file with headers matching the form fields (e.g., "Origin
        Country", "HS Code", etc.). Use the template above for the correct
        format.
      </p>
      <Toast type={toastProps.type} message={toastProps.message} />
    </div>
  );
};

export default CsvUpload;
