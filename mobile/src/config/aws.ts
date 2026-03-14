import { Amplify } from 'aws-amplify';

// These values come from CDK outputs after deployment.
// Update them with real values from your CloudFormation stack.
const AWS_CONFIG = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_Jb9HFBjth',
      userPoolClientId: '5bauik1954si0safmctgsu3de',
    },
  },
  API: {
    GraphQL: {
      endpoint: 'https://pukovfifrfd7lfzibr5ncv3ypy.appsync-api.eu-west-1.amazonaws.com/graphql',
      defaultAuthMode: 'userPool' as const,
    },
  },
};

export function configureAWS() {
  Amplify.configure(AWS_CONFIG);
}
