import sys
import os
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambdas', 'resolvers'))

os.environ.setdefault("CONVERSATIONS_TABLE", "test-conversations")
os.environ.setdefault("SCENARIOS_TABLE", "test-scenarios")


class TestCreateConversation:
    def _make_event(self, scenario_id="550e8400-e29b-41d4-a716-446655440000"):
        return {
            "identity": {
                "sub": "user-123",
                "claims": {"email": "test@example.com"},
            },
            "arguments": {
                "input": {"scenarioId": scenario_id},
            },
        }

    @patch("create_conversation.scenarios_table")
    @patch("create_conversation.conversations_table")
    def test_creates_conversation(self, mock_conv_table, mock_scen_table):
        mock_scen_table.get_item.return_value = {
            "Item": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Test Scenario",
                "clientName": "María García",
            }
        }
        mock_conv_table.put_item.return_value = {}

        from create_conversation import handler

        result = handler(self._make_event(), None)

        assert result["userId"] == "user-123"
        assert result["userEmail"] == "test@example.com"
        assert result["scenarioName"] == "Test Scenario"
        assert result["clientName"] == "María García"
        assert result["status"] == "in_progress"
        assert result["transcript"] == "[]"
        assert result["duration"] == 0
        assert "id" in result
        assert "startedAt" in result

        mock_conv_table.put_item.assert_called_once()

    @patch("create_conversation.scenarios_table")
    @patch("create_conversation.conversations_table")
    def test_rejects_invalid_uuid(self, mock_conv_table, mock_scen_table):
        from create_conversation import handler

        with pytest.raises(Exception, match="must be a valid UUID"):
            handler(self._make_event(scenario_id="not-a-uuid"), None)

        mock_conv_table.put_item.assert_not_called()

    @patch("create_conversation.scenarios_table")
    @patch("create_conversation.conversations_table")
    def test_rejects_missing_scenario(self, mock_conv_table, mock_scen_table):
        mock_scen_table.get_item.return_value = {}

        from create_conversation import handler

        with pytest.raises(Exception, match="Scenario not found"):
            handler(self._make_event(), None)

        mock_conv_table.put_item.assert_not_called()
