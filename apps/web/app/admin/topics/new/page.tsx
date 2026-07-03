import { createTopicDirect } from "@/app/admin/topic-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function NewTopicPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <span className="mb-8 block font-serif text-lg italic">
        <a href="/" className="hover:text-primary">Trice</a>{" "}
        / <a href="/admin" className="hover:text-primary">admin</a>{" "}
        / new topic
      </span>
      <h1 className="mb-6 font-serif text-2xl text-foreground">New topic</h1>

      <form action={createTopicDirect} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">title</Label>
          <Input id="title" name="title" placeholder="CDN" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">description</Label>
          <Textarea id="description" name="description" rows={3} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sortOrder">sort order</Label>
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue={1} />
        </div>

        <Button type="submit">Create topic</Button>
      </form>
    </main>
  );
}
