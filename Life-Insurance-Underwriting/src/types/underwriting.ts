// Types for Life Insurance Underwriting System
export interface UnderwritingReport {
  application_metadata: ApplicationMetadata;
  medical_extraction: MedicalExtraction;
  medical_loading_analysis: MedicalLoadingAnalysis;
  fraud_assessment: FraudAssessment;
  risk_assessment: RiskAssessment;
  underwriting_decision: UnderwritingDecision;
  premium_analysis: PremiumAnalysis;
  business_impact: BusinessImpact;
  quality_metrics: QualityMetrics;
  detailed_agent_responses: DetailedAgentResponses;
}

export interface ApplicationMetadata {
  application_id: string;
  applicant_name: string;
  processing_date?: string;
  processing_time_seconds?: number;
  submission_date?: string;
  status?: 'pending' | 'processing' | 'completed';
  system_version: string;
}

// Pending application type for applications that haven't started processing
export interface PendingApplication {
  application_metadata: {
    application_id: string;
    applicant_name: string;
    submission_date: string;
    status: 'pending';
    system_version: string;
  };
}

export interface MedicalExtraction {
  total_reports_processed: number;
  successful_extractions: number;
  extraction_success_rate: number;
  medical_findings_summary: MedicalFindingsSummary;
}

export interface MedicalFindingsSummary {
  normal_findings: number;
  abnormal_findings: number;
  critical_alerts: number;
  critical_alert_details: string[];
  overall_medical_risk_score: number;
}

export interface MedicalLoadingAnalysis {
  total_loading_percentage: number;
  risk_category: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';
  overall_health_score: number;
  individual_loadings_count: number;
  requires_additional_tests: boolean;
  loading_breakdown: LoadingBreakdown[];
  recommendations: string[];
  exclusions: string[];
}

export interface LoadingBreakdown {
  condition: string;
  loading_percentage: number;
  severity: 'mild' | 'moderate' | 'severe';
  loading_type: 'medical' | 'lifestyle' | 'occupational';
  reasoning: string;
  affects_critical_illness: boolean;
  affects_term_life: boolean;
  affects_disability: boolean;
}

export interface FraudAssessment {
  overall_fraud_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  fraud_score: number;
  indicators_count: number;
  critical_indicators: number;
  high_risk_indicators: number;
  verification_requirements: string[];
  key_concerns: string[];
}

export interface RiskAssessment {
  overall_risk_level: 'low' | 'standard' | 'high';
  risk_score: number;
  component_risks: ComponentRisks;
  red_flags: string[];
  recommendations: string[];
}

export interface ComponentRisks {
  medical_risk: number;
  lifestyle_risk: number;
  financial_risk: number;
  occupation_risk: number;
}

export interface UnderwritingDecision {
  final_decision: 'accepted' | 'additional_requirements' | 'declined' | 'manual_review';
  confidence_score: number;
  reasoning: string[];
  conditions: string[];
  exclusions: string[];
}

export interface PremiumAnalysis {
  total_covers: number;
  total_base_premium: number;
  total_final_premium: number;
  total_loading_amount: number;
  average_loading_percentage: number;
  cover_details: CoverDetail[];
}

export interface CoverDetail {
  cover_type: string;
  base_premium: number;
  final_premium: number;
  loading_percentage: number;
  loadings_applied: string[];
}

export interface BusinessImpact {
  auto_processable: boolean;
  requires_manual_review: boolean;
  additional_requirements_needed: boolean;
  declined: boolean;
  estimated_processing_time_days: number;
  business_value_score: number;
}

export interface QualityMetrics {
  data_completeness_score: number;
  analysis_confidence: number;
  recommendation_strength: number;
  system_performance_score: number;
}

export interface DetailedAgentResponses {
  medical_reviewer: AgentResponse;
  fraud_detector: AgentResponse;
  risk_assessor: AgentResponse;
  premium_calculator: AgentResponse;
  decision_maker: AgentResponse;
}

export interface AgentResponse {
  analysis: string;
  timestamp: string;
  agent_type: string;
}

// Dashboard summary types for underwriting
export interface UnderwritingDashboardData {
  totalApplications: number;
  totalAccepted: number;
  totalDeclined: number;
  totalPending: number;
  totalPremiumValue: number;
  applications: ApplicationSummary[];
  underwritingMetrics: UnderwritingMetrics;
  riskAnalysis: RiskAnalysisSummary;
}

export interface ApplicationSummary {
  id: string;
  applicant_name: string;
  age?: number;
  application_date: string;
  final_decision: 'accepted' | 'additional_requirements' | 'declined' | 'processing';
  risk_category: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';
  total_premium: number;
  processing_time: number;
  medical_loading: number;
  fraud_risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface UnderwritingMetrics {
  averageProcessingTime: number;
  acceptanceRate: number;
  averagePremium: number;
  highRiskApplications: number;
}

export interface RiskLevelMetrics {
  count: number;
  totalValue: number;
  averageValue: number;
  averageProcessingTime: number;
}

export interface RiskAnalysisSummary {
  byRiskLevel: {
    low: RiskLevelMetrics;
    medium: RiskLevelMetrics;
    high: RiskLevelMetrics;
  };
  medicalLoadingDistribution: {
    noLoading: number;
    lowLoading: number;  // 1-50%
    mediumLoading: number; // 51-100%
    highLoading: number; // 100%+
  };
}