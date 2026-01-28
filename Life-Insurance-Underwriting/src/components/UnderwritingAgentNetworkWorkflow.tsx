import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  CheckCircle,
  FileText,
  Shield,
  Calculator,
  TrendingUp,
  UserCheck,
  Eye,
  Brain,
  Sparkles,
  Clock,
  DollarSign,
  Target,
  Zap,
  Network,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { UnderwritingReport } from '@/types/underwriting';
import { createReadableAnalysisSummary, extractKeyFindings } from '@/utils/markdownSimplifier';

interface UnderwritingAgentNetworkWorkflowProps {
  applicationId: string;
  data: UnderwritingReport;
  onBack: () => void;
  onReviewApprove?: () => void;
  onViewAnalysis?: () => void;
}

interface AgentNode {
  id: string;
  name: string;
  agent_type: string;
  analysis: string;
  timestamp: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed';
  position: { x: number; y: number };
  connections: string[];
}

const agentIcons: { [key: string]: React.ReactNode } = {
  'Clinical Risk Assessment': <FileText className="h-6 w-6 text-blue-600" />,
  'Medical Review Specialist': <FileText className="h-6 w-6 text-blue-600" />,
  'Fraud Detection Specialist': <Shield className="h-6 w-6 text-blue-600" />,
  'Risk Assessment Specialist': <TrendingUp className="h-6 w-6 text-blue-600" />,
  'Premium Calculation Specialist': <Calculator className="h-6 w-6 text-blue-600" />,
  'Senior Underwriting Decision Maker': <UserCheck className="h-6 w-6 text-blue-600" />,
  'Underwriting Decision Maker': <UserCheck className="h-6 w-6 text-blue-600" />
};

const agentColors: { [key: string]: string } = {
  'Clinical Risk Assessment': 'from-blue-500 to-blue-600',
  'Medical Review Specialist': 'from-blue-500 to-blue-600',
  'Fraud Detection Specialist': 'from-red-500 to-red-600',
  'Risk Assessment Specialist': 'from-yellow-500 to-yellow-600',
  'Premium Calculation Specialist': 'from-green-500 to-green-600',
  'Senior Underwriting Decision Maker': 'from-purple-500 to-purple-600',
  'Underwriting Decision Maker': 'from-purple-500 to-purple-600'
};

const _extractKeyMetric = (analysis: string, agentType: string): string => {
  const { keyMetrics } = extractKeyFindings(analysis, agentType);
  
  if (keyMetrics.length > 0) {
    // Return the first key metric, formatted for display
    return keyMetrics[0];
  }
  
  // Fallback to simple extraction
  switch (agentType) {
    case 'Clinical Risk Assessment':
    case 'Medical Review Specialist':
      const loadingMatch = analysis.match(/(\d+%)/);
      return loadingMatch ? `${loadingMatch[1]} Loading` : 'Medical Analysis';
    case 'Fraud Detection Specialist':
      return 'Security Check';
    case 'Risk Assessment Specialist':
      return 'Risk Analysis';
    case 'Premium Calculation Specialist':
      return 'Premium Calc';
    case 'Senior Underwriting Decision Maker':
    case 'Underwriting Decision Maker':
      return 'Final Decision';
    default:
      return 'Processing';
  }
};





// Agent Modal Component
const AgentModal: React.FC<{
  agent: AgentNode | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ agent, isOpen, onClose }) => {
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
                <p className="text-sm text-gray-600">Agent Analysis Details</p>
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
              <Network className="h-5 w-5" />
              Detailed Analysis
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 border">
              <div className="text-sm text-gray-700 leading-relaxed">
                {createReadableAnalysisSummary(agent.analysis, agent.agent_type)}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={() => {
                    const detailDiv = document.getElementById(`full-analysis-${agent.id}`);
                    if (detailDiv) {
                      detailDiv.style.display = detailDiv.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                >
                  View Full Analysis
                </button>
                <div id={`full-analysis-${agent.id}`} style={{ display: 'none' }} className="mt-3 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-gray-600 leading-relaxed font-mono">
                    {agent.analysis}
                  </pre>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
            <span>Analysis completed: {new Date(agent.timestamp).toLocaleString()}</span>
            <Badge variant="success" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UnderwritingAgentNetworkWorkflow: React.FC<UnderwritingAgentNetworkWorkflowProps> = ({ 
  applicationId, 
  data, 
  onBack, 
  onReviewApprove: _onReviewApprove,
  onViewAnalysis
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completedConnections, setCompletedConnections] = useState<string[]>([]);

  // Create agent nodes with network positions (memoized to prevent re-creation)
  const baseAgentNodes = useMemo(() => 
    Object.entries(data.detailed_agent_responses).map(
      ([key, agent], index) => ({
        id: key,
        name: key,
        agent_type: agent.agent_type,
        analysis: agent.analysis,
        timestamp: agent.timestamp,
        duration: [6, 4, 5, 3, 2][index] || 4, // 6-2 seconds range
        position: {
          // Circular arrangement
          x: 50 + 35 * Math.cos((index * 2 * Math.PI) / 5 - Math.PI / 2),
          y: 50 + 35 * Math.sin((index * 2 * Math.PI) / 5 - Math.PI / 2)
        },
        connections: index < 4 ? [Object.keys(data.detailed_agent_responses)[index + 1]] : []
      })
    ), [data.detailed_agent_responses]
  );

  // Add status to agent nodes based on current step
  const agentNodes: AgentNode[] = baseAgentNodes.map((node, index) => {
    let status: 'pending' | 'processing' | 'completed' = 'pending';
    if (index < currentStep) {
      status = 'completed';
    } else if (index === currentStep && isProcessing && !isPaused) {
      status = 'processing';
    }
    return { ...node, status };
  });

  // Real-time processing simulation
  useEffect(() => {
    if (!isProcessing || isPaused || currentStep >= agentNodes.length) {
      if (currentStep >= agentNodes.length) {
        console.log('Processing complete');
        setIsProcessing(false);
      }
      return;
    }

    const currentAgent = agentNodes[currentStep];
    const duration = currentAgent?.duration || 4;
    
    console.log(`Processing step ${currentStep} (${currentAgent?.agent_type}), duration: ${duration}s`);
    
    const timer = setTimeout(() => {
      console.log(`Completing step ${currentStep}, moving to next...`);
      
      setCurrentStep(prev => {
        if (prev < agentNodes.length - 1) {
          const newStep = prev + 1;
          console.log(`Moving from step ${prev} to step ${newStep}`);
          
          // Add connection
          if (prev >= 0) {
            setCompletedConnections(prevConnections => {
              const newConnection = `${prev}-${newStep}`;
              if (!prevConnections.includes(newConnection)) {
                return [...prevConnections, newConnection];
              }
              return prevConnections;
            });
          }
          
          return newStep;
        } else {
          console.log('All steps completed');
          setIsProcessing(false);
          return prev;
        }
      });
    }, duration * 1000);

    return () => {
      console.log(`Cleaning up timer for step ${currentStep}`);
      clearTimeout(timer);
    };
  }, [currentStep, isProcessing, isPaused]);

  const handlePlayPause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsProcessing(true);
    setIsPaused(false);
    setCompletedConnections([]);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Network className="h-6 w-6 text-cyan-400" />
                  Life Insurance Agent Workflow Analysis
                </h1>
                <p className="text-white/70 mt-1">
                  AI-Powered Multi-Agent Underwriting Process Flowchart
                </p>
                <div className="flex items-center gap-4 text-sm text-white/60 mt-2">
                  <span>Application ID: {applicationId}</span>
                  <span>•</span>
                  <span>Applicant: {data.application_metadata.applicant_name}</span>
                  <span>•</span>
                  <span>Coverage: {formatCurrency(8000000)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
              <Badge variant={isProcessing ? "warning" : "success"} className="px-3 py-1 bg-white/20 border-white/30">
                {isProcessing ? (isPaused ? "Paused" : "Processing...") : "Complete"}
              </Badge>
              <div className="text-sm text-white/70">
                Node {currentStep} of {agentNodes.length}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress 
              value={(currentStep / agentNodes.length) * 100} 
              className="h-2 bg-white/20"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>Workflow Initialization</span>
              <span>{isProcessing ? 'Processing Workflow...' : 'Analysis Complete'}</span>
            </div>
          </div>
        </div>



        {/* Network Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold">15</div>
              <div className="text-xs text-white/70">Medical Reports</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold">{data.medical_loading_analysis.total_loading_percentage}%</div>
              <div className="text-xs text-white/70">Medical Loading</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
              </div>
              <div className="text-2xl font-bold">{(data.risk_assessment.risk_score * 100).toFixed(0)}%</div>
              <div className="text-xs text-white/70">Risk Score</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-xl font-bold">{formatCurrency(data.premium_analysis.total_final_premium)}</div>
              <div className="text-xs text-white/70">Premium</div>
            </CardContent>
          </Card>
        </div>

        {/* Network Visualization */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Network className="h-5 w-5 text-cyan-400" />
              Agent Workflow Diagram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-96 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-white/10 overflow-hidden">
              
              {/* SVG for connections */}
              <svg className="absolute inset-0 w-full h-full">
                {agentNodes.map((node, nodeIndex) => 
                  node.connections.map(connectionId => {
                    const targetIndex = agentNodes.findIndex(n => n.id === connectionId);
                    if (targetIndex === -1) return null;
                    
                    const target = agentNodes[targetIndex];
                    const isActive = completedConnections.includes(`${nodeIndex}-${targetIndex}`) || 
                                   (nodeIndex === currentStep - 1 && targetIndex === currentStep);
                    
                    return (
                      <line
                        key={`${node.id}-${connectionId}`}
                        x1={`${node.position.x}%`}
                        y1={`${node.position.y}%`}
                        x2={`${target.position.x}%`}
                        y2={`${target.position.y}%`}
                        stroke={isActive ? "#06b6d4" : "#475569"}
                        strokeWidth={isActive ? "3" : "1"}
                        strokeDasharray={isActive ? "0" : "5,5"}
                        className="transition-all duration-1000"
                      />
                    );
                  })
                )}
                

              </svg>

              {/* Agent Nodes */}
              {agentNodes.map((node) => (
                <div
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                  style={{
                    left: `${node.position.x}%`,
                    top: `${node.position.y}%`,
                  }}
                  onClick={() => {
                    setSelectedAgent(node);
                    setIsModalOpen(true);
                  }}
                >
                  <div className={`relative w-20 h-20 rounded-full border-4 ${
                    node.status === 'completed' ? 'border-green-400 bg-green-500' :
                    node.status === 'processing' ? 'border-cyan-400 bg-cyan-500 animate-pulse' :
                    'border-gray-400 bg-gray-500'
                  } shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center`}>
                    {/* Pulsing ring for processing */}
                    {node.status === 'processing' && (
                      <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-ping"></div>
                    )}
                    
                    {/* Agent Icon */}
                    <div className="relative z-10">
                      {agentIcons[node.agent_type]}
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold">
                      {node.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {node.status === 'processing' && <Zap className="h-4 w-4 text-blue-600 animate-pulse" />}
                      {node.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>
                  
                  {/* Node Label */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-white text-xs font-medium whitespace-nowrap bg-black/50 px-2 py-1 rounded">
                      {node.agent_type.split(' ')[0]}
                    </div>
                    {node.status === 'processing' && (
                      <div className="text-blue-600 text-xs mt-1 animate-pulse font-medium">
                        Processing...
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Central Processing Hub */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl ${isProcessing ? 'animate-spin' : ''}`}>
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-white text-sm font-bold">AI Hub</div>
                  <div className="text-white/70 text-xs">Processing Workflow</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          {agentNodes.map((node) => (
            <Card 
              key={node.id} 
              className={`bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer ${
                node.status === 'processing' ? 'ring-2 ring-cyan-400' : ''
              }`}
              onClick={() => {
                setSelectedAgent(node);
                setIsModalOpen(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${agentColors[node.agent_type]} flex items-center justify-center`}>
                    {agentIcons[node.agent_type]}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-sm">{node.agent_type.split(' ')[0]}</h4>
                    <p className="text-xs text-white/70">{node.agent_type.split(' ').slice(1).join(' ')}</p>
                  </div>
                  <Badge 
                    variant={node.status === 'completed' ? 'success' : node.status === 'processing' ? 'warning' : 'outline'}
                    className="text-xs"
                  >
                    {node.status}
                  </Badge>
                </div>
                <div className="text-center">
                  {node.status === 'processing' && (
                    <div className="text-cyan-400 text-xs animate-pulse">
                      Processing...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Final Results */}
        {!isProcessing && (
          <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3 text-white">
                <Sparkles className="h-8 w-8 text-purple-400" />
                <span className="text-2xl">Workflow Analysis Complete</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-white/70 mb-1">Final Decision</p>
                  <Badge 
                    variant={data.underwriting_decision.final_decision === 'accepted' ? 'success' : 'warning'} 
                    className="text-lg px-3 py-1"
                  >
                    {data.underwriting_decision.final_decision.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-white/70 mb-1">Annual Premium</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(data.premium_analysis.total_final_premium)}
                    </p>
                  </div>
                  <div 
                    className="text-center p-4 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition-all"
                    onClick={() => onViewAnalysis && onViewAnalysis()}
                  >
                    <p className="text-sm text-gray-600 mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {(data.underwriting_decision.confidence_score * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Click for details</p>
                  </div>
                </div>
                
                {/* View Comprehensive Analysis Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => onViewAnalysis && onViewAnalysis()}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    <Eye className="h-5 w-5" />
                    View Comprehensive Analysis
                  </button>
                </div>
              </CardContent>
            </Card>

        )}

        {/* Agent Modal */}
        <AgentModal
          agent={selectedAgent}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAgent(null);
          }}
        />
      </div>
    </div>
  );
};