import { Amplify } from 'aws-amplify';

// These values come from CDK outputs after deployment.
// Update them with real values from your CloudFormation stack.
const AWS_CONFIG = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_lp5QJAgf1',
      userPoolClientId: '7djdf4vlvrlfr30la9bad24q7s',
    },
  },
  API: {
    GraphQL: {
      endpoint: 'https://zyorp7bunvdffah5b6hxlarpge.appsync-api.eu-west-1.amazonaws.com/graphql',
      defaultAuthMode: 'userPool' as const,
    },
  },
};

export function configureAWS() {
  Amplify.configure(AWS_CONFIG);
}
