"use client";

import { Loading } from "@/components/ui/loading-indicator";
import { useEffect, useState } from "react";

interface GetFileProps {
  name: string;
  data: string;
  variant: "button" | "diagram";
  type: "image/svg+xml" | "application/json" | "text/csv";
}

export function GetFile({ name, data, variant, type }: GetFileProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
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
          setSvgContent(svgString);
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
      {variant === "button" ? (
        downloadUrl ? (
          <a href={downloadUrl} download={name}>
            {name}
          </a>
        ) : (
          <Loading text="Loading action..." />
        )
      ) : svgContent ? (
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      ) : (
        <Loading text="Loading diagram..." />
      )}
    </div>
  );
}
