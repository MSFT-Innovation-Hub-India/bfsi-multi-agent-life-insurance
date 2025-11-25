import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity,
  TrendingUp,
  Clock,
  Target,
  DollarSign,
  Users,
  Zap,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Gauge,
  Award,
  Brain,
  Timer,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trophy
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
    total_loading_percentage: number;
  };
  premium_analysis: {
    total_final_premium: number;
    total_base_premium: number;
  };
  quality_metrics: {
    analysis_confidence: number;
    system_performance_score: number;
    data_completeness_score: number;
  };
  fraud_assessment: {
    overall_fraud_risk: string;
    fraud_score: number;
  };
  business_impact: {
    business_value_score: number;
    estimated_processing_time_days: number;
  };
}

interface AgentPerformanceDashboardProps {
  applications: Application[];
  onBack?: () => void;
}

interface AgentKPI {
  agentType: string;
  efficiency: number;          // Processing speed vs benchmark
  accuracy: number;           // Confidence score average
  throughput: number;         // Cases processed per hour
  businessImpact: number;     // Revenue/value generated
  errorRate: number;          // Percentage of decisions overturned
  avgProcessingTime: number;  // Average time per case
  qualityScore: number;       // Overall quality metric
  workloadBalance: number;    // Workload distribution fairness
  costPerCase: number;        // Operational cost per case
  customerSatisfaction: number; // Based on decision acceptance
  trend: 'up' | 'down' | 'stable';
}

export function AgentPerformanceDashboard({ applications, onBack }: AgentPerformanceDashboardProps) {
  
  // Calculate comprehensive KPIs for each agent
  const agentKPIs = useMemo(() => {
    const kpiMap = new Map<string, AgentKPI>();
    const totalApplications = applications.length;
    const totalProcessingTime = applications.reduce((sum, app) => sum + app.application_metadata.processing_time_seconds, 0);
    const avgProcessingTime = totalProcessingTime / totalApplications;
    
    applications.forEach(app => {
      Object.values(app.detailed_agent_responses).forEach(agent => {
        const agentKey = agent.agent_type;
        
        if (!kpiMap.has(agentKey)) {
          kpiMap.set(agentKey, {
            agentType: agentKey,
            efficiency: 0,
            accuracy: 0,
            throughput: 0,
            businessImpact: 0,
            errorRate: 0,
            avgProcessingTime: 0,
            qualityScore: 0,
            workloadBalance: 0,
            costPerCase: 0,
            customerSatisfaction: 0,
            trend: 'stable'
          });
        }
        
        const kpi = kpiMap.get(agentKey)!;
        
        // Efficiency: Processing speed relative to average
        const processingEfficiency = Math.max(0, 100 - ((app.application_metadata.processing_time_seconds / avgProcessingTime) * 100));
        kpi.efficiency += processingEfficiency;
        
        // Accuracy: Based on confidence scores
        kpi.accuracy += app.underwriting_decision.confidence_score * 100;
        
        // Business Impact: Premium value and business score
        const premiumValue = app.premium_analysis.total_final_premium;
        const businessValue = app.business_impact.business_value_score * 100;
        kpi.businessImpact += (premiumValue / 100000) * businessValue; // Normalized
        
        // Quality Score: System performance
        kpi.qualityScore += app.quality_metrics.system_performance_score * 100;
        
        // Processing Time
        kpi.avgProcessingTime += app.application_metadata.processing_time_seconds;
        
        // Error Rate: Based on fraud risk and decision confidence
        const riskPenalty = app.fraud_assessment.overall_fraud_risk === 'HIGH' ? 10 : 
                           app.fraud_assessment.overall_fraud_risk === 'MEDIUM' ? 5 : 0;
        kpi.errorRate += riskPenalty + (100 - app.underwriting_decision.confidence_score * 100);
        
        // Customer Satisfaction: Based on decision type and confidence
        const satisfactionScore = app.underwriting_decision.final_decision === 'accepted' ? 95 :
                                 app.underwriting_decision.final_decision === 'additional_requirements' ? 75 : 45;
        kpi.customerSatisfaction += satisfactionScore;
      });
    });
    
    // Calculate averages and normalize
    const agentCounts = new Map<string, number>();
    applications.forEach(app => {
      Object.values(app.detailed_agent_responses).forEach(agent => {
        agentCounts.set(agent.agent_type, (agentCounts.get(agent.agent_type) || 0) + 1);
      });
    });
    
    kpiMap.forEach((kpi, agentType) => {
      const count = agentCounts.get(agentType) || 1;
      kpi.efficiency = Math.min(100, kpi.efficiency / count);
      kpi.accuracy = Math.min(100, kpi.accuracy / count);
      kpi.businessImpact = kpi.businessImpact / count;
      kpi.qualityScore = Math.min(100, kpi.qualityScore / count);
      kpi.avgProcessingTime = kpi.avgProcessingTime / count;
      kpi.errorRate = Math.min(100, kpi.errorRate / count);
      kpi.customerSatisfaction = Math.min(100, kpi.customerSatisfaction / count);
      kpi.throughput = (count / (totalProcessingTime / 3600)) * 100; // Cases per hour normalized
      kpi.workloadBalance = (count / totalApplications) * 100;
      kpi.costPerCase = (kpi.avgProcessingTime / 60) * 2.5; // $2.5 per minute operational cost
      
      // Determine trend based on performance
      const overallPerformance = (kpi.efficiency + kpi.accuracy + kpi.qualityScore) / 3;
      kpi.trend = overallPerformance > 85 ? 'up' : overallPerformance < 70 ? 'down' : 'stable';
    });
    
    return Array.from(kpiMap.values()).sort((a, b) => 
      ((b.efficiency + b.accuracy + b.qualityScore) / 3) - ((a.efficiency + a.accuracy + a.qualityScore) / 3)
    );
  }, [applications]);

  // System-wide KPIs
  const systemKPIs = useMemo(() => {
    const totalRevenue = applications.reduce((sum, app) => sum + app.premium_analysis.total_final_premium, 0);
    const avgBusinessValue = applications.reduce((sum, app) => sum + app.business_impact.business_value_score, 0) / applications.length;
    const avgProcessingTime = applications.reduce((sum, app) => sum + app.application_metadata.processing_time_seconds, 0) / applications.length;
    const avgConfidence = applications.reduce((sum, app) => sum + app.underwriting_decision.confidence_score, 0) / applications.length;
    const acceptanceRate = applications.filter(app => app.underwriting_decision.final_decision === 'accepted').length / applications.length;
    const operationalCost = agentKPIs.reduce((sum, agent) => sum + (agent.costPerCase * agent.workloadBalance), 0);
    
    return {
      totalRevenue,
      avgBusinessValue: avgBusinessValue * 100,
      avgProcessingTime,
      avgConfidence: avgConfidence * 100,
      acceptanceRate: acceptanceRate * 100,
      operationalCost,
      roi: ((totalRevenue - operationalCost) / operationalCost) * 100,
      totalCases: applications.length,
      agentUtilization: (agentKPIs.reduce((sum, agent) => sum + agent.workloadBalance, 0) / agentKPIs.length)
    };
  }, [applications, agentKPIs]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Executive Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  ← Back
                </button>
              )}
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-xl">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Agent Performance Analytics</h1>
                  <p className="text-gray-600 mt-1">Executive Dashboard - Efficiency, Accuracy & Business Impact</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(systemKPIs.totalRevenue)}</div>
                <div className="text-sm text-gray-600">Total Revenue Generated</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{systemKPIs.roi.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Return on Investment</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* System-Wide KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-medium text-sm">System Efficiency</p>
                  <p className="text-3xl font-bold text-blue-800">{systemKPIs.avgConfidence.toFixed(1)}%</p>
                  <p className="text-xs text-blue-600 mt-1">Avg Confidence Score</p>
                </div>
                <Gauge className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-medium text-sm">Processing Speed</p>
                  <p className="text-3xl font-bold text-green-800">{formatTime(systemKPIs.avgProcessingTime)}</p>
                  <p className="text-xs text-green-600 mt-1">Avg Processing Time</p>
                </div>
                <Timer className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 font-medium text-sm">Acceptance Rate</p>
                  <p className="text-3xl font-bold text-purple-800">{systemKPIs.acceptanceRate.toFixed(1)}%</p>
                  <p className="text-xs text-purple-600 mt-1">Customer Satisfaction</p>
                </div>
                <Award className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 font-medium text-sm">Agent Utilization</p>
                  <p className="text-3xl font-bold text-orange-800">{systemKPIs.agentUtilization.toFixed(1)}%</p>
                  <p className="text-xs text-orange-600 mt-1">Workload Balance</p>
                </div>
                <Users className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Efficiency
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Business Impact
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            {/* Agent Performance Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Agent Performance Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentKPIs.map((agent, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm">
                          <span className="text-lg font-bold text-gray-700">#{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{agent.agentType.split(' ')[0]} Agent</h4>
                          <p className="text-sm text-gray-600">{agent.agentType}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-6 text-center">
                        <div>
                          <div className={`text-lg font-bold ${getPerformanceColor(agent.accuracy)}`}>
                            {agent.accuracy.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Accuracy</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${getPerformanceColor(agent.efficiency)}`}>
                            {agent.efficiency.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Efficiency</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(agent.businessImpact * 1000)}
                          </div>
                          <div className="text-xs text-gray-500">Revenue</div>
                        </div>
                        <div className="flex items-center">
                          {getTrendIcon(agent.trend)}
                          <span className="text-sm text-gray-600 ml-1">
                            {agent.trend === 'up' ? 'Improving' : agent.trend === 'down' ? 'Declining' : 'Stable'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Quality Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agentKPIs.map((agent, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">{agent.agentType.split(' ')[0]}</span>
                          <span className="font-bold">{agent.qualityScore.toFixed(1)}%</span>
                        </div>
                        <Progress value={agent.qualityScore} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Processing Speed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agentKPIs.map((agent, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium text-sm">{agent.agentType.split(' ')[0]}</span>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">{formatTime(agent.avgProcessingTime)}</div>
                          <div className="text-xs text-gray-500">avg time</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Throughput Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5" />
                    Throughput Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agentKPIs.map((agent, index) => (
                      <div key={index} className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">{agent.agentType.split(' ')[0]}</span>
                          <Badge variant="outline" className="text-xs">
                            {agent.throughput.toFixed(1)} cases/hr
                          </Badge>
                        </div>
                        <Progress value={agent.throughput} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cost Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5" />
                    Cost Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agentKPIs.map((agent, index) => (
                      <div key={index} className="border-l-4 border-green-500 pl-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{agent.agentType.split(' ')[0]}</span>
                          <div className="text-right">
                            <div className="font-bold text-green-600">${agent.costPerCase.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">per case</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Error Rate Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5" />
                    Error Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agentKPIs.map((agent, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        agent.errorRate < 10 ? 'bg-green-50' : 
                        agent.errorRate < 20 ? 'bg-yellow-50' : 'bg-red-50'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{agent.agentType.split(' ')[0]}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                              agent.errorRate < 10 ? 'text-green-600' : 
                              agent.errorRate < 20 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {agent.errorRate.toFixed(1)}%
                            </span>
                            {agent.errorRate < 10 ? 
                              <CheckCircle className="h-4 w-4 text-green-600" /> :
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            {/* Business Impact Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-800">{formatCurrency(systemKPIs.totalRevenue)}</div>
                  <div className="text-sm text-green-600">Total Revenue Generated</div>
                  <div className="text-xs text-green-500 mt-1">from {systemKPIs.totalCases} cases</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-blue-800">{systemKPIs.avgBusinessValue.toFixed(1)}%</div>
                  <div className="text-sm text-blue-600">Avg Business Value</div>
                  <div className="text-xs text-blue-500 mt-1">quality indicator</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-purple-800">{systemKPIs.roi.toFixed(1)}%</div>
                  <div className="text-sm text-purple-600">Return on Investment</div>
                  <div className="text-xs text-purple-500 mt-1">operational efficiency</div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Agent */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Generation by Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentKPIs.map((agent, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{agent.agentType.split(' ')[0]} Agent</h4>
                          <p className="text-sm text-gray-600">Workload: {agent.workloadBalance.toFixed(1)}%</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(agent.businessImpact * 1000)}
                        </div>
                        <div className="text-sm text-gray-600">Revenue Impact</div>
                        <div className="text-xs text-green-600">
                          {((agent.businessImpact * 1000 / systemKPIs.totalRevenue) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* AI-Generated Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-800">
                    <Brain className="h-5 w-5" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-800 mb-1">Top Performer</h4>
                      <p className="text-sm text-gray-700">
                        {agentKPIs[0]?.agentType} leads with {agentKPIs[0]?.accuracy.toFixed(1)}% accuracy 
                        and {agentKPIs[0]?.efficiency.toFixed(1)}% efficiency rating.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800 mb-1">Speed Champion</h4>
                      <p className="text-sm text-gray-700">
                        Fastest processing time: {formatTime(Math.min(...agentKPIs.map(a => a.avgProcessingTime)))} 
                        average per case.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-purple-800 mb-1">Revenue Leader</h4>
                      <p className="text-sm text-gray-700">
                        Highest business impact: {formatCurrency(Math.max(...agentKPIs.map(a => a.businessImpact)) * 1000)} 
                        revenue generation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <Target className="h-5 w-5" />
                    Optimization Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agentKPIs
                      .filter(agent => agent.efficiency < 80 || agent.errorRate > 15)
                      .slice(0, 3)
                      .map((agent, index) => (
                        <div key={index} className="border-l-4 border-orange-500 pl-4">
                          <h4 className="font-semibold text-orange-800 mb-1">{agent.agentType.split(' ')[0]} Agent</h4>
                          <p className="text-sm text-gray-700">
                            {agent.efficiency < 80 && `Efficiency at ${agent.efficiency.toFixed(1)}% needs improvement. `}
                            {agent.errorRate > 15 && `Error rate of ${agent.errorRate.toFixed(1)}% requires attention.`}
                          </p>
                        </div>
                      ))
                    }
                    {agentKPIs.filter(agent => agent.efficiency < 80 || agent.errorRate > 15).length === 0 && (
                      <div className="text-center text-green-600 py-4">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-semibold">All agents performing optimally!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Predictive Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Predictive Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <ArrowUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-800">
                      {agentKPIs.filter(a => a.trend === 'up').length}
                    </div>
                    <div className="text-sm text-green-600">Agents Improving</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Activity className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">
                      {agentKPIs.filter(a => a.trend === 'stable').length}
                    </div>
                    <div className="text-sm text-gray-600">Stable Performance</div>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <ArrowDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-800">
                      {agentKPIs.filter(a => a.trend === 'down').length}
                    </div>
                    <div className="text-sm text-red-600">Need Attention</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}