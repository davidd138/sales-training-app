export const SYNC_USER = /* GraphQL */ `
  mutation SyncUser {
    syncUser { userId email name role status validFrom validUntil groups }
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
      communication strengths improvements detailedFeedback categoryDetails
    }
  }
`;

export const CREATE_SCENARIO = /* GraphQL */ `
  mutation CreateScenario($input: CreateScenarioInput!) {
    createScenario(input: $input) {
      id name description clientName clientTitle clientCompany industry difficulty persona voice
    }
  }
`;

export const UPDATE_SCENARIO = /* GraphQL */ `
  mutation UpdateScenario($input: UpdateScenarioInput!) {
    updateScenario(input: $input) {
      id name description clientName clientTitle clientCompany industry difficulty persona voice
    }
  }
`;

export const DELETE_SCENARIO = /* GraphQL */ `
  mutation DeleteScenario($id: String!) {
    deleteScenario(id: $id)
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

export const UPDATE_USER_STATUS = /* GraphQL */ `
  mutation UpdateUserStatus($input: UpdateUserStatusInput!) {
    updateUserStatus(input: $input) { userId email name role status validFrom validUntil }
  }
`;
