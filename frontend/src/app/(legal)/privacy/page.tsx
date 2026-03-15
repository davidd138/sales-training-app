import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/login"><Logo size="sm" /></Link>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Politica de Privacidad</h1>
        <p className="text-slate-400 text-sm mb-8">Ultima actualizacion: 15 de marzo de 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Responsable del tratamiento</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              El responsable del tratamiento de sus datos personales es SalesPulse AI (en adelante, "la Plataforma"),
              con domicilio en Espana. Para cualquier consulta relacionada con la proteccion de datos, puede contactarnos
              en: <span className="text-blue-400">privacidad@salespulse.ai</span>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Datos que recopilamos</h2>
            <p className="text-slate-300 text-sm leading-relaxed">Recopilamos los siguientes datos personales:</p>
            <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1">
              <li><strong>Datos de registro:</strong> nombre, direccion de correo electronico y contrasena (cifrada).</li>
              <li><strong>Datos de uso:</strong> grabaciones de voz de las sesiones de entrenamiento, transcripciones de conversaciones, puntuaciones y analisis generados por IA.</li>
              <li><strong>Datos tecnicos:</strong> direccion IP, tipo de navegador, fecha y hora de acceso.</li>
              <li><strong>Datos academicos:</strong> rendimiento en las sesiones, progreso, estadisticas de uso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Finalidad del tratamiento</h2>
            <p className="text-slate-300 text-sm leading-relaxed">Sus datos son tratados para las siguientes finalidades:</p>
            <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1">
              <li>Prestacion del servicio de entrenamiento de ventas con inteligencia artificial.</li>
              <li>Generacion de analisis y feedback personalizado sobre sus habilidades comerciales.</li>
              <li>Gestion de su cuenta de usuario y control de acceso.</li>
              <li>Elaboracion de estadisticas agregadas y anonimizadas sobre el uso de la plataforma.</li>
              <li>Comunicacion de informacion relevante sobre el servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Base legal del tratamiento</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              El tratamiento de sus datos se basa en: (a) el consentimiento que usted otorga al registrarse y aceptar
              esta politica (art. 6.1.a RGPD); (b) la ejecucion del contrato de prestacion de servicios (art. 6.1.b RGPD);
              (c) el interes legitimo del responsable en mejorar el servicio (art. 6.1.f RGPD).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Destinatarios de los datos</h2>
            <p className="text-slate-300 text-sm leading-relaxed">Sus datos pueden ser comunicados a:</p>
            <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1">
              <li><strong>Amazon Web Services (AWS):</strong> proveedor de infraestructura cloud donde se almacenan los datos. Servidores en la Union Europea (region eu-west-1, Irlanda).</li>
              <li><strong>OpenAI:</strong> proveedor de inteligencia artificial para las sesiones de voz en tiempo real. Los datos de audio se procesan temporalmente y no se almacenan de forma permanente por OpenAI.</li>
              <li><strong>Amazon Bedrock (Claude/Nova):</strong> servicio de IA para el analisis de conversaciones. Los datos se procesan en la region us-east-1 y no se utilizan para entrenar modelos.</li>
              <li><strong>Profesores/administradores:</strong> los administradores de su organizacion pueden acceder a sus puntuaciones, estadisticas y transcripciones como parte del programa de formacion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Transferencias internacionales</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Algunos de nuestros proveedores de servicios (OpenAI, Amazon Bedrock) pueden procesar datos fuera del
              Espacio Economico Europeo (EEE). Estas transferencias se realizan al amparo de clausulas contractuales
              tipo aprobadas por la Comision Europea y/o decisiones de adecuacion, garantizando un nivel adecuado de
              proteccion de datos conforme al RGPD.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Plazo de conservacion</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sus datos personales se conservaran durante el periodo en que su cuenta este activa y, posteriormente,
              durante el plazo legalmente establecido para atender posibles responsabilidades. Los datos de sesiones
              de entrenamiento se conservan mientras su cuenta permanezca activa. Una vez eliminada la cuenta, los
              datos se eliminaran en un plazo maximo de 30 dias.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Derechos del interesado</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              De acuerdo con el RGPD y la LOPDGDD, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1">
              <li><strong>Acceso:</strong> obtener confirmacion de si se estan tratando sus datos y acceder a ellos.</li>
              <li><strong>Rectificacion:</strong> solicitar la correccion de datos inexactos o incompletos.</li>
              <li><strong>Supresion:</strong> solicitar la eliminacion de sus datos cuando ya no sean necesarios.</li>
              <li><strong>Limitacion:</strong> solicitar la limitacion del tratamiento en determinadas circunstancias.</li>
              <li><strong>Portabilidad:</strong> recibir sus datos en un formato estructurado y de uso comun.</li>
              <li><strong>Oposicion:</strong> oponerse al tratamiento de sus datos por motivos relacionados con su situacion particular.</li>
            </ul>
            <p className="text-slate-300 text-sm leading-relaxed mt-2">
              Para ejercer estos derechos, contacte con nosotros en <span className="text-blue-400">privacidad@salespulse.ai</span>.
              Asimismo, tiene derecho a presentar una reclamacion ante la Agencia Espanola de Proteccion de Datos (AEPD)
              en <span className="text-blue-400">www.aepd.es</span>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Medidas de seguridad</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Implementamos medidas tecnicas y organizativas adecuadas para garantizar la seguridad de sus datos,
              incluyendo: cifrado en transito (HTTPS/TLS) y en reposo, control de acceso basado en roles,
              autenticacion segura con Amazon Cognito, registro de auditorias de acciones administrativas,
              y politicas de WAF para proteccion contra ataques.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Cookies</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Esta plataforma utiliza cookies tecnicas estrictamente necesarias para el funcionamiento del servicio
              (autenticacion, sesion de usuario). No utilizamos cookies de seguimiento, publicitarias ni de terceros.
              Para mas informacion, consulte nuestra{' '}
              <Link href="/cookies" className="text-blue-400 hover:underline">Politica de Cookies</Link>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-700/50 text-center">
          <Link href="/login" className="text-sm text-blue-400 hover:underline">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
