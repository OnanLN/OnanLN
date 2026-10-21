import type { DatabaseSync } from "node:sqlite";

type SeedUser = { phone: string; nickname: string; bio: string };
type SeedGuide = {
  author: string;
  title: string;
  destination: string;
  region: string;
  summary: string;
  content: string;
  lat: number;
  lng: number;
  coverTheme: string;
  tags: string[];
  days: number;
  season: string;
  budget: string;
  daysAgo: number;
};
type SeedComment = {
  author: string;
  body: string;
  hoursAgo: number;
  replies?: SeedComment[];
};

const USERS: SeedUser[] = [
  { phone: "13800000001", nickname: "林夏", bio: "喜欢把行程排松，走路比赶景点重要。" },
  { phone: "13800000002", nickname: "阿野", bio: "胶片、红眼航班，和清晨还没有人的寺庙。" },
  { phone: "13800000003", nickname: "周予安", bio: "一座城市先吃早餐，再决定要不要看景点。" },
  { phone: "13800000004", nickname: "苏小满", bio: "高原反应恢复中，仍然会再去一次。" },
  { phone: "13800000005", nickname: "北岛", bio: "海边长大，走路会不自觉地迎着风。" },
  { phone: "13800000006", nickname: "陈麦", bio: "把火车时刻表当成睡前读物的人。" },
];

const GUIDES: SeedGuide[] = [
  {
    author: "13800000001",
    title: "洱海西岸慢慢骑的三天",
    destination: "大理",
    region: "云南",
    summary: "古城只留一个傍晚，把最好的体力给环海西路、喜洲和一段什么都不安排的下午。",
    days: 3,
    season: "春秋最舒服",
    budget: "人均 1600–2400 元",
    lat: 25.6939,
    lng: 100.1634,
    coverTheme: "lake",
    tags: ["骑行", "古城", "湖泊"],
    daysAgo: 1,
    content: `## 怎么去
昆明南站乘高铁到大理站，大约两小时。出站不必急着打车进古城，旅游专线公交会停在古城南门附近，更不容易被绕路。落地大理凤仪机场的话，先乘机场大巴到下关再换乘。

## 怎么玩
三天足够，不必把日程排满。第一天把行李放进客栈，从南门走进人民路，先穿小巷，傍晚再上城楼看洱海那一侧的天色。第二天租电瓶车走环海西路，从才村经喜洲到周城；回程如果逆风，把车放上回城的小巴。第三天留给苍山脚下一座安静的院子，或者什么都不安排。

## 吃什么
喜洲粑粑只买现烤的，纸袋发烫才算数，凉了会又硬又油。白族酸辣鱼先问清按条还是按斤。古城夜里的烤乳扇可以试一块，套餐里的大拼盘通常不值。早晨一碗饵丝，比网红咖啡更像本地人的开始。

## 花费与避坑
淡季一间干净客栈大约 150 到 300 元。电瓶车日租先问清还车点和超时规则，还车时拍下电量。洱海生态廊道对部分车辆有限制，租车前把路线给店主看一眼。海边旅拍和无人机跟拍，价格先写在纸上再出发。`,
  },
  {
    author: "13800000002",
    title: "京都四日，把人潮错开",
    destination: "京都",
    region: "日本",
    summary: "东山、伏见稻荷和岚山不要挤在同一个下午。巴士比地铁更有用，清晨比滤镜更重要。",
    days: 4,
    season: "三月或十一月",
    budget: "人均 5000–8000 元",
    lat: 35.013,
    lng: 135.6775,
    coverTheme: "oldtown",
    tags: ["寺庙", "步行", "季节"],
    daysAgo: 3,
    content: `## 怎么去
关西机场有火车直达京都站。市内买一日巴士券，比每趟纠结要不要打车轻松。地铁覆盖有限，很多寺庙靠巴士或走路。

## 怎么玩
四个白天可以很从容。第一天只走东山：清晨的清水寺和二年坂，把伏见稻荷留给第二天早上七点前。岚山单独给一天，先看渡月桥，再往竹林的反方向走，人会少一些。第四天去博物馆，或干脆坐在鸭川边。金阁寺远看就完成了，不必在园里绕太久。

## 吃什么
早餐交给面包店或便利店，把胃留给中午的定食。汤豆腐和怀石需要预约，临时走进去的旅游套餐通常一般。拉面如果排队超过四十分钟，就换一条街。便利店饭团会反复吃到，不是将就。

## 花费与避坑
巴士前门上车、后门下车。小寺庙可能不收卡，现金和交通卡都留一点。樱花和红叶季的住宿要早很多才订得到。拍照不要站在巷子正中，后面还有要上班的人。`,
  },
  {
    author: "13800000004",
    title: "喀纳斯，把返程单独留出来",
    destination: "喀纳斯",
    region: "新疆",
    summary: "禾木、喀纳斯湖和白哈巴不要合成一天。这趟最贵的是时间被返程航班吃掉。",
    days: 5,
    season: "九月",
    budget: "人均 3000–5000 元",
    lat: 48.696,
    lng: 87.021,
    coverTheme: "forest",
    tags: ["秋色", "公路", "湖泊"],
    daysAgo: 6,
    content: `## 怎么去
先飞布尔津或喀纳斯机场，再乘区间车进景区。自驾看起来自由，景区内往往仍要换成景区交通，不要把行程算成车能开到湖边。

## 怎么玩
至少留三个完整的白天给禾木、喀纳斯湖和白哈巴。湖上的车要早，下午的光会把水面拍平。禾木的房子清晨有炊烟，九点以后就变成背景墙。第五天只留给往返，不要把返程航班订在离开景区的同一天晚上。

## 吃什么
景区餐食简单，把期待放低，饼干、巧克力和保温杯带够。布尔津的冷水鱼可以在进景区前吃一顿。进了禾木，不要为了找餐厅耽误清晨。

## 花费与避坑
区间车、门票和住宿会一项项加上去，这是一份不便宜的清单。九月底夜里会到零下，好看的外套替代不了帽子和手套。无人机在很多点位不能飞，先问再拿出来。`,
  },
  {
    author: "13800000003",
    title: "成都周末：熊猫、茶馆和一碗早餐",
    destination: "成都",
    region: "四川",
    summary: "早点进熊猫基地，下午把时间交给人民公园。锦里看到门口就可以离开。",
    days: 2,
    season: "全年都行",
    budget: "人均 800–1400 元",
    lat: 30.6698,
    lng: 104.043,
    coverTheme: "market",
    tags: ["美食", "城市", "熊猫"],
    daysAgo: 8,
    content: `## 怎么去
双流或天府机场都有地铁进城。市中心步行和地铁足够，不要租车。宽窄巷子、人民公园、玉林，一个周末走完刚刚好。

## 怎么玩
第一天上午七点半前到熊猫基地西门，先看月亮产房再往回走，十点后人会从照片里溢出来。下午去人民公园鹤鸣茶社，点一杯茉莉，看本地人掏耳朵、甩牌。第二天早晨到玉林买豆浆油条，再去浣花溪。武侯祠值得进，锦里走到门口看一眼就可以离开。

## 吃什么
火锅不必只认最辣的那一档。钟水饺和赖汤圆是游客路线，但赖汤圆的黑芝麻值得专门走一趟。小酒馆一带的串串先问清论签还是论斤。早餐的甜水面和蛋烘糕，比网红锅盔更成都。

## 花费与避坑
熊猫基地门票和观光车分开算，早去可以不坐车。茶馆消费不高，拍照跟拍和“免费算命”都不要接。辣得受不了时要一碗冰粉，不是再加一瓶可乐。`,
  },
  {
    author: "13800000006",
    title: "阳朔，西街边缘和一条江",
    destination: "阳朔",
    region: "广西",
    summary: "住在西街边上而不是最里面。十里画廊自己骑，遇龙河的竹筏先把价格写下来。",
    days: 3,
    season: "春秋最舒服",
    budget: "人均 1200–2000 元",
    lat: 24.7786,
    lng: 110.4963,
    coverTheme: "river",
    tags: ["山水", "骑行", "船"],
    daysAgo: 11,
    content: `## 怎么去
高铁到阳朔站，县城不大，共享电瓶车或自行车就能把西街和十里画廊连起来。从桂林市区出发，也有大巴直达。

## 怎么玩
第一天住在西街边缘。吵的是中心，安静的是往江边再走两百米。下午骑车去十里画廊。遇龙河的竹筏看当天水情，不要被景区门口第一个拉客的人定死价格。第二天早起看兴坪或相公山的轮廓，下午留白。腿还舒服的话，第三天再走一段江边，而不是再排一次网红漂流。

## 吃什么
啤酒鱼是招牌，也是最容易吃亏的菜。问清按条还是按斤，上桌前看鱼。田螺和艾叶粑更不容易踩坑。夜里西街可以喝一杯，街头表演一看到收费就退出来。

## 花费与避坑
骑行带上水。竹筏价格先写下来再上船。夏天骤雨很常见，手机放进防水袋。`,
  },
  {
    author: "13800000004",
    title: "稻城亚丁，第一天不要进山",
    destination: "亚丁",
    region: "四川",
    summary: "降落当天只用来适应海拔。牛奶海的天气变了就回头，山会留在那里。",
    days: 4,
    season: "十月",
    budget: "人均 2500–4000 元",
    lat: 28.429,
    lng: 100.348,
    coverTheme: "mountain",
    tags: ["高原", "徒步", "摄影"],
    daysAgo: 15,
    content: `## 怎么去
飞到稻城亚丁机场最省身体。从成都坐长途车或自驾也能到，但体力会耗在路上。机场到景区还有一段车程，不要把降落当天排进山。

## 怎么玩
第一天留在香格里拉镇慢慢走。第二天再进长穿沟或走短线，头疼就停下。牛奶海和五色海是高海拔路线，天气变了就回头。留一个整天给返程，红眼衔接最容易出事。

## 吃什么
食欲下降是海拔，不是你不饿。面条、粥和糖果比一顿很油的晚餐更容易吃下去。镇上的藏餐可以试，辣和酒留到下山以后。

## 花费与避坑
门票和观光车是两笔钱。走路慢是正常的。太阳很晒，风很硬。出现严重头痛、呕吐或走路不稳，就下降海拔，不要在山里硬扛一夜。`,
  },
  {
    author: "13800000006",
    title: "敦煌：先预约洞窟，再去看沙子",
    destination: "敦煌",
    region: "甘肃",
    summary: "莫高窟按场次进，鸣沙山留到傍晚。市区、洞窟和沙漠在三个方向，不要排进同一个小时。",
    days: 3,
    season: "五月或九月",
    budget: "人均 1800–2800 元",
    lat: 40.0916,
    lng: 94.6688,
    coverTheme: "desert",
    tags: ["沙漠", "石窟", "星空"],
    daysAgo: 18,
    content: `## 怎么去
飞机或火车到敦煌市区。莫高窟和鸣沙山在不同方向，不要安排在相邻的一个小时里。市区打车不贵，景区之间可以拼车，先说好往返。

## 怎么玩
莫高窟一定要预约。数字展示中心的电影是参观的一部分。洞窟里不能拍照，把手机放进包里，眼睛就自由了。鸣沙山留到傍晚，中午的沙会烫脚。月牙泉看水就好。骑骆驼先问清路线和时间。第三天如果还有力气，阳关或玉门关选一个，不要两个都赶。

## 吃什么
市区的驴肉黄面和杏皮水是本地口味，景区里的餐只当补充。水果带上，干燥会比饿更先找到你。夜市可以逛，价格先问。

## 花费与避坑
莫高窟的票有场次，过时进不去。沙漠里风大，帽子要有带子。滑沙之前把相机收好，沙子会灌进鞋子和镜头。`,
  },
  {
    author: "13800000005",
    title: "鼓浪屿只带双肩包",
    destination: "鼓浪屿",
    region: "福建",
    summary: "岛上没有车，行李箱会拖着你走完所有坡。住在岛上或住在厦门本岛，两种走法都可以。",
    days: 2,
    season: "春秋最舒服",
    budget: "人均 1000–1800 元",
    lat: 24.4477,
    lng: 118.0669,
    coverTheme: "coast",
    tags: ["海岛", "步行", "老别墅"],
    daysAgo: 22,
    content: `## 怎么去
先到厦门轮渡码头，坐船大约二十分钟。岛上没有机动车。行李箱能寄存在码头，就不要带上岛。

## 怎么玩
两天足够。第一天避开龙头路最挤的时候，往内厝澳和港仔后走，老别墅好看在院子里。第二天早晨去海边看船，再决定要不要进收费花园。日光岩值得上去一次，下午会很晒。晚饭可以回厦门本岛，不必都留在岛上。

## 吃什么
馅饼和海蛎煎是游客标配。海蛎煎要看锅里有没有真的海蛎。认真吃海鲜，去本岛的中山路或八市，问清是不是按斤，再让厨房动刀。

## 花费与避坑
普通船票完全够用。岛上住宿又贵又多坡，住在本岛、两天来回也很合理。窄路里的旅拍，摇头就好。`,
  },
  {
    author: "13800000005",
    title: "青岛的风比景点先到",
    destination: "青岛",
    region: "山东",
    summary: "栈桥、信号山和八大关用一天步行串起来。海鲜按斤称，加工费单独问。",
    days: 2,
    season: "六月到十月",
    budget: "人均 900–1600 元",
    lat: 36.0606,
    lng: 120.319,
    coverTheme: "harbor",
    tags: ["海岸", "步行", "海鲜"],
    daysAgo: 28,
    content: `## 怎么去
飞机或高铁都到市区边缘。地铁 3 号线把栈桥、五四广场和八大关串起来。这座城市靠海，风大，行程按海边步行来估时。

## 怎么玩
第一天从栈桥走到小青岛，再上信号山看红瓦和海。下午去八大关，把公主楼当成街景里的一栋，而不是打卡任务的终点。第二天去浴场或小麦岛。夏天就下水，不是夏天就把时间留给啤酒和博物馆。

## 吃什么
辣炒蛤蜊、鲅鱼饺子、一瓶本地啤酒，这三样比任何景点都更像这座城市。螃蟹按斤称，加工费单独问。早晨可以喝羊肉汤，配烧饼。

## 花费与避坑
夏天不要把东西留在沙滩上。八大关里还有人住，院子不要闯。风大的日子，帽绳比墨镜重要。海边骑行走自行车道。`,
  },
  {
    author: "13800000001",
    title: "西湖半天，下雨也不要走",
    destination: "西湖",
    region: "浙江",
    summary: "断桥、白堤和苏堤够用一天。想安静就往茅家埠走，把湖滨让给来拍照的人。",
    days: 1,
    season: "春天和雨天",
    budget: "人均 300–700 元",
    lat: 30.255,
    lng: 120.148,
    coverTheme: "garden",
    tags: ["湖泊", "骑行", "城市"],
    daysAgo: 35,
    content: `## 怎么去
高铁到杭州东站，地铁到龙翔桥，步行就能看见湖。周末下午不要从市区打车扎进湖滨，车会在杨公堤上慢慢爬。

## 怎么玩
半天可以看完断桥、白堤和曲院风荷。一天可以把骑行加到苏堤和茅家埠。雷峰塔上去看一次轮廓就够。想安静，就往茅家埠和翁家山走。下雨天的西湖比晴天更值得留下来。

## 吃什么
片儿川、葱包桧、定胜糕，离开前吃到就对了。龙井虾仁如果点，问清是当季的茶还是去年的叶子。湖边的咖啡可以喝，但不要占掉走路的那一小时。

## 花费与避坑
西湖本身不收门票。共享单车在周末会被骑光，早一点拿。游船分手划和电动，手划更近水面。景区门口很贵的龙井可以不买。`,
  },
];

const COMMENTS: { guide: string; items: SeedComment[] }[] = [
  {
    guide: "大理",
    items: [
      {
        author: "13800000003",
        body: "喜洲粑粑那一段很准。我上次买到凉的，果然又硬又油。",
        hoursAgo: 5,
        replies: [
          {
            author: "13800000001",
            body: "要看摊主正在烤的那一笼，纸袋会烫手才对。",
            hoursAgo: 3,
            replies: [
              {
                author: "13800000002",
                body: "下次我按这个标准验收，凉的直接放回去。",
                hoursAgo: 1,
              },
            ],
          },
        ],
      },
      {
        author: "13800000005",
        body: "电动车记得拍还车时的电量，我在才村被多收过二十块。",
        hoursAgo: 8,
      },
    ],
  },
  {
    guide: "京都",
    items: [
      {
        author: "13800000001",
        body: "清晨寺庙这一条救了我。下午的伏见稻荷全是人，照片里只有后脑勺。",
        hoursAgo: 20,
        replies: [
          {
            author: "13800000002",
            body: "稻荷如果还想去，七点前站在鸟居下。日出那班巴士人就少很多。",
            hoursAgo: 16,
          },
        ],
      },
    ],
  },
  {
    guide: "喀纳斯",
    items: [
      {
        author: "13800000006",
        body: "九月底已经很冷，冲锋衣不够，我借了同伴的抓绒。",
        hoursAgo: 30,
        replies: [
          {
            author: "13800000004",
            body: "禾木夜里会到零下。帽子比好看的照片重要。",
            hoursAgo: 26,
          },
        ],
      },
    ],
  },
  {
    guide: "成都",
    items: [
      {
        author: "13800000002",
        body: "熊猫基地如果不早去，只能看背影。你写的七点半，我替后来的人谢谢你。",
        hoursAgo: 12,
      },
    ],
  },
  {
    guide: "亚丁",
    items: [
      {
        author: "13800000003",
        body: "第一天没进山是对的。我当时不信，结果在香格里拉镇的晚饭只喝完了一碗汤。",
        hoursAgo: 40,
      },
    ],
  },
];

function insertComment(
  db: DatabaseSync,
  users: Map<string, number>,
  guideId: number,
  comment: SeedComment,
  parentId: number | null,
  now: number,
) {
  const authorId = users.get(comment.author);
  if (!authorId) return;
  const createdAt = now - Math.round(comment.hoursAgo * 60 * 60 * 1000);
  const result = db
    .prepare(
      `INSERT INTO comments (guide_id, author_id, parent_id, body, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(guideId, authorId, parentId, comment.body, createdAt);
  const id = Number(result.lastInsertRowid);
  for (const reply of comment.replies ?? []) {
    insertComment(db, users, guideId, reply, id, now);
  }
}

export function seedIfEmpty(db: DatabaseSync) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = db.prepare("SELECT COUNT(*) AS n FROM guides").get() as { n: number } | undefined;
    if (Number(existing?.n ?? 0) > 0) {
      db.exec("COMMIT");
      return;
    }
    const users = new Map<string, number>();
    const insertUser = db.prepare(
      `INSERT INTO users (phone, nickname, bio, created_at) VALUES (?, ?, ?, ?)`,
    );
    for (const user of USERS) {
      const result = insertUser.run(user.phone, user.nickname, user.bio, now - 80 * day);
      users.set(user.phone, Number(result.lastInsertRowid));
    }

    const guideIds = new Map<string, number>();
    const insertGuide = db.prepare(
      `INSERT INTO guides (
        author_id, title, destination, region, summary, content, lat, lng, cover_theme,
        tags, days, season, budget, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const guide of GUIDES) {
      const authorId = users.get(guide.author);
      if (!authorId) continue;
      const createdAt = now - guide.daysAgo * day;
      const result = insertGuide.run(
        authorId,
        guide.title,
        guide.destination,
        guide.region,
        guide.summary,
        guide.content.trim(),
        guide.lat,
        guide.lng,
        guide.coverTheme,
        JSON.stringify(guide.tags),
        guide.days,
        guide.season,
        guide.budget,
        createdAt,
        createdAt,
      );
      guideIds.set(guide.destination, Number(result.lastInsertRowid));
    }

    for (const thread of COMMENTS) {
      const guideId = guideIds.get(thread.guide);
      if (!guideId) continue;
      for (const item of thread.items) insertComment(db, users, guideId, item, null, now);
    }

    const insertPresence = db.prepare(
      `INSERT INTO presences (user_id, lat, lng, label, precision, updated_at)
       VALUES (?, ?, ?, ?, 'fuzzy', ?)`,
    );
    const userId = (phone: string) => {
      const id = users.get(phone);
      if (!id) throw new Error(`缺少示范用户 ${phone}`);
      return id;
    };
    insertPresence.run(userId("13800000001"), 25.69, 100.16, "在古城南门附近", now - 25 * 60 * 1000);
    insertPresence.run(userId("13800000002"), 35.01, 135.78, "清水寺一带", now - 50 * 60 * 1000);
    insertPresence.run(userId("13800000003"), 30.67, 104.04, "在宽窄巷子喝茶", now - 15 * 60 * 1000);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
