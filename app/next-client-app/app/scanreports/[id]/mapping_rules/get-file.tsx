"use client";

import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getMapDiagram } from "@/api/mapping-rules";
import { Loading } from "@/components/ui/loading-indicator";

interface GetFileProps {
  name: string;
  query: string;
  scanreportId: string;
  variant: "button" | "diagram";
  type: "image/svg+xml" | "application/json" | "text/csv";
}

export function GetFile({
  name,
  scanreportId,
  query,
  variant,
  type,
}: GetFileProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      let data: string;
      if (type === "image/svg+xml") {
        data = await getMapDiagram(scanreportId, query, "svg");
      } else if (type === "application/json") {
        data = await getMapDiagram(scanreportId, query, "json");
      } else {
        data = await getMapDiagram(scanreportId, query, "csv");
      }
      createDownloadUrl(data, type);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(`Error downloading file: ${(error as any).message}`);
    }
  };

  const createDownloadUrl = (data: string, type: string) => {
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
        return;
      }
    } else {
      blob = new Blob([data], { type: type });
    }
    const url = URL.createObjectURL(blob);

    if (variant !== "diagram") {
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    // Clean up the URL object after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    if (variant === "diagram") {
      fetchData();
    }
  }, [variant]);

  return (
    <div>
      {variant === "button" ? (
        !loading ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              fetchData();
            }}
          >
            {name}
          </button>
        ) : (
          <Loading text="Downloading file.." />
        )
      ) : svgContent ? (
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      ) : (
        <Loading text="Loading diagram..." />
      )}
    </div>
  );
}
