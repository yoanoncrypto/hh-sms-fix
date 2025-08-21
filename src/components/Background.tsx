import React from "react";

const Background: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-20"
      style={{
        backgroundImage: `
          radial-gradient(800px circle at 20% 10%, rgba(235,207,53,0.10), transparent 60%),
          radial-gradient(900px circle at 80% 20%, rgba(59,130,246,0.12), transparent 55%),
          radial-gradient(700px circle at 50% 85%, rgba(34,197,94,0.10), transparent 60%),
          linear-gradient(180deg, #0a0a0a 0%, #111 35%, #161616 100%)
        `,
        backgroundBlendMode: "screen, screen, screen, normal"
      }}
      aria-hidden="true"
    />
  );
};

export default Background;
