export default function ExercisePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Physical Activity</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
            Exercise & Fitness
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Track your workouts, gym routines, and physical progress.
          </p>
        </header>

        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-16 shadow-xl shadow-stone-200/50 text-center">
          <p className="text-4xl mb-4">💪</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Coming Soon</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            The exercise tracking module is being built. You will be able to log your reps, sets, and cardio metrics here soon.
          </p>
        </div>
      </div>
    </div>
  )
}
