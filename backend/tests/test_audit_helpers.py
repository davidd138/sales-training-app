import sys
import os
import json
import pytest
from io import StringIO

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambdas', 'resolvers'))

os.environ.setdefault("USERS_TABLE", "test-users")


class TestAuditHelpers:
    def test_log_admin_action_basic(self, capsys):
        from audit_helpers import log_admin_action

        log_admin_action("admin-123", "UPDATE_USER_STATUS", "user-456")
        captured = capsys.readouterr()
        log_entry = json.loads(captured.out.strip())

        assert log_entry["type"] == "ADMIN_AUDIT"
        assert log_entry["adminUserId"] == "admin-123"
        assert log_entry["action"] == "UPDATE_USER_STATUS"
        assert log_entry["targetId"] == "user-456"
        assert "timestamp" in log_entry

    def test_log_admin_action_with_details(self, capsys):
        from audit_helpers import log_admin_action

        log_admin_action("admin-123", "CREATE_SCENARIO", "scenario-789", {"name": "Test"})
        captured = capsys.readouterr()
        log_entry = json.loads(captured.out.strip())

        assert log_entry["details"] == {"name": "Test"}

    def test_log_admin_action_without_details(self, capsys):
        from audit_helpers import log_admin_action

        log_admin_action("admin-123", "DELETE_SCENARIO", "scenario-789")
        captured = capsys.readouterr()
        log_entry = json.loads(captured.out.strip())

        assert "details" not in log_entry

    def test_log_produces_valid_json(self, capsys):
        from audit_helpers import log_admin_action

        log_admin_action("admin", "ACTION", "target", {"key": "value with spaces"})
        captured = capsys.readouterr()
        # Should not raise
        parsed = json.loads(captured.out.strip())
        assert isinstance(parsed, dict)
