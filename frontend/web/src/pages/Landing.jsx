export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <h1 className="text-4xl font-bold text-blue-800 mb-4">Welcome to FutureProof</h1>
      <p className="text-lg text-gray-700 mb-8">Your journey to future-ready skills starts here.</p>
      <button className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">
        Get Started
      </button>
    </div>
  );
}
