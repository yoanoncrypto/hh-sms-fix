import React from "react";

const BackgroundBlobs: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute -top-20 -left-20 w-[45vw] h-[45vw] rounded-full bg-[#EBCF35]/30 blur-3xl" />
      <div className="absolute -top-10 right-[-10vw] w-[40vw] h-[40vw] rounded-full bg-blue-500/25 blur-3xl" />
      <div className="absolute bottom-[-10vw] left-[20vw] w-[45vw] h-[45vw] rounded-full bg-emerald-500/20 blur-3xl" />
    </div>
  );
};

export default BackgroundBlobs;
