import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  FileText,
  MessageSquare,
  Activity,
  Shield,
  User,
  Heart,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Stethoscope,
  Info,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ThumbsUp,
  ThumbsDown,
  Send,
  FileCheck
} from 'lucide-react';
import { RupeeIcon } from '@/components/ui/rupee-icon';
import { UnderwritingReport } from '@/types/underwriting';

interface UnderwritingAnalysisPageProps {
  applicationId: string;
  data: UnderwritingReport;
  onBack: () => void;
  onAccept?: (applicationId: string, comments?: string) => void;
  onReject?: (applicationId: string, reason: string, comments?: string) => void;
}

// Helper function to extract the actual premium from agent's calculation
const extractPremiumFromAgent = (data: UnderwritingReport): number => {
  // For rejected/declined applications, return 0
  if (data.underwriting_decision?.final_decision === 'declined' || (data.underwriting_decision?.final_decision as string) === 'rejected') {
    return 0;
  }
  
  // Try to extract from premium calculator agent's response
  const premiumAgent = data.detailed_agent_responses?.premium_calculator;
  if (premiumAgent?.analysis) {
    // Look for pattern like "₹29,880" or "₹29880" in the agent's response
    const match = premiumAgent.analysis.match(/TOTAL ANNUAL PREMIUM[:\s]*[=]?\s*₹([0-9,]+)/i);
    if (match) {
      const premiumStr = match[1].replace(/,/g, '');
      const premium = parseFloat(premiumStr);
      if (!isNaN(premium) && premium > 0) {
        return premium;
      }
    }
  }
  // Fallback to premium_analysis if agent value not found or is 0
  return data.premium_analysis?.total_final_premium || 0;
};

// Helper to get coverage breakdown - now uses corrected JSON data
const extractCoverageFromAgent = (data: UnderwritingReport) => {
  // Since we've corrected the JSON data, we can trust premium_analysis now
  if (data.premium_analysis?.cover_details && data.premium_analysis.cover_details.length > 0) {
    return data.premium_analysis.cover_details.map(cover => ({
      name: cover.cover_type,
      final: cover.final_premium,
      base: cover.base_premium,
      loading: cover.loading_percentage
    }));
  }
  
  return [];
};

// Overview Component
const UnderwritingOverview: React.FC<{ data: UnderwritingReport }> = ({ data }) => {
  const actualPremium = extractPremiumFromAgent(data);
  
  const getDecisionBadgeVariant = (decision: string) => {
    switch (decision) {
      case 'accepted': return 'success';
      case 'declined': return 'danger';
      case 'additional_requirements': return 'warning';
      case 'manual_review': return 'warning';
      default: return 'default';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'accepted': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'declined': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'additional_requirements': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'manual_review': return <User className="h-5 w-5 text-orange-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="text-xl font-bold text-blue-800">{data.application_metadata.applicant_name}</div>
            <div className="text-xs text-blue-600">Applicant</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div className="text-xl font-bold text-orange-800">{(data.medical_loading_analysis.overall_health_score * 10).toFixed(1)}/10</div>
            <div className="text-xs text-orange-600">Health Score</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <RupeeIcon className="h-5 w-5 text-white" />
            </div>
            <div className="text-xl font-bold text-green-800">₹{actualPremium.toLocaleString('en-IN')}</div>
            <div className="text-xs text-green-600">Annual Premium</div>
          </CardContent>
        </Card>
      </div>

      {/* Decision Summary */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getDecisionIcon(data.underwriting_decision.final_decision)}
            Underwriting Decision
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Final Decision</p>
              <Badge 
                variant={getDecisionBadgeVariant(data.underwriting_decision.final_decision)}
                className="text-lg px-3 py-1"
              >
                {data.underwriting_decision.final_decision.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Risk Category</p>
              <Badge 
                variant={data.medical_loading_analysis.risk_category === 'HIGH RISK' ? 'danger' : 'warning'}
                className="text-lg px-3 py-1"
              >
                {data.medical_loading_analysis.risk_category}
              </Badge>
            </div>
          </div>
          
          {data.underwriting_decision.reasoning.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Decision Reasoning</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {data.underwriting_decision.reasoning.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-red-600" />
              Medical Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Reports Processed</span>
                <span className="font-bold">{data.medical_extraction.total_reports_processed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Success Rate</span>
                <span className="font-bold">{(data.medical_extraction.extraction_success_rate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Abnormal Findings</span>
                <span className="font-bold text-orange-600">{data.medical_extraction.medical_findings_summary.abnormal_findings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Critical Alerts</span>
                <span className="font-bold text-red-600">{data.medical_extraction.medical_findings_summary.critical_alerts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Medical Loading</span>
                <Badge variant="warning" className="font-bold">+{data.medical_loading_analysis.total_loading_percentage}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              Premium Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Coverage Breakdown */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Coverage Breakdown (Agent Calculated)</div>
                
                {extractCoverageFromAgent(data).map((cover, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{cover.name}</span>
                      <span className="text-sm font-bold text-green-600">₹{cover.final.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Base: ₹{cover.base.toLocaleString('en-IN')} + Loading ({cover.loading}%): ₹{(cover.final - cover.base).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Summary */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Base Premium</span>
                  <span className="font-bold">₹{data.premium_analysis.total_base_premium.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Loading Amount</span>
                  <span className="font-bold text-red-600">+₹{(actualPremium - data.premium_analysis.total_base_premium).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-semibold">Final Premium (Agent Calculated)</span>
                  <span className="font-bold text-lg text-green-600">₹{actualPremium.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Covers</span>
                  <span className="font-bold">{data.premium_analysis.total_covers}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Agent Flow Component
const AgentFlow: React.FC<{ data: UnderwritingReport }> = ({ data }) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  
  const agentIcons: { [key: string]: React.ReactNode } = {
    'Clinical Risk Assessment': <Stethoscope className="h-5 w-5 text-red-600" />,
    'Medical Review Specialist': <Stethoscope className="h-5 w-5 text-red-600" />,
    'Diagnostic Validator': <FileText className="h-5 w-5 text-blue-600" />,
    'Fraud Detection Specialist': <Shield className="h-5 w-5 text-blue-600" />,
    'Risk Assessment Specialist': <TrendingUp className="h-5 w-5 text-orange-600" />,
    'Premium Calculation Specialist': <Calculator className="h-5 w-5 text-green-600" />,
    'Underwriting Decision Maker': <UserCheck className="h-5 w-5 text-purple-600" />,
    'Senior Underwriting Decision Maker': <UserCheck className="h-5 w-5 text-purple-600" />
  };

  const toggleAgent = (agentType: string) => {
    setExpandedAgent(expandedAgent === agentType ? null : agentType);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Agent Analysis Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.detailed_agent_responses).map(([key, agent], index) => (
              <div key={key} className="border rounded-lg bg-gray-50">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleAgent(agent.agent_type)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        {agentIcons[agent.agent_type]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{agent.agent_type}</h4>
                        <p className="text-sm text-gray-600">
                          Step {index + 1} • {new Date(agent.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="text-xs">Complete</Badge>
                      {expandedAgent === agent.agent_type ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </div>
                </div>
                
                {expandedAgent === agent.agent_type && (
                  <div className="border-t p-4 bg-white">
                    <h5 className="font-medium text-gray-900 mb-3">Detailed Analysis</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                        {agent.analysis}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Medical Details Component
const MedicalDetails: React.FC<{ data: UnderwritingReport }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Medical Loading Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            Medical Loading Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {data.medical_loading_analysis.total_loading_percentage}%
              </div>
              <div className="text-sm text-red-600">Total Loading</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {(data.medical_loading_analysis.overall_health_score * 10).toFixed(1)}/10
              </div>
              <div className="text-sm text-orange-600">Health Score</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {data.medical_loading_analysis.individual_loadings_count}
              </div>
              <div className="text-sm text-purple-600">Conditions</div>
            </div>
          </div>

          {/* Loading Breakdown Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Condition-wise Loading Breakdown</h4>
            
            {data.medical_loading_analysis.loading_breakdown.map((loading, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900">{loading.condition}</h5>
                  <Badge variant="outline" className="font-bold">+{loading.loading_percentage}%</Badge>
                </div>
                <p className="text-sm text-gray-700 mb-2">{loading.reasoning}</p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Badge 
                    variant={
                      (loading.severity as string) === 'critical' ? 'danger' : 
                      loading.severity === 'severe' ? 'danger' : 
                      loading.severity === 'moderate' ? 'warning' : 
                      'default'
                    } 
                    className="text-xs"
                  >
                    {loading.severity}
                  </Badge>
                  <span>•</span>
                  <span>{loading.loading_type} loading</span>
                  {loading.affects_critical_illness && <span>• Affects CI</span>}
                  {loading.affects_term_life && <span>• Affects Term</span>}
                  {loading.affects_disability && <span>• Affects Disability</span>}
                </div>
              </div>
            ))}

            {data.medical_loading_analysis.loading_breakdown.length === 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900">No Medical Loading</h5>
                  <Badge variant="outline" className="font-bold">0%</Badge>
                </div>
                <p className="text-sm text-gray-700 mb-2">No medical conditions requiring premium loading detected.</p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Badge variant="success" className="text-xs">excellent</Badge>
                  <span>•</span>
                  <span>Standard terms applicable</span>
                </div>
              </div>
            )}
          </div>

          {/* Exclusions */}
          {data.medical_loading_analysis.exclusions.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Exclusions Applied</h4>
              <ul className="space-y-2">
                {data.medical_loading_analysis.exclusions.map((exclusion, index) => (
                  <li key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-700">{exclusion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Risk Assessment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Overall Risk Score</h4>
              <div className="text-center p-4 bg-orange-50 rounded-lg mb-4">
                <div className="text-4xl font-bold text-orange-600 mb-1">
                  {(data.risk_assessment.risk_score * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-orange-600 uppercase font-medium">
                  {data.risk_assessment.overall_risk_level} Risk
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Component Risks</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Medical Risk</span>
                  <div className="flex items-center gap-2">
                    <Progress value={data.risk_assessment.component_risks.medical_risk * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{(data.risk_assessment.component_risks.medical_risk * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Lifestyle Risk</span>
                  <div className="flex items-center gap-2">
                    <Progress value={data.risk_assessment.component_risks.lifestyle_risk * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{(data.risk_assessment.component_risks.lifestyle_risk * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Financial Risk</span>
                  <div className="flex items-center gap-2">
                    <Progress value={data.risk_assessment.component_risks.financial_risk * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{(data.risk_assessment.component_risks.financial_risk * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Occupation Risk</span>
                  <div className="flex items-center gap-2">
                    <Progress value={data.risk_assessment.component_risks.occupation_risk * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{(data.risk_assessment.component_risks.occupation_risk * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Red Flags */}
          {data.risk_assessment.red_flags.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Red Flags Identified</h4>
              <ul className="space-y-2">
                {data.risk_assessment.red_flags.map((flag, index) => (
                  <li key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-700">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// System Status Component  
const SystemStatus: React.FC<{ data: UnderwritingReport }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            System Performance & Quality Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Quality Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Data Completeness</span>
                  <div className="flex items-center gap-2">
                    <Progress value={data.quality_metrics.data_completeness_score * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{(data.quality_metrics.data_completeness_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Analysis Confidence</span>
                  <div className="flex items-center gap-2">
                    <Progress value={data.quality_metrics.analysis_confidence * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{(data.quality_metrics.analysis_confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Recommendation Strength</span>
                  <div className="flex items-center gap-2">
                    <Progress value={data.quality_metrics.recommendation_strength * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{(data.quality_metrics.recommendation_strength * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">System Performance</span>
                  <div className="flex items-center gap-2">
                    <Progress value={data.quality_metrics.system_performance_score * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{(data.quality_metrics.system_performance_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Processing Statistics</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Processing Time</span>
                  <span className="font-medium">{data.application_metadata.processing_time_seconds?.toFixed(1) ?? 'N/A'}s</span>
                </div>
                <div className="flex justify-between">
                  <span>System Version</span>
                  <span className="font-medium">{data.application_metadata.system_version}</span>
                </div>
                <div className="flex justify-between">
                  <span>Business Value Score</span>
                  <span className="font-medium">{data.business_impact.business_value_score.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Auto Processable</span>
                  <span className={`font-medium ${data.business_impact.auto_processable ? 'text-green-600' : 'text-red-600'}`}>
                    {data.business_impact.auto_processable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Fraud Assessment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {data.fraud_assessment.overall_fraud_risk}
              </div>
              <div className="text-sm text-blue-600">Fraud Risk Level</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {(data.fraud_assessment.fraud_score * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-green-600">Fraud Score</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {data.fraud_assessment.indicators_count}
              </div>
              <div className="text-sm text-orange-600">Total Indicators</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Analysis Page Component
export const UnderwritingAnalysisPage: React.FC<UnderwritingAnalysisPageProps> = ({ 
  applicationId, 
  data, 
  onBack,
  onAccept,
  onReject
}) => {
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'accept' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAcceptClick = () => {
    setDecisionType('accept');
    setShowDecisionModal(true);
  };

  const handleRejectClick = () => {
    setDecisionType('reject');
    setShowDecisionModal(true);
  };

  const handleSubmitDecision = async () => {
    if (!decisionType) return;
    
    setIsSubmitting(true);
    try {
      if (decisionType === 'accept' && onAccept) {
        await onAccept(applicationId, comments);
      } else if (decisionType === 'reject' && onReject) {
        if (!rejectionReason.trim()) {
          alert('Please provide a reason for rejection');
          return;
        }
        await onReject(applicationId, rejectionReason, comments);
      }
      
      // Close modal and reset state
      setShowDecisionModal(false);
      setDecisionType(null);
      setComments('');
      setRejectionReason('');
    } catch (error) {
      console.error('Error submitting decision:', error);
      alert('Failed to submit decision. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowDecisionModal(false);
    setDecisionType(null);
    setComments('');
    setRejectionReason('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Workflow
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Global Trust Life - Comprehensive Analysis</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span>Application ID: {applicationId}</span>
                  <span>•</span>
                  <span>Applicant: {data.application_metadata.applicant_name}</span>
                  <span>•</span>
                  <span>Amount: ₹{extractPremiumFromAgent(data).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            
            {/* Human Underwriter Decision Buttons - Always visible for manual override */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRejectClick}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg font-semibold"
                >
                  <ThumbsDown className="h-5 w-5" />
                  Reject Application
                </button>
                <button
                  onClick={handleAcceptClick}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg font-semibold"
                >
                  <ThumbsUp className="h-5 w-5" />
                  Approve Application
                </button>
              </div>
              <p className="text-xs text-gray-500 italic">Human underwriter can override AI recommendation</p>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="sticky top-0 z-[100] bg-white pb-4 pt-2">
            <TabsList className="grid w-full grid-cols-4 bg-transparent border-b border-gray-200">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="medical" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Medical
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Agent Flow
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <UnderwritingOverview data={data} />
          </TabsContent>

          {/* Medical Analysis Tab */}
          <TabsContent value="medical" className="space-y-6">
            <MedicalDetails data={data} />
          </TabsContent>

          {/* Agent Flow Tab */}
          <TabsContent value="agents" className="space-y-6">
            <AgentFlow data={data} />
          </TabsContent>

          {/* System Status Tab */}
          <TabsContent value="system" className="space-y-6">
            <SystemStatus data={data} />
          </TabsContent>
        </Tabs>

        {/* Decision Modal */}
        {showDecisionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {decisionType === 'accept' ? (
                      <>
                        <ThumbsUp className="h-5 w-5 text-green-600" />
                        Accept Application
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="h-5 w-5 text-red-600" />
                        Reject Application
                      </>
                    )}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">Application Details</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>ID:</strong> {applicationId}</p>
                    <p><strong>Applicant:</strong> {data.application_metadata.applicant_name}</p>
                    <p><strong>Premium:</strong> ₹{data.premium_analysis.total_final_premium.toLocaleString()}</p>
                  </div>
                </div>

                {decisionType === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason *
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select a reason...</option>
                      <option value="high_medical_risk">High Medical Risk - Uncontrolled Diabetes</option>
                      <option value="multiple_exclusions">Multiple Exclusions Required</option>
                      <option value="insufficient_medical_evidence">Insufficient Medical Evidence</option>
                      <option value="financial_inconsistency">Financial Inconsistency</option>
                      <option value="fraud_concerns">Fraud Concerns</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments {decisionType === 'reject' ? '(Optional)' : ''}
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={decisionType === 'accept' 
                      ? "Add any conditions or notes for acceptance..." 
                      : "Add any additional details about the rejection..."}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitDecision}
                    disabled={isSubmitting || (decisionType === 'reject' && !rejectionReason)}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      decisionType === 'accept' 
                        ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400' 
                        : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {decisionType === 'accept' ? 'Accept' : 'Reject'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnderwritingAnalysisPage;