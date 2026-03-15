import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/login"><Logo size="sm" /></Link>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Politica de Cookies</h1>
        <p className="text-slate-400 text-sm mb-8">Ultima actualizacion: 15 de marzo de 2026</p>

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Que son las cookies</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Las cookies son pequenos archivos de texto que se almacenan en su dispositivo cuando visita
              un sitio web. Se utilizan para recordar preferencias, mantener sesiones activas y analizar
              el uso del sitio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Cookies que utilizamos</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              SalesPulse AI utiliza exclusivamente cookies tecnicas estrictamente necesarias:
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Cookie</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Finalidad</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Duracion</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 px-3 font-mono text-xs">CognitoIdentityServiceProvider.*</td>
                    <td className="py-2 px-3">Autenticacion y sesion de usuario (AWS Cognito)</td>
                    <td className="py-2 px-3">Sesion / 30 dias</td>
                    <td className="py-2 px-3">Tecnica necesaria</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 px-3 font-mono text-xs">amplify-*</td>
                    <td className="py-2 px-3">Configuracion de AWS Amplify para conexion con el backend</td>
                    <td className="py-2 px-3">Sesion</td>
                    <td className="py-2 px-3">Tecnica necesaria</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Cookies de terceros</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              No utilizamos cookies de terceros, cookies de seguimiento, cookies publicitarias ni
              cookies de analisis. No compartimos informacion de navegacion con terceros a traves de cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Gestion de cookies</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Dado que solo utilizamos cookies tecnicas estrictamente necesarias para el funcionamiento
              de la plataforma, no es necesario recabar su consentimiento para su uso (conforme al
              articulo 22.2 de la LSSI). No obstante, puede configurar su navegador para rechazar cookies,
              aunque esto podria afectar al funcionamiento de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Mas informacion</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Para mas informacion sobre el tratamiento de sus datos, consulte nuestra{' '}
              <Link href="/privacy" className="text-blue-400 hover:underline">Politica de Privacidad</Link>.
              Para cualquier consulta, contacte con nosotros en{' '}
              <span className="text-blue-400">privacidad@salespulse.ai</span>.
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
