import type { APIResponse } from '../types/ai-evaluation.types';

/**
 * Mock API Responses
 * 
 * In production, these would be real responses from external sales APIs
 * (CRM signals, engagement data, intent scores, etc.)
 */
export const MOCK_API_RESPONSES: Record<string, APIResponse[]> = {
  // Example responses for different deal scenarios
  'healthy-deal': [
    {
      engagementScore: 85,
      stakeholderCount: 5,
      intentScore: 75,
      lastActivity: '2 days ago',
      emailOpenRate: 80,
      meetingAttendance: 100,
    },
  ],
  'at-risk-deal': [
    {
      engagementScore: 35,
      stakeholderCount: 2,
      intentScore: 25,
      lastActivity: '14 days ago',
      emailOpenRate: 30,
      meetingAttendance: 50,
    },
  ],
  'stalled-deal': [
    {
      engagementScore: 20,
      stakeholderCount: 1,
      intentScore: 15,
      lastActivity: '30 days ago',
      emailOpenRate: 15,
      meetingAttendance: 25,
    },
  ],
};

/**
 * Get mock API responses for a deal based on its AI score
 */
export function getMockAPIResponsesForDeal(aiScore: number): APIResponse[] {
  if (aiScore >= 80) {
    return MOCK_API_RESPONSES['healthy-deal'];
  } else if (aiScore >= 60) {
    return MOCK_API_RESPONSES['at-risk-deal'];
  } else {
    return MOCK_API_RESPONSES['stalled-deal'];
  }
}
