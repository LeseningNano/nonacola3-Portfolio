"use client";

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        onClick={() => onSelect("全部")}
        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
          selected === "全部"
            ? "bg-white text-black shadow-lg shadow-white/10"
            : "bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/50 hover:border-zinc-600"
        }`}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            selected === cat
              ? "bg-white text-black shadow-lg shadow-white/10"
              : "bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/50 hover:border-zinc-600"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
