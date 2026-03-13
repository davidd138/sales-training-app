import { useCallback, useState } from 'react';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

// ---- Queries ----
export const LIST_SCENARIOS = /* GraphQL */ `
  query ListScenarios {
    listScenarios {
      id
      name
      description
      clientName
      clientTitle
      clientCompany
      industry
      difficulty
      persona
    }
  }
`;

export const LIST_CONVERSATIONS = /* GraphQL */ `
  query ListConversations($limit: Int, $nextToken: String) {
    listConversations(limit: $limit, nextToken: $nextToken) {
      items {
        id
        scenarioName
        clientName
        duration
        status
        startedAt
      }
      nextToken
    }
  }
`;

export const GET_CONVERSATION = /* GraphQL */ `
  query GetConversation($id: String!) {
    getConversation(id: $id) {
      conversation {
        id
        userId
        scenarioId
        scenarioName
        clientName
        transcript
        duration
        status
        startedAt
        endedAt
      }
      score {
        conversationId
        overallScore
        rapport
        discovery
        presentation
        objectionHandling
        closing
        strengths
        improvements
        detailedFeedback
        analyzedAt
      }
    }
  }
`;

export const GET_ANALYTICS = /* GraphQL */ `
  query GetAnalytics {
    getAnalytics {
      totalSessions
      avgOverallScore
      avgRapport
      avgDiscovery
      avgPresentation
      avgObjectionHandling
      avgClosing
      teamAvgOverallScore
      teamAvgRapport
      teamAvgDiscovery
      teamAvgPresentation
      teamAvgObjectionHandling
      teamAvgClosing
      recentScores {
        conversationId
        overallScore
        date
        scenarioName
      }
      percentile
    }
  }
`;

export const GET_LEADERBOARD = /* GraphQL */ `
  query GetLeaderboard {
    getLeaderboard {
      entries {
        userId
        email
        name
        avgScore
        totalSessions
      }
    }
  }
`;

export const GET_GUIDELINES = /* GraphQL */ `
  query GetGuidelines {
    getGuidelines {
      id
      title
      content
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_REALTIME_TOKEN = /* GraphQL */ `
  query GetRealtimeToken {
    getRealtimeToken {
      token
      expiresAt
    }
  }
`;

// ---- Mutations ----
export const CREATE_CONVERSATION = /* GraphQL */ `
  mutation CreateConversation($input: CreateConversationInput!) {
    createConversation(input: $input) {
      id
      scenarioId
      scenarioName
      clientName
      status
      startedAt
    }
  }
`;

export const UPDATE_CONVERSATION = /* GraphQL */ `
  mutation UpdateConversation($input: UpdateConversationInput!) {
    updateConversation(input: $input) {
      id
      status
      duration
      endedAt
    }
  }
`;

export const ANALYZE_CONVERSATION = /* GraphQL */ `
  mutation AnalyzeConversation($conversationId: String!) {
    analyzeConversation(conversationId: $conversationId) {
      conversationId
      overallScore
      rapport
      discovery
      presentation
      objectionHandling
      closing
      strengths
      improvements
      detailedFeedback
    }
  }
`;

export const CREATE_GUIDELINE = /* GraphQL */ `
  mutation CreateGuideline($input: CreateGuidelineInput!) {
    createGuideline(input: $input) {
      id
      title
      content
      isActive
    }
  }
`;

export const UPDATE_GUIDELINE = /* GraphQL */ `
  mutation UpdateGuideline($input: UpdateGuidelineInput!) {
    updateGuideline(input: $input) {
      id
      title
      content
      isActive
    }
  }
`;

// ---- Hook ----
export function useQuery<T = any>(query: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (variables?: Record<string, any>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.graphql({ query, variables });
        const d = (result as any).data;
        const key = Object.keys(d)[0];
        setData(d[key]);
        return d[key] as T;
      } catch (e: any) {
        setError(e.message || 'Error');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  return { data, loading, error, execute };
}

export function useMutation<T = any>(mutation: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (variables?: Record<string, any>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.graphql({ query: mutation, variables });
        const d = (result as any).data;
        const key = Object.keys(d)[0];
        return d[key] as T;
      } catch (e: any) {
        setError(e.message || 'Error');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [mutation]
  );

  return { loading, error, execute };
}
