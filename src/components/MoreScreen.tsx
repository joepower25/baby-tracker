"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Field, Input, SectionTitle } from "@/components/ui";
import type { Baby, Caregiver } from "@/lib/types";

type CaregiverView = {
  id: string;
  displayName: string;
  role: Caregiver["role"];
  createdAt: string;
  isYou: boolean;
};

export function MoreScreen({
  baby,
  caregiver,
  caregivers,
  inviteCode,
  onRefresh,
}: {
  baby: Baby;
  caregiver: Caregiver;
  caregivers: CaregiverView[];
  inviteCode: string | null;
  onRefresh: () => void;
}) {
  const [name, setName] = useState(baby.name);
  const [birthDate, setBirthDate] = useState(baby.birth_date.slice(0, 10));
  const [volumeUnit, setVolumeUnit] = useState(baby.volume_unit);
  const [weightUnit, setWeightUnit] = useState(baby.weight_unit);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState(inviteCode || "");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  async function saveProfile() {
    setSaving(true);
    setMessage("");
    try {
      await api("/api/baby", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          birthDate,
          volumeUnit,
          weightUnit,
        }),
      });
      setMessage("Saved.");
      onRefresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function rotateInvite() {
    const res = await api<{ inviteCode: string }>("/api/baby/invite", {
      method: "POST",
    });
    setCode(res.inviteCode);
    onRefresh();
  }

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="More"
        subtitle="Baby profile, caregivers, and units."
      />

      <section className="glass rounded-[1.35rem] p-4 space-y-3">
        <h2 className="text-lg font-semibold">Baby profile</h2>
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={caregiver.role !== "owner"}
          />
        </Field>
        <Field label="Birth date">
          <Input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            disabled={caregiver.role !== "owner"}
          />
        </Field>
        {caregiver.role === "owner" ? (
          <Button className="w-full" onClick={saveProfile} disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Only the owner can edit the baby profile.
          </p>
        )}
        {message ? (
          <p className="text-sm text-[var(--accent)]">{message}</p>
        ) : null}
      </section>

      <section className="glass rounded-[1.35rem] p-4 space-y-3">
        <h2 className="text-lg font-semibold">Units</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`tap rounded-2xl border font-semibold ${
              volumeUnit === "oz"
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--line)] bg-white/80"
            }`}
            onClick={() => setVolumeUnit("oz")}
            disabled={caregiver.role !== "owner"}
          >
            oz
          </button>
          <button
            type="button"
            className={`tap rounded-2xl border font-semibold ${
              volumeUnit === "ml"
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--line)] bg-white/80"
            }`}
            onClick={() => setVolumeUnit("ml")}
            disabled={caregiver.role !== "owner"}
          >
            ml
          </button>
          <button
            type="button"
            className={`tap rounded-2xl border font-semibold ${
              weightUnit === "lb"
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--line)] bg-white/80"
            }`}
            onClick={() => setWeightUnit("lb")}
            disabled={caregiver.role !== "owner"}
          >
            lb
          </button>
          <button
            type="button"
            className={`tap rounded-2xl border font-semibold ${
              weightUnit === "kg"
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--line)] bg-white/80"
            }`}
            onClick={() => setWeightUnit("kg")}
            disabled={caregiver.role !== "owner"}
          >
            kg
          </button>
        </div>
        {caregiver.role === "owner" ? (
          <Button className="w-full" variant="secondary" onClick={saveProfile}>
            Save units
          </Button>
        ) : null}
      </section>

      <section className="glass rounded-[1.35rem] p-4 space-y-3">
        <h2 className="text-lg font-semibold">Caregivers</h2>
        <ul className="space-y-2">
          {caregivers.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2"
            >
              <div>
                <p className="font-semibold">
                  {c.displayName}
                  {c.isYou ? " (you)" : ""}
                </p>
                <p className="text-xs text-[var(--muted)]">{c.role}</p>
              </div>
            </li>
          ))}
        </ul>
        {caregiver.role === "owner" ? (
          <div className="rounded-2xl bg-[var(--accent-soft)] p-3">
            <p className="text-sm font-semibold text-[var(--accent)]">
              Partner invite code
            </p>
            <p className="mt-1 font-mono text-2xl tracking-[0.2em] text-[var(--ink)]">
              {code || "————"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={copyCode} disabled={!code}>
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="secondary" onClick={rotateInvite}>
                New code
              </Button>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Partner needs access to this private app in Cursor, then joins with
              this code on first open.
            </p>
          </div>
        ) : null}
      </section>

      <section className="glass rounded-[1.35rem] p-4 space-y-2">
        <h2 className="text-lg font-semibold">Add to Home Screen</h2>
        <p className="text-sm text-[var(--muted)]">
          On iPhone: Share → Add to Home Screen. On Android: browser menu →
          Install app / Add to Home screen.
        </p>
      </section>

      <section className="pb-4 text-center text-sm text-[var(--muted)]">
        Nestlog · shared baby log for caregivers
      </section>
    </div>
  );
}
