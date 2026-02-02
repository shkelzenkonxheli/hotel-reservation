import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

// Server-Sent Events: push unread count changes.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role === "client") {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastCount = null;

      const send = (count) => {
        controller.enqueue(encoder.encode(`event: unread\ndata: ${count}\n\n`));
      };

      // Initial push.
      try {
        const initial = await prisma.notifications.count({
          where: { is_read: false },
        });
        lastCount = initial;
        send(initial);
      } catch {
        // ignore initial errors
      }

      const interval = setInterval(async () => {
        try {
          const count = await prisma.notifications.count({
            where: { is_read: false },
          });
          if (count !== lastCount) {
            lastCount = count;
            send(count);
          }
        } catch {
          // ignore transient errors
        }
      }, 10000);

      controller.signal?.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
    cancel() {
      // No-op; interval cleared via abort listener when possible.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
