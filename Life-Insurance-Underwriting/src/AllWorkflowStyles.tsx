import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnderwritingAgentWorkflow } from './components/UnderwritingAgentWorkflow';
import { UnderwritingAgentRealtimeWorkflow } from './components/UnderwritingAgentRealtimeWorkflow';
import { UnderwritingAgentNetworkWorkflow } from './components/UnderwritingAgentNetworkWorkflow';
import { UnderwritingAgentNetworkLightWorkflow } from './components/UnderwritingAgentNetworkLightWorkflow';
import { UnderwritingAgentCircularWorkflow } from './components/UnderwritingAgentCircularWorkflow';
import { UnderwritingReport } from './types/underwriting';
import { 
  GitCompare, 
  Clock, 
  Bot, 
  Zap,
  Play,
  Network,
  RotateCw,
  Activity,
  Workflow
} from 'lucide-react';

// Import the sample data
import underwritingData from './comprehensive_underwriting_report_LI2025090001_20251002_003016.json';

type WorkflowType = 'selector' | 'static' | 'realtime' | 'network' | 'network-light' | 'circular';

const AllWorkflowStyles: React.FC = () => {
  const [currentView, setCurrentView] = useState<WorkflowType>('selector');
  const data = underwritingData as UnderwritingReport;

  // Scroll to top whenever view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleBack = () => {
    setCurrentView('selector');
  };

  const handleReviewApprove = () => {
    console.log('Review & Approve clicked');
  };

  // Individual workflow components
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

  if (currentView === 'network') {
    return (
      <UnderwritingAgentNetworkWorkflow
        applicationId="LI2025090001"
        data={data}
        onBack={handleBack}
        onReviewApprove={handleReviewApprove}
      />
    );
  }

  if (currentView === 'network-light') {
    return (
      <UnderwritingAgentNetworkLightWorkflow
        applicationId="LI2025090001"
        data={data}
        onBack={handleBack}
        onReviewApprove={handleReviewApprove}
      />
    );
  }

  if (currentView === 'circular') {
    return (
      <UnderwritingAgentCircularWorkflow
        applicationId="LI2025090001"
        data={data}
        onBack={handleBack}
        onReviewApprove={handleReviewApprove}
      />
    );
  }

  // Selector view
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
                  Agent Workflow Styles Showcase
                </h1>
                <p className="text-gray-600 mt-1">
                  Experience different real-time processing patterns for Life Insurance Underwriting
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

        {/* Workflow Style Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Traditional Kanban Workflow */}
          <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-blue-800">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Traditional Kanban</h2>
                  <p className="text-sm text-blue-600 font-normal">Static analysis with pipeline visualization</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">3</div>
                    <div className="text-xs text-blue-600">Phase View</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">Static</div>
                    <div className="text-xs text-blue-600">Data Flow</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-800 text-sm">Features:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Kanban-style columns
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Communication flow indicators
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      All results at once
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setCurrentView('static')}
                  className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  View Traditional Flow
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Real-time Workflow */}
          <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-purple-800">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Timeline Processing</h2>
                  <p className="text-sm text-purple-600 font-normal">Sequential timeline with live updates</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">2-6s</div>
                    <div className="text-xs text-purple-600">Per Agent</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">Live</div>
                    <div className="text-xs text-purple-600">Updates</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-800 text-sm">Features:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                      Sequential agent processing
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Real-time progress tracking
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
                  Experience Timeline Flow
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Network Topology Workflow - Dark */}
          <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                  <Network className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Network (Dark)</h2>
                  <p className="text-sm text-slate-600 font-normal">Graph-based with dark theme</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-slate-300">
                    <div className="text-2xl font-bold text-slate-700">Network</div>
                    <div className="text-xs text-slate-600">Visualization</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-slate-300">
                    <div className="text-2xl font-bold text-slate-700">Dark</div>
                    <div className="text-xs text-slate-600">Theme</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 text-sm">Features:</h4>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                      Interactive node network
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                      Data flow visualization
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                      Pause/Resume controls
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setCurrentView('network')}
                  className="w-full mt-4 px-4 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Network className="h-4 w-4" />
                  View Dark Network
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Network Topology Workflow - Light */}
          <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-blue-800">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Network className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Network (Light)</h2>
                  <p className="text-sm text-blue-600 font-normal">Graph-based with light theme</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">Network</div>
                    <div className="text-xs text-blue-600">Visualization</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">Light</div>
                    <div className="text-xs text-blue-600">Theme</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-800 text-sm">Features:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Interactive node network
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Clean light interface
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Business-friendly design
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setCurrentView('network-light')}
                  className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Network className="h-4 w-4" />
                  View Light Network
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Circular/Orbital Workflow */}
          <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-pink-800">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center">
                  <RotateCw className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Circular Flow</h2>
                  <p className="text-sm text-pink-600 font-normal">Rotating orbital agent processing</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-pink-200">
                    <div className="text-2xl font-bold text-pink-700">360°</div>
                    <div className="text-xs text-pink-600">Rotation</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-pink-200">
                    <div className="text-2xl font-bold text-pink-700">Hub</div>
                    <div className="text-xs text-pink-600">Central AI</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-pink-800 text-sm">Features:</h4>
                  <ul className="text-sm text-pink-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-spin"></div>
                      Circular agent arrangement
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                      Rotation animations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                      Central processing hub
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setCurrentView('circular')}
                  className="w-full mt-4 px-4 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCw className="h-4 w-4" />
                  Experience Circular Flow
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Workflow Style Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-left py-3 px-4 text-blue-700">Kanban</th>
                    <th className="text-left py-3 px-4 text-purple-700">Timeline</th>
                    <th className="text-left py-3 px-4 text-slate-700">Network Dark</th>
                    <th className="text-left py-3 px-4 text-blue-700">Network Light</th>
                    <th className="text-left py-3 px-4 text-pink-700">Circular</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Visual Style</td>
                    <td className="py-3 px-4">Column-based layout</td>
                    <td className="py-3 px-4">Vertical timeline progression</td>
                    <td className="py-3 px-4">Network graph topology</td>
                    <td className="py-3 px-4">Network graph topology</td>
                    <td className="py-3 px-4">Circular orbital arrangement</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Animation Style</td>
                    <td className="py-3 px-4">Static display</td>
                    <td className="py-3 px-4">Sequential progression</td>
                    <td className="py-3 px-4">Node connections & particles</td>
                    <td className="py-3 px-4">Node connections & particles</td>
                    <td className="py-3 px-4">Rotation & orbit motion</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Background Theme</td>
                    <td className="py-3 px-4">Light gradient</td>
                    <td className="py-3 px-4">Light gradient</td>
                    <td className="py-3 px-4">Dark slate theme</td>
                    <td className="py-3 px-4">Light blue theme</td>
                    <td className="py-3 px-4">Dark purple/pink theme</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Processing Flow</td>
                    <td className="py-3 px-4">Phase-based columns</td>
                    <td className="py-3 px-4">Step-by-step timeline</td>
                    <td className="py-3 px-4">Connected node network</td>
                    <td className="py-3 px-4">Connected node network</td>
                    <td className="py-3 px-4">Circular hub processing</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">User Controls</td>
                    <td className="py-3 px-4">View switching</td>
                    <td className="py-3 px-4">Progress tracking</td>
                    <td className="py-3 px-4">Play/Pause/Reset</td>
                    <td className="py-3 px-4">Play/Pause/Reset</td>
                    <td className="py-3 px-4">Play/Pause/Reset</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Best For</td>
                    <td className="py-3 px-4">Data analysis review</td>
                    <td className="py-3 px-4">Process demonstration</td>
                    <td className="py-3 px-4">Technical presentations</td>
                    <td className="py-3 px-4">Business presentations</td>
                    <td className="py-3 px-4">Engaging demonstrations</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Summary */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Implementation Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Common Features</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Real-time agent processing simulation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Configurable timing (2-6 seconds per agent)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Bot className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Interactive agent details modal</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Unique Implementations</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <Network className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                    <span>SVG-based connection lines and data particles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <RotateCw className="h-4 w-4 text-pink-600 mt-0.5 flex-shrink-0" />
                    <span>Mathematical circular positioning and rotation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Activity className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Progressive disclosure with timeline flow</span>
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

export default AllWorkflowStyles;