import sys
import os
import json
import pytest
from unittest.mock import patch, MagicMock
from decimal import Decimal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambdas', 'resolvers'))

os.environ.setdefault("CONVERSATIONS_TABLE", "test-conversations")
os.environ.setdefault("SCENARIOS_TABLE", "test-scenarios")
os.environ.setdefault("SCORES_TABLE", "test-scores")
os.environ.setdefault("USERS_TABLE", "test-users")
os.environ.setdefault("GUIDELINES_TABLE", "test-guidelines")


class TestCreateConversation:
    @patch('create_conversation.scenarios_table')
    @patch('create_conversation.conversations_table')
    @patch('create_conversation.check_user_access')
    def test_creates_conversation_with_valid_scenario(self, mock_auth, mock_conv_table, mock_scen_table):
        from create_conversation import handler
        mock_auth.return_value = None
        import uuid
        scenario_id = str(uuid.uuid4())
        mock_scen_table.get_item.return_value = {
            'Item': {'id': scenario_id, 'name': 'Test Scenario', 'clientName': 'Maria', 'clientCompany': 'TestCorp'}
        }
        mock_conv_table.put_item.return_value = {}

        event = {
            'identity': {'sub': 'user-1'},
            'arguments': {'input': {'scenarioId': scenario_id}}
        }

        result = handler(event, None)
        assert result is not None
        assert 'id' in result
        assert result['status'] == 'in_progress'
        mock_conv_table.put_item.assert_called_once()

    @patch('create_conversation.check_user_access')
    def test_fails_without_scenario_id(self, mock_auth):
        from create_conversation import handler
        mock_auth.return_value = None
        event = {
            'identity': {'sub': 'user-1'},
            'arguments': {'input': {}}
        }
        with pytest.raises(Exception):
            handler(event, None)

    @patch('create_conversation.scenarios_table')
    @patch('create_conversation.conversations_table')
    @patch('create_conversation.check_user_access')
    def test_fails_with_nonexistent_scenario(self, mock_auth, mock_conv_table, mock_scen_table):
        from create_conversation import handler
        import uuid
        mock_auth.return_value = None
        mock_scen_table.get_item.return_value = {}

        event = {
            'identity': {'sub': 'user-1'},
            'arguments': {'input': {'scenarioId': str(uuid.uuid4())}}
        }
        with pytest.raises(Exception, match="Scenario not found"):
            handler(event, None)

    @patch('create_conversation.check_user_access')
    def test_fails_with_invalid_uuid(self, mock_auth):
        from create_conversation import handler
        mock_auth.return_value = None
        event = {
            'identity': {'sub': 'user-1'},
            'arguments': {'input': {'scenarioId': 'not-a-uuid'}}
        }
        with pytest.raises(Exception):
            handler(event, None)


class TestUpdateConversation:
    def test_validates_transcript_size(self):
        from validation import validate_transcript, ValidationError
        # Valid transcript
        valid = json.dumps([{"role": "user", "text": "hello"}])
        result = validate_transcript(valid)
        assert result == valid

        # Too large transcript (over 512KB)
        large = "x" * 600000
        with pytest.raises(ValidationError):
            validate_transcript(large)

    def test_validates_non_string_transcript(self):
        from validation import validate_transcript, ValidationError
        with pytest.raises(ValidationError):
            validate_transcript(12345)

    @patch('update_conversation.conversations_table')
    @patch('update_conversation.check_user_access')
    def test_update_returns_conv_when_no_fields(self, mock_auth, mock_conv_table):
        from update_conversation import handler
        import uuid
        conv_id = str(uuid.uuid4())
        mock_auth.return_value = None
        mock_conv_table.get_item.return_value = {
            'Item': {'id': conv_id, 'userId': 'user-1', 'status': 'in_progress'}
        }

        event = {
            'identity': {'sub': 'user-1'},
            'arguments': {'input': {'id': conv_id}}
        }
        result = handler(event, None)
        assert result['id'] == conv_id
        mock_conv_table.update_item.assert_not_called()

    @patch('update_conversation.conversations_table')
    @patch('update_conversation.check_user_access')
    def test_update_rejects_wrong_user(self, mock_auth, mock_conv_table):
        from update_conversation import handler
        import uuid
        conv_id = str(uuid.uuid4())
        mock_auth.return_value = None
        mock_conv_table.get_item.return_value = {
            'Item': {'id': conv_id, 'userId': 'other-user', 'status': 'in_progress'}
        }

        event = {
            'identity': {'sub': 'user-1'},
            'arguments': {'input': {'id': conv_id}}
        }
        with pytest.raises(Exception, match="Not found or unauthorized"):
            handler(event, None)


class TestValidation:
    def test_validate_uuid_accepts_valid(self):
        from validation import validate_uuid
        import uuid
        valid = str(uuid.uuid4())
        assert validate_uuid(valid, "test") == valid

    def test_validate_uuid_rejects_invalid(self):
        from validation import validate_uuid, ValidationError
        with pytest.raises(ValidationError):
            validate_uuid("not-a-uuid", "test")

    def test_validate_uuid_rejects_empty(self):
        from validation import validate_uuid, ValidationError
        with pytest.raises(ValidationError):
            validate_uuid("", "test")

    def test_validate_enum_accepts_valid(self):
        from validation import validate_enum
        assert validate_enum("easy", "diff", ["easy", "medium", "hard"]) == "easy"

    def test_validate_enum_rejects_invalid(self):
        from validation import validate_enum, ValidationError
        with pytest.raises(ValidationError):
            validate_enum("extreme", "diff", ["easy", "medium", "hard"])

    def test_validate_positive_int(self):
        from validation import validate_positive_int
        assert validate_positive_int(5, "test") == 5
        assert validate_positive_int(0, "test") == 0

    def test_validate_positive_int_rejects_negative(self):
        from validation import validate_positive_int, ValidationError
        with pytest.raises(ValidationError):
            validate_positive_int(-1, "test")

    def test_validate_positive_int_rejects_over_max(self):
        from validation import validate_positive_int, ValidationError
        with pytest.raises(ValidationError):
            validate_positive_int(100000, "test")

    def test_validate_string_accepts_valid(self):
        from validation import validate_string
        assert validate_string("hello", "test") == "hello"

    def test_validate_string_rejects_too_long(self):
        from validation import validate_string, ValidationError
        with pytest.raises(ValidationError):
            validate_string("x" * 1001, "test")

    def test_validate_string_rejects_empty_when_required(self):
        from validation import validate_string, ValidationError
        with pytest.raises(ValidationError):
            validate_string("", "test", required=True)
