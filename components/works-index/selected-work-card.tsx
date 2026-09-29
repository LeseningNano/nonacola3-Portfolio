import { WorkCard } from "@/components/work-card";
import { formatWorkMeta, getWorkYear } from "@/lib/works-index";
import { useWorksLanguage } from "./works-language-provider";
import type { VideoRow } from "@/lib/types";

// /works 精选作品：与首页共用 WorkCard，另外显示摘要与本地化的 Role / Tools 两行。
// 作品内容（标题、分类、摘要、Role/Tools 的值）保持作者原文。
export function SelectedWorkCard({ work, index }: { work: VideoRow; index?: string }) {
  const { copy } = useWorksLanguage();
  const role = work.role?.trim();
  const tools = work.tools?.trim();
  const { roleLabel, toolsLabel, labelSeparator } = copy.selected;
  const details = [
    role ? `${roleLabel}${labelSeparator}${role}` : null,
    tools ? `${toolsLabel}${labelSeparator}${tools}` : null,
  ].filter((line): line is string => line !== null);

  return (
    <WorkCard
      work={work}
      href={`/works/${work.id}`}
      ariaLabel={copy.selected.linkLabel(work.title)}
      meta={formatWorkMeta([work.category, getWorkYear(work.date)])}
      details={details}
      summary={work.summary?.trim() || null}
      size="large"
      index={index}
      sizes="(max-width: 767px) 85vw, (max-width: 1199px) 70vw, 860px"
    />
  );
}
