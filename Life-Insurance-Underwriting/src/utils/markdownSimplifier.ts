// Utility functions to simplify markdown responses and extract agent summaries

export function simplifyMarkdownResponse(markdownText: string): string {
  if (!markdownText) return '';
  
  // Remove headers and excessive formatting, keep only key content
  let simplified = markdownText
    // Remove headers (###, ##, #)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic formatting but keep the text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    // Remove multiple consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Clean up list formatting
    .replace(/^\s*[-*+]\s+/gm, '• ')
    // Remove table formatting
    .replace(/\|([^|\n]+)\|/g, '$1')
    // Remove extra spaces
    .replace(/\s{2,}/g, ' ')
    // Remove leading/trailing whitespace from each line
    .replace(/^\s+|\s+$/gm, '')
    // Trim overall whitespace
    .trim();
    
  return simplified;
}

export function extractKeyFindings(markdownText: string, agentType: string): { summary: string; keyMetrics: string[] } {
  if (!markdownText) return { summary: 'No analysis available', keyMetrics: [] };

  let summary = '';
  let keyMetrics: string[] = [];

  switch (agentType) {
    case 'Medical Review Specialist':
    case 'Clinical Risk Assessment':
      // Extract medical conditions with individual loadings
      const conditionsSection = markdownText.match(/Medical Conditions Identified:([\s\S]*?)(?=\n\n|###|$)/i);
      const totalLoading = markdownText.match(/Total.*Loading.*?(\d+%)/i);
      
      if (conditionsSection) {
        // Extract individual conditions with their loadings
        const conditionLines = conditionsSection[1]
          .split('\n')
          .filter(line => line.trim().length > 0 && (line.includes('-') || line.includes('•') || line.includes('1.') || line.includes('2.') || line.includes('3.')))
          .slice(0, 4)
          .map(line => {
            // Clean up the line and extract condition name and loading if present
            const cleaned = line.replace(/^[-•*\d.]\s*/, '').trim();
            const loadingMatch = cleaned.match(/\((\d+%)\s*loading\)/i);
            if (loadingMatch) {
              const condition = cleaned.split('(')[0].trim().replace(/\*\*/g, '');
              return `${condition}: ${loadingMatch[1]}`;
            }
            return cleaned.replace(/\*\*/g, '').split(':')[0].trim();
          });
        
        summary = `Medical Conditions Identified:\n${conditionLines.join('\n')}`;
        
        // Add each condition as a key metric
        conditionLines.forEach(condition => {
          keyMetrics.push(condition);
        });
      }
      
      if (totalLoading) {
        keyMetrics.push(`Total Medical Loading: ${totalLoading[1]}`);
      }
      break;

    case 'Fraud Detection Specialist':
      // Extract fraud risk rating
      const fraudRisk = markdownText.match(/FRAUD RISK RATING:\s*(\w+)/i);
      
      if (fraudRisk) {
        summary = `Fraud Risk: ${fraudRisk[1]} - All data appears authentic and consistent`;
        keyMetrics.push(`Risk Level: ${fraudRisk[1]}`);
      }
      break;

    case 'Risk Assessment Specialist':
      // Extract risk score and category
      const riskScore = markdownText.match(/FINAL RISK SCORE[^]*?(\d+\.\d+)/i);
      const riskCategory = markdownText.match(/RISK CATEGORIZATION[^]*?(\w+\s*RISK)/i);
      const topRisk = markdownText.match(/TOP.*RISK DRIVERS?[^]*?1\.\s*\*\*([^*]+)\*\*/i);
      
      if (riskScore && riskCategory) {
        summary = `${riskCategory[1]} (Score: ${riskScore[1]})`;
        keyMetrics.push(`Score: ${riskScore[1]}`);
        keyMetrics.push(`Category: ${riskCategory[1]}`);
      }
      
      if (topRisk) {
        keyMetrics.push(`Top Risk: ${topRisk[1]}`);
      }
      break;

    case 'Premium Calculation Specialist':
      // Extract premium amounts
      const totalPremium = markdownText.match(/TOTAL ANNUAL PREMIUM[^]*?₹([\d,]+)/i);
      const termLife = markdownText.match(/Term Life[^]*?₹([\d,]+)/i);
      
      if (totalPremium) {
        summary = `Annual Premium: ₹${totalPremium[1]}`;
        keyMetrics.push(`Total: ₹${totalPremium[1]}`);
      }
      
      if (termLife) {
        keyMetrics.push(`Term Life: ₹${termLife[1]}`);
      }
      break;

    case 'Senior Underwriting Decision Maker':
    case 'Underwriting Decision Maker':
      // Extract decision and key terms
      const decision = markdownText.match(/Decision Category[^]*?(\w+[\w\s]*)/i) || 
                      markdownText.match(/UNDERWRITING DECISION[^]*?(\w+[\w\s]*)/i);
      const exclusions = markdownText.match(/Exclusions Applied[^]*?(\w+[\w\s]*)/i);
      
      if (decision) {
        summary = `Decision: ${decision[1]}`;
        keyMetrics.push(`Status: ${decision[1]}`);
      }
      
      if (exclusions) {
        keyMetrics.push(`Exclusions: Multiple conditions`);
      }
      break;

    default:
      // Generic extraction for unknown agent types
      const firstSentence = markdownText.split(/[.!?]/)[0];
      summary = firstSentence ? firstSentence.trim() + '...' : 'Analysis complete';
  }

  // Fallback if no specific extraction worked
  if (!summary) {
    const cleaned = simplifyMarkdownResponse(markdownText);
    const sentences = cleaned.split(/[.!?]/).filter(s => s.trim().length > 10);
    summary = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '');
  }

  return { summary: summary || 'Analysis complete', keyMetrics };
}

export function getAgentSummary(agentData: any): string {
  if (!agentData) return 'No summary available';
  
  // Extract key information from agent data
  if (typeof agentData === 'string') {
    return simplifyMarkdownResponse(agentData);
  }
  
  if (agentData.summary) {
    return simplifyMarkdownResponse(agentData.summary);
  }
  
  if (agentData.response) {
    return simplifyMarkdownResponse(agentData.response);
  }
  
  if (agentData.message) {
    return simplifyMarkdownResponse(agentData.message);
  }
  
  // If it's an object, try to extract meaningful text
  if (typeof agentData === 'object') {
    const textFields = ['description', 'content', 'text', 'result'];
    for (const field of textFields) {
      if (agentData[field]) {
        return simplifyMarkdownResponse(agentData[field]);
      }
    }
  }
  
  return 'Summary not available';
}

export function createReadableAnalysisSummary(analysis: string, agentType: string): string {
  const { summary, keyMetrics } = extractKeyFindings(analysis, agentType);
  
  let readable = `${summary}\n\n`;
  
  if (keyMetrics.length > 0) {
    readable += `Key Findings:\n${keyMetrics.map(metric => `• ${metric}`).join('\n')}`;
  }
  
  return readable.trim();
}