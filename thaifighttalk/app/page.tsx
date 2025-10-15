import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-blue via-primary-red to-primary-blue flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
            ThaiFightTalk
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-medium mb-2">
            Train hard, learn easy — one Thai word at a time 🥋
          </p>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Gamified Thai language learning for Muay Thai travelers.
            Level up through training camps, earn badges, and master conversational Thai.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-primary-gold text-primary-blue font-bold text-lg rounded-lg hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Start Learning
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-lg border-2 border-white/30 hover:bg-white/20 transition-all transform hover:scale-105"
          >
            Log In
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white/90">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="font-bold text-lg mb-2">Gamified Learning</h3>
            <p className="text-sm text-white/80">
              Earn XP, maintain streaks, and collect badges as you progress through training camps
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-4xl mb-3">🥊</div>
            <h3 className="font-bold text-lg mb-2">AI Sparring Partner</h3>
            <p className="text-sm text-white/80">
              Practice real conversations with an AI tutor who understands Muay Thai culture
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-4xl mb-3">🗣️</div>
            <h3 className="font-bold text-lg mb-2">Pronunciation Feedback</h3>
            <p className="text-sm text-white/80">
              Get instant feedback on your Thai pronunciation with AI-powered speech recognition
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
