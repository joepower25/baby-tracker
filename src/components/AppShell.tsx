"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BottomNav, type TabId } from "@/components/BottomNav";
import { ChartsScreen } from "@/components/ChartsScreen";
import { HomeScreen } from "@/components/HomeScreen";
import {
  kindFromEventType,
  LogSheets,
  type LogKind,
} from "@/components/LogSheets";
import { MoreScreen } from "@/components/MoreScreen";
import { Onboarding } from "@/components/Onboarding";
import { TimelineScreen } from "@/components/TimelineScreen";
import { Screen } from "@/components/ui";
import type {
  Baby,
  Caregiver,
  TimelineEvent,
  TimelineEventType,
} from "@/lib/types";

type MeResponse = {
  verified: boolean;
  simulated?: boolean;
  viewer: { name: string; email: string };
  baby: Baby | null;
  caregiver: Caregiver | null;
};

type HomeResponse = {
  baby: Baby;
  caregiver: Caregiver;
  viewer: { name: string; email: string };
  status: HomeScreenProps["data"]["status"];
};

type HomeScreenProps = React.ComponentProps<typeof HomeScreen>;

export function AppShell() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [tab, setTab] = useState<TabId>("home");
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<"all" | TimelineEventType>("all");
  const [chartsDays, setChartsDays] = useState<7 | 14 | 30>(7);
  const [charts, setCharts] = useState<React.ComponentProps<
    typeof ChartsScreen
  >["data"]>(null);
  const [caregivers, setCaregivers] = useState<
    React.ComponentProps<typeof MoreScreen>["caregivers"]
  >([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [logKind, setLogKind] = useState<LogKind>(null);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [endingSleep, setEndingSleep] = useState(false);
  const [error, setError] = useState("");

  const refreshMe = useCallback(async () => {
    const data = await api<MeResponse>("/api/me");
    setMe(data);
    return data;
  }, []);

  const refreshHome = useCallback(async () => {
    const data = await api<HomeResponse>("/api/home");
    setHome(data);
  }, []);

  const refreshTimeline = useCallback(async () => {
    const q = filter === "all" ? "" : `?type=${filter}`;
    const data = await api<{ events: TimelineEvent[] }>(`/api/timeline${q}`);
    setEvents(data.events);
  }, [filter]);

  const refreshCharts = useCallback(async () => {
    const data = await api<NonNullable<typeof charts>>(
      `/api/charts?days=${chartsDays}`,
    );
    setCharts(data);
  }, [chartsDays]);

  const refreshCaregivers = useCallback(async () => {
    const data = await api<{
      caregivers: React.ComponentProps<typeof MoreScreen>["caregivers"];
      inviteCode: string | null;
    }>("/api/caregivers");
    setCaregivers(data.caregivers);
    setInviteCode(data.inviteCode);
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await refreshMe();
      if (data.baby) {
        await Promise.all([
          refreshHome(),
          refreshTimeline(),
          refreshCharts(),
          refreshCaregivers(),
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [
    refreshMe,
    refreshHome,
    refreshTimeline,
    refreshCharts,
    refreshCaregivers,
  ]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!me?.baby) return;
    void refreshTimeline();
  }, [filter, me?.baby, refreshTimeline]);

  useEffect(() => {
    if (!me?.baby) return;
    void refreshCharts();
  }, [chartsDays, me?.baby, refreshCharts]);

  async function afterSave() {
    await Promise.all([
      refreshHome(),
      refreshTimeline(),
      refreshCharts(),
      refreshCaregivers(),
      refreshMe(),
    ]);
  }

  async function endSleep() {
    setEndingSleep(true);
    try {
      await api("/api/sleeps", {
        method: "POST",
        body: JSON.stringify({ action: "end" }),
      });
      await afterSave();
    } finally {
      setEndingSleep(false);
    }
  }

  if (loading) {
    return (
      <Screen className="flex min-h-dvh items-center justify-center">
        <p className="brand text-3xl text-[var(--accent)]">Nestlog</p>
      </Screen>
    );
  }

  if (error && !me) {
    return (
      <Screen className="flex min-h-dvh items-center justify-center">
        <p className="text-[var(--danger)]">{error}</p>
      </Screen>
    );
  }

  if (!me?.verified) {
    return (
      <Screen className="flex min-h-dvh items-center justify-center">
        <p className="text-[var(--muted)]">Sign in required.</p>
      </Screen>
    );
  }

  if (!me.baby || !me.caregiver) {
    return (
      <Onboarding viewerName={me.viewer.name} onDone={() => void bootstrap()} />
    );
  }

  const baby = home?.baby || me.baby;
  const caregiver = home?.caregiver || me.caregiver;

  return (
    <>
      <Screen>
        {me.simulated ? (
          <p className="mb-3 rounded-full bg-white/70 px-3 py-1 text-center text-xs text-[var(--muted)]">
            Local preview · simulated viewer
          </p>
        ) : null}
        {tab === "home" && home ? (
          <HomeScreen
            data={home}
            onLog={(kind) => {
              setEditing(null);
              setLogKind(kind);
            }}
            onEndSleep={() => void endSleep()}
            endingSleep={endingSleep}
          />
        ) : null}
        {tab === "timeline" ? (
          <TimelineScreen
            events={events}
            filter={filter}
            onFilter={setFilter}
            onEdit={(event) => {
              setEditing(event);
              setLogKind(kindFromEventType(event.type));
            }}
          />
        ) : null}
        {tab === "charts" ? (
          <ChartsScreen
            data={charts}
            days={chartsDays}
            onDays={setChartsDays}
          />
        ) : null}
        {tab === "more" ? (
          <MoreScreen
            baby={baby}
            caregiver={caregiver}
            caregivers={caregivers}
            inviteCode={inviteCode}
            onRefresh={() => void afterSave()}
          />
        ) : null}
      </Screen>
      <BottomNav tab={tab} onChange={setTab} />
      <LogSheets
        kind={logKind}
        baby={baby}
        editing={editing}
        onClose={() => {
          setLogKind(null);
          setEditing(null);
        }}
        onSaved={() => void afterSave()}
      />
    </>
  );
}
