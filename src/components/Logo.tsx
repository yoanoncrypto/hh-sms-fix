import { Settings } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../hooks/useAuth";

interface LogoProps {
  className?: string;
  /**
   * fixed: preserves current floating, fixed position behavior
   * inline: renders as a normal inline element for use inside headers/containers
   */
  variant?: "fixed" | "inline";
  /** Width in pixels when using inline variant. If not provided, image will size to container */
  inlineWidthPx?: number;
  /** Whether to show the admin button next to the logo (inline only) */
  showAdminButton?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  variant = "fixed",
  inlineWidthPx,
  className,
  showAdminButton = true
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (variant === "inline") {
    return (
      <div
        className={className ?? ""}
        style={{ display: "flex", alignItems: "center", gap: "12px" }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="cursor-pointer"
          title="Home"
          style={{ lineHeight: 0 }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{
              width: "100%",
              height: "auto",
              maxWidth: inlineWidthPx ? `${inlineWidthPx}px` : "100%"
            }}
          />
        </button>
        {showAdminButton && user && (
          <button
            onClick={() => navigate("/admin")}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 text-white"
            title="Admin Panel"
            style={{ lineHeight: 0 }}
          >
            <Settings className="w-6 h-6" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`logo-fixed-mobile ${className ?? ""}`}
      style={{
        position: "fixed",
        left: "20px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        width: "auto",
        justifyContent: "flex-start",
        gap: "20px"
      }}
    >
      <div onClick={() => navigate("/")}>
        <img
          src={logo}
          alt="Logo"
          style={{
            width: "200px"
          }}
        />
      </div>

      {showAdminButton && user && (
        <button
          onClick={() => navigate("/admin")}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 text-white"
          title="Admin Panel"
        >
          <Settings className="w-6 h-6" />
        </button>
      )}

      <style>
        {`
          @media (max-width: 640px) {
            .logo-fixed-mobile {
              left: 0 !important;
              width: 100% !important;
              justify-content: center !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Logo;
