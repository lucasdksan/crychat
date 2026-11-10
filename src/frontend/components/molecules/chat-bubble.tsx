import { cn } from "@/frontend/lib/utils";

type ChatBubbleProps = {
  role: "user" | "assistant";
  children: React.ReactNode;
};

export function ChatBubble({ role, children }: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "max-w-[92%] rounded-[var(--radius-lg)] px-3 py-2 text-sm leading-relaxed sm:max-w-[85%]",
        role === "user"
          ? "ml-auto bg-primary text-primary-foreground"
          : "mr-auto border border-border bg-card text-card-foreground",
      )}
    >
      {children}
    </div>
  );
}
