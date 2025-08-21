import React, { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { useUsers } from "../hooks/useUsers";
import * as XLSX from "xlsx";
import {
  validatePhoneNumber,
  normalizePhoneNumber,
  detectCountryFromPhone,
} from "../utils/phoneValidation";
import { useTranslation } from "react-i18next";

const BulkImport: React.FC = () => {
  const { t } = useTranslation();
  const { bulkAddUsers, bulkAddUsersWithData } = useUsers();
  const [dragActive, setDragActive] = useState(false);
  const [importData, setImportData] = useState("");
  const [fileData, setFileData] = useState<
    Array<{ phone: string; username?: string }>
  >([]);
  const [fileName, setFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<{
    totalRows: number;
    validNumbers: Array<{ phone: string; username?: string }>;
    invalidNumbers: Array<{
      phone: string;
      username?: string;
      error: string;
      row: number;
    }>;
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setTemplateError(null); // Clear previous template errors
    setImportResults(null); // Clear previous import results
    setFileName(file.name);

    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.trim().split("\n");
        const parsedData = lines
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        // Deduplicate phone numbers
        const uniquePhones = Array.from(new Set(parsedData));
        const finalParsedData = uniquePhones.map((phone) => ({ phone }));

        setFileData(finalParsedData);
      };
      reader.readAsText(file);
    } else if (fileExtension === "xlsx") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (json.length === 0) {
            setTemplateError("The Excel file is empty.");
            setFileData([]);
            setValidationResults(null);
            return;
          }

          // Get headers and convert to lowercase for case-insensitive matching
          const headers = (json[0] as string[]).map(
            (h) => h?.toString().toLowerCase() || ""
          );
          const usernameColIndex = headers.findIndex(
            (h) => h.toLowerCase() === "name"
          );
          const phoneColIndex = headers.findIndex(
            (h) => h.toLowerCase() === "phone"
          );

          if (usernameColIndex === -1 || phoneColIndex === -1) {
            setTemplateError(
              `Invalid Excel template. Expected columns: "name" and "phone". Found columns: ${headers.join(
                ", "
              )}`
            );
            setFileData([]);
            setValidationResults(null);
            return;
          }

          // Process all rows and validate phone numbers
          const validNumbers: Array<{ phone: string; username?: string }> = [];
          const invalidNumbers: Array<{
            phone: string;
            username?: string;
            error: string;
            row: number;
          }> = [];
          const seenPhones = new Set<string>(); // For deduplication
          const totalRows = json.length - 1; // Exclude header row

          for (let i = 1; i < json.length; i++) {
            // Start from 1 to skip header row
            const row = json[i] as string[];
            const phoneNumber = row[phoneColIndex]?.toString().trim() || "";
            const username = row[usernameColIndex]?.toString().trim() || "";

            // Skip completely empty rows
            if (!phoneNumber && !username) {
              continue;
            }

            // Validate phone number is provided
            if (!phoneNumber) {
              invalidNumbers.push({
                phone: "",
                username: username || undefined,
                error: "Phone number is required",
                row: i + 1, // Excel row number (1-based)
              });
              continue;
            }

            // Check for duplicates within the file
            if (seenPhones.has(phoneNumber)) {
              invalidNumbers.push({
                phone: phoneNumber,
                username: username || undefined,
                error: "Duplicate phone number in file",
                row: i + 1,
              });
              continue;
            }

            // Validate phone number format
            if (!validatePhoneNumber(phoneNumber)) {
              invalidNumbers.push({
                phone: phoneNumber,
                username: username || undefined,
                error: "Invalid phone number format",
                row: i + 1,
              });
              continue;
            }

            // Normalize and detect country
            const normalizedPhone = normalizePhoneNumber(phoneNumber);
            const country = detectCountryFromPhone(normalizedPhone);

            if (!country) {
              invalidNumbers.push({
                phone: phoneNumber,
                username: username || undefined,
                error: "Unable to detect country from phone number",
                row: i + 1,
              });
              continue;
            }

            // Phone number is valid
            validNumbers.push({
              phone: normalizedPhone,
              username: username || undefined,
            });
            seenPhones.add(phoneNumber);
          }

          // Set validation results
          setValidationResults({
            totalRows,
            validNumbers,
            invalidNumbers,
          });

          // Set file data to only valid numbers
          setFileData(validNumbers);

          // Clear any previous template errors
          setTemplateError(null);
        } catch (error) {
          setTemplateError(
            "Failed to parse Excel file. Please ensure it is a valid .xlsx format."
          );
          setFileData([]);
          setValidationResults(null);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleCancelFileImport = () => {
    setFileData([]);
    setFileName("");
    setTemplateError(null);
    setImportResults(null);
    setValidationResults(null);
  };

  const handleImport = async () => {
    const hasFileData = fileData.length > 0;
    const hasManualData = importData.trim().length > 0;

    if (!hasFileData && !hasManualData) return;

    setIsImporting(true);
    setImportResults(null);

    try {
      let usersToImport: Array<{ phone: string; username?: string }>;

      if (hasFileData) {
        usersToImport = fileData;
      } else {
        const lines = importData.trim().split("\n");
        const uniquePhones = Array.from(
          new Set(
            lines.map((line) => line.trim()).filter((line) => line.length > 0)
          )
        );
        usersToImport = uniquePhones.map((phone) => ({ phone }));
      }

      const result = await bulkAddUsersWithData(usersToImport);
      setImportResults(result);

      // Clear input if successful
      if (result.successful > 0) {
        setImportData("");
        setFileData([]);
        setFileName("");
      }
    } catch (error) {
      setImportResults({
        total: 0,
        successful: 0,
        failed: 0,
        created: 0,
        updated: 0,
        errors: [
          {
            phone: "N/A",
            error: error instanceof Error ? error.message : "Import failed",
          },
        ],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const sampleData = `+359888123456
0886022721
088602271
+380671234567
+48123456789`;

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["name", "phone"],
      ["John Doe", "+359888123456"],
      ["Jane Smith", "0886022721"],
      ["", "+380671234567"], // Example with missing name
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "user_import_template");
    XLSX.writeFile(wb, "user_import_template.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="mobile-heading font-bold text-gray-900">
          {t("bulkImport.title")}
        </h2>
        <button
          onClick={downloadTemplate}
          className="mobile-button bg-gray-600 text-white hover:bg-gray-700"
        >
          {t("bulkImport.downloadTemplate")}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Import Form */}
        <div className="space-y-6">
          <div className="mobile-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("bulkImport.importPhoneNumbers")}
            </h3>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("bulkImport.uploadFile")}
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        {t("bulkImport.dropFile")}
                        <span className="text-blue-600">
                          {t("bulkImport.browse")}
                        </span>
                      </span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file" // Changed to accept .xlsx and .txt
                        accept=".xlsx,.txt"
                        className="sr-only"
                        onChange={(e) =>
                          e.target.files?.[0] && handleFile(e.target.files[0])
                        }
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("bulkImport.excelFile")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* File Data Preview */}
            {fileData.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-blue-900">
                    {t("bulkImport.fileLoaded")}: {fileName}
                  </h4>
                  <button
                    onClick={handleCancelFileImport}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {t("cancel")}
                  </button>
                </div>
                <p className="text-sm text-blue-800 mb-2">
                  {t("bulkImport.readyToImport", {
                    count: fileData.length,
                  })}
                  {fileData.some((item) => item.username) && (
                    <span> ({t("bulkImport.includingNames")})</span>
                  )}
                </p>
                {validationResults && (
                  <div className="mt-2 text-xs text-blue-700">
                    <p>
                      {t("bulkImport.totalRowsProcessed")}:{" "}
                      {validationResults.totalRows}
                    </p>
                    <p>
                      {t("bulkImport.validNumbers")}:{" "}
                      {validationResults.validNumbers.length}
                    </p>
                    <p>
                      {t("bulkImport.invalidNumbers")}:{" "}
                      {validationResults.invalidNumbers.length}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Validation Results */}
            {validationResults &&
              validationResults.invalidNumbers.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-900 mb-2">
                        {t("bulkImport.validationErrors", {
                          count: validationResults.invalidNumbers.length,
                        })}
                      </h4>
                      <div className="max-h-32 overflow-y-auto">
                        <ul className="text-sm text-red-800 space-y-1">
                          {validationResults.invalidNumbers
                            .slice(0, 10)
                            .map((invalid, index) => (
                              <li key={index} className="flex items-start">
                                <span className="font-mono text-xs bg-red-100 px-1 rounded mr-2 flex-shrink-0">
                                  Row {invalid.row}
                                </span>
                                <span className="flex-1">
                                  {invalid.phone
                                    ? `"${invalid.phone}"`
                                    : "Empty phone"}
                                  {invalid.username && ` (${invalid.username})`}
                                  : {invalid.error}
                                </span>
                              </li>
                            ))}
                          {validationResults.invalidNumbers.length > 10 && (
                            <li className="text-xs text-red-700 italic">
                              {t("bulkImport.moreErrors", {
                                count:
                                  validationResults.invalidNumbers.length - 10,
                              })}
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Manual Input */}
            <div
              className={`mb-6 ${
                fileData.length > 0 ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {fileData.length > 0
                  ? t("bulkImport.manualInput")
                  : t("bulkImport.pastePhoneNumbers")}
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={t("bulkImport.enterPhoneNumbers")}
                rows={6}
                className={`mobile-input ${
                  fileData.length > 0 ? "bg-gray-100" : ""
                }`}
                disabled={fileData.length > 0}
              />
            </div>

            {templateError && (
              <div className="flex items-center p-4 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-600" />
                <p className="text-sm text-red-800">{templateError}</p>
              </div>
            )}

            {(fileData.length > 0 || (importData.trim() && !templateError)) && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-8">
                <p className="text-sm text-blue-800">
                  {t("bulkImport.readyToImport", {
                    count:
                      fileData.length > 0
                        ? fileData.length
                        : importData
                            .split("\n")
                            .filter((line) => line.trim().length > 0).length,
                  })}
                  {fileData.length > 0
                    ? t("bulkImport.entries", {
                        count: fileData.length,
                      })
                    : t("bulkImport.entries", {
                        count: importData
                          .split("\n")
                          .filter((line) => line.trim().length > 0).length,
                      })}
                  {validationResults &&
                    validationResults.invalidNumbers.length > 0 && (
                      <span className="text-red-600 ml-2">
                        (
                        {t("bulkImport.invalidEntries", {
                          count: validationResults.invalidNumbers.length,
                        })}
                        )
                      </span>
                    )}
                </p>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={
                (!importData.trim() && fileData.length === 0) || isImporting
              }
              className="w-full mobile-button justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">
                    {t("bulkImport.importing")}
                  </span>
                  <span className="sm:hidden">{t("bulkImport.importing")}</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {fileData.length > 0
                      ? t("bulkImport.importFromFile")
                      : t("bulkImport.importUsers")}
                  </span>
                  <span className="sm:hidden">{t("bulkImport.import")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions and Results */}
        <div className="space-y-6">
          {/* Instructions */}
          <div className="mobile-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("bulkImport.importInstructions")}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                    1
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    {t("bulkImport.supportedFormats")}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t("bulkImport.supportedFormatsDescription")}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                    2
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    {t("bulkImport.autoDetection")}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t("bulkImport.autoDetectionDescription")}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                    3
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    {t("bulkImport.uploadOrPaste")}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t("bulkImport.uploadOrPasteDescription")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {t("bulkImport.sampleFormat")}
              </h4>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {sampleData}
              </pre>
            </div>
          </div>

          {/* Import Results */}
          {importResults && (
            <div className="mobile-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t("bulkImport.importResults")}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">
                      {t("bulkImport.totalProcessed")}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-blue-900">
                    {importResults.total.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-900">
                      {t("bulkImport.successfullyImported")}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-green-900">
                    {importResults.successful.toLocaleString()}
                  </span>
                </div>

                {importResults.created > 0 && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-900">
                        {t("bulkImport.newUsersCreated")}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-green-900">
                      {importResults.created.toLocaleString()}
                    </span>
                  </div>
                )}

                {importResults.updated > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">
                        {t("bulkImport.usersUpdated")}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-blue-900">
                      {importResults.updated.toLocaleString()}
                    </span>
                  </div>
                )}

                {importResults.failed > 0 && (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <X className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-900">
                        {t("bulkImport.failed")}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-red-900">
                      {importResults.failed.toLocaleString()}
                    </span>
                  </div>
                )}

                {importResults.errors.length > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-900 mb-2">
                          {t("bulkImport.errors")}
                        </h4>
                        <ul className="text-sm text-yellow-800 space-y-1 max-h-32 overflow-y-auto">
                          {importResults.errors
                            .slice(0, 10)
                            .map((error: any, index: number) => (
                              <li key={index}>
                                • {error.phone}
                                {error.name ? ` (${error.name})` : ""}:{" "}
                                {error.error}
                              </li>
                            ))}
                          {importResults.errors.length > 10 && (
                            <li className="text-xs text-yellow-700">
                              {t("bulkImport.moreErrors", {
                                count: importResults.errors.length - 10,
                              })}
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
