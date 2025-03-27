import React, { useState } from "react";
import { Form, Input, InputNumber, Select, Button } from "antd";
import { Checkbox, Collapse } from "@mui/material";
import { motion } from "framer-motion";
import {
  GlobalOutlined,
  BarcodeOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  TruckOutlined,
  FileTextOutlined,
  BankOutlined,
  SecurityScanOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;

const countryData = [
  { name: "United States", code: "US" },
  { name: "Canada", code: "CA" },
  { name: "Mexico", code: "MX" },
  { name: "Iran", code: "IR" },
];

const documents = [
  {
    name: "Commercial Invoice",
    subItems: [
      "Invoice number present",
      "Details match shipment",
      "Customs compliant",
    ],
    mandatory: true,
  },
  {
    name: "Packing List",
    subItems: ["Contents accurate", "Quantities match", "Matches invoice"],
    mandatory: true,
  },
  {
    name: "Certificate of Origin",
    subItems: ["Origin verified", "Trade agreement compliant"],
    mandatory: false,
  },
  {
    name: "Licenses/Permits",
    subItems: ["Valid number", "Not expired", "Authority verified"],
    mandatory: false,
  },
  {
    name: "Bill of Lading",
    subItems: ["Accurate details", "Shipping regulations compliant"],
    mandatory: false,
  },
];

const ComplianceCheck = () => {
  const [form] = Form.useForm();
  const [checklist, setChecklist] = useState({
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
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  // Check if all mandatory documents are fully verified
  const areDocumentsVerified = () => {
    return Object.entries(checklist).every(([docName, doc]) => {
      const isMandatory = documents.find((d) => d.name === docName)?.mandatory;
      return (
        !doc.checked ||
        (isMandatory && Object.values(doc.subItems).every((item) => item))
      );
    });
  };

  // Handle form submission and send JSON to backend
  const handleSubmit = async (values) => {
    if (!areDocumentsVerified()) {
      setResponse({
        message:
          "Please verify all mandatory documents before compliance check",
      });
      return;
    }

    setLoading(true);
    const submissionData = {
      complianceData: {
        product: {
          hsCode: values.hsCode,
          safetyCert: values.safetyCert,
          dualUse: values.dualUse,
          isPerishable: values.isPerishable,
          tempControl: values.tempControl,
          manufacturer: values.manufacturer,
          weight: values.weight,
          quantity: values.quantity,
          value: values.value,
        },
        trade: {
          originCountry: values.originCountry,
          destinationCountry: values.destinationCountry,
          incoterms: values.incoterms,
          tradeAgreement: values.tradeAgreement,
          exportLicense: values.exportLicense,
          eori: values.eori,
        },
        financial: {
          currency: values.currency,
        },
        transportation: {
          transportMeans: values.transportMeans,
          portLoading: values.portLoading,
          portDischarge: values.portDischarge,
          specialHandling: values.specialHandling,
          handlingDetails: values.handlingDetails,
        },
      },
      documentVerification: checklist,
    };

    console.log("Submission Data:", JSON.stringify(submissionData, null, 2)); // For debugging

    try {
      const res = await axios.post(
        "http://localhost:5000/api/compliance-check",
        submissionData,
        {
          headers: {
            "Content-Type": "application/json",
            // Add your API key if required: "Authorization": "Bearer YOUR_API_KEY"
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

  // Handle document checkbox changes
  const handleDocChange = (docName, checked) => {
    setChecklist((prev) => ({
      ...prev,
      [docName]: { ...prev[docName], checked },
    }));
  };

  // Handle sub-item checkbox changes
  const handleSubItemChange = (docName, subItem, checked) => {
    setChecklist((prev) => ({
      ...prev,
      [docName]: {
        ...prev[docName],
        subItems: { ...prev[docName].subItems, [subItem]: checked },
      },
    }));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-gray-100 min-h-screen">
      {/* Shipment Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">
            Compliance Check Form
          </h2>
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label={
                  <span>
                    <GlobalOutlined /> Origin Country
                  </span>
                }
                name="originCountry"
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Select Origin" showSearch>
                  {countryData.map((c) => (
                    <Option key={c.code} value={c.code}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    <GlobalOutlined /> Destination Country
                  </span>
                }
                name="destinationCountry"
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Select Destination" showSearch>
                  {countryData.map((c) => (
                    <Option key={c.code} value={c.code}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <Form.Item
              label={
                <span>
                  <BarcodeOutlined /> HS Code
                </span>
              }
              name="hsCode"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g., 123456" />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <SafetyCertificateOutlined /> Safety Certification
                </span>
              }
              name="safetyCert"
            >
              <Select placeholder="Select Certification">
                <Option value="CE">CE Marking</Option>
                <Option value="UL">UL Certification</Option>
                <Option value="None">None</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <SecurityScanOutlined /> Dual-Use Goods
                </span>
              }
              name="dualUse"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select">
                <Option value="Yes">Yes</Option>
                <Option value="No">No</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <ShoppingCartOutlined /> Perishable Goods
                </span>
              }
              name="isPerishable"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select">
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <ShoppingCartOutlined /> Temperature Control
                </span>
              }
              name="tempControl"
            >
              <Input placeholder="e.g., 2-8°C" />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <UserOutlined /> Manufacturer
                </span>
              }
              name="manufacturer"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g., ABC Corp" />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <ShoppingCartOutlined /> Weight (kg)
                </span>
              }
              name="weight"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber placeholder="e.g., 100" min={0} className="w-full" />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <ShoppingCartOutlined /> Quantity
                </span>
              }
              name="quantity"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber placeholder="e.g., 50" min={1} className="w-full" />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <DollarOutlined /> Value (USD)
                </span>
              }
              name="value"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber placeholder="e.g., 500" min={0} className="w-full" />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <BankOutlined /> Currency
                </span>
              }
              name="currency"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select Currency">
                <Option value="USD">USD</Option>
                <Option value="CAD">CAD</Option>
                <Option value="MXN">MXN</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <FileTextOutlined /> Incoterms
                </span>
              }
              name="incoterms"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select Incoterm">
                <Option value="EXW">EXW</Option>
                <Option value="FOB">FOB</Option>
                <Option value="CIF">CIF</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <FileTextOutlined /> Trade Agreement
                </span>
              }
              name="tradeAgreement"
            >
              <Select placeholder="Select Agreement">
                <Option value="NAFTA">NAFTA</Option>
                <Option value="None">None</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <FileTextOutlined /> Export License
                </span>
              }
              name="exportLicense"
            >
              <Input placeholder="e.g., LIC123" />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <UserOutlined /> EORI/Tax ID
                </span>
              }
              name="eori"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g., US123456789" />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <TruckOutlined /> Transport Means
                </span>
              }
              name="transportMeans"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select Transport">
                <Option value="Air">Air</Option>
                <Option value="Sea">Sea</Option>
                <Option value="Land">Land</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <TruckOutlined /> Port of Loading
                </span>
              }
              name="portLoading"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g., Port of Los Angeles" />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <TruckOutlined /> Port of Discharge
                </span>
              }
              name="portDischarge"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g., Port of Vancouver" />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <TruckOutlined /> Special Handling
                </span>
              }
              name="specialHandling"
            >
              <Select placeholder="Select">
                <Option value="Fragile">Fragile</Option>
                <Option value="Hazardous">Hazardous</Option>
                <Option value="None">None</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <FileTextOutlined /> Handling Details
                </span>
              }
              name="handlingDetails"
            >
              <Input.TextArea placeholder="e.g., Handle with care" rows={2} />
            </Form.Item>
          </Form>
        </div>
      </motion.div>

      {/* Document Verification */}
      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">
            Document Verification
          </h2>
          {documents.map((doc) => (
            <div key={doc.name} className="mb-4">
              <div className="flex items-center">
                <Checkbox
                  checked={checklist[doc.name].checked || doc.mandatory}
                  onChange={(e) =>
                    !doc.mandatory &&
                    handleDocChange(doc.name, e.target.checked)
                  }
                  disabled={doc.mandatory}
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 20 } }}
                />
                <span className="ml-2 text-gray-800">
                  {doc.name}{" "}
                  {doc.mandatory && (
                    <span className="text-red-500 text-sm">(Mandatory)</span>
                  )}
                </span>
              </div>
              {(checklist[doc.name].checked || doc.mandatory) && (
                <Collapse in={checklist[doc.name].checked || doc.mandatory}>
                  <div className="ml-8 mt-2">
                    {doc.subItems.map((subItem) => (
                      <div key={subItem} className="flex items-center">
                        <Checkbox
                          checked={checklist[doc.name].subItems[subItem]}
                          onChange={(e) =>
                            handleSubItemChange(
                              doc.name,
                              subItem,
                              e.target.checked
                            )
                          }
                          sx={{ "& .MuiSvgIcon-root": { fontSize: 18 } }}
                        />
                        <span className="ml-2 text-gray-600">{subItem}</span>
                      </div>
                    ))}
                  </div>
                </Collapse>
              )}
            </div>
          ))}
          <Button
            type="primary"
            onClick={() => form.submit()}
            disabled={!areDocumentsVerified() || loading}
            className={`w-full h-12 text-lg mt-4 ${
              areDocumentsVerified() && !loading
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Checking Compliance..." : "Check Compliance"}
          </Button>
        </div>
      </motion.div>

      {/* Response Display */}
      {response && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Response</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </motion.div>
      )}
    </div>
  );
};

export default ComplianceCheck;
