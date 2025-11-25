export interface AgentMessage {
  content: string;
  role: string;
  name: string;
}

export const parseAgentMessages = (detailedMessages: string[]): AgentMessage[] => {
  return detailedMessages.map(messageStr => {
    try {
      // Handle the JSON string format from the log
      let cleanStr = messageStr;
      
      // Remove outer quotes if present
      if (cleanStr.startsWith('"') && cleanStr.endsWith('"')) {
        cleanStr = cleanStr.slice(1, -1);
      }
      
      // Handle escaped characters
      cleanStr = cleanStr
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\'/g, "'");
      
      const parsed = JSON.parse(cleanStr);
      return {
        content: parsed.content,
        role: parsed.role,
        name: parsed.name
      };
    } catch (error) {
      console.error('Error parsing message:', error, messageStr);
      
      // Try to extract basic info if JSON parsing fails
      const nameMatch = messageStr.match(/'name':\s*'([^']+)'/);
      const contentMatch = messageStr.match(/'content':\s*'([^']+(?:'[^']*'[^']*)*?)'/);
      
      return {
        content: contentMatch ? contentMatch[1] : messageStr,
        role: 'user',
        name: nameMatch ? nameMatch[1] : 'Parser_Error'
      };
    }
  });
};

export const formatAgentName = (name: string): string => {
  return name.replace(/_/g, ' ');
};

export const parseMarkdownContent = (content: string): string => {
  let processed = content;
  
  // First handle escaped newlines from JSON
  processed = processed
    .replace(/\\n\\n/g, '\n\n')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
  
  // Now apply markdown formatting
  processed = processed
    // Headers with ###
    .replace(/###\s*(.*?)(?=\n|$)/g, '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-200">$1</h3>')
    
    // Bold text with **
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
    
    // Numbered lists
    .replace(/^(\d+)\.\s+(.*?)$/gm, '<div class="flex items-start gap-3 mb-2 ml-4"><span class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">$1</span><span class="text-gray-700">$2</span></div>')
    
    // Bullet points with -
    .replace(/^-\s+(.*?)$/gm, '<div class="flex items-start gap-3 mb-2 ml-4"><span class="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></span><span class="text-gray-700">$1</span></div>')
    
    // Horizontal rules
    .replace(/---+/g, '<hr class="my-6 border-gray-300">')
    
    // Handle special sections
    .replace(/FRAUD_RISK:\s*(LOW|MEDIUM|HIGH)/g, '<div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">🛡️ Fraud Risk: $1</div>')
    .replace(/FINAL DECISION:\s*(APPROVED|REJECTED|PENDING)/g, '<div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">✅ Decision: $1</div>')
    .replace(/FINAL APPROVED AMOUNT:\s*(₹[\d,]+)/g, '<div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-4">💰 Amount: $1</div>')
    
    // Convert multiple newlines to spacing
    .replace(/\n\n+/g, '<div class="my-4"></div>')
    
    // Convert single newlines to breaks
    .replace(/\n/g, '<br>');
  
  return processed;
};

export const extractSummary = (content: string): { summary: string; recommendation: string; conclusion: string } => {
  // Clean up escaped characters first
  const cleanContent = content
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
  
  // Extract different sections
  const summaryMatch = cleanContent.match(/(?:### ASSESSMENT SUMMARY|FRAUD_RISK: \w+)(.*?)(?=###|RECOMMENDATION|CONCLUSION|$)/s);
  const recommendationMatch = cleanContent.match(/(?:### RECOMMENDATION|RECOMMENDATION FOR SPECIALISTS)(.*?)(?=###|CONCLUSION|END OF|$)/s);
  const conclusionMatch = cleanContent.match(/(?:### CONCLUSION|CONCLUSION)(.*?)(?=END OF|$)/s);
  
  // Extract key findings for summary
  const riskMatch = cleanContent.match(/(?:FRAUD_RISK|Risk Level|Fraud Risk Level):\s*(\w+)/i);
  const decisionMatch = cleanContent.match(/(?:FINAL DECISION|Decision):\s*(\w+)/i);
  const amountMatch = cleanContent.match(/(?:APPROVED AMOUNT|Final Approved):\s*(₹[\d,]+)/i);
  
  let summary = 'Analysis in progress...';
  if (summaryMatch) {
    summary = summaryMatch[1].trim().substring(0, 150) + '...';
  } else if (riskMatch || decisionMatch) {
    const parts = [];
    if (riskMatch) parts.push(`Risk Level: ${riskMatch[1]}`);
    if (decisionMatch) parts.push(`Decision: ${decisionMatch[1]}`);
    if (amountMatch) parts.push(`Amount: ${amountMatch[1]}`);
    summary = parts.join(' • ');
  }
  
  let recommendation = 'Pending analysis...';
  if (recommendationMatch) {
    recommendation = recommendationMatch[1].trim().substring(0, 150) + '...';
  }
  
  let conclusion = 'Analysis ongoing...';
  if (conclusionMatch) {
    conclusion = conclusionMatch[1].trim().substring(0, 150) + '...';
  }
  
  return {
    summary: summary.replace(/[*#-]/g, '').trim(),
    recommendation: recommendation.replace(/[*#-]/g, '').trim(),
    conclusion: conclusion.replace(/[*#-]/g, '').trim()
  };
};