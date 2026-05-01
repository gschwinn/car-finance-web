import { useState } from "react";
import type { Deal } from "../../types";
import {
  formatCurrency,
  dealMonthly,
  dealTotal,
  dealTermMonths,
  dealDisplayName,
  dealSummaryRows,
} from "@/utils/calculations";
import { downloadFile } from "../../utils/storage";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { Button } from "../shared/Button";

// ── Text builder ──────────────────────────────────────────────────────────────

function buildText(deals: Deal[]): string {
  const divider = "─".repeat(44);
  const pad = (label: string, value: string | number) => {
    const spaces = " ".repeat(Math.max(1, 20 - label.length));
    return `${label}${spaces}${value}`;
  };

  const lines: string[] = [
    "CAR DEAL COMPARISON",
    `Generated: ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" } as Intl.DateTimeFormatOptions)}`,
    divider,
  ];

  deals.forEach((deal) => {
    const name = dealDisplayName(deal);
    lines.push("");
    lines.push(`[${deal.type.toUpperCase()}]  ${name}`);
    lines.push(pad("Monthly Payment", formatCurrency(dealMonthly(deal))));
    lines.push(pad("Total Cost", formatCurrency(dealTotal(deal))));
    lines.push(pad("Term", `${dealTermMonths(deal)} months`));
    lines.push(pad("Down Payment", formatCurrency(deal.downPayment)));
    dealSummaryRows(deal).forEach(({ label, value }) =>
      lines.push(pad(label, value)),
    );
    lines.push(divider);
  });

  if (deals.length > 1) {
    lines.push("");
    lines.push("SUMMARY");
    const cheapestMonthly = deals.reduce((a, b) =>
      dealMonthly(a) < dealMonthly(b) ? a : b,
    );
    const cheapestTotal = deals.reduce((a, b) =>
      dealTotal(a) < dealTotal(b) ? a : b,
    );
    lines.push(pad("Lowest Monthly", dealDisplayName(cheapestMonthly)));
    lines.push(pad("Lowest Total Cost", dealDisplayName(cheapestTotal)));
  }

  return lines.join("\n");
}

// ── CSV builder ───────────────────────────────────────────────────────────────

function buildCSV(deals: Deal[]): string {
  const seen = new Set<string>();
  const allLabels: string[] = [];
  deals.forEach((d) => {
    dealSummaryRows(d).forEach(({ label }) => {
      if (!seen.has(label)) {
        seen.add(label);
        allLabels.push(label);
      }
    });
  });

  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows: string[] = [];

  rows.push(["Field", ...deals.map(dealDisplayName)].map(esc).join(","));

  const fixed: [string, (d: Deal) => string | number][] = [
    ["Deal Type", (d) => d.type],
    ["Monthly Payment", (d) => formatCurrency(dealMonthly(d))],
    ["Total Cost", (d) => formatCurrency(dealTotal(d))],
    ["Term (months)", (d) => dealTermMonths(d)],
    ["Down Payment", (d) => formatCurrency(d.downPayment)],
  ];
  fixed.forEach(([label, fn]) => {
    rows.push([label, ...deals.map(fn)].map(esc).join(","));
  });

  allLabels.forEach((label) => {
    const values = deals.map(
      (d) => dealSummaryRows(d).find((r) => r.label === label)?.value ?? "",
    );
    rows.push([label, ...values].map(esc).join(","));
  });

  return rows.join("\n");
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ExportPanelProps {
  deals: Deal[];
}

export default function ExportPanel({ deals }: ExportPanelProps) {
  const [format, setFormat] = useState<"text" | "csv">("text");
  const [copied, setCopied] = useState(false);

  const content = format === "csv" ? buildCSV(deals) : buildText(deals);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const ext = format === "csv" ? "csv" : "txt";
    const mime = format === "csv" ? "text/csv" : "text/plain";
    downloadFile(`car-comparison.${ext}`, content, mime);
  }

  const canShare = typeof navigator.share === "function";
  function handleShare() {
    navigator
      .share({ title: "Car Deal Comparison", text: content })
      .catch(() => {});
  }

  return (
    <Stack spacing={2} sx={{ p: 2.5 }}>
      {/* ── Format toggle ── */}
      <ToggleButtonGroup
        color="primary"
        value={format}
        exclusive
        onChange={(_, val) => val && setFormat(val)}
        size="small"
        fullWidth
      >
        <ToggleButton value="text">Plain Text</ToggleButton>
        <ToggleButton value="csv">CSV</ToggleButton>
      </ToggleButtonGroup>

      {/* ── Preview ── */}
      <Box
        component="pre"
        sx={{
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 2,
          p: 2,
          fontSize: "0.75rem",
          fontFamily: "monospace",
          color: "#cbd5e1",
          overflow: "auto",
          maxHeight: 288,
          whiteSpace: "pre",
          lineHeight: 1.625,
          m: 0,
        }}
      >
        {content}
      </Box>

      {/* ── Actions ── */}
      <Stack spacing={1}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            onClick={handleCopy}
            variant="outlined"
            fullWidth
            startIcon={
              copied ? (
                <CheckIcon sx={{ color: "success.main" }} />
              ) : (
                <ContentCopyIcon />
              )
            }
            color={copied ? "success" : "info"}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            color="primary"
            onClick={handleDownload}
            variant="contained"
            fullWidth
            startIcon={<DownloadOutlinedIcon />}
          >
            Download .{format === "csv" ? "csv" : "txt"}
          </Button>
        </Box>
        {canShare && (
          <Button
            color="info"
            onClick={handleShare}
            variant="outlined"
            fullWidth
            startIcon={<ShareOutlinedIcon />}
          >
            Share
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
