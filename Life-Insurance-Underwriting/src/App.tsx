// Life Insurance Underwriting - App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import UnderwritingDashboard from './UnderwritingDashboard';
import AllWorkflowStyles from './AllWorkflowStyles';

function App() {
  return (
    <Routes>
      <Route path="/" element={<UnderwritingDashboard />} />
      <Route path="/applications" element={<UnderwritingDashboard />} />
      <Route path="/application/:applicationId" element={<UnderwritingDashboard />} />
      <Route path="/application/:applicationId/workflow" element={<UnderwritingDashboard />} />
      <Route path="/application/:applicationId/analysis" element={<UnderwritingDashboard />} />
      <Route path="/workflows" element={<AllWorkflowStyles />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
