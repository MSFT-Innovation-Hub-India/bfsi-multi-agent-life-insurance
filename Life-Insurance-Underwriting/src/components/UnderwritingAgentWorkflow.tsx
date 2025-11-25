import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  CheckCircle,
  FileText,
  Shield,
  Calculator,
  TrendingUp,
  UserCheck,
  X,
  Clock,
  Brain,
  Sparkles,
  BarChart3,
  ArrowRight,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  GitBranch,
  Workflow
} from 'lucide-react';
import { UnderwritingReport } from '@/types/underwriting';

interface UnderwritingAgentWorkflowProps {
  applicationId: string;
  data: UnderwritingReport;
  onBack: () => void;
  onViewDetails?: () => void;
}

interface UnderwritingAgentStep {
  name: string;
  agent_type: string;
  analysis: string;
  timestamp: string;
  completed: boolean;
}

const agentIcons: { [key: string]: React.ReactNode } = {
  'Clinical Risk Assessment': <FileText className="h-5 w-5 text-red-600" />,
  'Fraud Detection Specialist': <Shield className="h-5 w-5 text-blue-600" />,
  'Risk Assessment Specialist': <TrendingUp className="h-5 w-5 text-orange-600" />,
  'Premium Calculation Specialist': <Calculator className="h-5 w-5 text-green-600" />,
  'Senior Underwriting Decision Maker': <UserCheck className="h-5 w-5 text-purple-600" />
};

const agentColors: { [key: string]: string } = {
  'Clinical Risk Assessment': 'border-red-200 bg-red-50',
  'Fraud Detection Specialist': 'border-blue-200 bg-blue-50',
  'Risk Assessment Specialist': 'border-orange-200 bg-orange-50',
  'Premium Calculation Specialist': 'border-green-200 bg-green-50',
  'Senior Underwriting Decision Maker': 'border-purple-200 bg-purple-50'
};

const getAgentDescription = (agentType: string): string => {
  const descriptions: { [key: string]: string } = {
    'Clinical Risk Assessment': 'Reviews medical history, analyzes health conditions, and determines appropriate medical loadings based on risk factors.',
    'Fraud Detection Specialist': 'Assesses fraud risk by analyzing application consistency, verifying medical data authenticity, and identifying suspicious patterns.',
    'Risk Assessment Specialist': 'Evaluates overall risk profile considering medical, lifestyle, financial, and occupational factors for comprehensive risk scoring.',
    'Premium Calculation Specialist': 'Calculates final premiums by applying medical loadings, considering coverage types, and determining accurate pricing.',
    'Senior Underwriting Decision Maker': 'Makes final underwriting decisions based on all agent analyses, sets policy conditions, and determines acceptance terms.'
  };
  return descriptions[agentType] || 'AI agent responsible for specialized underwriting analysis tasks.';
};



export const UnderwritingAgentWorkflow: React.FC<UnderwritingAgentWorkflowProps> = ({ 
  applicationId, 
  data, 
  onBack, 
  onViewDetails 
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');
  const [selectedAgent, setSelectedAgent] = useState<UnderwritingAgentStep | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert detailed agent responses to workflow steps
  const agentSteps: UnderwritingAgentStep[] = Object.entries(data.detailed_agent_responses).map(
    ([key, agent]) => ({
      name: key,
      agent_type: agent.agent_type,
      analysis: agent.analysis,
      timestamp: agent.timestamp,
      completed: true
    })
  );

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
        setSelectedAgent(null);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isModalOpen]);

  const getDecisionBadgeVariant = (decision: string) => {
    switch (decision) {
      case 'accepted': return 'success';
      case 'additional_requirements': return 'warning';
      case 'declined': return 'danger';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  // Kanban View
  const KanbanView = () => (
    <div className="relative">
      {/* Enhanced Flow Connection Lines */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        {/* Main Flow Pipeline */}
        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex items-center justify-between px-8">
          {/* Analysis to Calculation Flow */}
          <div className="flex items-center">
            <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-green-400 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col items-center ml-2">
              <ArrowRight className="h-6 w-6 text-green-500 animate-bounce" style={{ animationDuration: '2s' }} />
              <div className="text-xs text-gray-600 font-medium mt-1 bg-white/80 px-2 py-1 rounded shadow-sm">
                Medical + Risk Data
              </div>
            </div>
          </div>
          
          {/* Calculation to Decision Flow */}
          <div className="flex items-center">
            <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-purple-400 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            <div className="flex flex-col items-center ml-2">
              <ArrowRight className="h-6 w-6 text-purple-500 animate-bounce" style={{ animationDuration: '2s', animationDelay: '1s' }} />
              <div className="text-xs text-gray-600 font-medium mt-1 bg-white/80 px-2 py-1 rounded shadow-sm">
                Premium Results
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Flow Arrows in Analysis Column */}
        <div className="absolute left-1/6 top-20 space-y-16">
          <div className="flex flex-col items-center">
            <ArrowDown className="h-5 w-5 text-blue-500 animate-pulse" />
            <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded mt-1">
              Medical Data
            </div>
          </div>
          <div className="flex flex-col items-center">
            <ArrowDown className="h-5 w-5 text-blue-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded mt-1">
              Risk Analysis
            </div>
          </div>
        </div>

        {/* Communication Flow Indicators */}
        <div className="absolute top-1/4 left-1/3 transform -translate-y-1/2">
          <div className="flex items-center">
            <ArrowUpRight className="h-4 w-4 text-orange-400 animate-pulse" />
            <div className="text-xs text-orange-600 ml-1 bg-orange-50 px-1 py-0.5 rounded">
              Alerts
            </div>
          </div>
        </div>
        
        <div className="absolute top-3/4 left-2/3 transform -translate-y-1/2">
          <div className="flex items-center">
            <ArrowDownRight className="h-4 w-4 text-indigo-400 animate-pulse" style={{ animationDelay: '1.5s' }} />
            <div className="text-xs text-indigo-600 ml-1 bg-indigo-50 px-1 py-0.5 rounded">
              Feedback
            </div>
          </div>
        </div>

        {/* Data Collection Indicator */}
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
              <Workflow className="h-4 w-4 text-white" />
            </div>
            <div className="text-xs text-gray-600 font-semibold mt-1 bg-white px-2 py-1 rounded shadow-sm">
              Multi-Agent Pipeline
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Analysis Phase */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="font-semibold text-gray-800">Analysis Phase</h3>
            <Badge variant="outline" className="text-xs">3 Agents</Badge>
            <GitBranch className="h-4 w-4 text-blue-500 ml-2" />
          </div>
        
        {/* Medical Review */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all cursor-pointer" 
              onClick={() => {
                const medicalAgent = agentSteps.find(s => s.agent_type === 'Clinical Risk Assessment');
                if (medicalAgent) {
                  setSelectedAgent(medicalAgent);
                  setIsModalOpen(true);
                }
              }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Medical Review</h4>
                <p className="text-xs text-gray-600">Health Assessment</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Loading Applied</span>
                <span className="font-medium text-red-700">+{data.medical_loading_analysis.total_loading_percentage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Risk Level</span>
                <Badge variant={data.medical_loading_analysis.risk_category === 'HIGH RISK' ? 'danger' : 'warning'} className="text-xs">
                  {data.medical_loading_analysis.risk_category}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700">Analysis Complete</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Sends to</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>Calculator</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fraud Detection */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => {
                const fraudAgent = agentSteps.find(s => s.agent_type === 'Fraud Detection Specialist');
                if (fraudAgent) {
                  setSelectedAgent(fraudAgent);
                  setIsModalOpen(true);
                }
              }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Fraud Detection</h4>
                <p className="text-xs text-gray-600">Security Analysis</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Risk Score</span>
                <span className="font-medium text-blue-700">{(data.fraud_assessment.fraud_score * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overall Risk</span>
                <Badge variant={data.fraud_assessment.overall_fraud_risk === 'LOW' ? 'success' : 'warning'} className="text-xs">
                  {data.fraud_assessment.overall_fraud_risk}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700">Verification Complete</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Alerts</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>Risk Agent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => {
                const riskAgent = agentSteps.find(s => s.agent_type === 'Risk Assessment Specialist');
                if (riskAgent) {
                  setSelectedAgent(riskAgent);
                  setIsModalOpen(true);
                }
              }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Risk Assessment</h4>
                <p className="text-xs text-gray-600">Comprehensive Risk</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Risk Score</span>
                <span className="font-medium text-orange-700">{(data.risk_assessment.risk_score * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Category</span>
                <Badge variant="outline" className="text-xs">
                  {data.risk_assessment.overall_risk_level.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700">Assessment Complete</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Data to</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>Premium Calc</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Phase */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h3 className="font-semibold text-gray-800">Calculation Phase</h3>
          <Badge variant="outline" className="text-xs">1 Agent</Badge>
        </div>

        {/* Premium Calculation */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => {
                const premiumAgent = agentSteps.find(s => s.agent_type === 'Premium Calculation Specialist');
                if (premiumAgent) {
                  setSelectedAgent(premiumAgent);
                  setIsModalOpen(true);
                }
              }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Calculator className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Premium Calculation</h4>
                <p className="text-xs text-gray-600">Pricing Engine</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Premium</span>
                <span className="font-medium text-green-700">{formatCurrency(data.premium_analysis.total_base_premium)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Final Premium</span>
                <span className="font-bold text-green-800">{formatCurrency(data.premium_analysis.total_final_premium)}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700">Calculation Complete</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Results to</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>Decision Maker</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Time Card */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Processing Time</h4>
              <p className="text-2xl font-bold text-gray-800">{formatTime(data.application_metadata.processing_time_seconds)}</p>
              <p className="text-xs text-gray-600">Total Analysis Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decision Phase */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <h3 className="font-semibold text-gray-800">Decision Phase</h3>
          <Badge variant="outline" className="text-xs">1 Agent</Badge>
        </div>

        {/* Decision Maker */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => {
                const decisionAgent = agentSteps.find(s => s.agent_type === 'Senior Underwriting Decision Maker');
                if (decisionAgent) {
                  setSelectedAgent(decisionAgent);
                  setIsModalOpen(true);
                }
              }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Decision Maker</h4>
                <p className="text-xs text-gray-600">Final Authority</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Decision</span>
                <Badge variant={getDecisionBadgeVariant(data.underwriting_decision.final_decision)} className="text-xs">
                  {data.underwriting_decision.final_decision.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Confidence</span>
                <span className="font-medium text-purple-700">{(data.underwriting_decision.confidence_score * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700">Decision Finalized</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Final Output</span>
                  <Workflow className="h-3 w-3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Summary */}
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Sparkles className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Application Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Business Value</span>
                  <span className="font-medium">{(data.business_impact.business_value_score * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Processing</span>
                  <span className="font-medium">{data.business_impact.estimated_processing_time_days}d</span>
                </div>
              </div>
              {onViewDetails && (
                <button
                  onClick={onViewDetails}
                  className="mt-3 px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors"
                >
                  View Full Details
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back</span>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Agent Workflow Analysis</h1>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{applicationId}</span>
                    <span>•</span>
                    <span>{data.application_metadata.applicant_name}</span>
                    <span>•</span>
                    <span>{formatCurrency(data.premium_analysis.total_final_premium)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'kanban' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Kanban View
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'timeline' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Timeline View
                </button>
              </div>
              
              <Badge variant={getDecisionBadgeVariant(data.underwriting_decision.final_decision)} className="px-3 py-1">
                {data.underwriting_decision.final_decision.replace('_', ' ').toUpperCase()}
              </Badge>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{agentSteps.length} Agents</div>
                <div className="text-xs text-gray-500">Multi-Agent Analysis</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Flow Communication Legend */}
        <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Communication Flow Legend
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">Data Transfer</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">Sequential Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-orange-400" />
              <span className="text-gray-600">Alert Signals</span>
            </div>
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-purple-500" />
              <span className="text-gray-600">Final Output</span>
            </div>
          </div>
        </div>

        {viewMode === 'kanban' ? <KanbanView /> : (
          // Timeline View with Communication Flow
          <div className="space-y-6">
            {/* Timeline Flow Visualization */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Agent Communication Timeline
              </h3>
              <div className="flex items-center justify-between">
                {agentSteps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-200">
                        {agentIcons[step.agent_type]}
                      </div>
                      <div className="text-xs text-gray-600 mt-2 text-center max-w-20">
                        {step.agent_type.split(' ')[0]}
                      </div>
                    </div>
                    {index < agentSteps.length - 1 && (
                      <div className="flex items-center mx-4">
                        <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                        <ArrowRight className="h-4 w-4 text-gray-500 -ml-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {agentSteps.map((step, index) => (
              <Card key={index} className={`${agentColors[step.agent_type]} hover:shadow-lg transition-all cursor-pointer`}
                    onClick={() => {
                      setSelectedAgent(step);
                      setIsModalOpen(true);
                    }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {agentIcons[step.agent_type]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{step.agent_type}</h3>
                      <p className="text-sm text-gray-600 mt-1">{getAgentDescription(step.agent_type)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">Step {index + 1}</Badge>
                      <div className="text-xs text-gray-500">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Agent Analysis Modal */}
        {selectedAgent && isModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {agentIcons[selectedAgent.agent_type]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedAgent.agent_type}</h2>
                      <p className="text-sm text-gray-600">{getAgentDescription(selectedAgent.agent_type)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors shadow-sm"
                  >
                    <X className="h-5 w-5" />
                    <span className="font-medium">Close</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Detailed Analysis
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 border">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-mono">
                      {selectedAgent.analysis}
                    </pre>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <span>Analysis completed: {new Date(selectedAgent.timestamp).toLocaleString()}</span>
                  <Badge variant="success" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};