"use client";

import { useEffect, useState } from "react";

interface DownloadBtnProps {
  name: string;
  data: string;
  type: "image/svg+xml" | "application/json" | "text/csv";
}

export function DownloadBtn({ name, data, type }: DownloadBtnProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    const createDownloadUrl = () => {
      let blob: Blob;
      if (type === "image/svg+xml") {
        const parser = new DOMParser();
        const diagram = parser.parseFromString(data, type);
        const svgElement = diagram.getElementsByTagName("svg")[0];
        if (svgElement) {
          const svgString = svgElement.outerHTML;
          blob = new Blob([svgString], { type: type });
        } else {
          console.error("Invalid SVG data");
          return;
        }
      } else {
        blob = new Blob([data], { type: type });
      }
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    };

    createDownloadUrl();

    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [data, type, downloadUrl]);

  return (
    <div>
      {downloadUrl ? (
        <a href={downloadUrl} download={name}>
          {name}
        </a>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
