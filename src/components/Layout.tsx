import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";
import {
  Users,
  Upload,
  MessageSquare,
  Megaphone,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import logoDark from "../assets/logo-dark.png";
import LanguageSwitcher from "./LanguageSwitcher";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const tabs = [
    { id: "users", label: t("layoutTabs.users"), icon: Users, path: "/admin" },
    {
      id: "import",
      label: t("layoutTabs.import"),
      icon: Upload,
      path: "/admin/import",
    },
    {
      id: "sms",
      label: t("layoutTabs.sms"),
      icon: MessageSquare,
      path: "/admin/sms",
    },
    {
      id: "campaigns",
      label: t("layoutTabs.campaigns"),
      icon: Megaphone,
      path: "/admin/campaigns",
    },
  ];

  const handleTabChange = (tabId: string) => {
    setIsMobileMenuOpen(false);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      navigate(tab.path);
    }
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/admin") return "users";
    if (path.startsWith("/admin/import")) return "import";
    if (path.startsWith("/admin/sms")) return "sms";
    if (path.startsWith("/admin/campaigns")) return "campaigns";
    return "users";
  };

  const activeTab = getActiveTab();

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              title={t("layout.goToPublicSite")}
              className="relative inline-block cursor-pointer"
            >
              <img
                src={logoDark}
                alt="Logo"
                className="h-10 w-auto object-contain"
              />
              <span className="absolute right-[-10px] bottom-[-5px] bg-blue-600 text-white text-[8px] sm:text-[10px] font-semibold px-1 sm:px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                ADMIN
              </span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={toggleMobileMenu}
        />
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <button
                type="button"
                onClick={() => navigate("/")}
                title={t("layout.goToPublicSite")}
                className="relative inline-block cursor-pointer"
              >
                <img
                  src={logoDark}
                  alt="Logo"
                  className="h-14 w-auto object-contain"
                />
                <span className="absolute right-[-10px] bottom-[-5px] bg-blue-600 text-white text-[8px] sm:text-[10px] font-semibold px-1 sm:px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                  ADMIN
                </span>
              </button>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-900 border-r-2"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-150`}
                    style={{ minHeight: "44px" }}
                  >
                    <Icon
                      className={`${
                        activeTab === tab.id
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-500"
                      } mr-3 h-5 w-5 flex-shrink-0`}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <div className="flex-shrink-0 px-2 space-y-2">
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full text-left transition-colors duration-150"
                style={{ minHeight: "44px" }}
              >
                <LogOut className="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5 flex-shrink-0" />
                {t("layout.signOut")}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <div
          className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out`}
        >
          <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <button
                type="button"
                onClick={() => navigate("/")}
                title={t("layout.goToPublicSite")}
                className="relative inline-block cursor-pointer"
              >
                <img
                  src={logoDark}
                  alt="Logo"
                  className="h-14 w-auto object-contain"
                />
                <span className="absolute right-[-8px] bottom-[-5px] bg-blue-600 text-white text-[8px] sm:text-[10px] font-semibold px-1 sm:px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                  ADMIN
                </span>
              </button>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-900 border-r-2 border-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-150`}
                    style={{ minHeight: "44px" }}
                  >
                    <Icon
                      className={`${
                        activeTab === tab.id
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-500"
                      } mr-3 h-5 w-5 flex-shrink-0`}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <div className="flex-shrink-0 px-2 space-y-2">
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full text-left transition-colors duration-150"
                style={{ minHeight: "44px" }}
              >
                <LogOut className="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5 flex-shrink-0" />
                {t("layout.signOut")}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-500">
              {t("layout.footer", { year: new Date().getFullYear() })}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Layout;
