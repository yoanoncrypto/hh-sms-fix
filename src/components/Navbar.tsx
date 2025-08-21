import React from "react";
import { Home, Globe } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const routes = [
    { key: "home", name: t("nav.home"), icon: Home, path: "/" },
    {
      key: "discover",
      name: t("nav.discover"),
      icon: Globe,
      path: "/discover",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 sm:top-5 sm:bottom-auto sm:right-5 sm:left-auto sm:translate-x-0 z-50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 transform transition-all duration-300 ${className}`}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderRadius: "50px",
        padding: "8px",
        minWidth: "200px",
        maxWidth: "300px",
        width: "auto",
        zIndex: 1000,
        backgroundColor: "#0000009c",
      }}
    >
      {routes.map((route) => {
        const active = isActive(route.path);
        const IconComponent = route.icon;

        return (
          <button
            key={route.key}
            onClick={() => navigate(route.path)}
            className={`flex flex-row justify-center items-center border-none cursor-pointer relative transition-all duration-300 outline-none whitespace-nowrap ${
              active
                ? "bg-gray-600/30 backdrop-blur-sm"
                : "bg-transparent hover:bg-gray-600/20"
            }`}
            style={{
              borderRadius: "50px",
              padding: "12px 16px",
              flex: active ? Math.max(1, route.name.length / 8 + 0.5) : 1,
              minWidth: active ? "auto" : "50px",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.95)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <IconComponent
              size={20}
              className={`${active ? "text-white" : "text-gray-400"} ${
                active ? "mr-2" : "mr-0"
              } flex-shrink-0`}
            />
            {active && (
              <span className="text-white font-semibold text-sm select-none overflow-hidden text-ellipsis">
                {route.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Navbar;
