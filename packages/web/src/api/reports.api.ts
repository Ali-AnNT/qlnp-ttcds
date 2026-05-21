import { api } from "./client";

export interface ExportParams {
  status?: string;
  from?: string;
  to?: string;
  period?: string;
}

function getJwt(): string | null {
  return localStorage.getItem("jwt");
}

export const reportsApi = {
  downloadExport: async (params: ExportParams = {}): Promise<void> => {
    const jwt = getJwt();
    const headers: Record<string, string> = {};
    if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

    const query = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null) as [string, string][]
    ).toString();

    const url = `${import.meta.env.VITE_API_URL || "http://localhost:8003/api"}/reports/export${query ? `?${query}` : ""}`;

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(errBody || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const fileName = res.headers.get("content-disposition")
      ?.match(/filename="?([^";]+)"?/)?.[1]
      || "bao-cao-nghi-phep.xlsx";

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  },
};
