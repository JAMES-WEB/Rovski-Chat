"use client";

import { useEffect, useState } from "react";

type ApprovalRequest = {
  id: string;
  user_id: string;
  email: string;
  status: string;
  created_at: string;
};

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/requests");
      const data = (await response.json()) as {
        requests?: ApprovalRequest[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Failed to load requests.");
        setRequests([]);
      } else {
        setRequests(data.requests ?? []);
      }
    } catch {
      setError("Failed to load requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateRequest(id: string, action: "approve" | "deny") {
    setError("");
    const response = await fetch(`/api/admin/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Action failed.");
      return;
    }
    await loadRequests();
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50">
      <div className="pointer-events-none absolute inset-0 bg-[url('/rovski-logo.svg')] bg-[length:240px_80px] bg-repeat opacity-10" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
            Admin
          </p>
          <h1 className="text-3xl font-semibold">Approval requests</h1>
          <p className="text-sm text-zinc-300">
            Review pending registrations and approve or deny access.
          </p>
        </header>
        <div className="rounded-3xl border border-emerald-400/20 bg-zinc-900/60 p-6">
          {loading ? (
            <div className="text-sm text-zinc-300">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-sm text-zinc-300">No pending requests.</div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/20 bg-zinc-950/40 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-semibold">
                      {request.email}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Requested {new Date(request.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateRequest(request.id, "approve")}
                      className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-300"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRequest(request.id, "deny")}
                      className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-400 hover:text-red-100"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {error ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
