"""Seed expert default guidelines for sales analysis."""
import uuid
import boto3
from datetime import datetime, timezone

dynamodb = boto3.resource("dynamodb", region_name="eu-west-1")
table = dynamodb.Table("dev-st-guidelines")

GUIDELINES = [
    {
        "title": "Metodologia SPIN Selling",
        "content": (
            "El metodo SPIN estructura la conversacion comercial en cuatro fases de preguntas que guian al cliente "
            "desde su situacion actual hasta la verbalizacion de la necesidad de cambio.\n\n"
            "**Preguntas de Situacion (S):** Recogen datos objetivos sobre el contexto del cliente. "
            "Ejemplos en el sector energetico: "
            "'Cual es vuestro consumo mensual aproximado en kWh?', "
            "'Teneis actualmente contratada alguna tarifa con discriminacion horaria?', "
            "'Cuantos puntos de suministro gestionais en total?', "
            "'Cuando fue la ultima vez que revisasteis las condiciones de vuestro contrato energetico?'. "
            "No abusar de estas preguntas; limitar a 3-4 para no convertir la llamada en un interrogatorio.\n\n"
            "**Preguntas de Problema (P):** Identifican dificultades y frustraciones. "
            "Ejemplos: 'Habeis notado subidas inesperadas en la factura en los ultimos meses?', "
            "'Os resulta dificil prever el gasto energetico trimestral para vuestro presupuesto?', "
            "'Habeis tenido problemas con penalizaciones por exceso de potencia contratada?'. "
            "Estas preguntas deben surgir de forma natural a partir de las respuestas de situacion.\n\n"
            "**Preguntas de Implicacion (I):** Amplifican la gravedad del problema. "
            "Ejemplos: 'Si esas subidas continuan, como afectaria eso a vuestro margen operativo este ano?', "
            "'Que impacto tiene esa falta de previsibilidad cuando presentais el presupuesto a direccion?', "
            "'Cuanto os ha costado en penalizaciones durante los ultimos 12 meses?'. "
            "Es la fase mas importante: hace que el cliente sienta la urgencia sin que el comercial la imponga.\n\n"
            "**Preguntas de Necesidad-Beneficio (N):** Hacen que el cliente verbalice el valor de resolver el problema. "
            "Ejemplos: 'Si pudierais tener un precio fijo garantizado, como simplificaria eso vuestra planificacion?', "
            "'Que significaria para vosotros reducir un 15% el coste energetico anual?', "
            "'Si eliminaseis esas penalizaciones, a que podriais destinar ese presupuesto?'. "
            "El comercial que domina SPIN nunca presenta la solucion antes de que el cliente haya expresado la necesidad."
        ),
    },
    {
        "title": "Gap Selling: Identificar la Brecha",
        "content": (
            "Gap Selling se centra en cuantificar la distancia entre el estado actual del cliente y el estado futuro "
            "deseado. El comercial debe actuar como diagnosticador, no como presentador de productos.\n\n"
            "**Paso 1: Mapear el estado actual.** Documentar con datos concretos la situacion presente: "
            "'Actualmente estais pagando 0,18 euros/kWh con una tarifa indexada, lo que os supone unos 4.200 euros "
            "mensuales con vuestro consumo de 23.000 kWh'. Utilizar las facturas reales del cliente siempre que sea posible.\n\n"
            "**Paso 2: Definir el estado futuro deseado.** Ayudar al cliente a visualizar como seria su situacion ideal: "
            "'Con una tarifa fija optimizada a vuestro perfil de consumo, podriamos situaros en torno a 0,15 euros/kWh, "
            "lo que representaria unos 3.450 euros mensuales'.\n\n"
            "**Paso 3: Cuantificar la brecha.** Expresar la diferencia en terminos tangibles y acumulativos: "
            "'Esa diferencia de 750 euros al mes supone 9.000 euros al ano que estais dejando de ahorrar. "
            "En los tres anos de contrato, hablamos de 27.000 euros'. Siempre proyectar a periodos largos para maximizar "
            "el impacto emocional del numero.\n\n"
            "**Paso 4: Identificar el coste de la inaccion.** Preguntar: 'Cada mes que pasa sin optimizar la tarifa, "
            "son 750 euros que no recuperais. Si tardamos dos meses en implementar el cambio, ya son 1.500 euros "
            "de ahorro perdido. Tiene sentido esperar?'.\n\n"
            "**Tecnicas de cuantificacion avanzada:** Incluir costes ocultos como penalizaciones por reactiva, "
            "excesos de potencia, y el tiempo que el equipo administrativo dedica a gestionar incidencias con la "
            "comercializadora actual. Preguntar: 'Cuantas horas al mes dedica alguien de tu equipo a revisar "
            "facturas o reclamar errores? Si valoramos esa hora a 25 euros, son X euros adicionales que se suman "
            "a la brecha'. El objetivo es que la brecha sea tan grande que no actuar resulte irracional."
        ),
    },
    {
        "title": "Manejo de Objeciones con Feel-Felt-Found",
        "content": (
            "La tecnica Feel-Felt-Found (Sentir-Sintieron-Descubrieron) neutraliza objeciones conectando emocionalmente "
            "con el cliente antes de aportar evidencia. Nunca discutir ni contradecir directamente.\n\n"
            "**Estructura en tres pasos:**\n"
            "1. **Siento (Feel):** Validar la emocion. 'Entiendo perfectamente que te preocupe eso.'\n"
            "2. **Sintieron (Felt):** Normalizar con terceros. 'Otros clientes del sector industrial sintieron exactamente lo mismo.'\n"
            "3. **Descubrieron (Found):** Aportar la solucion. 'Lo que descubrieron fue que...'\n\n"
            "**Objecion 1: 'Ya tenemos un contrato en vigor.'**\n"
            "'Entiendo, es logico querer respetar los compromisos. Muchos de nuestros clientes actuales estaban en la "
            "misma situacion. Lo que descubrieron es que podemos analizar su contrato sin compromiso y dejar preparada "
            "la mejor oferta para cuando venza, asi no pierden ni un dia pagando de mas. Cuando os vence el actual?'\n\n"
            "**Objecion 2: 'Vuestros precios no son los mas bajos.'**\n"
            "'Comprendo que el precio sea un factor clave. Otros directores financieros nos dijeron lo mismo al principio. "
            "Lo que encontraron es que el coste total incluye penalizaciones, servicio postventa y estabilidad de precio, "
            "y ahi es donde nuestra propuesta realmente destaca. Puedo desglosartelo?'\n\n"
            "**Objecion 3: 'Necesito consultarlo con mi socio/jefe.'**\n"
            "'Por supuesto, una decision asi debe tomarse en equipo. Otros responsables nos comentaron lo mismo. "
            "Lo que les funciono fue que les preparasemos un resumen ejecutivo de una pagina con los numeros clave "
            "para facilitar esa conversacion. Te lo preparo y agendamos una llamada a tres la proxima semana?'\n\n"
            "**Objecion 4: 'Ya me han llamado muchas comercializadoras.'**\n"
            "'Lo imagino, el sector esta muy activo. Muchos de nuestros mejores clientes nos dijeron exactamente eso "
            "en la primera llamada. Lo que descubrieron es que dedicar 5 minutos a comparar les ahorro miles de euros "
            "al ano. Solo te pido esos 5 minutos, y si no ves valor, me despido sin insistir.'\n\n"
            "**Objecion 5: 'No tengo tiempo ahora.'**\n"
            "'Totalmente comprensible, se que estais muy ocupados. Otros gerentes en tu situacion sentian lo mismo. "
            "Lo que encontraron util fue una llamada de 10 minutos en un horario comodo, sin compromiso, donde les "
            "dabamos un diagnostico rapido de ahorro. Que tal el jueves a las 9:30 antes de que empiece la actividad del dia?'"
        ),
    },
    {
        "title": "Cierre Consultivo: El Arte de No Presionar",
        "content": (
            "El cierre consultivo se basa en guiar al cliente hacia la decision de forma natural, sin tacticas de presion. "
            "El objetivo es que el cliente sienta que decidir es el siguiente paso logico, no una imposicion.\n\n"
            "**Cierres tentativos (Trial Closes):** Son preguntas que miden la temperatura sin pedir compromiso firme. "
            "Usar a lo largo de toda la conversacion, no solo al final: "
            "'Si pudieramos garantizarte ese precio fijo durante 3 anos, seria algo que encajaria con lo que buscais?', "
            "'En principio, te parece que vamos por buen camino?', "
            "'De lo que hemos hablado hasta ahora, que es lo que mas valor te aporta?'. "
            "Si la respuesta es positiva, avanzar. Si es tibia, explorar que falta.\n\n"
            "**Commitment Laddering (Escalera de compromisos):** Pedir micro-compromisos que construyan momentum: "
            "Paso 1: 'Me permites hacerte unas preguntas sobre vuestra situacion actual?' "
            "Paso 2: 'Podrias compartirme una factura reciente para hacer un analisis personalizado?' "
            "Paso 3: 'Te parece bien que prepare una propuesta con los numeros que hemos comentado?' "
            "Paso 4: 'Podemos agendar una llamada la semana que viene para revisar la propuesta juntos?' "
            "Paso 5: 'Si los numeros encajan, podriamos formalizar el cambio esta misma semana?'. "
            "Cada 'si' hace que el siguiente sea mas natural.\n\n"
            "**Proximos pasos concretos:** Nunca terminar una llamada sin un siguiente paso con fecha y hora especificos. "
            "Mal: 'Ya te llamare para ver que tal'. Bien: 'Quedo en enviarte la propuesta manana antes de las 12 y "
            "te llamo el jueves 14 a las 10:00 para revisarla juntos. Te viene bien?'. "
            "Siempre confirmar el canal de contacto: 'Te envio la propuesta al email que me has dado o prefieres WhatsApp?'.\n\n"
            "**Tecnica del resumen de acuerdos:** Antes de cerrar, resumir todo lo acordado: "
            "'Entonces, recapitulando: vamos a analizar vuestras ultimas 3 facturas, preparo una propuesta de tarifa fija "
            "a 36 meses, y el jueves lo revisamos juntos. Correcto?'. Esto refuerza el compromiso y evita malentendidos."
        ),
    },
    {
        "title": "Escucha Activa y Ratio 30/70",
        "content": (
            "El comercial excelente habla como maximo un 30% del tiempo y dedica el 70% restante a escuchar activamente. "
            "Escuchar no es simplemente estar callado; es un proceso activo que demuestra interes genuino y extrae "
            "informacion valiosa para personalizar la propuesta.\n\n"
            "**Tecnicas de escucha activa:**\n\n"
            "**1. Parafraseo:** Repetir con tus propias palabras lo que el cliente ha dicho para confirmar comprension. "
            "'Si te entiendo bien, lo que mas os preocupa es la incertidumbre del precio, no tanto el importe actual. "
            "Es asi?'. El parafraseo tiene un doble efecto: confirma que has entendido y hace que el cliente se sienta "
            "escuchado y valorado.\n\n"
            "**2. Preguntas de seguimiento:** Basarse en lo que el cliente acaba de decir, no en un guion predeterminado. "
            "Si el cliente dice 'tuvimos un pico de consumo el verano pasado', preguntar: 'Que lo causo? Fue algo "
            "puntual o esperais que se repita?'. Esto demuestra que realmente estas escuchando, no esperando tu turno "
            "para hablar.\n\n"
            "**3. El poder del silencio:** Despues de hacer una pregunta importante, resistir la tentacion de llenar "
            "el silencio. Contar mentalmente hasta 5 antes de hablar. El cliente a menudo anade informacion crucial "
            "en esos segundos de pausa: 'Bueno, la verdad es que tambien estamos pensando en instalar placas solares...'. "
            "Esa informacion solo sale si le das espacio.\n\n"
            "**4. Resumenes periodicos:** Cada 5-7 minutos, hacer un mini-resumen: 'Dejame asegurarme de que lo tengo: "
            "teneis 3 puntos de suministro, el contrato os vence en septiembre, y vuestra prioridad es estabilidad de "
            "precio. Me dejo algo?'. Esto estructura la conversacion y mantiene al cliente involucrado.\n\n"
            "**5. Toma de notas audible:** Decir 'espera que apunto esto porque es importante' transmite que valoras "
            "lo que el cliente dice. Es una senal de respeto que construye confianza.\n\n"
            "**Senales de alerta (penalizar):** Monologos de mas de 60 segundos, interrumpir al cliente, ignorar "
            "lo que el cliente acaba de decir para seguir con el guion, hacer preguntas cuya respuesta el cliente ya "
            "ha dado. Un comercial que habla mas del 50% del tiempo esta vendiendo, no consultando."
        ),
    },
    {
        "title": "Contrato Previo (Sandler Upfront Contract)",
        "content": (
            "El Contrato Previo es un acuerdo verbal al inicio de la llamada que establece expectativas claras para ambas "
            "partes. Elimina la incomodidad del final de la llamada y da control profesional a la conversacion. "
            "Basado en la metodologia Sandler, tiene cinco componentes esenciales.\n\n"
            "**1. Agradecimiento y contexto:** 'Gracias por atenderme, [nombre]. Se que tu tiempo es valioso y quiero "
            "aprovecharlo bien.'\n\n"
            "**2. Proposito de la llamada:** 'El motivo de mi llamada es entender vuestra situacion energetica actual "
            "y ver si hay alguna forma en la que podamos ayudaros a optimizar costes. No vengo a venderte nada hoy.'\n\n"
            "**3. Tiempo acordado:** 'Para esto necesitaria unos 10-12 minutos. Dispones de ese tiempo ahora o "
            "prefieres que lo agendemos para otro momento que te venga mejor?'. Respetar el tiempo acordado genera "
            "confianza inmediata.\n\n"
            "**4. Agenda de la conversacion:** 'Lo que me gustaria hacer es: primero, hacerte unas preguntas para "
            "entender vuestra situacion; despues, si veo que hay margen de mejora, compartirte algunas ideas. "
            "Y al final, decidimos juntos si tiene sentido seguir hablando o no. Te parece bien?'\n\n"
            "**5. Derecho a decir no:** Este es el componente mas poderoso. 'Al final de la llamada, si no ves valor "
            "en lo que te propongo, puedes decirme que no sin ningun problema. Y si yo veo que no somos la mejor "
            "opcion para vosotros, tambien te lo dire con total honestidad. Justo?'. "
            "Esto reduce la resistencia del cliente drasticamente porque elimina la presion.\n\n"
            "**Plantilla completa de apertura:**\n"
            "'Buenos dias, [nombre]. Soy [tu nombre] de [empresa]. Gracias por coger la llamada. El motivo por el que "
            "te contacto es que trabajamos con empresas del sector [X] ayudandoles a optimizar su gasto energetico, "
            "y me gustaria entender si hay algo en lo que podamos aportar valor. Necesitaria unos 10 minutos de tu "
            "tiempo. Lo que hare es hacerte unas preguntas, y al final, si ambos vemos que tiene sentido, hablamos de "
            "siguientes pasos. Si no, sin ningun compromiso. Te parece bien que arranquemos?'\n\n"
            "**Beneficios medibles:** Los comerciales que usan Contrato Previo reportan un 40% menos de objeciones al "
            "cierre, porque las expectativas ya estan claras desde el minuto uno. Ademas, el cliente respeta mas tu "
            "tiempo y se involucra activamente en la conversacion."
        ),
    },
    {
        "title": "Tecnica Challenger: Ensenar al Cliente",
        "content": (
            "El comercial Challenger no se limita a preguntar y escuchar: aporta perspectivas nuevas que hacen al "
            "cliente replantearse su forma de pensar. Ensena, adapta y toma el control de la conversacion con datos "
            "y conocimiento experto.\n\n"
            "**Principio fundamental:** El cliente no siempre sabe lo que necesita. Tu trabajo es mostrarle riesgos "
            "y oportunidades que no ha considerado. Esto te posiciona como asesor, no como vendedor.\n\n"
            "**Insights del mercado energetico espanol para compartir:**\n\n"
            "'Sabias que el 68% de las pymes en Espana estan pagando entre un 15% y un 25% mas de lo necesario en su "
            "factura electrica simplemente por tener una potencia contratada mal dimensionada?'\n\n"
            "'Segun los datos de Red Electrica de Espana, las tarifas indexadas al pool han tenido una volatilidad "
            "del 40% interanual en los ultimos 3 anos. Eso significa que tu presupuesto energetico es basicamente "
            "una incognita cada trimestre.'\n\n"
            "'Con la nueva regulacion de autoconsumo compartido, las comunidades energeticas permiten reducciones "
            "de hasta el 30% sin necesidad de instalar paneles en tu propio tejado. La mayoria de empresas aun no "
            "lo sabe.'\n\n"
            "'El mercado de PPAs (Power Purchase Agreements) en Espana ha crecido un 200% en 2024. Las empresas "
            "que estan bloqueando precios a largo plazo ahora estan consiguiendo condiciones que probablemente no "
            "estaran disponibles en 12 meses.'\n\n"
            "**Como presentar un insight (estructura Commercial Teaching):**\n"
            "1. **El calentamiento:** Conectar con un problema conocido del cliente. 'Muchas empresas de tu sector "
            "me comentan que la factura energetica es cada vez mas impredecible.'\n"
            "2. **El reencuadre:** Introducir una perspectiva nueva. 'Lo que la mayoria no sabe es que el problema "
            "no es solo el precio del kWh, sino como esta estructurado el contrato.'\n"
            "3. **La evidencia:** Aportar datos concretos. 'En un analisis que hicimos a 50 empresas de tu tamano, "
            "el 72% tenia penalizaciones por reactiva que podrian eliminarse con un simple ajuste.'\n"
            "4. **El impacto emocional:** Hacer que el numero sea tangible. 'Hablamos de 3.000-5.000 euros al ano "
            "que se van literalmente por un cable.'\n"
            "5. **La solucion:** Conectar con tu oferta. 'Nosotros incluimos la optimizacion de reactiva sin coste "
            "adicional en todos nuestros contratos.'\n\n"
            "**Clave:** Nunca ensenar de forma condescendiente. El tono debe ser de colaboracion: 'He visto esto en "
            "muchas empresas y quiero asegurarme de que no os pase a vosotros'."
        ),
    },
    {
        "title": "Cualificacion MEDDIC para Ventas Complejas",
        "content": (
            "MEDDIC es el framework de cualificacion mas efectivo para ventas B2B complejas. Cada letra representa "
            "un elemento critico que el comercial debe descubrir para evaluar si la oportunidad es real y como avanzarla.\n\n"
            "**M - Metrics (Metricas):** Cuantificar el impacto economico para el cliente. "
            "Preguntar: 'Cual es vuestro gasto energetico anual total?', 'Que porcentaje de vuestros costes operativos "
            "representa la energia?', 'Cuanto os costaria un paro de produccion por un corte de suministro?'. "
            "Sin metricas claras, no puedes construir un caso de negocio convincente.\n\n"
            "**E - Economic Buyer (Comprador Economico):** Identificar quien firma y aprueba el gasto. "
            "En pymes es normalmente el gerente o el director financiero. Preguntar con tacto: "
            "'Ademas de ti, quien mas participa en este tipo de decisiones?', 'Como funciona el proceso de aprobacion "
            "para cambiar de proveedor energetico en vuestra empresa?'. Si no llegas al comprador economico, tu "
            "propuesta se quedara en un cajon.\n\n"
            "**D - Decision Criteria (Criterios de Decision):** Descubrir que factores pesaran en la decision. "
            "'Que es lo mas importante para vosotros al elegir comercializadora: precio, estabilidad, servicio, "
            "sostenibilidad?', 'Hay algun requisito que si o si debe cumplir cualquier propuesta que valoreis?'. "
            "Adaptar tu propuesta a estos criterios, no al reves.\n\n"
            "**D - Decision Process (Proceso de Decision):** Mapear los pasos internos hasta la firma. "
            "'Cuando seria el momento ideal para hacer este cambio?', 'Necesitais aprobacion del consejo o "
            "comite de direccion?', 'Habeis definido ya un calendario para revisar proveedores?'. "
            "Conocer el proceso te permite planificar tu seguimiento y no presionar en el momento equivocado.\n\n"
            "**I - Identify Pain (Identificar el Dolor):** Encontrar el problema urgente que motiva el cambio. "
            "'Que es lo que mas os frustra de vuestra situacion energetica actual?', 'Ha pasado algo recientemente "
            "que os haya hecho plantearos un cambio?'. Sin dolor real, no hay urgencia, y sin urgencia, no hay venta.\n\n"
            "**C - Champion (Campeon interno):** Encontrar a alguien dentro de la empresa que defienda tu solucion. "
            "'Quien en vuestra organizacion esta mas interesado en optimizar los costes energeticos?', "
            "'Hay alguien en tu equipo que ya haya investigado opciones?'. Tu campeon te dara informacion interna, "
            "te avisara de obstaculos y vendera por ti cuando no estes en la sala.\n\n"
            "**Puntuacion de cualificacion:** Evaluar cada elemento del 1 al 3. Si la oportunidad puntua menos de "
            "12 sobre 18, no esta suficientemente cualificada para invertir tiempo en una propuesta formal. "
            "Es mejor cualificar bien 10 oportunidades que perseguir 30 sin cualificar."
        ),
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
