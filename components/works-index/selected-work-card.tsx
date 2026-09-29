import { WorkCard } from "@/components/work-card";
import { formatWorkMeta, getWorkYear } from "@/lib/works-index";
import { useWorksLanguage } from "./works-language-provider";
import type { VideoRow } from "@/lib/types";

// /works 精选作品：与首页共用 WorkCard，另外显示摘要与本地化的 Role / Tools 标签。
// 作品内容（标题、分类、摘要、Role/Tools 的值）保持作者原文。
export function SelectedWorkCard({ work }: { work: VideoRow }) {
  const { copy } = useWorksLanguage();
  const role = work.role?.trim();
  const tools = work.tools?.trim();

  return (
    <WorkCard
      work={work}
      href={`/works/${work.id}`}
      ariaLabel={copy.selected.linkLabel(work.title)}
      meta={formatWorkMeta([work.category, getWorkYear(work.date)])}
      details={formatWorkMeta([
        role ? `${copy.selected.roleLabel} ${role}` : null,
        tools ? `${copy.selected.toolsLabel} ${tools}` : null,
      ])}
      summary={work.summary?.trim() || null}
      size="large"
      sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1199px) calc(50vw - 56px), 592px"
    />
  );
}
