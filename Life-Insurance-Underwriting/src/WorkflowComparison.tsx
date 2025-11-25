import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnderwritingAgentWorkflow } from './components/UnderwritingAgentWorkflow';
import { UnderwritingAgentRealtimeWorkflow } from './components/UnderwritingAgentRealtimeWorkflow';
import { UnderwritingReport } from './types/underwriting';
import { 
  GitCompare, 
  Clock, 
  Bot, 
  Zap,
  Play
} from 'lucide-react';

// Import the sample data
import underwritingData from './comprehensive_underwriting_report_LI2025090001_20251002_003016.json';

type WorkflowType = 'static' | 'realtime' | 'comparison';

const WorkflowComparison: React.FC = () => {
  const [currentView, setCurrentView] = useState<WorkflowType>('comparison');
  const data = underwritingData as UnderwritingReport;

  const handleBack = () => {
    setCurrentView('comparison');
  };

  const handleReviewApprove = () => {
    console.log('Review & Approve clicked');
  };

  if (currentView === 'static') {
    return (
      <UnderwritingAgentWorkflow
        applicationId="LI2025090001"
        data={data}
        onBack={handleBack}
        onViewDetails={handleReviewApprove}
      />
    );
  }

  if (currentView === 'realtime') {
    return (
      <UnderwritingAgentRealtimeWorkflow
        applicationId="LI2025090001"
        data={data}
        onBack={handleBack}
        onReviewApprove={handleReviewApprove}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <GitCompare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Agent Workflow Comparison
                </h1>
                <p className="text-gray-600 mt-1">
                  Compare traditional static analysis vs. real-time processing for Life Insurance Underwriting
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                Application: LI2025090001
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                Applicant: {data.application_metadata.applicant_name}
              </Badge>
            </div>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traditional Workflow Card */}
          <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-blue-800">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Traditional Kanban Workflow</h2>
                  <p className="text-sm text-blue-600 font-normal">Static analysis with pipeline visualization</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">5</div>
                    <div className="text-xs text-blue-600">Agent Phases</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">Static</div>
                    <div className="text-xs text-blue-600">Data Flow</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-800 text-sm">Key Features:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Kanban-style workflow visualization
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      All agents completed at once
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Static analysis results display
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Communication flow indicators
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setCurrentView('static')}
                  className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  View Traditional Workflow
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Workflow Card */}
          <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-purple-800">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Real-time Processing Workflow</h2>
                  <p className="text-sm text-purple-600 font-normal">Simulated live analysis with timing</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">~3-5s</div>
                    <div className="text-xs text-purple-600">Per Agent</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">Live</div>
                    <div className="text-xs text-purple-600">Processing</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-800 text-sm">Key Features:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Sequential agent processing simulation
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                      Real-time progress visualization
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Processing time indicators
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Live statistics updates
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setCurrentView('realtime')}
                  className="w-full mt-4 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Experience Real-time Workflow
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Feature Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-left py-3 px-4 text-blue-700">Traditional Workflow</th>
                    <th className="text-left py-3 px-4 text-purple-700">Real-time Workflow</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Processing Display</td>
                    <td className="py-3 px-4">Static results shown at once</td>
                    <td className="py-3 px-4">Sequential agent processing simulation</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">User Experience</td>
                    <td className="py-3 px-4">Immediate complete view</td>
                    <td className="py-3 px-4">Progressive disclosure with timing</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Visual Layout</td>
                    <td className="py-3 px-4">Kanban-style workflow columns</td>
                    <td className="py-3 px-4">Timeline-based progression</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Progress Tracking</td>
                    <td className="py-3 px-4">Status badges and completion indicators</td>
                    <td className="py-3 px-4">Live progress bar and step counter</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Data Presentation</td>
                    <td className="py-3 px-4">Comprehensive data analysis view</td>
                    <td className="py-3 px-4">Progressive analysis with real-time stats</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Best Use Case</td>
                    <td className="py-3 px-4">Post-analysis review and audit</td>
                    <td className="py-3 px-4">Live processing demonstration</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Summary */}
        <Card className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100">
          <CardHeader>
            <CardTitle className="text-gray-800">Implementation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Real-time Processing Features</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Timed sequential agent processing with realistic delays</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Live progress visualization with step-by-step completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Bot className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Dynamic statistics updates during processing</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Technical Implementation</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>React useEffect hooks for timing simulation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Progressive UI state management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Dynamic content parsing and summarization</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowComparison;