import React from "react";

interface PrahariLogoProps {
  className?: string;
  size?: number | string;
  color?: string; // Kept for backwards compatibility if needed, but ignored for the image
}

export const PrahariLogo: React.FC<PrahariLogoProps> = ({
  className = "",
  size = 24,
}) => {
  return (
    <img
      src="/7f33d9fe-f700-459f-831a-446ec8b1f733.png"
      alt="Prahari AI Logo"
      width={size}
      height={size}
      className={`${className} object-contain`}
      style={{ width: size, height: size }}
      referrerPolicy="no-referrer"
    />
  );
};

export default PrahariLogo;
