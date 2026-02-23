import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Sparkles,
  Clock,
  Zap,
  Network,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { UnderwritingReport } from '@/types/underwriting';
import { createReadableAnalysisSummary, extractKeyFindings } from '@/utils/markdownSimplifier';
import { triggerUnderwritingProcess, buildApplicationDataFromReport } from '@/utils/underwritingApi';

interface UnderwritingAgentNetworkLightWorkflowProps {
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
  stage?: number;
  isParallel?: boolean;
}

const agentIcons: { [key: string]: React.ReactNode } = {
  'Clinical Risk Assessment': <FileText className="h-6 w-6 text-blue-600" />,
  'Diagnostic Validator': <FileText className="h-6 w-6 text-blue-600" />,
  'Medical Review Specialist': <FileText className="h-6 w-6 text-blue-600" />,
  'Fraud Detection Specialist': <Shield className="h-6 w-6 text-blue-600" />,
  'Risk Assessment Specialist': <TrendingUp className="h-6 w-6 text-blue-600" />,
  'Premium Calculation Specialist': <Calculator className="h-6 w-6 text-blue-600" />,
  'Senior Underwriting Decision Maker': <UserCheck className="h-6 w-6 text-blue-600" />,
  'Underwriting Decision Maker': <UserCheck className="h-6 w-6 text-blue-600" />
};

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

const _extractKeyMetric = (analysis: string, agentType: string): string => {
  const { keyMetrics } = extractKeyFindings(analysis, agentType);
  
  if (keyMetrics.length > 0) {
    // Return the first key metric, formatted for display
    return keyMetrics[0];
  }
  
  // Fallback to simple extraction
  switch (agentType) {
    case 'Clinical Risk Assessment':
    case 'Diagnostic Validator':
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

export const UnderwritingAgentNetworkLightWorkflow: React.FC<UnderwritingAgentNetworkLightWorkflowProps> = ({ 
  applicationId, 
  data, 
  onBack, 
  onReviewApprove: _onReviewApprove,
  onViewAnalysis
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completedConnections, setCompletedConnections] = useState<string[]>([]);
  const [_parallelCompleted, setParallelCompleted] = useState<number[]>([]);

  // Create agent nodes with linear workflow positions (memoized to prevent re-creation)
  const baseAgentNodes = useMemo(() => {
    const agentEntries = Object.entries(data.detailed_agent_responses);
    const keys = agentEntries.map(([key]) => key);
    
    // Define workflow structure:
    // Stage 1: Medical Review (Single agent)
    // Stage 2: Fraud Detection + Risk Assessment (Parallel)
    // Stage 3: Premium Calculation (Single agent)
    // Stage 4: Final Decision (Single agent)
    
    return agentEntries.map(([key, agent], index) => {
      let position = { x: 0, y: 0 };
      let connections: string[] = [];
      
      // Stage 1: Medical Review (left) - equal padding from left edge
      if (index === 0) {
        position = { x: 12, y: 50 };
        // Connects to both parallel agents
        connections = keys.slice(1, 3);
      }
      // Stage 2a: Fraud Detection (middle-left, top branch)
      else if (index === 1) {
        position = { x: 37, y: 25 };
        // Connects to Premium Calculation
        connections = [keys[3]];
      }
      // Stage 2b: Risk Assessment (middle-left, bottom branch) - Parallel to Fraud
      else if (index === 2) {
        position = { x: 37, y: 75 };
        // Connects to Premium Calculation
        connections = [keys[3]];
      }
      // Stage 3: Premium Calculation (middle-right, center) - exactly centered
      else if (index === 3) {
        position = { x: 62, y: 50 };
        // Connects to Final Decision
        connections = [keys[4]];
      }
      // Stage 4: Final Decision (right) - equal padding from right edge
      else if (index === 4) {
        position = { x: 88, y: 50 };
        // No further connections
        connections = [];
      }
      
      return {
        id: key,
        name: key,
        agent_type: agent.agent_type,
        analysis: agent.analysis,
        timestamp: agent.timestamp,
        duration: [5, 4, 4, 3, 2][index] || 4,
        position,
        connections,
        stage: index === 0 ? 1 : (index === 1 || index === 2) ? 2 : index === 3 ? 3 : 4,
        isParallel: index === 1 || index === 2
      };
    });
  }, [data.detailed_agent_responses]);

  // Applications that are already fully processed — skip animation for demo
  const isAlreadyProcessed = ['LI2025090002', 'LI2025090003', 'LI2025090005'].includes(applicationId); // Rajesh Kumar, Ananya R, Priya Sharma

  // Add status to agent nodes based on current step
  const agentNodes: AgentNode[] = baseAgentNodes.map((node, index) => {
    let status: 'pending' | 'processing' | 'completed' = 'pending';
    
    // Handle all agents with proper processing state
    if (index === 0 && currentStep === 0 && isProcessing) {
      // Medical Review processing
      status = 'processing';
    } else if (index === 0 && currentStep >= 1) {
      // Medical Review completed
      status = 'completed';
    } else if ((index === 1 || index === 2) && currentStep === 1 && isProcessing) {
      // Both parallel agents processing
      status = 'processing';
    } else if ((index === 1 || index === 2) && currentStep > 1) {
      // Both parallel agents completed
      status = 'completed';
    } else if (index === 3 && currentStep === 2 && isProcessing) {
      // Premium Calculation processing
      status = 'processing';
    } else if (index === 3 && currentStep >= 3) {
      // Premium Calculation completed
      status = 'completed';
    } else if (index === 4 && currentStep === 3 && isProcessing) {
      // Decision Maker processing
      status = 'processing';
    } else if (index === 4 && currentStep >= 4) {
      // Decision Maker completed (for pre-processed applications, show as done)
      status = isAlreadyProcessed ? 'completed' : 'processing';
    }
    
    return { ...node, status };
  });

  // Real-time processing simulation with parallel processing support
  useEffect(() => {
    if (!isProcessing || isPaused) {
      return;
    }

    // Workflow stages:
    // Step 0: Medical Review (index 0)
    // Step 1: Fraud Detection + Risk Assessment in parallel (index 1 & 2)
    // Step 2: Premium Calculation (index 3)
    // Step 3: Final Decision (index 4)
    
    let duration = 4;
    let nextStep = currentStep;
    
    if (currentStep === 0) {
      // Medical Review
      duration = baseAgentNodes[0]?.duration || 5;
      nextStep = 1;
      console.log(`Step 0: Medical Review processing for ${duration}s`);
    } else if (currentStep === 1) {
      // Parallel processing - take the max duration
      const fraud = baseAgentNodes[1]?.duration || 4;
      const risk = baseAgentNodes[2]?.duration || 4;
      duration = Math.max(fraud, risk);
      nextStep = 2;
      console.log(`Step 1: Parallel processing (Fraud + Risk) for ${duration}s`);
    } else if (currentStep === 2) {
      // Premium Calculation
      duration = baseAgentNodes[3]?.duration || 3;
      nextStep = 3;
      console.log(`Step 2: Premium Calculation processing for ${duration}s`);
    } else if (currentStep === 3) {
      // Final Decision
      duration = baseAgentNodes[4]?.duration || 2;
      nextStep = 4;
      console.log(`Step 3: Final Decision processing for ${duration}s`);
    } else {
      console.log('All steps completed');
      setIsProcessing(false);
      return;
    }
    
    const timer = setTimeout(() => {
      console.log(`Completing step ${currentStep}, moving to step ${nextStep}`);
      
      // Add connections based on current step
      if (currentStep === 0) {
        // Medical Review connects to both parallel agents
        setCompletedConnections(prev => [...prev, '0-1', '0-2']);
      } else if (currentStep === 1) {
        // Both parallel agents connect to Premium Calculation
        setCompletedConnections(prev => [...prev, '1-3', '2-3']);
      } else if (currentStep === 2) {
        // Premium Calculation connects to Final Decision
        setCompletedConnections(prev => [...prev, '3-4']);
      }
      
      setCurrentStep(nextStep);
    }, duration * 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [currentStep, isProcessing, isPaused, baseAgentNodes]);

  const handlePlayPause = () => {
    setIsPaused(!isPaused);
  };

  // Track if API has been called for this session
  const apiCalledRef = useRef(false);

  // Function to trigger the backend API (fire-and-forget)
  const triggerBackendProcessing = () => {
    if (apiCalledRef.current) {
      console.log('ℹ️ API already called for this workflow session');
      return;
    }
    
    apiCalledRef.current = true;
    const applicationData = buildApplicationDataFromReport(data);
    triggerUnderwritingProcess(applicationData);
  };

  const handleReset = () => {
    if (isAlreadyProcessed) {
      // For pre-processed apps, reset just shows completed state again
      setCurrentStep(4);
      setIsProcessing(false);
      setCompletedConnections(['0-1', '0-2', '1-3', '2-3', '3-4']);
      return;
    }

    setCurrentStep(0);
    setIsPaused(false);
    setCompletedConnections([]);
    setParallelCompleted([]);
    
    // Reset API call tracking and trigger new API call
    apiCalledRef.current = false;
    triggerBackendProcessing();
    
    // Start processing after a brief delay to show initial state
    setTimeout(() => setIsProcessing(true), 100);
  };
  
  // Auto-start processing on mount
  useEffect(() => {
    if (isAlreadyProcessed) {
      // Instantly show completed workflow — no animation, no delays
      setCurrentStep(4);
      setIsProcessing(false);
      setCompletedConnections(['0-1', '0-2', '1-3', '2-3', '3-4']);
      console.log('✅ Pre-processed application — showing completed workflow');
      return;
    }

    const startTimer = setTimeout(() => {
      // Trigger the backend API when workflow starts
      triggerBackendProcessing();
      setIsProcessing(true);
    }, 500);
    
    return () => clearTimeout(startTimer);
  }, []);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-50 shadow-green-200';
      case 'processing': return 'border-blue-500 bg-blue-50 animate-pulse shadow-blue-200';
      case 'pending': return 'border-gray-300 bg-gray-50 shadow-gray-200';
      default: return 'border-gray-300 bg-gray-50 shadow-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Combined Header and Network Visualization */}
        <Card className="bg-white border-blue-200 shadow-xl mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </button>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Network className="h-6 w-6 text-blue-600" />
                    Global Trust Life - Agent Workflow Diagram
                  </CardTitle>
                  <p className="text-gray-600 mt-1 text-sm">
                    AI-Powered Multi-Agent Underwriting Process Visualization
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
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
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                </div>
                <Badge variant={isProcessing ? "warning" : "success"} className="px-3 py-1 bg-blue-100 border-blue-300 text-blue-800">
                  {isProcessing ? (isPaused ? "Paused" : "Processing...") : "Complete"}
                </Badge>
                <div className="text-sm text-gray-600">
                  Agent {currentStep + 1} of {agentNodes.length}
                  {isProcessing && currentStep < agentNodes.length && (
                    <div className="text-xs text-blue-600 mt-1 animate-pulse">
                      Processing: {agentNodes[currentStep]?.agent_type.split(' ')[0]}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <Progress 
                value={(currentStep / agentNodes.length) * 100} 
                className="h-2 bg-blue-100"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Workflow Initialization</span>
                <span>{isProcessing ? 'Processing Workflow...' : 'Analysis Complete'}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="relative w-full h-[700px] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 overflow-hidden shadow-inner">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
                    </pattern>
                    <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="10" cy="10" r="1" fill="#6366f1" opacity="0.4"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>
              </div>
              
              {/* SVG for connections */}
              <svg className="absolute inset-0 w-full h-full z-0">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#60a5fa" />
                  </marker>
                  <marker id="arrowhead-inactive" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#d1d5db" />
                  </marker>
                </defs>
                
                {agentNodes.map((node, nodeIndex) => 
                  node.connections.map(connectionId => {
                    const targetIndex = agentNodes.findIndex(n => n.id === connectionId);
                    if (targetIndex === -1) return null;
                    
                    const target = agentNodes[targetIndex];
                    const isActive = completedConnections.includes(`${nodeIndex}-${targetIndex}`) || 
                                   (nodeIndex === currentStep - 1 && targetIndex === currentStep) ||
                                   (nodeIndex < currentStep);
                    
                    return (
                      <g key={`${node.id}-${connectionId}`}>
                        <line
                          x1={`${node.position.x}%`}
                          y1={`${node.position.y}%`}
                          x2={`${target.position.x}%`}
                          y2={`${target.position.y}%`}
                          stroke={isActive ? "#60a5fa" : "#d1d5db"}
                          strokeWidth={isActive ? "3" : "1.5"}
                          strokeDasharray={isActive ? "0" : "4,4"}
                          strokeOpacity={isActive ? "0.9" : "0.4"}
                          markerEnd={isActive ? "url(#arrowhead)" : "url(#arrowhead-inactive)"}
                        />
                      </g>
                    );
                  })
                )}
                
                {/* Data flow particles */}
                {completedConnections.map((connection, idx) => {
                  const [from, to] = connection.split('-').map(Number);
                  const fromNode = agentNodes[from];
                  const toNode = agentNodes[to];
                  if (!fromNode || !toNode) return null;
                  
                  return (
                    <circle
                      key={`particle-${idx}`}
                      r="5"
                      fill="#3b82f6"
                      className="animate-pulse"
                    >
                      <animateMotion
                        dur="2s"
                        repeatCount="indefinite"
                        path={`M ${fromNode.position.x} ${fromNode.position.y} L ${toNode.position.x} ${toNode.position.y}`}
                      />
                    </circle>
                  );
                })}
              </svg>

              {/* Stage Labels */}
              <div className="absolute left-[12%] top-[8%] text-xs font-bold text-blue-700 bg-white px-3 py-1 rounded-full shadow-md border border-blue-200 z-10 transform -translate-x-1/2">
                Stage 1
              </div>
              <div className="absolute left-[37%] top-[8%] text-xs font-bold text-blue-700 bg-white px-3 py-1 rounded-full shadow-md border border-blue-200 z-10 transform -translate-x-1/2">
                Stage 2
              </div>
              <div className="absolute left-[62%] top-[8%] text-xs font-bold text-blue-700 bg-white px-3 py-1 rounded-full shadow-md border border-blue-200 z-10 transform -translate-x-1/2">
                Stage 3
              </div>
              <div className="absolute left-[88%] top-[8%] text-xs font-bold text-blue-700 bg-white px-3 py-1 rounded-full shadow-md border border-blue-200 z-10 transform -translate-x-1/2">
                Stage 4
              </div>
              
              {/* Agent Nodes */}
              {agentNodes.map((node, nodeIndex) => {
                // Decision Maker (index 4) is clickable when in processing state after step 3
                const isDecisionMakerReady = nodeIndex === 4 && currentStep >= 4;
                const isClickable = node.status === 'completed' || isDecisionMakerReady;
                
                return (
                <div
                  key={node.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  style={{
                    left: `${node.position.x}%`,
                    top: `${node.position.y}%`,
                  }}
                  onClick={() => {
                    // Allow clicking on completed agents or Decision Maker after processing
                    if (isClickable) {
                      setSelectedAgent(node);
                      setIsModalOpen(true);
                    }
                  }}
                >
                  {/* Parallel Processing Highlight */}
                  {node.isParallel && (
                    <div className="absolute -inset-4 bg-blue-200 bg-opacity-30 rounded-full animate-pulse z-0"></div>
                  )}
                  
                  <div className={`relative w-24 h-24 rounded-full border-4 ${getNodeStatusColor(node.status)} shadow-xl transition-all duration-300 flex items-center justify-center ${node.isParallel ? 'ring-4 ring-blue-300 ring-opacity-50' : ''} ${isClickable ? 'hover:shadow-2xl hover:scale-110' : 'opacity-70'}`}>
                    {/* Pulsing ring for processing */}
                    {node.status === 'processing' && (
                      <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping"></div>
                    )}
                    
                    {/* Agent Icon */}
                    <div className="relative z-10">
                      {agentIcons[node.agent_type]}
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-white bg-white flex items-center justify-center text-xs font-bold shadow-lg">
                      {node.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {node.status === 'processing' && <Zap className="h-5 w-5 text-blue-600 animate-pulse" />}
                      {node.status === 'pending' && <Clock className="h-5 w-5 text-gray-400" />}
                    </div>
                  </div>
                  
                  {/* Node Label */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-center max-w-32">
                    <div className="text-gray-800 text-xs font-medium bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 leading-tight">
                      {node.agent_type}
                    </div>
                    {node.status === 'processing' && (
                      <div className="text-blue-600 text-xs mt-1 animate-pulse font-medium">
                        {nodeIndex === 4 && currentStep >= 4 ? 'Manual Review' : 'Processing...'}
                      </div>
                    )}
                  </div>
                </div>
              );
              })}


            </div>
          </CardContent>
        </Card>

        {/* Final Results */}
        {currentStep >= 4 && (
          <>
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-300 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-3 text-gray-800">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                  <span className="text-2xl">Workflow Analysis Complete</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <h3 className="text-xl font-bold text-yellow-800">Manual Review Required</h3>
                  </div>
                  <p className="text-center text-gray-700">
                    All automated agent analyses are complete. Click on the Underwriting Decision Maker node to review the consolidated findings and make the final decision.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Recommended Decision</p>
                    <Badge 
                      variant={data.underwriting_decision.final_decision === 'accepted' ? 'success' : 'warning'} 
                      className="text-lg px-3 py-1"
                    >
                      {data.underwriting_decision.final_decision.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Calculated Annual Premium</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ₹{extractPremiumFromAgent(data).toLocaleString('en-IN')}
                    </p>
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

          </>
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