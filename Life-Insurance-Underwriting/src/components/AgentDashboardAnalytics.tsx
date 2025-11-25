import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Brain,
  Target,
  Zap,
  BarChart3,
  Timer
} from 'lucide-react';

interface AgentResponse {
  analysis: string;
  timestamp: string;
  agent_type: string;
}

interface Application {
  application_metadata: {
    application_id: string;
    applicant_name: string;
    processing_date: string;
    processing_time_seconds: number;
  };
  detailed_agent_responses: Record<string, AgentResponse>;
  underwriting_decision: {
    final_decision: string;
    confidence_score: number;
  };
  medical_loading_analysis: {
    risk_category: string;
  };
  quality_metrics: {
    analysis_confidence: number;
    system_performance_score: number;
  };
}

interface AgentDashboardAnalyticsProps {
  applications: Application[];
  onBack?: () => void;
}

interface AgentMetrics {
  agentType: string;
  totalApplications: number;
  averageProcessingTime: number;
  successRate: number;
  averageConfidence: number;
  riskCategoriesHandled: Record<string, number>;
  decisionTypes: Record<string, number>;
  workloadDistribution: number;
  performanceScore: number;
}

export function AgentDashboardAnalytics({ applications, onBack }: AgentDashboardAnalyticsProps) {

  // Calculate comprehensive agent metrics
  const agentMetrics = useMemo(() => {
    const agentMap = new Map<string, AgentMetrics>();
    
    applications.forEach(app => {
      Object.values(app.detailed_agent_responses).forEach(agent => {
        const agentKey = agent.agent_type;
        
        if (!agentMap.has(agentKey)) {
          agentMap.set(agentKey, {
            agentType: agentKey,
            totalApplications: 0,
            averageProcessingTime: 0,
            successRate: 0,
            averageConfidence: 0,
            riskCategoriesHandled: {},
            decisionTypes: {},
            workloadDistribution: 0,
            performanceScore: 0
          });
        }
        
        const metrics = agentMap.get(agentKey)!;
        metrics.totalApplications++;
        
        // Track risk categories
        const riskCategory = app.medical_loading_analysis.risk_category;
        metrics.riskCategoriesHandled[riskCategory] = (metrics.riskCategoriesHandled[riskCategory] || 0) + 1;
        
        // Track decision types
        const decision = app.underwriting_decision.final_decision;
        metrics.decisionTypes[decision] = (metrics.decisionTypes[decision] || 0) + 1;
        
        // Add processing time and confidence
        metrics.averageProcessingTime += app.application_metadata.processing_time_seconds;
        metrics.averageConfidence += app.underwriting_decision.confidence_score;
        metrics.performanceScore += app.quality_metrics.system_performance_score;
      });
    });
    
    // Calculate averages and percentages
    agentMap.forEach(metrics => {
      metrics.averageProcessingTime = metrics.averageProcessingTime / metrics.totalApplications;
      metrics.averageConfidence = metrics.averageConfidence / metrics.totalApplications;
      metrics.performanceScore = metrics.performanceScore / metrics.totalApplications;
      metrics.successRate = (metrics.decisionTypes['accepted'] || 0) / metrics.totalApplications;
      metrics.workloadDistribution = (metrics.totalApplications / applications.length) * 100;
    });
    
    return Array.from(agentMap.values()).sort((a, b) => b.totalApplications - a.totalApplications);
  }, [applications]);

  // Calculate system-wide metrics
  const systemMetrics = useMemo(() => {
    const totalAgents = agentMetrics.length;
    const totalApplicationsProcessed = applications.length;
    const averageAgentsPerApplication = agentMetrics.reduce((sum, agent) => sum + agent.totalApplications, 0) / applications.length;
    const overallEfficiency = agentMetrics.reduce((sum, agent) => sum + agent.performanceScore, 0) / totalAgents;
    const averageProcessingTime = applications.reduce((sum, app) => sum + app.application_metadata.processing_time_seconds, 0) / applications.length;
    
    return {
      totalAgents,
      totalApplicationsProcessed,
      averageAgentsPerApplication,
      overallEfficiency,
      averageProcessingTime
    };
  }, [agentMetrics, applications]);

  // Get agent performance trends
  const getAgentPerformanceTrend = (agent: AgentMetrics) => {
    if (agent.performanceScore >= 0.9) return { trend: 'excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (agent.performanceScore >= 0.8) return { trend: 'good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (agent.performanceScore >= 0.7) return { trend: 'average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { trend: 'needs_improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-100/50 transition-colors"
                >
                  ← Back to Dashboard
                </button>
              )}
              <div className="flex items-center gap-2">
                <Brain className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Agent Dashboard Analytics
                  </h1>
                  <p className="text-sm text-gray-500">
                    Multi-Agent System Performance & Workload Analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalAgents}</p>
                  <p className="text-xs text-blue-600">Specialized AI agents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Agents/Application</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.averageAgentsPerApplication.toFixed(1)}</p>
                  <p className="text-xs text-green-600">Multi-agent collaboration</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">System Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(systemMetrics.overallEfficiency)}</p>
                  <p className="text-xs text-purple-600">Overall performance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Timer className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTime(systemMetrics.averageProcessingTime)}</p>
                  <p className="text-xs text-orange-600">Per application</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Agent Performance
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Key Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Compact Agent Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agentMetrics.map((agent, index) => {
                const trend = getAgentPerformanceTrend(agent);
                return (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm truncate">{agent.agentType.split(' ')[0]} Agent</h4>
                        <Badge className={trend.bgColor} variant="outline">
                          <span className={trend.color}>{formatPercentage(agent.performanceScore)}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="font-bold text-blue-600">{agent.totalApplications}</div>
                          <div className="text-gray-500">Cases</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-bold text-green-600">{formatPercentage(agent.successRate)}</div>
                          <div className="text-gray-500">Success</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Confidence</span>
                          <span>{formatPercentage(agent.averageConfidence)}</span>
                        </div>
                        <Progress value={agent.averageConfidence * 100} className="h-1.5" />
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        {formatTime(agent.averageProcessingTime)} avg time
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Quick Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5" />
                  System Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{systemMetrics.totalAgents}</div>
                    <div className="text-sm text-gray-500">Active Agents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{systemMetrics.averageAgentsPerApplication.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">Agents/Case</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatPercentage(systemMetrics.overallEfficiency)}</div>
                    <div className="text-sm text-gray-500">Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{formatTime(systemMetrics.averageProcessingTime)}</div>
                    <div className="text-sm text-gray-500">Avg Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="insights" className="space-y-6">
            {/* Quick Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-sm">Top Performer</span>
                </div>
                <div className="text-lg font-bold text-green-700">
                  {agentMetrics.reduce((prev, current) => 
                    prev.performanceScore > current.performanceScore ? prev : current
                  ).agentType.split(' ')[0]}
                </div>
                <div className="text-sm text-green-600">
                  {formatPercentage(agentMetrics.reduce((prev, current) => 
                    prev.performanceScore > current.performanceScore ? prev : current
                  ).performanceScore)} score
                </div>
              </Card>

              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-sm">Most Active</span>
                </div>
                <div className="text-lg font-bold text-blue-700">
                  {agentMetrics.reduce((prev, current) => 
                    prev.totalApplications > current.totalApplications ? prev : current
                  ).agentType.split(' ')[0]}
                </div>
                <div className="text-sm text-blue-600">
                  {agentMetrics.reduce((prev, current) => 
                    prev.totalApplications > current.totalApplications ? prev : current
                  ).totalApplications} cases
                </div>
              </Card>

              <Card className="p-4 bg-purple-50 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-sm">System Health</span>
                </div>
                <div className="text-lg font-bold text-purple-700">
                  {formatPercentage(systemMetrics.overallEfficiency)}
                </div>
                <div className="text-sm text-purple-600">Overall efficiency</div>
              </Card>

              <Card className="p-4 bg-orange-50 border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-sm">Speed</span>
                </div>
                <div className="text-lg font-bold text-orange-700">
                  {formatTime(systemMetrics.averageProcessingTime)}
                </div>
                <div className="text-sm text-orange-600">Avg processing</div>
              </Card>
            </div>

            {/* Agent Risk Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Risk Handling Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['HIGH RISK', 'MEDIUM RISK', 'LOW RISK'].map((riskLevel) => {
                    const casesInRisk = applications.filter(app => 
                      app.medical_loading_analysis.risk_category === riskLevel
                    ).length;
                    const color = riskLevel === 'HIGH RISK' ? 'red' : riskLevel === 'MEDIUM RISK' ? 'yellow' : 'green';
                    
                    return (
                      <div key={riskLevel} className={`border rounded-lg p-4 bg-${color}-50`}>
                        <div className="text-center">
                          <Badge 
                            variant={riskLevel === 'HIGH RISK' ? 'danger' : riskLevel === 'MEDIUM RISK' ? 'warning' : 'success'}
                            className="mb-2"
                          >
                            {riskLevel}
                          </Badge>
                          <div className="text-2xl font-bold">{casesInRisk}</div>
                          <div className="text-sm text-gray-600">Applications</div>
                          <div className="text-xs text-gray-500 mt-2">
                            {agentMetrics.length} agents involved
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3 bg-blue-50">
                    <div className="font-medium text-sm text-blue-800 mb-1">Load Balancing</div>
                    <div className="text-xs text-blue-700">
                      Redistribute workload across agents for optimal performance
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 bg-green-50">
                    <div className="font-medium text-sm text-green-800 mb-1">Best Practices</div>
                    <div className="text-xs text-green-700">
                      Apply top performer strategies system-wide
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-100/30 mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>Agent Analytics Dashboard</div>
            <div className="flex items-center gap-3">
              <span>{systemMetrics.totalAgents} Agents</span>
              <span>•</span>
              <span>{systemMetrics.totalApplicationsProcessed} Cases</span>
              <span>•</span>
              <span>{formatPercentage(systemMetrics.overallEfficiency)} Efficiency</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}