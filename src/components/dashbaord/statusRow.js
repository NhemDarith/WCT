
function StatusRow({ label, status }) {
  const isOnline = status === "Online" || status === "Connected" || status === "Active";

  return (
    <div className="flex items-center justify-between bg-black/40 px-4 py-2 rounded-lg">
      <span className="text-gray-300">{label}</span>
      <span
        className={`text-xs font-semibold ${
          isOnline ? "text-green-500" : "text-red-500"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

export default StatusRow;