import React from "react";

export const Boundary = ({ children }: { children: React.ReactNode }) => {
  return <div className="border-t-2 border-gray-300 pt-3">{children}</div>;
};
