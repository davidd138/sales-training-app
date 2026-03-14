import sys
import os
import pytest
from decimal import Decimal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambdas', 'resolvers'))

os.environ.setdefault("SCORES_TABLE", "test-scores")
os.environ.setdefault("CONVERSATIONS_TABLE", "test-conversations")
os.environ.setdefault("USERS_TABLE", "test-users")


class TestComputeAverages:
    def test_empty_scores(self):
        from get_analytics import compute_averages
        result = compute_averages([])
        assert result == {}

    def test_single_score(self):
        from get_analytics import compute_averages
        scores = [{"overallScore": 80, "rapport": 70, "discovery": 60, "presentation": 75, "objectionHandling": 85, "closing": 90, "communication": 65}]
        result = compute_averages(scores)
        assert result["overallScore"] == 80
        assert result["rapport"] == 70
        assert result["communication"] == 65

    def test_multiple_scores_averaged(self):
        from get_analytics import compute_averages
        scores = [
            {"overallScore": 60, "rapport": 50, "discovery": 40, "presentation": 70, "objectionHandling": 60, "closing": 80, "communication": 55},
            {"overallScore": 80, "rapport": 90, "discovery": 60, "presentation": 70, "objectionHandling": 80, "closing": 70, "communication": 75},
        ]
        result = compute_averages(scores)
        assert result["overallScore"] == 70  # (60+80)/2
        assert result["rapport"] == 70  # (50+90)/2

    def test_handles_decimal_values(self):
        from get_analytics import compute_averages
        scores = [{"overallScore": Decimal("75"), "rapport": Decimal("60"), "discovery": Decimal("70"), "presentation": Decimal("65"), "objectionHandling": Decimal("80"), "closing": Decimal("55"), "communication": Decimal("70")}]
        result = compute_averages(scores)
        assert result["overallScore"] == 75

    def test_handles_missing_fields(self):
        from get_analytics import compute_averages
        scores = [{"overallScore": 80}]  # Missing individual categories
        result = compute_averages(scores)
        assert result["overallScore"] == 80
        assert result["rapport"] == 0

    def test_categories_list(self):
        from get_analytics import CATEGORIES
        assert "rapport" in CATEGORIES
        assert "discovery" in CATEGORIES
        assert "communication" in CATEGORIES
        assert len(CATEGORIES) == 6
