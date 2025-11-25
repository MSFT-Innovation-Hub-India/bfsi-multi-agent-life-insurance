import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnderwritingReport, PendingApplication } from '@/types/underwriting';
import { 
  User, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye
} from 'lucide-react';
import { RupeeIcon } from '@/components/ui/rupee-icon';
import { DocumentViewer } from '@/components/DocumentViewer';

interface UnderwritingApplicationsProps {
  applications: (UnderwritingReport | PendingApplication)[];
  onApplicationClick: (applicationId: string) => void;
}

export const UnderwritingApplications: React.FC<UnderwritingApplicationsProps> = ({ 
  applications, 
  onApplicationClick 
}) => {
  const [selectedApplicationForDocs, setSelectedApplicationForDocs] = useState<string | null>(null);

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
      case 'manual_review': return 'warning';
      case 'declined': return 'danger';
      default: return 'default';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'additional_requirements': return <Clock className="h-4 w-4" />;
      case 'manual_review': return <User className="h-4 w-4" />;
      case 'declined': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatProcessingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const isPendingApplication = (app: UnderwritingReport | PendingApplication): app is PendingApplication => {
    return (app as PendingApplication).application_metadata.status === 'pending' || !(app as UnderwritingReport).underwriting_decision;
  };

  const isProcessedApplication = (app: UnderwritingReport | PendingApplication): app is UnderwritingReport => {
    return !isPendingApplication(app);
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {applications.map((application) => {
            const isPending = isPendingApplication(application);
            
            return (
              <div
                key={application.application_metadata.application_id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onApplicationClick(application.application_metadata.application_id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {application.application_metadata.applicant_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {application.application_metadata.application_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApplicationForDocs(application.application_metadata.application_id);
                      }}
                      className="p-2 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
                      title="View Documents"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {!isPending && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplicationClick(application.application_metadata.application_id);
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        View Workflow
                      </button>
                    )}
                    {isPending ? (
                      <>
                        <Clock className="h-4 w-4" />
                        <Badge variant="secondary">
                          PENDING
                        </Badge>
                      </>
                    ) : (
                      <>
                        {getDecisionIcon((application as UnderwritingReport).underwriting_decision.final_decision)}
                        <Badge variant={getDecisionBadgeVariant((application as UnderwritingReport).underwriting_decision.final_decision)}>
                          {(application as UnderwritingReport).underwriting_decision.final_decision.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {isPending ? (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span>Submitted: {formatDate((application as PendingApplication).application_metadata.submission_date)}</span>
                      <span>•</span>
                      <span className="text-orange-600">Awaiting Processing</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Processing will begin shortly
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <RupeeIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-xs text-gray-500">Final Premium</span>
                          <p className="text-sm font-medium text-blue-700">
                            {formatCurrency((application as UnderwritingReport).premium_analysis.total_final_premium)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-xs text-gray-500">Risk Level</span>
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant={getRiskBadgeVariant((application as UnderwritingReport).medical_loading_analysis.risk_category)}
                              className="text-xs"
                            >
                              {(application as UnderwritingReport).medical_loading_analysis.risk_category}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-xs text-gray-500">Processing Time</span>
                          <p className="text-sm font-medium">
                            {formatProcessingTime((application as UnderwritingReport).application_metadata.processing_time_seconds!)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-orange-100 rounded flex items-center justify-center">
                          <span className="text-xs font-bold text-orange-600">%</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Loading</span>
                          <p className="text-sm font-medium text-orange-600">
                            +{(application as UnderwritingReport).medical_loading_analysis.total_loading_percentage}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>Processed: {formatDate((application as UnderwritingReport).application_metadata.processing_date!)}</span>
                        <span>•</span>
                        <span>Critical Alerts: {(application as UnderwritingReport).medical_extraction.medical_findings_summary.critical_alerts}</span>
                        <span>•</span>
                        <span>Fraud Risk: {(application as UnderwritingReport).fraud_assessment.overall_fraud_risk}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Processing Days: {(application as UnderwritingReport).business_impact.estimated_processing_time_days}</span>
                      </div>
                    </div>

                    {(application as UnderwritingReport).medical_loading_analysis.loading_breakdown && (application as UnderwritingReport).medical_loading_analysis.loading_breakdown.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex flex-wrap gap-1">
                          {(application as UnderwritingReport).medical_loading_analysis.loading_breakdown.slice(0, 3).map((loading: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {loading.condition} (+{loading.loading_percentage}%)
                            </Badge>
                          ))}
                          {(application as UnderwritingReport).medical_loading_analysis.loading_breakdown.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(application as UnderwritingReport).medical_loading_analysis.loading_breakdown.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedApplicationForDocs && (
        <DocumentViewer
          applicationId={selectedApplicationForDocs}
          onClose={() => setSelectedApplicationForDocs(null)}
        />
      )}
    </>
  );
};