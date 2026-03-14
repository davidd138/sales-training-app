"""Seed scenarios into DynamoDB after deployment."""
import json
import uuid
import boto3
from datetime import datetime, timezone

dynamodb = boto3.resource("dynamodb", region_name="eu-west-1")
table = dynamodb.Table("dev-st-scenarios")

SCENARIOS = [
    {
        "name": "FabriTech - Eficiencia energética industrial",
        "description": "María López es directora de operaciones en una empresa de manufactura. Es escéptica respecto a nuevas inversiones y necesita ver datos claros de ROI antes de considerar cualquier cambio en sus proveedores energéticos.",
        "clientName": "María López",
        "clientTitle": "Directora de Operaciones",
        "clientCompany": "FabriTech Industries",
        "industry": "Manufactura",
        "difficulty": "medium",
        "persona": json.dumps({
            "personality": "Escéptica, analítica, directa. No pierde el tiempo con promesas vagas. Quiere datos, cifras y casos de éxito concretos.",
            "concerns": "Costes de implementación, tiempo de retorno de inversión, disrupciones en la producción durante el cambio.",
            "objectives": "Reducir costes operativos un 15% y cumplir con las regulaciones medioambientales europeas de 2025.",
            "currentSituation": "Contrato actual con Endesa que expira en 6 meses. Consume 500.000 kWh/mes."
        }),
    },
    {
        "name": "Hospital San Rafael - Suministro fiable 24/7",
        "description": "Carlos Ruiz es gerente de instalaciones de un hospital grande. Su prioridad absoluta es la fiabilidad del suministro energético. Cualquier interrupción puede tener consecuencias graves para los pacientes.",
        "clientName": "Carlos Ruiz",
        "clientTitle": "Gerente de Instalaciones",
        "clientCompany": "Hospital San Rafael",
        "industry": "Sanidad",
        "difficulty": "hard",
        "persona": json.dumps({
            "personality": "Cauteloso, meticuloso, muy preocupado por la seguridad. Hace muchas preguntas técnicas. No le gustan los vendedores agresivos.",
            "concerns": "Fiabilidad 24/7 del suministro, tiempo de respuesta ante incidencias, certificaciones del proveedor, plan de contingencia.",
            "objectives": "Garantizar suministro ininterrumpido, reducir huella de carbono del hospital, modernizar sistemas de climatización.",
            "currentSituation": "Dos generadores diésel de backup. Contrato con Iberdrola. Consume 1.2M kWh/mes. Presupuesto ajustado."
        }),
    },
    {
        "name": "StartupVerde - Energía sostenible",
        "description": "Ana Martín es CEO de una startup tecnológica comprometida con la sostenibilidad. Es entusiasta y receptiva, pero su presupuesto es limitado y busca la mejor relación calidad-precio.",
        "clientName": "Ana Martín",
        "clientTitle": "CEO y Fundadora",
        "clientCompany": "StartupVerde Tech",
        "industry": "Tecnología",
        "difficulty": "easy",
        "persona": json.dumps({
            "personality": "Entusiasta, abierta, pro-sostenibilidad. Valora la innovación y la transparencia. Fácil de conectar pero exigente con los valores de la empresa proveedora.",
            "concerns": "Precio competitivo, que la energía sea 100% renovable con certificado, flexibilidad del contrato para una empresa en crecimiento.",
            "objectives": "Energía 100% verde certificada, imagen de empresa sostenible, prepararse para escalar la oficina.",
            "currentSituation": "Oficina de 30 empleados. Consume 15.000 kWh/mes. Sin contrato fijo actualmente."
        }),
    },
    {
        "name": "Hoteles Sol - ROI y ahorro en cadena hotelera",
        "description": "Pedro García es director financiero de una cadena hotelera. Solo le interesa el impacto en la cuenta de resultados. Es directo, impaciente y quiere números desde el primer momento.",
        "clientName": "Pedro García",
        "clientTitle": "Director Financiero",
        "clientCompany": "Hoteles Sol",
        "industry": "Hostelería",
        "difficulty": "medium",
        "persona": json.dumps({
            "personality": "Directo, impaciente, orientado a números. No le interesan las presentaciones bonitas, solo el impacto financiero. Interrumpe si no ve valor inmediato.",
            "concerns": "Ahorro real vs actual proveedor, penalizaciones por cambio de contrato, costes ocultos, tiempo hasta ver resultados.",
            "objectives": "Reducir factura energética un 20% en la cadena de 12 hoteles. Informar positivamente al consejo sobre sostenibilidad.",
            "currentSituation": "12 hoteles en España. Gasto energético de 3M€/año. Contratos individuales por hotel con distintos proveedores."
        }),
    },
]

def seed():
    now = datetime.now(timezone.utc).isoformat()
    for s in SCENARIOS:
        item = {
            "id": str(uuid.uuid4()),
            "createdAt": now,
            **s,
        }
        table.put_item(Item=item)
        print(f"  Created: {s['name']}")
    print(f"\nDone! {len(SCENARIOS)} scenarios seeded.")

if __name__ == "__main__":
    seed()
