import { VideoForm } from "@/components/admin/video-form";

export default function NewVideoPage() {
  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <VideoForm mode="create" />
    </div>
  );
}
