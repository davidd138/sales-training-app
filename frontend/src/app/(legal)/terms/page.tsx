import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/login"><Logo size="sm" /></Link>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Terminos y Condiciones de Uso</h1>
        <p className="text-slate-400 text-sm mb-8">Ultima actualizacion: 15 de marzo de 2026</p>

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Objeto</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Los presentes Terminos y Condiciones regulan el acceso y uso de la plataforma SalesPulse AI,
              un servicio de entrenamiento de habilidades comerciales mediante inteligencia artificial.
              El acceso a la plataforma esta condicionado a la aprobacion previa por un administrador autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Registro y acceso</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              El usuario se compromete a proporcionar informacion veraz y actualizada durante el registro.
              El acceso a la plataforma requiere la aprobacion de un administrador y puede estar sujeto a
              un periodo de validez determinado. El usuario es responsable de mantener la confidencialidad
              de sus credenciales de acceso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Uso del servicio</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              El servicio esta destinado exclusivamente a fines de formacion comercial. El usuario se compromete a
              hacer un uso adecuado de la plataforma, absteniendose de utilizar el servicio para fines distintos
              a los previstos o de intentar acceder a funcionalidades no autorizadas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Propiedad intelectual</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Todos los contenidos de la plataforma, incluyendo los escenarios de entrenamiento, los criterios
              de evaluacion, los algoritmos de analisis y el diseno de la interfaz, estan protegidos por derechos
              de propiedad intelectual. Las transcripciones y analisis generados durante las sesiones de entrenamiento
              son propiedad del usuario, sin perjuicio de los derechos de la plataforma sobre los datos agregados
              y anonimizados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Inteligencia artificial</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              La plataforma utiliza modelos de inteligencia artificial para simular conversaciones comerciales
              y generar analisis de rendimiento. Los resultados generados por la IA son orientativos y tienen
              finalidad formativa. No deben considerarse como evaluaciones definitivas de las capacidades
              profesionales del usuario. La plataforma no garantiza la exactitud absoluta de los analisis generados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Grabaciones de voz</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Las sesiones de entrenamiento implican el uso del microfono del dispositivo del usuario.
              El audio se transmite en tiempo real al servicio de IA y se transcribe automaticamente.
              Las transcripciones se almacenan como parte del historial del usuario. El audio en bruto
              no se almacena de forma permanente en nuestros servidores.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Limitacion de responsabilidad</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              La plataforma se proporciona "tal cual" y no garantiza la disponibilidad ininterrumpida del
              servicio. No nos responsabilizamos de danos derivados de interrupciones del servicio, errores
              en los analisis de IA o uso inadecuado de la plataforma por parte del usuario.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Legislacion aplicable</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Los presentes Terminos se rigen por la legislacion espanola. Para la resolucion de cualquier
              controversia, las partes se someten a los Juzgados y Tribunales de la ciudad de Madrid,
              con renuncia a cualquier otro fuero que pudiera corresponderles.
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
