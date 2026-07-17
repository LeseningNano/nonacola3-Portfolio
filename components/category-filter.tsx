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
        className={`px-5 py-2.5 text-sm transition-all duration-300 border flex items-center gap-2 ${
          selected === "全部"
            ? "text-white border-white"
            : "text-zinc-300 border-zinc-400 hover:text-white hover:border-white"
        }`}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-5 py-2.5 text-sm transition-all duration-300 border flex items-center gap-2 ${
            selected === cat
              ? "text-white border-white"
              : "text-zinc-300 border-zinc-400 hover:text-white hover:border-white"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
