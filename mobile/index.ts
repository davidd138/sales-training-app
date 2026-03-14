import 'react-native-get-random-values';
import { configureAWS } from './src/config/aws';
configureAWS();

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
