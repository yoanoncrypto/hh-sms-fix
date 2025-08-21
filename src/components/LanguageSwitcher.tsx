import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLanguage = i18n.language === "en" ? "bg" : "en";
    i18n.changeLanguage(newLanguage);
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === "en"
      ? t("languageSwitcher.english")
      : t("languageSwitcher.bulgarian");
  };

  const getLanguageSwitchTitle = () => {
    return i18n.language === "en"
      ? t("languageSwitcher.switchToBulgarian")
      : t("languageSwitcher.switchToEnglish");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full text-left transition-colors duration-150"
      title={getLanguageSwitchTitle()}
      style={{ minHeight: "44px" }}
    >
      <Globe className="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5 flex-shrink-0" />
      {getCurrentLanguageLabel()}
    </button>
  );
};

export default LanguageSwitcher;
