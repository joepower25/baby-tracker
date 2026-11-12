export type VolumeUnit = "oz" | "ml";
export type WeightUnit = "lb" | "kg";
export type LengthUnit = "in" | "cm";
export type CaregiverRole = "owner" | "caregiver";
export type FeedType = "breast" | "bottle" | "formula";
export type FeedSide = "left" | "right" | "both";
export type DiaperKind = "wet" | "dirty" | "both";

export type Baby = {
  id: string;
  name: string;
  birth_date: string;
  invite_code_plain: string | null;
  volume_unit: VolumeUnit;
  weight_unit: WeightUnit;
  created_at: string;
};

export type Caregiver = {
  id: string;
  baby_id: string;
  viewer_sub: string;
  display_name: string;
  role: CaregiverRole;
  created_at: string;
};

export type Feeding = {
  id: string;
  baby_id: string;
  caregiver_sub: string;
  type: FeedType;
  side: FeedSide | null;
  amount: number | null;
  unit: VolumeUnit | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
};

export type Diaper = {
  id: string;
  baby_id: string;
  caregiver_sub: string;
  kind: DiaperKind;
  logged_at: string;
  notes: string | null;
  created_at: string;
};

export type Sleep = {
  id: string;
  baby_id: string;
  caregiver_sub: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
};

export type Pumping = {
  id: string;
  baby_id: string;
  caregiver_sub: string;
  started_at: string;
  ended_at: string | null;
  amount_left: number | null;
  amount_right: number | null;
  amount_total: number | null;
  unit: VolumeUnit | null;
  notes: string | null;
  created_at: string;
};

export type Medication = {
  id: string;
  baby_id: string;
  caregiver_sub: string;
  name: string;
  dose: string;
  unit: string | null;
  given_at: string;
  due_again_at: string | null;
  notes: string | null;
  created_at: string;
};

export type Growth = {
  id: string;
  baby_id: string;
  caregiver_sub: string;
  weight: number | null;
  weight_unit: WeightUnit | null;
  length: number | null;
  length_unit: LengthUnit | null;
  measured_at: string;
  notes: string | null;
  created_at: string;
};

export type TimelineEventType =
  | "feeding"
  | "diaper"
  | "sleep"
  | "pumping"
  | "medication"
  | "growth";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  at: string;
  title: string;
  detail: string;
  payload: Record<string, unknown>;
};
