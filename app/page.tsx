import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">OptykCRM</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#funkcje" className="hover:text-purple-700 transition-colors">Funkcje</a>
            <a href="#jak-dziala" className="hover:text-purple-700 transition-colors">Jak to działa?</a>
            <a href="#faq" className="hover:text-purple-700 transition-colors">FAQ</a>
          </nav>
          <Link
            href="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Zaloguj się
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            CRM dla salonów optycznych
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            Kompletny CRM<br />
            <span className="text-purple-200">dla salonu optycznego.</span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Klienci, wizyty, zlecenia optyczne i automatyczne SMS w jednym miejscu. OptykCRM zastępuje kartki, arkusze i ręczne wiadomości — tak żebyś mógł skupić się na pacjencie.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white text-purple-700 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-purple-50 transition-colors shadow-lg"
            >
              Zaloguj się do panelu →
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">6</div>
              <div className="text-purple-200 text-sm mt-1">modułów w jednym miejscu</div>
            </div>
            <div className="border-x border-white/20">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">4</div>
              <div className="text-purple-200 text-sm mt-1">dostawców SMS</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">0 zł</div>
              <div className="text-purple-200 text-sm mt-1">koszt wdrożenia</div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="relative h-16 overflow-hidden">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 64L1440 64L1440 0C1440 0 1080 64 720 64C360 64 0 0 0 0L0 64Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section id="funkcje" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-purple-600 font-semibold text-sm uppercase tracking-widest">Funkcje</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">Wszystko czego potrzebujesz</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Jeden system zamiast kartek, arkuszy i ręcznych wiadomości.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                color: 'yellow',
                icon: (
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ),
                title: 'Automatyczne opinie Google',
                desc: 'SMS z linkiem do opinii wysyłany automatycznie po wizycie. Więcej recenzji bez angażowania personelu.',
              },
              {
                color: 'blue',
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: 'Baza klientów i wizyty',
                desc: 'Pełna historia wizyt każdego klienta. Dodawaj notatki, śledź źródło pozyskania i zarządzaj harmonogramem SMS.',
              },
              {
                color: 'green',
                icon: (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Zlecenia optyczne',
                desc: 'Zapisuj parametry recepty (OD/OS), oprawki, soczewki i soczewki kontaktowe. Wszystko przypisane do klienta.',
              },
              {
                color: 'purple',
                icon: (
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: 'Grupowe wysyłki SMS',
                desc: 'Wyślij wiadomość do wybranych klientów z filtrami po dacie wizyty czy liczbie wizyt. Własne szablony z placeholderami.',
              },
              {
                color: 'orange',
                icon: (
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Dashboard i statystyki',
                desc: 'Podgląd liczby wysłanych SMS, aktywnych klientów i zaplanowanych wizyt. Wszystko na jednym ekranie.',
              },
              {
                color: 'red',
                icon: (
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Wielu dostawców SMS',
                desc: 'Obsługujemy SMSAPI, SMSPlanet, Twilio i Vonage. Wybierz dostawcę, który najbardziej Ci odpowiada.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group bg-gray-50 hover:bg-white rounded-2xl p-6 sm:p-8 border border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-xl bg-${f.color}-100 flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="jak-dziala" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-purple-600 font-semibold text-sm uppercase tracking-widest">Jak to działa?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">Od wizyty do opinii w 3 krokach</h2>
            <p className="text-gray-500 text-lg">Konfiguracja zajmuje mniej niż 5 minut.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* connector line (desktop) */}
            <div className="hidden sm:block absolute top-7 left-1/3 right-1/3 h-0.5 bg-purple-200" />

            {[
              {
                step: '1',
                title: 'Dodaj wizytę',
                desc: 'Zarejestruj klienta i wizytę w systemie. Możesz też ustawić automatyczną synchronizację z zewnętrznym systemem.',
              },
              {
                step: '2',
                title: 'Ustaw datę SMS',
                desc: 'Określ kiedy wysłać wiadomość — np. 2 dni po wizycie. System wyśle SMS automatycznie o wyznaczonej porze.',
              },
              {
                step: '3',
                title: 'Zbieraj opinie',
                desc: 'Klient dostaje SMS z bezpośrednim linkiem do opinii Google. Jeden klik i gotowe — bez zbędnych kroków.',
              },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center relative">
                <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold mb-5 shadow-lg ring-4 ring-purple-100 z-10 relative">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-purple-600 font-semibold text-sm uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">Często zadawane pytania</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Czy naprawdę można używać za darmo?',
                a: 'Tak — do 200 klientów w bazie aplikacja jest całkowicie bezpłatna. Nie ma ukrytych opłat, limitu SMS ani daty wygaśnięcia.',
              },
              {
                q: 'Jakich dostawców SMS obsługuje OptykCRM?',
                a: 'Aktualnie obsługujemy SMSAPI.pl, SMSPlanet, Twilio i Vonage. Dostawcę możesz wybrać w ustawieniach — każdy wymaga własnego konta i tokenu API.',
              },
              {
                q: 'Czy SMS-y wysyłane są automatycznie?',
                a: 'Tak. Po ustawieniu daty wysyłki dla wizyty system co godzinę sprawdza zaplanowane wiadomości i wysyła je we właściwym momencie bez żadnej interwencji.',
              },
              {
                q: 'Czy dane klientów są bezpieczne?',
                a: 'Dane przechowywane są w Twojej własnej bazie PostgreSQL (lokalnie lub w chmurze). System nie wysyła danych do zewnętrznych usług analitycznych.',
              },
              {
                q: 'Czy mogę zainstalować aplikację samodzielnie?',
                a: 'Tak — OptykCRM jest dostarczany z plikiem docker-compose.yml, więc uruchomienie wymaga tylko Dockera. Można też wdrożyć na dowolnym serwerze Node.js.',
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex justify-between items-center p-5 cursor-pointer font-semibold text-gray-900 select-none list-none">
                  {item.q}
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-gray-500 leading-relaxed text-sm border-t border-gray-100 pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-purple-700 to-blue-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Jeden system dla całego salonu.</h2>
          <p className="text-purple-100 text-lg mb-8">Zaloguj się i zacznij zarządzać klientami, wizytami i zleceniami optycznymi — w jednym miejscu.</p>
          <Link
            href="/login"
            className="inline-block bg-white text-purple-700 font-semibold px-10 py-4 rounded-xl text-lg hover:bg-purple-50 transition-colors shadow-lg"
          >
            Przejdź do panelu →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-sm">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="font-semibold text-white">OptykCRM</span>
            </div>
            <nav className="flex gap-6 text-sm">
              <a href="#funkcje" className="hover:text-white transition-colors">Funkcje</a>
              <a href="#jak-dziala" className="hover:text-white transition-colors">Jak to działa?</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <Link href="/login" className="hover:text-white transition-colors">Logowanie</Link>
            </nav>
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} OptykCRM. Wszelkie prawa zastrzeżone.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
