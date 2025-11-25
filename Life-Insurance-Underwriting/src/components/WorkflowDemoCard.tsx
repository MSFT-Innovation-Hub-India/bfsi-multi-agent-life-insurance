import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle,
  Users,
  MessageSquare,
  Clock,
  Shield
} from 'lucide-react';

interface WorkflowDemoCardProps {
  onClaimClick: (claimId: string) => void;
}

export const WorkflowDemoCard: React.FC<WorkflowDemoCardProps> = ({ onClaimClick }) => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <PlayCircle className="h-6 w-6" />
          Interactive Agent Workflow Demo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-blue-800 leading-relaxed">
              Click on any claim card below to see our AI agents in action! 
              Experience a live demonstration of our multi-agent fraud detection system.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white/50">
                <Users className="h-3 w-3 mr-1" />
                6 AI Agents
              </Badge>
              <Badge variant="outline" className="bg-white/50">
                <MessageSquare className="h-3 w-3 mr-1" />
                Real-time Analysis
              </Badge>
              <Badge variant="outline" className="bg-white/50">
                <Clock className="h-3 w-3 mr-1" />
                Step-by-step Workflow
              </Badge>
              <Badge variant="outline" className="bg-white/50">
                <Shield className="h-3 w-3 mr-1" />
                Fraud Detection
              </Badge>
            </div>

            <button
              onClick={() => onClaimClick('CLM001-2024-LAKSHMI')}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <PlayCircle className="h-5 w-5" />
              Start Workflow
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-blue-900 mb-3">What you'll see:</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Fraud Detection Specialist analyzes claim</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Diagnostic Validator reviews diagnostic evidence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Billing Validator checks financial accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Policy Validator verifies coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Policy Coordinator applies adjustments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Decision Coordinator provides final verdict</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};