import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X,
  FileText,
  Shield,
  CreditCard,
  Activity,
  CheckCircle
} from 'lucide-react';
import { RupeeIcon } from '@/components/ui/rupee-icon';
import { AgentMessage, parseMarkdownContent } from '@/utils/agentParser';

interface AgentModalProps {
  agent: AgentMessage;
  isOpen: boolean;
  onClose: () => void;
  stepNumber: number;
}

const agentIcons: { [key: string]: React.ReactNode } = {
  'Fraud_Detection_Specialist': <Shield className="h-6 w-6 text-red-600" />,
  'Diagnostic_Validator': <FileText className="h-6 w-6 text-blue-600" />,
  'Medical_Validator': <FileText className="h-6 w-6 text-blue-600" />,
  'Billing_Fraud_Validator': <CreditCard className="h-6 w-6 text-green-600" />,
  'Billing_Validator': <CreditCard className="h-6 w-6 text-green-600" />,
  'Policy_Balance_Validator': <RupeeIcon className="h-6 w-6 text-purple-600" />,
  'Policy_Adjustment_Coordinator': <Activity className="h-6 w-6 text-orange-600" />,
  'Decision_Coordinator': <CheckCircle className="h-6 w-6 text-teal-600" />
};

const agentDescriptions: { [key: string]: string } = {
  'Fraud_Detection_Specialist': 'Performs initial fraud risk assessment and identity verification across all claim documents.',
  'Diagnostic_Validator': 'Reviews diagnostic evidence consistency, validates diagnosis appropriateness, and checks treatment protocols.',
  'Medical_Validator': 'Reviews medical evidence consistency, validates diagnosis appropriateness, and checks treatment protocols.',
  'Billing_Fraud_Validator': 'Analyzes billing accuracy, checks for duplicate charges, and validates hospital invoice authenticity.',
  'Billing_Validator': 'Analyzes billing accuracy, checks for duplicate charges, and validates hospital invoice authenticity.',
  'Policy_Balance_Validator': 'Verifies policy coverage limits, calculates available balance, and ensures claim compliance.',
  'Policy_Adjustment_Coordinator': 'Applies policy exclusions, calculates final approved amounts, and manages adjustments.',
  'Decision_Coordinator': 'Consolidates all agent findings and provides final claim approval or rejection decision.'
};

export const AgentModal: React.FC<AgentModalProps> = ({ agent, isOpen, onClose, stepNumber }) => {
  if (!isOpen) return null;

  const formatAgentName = (name: string) => name.replace(/_/g, ' ');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm">
                {agentIcons[agent.name]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {formatAgentName(agent.name)}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Badge variant="outline">Step {stepNumber}</Badge>
                  <span>•</span>
                  <span>AI Analysis Agent</span>
                </div>
              </div>
            </CardTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Agent Description */}
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-2">Agent Role & Responsibilities</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {agentDescriptions[agent.name]}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {/* Full Analysis Content */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Complete Analysis Report
              </h3>
              <div className="bg-white rounded-lg p-4 border max-h-96 overflow-y-auto">
                <div 
                  className="agent-content space-y-2 text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parseMarkdownContent(agent.content) }}
                />
              </div>
            </div>

            {/* Key Findings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-800">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-blue-700">
                    {agent.content.includes('LOW') && (
                      <Badge className="bg-green-100 text-green-800">Low Risk</Badge>
                    )}
                    {agent.content.includes('MEDIUM') && (
                      <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>
                    )}
                    {agent.content.includes('HIGH') && (
                      <Badge className="bg-red-100 text-red-800">High Risk</Badge>
                    )}
                    {agent.content.includes('APPROVED') && (
                      <Badge className="bg-green-100 text-green-800 ml-2">Approved</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-800">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>Analysis Complete</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>

        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Analysis completed by {formatAgentName(agent.name)}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};