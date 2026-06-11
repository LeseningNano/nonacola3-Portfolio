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
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect("全部")}
        className={`px-4 py-2 rounded-full text-sm transition-colors ${
          selected === "全部"
            ? "bg-white text-black"
            : "bg-zinc-800 text-zinc-400 hover:text-white"
        }`}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            selected === cat
              ? "bg-white text-black"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
