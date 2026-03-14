export const SYNC_USER = /* GraphQL */ `
  mutation SyncUser {
    syncUser { userId email name role }
  }
`;

export const CREATE_CONVERSATION = /* GraphQL */ `
  mutation CreateConversation($input: CreateConversationInput!) {
    createConversation(input: $input) { id scenarioId scenarioName clientName status startedAt }
  }
`;

export const UPDATE_CONVERSATION = /* GraphQL */ `
  mutation UpdateConversation($input: UpdateConversationInput!) {
    updateConversation(input: $input) { id status duration endedAt }
  }
`;

export const ANALYZE_CONVERSATION = /* GraphQL */ `
  mutation AnalyzeConversation($conversationId: String!) {
    analyzeConversation(conversationId: $conversationId) {
      conversationId overallScore rapport discovery presentation objectionHandling closing
      strengths improvements detailedFeedback
    }
  }
`;

export const CREATE_GUIDELINE = /* GraphQL */ `
  mutation CreateGuideline($input: CreateGuidelineInput!) {
    createGuideline(input: $input) { id title content isActive }
  }
`;

export const UPDATE_GUIDELINE = /* GraphQL */ `
  mutation UpdateGuideline($input: UpdateGuidelineInput!) {
    updateGuideline(input: $input) { id title content isActive }
  }
`;
