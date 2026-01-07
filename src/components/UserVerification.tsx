import React, { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  X,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import apiService from "../services/api";

const UserVerification: React.FC = () => {
  const { auth, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    panNumber: "",
    aadhaarNumber: "",
    dlNumber: "",
    passportNumber: "",
  });
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    panCard: null,
    aadhaarCard: null,
    drivingLicense: null,
    passport: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.toUpperCase(),
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: string
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF, JPG, and PNG files are allowed");
        return;
      }

      setFiles((prev) => ({
        ...prev,
        [docType]: file,
      }));
      setError("");
    }
  };

  const removeFile = (docType: string) => {
    setFiles((prev) => ({
      ...prev,
      [docType]: null,
    }));
  };

  const validateForm = () => {
    // Build a list of specific missing items
    const missingItems: string[] = [];

    // Check PAN Card
    if (formData.panNumber && !files.panCard) {
      missingItems.push("PAN Card document not uploaded");
    } else if (!formData.panNumber && files.panCard) {
      missingItems.push("PAN Number not provided");
    }

    // Check Aadhaar Card
    if (formData.aadhaarNumber && !files.aadhaarCard) {
      missingItems.push("Aadhaar Card document not uploaded");
    } else if (!formData.aadhaarNumber && files.aadhaarCard) {
      missingItems.push("Aadhaar Number not provided");
    }

    // Check Driving License
    if (formData.dlNumber && !files.drivingLicense) {
      missingItems.push("Driving License document not uploaded");
    } else if (!formData.dlNumber && files.drivingLicense) {
      missingItems.push("Driving License Number not provided");
    }

    // Check Passport
    if (formData.passportNumber && !files.passport) {
      missingItems.push("Passport document not uploaded");
    } else if (!formData.passportNumber && files.passport) {
      missingItems.push("Passport Number not provided");
    }

    // If there are specific missing items, show them
    if (missingItems.length > 0) {
      setError(missingItems.join(", "));
      return false;
    }

    // Check if at least one complete document is provided
    const hasValidDoc =
      (formData.panNumber && files.panCard) ||
      (formData.aadhaarNumber && files.aadhaarCard) ||
      (formData.dlNumber && files.drivingLicense) ||
      (formData.passportNumber && files.passport);

    if (!hasValidDoc) {
      setError("Please provide at least one complete document (both number and file)");
      return false;
    }

    // Validate PAN format
    if (
      formData.panNumber &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)
    ) {
      setError("Invalid PAN format. Should be like ABCDE1234F");
      return false;
    }

    // Validate Aadhaar format
    if (
      formData.aadhaarNumber &&
      !/^\d{12}$/.test(formData.aadhaarNumber.replace(/\s/g, ""))
    ) {
      setError("Invalid Aadhaar format. Should be 12 digits");
      return false;
    }

    return true;
  };

  // Only check state here, no state updates
  const canSubmit = () => {
    return (
      !loading &&
      auth.user?.verificationStatus !== "VERIFIED"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    setError("");
    setSuccess("");

    // Validate the form before sending
    const isValid = validateForm();
    if (!isValid) return;

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append PAN
      if (formData.panNumber && files.panCard) {
        formDataToSend.append("panNumber", formData.panNumber);
        formDataToSend.append("panCard", files.panCard);
      }

      // Append Aadhaar
      if (formData.aadhaarNumber && files.aadhaarCard) {
        formDataToSend.append(
          "aadhaarNumber",
          formData.aadhaarNumber.replace(/\s/g, "")
        );
        formDataToSend.append("aadhaarCard", files.aadhaarCard);
      }

      // Append Driving License (optional)
      if (formData.dlNumber && files.drivingLicense) {
        formDataToSend.append("dlNumber", formData.dlNumber);
        formDataToSend.append("drivingLicense", files.drivingLicense);
      }

      // Append Passport (optional)
      if (formData.passportNumber && files.passport) {
        formDataToSend.append("passportNumber", formData.passportNumber);
        formDataToSend.append("passport", files.passport);
      }

      // Send data to API
      const response = await apiService.submitVerificationDocuments(
        formDataToSend
      );

      if (response.message === "Verification documents submitted successfully. Verification in progress.") {
        // Refresh user data to update verification status
        await refreshUser();

        // Clear form data
        setFormData({
          panNumber: "",
          aadhaarNumber: "",
          dlNumber: "",
          passportNumber: "",
        });

        setFiles({
          panCard: null,
          aadhaarCard: null,
          drivingLicense: null,
          passport: null,
        });
      } else {
        setError(response.message || "Failed to submit verification documents");
      }
    } catch (err: any) {
      // Handle network or unexpected errors
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatus = () => {
    if (!auth.user) return null;

    switch (auth.user.verificationStatus) {
      case "PENDING":
        return (
          <div className="bg-emerald-50 border border-emerald-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-emerald-700 mr-2" />
              <span className="text-emerald-700 font-medium">
                Submitted for Verification
              </span>
            </div>
            <p className="text-emerald-600 mt-1">
              Your verification documents have been submitted successfully. Please wait for admin review. You'll be notified once the verification is complete.
            </p>
          </div>
        );
      case "VERIFIED":
        return (
          <div className="bg-emerald-50 border border-emerald-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-emerald-700 mr-2" />
              <span className="text-emerald-700 font-medium">
                Account Verified
              </span>
            </div>
            <p className="text-emerald-600 mt-1">
              Your account has been verified. You can now claim land ownership
              and participate in transactions.
            </p>
          </div>
        );
      case "REJECTED":
        return (
          <div className="bg-red-50 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-400 font-medium">
                Verification Rejected
              </span>
            </div>
            <p className="text-red-600 mt-1">
              {auth.user.rejectionReason ||
                "Your verification was rejected. Please contact support or resubmit with correct documents."}
            </p>
          </div>
        );
      case "NOT_SUBMITTED":
      default:
        return null;
    }
  };

  // Don't show verification form for admins and auditors
  if (["ADMIN", "AUDITOR"].includes(auth.user?.role || "")) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#012970]">
            Account Verification
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {auth.user?.role === "ADMIN" ? "Administrator" : "Auditor"} account
            verification status
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-emerald-700 mr-2" />
            <span className="text-emerald-700 font-medium">
              {auth.user?.role === "ADMIN" ? "Administrator" : "Auditor"}{" "}
              Account
            </span>
          </div>
          <p className="text-emerald-600 mt-1">
            {auth.user?.role === "ADMIN" ? "Administrator" : "Auditor"} accounts
            are automatically verified and do not require document submission.
          </p>
        </div>
      </div>
    );
  }

  // Don't show form if verification is already verified
  if (auth.user?.verificationStatus === "VERIFIED") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#012970]">
            Account Verification
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Your account verification status
          </p>
        </div>
        {getVerificationStatus()}
      </div>
    );
  }

  // Don't show form if verification is pending review
  if (auth.user?.verificationStatus === "PENDING") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#012970]">
            Account Verification
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Your verification documents are under review
          </p>
        </div>
        {getVerificationStatus()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#012970]">
          Account Verification
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Submit your identity documents for verification to access all features
        </p>
      </div>

      {getVerificationStatus()}

      {error && (
        <div className="bg-red-50 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-500/30 text-emerald-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-gray-200 bg-white backdrop-blur-xl shadow-sm p-6 space-y-6"
      >
        <div className="bg-emerald-50 border border-emerald-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-emerald-700 mr-2" />
            <span className="text-emerald-700 font-medium">
              Document Requirements
            </span>
          </div>
          <ul className="text-emerald-600 mt-2 text-sm space-y-1">
            <li>• Provide at least one identity document with its number</li>
            <li>• Files must be in PDF, JPG, or PNG format</li>
            <li>• Maximum file size: 5MB per document</li>
            <li>• Ensure documents are clear and readable</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PAN Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#012970] flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              PAN Card
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 bg-white text-[#012970] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1] placeholder-gray-400"
                placeholder="ABCDE1234F"
                maxLength={10}
              />
              <p className="text-xs text-gray-600 mt-1">Format: ABCDE1234F</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload PAN Card
              </label>
              {files.panCard ? (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm text-[#012970]">
                      {files.panCard.name}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">
                      ({(files.panCard.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile("panCard")}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-slate-600 transition-colors">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange(e, "panCard")}
                    className="hidden"
                    id="panCard"
                  />
                  <label
                    htmlFor="panCard"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-700">
                      Click to upload PAN Card
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      PDF, JPG, PNG (Max 5MB)
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Aadhaar Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#012970] flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Aadhaar Card
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 bg-white text-[#012970] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1] placeholder-gray-400"
                placeholder="1234 5678 9012"
                maxLength={14}
              />
              <p className="text-xs text-gray-600 mt-1">
                12-digit Aadhaar number
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Aadhaar Card
              </label>
              {files.aadhaarCard ? (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm text-[#012970]">
                      {files.aadhaarCard.name}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">
                      ({(files.aadhaarCard.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile("aadhaarCard")}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-slate-600 transition-colors">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange(e, "aadhaarCard")}
                    className="hidden"
                    id="aadhaarCard"
                  />
                  <label
                    htmlFor="aadhaarCard"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-700">
                      Click to upload Aadhaar Card
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      PDF, JPG, PNG (Max 5MB)
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Driving License */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#012970] flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Driving License (Optional)
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number
              </label>
              <input
                type="text"
                name="dlNumber"
                value={formData.dlNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 bg-white text-[#012970] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1] placeholder-gray-400"
                placeholder="DL1420110012345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Driving License
              </label>
              {files.drivingLicense ? (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm text-[#012970]">
                      {files.drivingLicense.name}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">
                      ({(files.drivingLicense.size / 1024 / 1024).toFixed(2)}{" "}
                      MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile("drivingLicense")}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-slate-600 transition-colors">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange(e, "drivingLicense")}
                    className="hidden"
                    id="drivingLicense"
                  />
                  <label
                    htmlFor="drivingLicense"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-700">
                      Click to upload Driving License
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      PDF, JPG, PNG (Max 5MB)
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Passport */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#012970] flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Passport (Optional)
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passport Number
              </label>
              <input
                type="text"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 bg-white text-[#012970] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1] placeholder-gray-400"
                placeholder="A1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Passport
              </label>
              {files.passport ? (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm text-[#012970]">
                      {files.passport.name}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">
                      ({(files.passport.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile("passport")}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-slate-600 transition-colors">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange(e, "passport")}
                    className="hidden"
                    id="passport"
                  />
                  <label
                    htmlFor="passport"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-700">
                      Click to upload Passport
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      PDF, JPG, PNG (Max 5MB)
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200/50">
          <button
            type="submit"
            disabled={!canSubmit()}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${canSubmit()
              ? "bg-[#4154f1] text-white hover:bg-[#3346d8] shadow-lg shadow-blue-500/30"
              : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
              }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : auth.user?.verificationStatus === "REJECTED" ? (
              "Resubmit for Verification"
            ) : (
              "Submit for Verification"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserVerification;
