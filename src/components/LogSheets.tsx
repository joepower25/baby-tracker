"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  Button,
  ChoiceRow,
  Field,
  Input,
  Sheet,
  TextArea,
} from "@/components/ui";
import type { Baby, TimelineEvent, TimelineEventType } from "@/lib/types";

export type LogKind =
  | "feed"
  | "diaper"
  | "sleep"
  | "pump"
  | "med"
  | "growth"
  | null;

function toLocalInputValue(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string) {
  return new Date(value).toISOString();
}

export function LogSheets({
  kind,
  baby,
  editing,
  onClose,
  onSaved,
}: {
  kind: LogKind;
  baby: Baby;
  editing?: TimelineEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  if (!kind) return null;
  if (kind === "feed" || editing?.type === "feeding") {
    return (
      <FeedSheet
        baby={baby}
        editing={editing?.type === "feeding" ? editing : null}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }
  if (kind === "diaper" || editing?.type === "diaper") {
    return (
      <DiaperSheet
        editing={editing?.type === "diaper" ? editing : null}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }
  if (kind === "sleep" || editing?.type === "sleep") {
    return (
      <SleepSheet
        editing={editing?.type === "sleep" ? editing : null}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }
  if (kind === "pump" || editing?.type === "pumping") {
    return (
      <PumpSheet
        baby={baby}
        editing={editing?.type === "pumping" ? editing : null}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }
  if (kind === "med" || editing?.type === "medication") {
    return (
      <MedSheet
        editing={editing?.type === "medication" ? editing : null}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }
  return (
    <GrowthSheet
      baby={baby}
      editing={editing?.type === "growth" ? editing : null}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function FeedSheet({
  baby,
  editing,
  onClose,
  onSaved,
}: {
  baby: Baby;
  editing: TimelineEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const p = (editing?.payload || {}) as Record<string, unknown>;
  const [type, setType] = useState((p.type as string) || "breast");
  const [side, setSide] = useState((p.side as string) || "both");
  const [amount, setAmount] = useState(
    p.amount != null ? String(p.amount) : "",
  );
  const [startedAt, setStartedAt] = useState(
    toLocalInputValue(p.started_at as string | undefined),
  );
  const [endedAt, setEndedAt] = useState(
    p.ended_at ? toLocalInputValue(p.ended_at as string) : "",
  );
  const [notes, setNotes] = useState((p.notes as string) || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const body = {
        type,
        side: type === "breast" ? side : null,
        amount: type === "breast" ? null : amount ? Number(amount) : null,
        unit: baby.volume_unit,
        startedAt: fromLocalInputValue(startedAt),
        endedAt: endedAt ? fromLocalInputValue(endedAt) : null,
        notes: notes || null,
      };
      if (type !== "breast" && (!amount || Number(amount) <= 0)) {
        setError("Enter an amount greater than 0.");
        setSaving(false);
        return;
      }
      if (editing) {
        await api(`/api/feedings/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/feedings", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing || !confirm("Delete this feeding?")) return;
    await api(`/api/feedings/${editing.id}`, { method: "DELETE" });
    onSaved();
    onClose();
  }

  return (
    <Sheet title={editing ? "Edit feeding" : "Log feeding"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Type">
          <ChoiceRow
            value={type}
            onChange={setType}
            options={[
              { value: "breast", label: "Breast" },
              { value: "bottle", label: "Bottle" },
              { value: "formula", label: "Formula" },
            ]}
          />
        </Field>
        {type === "breast" ? (
          <Field label="Side">
            <ChoiceRow
              value={side}
              onChange={setSide}
              options={[
                { value: "left", label: "Left" },
                { value: "right", label: "Right" },
                { value: "both", label: "Both" },
              ]}
            />
          </Field>
        ) : (
          <Field label={`Amount (${baby.volume_unit})`}>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={baby.volume_unit === "oz" ? "3.5" : "100"}
            />
          </Field>
        )}
        <Field label="Started">
          <Input
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
          />
        </Field>
        {type === "breast" ? (
          <Field label="Ended (optional)">
            <Input
              type="datetime-local"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
            />
          </Field>
        ) : null}
        <Field label="Notes">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {editing ? (
          <Button className="w-full" variant="danger" onClick={remove}>
            Delete
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}

function DiaperSheet({
  editing,
  onClose,
  onSaved,
}: {
  editing: TimelineEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const p = (editing?.payload || {}) as Record<string, unknown>;
  const [kind, setKind] = useState((p.kind as string) || "wet");
  const [loggedAt, setLoggedAt] = useState(
    toLocalInputValue(p.logged_at as string | undefined),
  );
  const [notes, setNotes] = useState((p.notes as string) || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const body = {
        kind,
        loggedAt: fromLocalInputValue(loggedAt),
        notes: notes || null,
      };
      if (editing) {
        await api(`/api/diapers/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/diapers", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing || !confirm("Delete this diaper?")) return;
    await api(`/api/diapers/${editing.id}`, { method: "DELETE" });
    onSaved();
    onClose();
  }

  return (
    <Sheet title={editing ? "Edit diaper" : "Log diaper"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Kind">
          <ChoiceRow
            value={kind}
            onChange={setKind}
            options={[
              { value: "wet", label: "Wet" },
              { value: "both", label: "Both" },
              { value: "dirty", label: "Dirty" },
            ]}
          />
        </Field>
        <Field label="When">
          <Input
            type="datetime-local"
            value={loggedAt}
            onChange={(e) => setLoggedAt(e.target.value)}
          />
        </Field>
        <Field label="Notes">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {editing ? (
          <Button className="w-full" variant="danger" onClick={remove}>
            Delete
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}

function SleepSheet({
  editing,
  onClose,
  onSaved,
}: {
  editing: TimelineEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const p = (editing?.payload || {}) as Record<string, unknown>;
  const [startedAt, setStartedAt] = useState(
    toLocalInputValue(p.started_at as string | undefined),
  );
  const [endedAt, setEndedAt] = useState(
    p.ended_at ? toLocalInputValue(p.ended_at as string) : "",
  );
  const [notes, setNotes] = useState((p.notes as string) || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const body = {
        startedAt: fromLocalInputValue(startedAt),
        endedAt: endedAt ? fromLocalInputValue(endedAt) : null,
        notes: notes || null,
      };
      if (editing) {
        await api(`/api/sleeps/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/sleeps", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing || !confirm("Delete this sleep?")) return;
    await api(`/api/sleeps/${editing.id}`, { method: "DELETE" });
    onSaved();
    onClose();
  }

  return (
    <Sheet title={editing ? "Edit sleep" : "Log sleep"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Started">
          <Input
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
          />
        </Field>
        <Field label="Ended (leave blank if still asleep)">
          <Input
            type="datetime-local"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
          />
        </Field>
        <Field label="Notes">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {editing ? (
          <Button className="w-full" variant="danger" onClick={remove}>
            Delete
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}

function PumpSheet({
  baby,
  editing,
  onClose,
  onSaved,
}: {
  baby: Baby;
  editing: TimelineEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const p = (editing?.payload || {}) as Record<string, unknown>;
  const [left, setLeft] = useState(
    p.amount_left != null ? String(p.amount_left) : "",
  );
  const [right, setRight] = useState(
    p.amount_right != null ? String(p.amount_right) : "",
  );
  const [total, setTotal] = useState(
    p.amount_total != null ? String(p.amount_total) : "",
  );
  const [startedAt, setStartedAt] = useState(
    toLocalInputValue(p.started_at as string | undefined),
  );
  const [notes, setNotes] = useState((p.notes as string) || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const body = {
        startedAt: fromLocalInputValue(startedAt),
        amountLeft: left ? Number(left) : null,
        amountRight: right ? Number(right) : null,
        amountTotal: total ? Number(total) : null,
        unit: baby.volume_unit,
        notes: notes || null,
      };
      if (editing) {
        await api(`/api/pumpings/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/pumpings", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing || !confirm("Delete this pump?")) return;
    await api(`/api/pumpings/${editing.id}`, { method: "DELETE" });
    onSaved();
    onClose();
  }

  return (
    <Sheet title={editing ? "Edit pump" : "Log pumping"} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Left (${baby.volume_unit})`}>
            <Input
              inputMode="decimal"
              value={left}
              onChange={(e) => setLeft(e.target.value)}
            />
          </Field>
          <Field label={`Right (${baby.volume_unit})`}>
            <Input
              inputMode="decimal"
              value={right}
              onChange={(e) => setRight(e.target.value)}
            />
          </Field>
        </div>
        <Field label={`Total (${baby.volume_unit}) — optional`}>
          <Input
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="Auto-sums left + right"
          />
        </Field>
        <Field label="When">
          <Input
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
          />
        </Field>
        <Field label="Notes">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {editing ? (
          <Button className="w-full" variant="danger" onClick={remove}>
            Delete
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}

function MedSheet({
  editing,
  onClose,
  onSaved,
}: {
  editing: TimelineEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const p = (editing?.payload || {}) as Record<string, unknown>;
  const [name, setName] = useState((p.name as string) || "");
  const [dose, setDose] = useState((p.dose as string) || "");
  const [unit, setUnit] = useState((p.unit as string) || "");
  const [givenAt, setGivenAt] = useState(
    toLocalInputValue(p.given_at as string | undefined),
  );
  const [dueAgainAt, setDueAgainAt] = useState(
    p.due_again_at ? toLocalInputValue(p.due_again_at as string) : "",
  );
  const [notes, setNotes] = useState((p.notes as string) || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim() || !dose.trim()) {
      setError("Name and dose are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        name,
        dose,
        unit: unit || null,
        givenAt: fromLocalInputValue(givenAt),
        dueAgainAt: dueAgainAt ? fromLocalInputValue(dueAgainAt) : null,
        notes: notes || null,
      };
      if (editing) {
        await api(`/api/medications/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/medications", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing || !confirm("Delete this medication?")) return;
    await api(`/api/medications/${editing.id}`, { method: "DELETE" });
    onSaved();
    onClose();
  }

  return (
    <Sheet title={editing ? "Edit medication" : "Log medication"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dose">
            <Input value={dose} onChange={(e) => setDose(e.target.value)} />
          </Field>
          <Field label="Unit">
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="ml, drop…"
            />
          </Field>
        </div>
        <Field label="Given at">
          <Input
            type="datetime-local"
            value={givenAt}
            onChange={(e) => setGivenAt(e.target.value)}
          />
        </Field>
        <Field label="Due again (display only)">
          <Input
            type="datetime-local"
            value={dueAgainAt}
            onChange={(e) => setDueAgainAt(e.target.value)}
          />
        </Field>
        <Field label="Notes">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {editing ? (
          <Button className="w-full" variant="danger" onClick={remove}>
            Delete
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}

function GrowthSheet({
  baby,
  editing,
  onClose,
  onSaved,
}: {
  baby: Baby;
  editing: TimelineEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const p = (editing?.payload || {}) as Record<string, unknown>;
  const [weight, setWeight] = useState(
    p.weight != null ? String(p.weight) : "",
  );
  const [length, setLength] = useState(
    p.length != null ? String(p.length) : "",
  );
  const [measuredAt, setMeasuredAt] = useState(
    toLocalInputValue(p.measured_at as string | undefined),
  );
  const [notes, setNotes] = useState((p.notes as string) || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!weight && !length) {
      setError("Enter weight and/or length.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        weight: weight ? Number(weight) : null,
        weightUnit: baby.weight_unit,
        length: length ? Number(length) : null,
        lengthUnit: "in",
        measuredAt: fromLocalInputValue(measuredAt),
        notes: notes || null,
      };
      if (editing) {
        await api(`/api/growth/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/growth", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing || !confirm("Delete this growth entry?")) return;
    await api(`/api/growth/${editing.id}`, { method: "DELETE" });
    onSaved();
    onClose();
  }

  return (
    <Sheet title={editing ? "Edit growth" : "Log growth"} onClose={onClose}>
      <div className="space-y-4">
        <Field label={`Weight (${baby.weight_unit})`}>
          <Input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </Field>
        <Field label="Length (in)">
          <Input
            inputMode="decimal"
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />
        </Field>
        <Field label="Measured at">
          <Input
            type="datetime-local"
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
          />
        </Field>
        <Field label="Notes">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {editing ? (
          <Button className="w-full" variant="danger" onClick={remove}>
            Delete
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}

export function kindFromEventType(type: TimelineEventType): LogKind {
  switch (type) {
    case "feeding":
      return "feed";
    case "diaper":
      return "diaper";
    case "sleep":
      return "sleep";
    case "pumping":
      return "pump";
    case "medication":
      return "med";
    case "growth":
      return "growth";
  }
}
