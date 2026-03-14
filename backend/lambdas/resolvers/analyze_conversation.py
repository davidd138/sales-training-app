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

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")


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
        inferenceConfig={"maxTokens": 8192, "temperature": 0.2},
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
        "communication": cats.get("communication", {}).get("score", 0),
        "strengths": analysis["strengths"],
        "improvements": analysis["improvements"],
        "detailedFeedback": analysis["feedback"],
        "categoryDetails": json.dumps(cats, ensure_ascii=False),
        "analyzedAt": now,
    }
    scores_table.put_item(Item=score_item)

    return score_item


def build_analysis_prompt(transcript, scenario, guidelines):
    parts = [
        "# ROL: Coach Senior de Ventas Comerciales",
        "",
        "Eres un coach de ventas con 20+ anos de experiencia en formacion comercial B2B, ",
        "especializado en el sector energetico espanol. Has formado a cientos de comerciales ",
        "y conoces las metodologias SPIN Selling, Challenger Sale, Sandler y MEDDIC.",
        "",
        "Tu trabajo es analizar esta conversacion de practica de venta y dar feedback ",
        "detallado, constructivo y UTIL. No des feedback generico — se especifico con ",
        "citas textuales de la conversacion.",
        "",
        "# SISTEMA DE PUNTUACION",
        "",
        "Cada categoria se puntua de 0 a 100 con estos rangos:",
        "- 90-100: Excelente. Demuestra dominio profesional de la tecnica.",
        "- 70-89: Bueno. Tecnica correcta con areas de mejora concretas.",
        "- 50-69: Mejorable. Se intenta pero falla en ejecucion o consistencia.",
        "- 30-49: Deficiente. Errores significativos o ausencia de la tecnica.",
        "- 0-29: Critico. No se demuestra la competencia.",
        "",
        "# CATEGORIAS DE EVALUACION",
        "",
        "## 1. Apertura y Rapport (peso: 15%)",
        "Evalua la primera impresion y la construccion de confianza inicial:",
        "- Presentacion profesional y clara de quien es y por que llama",
        "- Busqueda de puntos en comun o referencias personalizadas",
        "- Adaptacion al tono y energia del cliente",
        "- Creacion de un ambiente de conversacion (no interrogatorio)",
        "- Uso del nombre del cliente de forma natural",
        "Penalizar: Ir directamente al pitch sin rapport, sonar robotico o leido",
        "",
        "## 2. Descubrimiento de Necesidades / SPIN (peso: 25%)",
        "Esta es la categoria MAS IMPORTANTE. Evalua la calidad del descubrimiento:",
        "- Preguntas de SITUACION: Entender contexto actual del cliente",
        "- Preguntas de PROBLEMA: Identificar dolor o insatisfaccion",
        "- Preguntas de IMPLICACION: Profundizar en consecuencias del problema",
        "- Preguntas de NECESIDAD-BENEFICIO: Hacer que el cliente verbalice el valor",
        "- Escucha activa: Parafrasear, resumir, preguntas de seguimiento",
        "- NO interrumpir al cliente cuando esta hablando",
        "Penalizar fuertemente: Asumir necesidades sin preguntar, monologar sin escuchar",
        "",
        "## 3. Propuesta de Valor y Presentacion (peso: 20%)",
        "Evalua como presenta la solucion:",
        "- Alineacion solucion-necesidad: Solo presenta lo que el cliente necesita",
        "- Beneficios vs caracteristicas: Habla de resultados, no de specs",
        "- Casos de exito y datos concretos: ROI, porcentajes, testimonios",
        "- Personalizacion: Adapta el mensaje al sector/tamano/situacion del cliente",
        "- Diferenciacion: Explica por que su oferta es mejor que alternativas",
        "Penalizar: Vomitar catalogo de productos, pitch generico no personalizado",
        "",
        "## 4. Manejo de Objeciones (peso: 20%)",
        "Evalua la respuesta a resistencia del cliente:",
        "- Reconocimiento: Valida la preocupacion del cliente (no la ignora)",
        "- Empatia: Muestra que entiende la posicion del cliente",
        "- Reencuadre: Convierte la objecion en oportunidad de profundizar",
        "- Evidencia: Usa datos, casos reales o garantias para resolver",
        "- Verificacion: Confirma que la objecion esta resuelta",
        "Penalizar: Ponerse a la defensiva, ignorar objeciones, presionar sin resolver",
        "",
        "## 5. Cierre y Proximos Pasos (peso: 10%)",
        "Evalua el avance hacia el cierre:",
        "- Cierres tentativa: Prueba el terreno (\"Si resolviéramos X, tendria sentido...?\")",
        "- Compromiso concreto: Propone proximos pasos especificos",
        "- Urgencia natural: Crea motivacion sin presion artificial",
        "- Resumen de acuerdos: Recapitula lo hablado y los proximos pasos",
        "Penalizar: No intentar avanzar, presion agresiva, dejar la conversacion sin cierre",
        "",
        "## 6. Habilidades de Comunicacion (peso: 10%)",
        "Evalua la calidad comunicativa general:",
        "- Claridad y concision: Mensajes directos sin rodeos innecesarios",
        "- Confianza: Tono seguro sin arrogancia",
        "- Vocabulario profesional: Lenguaje adecuado al interlocutor",
        "- Ritmo: Equilibrio entre hablar y escuchar (idealmente 30/70)",
        "- Adaptabilidad: Ajusta su estilo al del cliente",
        "Penalizar: Muletillas excesivas, monologos largos, lenguaje demasiado tecnico o coloquial",
    ]

    if scenario:
        persona = scenario.get("persona", "{}")
        if isinstance(persona, str):
            try:
                persona = json.loads(persona)
            except json.JSONDecodeError:
                persona = {}

        difficulty_context = {
            "easy": "FACIL - El cliente es receptivo. Se espera un rendimiento alto (70+) en todas las categorias.",
            "medium": "MEDIO - El cliente presenta resistencia moderada. Un 60+ es aceptable, 80+ excelente.",
            "hard": "DIFICIL - El cliente es muy resistente. Un 50+ es aceptable, 70+ es excelente. Se mas indulgente.",
        }

        parts.extend([
            "",
            "# CONTEXTO DEL ESCENARIO",
            f"Escenario: {scenario.get('name', '')}",
            f"Dificultad: {scenario.get('difficulty', '')} — {difficulty_context.get(scenario.get('difficulty', ''), '')}",
            f"Industria: {scenario.get('industry', '')}",
            f"Cliente: {scenario.get('clientName', '')} — {scenario.get('clientTitle', '')}",
            f"Empresa: {scenario.get('clientCompany', '')}",
        ])
        if isinstance(persona, dict):
            if persona.get("personality"):
                parts.append(f"Personalidad del cliente: {persona['personality']}")
            if persona.get("concerns"):
                parts.append(f"Preocupaciones del cliente: {persona['concerns']}")
            if persona.get("objectives"):
                parts.append(f"Objetivos del cliente: {persona['objectives']}")
            if persona.get("hiddenAgenda"):
                parts.append(f"Agenda oculta (el comercial no deberia saber esto): {persona['hiddenAgenda']}")

    if guidelines:
        parts.extend(["", "# CRITERIOS ADICIONALES DEL PROFESOR"])
        for g in guidelines:
            parts.append(f"- **{g['title']}**: {g['content']}")

    parts.extend(["", "# TRANSCRIPCION DE LA CONVERSACION", ""])
    if not transcript:
        parts.append("[Conversacion vacia - no se puede evaluar]")
    else:
        for msg in transcript:
            role = "COMERCIAL" if msg.get("role") == "user" else "CLIENTE"
            parts.append(f"**{role}**: {msg.get('text', '')}")

    parts.extend([
        "",
        "# INSTRUCCIONES DE RESPUESTA",
        "",
        "Responde EXCLUSIVAMENTE con un JSON valido (sin markdown, sin texto extra).",
        "Usa esta estructura exacta:",
        "",
        json.dumps({
            "overallScore": 65,
            "categories": {
                "rapport": {
                    "score": 70,
                    "comment": "Buena presentacion inicial pero fue directo al producto sin buscar puntos en comun.",
                    "evidence": "\"Hola, le llamo de EnergiaX\" - Falta personalizacion.",
                    "subcriteria": {
                        "presentacion": 80,
                        "conexionPersonal": 50,
                        "adaptacionTono": 75,
                    }
                },
                "discovery": {
                    "score": 55,
                    "comment": "Pocas preguntas de descubrimiento. Solo una pregunta de situacion, ninguna de implicacion.",
                    "evidence": "Solo pregunto \"que proveedor tienen ahora?\" sin profundizar en problemas.",
                    "subcriteria": {
                        "preguntasSituacion": 70,
                        "preguntasProblema": 40,
                        "preguntasImplicacion": 20,
                        "escuchaActiva": 60,
                    }
                },
                "presentation": {
                    "score": 60,
                    "comment": "Presentacion correcta pero generica. No conecto beneficios con necesidades especificas del cliente.",
                    "evidence": "\"Ofrecemos las mejores tarifas\" - afirmacion generica sin datos.",
                    "subcriteria": {
                        "alineacionNecesidad": 50,
                        "beneficiosVsCaracteristicas": 60,
                        "datosConcretos": 55,
                        "personalizacion": 45,
                    }
                },
                "objectionHandling": {
                    "score": 65,
                    "comment": "Reconocio la objecion de precio pero no la resolvio completamente.",
                    "evidence": "\"Entiendo su preocupacion\" - buen reconocimiento, pero falta evidencia de resolucion.",
                    "subcriteria": {
                        "reconocimiento": 80,
                        "empatia": 70,
                        "reencuadre": 50,
                        "evidencia": 55,
                    }
                },
                "closing": {
                    "score": 70,
                    "comment": "Propuso una reunion de seguimiento, bien. Falta compromiso mas concreto.",
                    "evidence": "\"Podriamos quedar la semana que viene?\" - buena iniciativa.",
                    "subcriteria": {
                        "cierreTentativa": 65,
                        "compromisoConcreto": 70,
                        "resumenAcuerdos": 60,
                    }
                },
                "communication": {
                    "score": 72,
                    "comment": "Comunicacion clara y profesional. Buen ritmo general.",
                    "evidence": "Buen equilibrio hablar/escuchar en la primera mitad.",
                    "subcriteria": {
                        "claridad": 75,
                        "confianza": 70,
                        "ritmo": 68,
                        "adaptabilidad": 72,
                    }
                },
            },
            "strengths": [
                "Buena presentacion inicial profesional y directa",
                "Reconocimiento adecuado de las objeciones del cliente",
                "Propuesta de proximos pasos concretos al final",
            ],
            "improvements": [
                "CRITICO: Hacer MAS preguntas de descubrimiento antes de presentar la solucion. Usar el modelo SPIN.",
                "Personalizar la propuesta de valor con datos especificos del sector del cliente",
                "Buscar conexion personal al inicio para generar confianza antes de hablar de negocio",
            ],
            "feedback": "Feedback general detallado del coach..."
        }, ensure_ascii=False, indent=2),
        "",
        "IMPORTANTE:",
        "- El overallScore es la media ponderada: rapport*0.15 + discovery*0.25 + presentation*0.20 + objectionHandling*0.20 + closing*0.10 + communication*0.10",
        "- Cada 'evidence' debe incluir una cita TEXTUAL de la transcripcion",
        "- Los 'improvements' deben ser ACCIONABLES y ESPECIFICOS, no genericos",
        "- El 'feedback' debe ser 3-5 frases como un coach senior hablando directamente al comercial",
        "- Si la transcripcion esta vacia o es muy corta, da puntuaciones bajas y explica por que",
        "- Responde en espanol de Espana",
    ])

    return "\n".join(parts)
