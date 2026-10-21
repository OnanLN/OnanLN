export type CommentRecord = {
  id: number;
  guideId: number;
  authorId: number;
  authorName: string;
  parentId: number | null;
  body: string;
  createdAt: number;
};

export type CommentNode = CommentRecord & { replies: CommentNode[] };

export function buildTree(records: CommentRecord[]): CommentNode[] {
  const nodes = new Map<number, CommentNode>();
  for (const record of records) nodes.set(record.id, { ...record, replies: [] });

  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }

  for (const node of nodes.values()) {
    node.replies.sort((a, b) => a.createdAt - b.createdAt);
  }
  roots.sort((a, b) => b.createdAt - a.createdAt);
  return roots;
}
