import { WEIGHT_OPTIONS } from "../utils/pathUtils";

export type ManualWeightProps = {
  value: string;
  onChange: (weight: string) => void;
};

export function ManualWeight({ value, onChange }: ManualWeightProps) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
        Weight
      </label>
      <div className="flex gap-2 flex-wrap">
        {WEIGHT_OPTIONS.map((w) => (
          <button
            key={w.value}
            type="button"
            onClick={() => onChange(w.value)}
            className={`h-8 px-3 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all ${
              value === w.value
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 bg-white text-stone-500 hover:border-stone-400"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>
    </div>
  );
}
