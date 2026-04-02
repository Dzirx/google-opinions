import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">OptykCRM</span>
          </div>
          <Link
            href="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Zaloguj się
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            CRM dla salonów optycznych
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            Więcej opinii Google.<br />
            <span className="text-purple-200">Bez wysiłku.</span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            OptykCRM automatycznie wysyła SMS z prośbą o opinię po każdej wizycie. Zarządzaj klientami, zleceniami optycznymi i śledź wyniki — wszystko w jednym miejscu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white text-purple-700 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-purple-50 transition-colors shadow-lg"
            >
              Zaloguj się do panelu
            </Link>
          </div>
        </div>

        {/* Wave */}
        <div className="relative h-16 overflow-hidden">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 64L1440 64L1440 0C1440 0 1080 64 720 64C360 64 0 0 0 0L0 64Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Wszystko czego potrzebujesz</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Jeden system zamiast kartek, arkuszy i ręcznych wiadomości.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Automatyczne opinie Google</h3>
              <p className="text-gray-500 leading-relaxed">SMS z linkiem do opinii wysyłany automatycznie po wizycie. Więcej recenzji bez angażowania personelu.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Baza klientów i wizyty</h3>
              <p className="text-gray-500 leading-relaxed">Pełna historia wizyt każdego klienta. Dodawaj notatki, śledź źródło pozyskania i zarządzaj harmonogramem SMS.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Zlecenia optyczne</h3>
              <p className="text-gray-500 leading-relaxed">Zapisuj parametry recepty (OD/OS), oprawki, soczewki i soczewki kontaktowe. Wszystko przypisane do klienta.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Grupowe wysyłki SMS</h3>
              <p className="text-gray-500 leading-relaxed">Wyślij wiadomość do wybranych klientów z filtrami po dacie wizyty czy liczbie wizyt. Własne szablony z placeholderami.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboard i statystyki</h3>
              <p className="text-gray-500 leading-relaxed">Podgląd liczby wysłanych SMS, aktywnych klientów i zaplanowanych wizyt. Wszystko na jednym ekranie.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Wielu dostawców SMS</h3>
              <p className="text-gray-500 leading-relaxed">Obsługujemy SMSAPI, SMSPlanet, Twilio i Vonage. Wybierz dostawcę, który najbardziej Ci odpowiada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Jak to działa?</h2>
            <p className="text-gray-500 text-lg">Trzy kroki do automatycznych opinii Google.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold mb-4 shadow-lg">1</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Dodaj wizytę</h3>
              <p className="text-gray-500">Zarejestruj klienta i wizytę w systemie. Możesz też ustawić automatyczną synchronizację z Integrą.</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold mb-4 shadow-lg">2</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ustaw datę SMS</h3>
              <p className="text-gray-500">Określ kiedy wysłać wiadomość — np. 2 dni po wizycie. System wyśle SMS automatycznie o wyznaczonej porze.</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold mb-4 shadow-lg">3</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Zbieraj opinie</h3>
              <p className="text-gray-500">Klient dostaje SMS z bezpośrednim linkiem do opinii Google. Jeden klik i gotowe — bez zbędnych kroków.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-purple-700 to-blue-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Gotowy na więcej opinii?</h2>
          <p className="text-purple-100 text-lg mb-8">Zaloguj się i zacznij zbierać opinie Google już dziś.</p>
          <Link
            href="/login"
            className="inline-block bg-white text-purple-700 font-semibold px-10 py-4 rounded-xl text-lg hover:bg-purple-50 transition-colors shadow-lg"
          >
            Przejdź do panelu
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="font-semibold text-white">OptykCRM</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} OptykCRM. Wszelkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  );
}
