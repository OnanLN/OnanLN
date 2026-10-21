import { PrismaClient } from "@prisma/client";
import { buildQuote, encodeIntervals, settle } from "../src/lib/booking";
import { hashPassword } from "../src/lib/password";
import { addDays, formatYmd, fromSh, shParts } from "../src/lib/time";

const prisma = new PrismaClient();

type LotSeed = {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  hourly: number;
  daily?: number;
  monthly?: number;
  visitor?: "yes" | "no" | "permit" | "unknown";
  total: number;
  fixed: number;
  flexible: number;
  available: number;
  type?: string;
  ev?: number;
  height?: number;
  night?: boolean;
  reservable?: boolean;
  free?: number;
  note: string;
  rules?: string;
  operator?: string;
  pay?: string;
};

const lots: LotSeed[] = [
  { id: "lot_kerry", name: "静安嘉里中心停车场", city: "上海", district: "静安区", address: "南京西路1515号", lat: 31.2232, lng: 121.4461, hourly: 15, daily: 80, visitor: "yes", total: 680, fixed: 420, flexible: 260, available: 48, ev: 36, height: 2, reservable: true, free: 15, note: "15 分钟内离场免费，之后每小时 15 元，当天封顶 80 元。", operator: "嘉里中心", pay: "微信,支付宝" },
  { id: "lot_raffles", name: "人民广场来福士地下停车场", city: "上海", district: "黄浦区", address: "西藏中路268号", lat: 31.2328, lng: 121.4756, hourly: 12, daily: 72, visitor: "yes", total: 900, fixed: 500, flexible: 400, available: 86, ev: 24, height: 2.1, free: 15, note: "每小时 12 元，当天封顶 72 元。", operator: "来福士", pay: "上海停车,微信" },
  { id: "lot_ifc", name: "陆家嘴国金中心停车场", city: "上海", district: "浦东新区", address: "世纪大道8号", lat: 31.2352, lng: 121.5056, hourly: 20, daily: 120, visitor: "yes", total: 1100, fixed: 700, flexible: 400, available: 63, ev: 80, height: 2.2, reservable: true, note: "核心区车场，工作日午后通常更紧。", operator: "国金中心", pay: "微信,支付宝" },
  { id: "lot_metro", name: "徐家汇美罗城停车场", city: "上海", district: "徐汇区", address: "肇嘉浜路1111号", lat: 31.1886, lng: 121.4365, hourly: 10, daily: 60, visitor: "yes", total: 760, fixed: 300, flexible: 460, available: 110, ev: 18, height: 1.9, note: "每小时 10 元，封顶 60 元。", operator: "美罗城" },
  { id: "lot_station", name: "上海火车站南广场 P2", city: "上海", district: "静安区", address: "秣陵路303号附近", lat: 31.2494, lng: 121.4558, hourly: 8, daily: 50, visitor: "yes", total: 540, fixed: 80, flexible: 460, available: 22, ev: 6, night: true, note: "接站车多，余位变化快，这个数字是人工收录。", rules: "货车请走指定通道。" },
  { id: "lot_hongqiao", name: "虹桥天地停车场", city: "上海", district: "闵行区", address: "申长路688号", lat: 31.1962, lng: 121.3208, hourly: 15, daily: 90, visitor: "yes", total: 1500, fixed: 600, flexible: 900, available: 240, ev: 40, height: 2.2, note: "枢纽旁，适合短停后改乘地铁。", operator: "虹桥天地" },
  { id: "lot_wujiaochang", name: "五角场万达停车场", city: "上海", district: "杨浦区", address: "淞沪路77号", lat: 31.2996, lng: 121.5142, hourly: 8, daily: 48, visitor: "yes", total: 1200, fixed: 400, flexible: 800, available: 190, ev: 22, note: "每小时 8 元，封顶 48 元。", operator: "万达" },
  { id: "lot_century", name: "世纪公园地下停车场", city: "上海", district: "浦东新区", address: "锦绣路1001号", lat: 31.2145, lng: 121.5508, hourly: 6, daily: 30, visitor: "yes", total: 800, fixed: 200, flexible: 600, available: 260, ev: 12, height: 2, note: "公园配套，周末上午会满。", rules: "公园开放时间内进出更方便。" },
  { id: "lot_wukang", name: "武康路历史街区路边泊位", city: "上海", district: "徐汇区", address: "武康路靠近湖南路", lat: 31.2134, lng: 121.4386, hourly: 15, visitor: "yes", total: 28, fixed: 0, flexible: 28, available: 4, type: "roadside", ev: 0, night: false, note: "路边泊位，按道路停车规则计费，夜间部分路段不开放。", rules: "注意临时交通管制。" },
  { id: "lot_qiantan", name: "前滩太古里停车场", city: "上海", district: "浦东新区", address: "东育路500号", lat: 31.1548, lng: 121.4805, hourly: 12, daily: 78, visitor: "yes", total: 980, fixed: 360, flexible: 620, available: 150, ev: 46, height: 2.1, reservable: true, note: "商场车场，用餐可在小票机抵扣，以商场规则为准。" },
  { id: "lot_zhangjiang", name: "张江科学城园区停车场", city: "上海", district: "浦东新区", address: "祖冲之路靠近金科路", lat: 31.2035, lng: 121.6002, hourly: 5, daily: 30, visitor: "permit", total: 640, fixed: 480, flexible: 160, available: 18, ev: 30, note: "外来车需要在门岗登记，不是敞开进入。", rules: "访客先换证再进地库。" },
  { id: "lot_bund", name: "外滩源酒店停车场", city: "上海", district: "黄浦区", address: "圆明园路相近", lat: 31.2408, lng: 121.4902, hourly: 25, daily: 160, visitor: "yes", total: 180, fixed: 90, flexible: 90, available: 11, ev: 8, height: 1.8, note: "外滩周边小库，价格高，限高偏低。", operator: "外滩源" },
  { id: "lot_xintiandi", name: "新天地南里停车场", city: "上海", district: "黄浦区", address: "兴业路123号附近", lat: 31.2196, lng: 121.4752, hourly: 18, daily: 100, visitor: "yes", total: 420, fixed: 180, flexible: 240, available: 37, ev: 14, height: 2, note: "晚高峰难停，建议提前到。" },
  { id: "lot_westlake", name: "湖滨银泰地下停车场", city: "杭州", district: "上城区", address: "延安路245号", lat: 30.2552, lng: 120.1638, hourly: 10, daily: 60, visitor: "yes", total: 700, fixed: 250, flexible: 450, available: 90, ev: 16, note: "西湖东侧，步行可到湖滨。", operator: "银泰" },
  { id: "lot_wulin", name: "武林广场杭州大厦停车场", city: "杭州", district: "拱墅区", address: "武林广场1号", lat: 30.2754, lng: 120.1632, hourly: 12, daily: 70, visitor: "yes", total: 860, fixed: 300, flexible: 560, available: 140, ev: 20, note: "地铁武林广场站旁。" },
  { id: "lot_qianjiang", name: "钱江新城来福士停车场", city: "杭州", district: "上城区", address: "新业路228号", lat: 30.2462, lng: 120.2104, hourly: 8, daily: 48, visitor: "yes", total: 1300, fixed: 500, flexible: 800, available: 320, ev: 40, note: "钱塘江边，工作日白天相对宽松。" },
  { id: "lot_guomao", name: "国贸商城停车场", city: "北京", district: "朝阳区", address: "建国门外大街1号", lat: 39.9097, lng: 116.4605, hourly: 15, daily: 90, visitor: "yes", total: 1600, fixed: 900, flexible: 700, available: 80, ev: 50, height: 2, note: "CBD 车场，工作日 9 点后往往紧张。", operator: "国贸" },
  { id: "lot_sanlitun", name: "三里屯太古里停车场", city: "北京", district: "朝阳区", address: "三里屯路19号", lat: 39.9336, lng: 116.4544, hourly: 18, daily: 108, visitor: "yes", total: 900, fixed: 200, flexible: 700, available: 45, ev: 28, note: "周末夜间最难停。", operator: "太古里" },
  { id: "lot_zhongguancun", name: "中关村大街公共停车场", city: "北京", district: "海淀区", address: "中关村大街靠近海淀黄庄", lat: 39.9842, lng: 116.3168, hourly: 10, daily: 60, visitor: "permit", total: 380, fixed: 220, flexible: 160, available: 26, ev: 12, note: "部分区域只对园区车辆开放，外来车要问清入口。", rules: "入口以当日门岗为准。" },
  { id: "lot_coast", name: "海岸城购物中心停车场", city: "深圳", district: "南山区", address: "文心五路33号", lat: 22.5182, lng: 113.9358, hourly: 8, daily: 40, visitor: "yes", total: 1400, fixed: 400, flexible: 1000, available: 360, ev: 60, note: "消费可按商场规则减免。" },
  { id: "lot_futian", name: "福田中心区公共停车场", city: "深圳", district: "福田区", address: "福中三路市民中心附近", lat: 22.5418, lng: 114.0596, hourly: 12, daily: 72, visitor: "yes", total: 820, fixed: 300, flexible: 520, available: 95, ev: 34, note: "会展期间会提前满。" },
];

function upcoming(startMonth: number, startDay: number, endMonth: number, endDay: number, hour = 12) {
  const today = shParts(new Date());
  let year = today.y;
  let start = fromSh(year, startMonth, startDay, hour, 0);
  if (start.getTime() <= Date.now()) {
    year += 1;
    start = fromSh(year, startMonth, startDay, hour, 0);
  }
  let end = fromSh(endMonth < startMonth ? year + 1 : year, endMonth, endDay, hour, 0);
  if (end <= start) end = fromSh(year + 1, endMonth, endDay, hour, 0);
  return { start, end };
}

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.parkingSpot.deleteMany();
  await prisma.pointEntry.deleteMany();
  await prisma.parkingReport.deleteMany();
  await prisma.parkingLot.deleteMany();
  await prisma.session.deleteMany();
  await prisma.emailCode.deleteMany();
  await prisma.adBanner.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword("Weixiang#2026");
  await prisma.user.createMany({
    data: [
      { id: "usr_admin", email: "admin@weixiang.app", name: "位享管理员", passwordHash, isAdmin: true, points: 0, bio: "看上报、改车场资料。" },
      { id: "usr_lin", email: "lin@weixiang.app", name: "林可", passwordHash, points: 860, bio: "衡复路的车位，白天大多空着。" },
      { id: "usr_zhou", email: "zhou@weixiang.app", name: "周屿", passwordHash, points: 300, bio: "经常把节假日整段空出来。" },
    ],
  });
  await prisma.pointEntry.createMany({
    data: [
      { userId: "usr_lin", delta: 200, reason: "注册见面礼" },
      { userId: "usr_lin", delta: 660, reason: "早期上报奖励" },
      { userId: "usr_zhou", delta: 200, reason: "注册见面礼" },
      { userId: "usr_zhou", delta: 100, reason: "资料补全" },
    ],
  });

  await prisma.parkingLot.createMany({
    data: lots.map((item) => ({
      id: item.id,
      name: item.name,
      city: item.city,
      district: item.district,
      address: item.address,
      lat: item.lat,
      lng: item.lng,
      hourlyPrice: item.hourly * 100,
      firstHourPrice: item.hourly * 100,
      dailyCap: item.daily == null ? null : item.daily * 100,
      monthlyPrice: item.monthly == null ? null : item.monthly * 100,
      freeMinutes: item.free ?? 0,
      feeNote: item.note,
      allowVisitor: item.visitor ?? "yes",
      totalSpots: item.total,
      fixedSpots: item.fixed,
      flexibleSpots: item.flexible,
      availableSpots: item.available,
      availabilityMode: "manual",
      openHours: item.night === false ? "08:00-20:00" : "全天",
      lotType: item.type ?? "underground",
      evChargers: item.ev ?? 0,
      heightLimitM: item.height ?? null,
      paymentMethods: item.pay ?? "微信,支付宝",
      reservable: item.reservable ?? false,
      nightOpen: item.night !== false,
      accessibleSpots: Math.max(2, Math.round(item.total * 0.01)),
      rules: item.rules ?? "",
      operatorName: item.operator ?? "",
      source: "manual",
      status: "published",
      verified: true,
    })),
  });

  await prisma.parkingSpot.create({
    data: {
      id: "spot_hengfu",
      ownerId: "usr_lin",
      title: "衡复路地库，白天几乎空着",
      description: "小区地库，柱距宽，适合轿车和小型 SUV。房东白天去公司，晚上回来。",
      city: "上海",
      district: "徐汇区",
      community: "衡复路小区",
      address: "衡复路靠近乌鲁木齐中路",
      spotCode: "B2-086",
      lat: 31.2104,
      lng: 121.4486,
      spotType: "underground",
      vehicleLimit: "轿车 / 小型 SUV",
      hasCharger: false,
      accessGuide: "从衡复路人行闸机进来，下到 B2，靠墙倒数第二个。进场前在对话里说一声车牌。",
      listings: {
        create: [
          { id: "lst_hengfu_day", mode: "day", priceCents: 3500, windowStart: "08:00", windowEnd: "20:00", note: "工作日更好停" },
          { id: "lst_hengfu_night", mode: "night", priceCents: 1800, windowStart: "20:00", windowEnd: "08:00", note: "含次日早晨" },
          { id: "lst_hengfu_month", mode: "month", priceCents: 90000, note: "整月不停走" },
        ],
      },
    },
  });

  await prisma.parkingSpot.create({
    data: {
      id: "spot_jinxiu",
      ownerId: "usr_lin",
      title: "锦绣路地面车位，按小时走",
      description: "露天车位，进出不用等电梯，适合只停两三个小时。",
      city: "上海",
      district: "浦东新区",
      community: "锦绣路社区",
      address: "锦绣路靠近芳甸路",
      spotCode: "地面-12",
      lat: 31.2048,
      lng: 121.5288,
      spotType: "ground",
      hasCharger: true,
      accessGuide: "北门道闸报车牌，车位在岗亭右手边第一排。",
      listings: { create: [{ id: "lst_jinxiu_hour", mode: "hour", priceCents: 800, note: "最短 1 小时" }] },
    },
  });

  const newYear = upcoming(11, 31, 0, 3);
  const spring = upcoming(1, 6, 1, 13, 0);
  const national = upcoming(9, 1, 9, 8, 0);
  await prisma.parkingSpot.create({
    data: {
      id: "spot_zhou",
      ownerId: "usr_zhou",
      title: "顾村地面车位，节假日整段可租",
      description: "过年回老家，跨年和国庆也经常不在。整段租，不拆小时。",
      city: "上海",
      district: "宝山区",
      community: "顾村小区",
      address: "沪太路靠近顾村公园",
      spotCode: "A-019",
      lat: 31.3422,
      lng: 121.3844,
      spotType: "ground",
      vehicleLimit: "轿车",
      accessGuide: "小区西门，保安室登记后进。车位在 3 号楼北侧。",
      listings: {
        create: [
          { id: "lst_zhou_newyear", mode: "holiday", priceCents: 26000, holidayName: "跨年", startAt: newYear.start, endAt: newYear.end, note: "整段，不拆开" },
          { id: "lst_zhou_spring", mode: "holiday", priceCents: 68000, holidayName: "春节前后", startAt: spring.start, endAt: spring.end, note: "房东自定义一周，不是官方放假日历" },
          { id: "lst_zhou_national", mode: "holiday", priceCents: 42000, holidayName: "国庆", startAt: national.start, endAt: national.end },
        ],
      },
    },
  });

  const today = shParts(new Date());
  const tomorrow = formatYmd(addDays(today.y, today.m, today.d, 1));
  const quote = buildQuote(
    { mode: "day", priceCents: 3500, windowStart: "08:00", windowEnd: "20:00", startAt: null, endAt: null, holidayName: "" },
    { date: tomorrow, days: 1 },
  );
  if (!quote.ok) throw new Error(quote.message);
  const money = settle(quote.rentCents, 0, 0);
  const booking = await prisma.booking.create({
    data: {
      id: "bk_seed_day",
      listingId: "lst_hengfu_day",
      spotId: "spot_hengfu",
      renterId: "usr_zhou",
      ownerId: "usr_lin",
      startAt: quote.intervals[0].start,
      endAt: quote.intervals[0].end,
      intervals: encodeIntervals(quote.intervals),
      label: quote.label,
      rentCents: quote.rentCents,
      cashCents: money.cashCents,
      platformFeeCents: money.platformFeeCents,
      ownerPayoutCents: money.ownerPayoutCents,
      subsidyCents: 0,
      status: "confirmed",
    },
  });
  const conversation = await prisma.conversation.create({
    data: {
      id: "conv_seed",
      bookingId: booking.id,
      spotId: "spot_hengfu",
      participants: { create: [{ userId: "usr_zhou" }, { userId: "usr_lin" }] },
      messages: {
        create: [
          { senderId: "usr_zhou", body: "你好，明天白天我想停一下，地库入口在哪一侧？" },
          { senderId: "usr_lin", body: "从衡复路的人行闸机进来，下到 B2 靠墙那一排，编号 086。进场前把车牌发我。" },
        ],
      },
    },
  });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  await prisma.parkingReport.create({
    data: {
      id: "rpt_disney",
      userId: "usr_zhou",
      payload: JSON.stringify({
        name: "迪士尼北地面停车场",
        city: "上海",
        district: "浦东新区",
        address: "申迪西路北侧地面停车场",
        lat: 31.1452,
        lng: 121.6564,
        hourlyPrice: 1000,
        firstHourPrice: 1000,
        dailyCap: 8000,
        monthlyPrice: null,
        freeMinutes: 0,
        feeNote: "用户上报：约每小时 10 元，日封顶大约 80 元，以现场公示为准。",
        allowVisitor: "yes",
        totalSpots: 400,
        fixedSpots: 0,
        flexibleSpots: 400,
        availableSpots: 120,
        openHours: "07:00-23:00",
        lotType: "ground",
        evChargers: 20,
        heightLimitM: null,
        paymentMethods: "微信,支付宝",
        phone: "",
        reservable: false,
        nightOpen: false,
        accessibleSpots: 6,
        rules: "节假日可能限流。",
        operatorName: "",
        source: "user",
        externalId: "",
        lotId: "",
      }),
    },
  });

  await prisma.adBanner.createMany({
    data: [
      { id: "ad_night", title: "夜间档这周多了几条", subtitle: "把晚上空着的车位单独租出去，不用绑一整天。", href: "/market?mode=night", active: true, placement: "home" },
      { id: "ad_sample", title: "广告位示例", subtitle: "正式合作前这里只放平台自己的说明，不会跳去外部。", href: "/rules", active: false, placement: "home" },
    ],
  });

  console.log("位享演示数据已写入。账号密码都是 Weixiang#2026");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
