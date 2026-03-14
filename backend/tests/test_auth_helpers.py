import sys
import os
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambdas', 'resolvers'))

os.environ.setdefault("USERS_TABLE", "test-users")
os.environ.setdefault("CONVERSATIONS_TABLE", "test-conversations")
os.environ.setdefault("SCENARIOS_TABLE", "test-scenarios")
os.environ.setdefault("SCORES_TABLE", "test-scores")
os.environ.setdefault("GUIDELINES_TABLE", "test-guidelines")


class TestCheckUserAccess:
    @patch("auth_helpers.users_table")
    def test_active_user_allowed(self, mock_table):
        mock_table.get_item.return_value = {
            "Item": {"userId": "u1", "role": "rep", "status": "active"}
        }
        from auth_helpers import check_user_access
        user = check_user_access("u1")
        assert user["status"] == "active"

    @patch("auth_helpers.users_table")
    def test_admin_always_allowed(self, mock_table):
        mock_table.get_item.return_value = {
            "Item": {"userId": "u1", "role": "admin", "status": "pending"}
        }
        from auth_helpers import check_user_access
        user = check_user_access("u1")
        assert user["role"] == "admin"

    @patch("auth_helpers.users_table")
    def test_pending_user_denied(self, mock_table):
        mock_table.get_item.return_value = {
            "Item": {"userId": "u1", "role": "rep", "status": "pending"}
        }
        from auth_helpers import check_user_access
        with pytest.raises(Exception, match="pending approval"):
            check_user_access("u1")

    @patch("auth_helpers.users_table")
    def test_suspended_user_denied(self, mock_table):
        mock_table.get_item.return_value = {
            "Item": {"userId": "u1", "role": "rep", "status": "suspended"}
        }
        from auth_helpers import check_user_access
        with pytest.raises(Exception, match="suspended"):
            check_user_access("u1")

    @patch("auth_helpers.users_table")
    def test_expired_user_denied(self, mock_table):
        mock_table.get_item.return_value = {
            "Item": {"userId": "u1", "role": "rep", "status": "expired"}
        }
        from auth_helpers import check_user_access
        with pytest.raises(Exception, match="expired"):
            check_user_access("u1")

    @patch("auth_helpers.users_table")
    def test_user_not_found_denied(self, mock_table):
        mock_table.get_item.return_value = {}
        from auth_helpers import check_user_access
        with pytest.raises(Exception, match="user not found"):
            check_user_access("u1")

    @patch("auth_helpers.users_table")
    def test_active_user_within_period(self, mock_table):
        now = datetime.now(timezone.utc)
        mock_table.get_item.return_value = {
            "Item": {
                "userId": "u1", "role": "rep", "status": "active",
                "validFrom": (now - timedelta(days=1)).isoformat(),
                "validUntil": (now + timedelta(days=30)).isoformat(),
            }
        }
        from auth_helpers import check_user_access
        user = check_user_access("u1")
        assert user["status"] == "active"

    @patch("auth_helpers.users_table")
    def test_active_user_expired_period(self, mock_table):
        now = datetime.now(timezone.utc)
        mock_table.get_item.return_value = {
            "Item": {
                "userId": "u1", "role": "rep", "status": "active",
                "validFrom": (now - timedelta(days=30)).isoformat(),
                "validUntil": (now - timedelta(days=1)).isoformat(),
            }
        }
        mock_table.update_item.return_value = {}
        from auth_helpers import check_user_access
        with pytest.raises(Exception, match="expired"):
            check_user_access("u1")
        # Should auto-expire the user
        mock_table.update_item.assert_called_once()


class TestCheckAdminAccess:
    @patch("auth_helpers.users_table")
    def test_admin_by_cognito_group(self, mock_table):
        mock_table.get_item.return_value = {
            "Item": {"userId": "u1", "role": "admin"}
        }
        from auth_helpers import check_admin_access
        event = {
            "identity": {
                "sub": "u1",
                "claims": {"cognito:groups": ["admins"]},
            }
        }
        user = check_admin_access(event)
        assert user["role"] == "admin"

    @patch("auth_helpers.users_table")
    def test_admin_by_db_role(self, mock_table):
        mock_table.get_item.return_value = {
            "Item": {"userId": "u1", "role": "admin"}
        }
        from auth_helpers import check_admin_access
        event = {
            "identity": {
                "sub": "u1",
                "claims": {},
            }
        }
        user = check_admin_access(event)
        assert user["role"] == "admin"

    @patch("auth_helpers.users_table")
    def test_non_admin_denied(self, mock_table):
        mock_table.get_item.return_value = {
            "Item": {"userId": "u1", "role": "rep"}
        }
        from auth_helpers import check_admin_access
        event = {
            "identity": {
                "sub": "u1",
                "claims": {},
            }
        }
        with pytest.raises(Exception, match="admin privileges required"):
            check_admin_access(event)

    @patch("auth_helpers.users_table")
    def test_cognito_groups_as_string(self, mock_table):
        mock_table.get_item.return_value = {
            "Item": {"userId": "u1", "role": "admin"}
        }
        from auth_helpers import check_admin_access
        event = {
            "identity": {
                "sub": "u1",
                "claims": {"cognito:groups": "admins"},
            }
        }
        user = check_admin_access(event)
        assert user["role"] == "admin"
