import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { countries } from "../data/countries";
import { useUsers } from "../hooks/useUsers";
import { User } from "../types";
import {
  detectCountryFromPhone,
  normalizePhoneNumber,
  validatePhoneNumber
} from "../utils/phoneValidation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const { allUsers, loading, error, deleteUsers, addUser, updateUser } =
    useUsers();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectAllMode, setSelectAllMode] = useState<"none" | "page" | "all">(
    "none"
  );

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    phoneNumber: "",
    email: "",
    name: "",
    country: "",
    status: "active" as "active" | "inactive" | "blocked"
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Frontend filtering and pagination
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          user.phoneNumber.toLowerCase().includes(searchLower) ||
          (user.name && user.name.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [allUsers, searchTerm]);

  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Paginated users for current page
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectAllMode("none");
    setSelectedUsers([]);
  }, [searchTerm]);

  // Reset selections when page changes
  React.useEffect(() => {
    if (selectAllMode === "page") {
      setSelectedUsers(paginatedUsers.map((user) => user.id));
    } else if (selectAllMode === "none") {
      setSelectedUsers([]);
    }
    // Don't reset when selectAllMode is 'all' - keep all selections
  }, [currentPage, paginatedUsers, selectAllMode]);

  const resetForm = () => {
    setFormData({
      phoneNumber: "",
      email: "",
      name: "",
      country: "",
      status: "active"
    });
    setFormErrors({});
    setEditingUser(null);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid phone number";
    }

    // Email validation (optional)
    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    // Name validation (optional but recommended)
    if (!formData.name.trim()) {
      errors.name = "Name is recommended for better user management";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const normalizedPhone = normalizePhoneNumber(formData.phoneNumber);
      const detectedCountry =
        detectCountryFromPhone(normalizedPhone) ||
        formData.country ||
        "Unknown";

      await addUser({
        phoneNumber: normalizedPhone,
        email: formData.email.trim() || undefined,
        name: formData.name.trim() || undefined,
        country: detectedCountry,
        status: formData.status
      });

      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : "Failed to add user"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !editingUser) return;

    setIsSubmitting(true);
    try {
      const normalizedPhone = normalizePhoneNumber(formData.phoneNumber);
      const detectedCountry =
        detectCountryFromPhone(normalizedPhone) ||
        formData.country ||
        "Unknown";

      await updateUser(editingUser.id, {
        phoneNumber: normalizedPhone,
        email: formData.email.trim() || undefined,
        name: formData.name.trim() || undefined,
        country: detectedCountry,
        status: formData.status
      });

      setShowEditModal(false);
      resetForm();
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : "Failed to update user"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      phoneNumber: user.phoneNumber,
      email: user.email || "",
      name: user.name || "",
      country: user.country,
      status: user.status
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openViewModal = (user: User) => {
    // Navigate to user details page instead of showing modal
    navigate(`/admin/users/${user.id}`);
  };

  const handleSelectAll = () => {
    if (selectAllMode === "none") {
      // Select current page
      setSelectAllMode("page");
      setSelectedUsers(paginatedUsers.map((user) => user.id));
    } else if (selectAllMode === "page") {
      // Select all filtered users
      setSelectAllMode("all");
      setSelectedUsers(filteredUsers.map((user) => user.id));
    } else {
      // Deselect all
      setSelectAllMode("none");
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSelection = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];

      // Update select all mode based on selection
      if (newSelection.length === 0) {
        setSelectAllMode("none");
      } else if (
        newSelection.length === paginatedUsers.length &&
        paginatedUsers.every((user) => newSelection.includes(user.id))
      ) {
        if (newSelection.length === filteredUsers.length) {
          setSelectAllMode("all");
        } else {
          setSelectAllMode("page");
        }
      } else {
        setSelectAllMode("none");
      }

      return newSelection;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;

    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await deleteUsers(selectedUsers);
      setSelectedUsers([]);
      setSelectAllMode("none");
      setShowBulkDeleteModal(false);
    } catch (err) {
      console.error("Delete users error:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete users: Unknown error occurred"
      );
    }
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false);
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = allUsers.find((user) => user.id === userId);
    if (!userToDelete) return;

    setDeletingUser(userToDelete);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;

    try {
      await deleteUsers([deletingUser.id]);
      setShowDeleteModal(false);
      setDeletingUser(null);
    } catch (err) {
      console.error("Delete user error:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete user: Unknown error occurred"
      );
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingUser(null);
  };

  const handleExportSelected = () => {
    if (selectedUsers.length === 0) return;

    // Get selected users data
    const selectedUsersData = allUsers.filter((user) =>
      selectedUsers.includes(user.id)
    );

    // Prepare data for Excel export
    const exportData = selectedUsersData.map((user) => ({
      Name: user.name || "No name",
      Phone: user.phoneNumber
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");

    // Set column widths for better formatting
    ws["!cols"] = [
      { wch: 25 }, // Name column width
      { wch: 20 } // Phone column width
    ];

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const filename = `users_export_${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setSelectAllMode("none");
    setSelectedUsers([]);
  };

  const getCountryFlag = (countryCode: string) => {
    return countries.find((c) => c.code === countryCode)?.flag || "🌍";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading users: {error}</p>
        <p className="text-sm text-red-600 mt-2">
          Please make sure you have connected to Supabase and set up the
          database.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("users.title")}
        </h2>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>{t("users.addUser")}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                {t("users.totalUsers")}
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                {allUsers.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="h-5 w-5 sm:h-6 sm:w-6 bg-green-400 rounded-full"></div>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                {t("users.active")}
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                {allUsers
                  .filter((u) => u.status === "active")
                  .length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="h-5 w-5 sm:h-6 sm:w-6 bg-yellow-400 rounded-full"></div>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                {t("users.inactive")}
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                {allUsers
                  .filter((u) => u.status === "inactive")
                  .length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <div className="h-5 w-5 sm:h-6 sm:w-6 bg-red-400 rounded-full"></div>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                {t("users.blocked")}
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                {allUsers
                  .filter((u) => u.status === "blocked")
                  .length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="space-y-4">
          {/* Search Field */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("users.searchUsers")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t("users.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                style={{ fontSize: "16px" }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-1">
                {t("users.foundUsers", { count: totalCount, searchTerm })}"
              </p>
            )}
          </div>
        </div>

        {/* Selection Info and Actions */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            {selectedUsers.length > 0 && (
              <span className="text-sm font-medium text-blue-800 bg-blue-50 px-2 py-1 rounded">
                {t("users.selected", { count: selectedUsers.length })}
                {selectAllMode === "all" && ` (${t("users.filtered")})`}
              </span>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportSelected}
                className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <Download className="h-3 w-3 mr-1" />
                {t("users.exportUsers")}
              </button>
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t("delete")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Table Header with pagination info */}
        <div className="px-3 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-sm text-gray-700 w-full sm:w-auto">
            {t("users.showingResults", {
              start: (currentPage - 1) * itemsPerPage + 1,
              end: Math.min(currentPage * itemsPerPage, totalCount),
              total: totalCount
            })}
            {totalCount !== allUsers.length && ` (${t("users.filtered")})`}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm text-gray-700 whitespace-nowrap">
                {t("users.itemsPerPage")}:
              </label>
              <Select
                onValueChange={(value) =>
                  handleItemsPerPageChange(Number(value))
                }
                value={itemsPerPage.toString()}
              >
                <SelectTrigger className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-20 sm:w-24 h-10">
                  <SelectValue placeholder={t("users.selectANumber")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {paginatedUsers.map((user) => (
            <div
              key={user.id}
              className="border-b border-gray-200 p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.name || "No name"}
                        </div>
                        {user.email && (
                          <div className="text-sm text-gray-500 truncate">
                            {user.email}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 text-ellipsis w-[50vw] overflow-hidden">
                          {user.phoneNumber}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="mr-2">
                            {getCountryFlag(user.country)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {user.country}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            user.status
                          )}`}
                        >
                          {user.status}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openViewModal(user)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View user"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-yellow-600 hover:text-yellow-800 p-1"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <div className="flex flex-col items-start gap-1">
                    <input
                      type="checkbox"
                      checked={selectAllMode !== "none"}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate =
                            selectAllMode === "page" &&
                            filteredUsers.length > paginatedUsers.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {selectAllMode === "page" &&
                      filteredUsers.length > paginatedUsers.length && (
                        <button
                          onClick={handleSelectAll}
                          className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                        >
                          {t("users.selectAll", {
                            count: filteredUsers.length
                          })}
                        </button>
                      )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("users.user")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("users.phone")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("users.country")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("users.status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("users.created")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("users.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || ""}
                      </div>
                      {user.email && (
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 ">
                    {user.phoneNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className="flex items-center">
                      <span className="mr-2">
                        {getCountryFlag(user.country)}
                      </span>
                      {user.country}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openViewModal(user)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View user"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-yellow-600 hover:text-yellow-800 p-1"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {t("users.noUsers")}
            </h3>
            <p className="text-gray-600">
              {totalCount === 0 && allUsers.length === 0
                ? t("users.noUsersSubtitle")
                : t("users.noUsersFiltered")}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap w-full">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("previous")}
              </button>

              <div className="flex flex-wrap items-center gap-1">
                {/* Show page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 h-10 min-w-[44px] text-sm font-medium rounded-lg transition-colors duration-200 ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {t("next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>

            <div className="text-sm text-gray-700">
              {t("users.totalUsersCount", {
                count: totalCount
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          style={{
            marginTop: "0px"
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("users.addNewUser")}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.phoneNumber")} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="+359888123456"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.phoneNumber ? "border-red-300" : ""
                    }`}
                  />
                  {formErrors.phoneNumber && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.name")}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.name ? "border-red-300" : ""
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.email")}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.email ? "border-red-300" : ""
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.status")}
                  </label>
                  <Select
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        status: value as "active" | "inactive" | "blocked"
                      })
                    }
                    value={formData.status}
                  >
                    <SelectTrigger className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue placeholder={t("users.selectAStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        {t("users.active")}
                      </SelectItem>
                      <SelectItem value="inactive">
                        {t("users.inactive")}
                      </SelectItem>
                      <SelectItem value="blocked">
                        {t("users.blocked")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formErrors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{formErrors.submit}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    style={{ minHeight: "44px" }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    style={{ minHeight: "44px" }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t("users.adding")}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t("users.addUser")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          style={{
            marginTop: "0px"
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("users.editUser")}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.phoneNumber")} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="+359888123456"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.phoneNumber ? "border-red-300" : ""
                    }`}
                  />
                  {formErrors.phoneNumber && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.name")}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.name ? "border-red-300" : ""
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.email")}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.email ? "border-red-300" : ""
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.status")}
                  </label>
                  <Select
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        status: value as "active" | "inactive" | "blocked"
                      })
                    }
                    value={formData.status}
                  >
                    <SelectTrigger className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue placeholder={t("users.selectAStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        {t("users.active")}
                      </SelectItem>
                      <SelectItem value="inactive">
                        {t("users.inactive")}
                      </SelectItem>
                      <SelectItem value="blocked">
                        {t("users.blocked")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formErrors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{formErrors.submit}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    style={{ minHeight: "44px" }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    style={{ minHeight: "44px" }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t("users.updating")}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t("save")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingUser && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          style={{
            marginTop: "0px"
          }}
          onClick={cancelDelete}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("users.confirmDeletion")}
                </h2>
                <button
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-800 mb-4">
                {t("users.deleteUserConfirm", {
                  name: deletingUser.name || deletingUser.phoneNumber
                })}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          style={{
            marginTop: "0px"
          }}
          onClick={cancelBulkDelete}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("users.confirmBulkDeletion")}
                </h2>
                <button
                  onClick={cancelBulkDelete}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-800 mb-4">
                {selectAllMode === "all"
                  ? t("users.confirmBulkDeletionMessage", {
                      count: selectedUsers.length
                    })
                  : t("users.confirmBulkDeletionMessage", {
                      count: selectedUsers.length
                    })}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelBulkDelete}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={confirmBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
