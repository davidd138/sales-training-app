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
        from analyze_conversation import build_analysis_prompt

        transcript = [
            {"role": "user", "text": "Hola, buenos dias"},
            {"role": "assistant", "text": "Buenos dias, digame"},
        ]
        prompt = build_analysis_prompt(transcript, None, [])

        assert "Coach Senior de Ventas" in prompt
        assert "SPIN" in prompt
        assert "rapport" in prompt
        assert "discovery" in prompt
        assert "presentation" in prompt
        assert "objectionHandling" in prompt
        assert "closing" in prompt
        assert "communication" in prompt
        assert "**COMERCIAL**: Hola, buenos dias" in prompt
        assert "**CLIENTE**: Buenos dias, digame" in prompt

    def test_prompt_with_scenario(self):
        from analyze_conversation import build_analysis_prompt

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
        prompt = build_analysis_prompt(transcript, scenario, [])

        assert "Test Scenario" in prompt
        assert "Energia" in prompt
        assert "medium" in prompt
        assert "Maria" in prompt
        assert "Esceptica" in prompt
        assert "Impresionar a la junta" in prompt

    def test_prompt_with_guidelines(self):
        from analyze_conversation import build_analysis_prompt

        transcript = [{"role": "user", "text": "Hola"}]
        guidelines = [
            {"title": "SPIN Selling", "content": "Usar preguntas SPIN"},
            {"title": "Escucha activa", "content": "Escuchar 70% del tiempo"},
        ]
        prompt = build_analysis_prompt(transcript, None, guidelines)

        assert "SPIN Selling" in prompt
        assert "Usar preguntas SPIN" in prompt
        assert "Escucha activa" in prompt

    def test_prompt_with_empty_transcript(self):
        from analyze_conversation import build_analysis_prompt

        prompt = build_analysis_prompt([], None, [])
        assert "Conversacion vacia" in prompt

    def test_prompt_difficulty_context(self):
        from analyze_conversation import build_analysis_prompt

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
            prompt = build_analysis_prompt([{"role": "user", "text": "Hola"}], scenario, [])
            assert expected_word in prompt

    def test_json_structure_in_prompt(self):
        from analyze_conversation import build_analysis_prompt

        prompt = build_analysis_prompt([{"role": "user", "text": "Hi"}], None, [])
        # The prompt should contain a JSON example with the required structure
        assert '"overallScore"' in prompt
        assert '"categories"' in prompt
        assert '"strengths"' in prompt
        assert '"improvements"' in prompt
        assert '"feedback"' in prompt
        assert '"evidence"' in prompt
        assert '"subcriteria"' in prompt
