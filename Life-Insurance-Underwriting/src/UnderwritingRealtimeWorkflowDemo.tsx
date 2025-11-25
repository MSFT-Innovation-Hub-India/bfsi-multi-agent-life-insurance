import React from 'react';
import { UnderwritingAgentRealtimeWorkflow } from './components/UnderwritingAgentRealtimeWorkflow';
import { UnderwritingReport } from './types/underwriting';

// Import the sample data
import underwritingData from './comprehensive_underwriting_report_LI2025090001_20251002_003016.json';

const UnderwritingRealtimeWorkflowDemo: React.FC = () => {
  const data = underwritingData as UnderwritingReport;

  const handleBack = () => {
    console.log('Back button clicked');
    // In a real app, this would navigate back to the applications list
  };

  const handleReviewApprove = () => {
    console.log('Review & Approve clicked');
    // In a real app, this would show the detailed approval screen
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UnderwritingAgentRealtimeWorkflow
        applicationId="LI2025090001"
        data={data}
        onBack={handleBack}
        onReviewApprove={handleReviewApprove}
      />
    </div>
  );
};

export default UnderwritingRealtimeWorkflowDemo;