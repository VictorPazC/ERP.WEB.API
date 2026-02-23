export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="relative">
        <div className="w-10 h-10 border-2 border-gray-800 rounded-full" />
        <div className="absolute inset-0 w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-xs text-gray-600">Loading...</p>
    </div>
  );
}
