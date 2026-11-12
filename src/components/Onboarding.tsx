"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { BrandMark, Button, Field, Input, Screen } from "@/components/ui";

export function Onboarding({
  viewerName,
  onDone,
}: {
  viewerName: string;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function createBaby() {
    if (!name.trim() || !birthDate) {
      setError("Name and birth date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api("/api/baby", {
        method: "POST",
        body: JSON.stringify({ name, birthDate }),
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create baby");
    } finally {
      setSaving(false);
    }
  }

  async function joinBaby() {
    if (!code.trim()) {
      setError("Enter the invite code from your partner.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api("/api/baby/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen className="flex min-h-dvh flex-col justify-center py-8">
      <BrandMark subtitle={`Welcome, ${viewerName}`} />
      <div className="glass mt-8 animate-rise rounded-[1.75rem] p-5">
        {mode === "choose" ? (
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold">Start your shared log</h1>
            <p className="text-[var(--muted)]">
              Create a baby profile, or join one your partner already set up.
            </p>
            <Button className="w-full" onClick={() => setMode("create")}>
              Create baby
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => setMode("join")}
            >
              Join with invite code
            </Button>
          </div>
        ) : null}

        {mode === "create" ? (
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold">Create baby</h1>
            <Field label="Baby name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Willow"
                autoFocus
              />
            </Field>
            <Field label="Birth date">
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </Field>
            {error ? (
              <p className="text-sm text-[var(--danger)]">{error}</p>
            ) : null}
            <Button className="w-full" onClick={createBaby} disabled={saving}>
              {saving ? "Creating…" : "Continue"}
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => setMode("choose")}
            >
              Back
            </Button>
          </div>
        ) : null}

        {mode === "join" ? (
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold">Join baby</h1>
            <p className="text-sm text-[var(--muted)]">
              Ask your partner for the 6-character code from More → Caregivers.
            </p>
            <Field label="Invite code">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                autoCapitalize="characters"
                autoFocus
              />
            </Field>
            {error ? (
              <p className="text-sm text-[var(--danger)]">{error}</p>
            ) : null}
            <Button className="w-full" onClick={joinBaby} disabled={saving}>
              {saving ? "Joining…" : "Join"}
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => setMode("choose")}
            >
              Back
            </Button>
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
