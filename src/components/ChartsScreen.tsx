"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Chip, EmptyState, SectionTitle } from "@/components/ui";

type ChartsData = {
  days: number;
  volumeUnit: string;
  weightUnit: string;
  empty: boolean;
  feedsPerDay: {
    label: string;
    breast: number;
    bottle: number;
    formula: number;
  }[];
  volumePerDay: { label: string; volume: number }[];
  nursingPerDay: {
    label: string;
    left: number;
    right: number;
    both: number;
    total: number;
  }[];
  diapersPerDay: { label: string; wet: number; dirty: number }[];
  sleepPerDay: { label: string; hours: number }[];
  pumpPerDay: { label: string; volume: number }[];
  medsByName: { name: string; count: number }[];
  growthSeries: { label: string; weight: number; length: number | null }[];
};

const sage = "#2f6f64";
const sand = "#c9895c";
const slate = "#6a7f9a";
const plum = "#6b5f8d";

export function ChartsScreen({
  data,
  days,
  onDays,
}: {
  data: ChartsData | null;
  days: 7 | 14 | 30;
  onDays: (d: 7 | 14 | 30) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionTitle
        title="Charts"
        subtitle="How the last stretch has been going."
      />
      <div className="flex gap-2">
        {[7, 14, 30].map((d) => (
          <Chip key={d} active={days === d} onClick={() => onDays(d as 7 | 14 | 30)}>
            {d}d
          </Chip>
        ))}
      </div>

      {!data || data.empty ? (
        <EmptyState
          title="Charts need a few logs"
          body="Once you log feeds, diapers, and sleep, trends appear here."
        />
      ) : (
        <div className="space-y-4">
          <ChartCard title="Feeds per day">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.feedsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,42,39,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Legend />
                <Bar dataKey="breast" stackId="a" fill={sage} />
                <Bar dataKey="bottle" stackId="a" fill={sand} />
                <Bar dataKey="formula" stackId="a" fill={slate} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={`Bottle / formula volume (${data.volumeUnit})`}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.volumePerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,42,39,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke={sand}
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Nursing minutes">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.nursingPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,42,39,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Legend />
                <Bar dataKey="left" stackId="a" fill="#4f9a8c" />
                <Bar dataKey="right" stackId="a" fill="#2f6f64" />
                <Bar dataKey="both" stackId="a" fill="#9ec9bf" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Diapers per day">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.diapersPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,42,39,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Legend />
                <Bar dataKey="wet" stackId="a" fill={slate} />
                <Bar dataKey="dirty" stackId="a" fill={sand} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Sleep hours">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.sleepPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,42,39,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="hours" fill={plum} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={`Pump output (${data.volumeUnit})`}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.pumpPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,42,39,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="volume" fill={sand} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Medications">
            {data.medsByName.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No meds in this period.</p>
            ) : (
              <ul className="space-y-2">
                {data.medsByName.map((m) => (
                  <li
                    key={m.name}
                    className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold"
                  >
                    <span>{m.name}</span>
                    <span className="text-[var(--muted)]">{m.count}×</span>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>

          <ChartCard title={`Growth · weight (${data.weightUnit})`}>
            {data.growthSeries.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No growth entries yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.growthSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,42,39,0.08)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={36} domain={["auto", "auto"]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={sage}
                    strokeWidth={2.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass animate-rise rounded-[1.35rem] p-4">
      <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">{title}</h2>
      {children}
    </section>
  );
}
