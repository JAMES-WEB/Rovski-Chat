"use client";

import { useEffect, useState } from "react";

type ApprovalRequest = {
  id: string;
  email: string;
  status: "pending" | "approved" | "denied";
  created_at: string | null;
  approved_at?: string | null;
  denied_at?: string | null;
};

const filters = ["pending", "approved", "denied", "all"] as const;
type Filter = (typeof filters)[number];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AdminApprovalsClient() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  async function loadRequests(nextFilter = filter) {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/approvals?status=${encodeURIComponent(nextFilter)}`
      );
      const data = (await response.json()) as {
        items?: ApprovalRequest[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Failed to load requests.");
        setRequests([]);
      } else {
        setRequests(data.items ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateRequest(id: string, decision: "approved" | "denied") {
    setIsUpdating(id);
    setError("");
    try {
      const response = await fetch("/api/admin/approvals", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Failed to update request.");
      } else {
        await loadRequests(filter);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request.");
    } finally {
      setIsUpdating(null);
    }
  }

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
            Admin approvals
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Signup requests</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setFilter(option);
                loadRequests(option);
              }}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                filter === option
                  ? "border-emerald-300 bg-emerald-300/10 text-emerald-200"
                  : "border-emerald-400/30 text-zinc-300 hover:border-emerald-200 hover:text-emerald-100"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-emerald-400/20 bg-zinc-900/60 p-6">
        {isLoading ? (
          <div className="text-sm text-zinc-300">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-sm text-zinc-300">No requests to review.</div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/10 bg-zinc-950/40 px-5 py-4"
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-zinc-100">
                    {request.email}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Requested: {formatDate(request.created_at)}
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                    {request.status}
                  </div>
                </div>
                {request.status === "pending" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateRequest(request.id, "approved")}
                      disabled={isUpdating === request.id}
                      className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRequest(request.id, "denied")}
                      disabled={isUpdating === request.id}
                      className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-400 hover:text-red-100 disabled:opacity-60"
                    >
                      Deny
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400">
                    {request.status === "approved"
                      ? `Approved: ${formatDate(request.approved_at)}`
                      : `Denied: ${formatDate(request.denied_at)}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
