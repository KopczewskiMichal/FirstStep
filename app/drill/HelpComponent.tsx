import { getMode } from "./settings";

interface Props {
  onClose: () => void;
}

export default function HelpComponent({ onClose }: Props) {
  return (
    <div className="absolute right-0 mt-2 w-64 p-4 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 text-sm">
      <h3 className="text-blue-400 font-bold mb-2 underline decoration-blue-400/30">
        QUICK SETUP
      </h3>
      <ul className="space-y-3 text-zinc-300">
        <li>
          <span className="text-white font-semibold">1. Frame:</span> Position camera to see your <span className="text-blue-200">full body</span> (head to ankles).
        </li>
        <li>
          <span className="text-white font-semibold">2. Start:</span> Drill begins <span className="text-blue-200">automatically</span> once you're in position.
        </li>
        {getMode() === "SPRINT" && (
          <li>
          <span className="text-white font-semibold">3. Audio:</span> Turn <span className="text-blue-200">sound ON</span> for start signals.
        </li>
        )}
      </ul>
      <button
        onClick={onClose}
        className="mt-4 w-full py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-400"
      >
        Close
      </button>
    </div>

  )
}
