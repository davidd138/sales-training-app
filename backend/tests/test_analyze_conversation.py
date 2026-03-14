import sys
import os
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambdas', 'resolvers'))

os.environ.setdefault("CONVERSATIONS_TABLE", "test-conversations")
os.environ.setdefault("SCENARIOS_TABLE", "test-scenarios")
os.environ.setdefault("USERS_TABLE", "test-users")
os.environ.setdefault("SCORES_TABLE", "test-scores")
os.environ.setdefault("GUIDELINES_TABLE", "test-guidelines")


class TestBuildAnalysisPrompt:
    def test_basic_prompt_structure(self):
        from analyze_conversation import _build_system_prompt

        transcript = [
            {"role": "user", "text": "Hola, buenos dias"},
            {"role": "assistant", "text": "Buenos dias, digame"},
        ]
        prompt = _build_system_prompt(transcript, None, [], 120)

        assert "COACH SENIOR" in prompt.upper() or "coach senior" in prompt.lower()
        assert "SPIN" in prompt
        assert "rapport" in prompt
        assert "discovery" in prompt
        assert "presentation" in prompt
        assert "objectionHandling" in prompt
        assert "closing" in prompt
        assert "communication" in prompt
        assert "Hola, buenos dias" in prompt
        assert "Buenos dias, digame" in prompt

    def test_prompt_with_scenario(self):
        from analyze_conversation import _build_system_prompt

        transcript = [{"role": "user", "text": "Hola"}]
        scenario = {
            "name": "Test Scenario",
            "industry": "Energia",
            "difficulty": "medium",
            "clientName": "Maria",
            "clientTitle": "Directora",
            "clientCompany": "TestCorp",
            "persona": json.dumps({
                "personality": "Esceptica",
                "concerns": "Precio alto",
                "objectives": "Reducir costes",
                "hiddenAgenda": "Impresionar a la junta",
            }),
        }
        prompt = _build_system_prompt(transcript, scenario, [], 60)

        assert "Test Scenario" in prompt
        assert "Energia" in prompt
        assert "Maria" in prompt
        assert "Esceptica" in prompt
        assert "Impresionar a la junta" in prompt

    def test_prompt_with_guidelines(self):
        from analyze_conversation import _build_system_prompt

        transcript = [{"role": "user", "text": "Hola"}]
        guidelines = [
            {"title": "SPIN Selling", "content": "Usar preguntas SPIN"},
            {"title": "Escucha activa", "content": "Escuchar 70% del tiempo"},
        ]
        prompt = _build_system_prompt(transcript, None, guidelines, 90)

        assert "SPIN Selling" in prompt
        assert "Usar preguntas SPIN" in prompt
        assert "Escucha activa" in prompt

    def test_prompt_with_empty_transcript(self):
        from analyze_conversation import _build_system_prompt

        prompt = _build_system_prompt([], None, [], 0)
        assert "VACIA" in prompt.upper() or "vacia" in prompt.lower()

    def test_prompt_difficulty_context(self):
        from analyze_conversation import _build_system_prompt

        for difficulty, expected_word in [("easy", "FACIL"), ("medium", "MEDIO"), ("hard", "DIFICIL")]:
            scenario = {
                "name": "Test",
                "industry": "Test",
                "difficulty": difficulty,
                "clientName": "Test",
                "clientTitle": "Test",
                "clientCompany": "Test",
                "persona": "{}",
            }
            prompt = _build_system_prompt([{"role": "user", "text": "Hola"}], scenario, [], 60)
            assert expected_word in prompt

    def test_json_structure_in_prompt(self):
        from analyze_conversation import _build_system_prompt

        prompt = _build_system_prompt([{"role": "user", "text": "Hi"}], None, [], 30)
        assert '"overallScore"' in prompt
        assert '"categories"' in prompt
        assert '"strengths"' in prompt
        assert '"improvements"' in prompt
        assert '"feedback"' in prompt
        assert '"evidence"' in prompt
        assert '"subcriteria"' in prompt

    def test_category_weights(self):
        from analyze_conversation import CATEGORY_WEIGHTS

        total = sum(CATEGORY_WEIGHTS.values())
        assert abs(total - 1.0) < 0.001, f"Weights should sum to 1.0, got {total}"
        assert CATEGORY_WEIGHTS["rapport"] == 0.15
        assert CATEGORY_WEIGHTS["discovery"] == 0.25
        assert CATEGORY_WEIGHTS["presentation"] == 0.20
        assert CATEGORY_WEIGHTS["objectionHandling"] == 0.20
        assert CATEGORY_WEIGHTS["closing"] == 0.10
        assert CATEGORY_WEIGHTS["communication"] == 0.10

    def test_frameworks_mentioned(self):
        from analyze_conversation import _build_system_prompt

        prompt = _build_system_prompt([{"role": "user", "text": "Hola"}], None, [], 60)
        assert "Challenger" in prompt
        assert "Sandler" in prompt
        assert "MEDDIC" in prompt
        assert "SPIN" in prompt
