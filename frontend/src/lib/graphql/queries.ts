export const LIST_SCENARIOS = /* GraphQL */ `
  query ListScenarios {
    listScenarios {
      id name description clientName clientTitle clientCompany industry difficulty persona voice
    }
  }
`;

export const LIST_CONVERSATIONS = /* GraphQL */ `
  query ListConversations($limit: Int, $nextToken: String) {
    listConversations(limit: $limit, nextToken: $nextToken) {
      items { id scenarioName clientName duration status startedAt }
      nextToken
    }
  }
`;

export const GET_CONVERSATION = /* GraphQL */ `
  query GetConversation($id: String!) {
    getConversation(id: $id) {
      conversation {
        id userId scenarioId scenarioName clientName transcript duration status startedAt endedAt
      }
      score {
        conversationId overallScore rapport discovery presentation objectionHandling closing
        communication strengths improvements detailedFeedback categoryDetails analyzedAt
      }
    }
  }
`;

export const GET_ANALYTICS = /* GraphQL */ `
  query GetAnalytics {
    getAnalytics {
      totalSessions avgOverallScore avgRapport avgDiscovery avgPresentation
      avgObjectionHandling avgClosing avgCommunication teamAvgOverallScore teamAvgRapport
      teamAvgDiscovery teamAvgPresentation teamAvgObjectionHandling teamAvgClosing teamAvgCommunication
      recentScores { conversationId overallScore date scenarioName }
      percentile
    }
  }
`;

export const GET_LEADERBOARD = /* GraphQL */ `
  query GetLeaderboard {
    getLeaderboard {
      entries { userId email name avgScore totalSessions }
    }
  }
`;

export const GET_GUIDELINES = /* GraphQL */ `
  query GetGuidelines {
    getGuidelines { id title content isActive createdAt updatedAt }
  }
`;

export const GET_REALTIME_TOKEN = /* GraphQL */ `
  query GetRealtimeToken {
    getRealtimeToken { token expiresAt }
  }
`;

export const LIST_ALL_USERS = /* GraphQL */ `
  query ListAllUsers {
    listAllUsers {
      items { userId email name role status validFrom validUntil }
    }
  }
`;
