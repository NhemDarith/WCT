function StatCard({ title, value, subtitle, highlight }) {
  return (
    <div
      className={`rounded-xl p-5 border ${
        highlight
          ? "bg-green-600 text-black border-green-500"
          : "bg-zinc-900 border-green-700"
      }`}
    >
      <p
        className={`text-sm ${
          highlight ? "text-black/70" : "text-gray-400"
        }`}
      >
        {title}
      </p>
      <p className="text-3xl font-bold mt-1">
        {value}
      </p>
      <p
        className={`text-xs mt-1 ${
          highlight ? "text-black/80" : "text-gray-500"
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
}

export default StatCard;