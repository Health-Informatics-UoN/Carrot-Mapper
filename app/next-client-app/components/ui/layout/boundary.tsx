import React from "react";

export const Boundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="rounded-lg border-2 border-dashed p-3">{children}</div>
  );
};
