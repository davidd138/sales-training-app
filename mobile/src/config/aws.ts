import { Amplify } from 'aws-amplify';

// These values come from CDK outputs after deployment.
// Update them with real values from your CloudFormation stack.
const AWS_CONFIG = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_PLACEHOLDER',
      userPoolClientId: 'PLACEHOLDER',
    },
  },
  API: {
    GraphQL: {
      endpoint: 'https://PLACEHOLDER.appsync-api.eu-west-1.amazonaws.com/graphql',
      defaultAuthMode: 'userPool' as const,
    },
  },
};

export function configureAWS() {
  Amplify.configure(AWS_CONFIG);
}
