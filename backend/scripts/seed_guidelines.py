"""Seed expert default guidelines for sales analysis."""
import uuid
import boto3
from datetime import datetime, timezone

dynamodb = boto3.resource("dynamodb", region_name="eu-west-1")
table = dynamodb.Table("dev-st-guidelines")

GUIDELINES = [
    {
        "title": "Metodologia SPIN Selling",
        "content": "Evalua si el comercial sigue la secuencia SPIN: primero preguntas de Situacion (contexto actual del cliente), luego de Problema (dificultades que enfrenta), despues de Implicacion (consecuencias de no resolver el problema) y finalmente de Necesidad-Beneficio (hacer que el cliente verbalice el valor de la solucion). Un buen comercial no salta directamente a presentar sin haber completado al menos las fases S y P.",
    },
    {
        "title": "Escucha activa y ratio de habla",
        "content": "El comercial ideal habla un 30% del tiempo y escucha un 70%. Evalua si el comercial parafrasea lo que dice el cliente ('Si te entiendo bien...'), hace preguntas de seguimiento basadas en lo que el cliente acaba de decir, y no interrumpe cuando el cliente esta hablando. Penalizar fuertemente los monologos largos sin interaccion.",
    },
    {
        "title": "Propuesta de valor personalizada",
        "content": "La propuesta de valor debe estar 100% personalizada a la situacion del cliente. El comercial debe conectar cada beneficio con una necesidad especifica que el cliente haya mencionado. Evitar frases genericas como 'somos los mejores' o 'tenemos las mejores tarifas'. Valorar positivamente el uso de datos concretos, casos de exito del mismo sector, y calculos de ROI especificos para el cliente.",
    },
    {
        "title": "Manejo profesional de objeciones",
        "content": "Ante una objecion, el comercial debe: 1) Reconocer la preocupacion ('Entiendo tu preocupacion'), 2) Empatizar ('Es normal que te preguntes eso'), 3) Reencuadrar ('Lo que hemos visto con clientes similares es...'), 4) Verificar ('Con esto responderia a tu pregunta?'). Penalizar respuestas defensivas, ignorar objeciones, o presionar sin resolver la duda del cliente.",
    },
    {
        "title": "Cierre consultivo (no agresivo)",
        "content": "El cierre debe ser natural y consultivo, no presion. Valorar: cierres tentativa ('Si pudiéramos resolver X, tendria sentido para ti avanzar?'), propuestas de proximos pasos concretos ('Podriamos agendar una reunion con tu equipo el jueves?'), y resumen de acuerdos alcanzados. Penalizar cierres agresivos, crear urgencia artificial, o no intentar avanzar en absoluto.",
    },
    {
        "title": "Contexto cultural espanol",
        "content": "En el contexto de ventas B2B en Espana, valorar: la construccion de relacion personal antes de hablar de negocio (especialmente con perfiles relacionales), el uso de un tono profesional pero cercano (ni demasiado formal ni demasiado coloquial), el respeto por los procesos de decision (que en Espana suelen ser mas lentos y requieren consenso). Penalizar estilos de venta demasiado 'americanos' o agresivos que no encajan con la cultura empresarial espanola.",
    },
]


def seed():
    now = datetime.now(timezone.utc).isoformat()
    for g in GUIDELINES:
        item = {
            "id": str(uuid.uuid4()),
            "title": g["title"],
            "content": g["content"],
            "isActive": True,
            "createdBy": "system",
            "createdAt": now,
            "updatedAt": now,
        }
        table.put_item(Item=item)
        print(f"  Created: {g['title']}")
    print(f"\nDone! {len(GUIDELINES)} guidelines seeded.")


if __name__ == "__main__":
    seed()
