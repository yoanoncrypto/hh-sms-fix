import React, { useState, useEffect, useRef } from "react";
import { Home, Globe, CreditCard } from "lucide-react";

interface Route {
  key: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
}

interface TabBarProps {
  verticalPadding?: number;
  topPadding?: number;
  inactiveTintColor?: string;
  tabBarBackground?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  activeColors?: string | string[];
  activeTabBackgrounds?: string | string[];
  routes?: Route[];
  onTabChange?: (route: Route) => void;
}

const TabBar: React.FC<TabBarProps> = ({
  verticalPadding = 16,
  topPadding = 12,
  inactiveTintColor = "#9CA3AF",
  tabBarBackground = "#1F2937",
  showIcon = true,
  showLabel = true,
  activeColors = "#FFFFFF",
  activeTabBackgrounds = "#374151",
  routes = [
    { key: "home", name: "Home", icon: Home },
    { key: "globe", name: "Globe", icon: Globe },
    { key: "card", name: "Card", icon: CreditCard },
  ],
  onTabChange = () => {},
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dotStyle, setDotStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTabBackground = Array.isArray(activeTabBackgrounds)
    ? activeTabBackgrounds[activeIndex] || "#374151"
    : activeTabBackgrounds;

  const activeColor = Array.isArray(activeColors)
    ? activeColors[activeIndex] || "#FFFFFF"
    : activeColors;

  const updateDotPosition = () => {
    if (tabRefs.current[activeIndex] && containerRef.current) {
      const activeTab = tabRefs.current[activeIndex];
      const container = containerRef.current;

      if (activeTab && container) {
        const left = activeTab.offsetLeft;
        const width = activeTab.offsetWidth;
        const containerHeight = container.offsetHeight;
        const paddingOffset = 10; // 5px top + 5px bottom

        setDotStyle({
          left: `${left}px`,
          width: `${width}px`,
          height: `${containerHeight - paddingOffset}px`,
          top: `5px`,
          opacity: 1,
        });
      }
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateDotPosition, 50);
    return () => clearTimeout(timer);
  }, [activeIndex, topPadding]);

  useEffect(() => {
    // Update on window resize
    const handleResize = () => updateDotPosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex]);

  const handleTabPress = (index: number, route: Route) => {
    setActiveIndex(index);
    onTabChange(route);
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: tabBarBackground,
          borderRadius: "50px",
          paddingLeft: `${verticalPadding}px`,
          paddingRight: `${verticalPadding}px`,
          paddingTop: `${topPadding}px`,
          paddingBottom: `${topPadding}px`,
          boxShadow:
            "0 10px 25px rgba(0, 0, 0, 0.2), 0 6px 10px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          minWidth: "400px",
          maxWidth: "600px",
          width: "auto",
        }}
      >
        {/* Animated background dot */}
        <div
          style={{
            position: "absolute",
            backgroundColor: activeTabBackground,
            borderRadius: "50px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 1,
            pointerEvents: "none",
            ...dotStyle,
          }}
        />

        {/* Tab buttons */}
        {routes.map((route, routeIndex) => {
          const focused = routeIndex === activeIndex;
          const IconComponent = route.icon;
          const tintColor = focused ? activeColor : inactiveTintColor;
          const label = route.name;

          return (
            <button
              key={route.key}
              ref={(el) => (tabRefs.current[routeIndex] = el)}
              onClick={() => handleTabPress(routeIndex, route)}
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                background: "transparent",
                border: "none",
                borderRadius: "50px",
                padding: "12px 16px",
                cursor: "pointer",
                position: "relative",
                zIndex: 2,
                transition: "all 0.2s ease",
                flex: focused ? Math.max(1, label.length / 8 + 0.5) : 1,
                minWidth: focused && showLabel ? "auto" : "50px",
                outline: "none",
                whiteSpace: "nowrap",
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
              {showIcon && IconComponent && (
                <IconComponent
                  size={20}
                  color={tintColor}
                  style={{
                    marginRight: focused && showLabel ? "8px" : "0",
                    flexShrink: 0,
                  }}
                />
              )}
              {showLabel && focused && (
                <span
                  style={{
                    color: activeColor,
                    fontWeight: "600",
                    fontSize: "14px",
                    userSelect: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Global styles */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .tab-bar-container {
            top: 10px !important;
            right: 10px !important;
            left: 10px !important;
            maxWidth: calc(100vw - 20px) !important;
          }
        }
      `}</style>
    </>
  );
};

export default TabBar;
