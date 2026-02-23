import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UnderwritingReport } from '@/types/underwriting';
import { RupeeIcon } from '@/components/ui/rupee-icon';
import { 
  Shield, 
  Users, 
  FileText, 
  RefreshCw,
  Download,
  Calendar,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { UnderwritingApplications } from './components/UnderwritingApplications';
import { UnderwritingAgentWorkflow } from './components/UnderwritingAgentWorkflow';
import { UnderwritingAgentRealtimeWorkflow } from './components/UnderwritingAgentRealtimeWorkflow';
import { UnderwritingAgentNetworkLightWorkflow } from './components/UnderwritingAgentNetworkLightWorkflow';
import { CombinedAgentDashboard } from './components/CombinedAgentDashboard';
import { UnderwritingAnalysisPage } from './components/UnderwritingAnalysisPage.tsx';
import { createReadableAnalysisSummary } from './utils/markdownSimplifier';

// Static dashboard summary data (kept for list view stats)
import underwritingListData from './underwriting-dashboard-data.json';

// Fallback static data imports (used only if Cosmos DB API is unreachable)
import underwritingDataMenna from './comprehensive_underwriting_report_LI2025090001_20251002_003016.json';
import underwritingDataRahul from './comprehensive_underwriting_report_LI2025090001_20251002_003017.json';
import underwritingDataAnanya from './comprehensive_underwriting_report_LI2025090001_20251002_003018.json';

const API_BASE = '/api/v1/underwriting';

interface UnderwritingDashboardProps {
  onApplicationClick?: (applicationId: string) => void;
}

function UnderwritingDashboard({ }: UnderwritingDashboardProps) {
  const { applicationId: routeAppId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<UnderwritingReport>(underwritingDataMenna as UnderwritingReport);
  const [dashboardData, setDashboardData] = useState<any>(underwritingListData);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Determine currentView from the URL
  const currentPath = window.location.pathname;
  const getCurrentView = (): 'applications' | 'details' | 'workflow' | 'realtime-workflow' | 'network-workflow' | 'analysis' => {
    if (routeAppId && currentPath.includes('/analysis')) return 'analysis';
    if (routeAppId && currentPath.includes('/workflow')) return 'network-workflow';
    if (routeAppId) return 'network-workflow';
    return 'applications';
  };
  const [currentView, setCurrentView] = useState<'applications' | 'details' | 'workflow' | 'realtime-workflow' | 'network-workflow' | 'analysis'>(getCurrentView());
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>(routeAppId || '');
  const [isAgentAnalyticsExpanded, setIsAgentAnalyticsExpanded] = useState(false);

  // Scroll to top whenever view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  // Dashboard list always uses static data (underwriting-dashboard-data.json)
  // Individual application reports are fetched from Cosmos DB when clicked

  // When route has an applicationId, load that report
  useEffect(() => {
    if (routeAppId) {
      setSelectedApplicationId(routeAppId);
      loadApplicationData(routeAppId);
      if (currentPath.includes('/analysis')) {
        setCurrentView('analysis');
      } else {
        setCurrentView('network-workflow');
      }
    }
  }, [routeAppId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /** Load report data for a specific application — tries Cosmos DB API first, falls back to static */
  const loadApplicationData = async (applicationId: string) => {
    setIsLoading(true);

    // Always try Cosmos DB API first
    try {
      const res = await fetch(`${API_BASE}/reports/${applicationId}`);
      if (res.ok) {
        const reportData = await res.json();
        setData(reportData as UnderwritingReport);
        console.log(`✅ Loaded report for ${applicationId} from Cosmos DB`);
        setIsLoading(false);
        return;
      }
      console.warn(`⚠️ API returned ${res.status} for ${applicationId} — falling back to static data`);
    } catch (err) {
      console.warn(`⚠️ API unreachable for ${applicationId} — falling back to static data`, err);
    }

    // Fallback to static JSON only if API failed
    const staticMap: Record<string, any> = {
      'LI2025090001': underwritingDataMenna,
      'LI2025090004': underwritingDataRahul,
      'LI2025090003': underwritingDataAnanya,
    };
    if (staticMap[applicationId]) {
      setData(staticMap[applicationId] as UnderwritingReport);
    } else {
      // Try matching from dashboard data
      const appData = dashboardData.applications?.find(
        (app: any) => app.application_metadata?.application_id === applicationId
      );
      if (appData) {
        setData(appData as UnderwritingReport);
      }
    }
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Re-fetch current application from Cosmos DB if one is selected
    if (selectedApplicationId) {
      await loadApplicationData(selectedApplicationId);
    }
    setIsLoading(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `underwriting-report-${data.application_metadata.application_id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW RISK': return 'success';
      case 'MEDIUM RISK': return 'warning';
      case 'HIGH RISK': return 'danger';
      default: return 'default';
    }
  };

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

  const formatProcessingTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const handleApplicationClick = async (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    await loadApplicationData(applicationId);
    navigate(`/application/${applicationId}`);
    setCurrentView('network-workflow');
  };

  const handleBackToApplications = () => {
    navigate('/');
    setCurrentView('applications');
    setSelectedApplicationId('');
  };

  const handleViewDetails = () => {
    setCurrentView('details');
  };

  const handleViewAnalysis = () => {
    navigate(`/application/${selectedApplicationId}/analysis`);
    setCurrentView('analysis');
  };

  const handleAcceptApplication = async (applicationId: string, comments?: string) => {
    console.log('Accepting application:', applicationId, 'Comments:', comments);
    alert(`Application ${applicationId} has been accepted!${comments ? `\nComments: ${comments}` : ''}`);
    navigate('/');
    setCurrentView('applications');
  };

  const handleRejectApplication = async (applicationId: string, reason: string, comments?: string) => {
    console.log('Rejecting application:', applicationId, 'Reason:', reason, 'Comments:', comments);
    alert(`Application ${applicationId} has been rejected.\nReason: ${reason}${comments ? `\nComments: ${comments}` : ''}`);
    navigate('/');
    setCurrentView('applications');
  };





  // Show network light workflow view (default)
  if (currentView === 'network-workflow') {
    return (
      <UnderwritingAgentNetworkLightWorkflow
        applicationId={selectedApplicationId}
        data={data}
        onBack={handleBackToApplications}
        onReviewApprove={handleViewDetails}
        onViewAnalysis={handleViewAnalysis}
      />
    );
  }

  // Show real-time agent workflow view
  if (currentView === 'realtime-workflow') {
    return (
      <UnderwritingAgentRealtimeWorkflow
        applicationId={selectedApplicationId}
        data={data}
        onBack={handleBackToApplications}
        onReviewApprove={handleViewDetails}
        onViewAnalysis={handleViewAnalysis}
      />
    );
  }

  // Show traditional agent workflow view
  if (currentView === 'workflow') {
    return (
      <UnderwritingAgentWorkflow
        applicationId={selectedApplicationId}
        data={data}
        onBack={handleBackToApplications}
        onViewDetails={handleViewDetails}
      />
    );
  }

  // Show comprehensive analysis page
  if (currentView === 'analysis') {
    return (
      <UnderwritingAnalysisPage
        applicationId={selectedApplicationId}
        data={data}
        onBack={() => setCurrentView('network-workflow')}
        onAccept={handleAcceptApplication}
        onReject={handleRejectApplication}
      />
    );
  }

  // Show applications list view
  if (currentView === 'applications') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      Global Trust Life
                    </h1>
                    <p className="text-sm text-gray-500">
                      AI-Powered Term Life Insurance Applications Dashboard
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{currentTime.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{currentTime.toLocaleTimeString()}</span>
                  </div>
                </div>
                

                
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-100/50 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Agent Performance Analytics Dropdown Section */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Dropdown Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsAgentAnalyticsExpanded(!isAgentAnalyticsExpanded)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Agent Performance Analytics</h2>
                    <p className="text-sm text-gray-500">Click to expand comprehensive agent insights</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isAgentAnalyticsExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </div>

              {/* Dropdown Content */}
              {isAgentAnalyticsExpanded && (
                <div className="border-t bg-gray-50">
                  <div className="p-6">
                    {(() => {
                      // Filter applications to only include those with complete agent analytics data
                      const completeApplications = dashboardData.applications.filter((app: any) => 
                        app.detailed_agent_responses && 
                        app.underwriting_decision && 
                        app.medical_loading_analysis && 
                        app.premium_analysis &&
                        app.application_metadata.processing_time_seconds &&
                        Object.keys(app.detailed_agent_responses).length > 0
                      );

                      console.log('Total applications:', dashboardData.applications.length);
                      console.log('Complete applications for analytics:', completeApplications.length);
                      
                      if (completeApplications.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <div className="text-gray-500">
                              <h3 className="text-lg font-semibold mb-2">Processing Applications</h3>
                              <p className="text-sm">Agent analytics data is being processed. Please check back shortly.</p>
                              <div className="mt-4 text-xs text-gray-400">
                                Found {dashboardData.applications.length} applications, 
                                but only {completeApplications.length} have complete agent data.
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <CombinedAgentDashboard
                          applications={completeApplications}
                        />
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.totalApplications}</p>
                    <p className="text-xs text-blue-600">Processing queue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Accepted</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.totalAccepted}</p>
                    <p className="text-xs text-green-600">
                      {((dashboardData.summary.totalAccepted / dashboardData.summary.totalApplications) * 100).toFixed(1)}% acceptance rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Additional Requirements</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.totalAdditionalRequirements}</p>
                    <p className="text-xs text-orange-600">Pending review</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <RupeeIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Premium Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.summary.totalPremiumValue)}</p>
                    <p className="text-xs text-purple-600">Annual premiums</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Underwriting Applications Section */}
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Underwriting Applications</h2>
                    <p className="text-xs text-gray-500 mt-1">Complete list of life insurance applications with processing status and key metrics</p>
                  </div>
                </div>
              </div>
            </div>
            <UnderwritingApplications 
              applications={dashboardData.applications} 
              onApplicationClick={handleApplicationClick}
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-gray-100/30 mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                © 2024 Life Insurance Underwriting. Powered by Azure AI and AutoGen Framework.
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Active Applications: {dashboardData.summary.totalApplications}</span>
                <span>•</span>
                <span>Avg Processing: {dashboardData.summary.averageProcessingTime.toFixed(1)}s</span>
                <span>•</span>
                <span>Framework: AutoGen Multi-Agent</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Show detailed view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToApplications}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-100/50 transition-colors"
              >
                ← Back to Applications
              </button>
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Global Trust Life
                  </h1>
                  <p className="text-sm text-gray-500">
                    AI-Powered Term Life Insurance Underwriting Dashboard
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{currentTime.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{currentTime.toLocaleTimeString()}</span>
                </div>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-100/50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Application Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Application Overview - {data.application_metadata.application_id}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Applicant:</span>
                  <span className="text-sm">{data.application_metadata.applicant_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Processing Time:</span>
                  <span className="text-sm">{formatProcessingTime(data.application_metadata.processing_time_seconds)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Final Decision:</span>
                  <Badge variant={getDecisionBadgeVariant(data.underwriting_decision.final_decision)}>
                    {data.underwriting_decision.final_decision.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Risk Category:</span>
                  <Badge variant={getRiskBadgeVariant(data.medical_loading_analysis.risk_category)}>
                    {data.medical_loading_analysis.risk_category}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Total Premium:</span>
                  <span className="text-sm font-bold text-blue-700">
                    {formatCurrency(data.premium_analysis.total_final_premium)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Loading:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {data.medical_loading_analysis.total_loading_percentage}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Fraud Risk:</span>
                  <Badge variant={getRiskBadgeVariant(data.fraud_assessment.overall_fraud_risk + ' RISK')}>
                    {data.fraud_assessment.overall_fraud_risk}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Processing Days:</span>
                  <span className="text-sm">{data.business_impact.estimated_processing_time_days} days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Medical Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{data.medical_extraction.total_reports_processed}</p>
                  <p className="text-xs text-green-600">
                    {(data.medical_extraction.extraction_success_rate * 100).toFixed(1)}% success rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{data.medical_extraction.medical_findings_summary.critical_alerts}</p>
                  <p className="text-xs text-red-600">
                    {data.medical_extraction.medical_findings_summary.abnormal_findings} abnormal findings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <RupeeIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Premium Loading</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.premium_analysis.total_loading_amount)}</p>
                    <p className="text-xs text-orange-600">
                      +{data.medical_loading_analysis.total_loading_percentage}% loading
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Risk Score</p>
                  <p className="text-2xl font-bold text-gray-900">{(data.risk_assessment.risk_score * 100).toFixed(1)}%</p>
                  <p className="text-xs text-purple-600">
                    {data.risk_assessment.overall_risk_level} risk
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="medical" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="medical" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Medical Analysis
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex items-center gap-2">
              <RupeeIcon className="h-4 w-4" />
              Premium Details
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Assessment
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Agent Analysis
            </TabsTrigger>
            <TabsTrigger value="system-analytics" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              System Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medical" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medical Loading Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Medical Loading Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.medical_loading_analysis.loading_breakdown.map((loading, index) => (
                      <div key={index} className="border-l-4 border-l-orange-500 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{loading.condition}</h4>
                          <Badge variant="outline">+{loading.loading_percentage}%</Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{loading.reasoning}</p>
                        <div className="flex gap-2">
                          <Badge variant={loading.severity === 'severe' ? 'danger' : loading.severity === 'moderate' ? 'warning' : 'default'}>
                            {loading.severity}
                          </Badge>
                          <Badge variant="outline">{loading.loading_type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Medical Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Medical Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.medical_loading_analysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                  
                  {data.medical_loading_analysis.exclusions.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-sm mb-3 text-red-600">Exclusions Applied</h4>
                      <div className="space-y-2">
                        {data.medical_loading_analysis.exclusions.map((exclusion, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{exclusion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="premium" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Premium Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Premium Breakdown by Cover</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.premium_analysis.cover_details.map((cover, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{cover.cover_type}</h4>
                          <Badge variant="outline">+{cover.loading_percentage}%</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Base Premium:</span>
                            <p className="font-medium">{formatCurrency(cover.base_premium)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Final Premium:</span>
                            <p className="font-medium text-blue-700">{formatCurrency(cover.final_premium)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Premium Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Premium Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Base Premium</span>
                      <span className="font-bold">{formatCurrency(data.premium_analysis.total_base_premium)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium">Loading Amount</span>
                      <span className="font-bold text-orange-600">+{formatCurrency(data.premium_analysis.total_loading_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Final Premium</span>
                      <span className="font-bold text-blue-700">{formatCurrency(data.premium_analysis.total_final_premium)}</span>
                    </div>
                    <div className="text-center text-sm text-gray-600 mt-4">
                      Total Loading: {data.premium_analysis.average_loading_percentage}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Components */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Component Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Medical Risk</span>
                        <span className="text-sm">{(data.risk_assessment.component_risks.medical_risk * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={data.risk_assessment.component_risks.medical_risk * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Lifestyle Risk</span>
                        <span className="text-sm">{(data.risk_assessment.component_risks.lifestyle_risk * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={data.risk_assessment.component_risks.lifestyle_risk * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Financial Risk</span>
                        <span className="text-sm">{(data.risk_assessment.component_risks.financial_risk * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={data.risk_assessment.component_risks.financial_risk * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Occupational Risk</span>
                        <span className="text-sm">{(data.risk_assessment.component_risks.occupation_risk * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={data.risk_assessment.component_risks.occupation_risk * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Red Flags & Fraud Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Alerts & Fraud Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-red-600">Red Flags</h4>
                      <div className="space-y-2">
                        {data.risk_assessment.red_flags.map((flag, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{flag}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-2">Fraud Risk Assessment</h4>
                      <div className="flex items-center gap-4 mb-2">
                        <Badge variant={getRiskBadgeVariant(data.fraud_assessment.overall_fraud_risk + ' RISK')}>
                          {data.fraud_assessment.overall_fraud_risk} RISK
                        </Badge>
                        <span className="text-sm">Score: {(data.fraud_assessment.fraud_score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {data.fraud_assessment.indicators_count} indicators found
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(data.detailed_agent_responses).map(([agentKey, agent]) => (
                <Card key={agentKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4" />
                      {agent.agent_type}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-xs text-gray-500">
                        {new Date(agent.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm max-h-40 overflow-y-auto">
                        <div className="text-xs leading-relaxed text-gray-700">
                          {createReadableAnalysisSummary(agent.analysis, agent.agent_type)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="system-analytics" className="space-y-6">

            
            {/* Compact System Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{Object.keys(data.detailed_agent_responses).length}</div>
                <div className="text-sm text-gray-500">Active Agents</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{formatProcessingTime(data.application_metadata.processing_time_seconds)}</div>
                <div className="text-sm text-gray-500">Processing Time</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{(data.quality_metrics.analysis_confidence * 100).toFixed(0)}%</div>
                <div className="text-sm text-gray-500">Confidence</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{(data.quality_metrics.system_performance_score * 100).toFixed(0)}%</div>
                <div className="text-sm text-gray-500">Performance</div>
              </Card>
            </div>

            {/* Agent List with Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Agent Contributions - {data.application_metadata.application_id}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.values(data.detailed_agent_responses).map((agent, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {agent.agent_type.split(' ')[0]} Agent
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(agent.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700">
                        {createReadableAnalysisSummary(agent.analysis, agent.agent_type).substring(0, 120)}...
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-1">Final Decision</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getDecisionBadgeVariant(data.underwriting_decision.final_decision)}>
                      {data.underwriting_decision.final_decision.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm text-blue-700">
                      with {(data.underwriting_decision.confidence_score * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-100/30 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              © 2024 Global Trust Life. Powered by Azure AI and AutoGen Framework.
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Application: {data.application_metadata.application_id}</span>
              <span>•</span>
              <span>System: {data.application_metadata.system_version}</span>
              <span>•</span>
              <span>Framework: AutoGen Multi-Agent</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default UnderwritingDashboard;