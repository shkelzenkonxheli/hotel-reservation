import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// Handle GET requests for this route.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ user: null }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
  });

  return Response.json({ user });
}
