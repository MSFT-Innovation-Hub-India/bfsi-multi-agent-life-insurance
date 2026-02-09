/**
 * Underwriting API Utilities
 * 
 * Fire-and-forget API calls to trigger backend processing.
 * The API runs agents and stores results in Cosmos DB.
 * UI display remains unchanged (uses local JSON files).
 */

// API base URL - update this for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ApplicationData {
  personalInfo: {
    name: string;
    age: number;
    gender: string;
    occupation?: string;
    income?: { annual: number; currency?: string };
  };
  applicationDetails: {
    applicationNumber: string;
    applicationDate?: string;
  };
  insuranceCoverage: {
    totalSumAssured: number;
    coversRequested?: Array<{
      coverType: string;
      sumAssured: number;
      term?: number;
    }>;
  };
  lifestyle?: Record<string, unknown>;
  health?: Record<string, unknown>;
  medicalData?: Record<string, unknown>;
}

/**
 * Trigger the underwriting API to process an application.
 * This is a fire-and-forget call - the UI doesn't wait for results.
 * Results are stored in Cosmos DB by the backend.
 * 
 * @param applicationData - The application data to process
 */
export async function triggerUnderwritingProcess(applicationData: ApplicationData): Promise<void> {
  try {
    console.log('🚀 Triggering underwriting API for:', applicationData.applicationDetails.applicationNumber);
    
    // Fire-and-forget: don't await the response
    fetch(`${API_BASE_URL}/api/v1/underwriting/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData),
    })
      .then(response => {
        if (response.ok) {
          console.log('✅ Underwriting API triggered successfully');
        } else {
          console.warn('⚠️ Underwriting API returned non-OK status:', response.status);
        }
      })
      .catch(error => {
        console.warn('⚠️ Underwriting API call failed (non-blocking):', error.message);
      });
    
  } catch (error) {
    // Log but don't throw - this is fire-and-forget
    console.warn('⚠️ Failed to trigger underwriting API (non-blocking):', error);
  }
}

/**
 * Build application data from the UnderwritingReport data structure
 */
export function buildApplicationDataFromReport(
  data: { application_metadata: { applicant_name: string; application_id: string } },
  sampleData?: Record<string, unknown>
): ApplicationData {
  // Use sample data if provided, otherwise create minimal structure
  if (sampleData) {
    return {
      personalInfo: (sampleData.personalInfo as ApplicationData['personalInfo']) || {
        name: data.application_metadata.applicant_name,
        age: 35,
        gender: 'Unknown',
      },
      applicationDetails: {
        applicationNumber: data.application_metadata.application_id,
        applicationDate: new Date().toISOString(),
      },
      insuranceCoverage: (sampleData.insuranceCoverage as ApplicationData['insuranceCoverage']) || {
        totalSumAssured: 8000000,
        coversRequested: [],
      },
      lifestyle: sampleData.lifestyle as Record<string, unknown>,
      health: sampleData.health as Record<string, unknown>,
      medicalData: sampleData.medicalData as Record<string, unknown>,
    };
  }

  // Minimal data structure when sample data is not available
  return {
    personalInfo: {
      name: data.application_metadata.applicant_name,
      age: 35,
      gender: 'Unknown',
    },
    applicationDetails: {
      applicationNumber: data.application_metadata.application_id,
      applicationDate: new Date().toISOString(),
    },
    insuranceCoverage: {
      totalSumAssured: 8000000,
      coversRequested: [
        { coverType: 'Term Life Insurance', sumAssured: 5000000, term: 20 },
        { coverType: 'Critical Illness', sumAssured: 2000000, term: 20 },
        { coverType: 'Accidental Death Benefit', sumAssured: 1000000, term: 20 },
      ],
    },
  };
}
