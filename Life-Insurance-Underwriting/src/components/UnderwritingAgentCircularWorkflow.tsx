import React, { useState, useEffect } from 'react';
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
  RotateCw,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { UnderwritingReport } from '@/types/underwriting';

interface UnderwritingAgentCircularWorkflowProps {
  applicationId: string;
  data: UnderwritingReport;
  onBack: () => void;
  onReviewApprove?: () => void;
}

interface CircularAgent {
  id: string;
  name: string;
  agent_type: string;
  analysis: string;
  timestamp: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed';
  angle: number;
  color: string;
}

const agentIcons: { [key: string]: React.ReactNode } = {
  'Medical Review Specialist': <FileText className="h-8 w-8" />,
  'Fraud Detection Specialist': <Shield className="h-8 w-8" />,
  'Risk Assessment Specialist': <TrendingUp className="h-8 w-8" />,
  'Premium Calculation Specialist': <Calculator className="h-8 w-8" />,
  'Senior Underwriting Decision Maker': <UserCheck className="h-8 w-8" />
};

const agentColorSchemes = [
  { bg: 'from-red-500 to-pink-500', border: 'border-red-500', text: 'text-red-600' },
  { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-500', text: 'text-blue-600' },
  { bg: 'from-orange-500 to-yellow-500', border: 'border-orange-500', text: 'text-orange-600' },
  { bg: 'from-green-500 to-emerald-500', border: 'border-green-500', text: 'text-green-600' },
  { bg: 'from-purple-500 to-indigo-500', border: 'border-purple-500', text: 'text-purple-600' }
];

// Agent Modal Component
const CircularAgentModal: React.FC<{
  agent: CircularAgent | null;
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
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${agent.color} text-white`}>
                {agentIcons[agent.agent_type]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{agent.agent_type}</h2>
                <p className="text-sm text-gray-600">Circular Agent Analysis</p>
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
              <RotateCw className="h-5 w-5" />
              Detailed Analysis
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
              {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UnderwritingAgentCircularWorkflow: React.FC<UnderwritingAgentCircularWorkflowProps> = ({ 
  applicationId, 
  data, 
  onBack, 
  onReviewApprove 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<CircularAgent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Create circular agents
  const circularAgents: CircularAgent[] = Object.entries(data.detailed_agent_responses).map(
    ([key, agent], index) => ({
      id: key,
      name: key,
      agent_type: agent.agent_type,
      analysis: agent.analysis,
      timestamp: agent.timestamp,
      duration: [4, 3, 5, 2, 6][index] || 4,
      status: index < currentStep ? 'completed' : index === currentStep ? 'processing' : 'pending',
      angle: (index * 72) - 90, // 360/5 = 72 degrees between each agent
      color: agentColorSchemes[index].bg
    })
  );

  // Real-time processing with rotation animation
  useEffect(() => {
    if (isProcessing && !isPaused && currentStep < circularAgents.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setRotationAngle(prev => prev + 72); // Rotate by 72 degrees per step
      }, circularAgents[currentStep]?.duration * 1000 || 4000);

      return () => clearTimeout(timer);
    } else if (currentStep >= circularAgents.length) {
      setIsProcessing(false);
    }
  }, [currentStep, circularAgents, isProcessing, isPaused]);

  const handlePlayPause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsProcessing(true);
    setIsPaused(false);
    setRotationAngle(0);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const extractKeyMetric = (analysis: string, agentType: string): string => {
    switch (agentType) {
      case 'Medical Review Specialist':
        const loadingMatch = analysis.match(/(\d+%)/);
        return loadingMatch ? `${loadingMatch[1]}` : '123%';
      case 'Fraud Detection Specialist':
        return 'LOW RISK';
      case 'Risk Assessment Specialist':
        return '62.5%';
      case 'Premium Calculation Specialist':
        return '₹29,880';
      case 'Senior Underwriting Decision Maker':
        return 'APPROVED';
      default:
        return 'Processing';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <RotateCw className="h-6 w-6 text-pink-400" />
                  Circular Agent Processing
                </h1>
                <div className="flex items-center gap-4 text-sm text-white/70 mt-1">
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
                  className="flex items-center gap-2 px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
              <Badge variant={isProcessing ? "warning" : "success"} className="px-3 py-1 bg-white/20 border-white/30">
                {isProcessing ? (isPaused ? "Paused" : "Processing...") : "Complete"}
              </Badge>
              <div className="text-sm text-white/70">
                Step {currentStep} of {circularAgents.length}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress 
              value={(currentStep / circularAgents.length) * 100} 
              className="h-2 bg-white/20"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>Circular Flow Initiated</span>
              <span>{isProcessing ? 'Agents Processing...' : 'Flow Complete'}</span>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
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

        {/* Circular Visualization */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-pink-400" />
              Circular Agent Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-96 flex items-center justify-center">
              {/* Central Processing Hub */}
              <div className={`absolute w-32 h-32 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-2xl z-10 ${isProcessing ? 'animate-pulse' : ''}`}>
                <Brain className="h-12 w-12 text-white" />
                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-spin"></div>
              </div>
              
              {/* Agent Circles */}
              {circularAgents.map((agent) => {
                const radius = 140;
                const angle = (agent.angle + rotationAngle) * (Math.PI / 180);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                return (
                  <div
                    key={agent.id}
                    className="absolute transition-all duration-1000 ease-in-out cursor-pointer"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setIsModalOpen(true);
                    }}
                  >
                    <div className={`relative w-24 h-24 rounded-full bg-gradient-to-r ${agent.color} flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 ${
                      agent.status === 'processing' ? 'ring-4 ring-white animate-pulse' : ''
                    } ${
                      agent.status === 'completed' ? 'ring-2 ring-green-400' : ''
                    }`}>
                      {/* Agent Icon */}
                      <div className="text-white relative z-10">
                        {agentIcons[agent.agent_type]}
                      </div>
                      
                      {/* Status Indicator */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                        {agent.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {agent.status === 'processing' && <Zap className="h-5 w-5 text-blue-600 animate-pulse" />}
                        {agent.status === 'pending' && <Clock className="h-5 w-5 text-gray-400" />}
                      </div>
                      
                      {/* Processing Ring */}
                      {agent.status === 'processing' && (
                        <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
                      )}
                    </div>
                    
                    {/* Agent Label */}
                    <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 text-center">
                      <div className="text-white text-sm font-bold whitespace-nowrap bg-black/50 px-3 py-1 rounded-full">
                        {agent.agent_type.split(' ')[0]}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {circularAgents.map((agent, index) => {
                  if (index >= currentStep) return null;
                  
                  const nextIndex = (index + 1) % circularAgents.length;
                  const currentAngle = (agent.angle + rotationAngle) * (Math.PI / 180);
                  const nextAngle = (circularAgents[nextIndex].angle + rotationAngle) * (Math.PI / 180);
                  
                  const radius = 140;
                  const centerX = 192; // Half of container width
                  const centerY = 192; // Half of container height
                  
                  const x1 = centerX + Math.cos(currentAngle) * radius;
                  const y1 = centerY + Math.sin(currentAngle) * radius;
                  const x2 = centerX + Math.cos(nextAngle) * radius;
                  const y2 = centerY + Math.sin(nextAngle) * radius;
                  
                  return (
                    <line
                      key={`connection-${index}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    />
                  );
                })}
              </svg>
              
              {/* Central Label */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-white text-lg font-bold">AI Processing Hub</div>
                <div className="text-white/70 text-sm">Underwriting Analysis</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          {circularAgents.map((agent, index) => (
            <Card 
              key={agent.id} 
              className={`bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer transform hover:scale-105 ${
                agent.status === 'processing' ? 'ring-2 ring-pink-400 scale-105' : ''
              }`}
              onClick={() => {
                setSelectedAgent(agent);
                setIsModalOpen(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${agentColorSchemes[index].bg} flex items-center justify-center text-white`}>
                    {agentIcons[agent.agent_type]}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-sm">{agent.agent_type.split(' ')[0]}</h4>
                    <p className="text-xs text-white/70">{agent.agent_type.split(' ').slice(1).join(' ')}</p>
                  </div>
                  <Badge 
                    variant={agent.status === 'completed' ? 'success' : agent.status === 'processing' ? 'warning' : 'outline'}
                    className="text-xs"
                  >
                    {agent.status}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white mb-1">
                    {extractKeyMetric(agent.analysis, agent.agent_type)}
                  </div>
                  {agent.status === 'processing' && (
                    <div className="text-pink-300 text-xs animate-pulse">
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
          <Card className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 backdrop-blur-sm border-pink-500/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3 text-white">
                <Sparkles className="h-8 w-8 text-pink-400" />
                <span className="text-2xl">Circular Processing Complete</span>
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
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(data.premium_analysis.total_final_premium)}
                  </p>
                </div>
                <div 
                  className="text-center p-4 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-all"
                  onClick={() => onReviewApprove && onReviewApprove()}
                >
                  <p className="text-sm text-white/70 mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-white">
                    {(data.underwriting_decision.confidence_score * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-white/50 mt-1">Click for details</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Modal */}
        <CircularAgentModal
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