export interface InsuranceDashboardData {
  totalCustomers: number;
  totalClaims: number;
  totalClaimValue: number;
  patients: PatientSummary[];
  claims: ClaimSummary[];
  agentMetrics: AgentMetrics;
  claimAnalysis: ClaimAnalysis;
}

export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  policyNumber: string;
  claimCount: number;
  totalClaimValue: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  activePolicy: boolean;
  lastClaimDate: string;
}

export interface ClaimSummary {
  id: string;
  patientId: string;
  patientName: string;
  claimAmount: number;
  status: 'ACCEPTED' | 'REJECTED' | 'PROCESSING';
  submissionDate: string;
  processingTime: number;
  agentsUsed: number;
  riskScore: number;
  fraudIndicators: string[];
}

export interface AgentMetrics {
  totalAgents: number;
  averageAgentsPerClaim: number;
  agentUsageDistribution: Record<string, number>;
  mostActiveAgent: string;
}

export interface ClaimAnalysis {
  byStatus: {
    accepted: ClaimStatusMetrics;
    rejected: ClaimStatusMetrics;
    processing: ClaimStatusMetrics;
  };
  processingMetrics: {
    averageProcessingTime: number;
    fastestClaim: number;
    slowestClaim: number;
  };
}

export interface ClaimStatusMetrics {
  count: number;
  totalValue: number;
  averageValue: number;
  averageAgents: number;
}