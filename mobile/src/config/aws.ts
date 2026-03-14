import { Amplify } from 'aws-amplify';

// These values come from CDK outputs after deployment.
// Update them with real values from your CloudFormation stack.
const AWS_CONFIG = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_79mmqRtMj',
      userPoolClientId: '5gjo7u3n7kgkc7ui43blushp4f',
    },
  },
  API: {
    GraphQL: {
      endpoint: 'https://iqdkvii7vffotj6cseodclz6l4.appsync-api.eu-west-1.amazonaws.com/graphql',
      defaultAuthMode: 'userPool' as const,
    },
  },
};

export function configureAWS() {
  Amplify.configure(AWS_CONFIG);
}
