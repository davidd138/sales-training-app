# Sales Training - Acceso a la Web App

## URL de la aplicacion

**https://d37iyzx8veabdy.cloudfront.net**

## Primer acceso

1. Abre la URL en tu navegador (Chrome recomendado para funcionalidad de voz)
2. Haz clic en **"Crear cuenta"** o navega a `/register`
3. Rellena nombre, email y contrasena (minimo 12 caracteres, debe incluir mayusculas, minusculas, numeros y simbolos)
4. Revisa tu email para el **codigo de verificacion** de 6 digitos
5. Introduce el codigo en la pantalla de verificacion
6. Inicia sesion con tu email y contrasena

## Requisitos de contrasena

- Minimo 12 caracteres
- Al menos una mayuscula
- Al menos una minuscula
- Al menos un numero
- Al menos un simbolo especial

## Funcionalidades

### Dashboard (`/dashboard`)
Resumen de estadisticas, sesiones recientes y acceso rapido a escenarios.

### Escenarios (`/scenarios`)
Selecciona un escenario de entrenamiento (llamada en frio, negociacion, etc.) con diferentes niveles de dificultad.

### Entrenamiento por voz (`/training?id=<scenarioId>`)
Sesion de practica con un cliente virtual usando voz en tiempo real (requiere microfono).
- Haz clic en **"Iniciar llamada"** para comenzar
- Habla normalmente con el cliente virtual
- Haz clic en **"Colgar"** para finalizar y recibir analisis

### Analisis (`/analysis?id=<conversationId>`)
Puntuacion detallada de tu sesion: rapport, descubrimiento, presentacion, objeciones y cierre. Incluye fortalezas, areas de mejora y feedback detallado.

### Historial (`/history`)
Tabla paginada con todas tus sesiones pasadas y sus puntuaciones.

### Analytics (`/analytics`)
Comparacion de tu rendimiento con el equipo y tabla de clasificacion.

### Directrices (`/guidelines`)
Gestiona las directrices de venta que usa la IA para evaluar las sesiones.

## Requisitos del navegador

- **Chrome** (recomendado) - Soporte completo de WebRTC y Web Audio API
- **Firefox** - Funciona correctamente
- **Safari** - Funciona, pero puede requerir permisos manuales de microfono
- **Microfono** - Necesario para las sesiones de entrenamiento por voz

## Arquitectura

- **Frontend**: Next.js 15 (static export) en S3 + CloudFront
- **Backend**: AWS AppSync (GraphQL) + Lambda + DynamoDB
- **Auth**: Amazon Cognito (email + contrasena)
- **Voz**: OpenAI Realtime API via WebSocket
- **Analisis**: Amazon Bedrock (Claude)
- **Seguridad**: WAF, HSTS, CSP, X-Frame-Options, rate limiting

## Desarrollo local

```bash
cd frontend
npm install
npm run dev
# Abre http://localhost:3000
```

## Despliegue

El despliegue es automatico via CodePipeline. Cada push a `main` dispara:
1. CDK Synth (genera CloudFormation templates)
2. Self-Mutate (actualiza la pipeline si cambia)
3. Deploy Backend + Frontend stacks
4. Build Next.js y sync a S3 + invalidacion CloudFront
