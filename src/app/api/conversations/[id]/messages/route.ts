import { requireUser } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

async function loadConversation(id: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { participants: true },
  });
  if (!conversation || !conversation.participants.some((item) => item.userId === userId)) return null;
  return conversation;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const conversation = await loadConversation(id, session.user.id);
  if (!conversation) return fail("没有找到这段对话", 404);
  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sender: { select: { id: true, name: true } } },
  });
  return json({
    messages: messages.map((item) => ({
      id: item.id,
      body: item.body,
      senderId: item.senderId,
      senderName: item.sender.name,
      createdAt: item.createdAt.toISOString(),
      mine: item.senderId === session.user.id,
    })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const conversation = await loadConversation(id, session.user.id);
  if (!conversation) return fail("没有找到这段对话", 404);
  const body = await readJson(req);
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text || text.length > 1000) return fail("消息需要在 1 到 1000 字之间");
  const message = await prisma.message.create({
    data: { conversationId: id, senderId: session.user.id, body: text },
  });
  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
  return json({
    message: {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      senderName: session.user.name,
      createdAt: message.createdAt.toISOString(),
      mine: true,
    },
  });
}
