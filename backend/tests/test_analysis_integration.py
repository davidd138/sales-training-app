import sys
import os
import json
import pytest
from decimal import Decimal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambdas', 'resolvers'))

os.environ.setdefault("CONVERSATIONS_TABLE", "test-conversations")
os.environ.setdefault("SCENARIOS_TABLE", "test-scenarios")
os.environ.setdefault("SCORES_TABLE", "test-scores")
os.environ.setdefault("USERS_TABLE", "test-users")
os.environ.setdefault("GUIDELINES_TABLE", "test-guidelines")


class TestAnalysisPromptIntegration:
    """Test that the analysis prompt is constructed correctly with all components."""

    def _build(self, transcript=None, scenario=None, guidelines=None, duration=120):
        from analyze_conversation import _build_system_prompt
        if transcript is None:
            transcript = [
                {"role": "user", "text": "Hola, buenos dias"},
                {"role": "assistant", "text": "Buenos dias"},
            ]
        return _build_system_prompt(transcript, scenario, guidelines or [], duration)

    def test_prompt_contains_coach_identity(self):
        prompt = self._build()
        assert "Alejandro" in prompt or "coach" in prompt.lower()

    def test_prompt_contains_all_frameworks(self):
        prompt = self._build()
        assert "SPIN" in prompt
        assert "Challenger" in prompt
        assert "Sandler" in prompt
        assert "MEDDIC" in prompt

    def test_prompt_contains_all_categories(self):
        prompt = self._build()
        for cat in ["rapport", "discovery", "presentation", "objectionHandling", "closing", "communication"]:
            assert cat in prompt

    def test_prompt_contains_numbered_transcript(self):
        transcript = [
            {"role": "user", "text": "Hola"},
            {"role": "assistant", "text": "Buenos dias"},
            {"role": "user", "text": "Soy de SalesPulse"},
            {"role": "assistant", "text": "Digame"},
        ]
        prompt = self._build(transcript=transcript)
        assert "[1]" in prompt
        assert "[2]" in prompt
        assert "[3]" in prompt
        assert "[4]" in prompt
        assert "COMERCIAL" in prompt
        assert "CLIENTE" in prompt

    def test_prompt_includes_scenario_context(self):
        scenario = {
            "name": "Test Scenario",
            "industry": "Energia",
            "difficulty": "hard",
            "clientName": "Roberto",
            "clientTitle": "Director",
            "clientCompany": "TestCorp",
            "persona": json.dumps({"personality": "Brusco", "hiddenAgenda": "Quiere impresionar"}),
        }
        prompt = self._build(scenario=scenario)
        assert "Test Scenario" in prompt
        assert "Energia" in prompt
        assert "DIFICIL" in prompt
        assert "Roberto" in prompt
        assert "Brusco" in prompt
        assert "Quiere impresionar" in prompt

    def test_prompt_includes_guidelines(self):
        guidelines = [
            {"title": "Escucha activa", "content": "El comercial debe escuchar el 70% del tiempo"},
            {"title": "SPIN", "content": "Usar preguntas SPIN en cada llamada"},
        ]
        prompt = self._build(guidelines=guidelines)
        assert "Escucha activa" in prompt
        assert "70%" in prompt
        assert "SPIN" in prompt

    def test_prompt_handles_empty_transcript(self):
        prompt = self._build(transcript=[])
        assert "VACIA" in prompt.upper() or "vacia" in prompt.lower()

    def test_prompt_handles_short_transcript(self):
        prompt = self._build(transcript=[{"role": "user", "text": "Hola"}])
        assert "CORTA" in prompt.upper() or "corta" in prompt.lower() or "pocos" in prompt.lower()

    def test_prompt_includes_duration(self):
        prompt = self._build(duration=180)
        assert "3m" in prompt or "180" in prompt

    def test_prompt_difficulty_adjusts_expectations(self):
        for diff, word in [("easy", "FACIL"), ("medium", "MEDIO"), ("hard", "DIFICIL")]:
            scenario = {"name": "T", "industry": "T", "difficulty": diff,
                       "clientName": "T", "clientTitle": "T", "clientCompany": "T", "persona": "{}"}
            prompt = self._build(scenario=scenario)
            assert word in prompt

    def test_output_format_contains_json_structure(self):
        prompt = self._build()
        assert '"overallScore"' in prompt
        assert '"categories"' in prompt
        assert '"strengths"' in prompt
        assert '"improvements"' in prompt
        assert '"feedback"' in prompt
        assert '"evidence"' in prompt
        assert '"subcriteria"' in prompt

    def test_cultural_context_mentioned(self):
        prompt = self._build()
        assert "Espana" in prompt or "espanol" in prompt.lower()

    def test_prompt_contains_scoring_rubric(self):
        prompt = self._build()
        assert "90-100" in prompt
        assert "Excepcional" in prompt
        assert "CALIBRACION" in prompt or "calibracion" in prompt.lower()

    def test_prompt_contains_analysis_steps(self):
        prompt = self._build()
        assert "PASO 1" in prompt
        assert "PASO 2" in prompt
        assert "PASO 3" in prompt

    def test_prompt_with_invalid_persona_json(self):
        scenario = {"name": "T", "industry": "T", "difficulty": "easy",
                   "clientName": "T", "clientTitle": "T", "clientCompany": "T",
                   "persona": "not valid json"}
        # Should not crash
        prompt = self._build(scenario=scenario)
        assert "FACIL" in prompt


class TestScoreCalculation:
    """Test that score calculation is correct."""

    def test_weights_sum_to_one(self):
        from analyze_conversation import CATEGORY_WEIGHTS
        total = sum(CATEGORY_WEIGHTS.values())
        assert abs(total - 1.0) < 0.001

    def test_weighted_score_calculation(self):
        from analyze_conversation import CATEGORY_WEIGHTS
        scores = {"rapport": 80, "discovery": 60, "presentation": 70,
                  "objectionHandling": 50, "closing": 90, "communication": 75}
        weighted = sum(scores[k] * CATEGORY_WEIGHTS[k] for k in CATEGORY_WEIGHTS)
        # rapport: 80*0.15=12, discovery: 60*0.25=15, presentation: 70*0.20=14
        # objection: 50*0.20=10, closing: 90*0.10=9, communication: 75*0.10=7.5
        expected = 12 + 15 + 14 + 10 + 9 + 7.5  # = 67.5
        assert abs(weighted - expected) < 0.01

    def test_perfect_score(self):
        from analyze_conversation import CATEGORY_WEIGHTS
        scores = {k: 100 for k in CATEGORY_WEIGHTS}
        weighted = sum(scores[k] * CATEGORY_WEIGHTS[k] for k in CATEGORY_WEIGHTS)
        assert weighted == 100.0

    def test_zero_score(self):
        from analyze_conversation import CATEGORY_WEIGHTS
        scores = {k: 0 for k in CATEGORY_WEIGHTS}
        weighted = sum(scores[k] * CATEGORY_WEIGHTS[k] for k in CATEGORY_WEIGHTS)
        assert weighted == 0.0

    def test_all_categories_have_weights(self):
        from analyze_conversation import CATEGORY_WEIGHTS
        expected_categories = {"rapport", "discovery", "presentation",
                              "objectionHandling", "closing", "communication"}
        assert set(CATEGORY_WEIGHTS.keys()) == expected_categories


class TestModelFallback:
    """Test model fallback mechanism."""

    def test_fallback_model_is_defined(self):
        from analyze_conversation import FALLBACK_MODEL_ID
        assert FALLBACK_MODEL_ID == "amazon.nova-pro-v1:0"

    def test_model_id_default(self):
        from analyze_conversation import MODEL_ID
        assert "nova" in MODEL_ID or "claude" in MODEL_ID or "anthropic" in MODEL_ID
