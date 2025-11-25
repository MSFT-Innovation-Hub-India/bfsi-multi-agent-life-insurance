// Life Insurance Underwriting - App.tsx
import { useState } from 'react';
import UnderwritingDashboard from './UnderwritingDashboard';
import AllWorkflowStyles from './AllWorkflowStyles';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'workflows'>('dashboard');

  const switchToDashboard = () => {
    setCurrentView('dashboard');
  };

  const switchToWorkflows = () => {
    setCurrentView('workflows');
  };

  if (currentView === 'workflows') {
    return (
      <div>
        {/* Navigation header */}
        <div className="bg-white border-b px-4 py-2 shadow-sm">
          <div className="container mx-auto">
            <div className="flex gap-4 items-center">
              <button
                onClick={switchToDashboard}
                className="px-4 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={switchToWorkflows}
                className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-md font-medium"
              >
                🎨 Workflow Styles
              </button>
            </div>
          </div>
        </div>
        <AllWorkflowStyles />
      </div>
    );
  }

  return (
    <div>
      <UnderwritingDashboard />
    </div>
  );
}

export default App;
