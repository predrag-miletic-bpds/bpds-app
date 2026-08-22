export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type ProfileRow = { id: string; full_name: string; club: string | null; account_role: string; created_at: string; updated_at: string };
export type PlayerRow = { coach_id: string; id: string; full_name: string; date_of_birth: string | null; age_group: string | null; height_cm: number | null; weight_kg: number | null; position: string | null; dominant_hand: string | null; club: string | null; skill_level: string | null; training_frequency: string | null; team_id: string | null; photo_color: string | null; notes: Json; stats: Json; active: boolean; created_at: string; updated_at: string };
export type TeamRow = { coach_id: string; id: string; name: string; club: string | null; age_group: string | null; skill_level: string | null; coach_name: string | null; player_ids: string[]; notes: Json; created_at: string; updated_at: string };
export type PracticeRow = { coach_id: string; id: string; name: string; status: string; age_group: string | null; skill_level: string | null; primary_focus: string | null; team_id: string | null; player_ids: string[]; items: Json; context: Json; created_at: string; updated_at: string };
export type HistoryRow = { coach_id: string; id: string; practice_id: string | null; session_date: string; practice_name: string; player_ids: string[]; team_id: string | null; duration_minutes: number; focus: string | null; completed_drills: number; total_drills: number; notes: string; created_at: string; updated_at: string };
export type CoachStateRow = { coach_id: string; recent_drills: string[]; draft: Json; updated_at: string };
export type DrillRow = { owner_id: string; id: string; code: string; name: string; module_code: string; data: Json; published: boolean; created_at: string; updated_at: string };

export type BpdsDatabase = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      players: Table<PlayerRow>;
      teams: Table<TeamRow>;
      practices: Table<PracticeRow>;
      training_history: Table<HistoryRow>;
      coach_state: Table<CoachStateRow>;
      drills: Table<DrillRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
