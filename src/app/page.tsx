import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Send<span className="text-sendbet-blue">Bet</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Turn Twitter sports arguments into real money bets
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">How it works</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-sendbet-blue text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Argue on Twitter</h3>
              <p className="text-gray-600 text-sm">
                Disagree about a sports outcome? Challenge your friend with @SendBet
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-sendbet-blue text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Create Smart Contract</h3>
              <p className="text-gray-600 text-sm">
                Both parties deposit funds into an automated escrow contract
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-sendbet-blue text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Auto Settlement</h3>
              <p className="text-gray-600 text-sm">
                Oracle confirms the result and winner gets paid automatically
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">Example Bet Flow:</h3>
            <div className="space-y-2 text-left">
              <div className="flex items-start gap-2">
                <span className="text-gray-500">👤</span>
                <span>"Messi will definitely score 2+ goals tonight 🐐"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500">👤</span>
                <span>"No way, City's defense is too strong @SendBet challenge $50"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500">👤</span>
                <span>"@SendBet accept"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sendbet-blue">🤖</span>
                <span>"✅ Bet created! Both deposit $50 → Winner gets $100"</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-gray-600">
          <p className="mb-2">Built on Chiliz Chain • Powered by Smart Contracts</p>
          <p className="text-sm">
            Start betting by mentioning <span className="font-mono bg-gray-200 px-2 py-1 rounded">@SendBet</span> in your sports arguments on Twitter
          </p>
        </div>
      </div>
    </div>
  );
}