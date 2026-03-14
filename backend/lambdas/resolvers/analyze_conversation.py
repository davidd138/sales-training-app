import os
import json
import boto3
from datetime import datetime, timezone
from validation import validate_uuid, ValidationError
from auth_helpers import check_user_access

conversations_table = boto3.resource("dynamodb").Table(os.environ["CONVERSATIONS_TABLE"])
scores_table = boto3.resource("dynamodb").Table(os.environ["SCORES_TABLE"])
guidelines_table = boto3.resource("dynamodb").Table(os.environ["GUIDELINES_TABLE"])
scenarios_table = boto3.resource("dynamodb").Table(os.environ["SCENARIOS_TABLE"])
bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "amazon.nova-micro-v1:0")


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    check_user_access(user_id)
    try:
        conv_id = validate_uuid(event.get("arguments", {}).get("conversationId", ""), "conversationId")
    except ValidationError as e:
        raise Exception(str(e))

    conv = conversations_table.get_item(Key={"id": conv_id}).get("Item")
    if not conv or conv["userId"] != user_id:
        raise Exception("Not found or unauthorized")

    transcript = conv.get("transcript", "[]")
    if isinstance(transcript, str):
        transcript = json.loads(transcript)

    scenario_id = conv.get("scenarioId", "")
    scenario = None
    if scenario_id:
        scenario = scenarios_table.get_item(Key={"id": scenario_id}).get("Item")

    guidelines_resp = guidelines_table.scan(
        FilterExpression=boto3.dynamodb.conditions.Attr("isActive").eq(True)
    )
    guidelines = guidelines_resp.get("Items", [])

    prompt = build_analysis_prompt(transcript, scenario, guidelines)

    response = bedrock.converse(
        modelId=MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 4096, "temperature": 0.3},
    )

    analysis_text = response["output"]["message"]["content"][0]["text"]
    # Strip markdown code fences if present
    if analysis_text.startswith("```"):
        lines = analysis_text.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        analysis_text = "\n".join(lines)
    analysis = json.loads(analysis_text)

    cats = analysis["categories"]
    now = datetime.now(timezone.utc).isoformat()
    score_item = {
        "conversationId": conv_id,
        "userId": user_id,
        "scenarioId": scenario_id,
        "overallScore": analysis["overallScore"],
        "rapport": cats["rapport"]["score"],
        "discovery": cats["discovery"]["score"],
        "presentation": cats["presentation"]["score"],
        "objectionHandling": cats["objectionHandling"]["score"],
        "closing": cats["closing"]["score"],
        "strengths": analysis["strengths"],
        "improvements": analysis["improvements"],
        "detailedFeedback": analysis["feedback"],
        "analyzedAt": now,
    }
    scores_table.put_item(Item=score_item)

    return score_item


def build_analysis_prompt(transcript, scenario, guidelines):
    parts = [
        "Eres un experto en formación de ventas de servicios energéticos.",
        "Analiza la siguiente conversación de práctica de venta y proporciona un scoring detallado.",
        "",
        "Responde EXCLUSIVAMENTE con un JSON válido (sin markdown, sin texto extra) con esta estructura:",
        json.dumps({
            "overallScore": 75,
            "categories": {
                "rapport": {"score": 80, "comment": "..."},
                "discovery": {"score": 70, "comment": "..."},
                "presentation": {"score": 75, "comment": "..."},
                "objectionHandling": {"score": 65, "comment": "..."},
                "closing": {"score": 80, "comment": "..."},
            },
            "strengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
            "improvements": ["Mejora 1", "Mejora 2", "Mejora 3"],
            "feedback": "Resumen general del rendimiento...",
        }, ensure_ascii=False, indent=2),
        "",
        "Categorías (0-100):",
        "- rapport: Conexión personal con el cliente",
        "- discovery: Preguntas sobre necesidades del cliente",
        "- presentation: Presentación de soluciones adecuadas",
        "- objectionHandling: Manejo de objeciones y pushback",
        "- closing: Avance y cierre de la venta",
    ]

    if scenario:
        persona = scenario.get("persona", "{}")
        if isinstance(persona, str):
            persona = json.loads(persona)
        parts.extend([
            "",
            f"ESCENARIO: {scenario.get('name', '')}",
            f"Industria: {scenario.get('industry', '')}",
            f"Dificultad: {scenario.get('difficulty', '')}",
            f"Cliente: {scenario.get('clientName', '')} - {scenario.get('clientTitle', '')}",
            f"Empresa: {scenario.get('clientCompany', '')}",
        ])
        if isinstance(persona, dict) and persona.get("personality"):
            parts.append(f"Personalidad: {persona['personality']}")

    if guidelines:
        parts.extend(["", "GUIDELINES DE VENTA:"])
        for g in guidelines:
            parts.append(f"- {g['title']}: {g['content']}")

    parts.extend(["", "TRANSCRIPCIÓN:"])
    for msg in transcript:
        role = "Comercial" if msg.get("role") == "user" else "Cliente"
        parts.append(f"{role}: {msg.get('text', '')}")

    return "\n".join(parts)
