'use client';

import { Amplify } from 'aws-amplify';

const awsConfig = {
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

let configured = false;

export function configureAmplify() {
  if (!configured) {
    Amplify.configure(awsConfig);
    configured = true;
  }
}
