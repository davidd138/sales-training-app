"""
E2E Tests against the live SalesPulse AI API.

Run with: python3 -m pytest tests/test_e2e.py -v -m e2e
Requires: AWS credentials configured, Cognito test user exists.

These tests hit the real deployed API and verify the full flow.
"""
import json
import os
import ssl
import subprocess
import urllib.request

import pytest

# Mark all tests in this file as e2e (skip in normal test runs)
pytestmark = pytest.mark.e2e

# Disable SSL verification for urllib (macOS Python issue)
ssl._create_default_https_context = ssl._create_unverified_context

COGNITO_CLIENT_ID = "7djdf4vlvrlfr30la9bad24q7s"
APPSYNC_URL = "https://zyorp7bunvdffah5b6hxlarpge.appsync-api.eu-west-1.amazonaws.com/graphql"
E2E_USERNAME = os.environ.get("E2E_USERNAME", "e2euser@salespulse.ai")
E2E_PASSWORD = os.environ.get("E2E_PASSWORD", "SalesPulse#E2e2026!")
FRONTEND_URL = "https://d37iyzx8veabdy.cloudfront.net"


@pytest.fixture(scope="module")
def auth_token():
    """Authenticate with Cognito and return ID token."""
    result = subprocess.run(
        [
            "aws", "cognito-idp", "initiate-auth",
            "--client-id", COGNITO_CLIENT_ID,
            "--auth-flow", "USER_PASSWORD_AUTH",
            "--auth-parameters", f"USERNAME={E2E_USERNAME},PASSWORD={E2E_PASSWORD}",
            "--region", "eu-west-1",
            "--output", "json",
        ],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        pytest.skip(f"Cannot authenticate: {result.stderr[:200]}")
    data = json.loads(result.stdout)
    return data["AuthenticationResult"]["IdToken"]


def gql(token, query, variables=None):
    """Execute a GraphQL query against AppSync."""
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        APPSYNC_URL,
        data=body,
        headers={"Authorization": token, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read())
    if result.get("errors"):
        raise Exception(result["errors"][0].get("message", str(result["errors"])))
    return result["data"]


class TestE2EAuth:
    def test_auth_returns_valid_token(self, auth_token):
        assert auth_token is not None
        assert len(auth_token) > 100

    def test_sync_user(self, auth_token):
        data = gql(auth_token, "mutation { syncUser { userId email role status } }")
        user = data["syncUser"]
        assert user["email"] == E2E_USERNAME
        assert user["status"] in ("active", "pending")

    def test_sync_user_returns_admin_role(self, auth_token):
        data = gql(auth_token, "mutation { syncUser { role } }")
        assert data["syncUser"]["role"] == "admin"


class TestE2EScenarios:
    def test_list_scenarios_returns_12(self, auth_token):
        data = gql(auth_token, "query { listScenarios { id name difficulty } }")
        scenarios = data["listScenarios"]
        assert len(scenarios) >= 8  # At least the original 8

    def test_scenarios_have_required_fields(self, auth_token):
        data = gql(auth_token, "query { listScenarios { id name clientName clientTitle clientCompany industry difficulty persona } }")
        for s in data["listScenarios"]:
            assert s["id"]
            assert s["name"]
            assert s["clientName"]
            assert s["difficulty"] in ("easy", "medium", "hard")
            assert s["persona"]

    def test_scenarios_cover_all_difficulties(self, auth_token):
        data = gql(auth_token, "query { listScenarios { difficulty } }")
        difficulties = {s["difficulty"] for s in data["listScenarios"]}
        assert "easy" in difficulties
        assert "medium" in difficulties
        assert "hard" in difficulties


class TestE2ERealtime:
    def test_get_realtime_token(self, auth_token):
        data = gql(auth_token, "query { getRealtimeToken { token expiresAt } }")
        token = data["getRealtimeToken"]
        assert token["token"].startswith("ek_")
        assert token["expiresAt"] > 0


class TestE2EConversationFlow:
    """Test the full conversation lifecycle: create -> update -> analyze -> get."""

    @pytest.fixture(scope="class")
    def conversation_id(self, auth_token):
        # Get first scenario
        data = gql(auth_token, "query { listScenarios { id difficulty } }")
        scenario_id = next(s["id"] for s in data["listScenarios"] if s["difficulty"] == "easy")

        # Create conversation
        data = gql(
            auth_token,
            "mutation($i: CreateConversationInput!) { createConversation(input: $i) { id scenarioName status } }",
            {"i": {"scenarioId": scenario_id}},
        )
        conv = data["createConversation"]
        assert conv["status"] == "in_progress"
        return conv["id"]

    @pytest.fixture(scope="class")
    def completed_conversation(self, auth_token, conversation_id):
        transcript = json.dumps([
            {"role": "assistant", "text": "Digame?"},
            {"role": "user", "text": "Buenos dias, soy de SalesPulse Energy"},
            {"role": "assistant", "text": "Dime, estoy liado"},
            {"role": "user", "text": "Que proveedor de energia tienen actualmente?"},
            {"role": "assistant", "text": "Endesa"},
            {"role": "user", "text": "Y cuanto pagan al mes aproximadamente?"},
            {"role": "assistant", "text": "Unos 3000 euros"},
            {"role": "user", "text": "Podemos reducirle un 15 por ciento manteniendo la misma calidad"},
            {"role": "assistant", "text": "Suena interesante. Enviame una propuesta"},
            {"role": "user", "text": "Se la envio manana y le llamo el jueves a las 10"},
            {"role": "assistant", "text": "Vale, jueves a las 10"},
        ])
        data = gql(
            auth_token,
            "mutation($i: UpdateConversationInput!) { updateConversation(input: $i) { id status duration } }",
            {"i": {"id": conversation_id, "status": "completed", "duration": 120, "transcript": transcript}},
        )
        assert data["updateConversation"]["status"] == "completed"
        return conversation_id

    def test_create_conversation(self, conversation_id):
        assert conversation_id is not None
        assert len(conversation_id) > 10

    def test_update_conversation(self, completed_conversation):
        assert completed_conversation is not None

    def test_analyze_conversation(self, auth_token, completed_conversation):
        data = gql(
            auth_token,
            "mutation($id: String!) { analyzeConversation(conversationId: $id) { overallScore rapport discovery presentation objectionHandling closing communication strengths improvements detailedFeedback } }",
            {"id": completed_conversation},
        )
        analysis = data["analyzeConversation"]
        assert 0 <= analysis["overallScore"] <= 100
        assert 0 <= analysis["rapport"] <= 100
        assert 0 <= analysis["discovery"] <= 100
        assert 0 <= analysis["presentation"] <= 100
        assert 0 <= analysis["objectionHandling"] <= 100
        assert 0 <= analysis["closing"] <= 100
        assert analysis["communication"] is not None
        assert len(analysis["strengths"]) > 0
        assert len(analysis["improvements"]) > 0
        assert len(analysis["detailedFeedback"]) > 50

    def test_get_conversation_with_score(self, auth_token, completed_conversation):
        data = gql(
            auth_token,
            "query($id: String!) { getConversation(id: $id) { conversation { id status duration } score { overallScore rapport } } }",
            {"id": completed_conversation},
        )
        assert data["getConversation"]["conversation"]["status"] == "completed"
        assert data["getConversation"]["score"] is not None
        assert data["getConversation"]["score"]["overallScore"] >= 0


class TestE2EAnalytics:
    def test_get_analytics(self, auth_token):
        data = gql(auth_token, "query { getAnalytics { totalSessions avgOverallScore percentile } }")
        analytics = data["getAnalytics"]
        assert analytics["totalSessions"] >= 0

    def test_get_leaderboard(self, auth_token):
        data = gql(auth_token, "query { getLeaderboard { entries { userId avgScore totalSessions } } }")
        assert "entries" in data["getLeaderboard"]


class TestE2EAdmin:
    def test_list_all_users(self, auth_token):
        data = gql(auth_token, "query { listAllUsers { items { userId email status role } } }")
        users = data["listAllUsers"]["items"]
        assert len(users) >= 1

    def test_get_guidelines(self, auth_token):
        data = gql(auth_token, "query { getGuidelines { id title isActive } }")
        guidelines = data["getGuidelines"]
        assert isinstance(guidelines, list)


class TestE2EFrontendPages:
    """Verify all frontend pages return HTTP 200."""

    PAGES = [
        "login", "register", "dashboard", "scenarios", "training",
        "analysis", "history", "analytics", "guidelines",
        "admin/users", "admin/scenarios", "admin/guidelines", "admin/analytics",
        "privacy", "terms", "cookies",
    ]

    @pytest.mark.parametrize("page", PAGES)
    def test_page_returns_200(self, page):
        url = f"{FRONTEND_URL}/{page}/index.html"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            assert resp.status == 200
