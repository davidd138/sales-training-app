# Guia de Configuracion - SalesPulse AI

## Requisitos

- Cuenta AWS con acceso a Cognito, DynamoDB, AppSync, Bedrock
- API key de OpenAI para sesiones de voz en tiempo real
- Node.js 20+ para desarrollo frontend
- Python 3.11+ para backend y scripts

## Configuracion Inicial

### 1. Crear usuario admin

```bash
cd backend/scripts
python3 setup_admin.py
```

### 2. Cargar escenarios y criterios

```bash
python3 seed_all.py
```

Para limpiar datos existentes antes de cargar:

```bash
python3 seed_all.py --clear
```

### 3. Configurar API key de OpenAI

La clave se almacena en AWS Secrets Manager con el nombre `dev/openai-api-key`.

### 4. Acceso de modelos Bedrock

Para usar Claude como motor de analisis, es necesario completar el formulario
de uso de Anthropic en la consola de Bedrock. Mientras tanto, la app usa
Amazon Nova Pro automaticamente como fallback.

## Gestion de Usuarios

1. Los usuarios se registran en la web
2. Su cuenta queda en estado "pendiente"
3. Un admin debe aprobarlos desde /admin/users
4. Se puede establecer periodo de acceso (validFrom/validUntil)

## Comandos Utiles

| Tarea | Comando |
|-------|---------|
| Build frontend | `cd frontend && npm run build` |
| Tests backend | `cd backend && python3 -m pytest tests/ -v` |
| Tests E2E | `cd backend && python3 -m pytest tests/test_e2e.py -v -m e2e` |
| Tests frontend | `cd frontend && npx vitest run` |
| Deploy | Push a main (auto-deploy via CodePipeline) |
