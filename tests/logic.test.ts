import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyPrecision } from "../lib/geo.ts";
import { formatWhen, maskPhone } from "../lib/format.ts";
import { createIpLimiter } from "../lib/ipLimit.ts";
import { parseBlocks, splitBold } from "../lib/richTextParse.ts";
import { decideSmsSend } from "../lib/smsPolicy.ts";
import { buildTree } from "../lib/tree.ts";
import { parseTags, phoneSchema } from "../lib/validators.ts";

describe("短信发送策略", () => {
  const now = 1_700_000_000_000;

  it("一分钟内不能重复获取", () => {
    const decision = decideSmsSend([{ createdAt: now - 20_000 }], now);
    assert.equal(decision.ok, false);
    if (!decision.ok) assert.match(decision.error, /秒后再获取/);
  });

  it("一天最多 8 次", () => {
    const attempts = Array.from({ length: 8 }, (_, index) => ({ createdAt: now - (index + 2) * 60_000 }));
    const decision = decideSmsSend(attempts, now);
    assert.equal(decision.ok, false);
    if (!decision.ok) assert.match(decision.error, /次数已用完/);
  });

  it("间隔足够时可以发送", () => {
    assert.equal(decideSmsSend([{ createdAt: now - 61_000 }], now).ok, true);
  });
});

describe("位置精度", () => {
  it("模糊位置大约收到一公里", () => {
    assert.deepEqual(applyPrecision(25.69391, 100.16344, "fuzzy"), { lat: 25.69, lng: 100.16 });
  });

  it("精确位置保留六位", () => {
    assert.deepEqual(applyPrecision(25.6939112, 100.1634499, "exact"), { lat: 25.693911, lng: 100.16345 });
  });
});

describe("留言树", () => {
  it("回复挂在父留言下面，顶层按新到旧", () => {
    const tree = buildTree([
      { id: 1, guideId: 1, authorId: 1, authorName: "甲", parentId: null, body: "先写的", createdAt: 10 },
      { id: 2, guideId: 1, authorId: 2, authorName: "乙", parentId: null, body: "后写的", createdAt: 30 },
      { id: 3, guideId: 1, authorId: 3, authorName: "丙", parentId: 2, body: "回复", createdAt: 40 },
      { id: 4, guideId: 1, authorId: 1, authorName: "甲", parentId: 3, body: "再回复", createdAt: 50 },
      { id: 5, guideId: 1, authorId: 4, authorName: "丁", parentId: 99, body: "父留言丢了", createdAt: 20 },
    ]);
    assert.deepEqual(
      tree.map((node) => node.id),
      [2, 5, 1],
    );
    assert.equal(tree[0]?.replies[0]?.id, 3);
    assert.equal(tree[0]?.replies[0]?.replies[0]?.id, 4);
  });
});

describe("正文解析", () => {
  it("识别小标题、段落和列表", () => {
    const blocks = parseBlocks("## 怎么去\n先坐高铁。\n\n- 带水\n- 问价格\n\n第二天留白。");
    assert.deepEqual(blocks, [
      { type: "h2", text: "怎么去" },
      { type: "p", text: "先坐高铁。" },
      { type: "ul", items: ["带水", "问价格"] },
      { type: "p", text: "第二天留白。" },
    ]);
  });

  it("只把成对的星号当成强调", () => {
    assert.deepEqual(splitBold("问清**按条**还是按斤"), [
      { bold: false, text: "问清" },
      { bold: true, text: "按条" },
      { bold: false, text: "还是按斤" },
    ]);
  });
});

describe("账号与标签", () => {
  it("只接受大陆手机号", () => {
    assert.equal(phoneSchema.safeParse("13800000001").success, true);
    assert.equal(phoneSchema.safeParse("12800000001").success, false);
    assert.equal(phoneSchema.safeParse("1380000000").success, false);
  });

  it("隐藏手机号中间四位", () => {
    assert.equal(maskPhone("13800000001"), "138****0001");
  });

  it("标签按逗号或空格拆开并去重", () => {
    assert.deepEqual(parseTags("骑行，古城 骑行  湖泊"), ["骑行", "古城", "湖泊"]);
  });

  it("时间按中文相对时间显示", () => {
    const now = Date.UTC(2026, 9, 21, 8, 0, 0);
    assert.equal(formatWhen(now - 10_000, now), "刚刚");
    assert.equal(formatWhen(now - 5 * 60_000, now), "5 分钟前");
    assert.equal(formatWhen(now - 3 * 60 * 60_000, now), "3 小时前");
    assert.equal(formatWhen(now - 3 * 24 * 60 * 60_000, now), "3 天前");
    assert.equal(formatWhen(Date.UTC(2026, 0, 2, 0, 0, 0), now), "2026.1.2");
  });
});

describe("IP 频控", () => {
  it("超过上限后拒绝，窗口过去后恢复", () => {
    const limiter = createIpLimiter(2, 1_000);
    assert.equal(limiter.allow("1.1.1.1", 0), true);
    assert.equal(limiter.allow("1.1.1.1", 10), true);
    assert.equal(limiter.allow("1.1.1.1", 20), false);
    assert.equal(limiter.allow("1.1.1.1", 1_100), true);
  });
});
