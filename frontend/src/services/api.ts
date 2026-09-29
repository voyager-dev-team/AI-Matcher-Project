import { Engineer, Project, EmailMessage, ProjectMatchItem, EngineerMatchItem, CrossMatchPairItem, ProposalEmail } from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Engineers
  getEngineers: async (source?: string): Promise<Engineer[]> => {
    const url = source ? `${API_BASE}/engineers?source=${source}` : `${API_BASE}/engineers`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch engineers');
    return res.json();
  },

  getEngineer: async (id: number): Promise<Engineer> => {
    const res = await fetch(`${API_BASE}/engineers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch engineer');
    return res.json();
  },

  uploadResume: async (engineerId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/engineers/${engineerId}/upload-resume`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload resume');
    return res.json();
  },

  // Projects
  getProjects: async (source?: string): Promise<Project[]> => {
    const url = source ? `${API_BASE}/projects?source=${source}` : `${API_BASE}/projects`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  // Emails
  getEmails: async (): Promise<EmailMessage[]> => {
    const res = await fetch(`${API_BASE}/emails`);
    if (!res.ok) throw new Error('Failed to fetch emails');
    return res.json();
  },

  parseRawEmail: async (subject: string, text: string, sender: string) => {
    const res = await fetch(`${API_BASE}/emails/parse-raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, text, sender }),
    });
    if (!res.ok) throw new Error('Failed to parse email');
    return res.json();
  },

  // Feature 1 & 2B: Match engineer to email projects
  matchEngineerToProjects: async (
    engineerId: number,
    onlyEmailProjects: boolean = true,
    limit: number = 10
  ): Promise<{
    engineer: Engineer;
    total_projects_scanned: number;
    matches: ProjectMatchItem[];
    high_match_count: number;
  }> => {
    const res = await fetch(
      `${API_BASE}/match/engineer/${engineerId}?only_email_projects=${onlyEmailProjects}&limit=${limit}`
    );
    if (!res.ok) throw new Error('Failed to match engineer');
    return res.json();
  },

  // Feature 2A: Match project to email engineers (Top 10 candidates)
  matchProjectToEngineers: async (
    projectId: number,
    onlyEmailEngineers: boolean = true,
    limit: number = 10
  ): Promise<{
    project: Project;
    total_engineers_scanned: number;
    candidates: EngineerMatchItem[];
  }> => {
    const res = await fetch(
      `${API_BASE}/match/project/${projectId}?only_email_engineers=${onlyEmailEngineers}&limit=${limit}`
    );
    if (!res.ok) throw new Error('Failed to match project');
    return res.json();
  },

  // Feature 3: Cross matching emails
  crossMatchEmails: async (minScore: number = 60): Promise<{
    total_email_projects: number;
    total_email_engineers: number;
    matched_pairs_count: number;
    pairs: CrossMatchPairItem[];
  }> => {
    const res = await fetch(`${API_BASE}/match/cross?min_score=${minScore}`);
    if (!res.ok) throw new Error('Failed to cross match emails');
    return res.json();
  },

  // Sheets
  importSheetUrl: async (url: string) => {
    const formData = new FormData();
    formData.append('url', url);
    const res = await fetch(`${API_BASE}/sheets/import-url`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Import failed' }));
      throw new Error(err.detail || 'Import failed');
    }
    return res.json();
  },

  importSheetFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/sheets/import-file`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to import file');
    return res.json();
  },

  // Reset
  resetSeedData: async () => {
    const res = await fetch(`${API_BASE}/seed/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset seed');
    return res.json();
  },
};
