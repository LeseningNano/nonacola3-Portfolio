import { VideoForm } from "@/components/admin/video-form";

export default function NewVideoPage() {
  return (
    <div className="min-h-screen pt-24 pb-8 px-8 max-w-2xl mx-auto">
      <VideoForm mode="create" />
    </div>
  );
}
