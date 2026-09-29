export interface Engineer {
  id: number;
  name: string;
  age?: number;
  title: string;
  experience_years?: number;
  skills: string[];
  nearest_station?: string;
  remote_pref?: string;
  available_from?: string;
  min_rate?: number;
  max_rate?: number;
  notes?: string;
  resume_text?: string;
  resume_filename?: string;
  source: 'spreadsheet' | 'email' | 'manual';
  email_id?: number;
  created_at?: string;
}

export interface Project {
  id: number;
  title: string;
  client_company?: string;
  required_skills: string[];
  preferred_skills: string[];
  location?: string;
  remote_pref?: string;
  start_date?: string;
  min_rate?: number;
  max_rate?: number;
  payment_terms?: string;
  interview_count?: string;
  raw_text?: string;
  source: 'spreadsheet' | 'email' | 'manual';
  email_id?: number;
  created_at?: string;
}

export interface ProposalEmail {
  to_address?: string;
  subject: string;
  body: string;
  match_score: number;
  is_auto_generated: boolean;
}

export interface MatchScore {
  score: number;
  skills_score: number;
  rate_score: number;
  location_score: number;
  date_score: number;
  match_reasons: string[];
  concern_points: string[];
  proposal_email?: ProposalEmail | null;
}

export interface ProjectMatchItem {
  project: Project;
  match: MatchScore;
}

export interface EngineerMatchItem {
  engineer: Engineer;
  match: MatchScore;
}

export interface CrossMatchPairItem {
  engineer: Engineer;
  project: Project;
  score: number;
  match_reasons: string[];
  concern_points: string[];
  proposal_email?: ProposalEmail | null;
}

export interface EmailMessage {
  id: number;
  message_id?: string;
  subject: string;
  sender: string;
  date?: string;
  body: string;
  category: 'project' | 'engineer' | 'unknown';
  is_parsed: boolean;
  created_at: string;
}
