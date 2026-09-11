export interface JobSearchInput {
  query: string;
  location?: string;
  remote?: boolean;
  page?: number;
  limit?: number;
}

export interface NormalizedJob {
  id?: string; // Internally generated UUID when saving
  externalId?: string; // Original ID from provider
  source: string; // "adzuna" | "jobspy" | "custom"
  title: string; // Mapped to role in db
  company: string;
  location?: string | null;
  remote?: string | null;
  experience?: string | null;
  salary?: number | null;
  url?: string | null;
  skills?: string[] | null;
  createdAt?: Date; // Original posted date
  metadata?: any; // Extra attribution or provider details
}

export interface JobProviderResult {
  jobs: NormalizedJob[];
  total?: number;
  page?: number;
  error?: string;
}

export interface JobProvider {
  name: string;
  searchJobs(input: JobSearchInput): Promise<JobProviderResult>;
}
