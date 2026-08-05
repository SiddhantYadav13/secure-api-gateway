// Logs — searchable, filterable, paginated audit table with CSV export.

import { useCallback, useEffect, useState } from "react";
import { Search, Download, ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";
import { Card, Badge, Skeleton, SectionHeading, statusTone } from "../components/ui";
import type { LogEntry } from "../types";

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/logs", {
        params: { page, per_page: 12, search, status, risk },
      });
      setLogs(data.logs);
      setPages(data.pages || 1);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, risk]);

  useEffect(() => {
    const t = setTimeout(fetchLogs, 300); // debounce search
    return () => clearTimeout(t);
  }, [fetchLogs]);

  const exportCsv = async () => {
    const res = await api.get("/logs/export", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "gateway_logs.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionHeading
        icon={<ScrollText size={22} />}
        title="Audit Logs"
        subtitle={`${total} recorded gateway events`}
      />

      {/* Toolbar */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-9"
              placeholder="Search endpoint or user…"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            />
          </div>
          <select className="input-field w-auto" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="allowed">Allowed</option>
            <option value="flagged">Flagged</option>
            <option value="blocked">Blocked</option>
          </select>
          <select className="input-field w-auto" value={risk} onChange={(e) => { setPage(1); setRisk(e.target.value); }}>
            <option value="">All risk</option>
            <option value="safe">Safe</option>
            <option value="suspicious">Suspicious</option>
            <option value="blocked">Blocked</option>
          </select>
          <button onClick={exportCsv} className="btn-ghost flex items-center gap-2 text-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-white/5">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Endpoint</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">JWT</th>
                <th className="px-4 py-3 font-medium">Hash</th>
                <th className="px-4 py-3 font-medium">Replay</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={8} className="px-4 py-3"><Skeleton className="h-5" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No logs match your filters.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-200">{log.username}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{log.endpoint}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(log.status)}>{log.status}</Badge></td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${log.risk_score >= 70 ? "text-danger" : log.risk_score >= 30 ? "text-warning" : "text-success"}`}>
                        {log.risk_score}
                      </span>
                    </td>
                    <td className="px-4 py-3"><Badge tone={statusTone(log.jwt_status)}>{log.jwt_status}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={statusTone(log.hash_status)}>{log.hash_status}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={statusTone(log.replay_status)}>{log.replay_status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span className="text-xs text-slate-500">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
