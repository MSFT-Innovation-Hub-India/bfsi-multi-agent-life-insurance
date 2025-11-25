import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  Bot,
  CheckCircle,
  FileText,
  Shield,
  Calculator,
  TrendingUp,
  UserCheck,
  Activity,
  Eye,
  Brain,
  Sparkles,
  Clock,
  AlertTriangle,
  DollarSign,
  Target
} from 'lucide-react';
import { UnderwritingReport } from '@/types/underwriting';

interface UnderwritingAgentRealtimeWorkflowProps {
  applicationId: string;
  data: UnderwritingReport;
  onBack: () => void;
  onReviewApprove?: () => void;
  onViewAnalysis?: () => void;
}

// Convert detailed agent responses to real-time steps
interface UnderwritingAgentStep {
  name: string;
  agent_type: string;
  analysis: string;
  timestamp: string;
  duration: number;
}

const agentIcons: { [key: string]: React.ReactNode } = {
  'Medical Review Specialist': <FileText className="h-5 w-5 text-red-600" />,
  'Fraud Detection Specialist': <Shield className="h-5 w-5 text-blue-600" />,
  'Risk Assessment Specialist': <TrendingUp className="h-5 w-5 text-orange-600" />,
  'Premium Calculation Specialist': <Calculator className="h-5 w-5 text-green-600" />,
  'Senior Underwriting Decision Maker': <UserCheck className="h-5 w-5 text-purple-600" />
};

const agentColors: { [key: string]: string } = {
  'Medical Review Specialist': 'border-red-200 bg-red-50',
  'Fraud Detection Specialist': 'border-blue-200 bg-blue-50',
  'Risk Assessment Specialist': 'border-orange-200 bg-orange-50',
  'Premium Calculation Specialist': 'border-green-200 bg-green-50',
  'Senior Underwriting Decision Maker': 'border-purple-200 bg-purple-50'
};

const getAgentDescription = (agentType: string): string => {
  const descriptions: { [key: string]: string } = {
    'Medical Review Specialist': 'Analyzes medical conditions, calculates medical loadings, and assesses health risks.',
    'Fraud Detection Specialist': 'Verifies medical data authenticity and checks for application inconsistencies.',
    'Risk Assessment Specialist': 'Evaluates comprehensive risk factors including medical, lifestyle, and financial.',
    'Premium Calculation Specialist': 'Calculates final premiums by applying loadings and determining pricing.',
    'Senior Underwriting Decision Maker': 'Makes final underwriting decisions and sets policy conditions.'
  };
  return descriptions[agentType] || 'AI agent responsible for specialized underwriting analysis tasks.';
};

const extractKeyFinding = (analysis: string, agentType: string): { summary: string; keyMetrics: string } => {
  let summary = 'Analysis in progress...';
  let keyMetrics = '';

  switch (agentType) {
    case 'Medical Review Specialist':
      const loadingMatch = analysis.match(/Total Recommended Medical Loading.*?(\d+%)/s);
      const conditionsMatch = analysis.match(/(\d+)\. Medical Conditions Identified/);
      summary = loadingMatch ? `Medical loading: ${loadingMatch[1]}` : 'Medical conditions analysis';
      keyMetrics = conditionsMatch ? `${conditionsMatch[1]} conditions identified` : 'Multiple conditions assessed';
      break;
    
    case 'Fraud Detection Specialist':
      const riskMatch = analysis.match(/FRAUD RISK RATING:\s*(\w+)/);
      summary = riskMatch ? `Fraud risk: ${riskMatch[1]}` : 'Fraud verification complete';
      keyMetrics = 'Data integrity verified';
      break;
    
    case 'Risk Assessment Specialist':
      const scoreMatch = analysis.match(/FINAL RISK SCORE.*?(\d+\.\d+)/s);
      const categoryMatch = analysis.match(/(\w+ RISK)/);
      summary = scoreMatch ? `Risk score: ${scoreMatch[1]}` : 'Risk assessment complete';
      keyMetrics = categoryMatch ? categoryMatch[1] : 'Risk categorized';
      break;
    
    case 'Premium Calculation Specialist':
      const premiumMatch = analysis.match(/TOTAL ANNUAL PREMIUM.*?₹([\d,]+)/s);
      const loadingUsed = analysis.match(/Total Medical Loading.*?(\d+%)/s);
      summary = premiumMatch ? `Annual premium: ₹${premiumMatch[1]}` : 'Premium calculated';
      keyMetrics = loadingUsed ? `Applied ${loadingUsed[1]} loading` : 'Medical loading applied';
      break;
    
    case 'Senior Underwriting Decision Maker':
      const decisionMatch = analysis.match(/Decision Category.*?(\w+(?:\s+\w+)*)/s);
      const timeMatch = analysis.match(/(\d+-?\d*\s*business days)/);
      summary = decisionMatch ? `Decision: ${decisionMatch[1]}` : 'Final decision made';
      keyMetrics = timeMatch ? `Processing: ${timeMatch[1]}` : 'Additional requirements';
      break;
  }

  return { summary, keyMetrics };
};

// Agent Modal Component
const UnderwritingAgentModal: React.FC<{
  agent: UnderwritingAgentStep | null;
  isOpen: boolean;
  onClose: () => void;
  stepNumber: number;
}> = ({ agent, isOpen, onClose, stepNumber }) => {
  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                {agentIcons[agent.agent_type]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{agent.agent_type}</h2>
                <p className="text-sm text-gray-600">{getAgentDescription(agent.agent_type)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors shadow-sm"
            >
              <Eye className="h-5 w-5" />
              <span className="font-medium">Close</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detailed Analysis (Step {stepNumber})
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 border">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-mono">
                {agent.analysis}
              </pre>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
            <span>Analysis completed: {new Date(agent.timestamp).toLocaleString()}</span>
            <Badge variant="success" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UnderwritingAgentRealtimeWorkflow: React.FC<UnderwritingAgentRealtimeWorkflowProps> = ({ 
  applicationId, 
  data, 
  onBack, 
  onReviewApprove,
  onViewAnalysis 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<UnderwritingAgentStep | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert detailed agent responses to workflow steps with realistic timing
  const agentSteps: UnderwritingAgentStep[] = Object.entries(data.detailed_agent_responses).map(
    ([key, agent], index) => ({
      name: key,
      agent_type: agent.agent_type,
      analysis: agent.analysis,
      timestamp: agent.timestamp,
      duration: [6, 4, 5, 3, 2][index] || 4 // Processing times in seconds (2-6 seconds range)
    })
  );

  // Real-time processing simulation
  useEffect(() => {
    if (currentStep < agentSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, agentSteps[currentStep]?.duration * 1000 || 4000); // Convert to milliseconds (2-6 seconds)

      return () => clearTimeout(timer);
    } else {
      setIsProcessing(false);
    }
  }, [currentStep, agentSteps]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
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
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Brain className="h-6 w-6 text-purple-600" />
                  Underwriting Agent Analysis Workflow
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span>Application ID: {applicationId}</span>
                  <span>•</span>
                  <span>Applicant: {data.application_metadata.applicant_name}</span>
                  <span>•</span>
                  <span>Coverage: {formatCurrency(8000000)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isProcessing ? "warning" : "success"} className="px-3 py-1">
                {isProcessing ? "Processing..." : "Analysis Complete"}
              </Badge>
              <div className="text-sm text-gray-500">
                Step {currentStep} of {agentSteps.length}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress 
              value={(currentStep / agentSteps.length) * 100} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Analysis Started</span>
              <span>{isProcessing ? 'Processing...' : 'Complete'}</span>
            </div>
          </div>
        </div>

        {/* Processing Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div className="text-2xl font-bold text-blue-800">15</div>
              <div className="text-xs text-blue-600">Medical Reports</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div className="text-2xl font-bold text-green-800">{data.medical_loading_analysis.total_loading_percentage}%</div>
              <div className="text-xs text-green-600">Medical Loading</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div className="text-2xl font-bold text-orange-800">{(data.risk_assessment.risk_score * 100).toFixed(0)}%</div>
              <div className="text-xs text-orange-600">Risk Score</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div className="text-2xl font-bold text-purple-800">{formatCurrency(data.premium_analysis.total_final_premium)}</div>
              <div className="text-xs text-purple-600">Annual Premium</div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Hierarchy/Timeline View */}
        <div className="relative">
          {/* Workflow Path Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-300 via-purple-400 to-purple-500 transform -translate-x-1/2 z-0"></div>
          
          <div className="space-y-8 relative z-10">
            {agentSteps.slice(0, currentStep).map((step, index) => {
              const { summary, keyMetrics } = extractKeyFinding(step.analysis, step.agent_type);
              const isLastCompleted = index === currentStep - 1;
              
              return (
                <div key={index} className="relative">
                  {/* Flow Connector */}
                  <div className="absolute left-1/2 -top-4 w-4 h-4 bg-white border-4 border-purple-500 rounded-full transform -translate-x-1/2 z-20"></div>
                  
                  {/* Agent Card */}
                  <Card 
                    className={`${agentColors[step.agent_type]} mx-auto max-w-2xl cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${isLastCompleted ? 'ring-2 ring-purple-500 ring-opacity-60' : ''}`}
                    onClick={() => {
                      setSelectedAgent(step);
                      setIsModalOpen(true);
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-lg border-2 border-gray-200">
                            {agentIcons[step.agent_type]}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{step.agent_type}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Badge variant="outline" className="text-xs">Step {index + 1}</Badge>
                              <CheckCircle className="h-4 w-4 text-purple-600" />
                              <span>Complete</span>
                            </div>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-white bg-opacity-80 rounded-lg text-sm font-medium hover:bg-opacity-100 transition-colors flex items-center gap-2 shadow-sm">
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Agent Role & Responsibility */}
                        <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-white border-opacity-40">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            Agent Role
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {getAgentDescription(step.agent_type)}
                          </p>
                        </div>
                        
                        {/* Key Finding & Metrics */}
                        <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-white border-opacity-40">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Key Finding
                          </h4>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Analysis:</strong> {summary}
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong>Result:</strong> {keyMetrics}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}

            {/* Current Processing Step */}
            {isProcessing && currentStep < agentSteps.length && (
              <div className="relative">
                <div className="absolute left-1/2 -top-4 w-4 h-4 bg-purple-500 rounded-full transform -translate-x-1/2 z-20 animate-pulse"></div>
                
                <Card className="border-2 border-dashed border-purple-300 bg-purple-50/70 mx-auto max-w-2xl">
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 shadow-lg">
                        <div className="animate-spin">
                          <Bot className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-purple-900 mb-2">
                        {agentSteps[currentStep]?.agent_type || 'Processing'}
                      </h3>
                      <p className="text-purple-700">Analyzing underwriting data...</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-800">In Progress</Badge>
                        <div className="flex items-center gap-1 text-xs text-purple-600">
                          <Clock className="h-3 w-3" />
                          <span>Processing...</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Final Decision Node */}
            {!isProcessing && (
              <div className="relative">
                <div className="absolute left-1/2 -top-4 w-4 h-4 bg-purple-600 rounded-full transform -translate-x-1/2 z-20"></div>
                
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 mx-auto max-w-2xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-3 text-purple-800">
                      <Sparkles className="h-8 w-8" />
                      <span className="text-2xl">Underwriting Decision</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600 mb-1">Final Decision</p>
                        <Badge 
                          variant={data.underwriting_decision.final_decision === 'accepted' ? 'success' : 'warning'} 
                          className="text-lg px-3 py-1"
                        >
                          {data.underwriting_decision.final_decision.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600 mb-1">Annual Premium</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(data.premium_analysis.total_final_premium)}
                        </p>
                      </div>
                      <div 
                        className="text-center p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:bg-purple-50 hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-purple-200"
                        onClick={() => onReviewApprove && onReviewApprove()}
                      >
                        <p className="text-sm text-gray-600 mb-1">Confidence</p>
                        <p className="text-2xl font-bold text-purple-600 hover:text-purple-700">
                          {(data.underwriting_decision.confidence_score * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Click for details</p>
                      </div>
                    </div>
                    
                    {(data.underwriting_decision.final_decision === 'additional_requirements' || data.underwriting_decision.final_decision === 'manual_review') && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span className="font-medium text-amber-800">
                            {data.underwriting_decision.final_decision === 'manual_review' ? 'Manual Review Required' : 'Additional Requirements'}
                          </span>
                        </div>
                        <p className="text-sm text-amber-700">
                          Medical loading applied: {data.medical_loading_analysis.total_loading_percentage}% • 
                          Processing time: {data.business_impact.estimated_processing_time_days} days • 
                          {data.underwriting_decision.final_decision === 'manual_review' ? 'Senior underwriter approval needed' : 'Specialist reports required'}
                        </p>
                      </div>
                    )}
                    
                    {/* Analysis Button */}
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => onViewAnalysis && onViewAnalysis()}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Eye className="h-5 w-5" />
                        <span className="font-semibold">View Comprehensive Analysis</span>
                        <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
                          Person & Agent Responses • Risk Details • Complete Report
                        </span>
                      </button>
                      <p className="text-sm text-gray-600 mt-2">
                        Detailed breakdown of all agent analyses, risk assessments, and decision factors
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Agent Modal */}
        <UnderwritingAgentModal
          agent={selectedAgent}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAgent(null);
          }}
          stepNumber={selectedAgent ? agentSteps.findIndex(step => step.name === selectedAgent.name) + 1 : 0}
        />
      </div>
    </div>
  );
};