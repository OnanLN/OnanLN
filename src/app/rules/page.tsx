import Link from "next/link";
import { FEE_RATE, POINT_CENTS, REPORT_POINTS, WELCOME_POINTS } from "@/lib/constants";

export const metadata = { title: "规则" };

export default function RulesPage() {
  return (
    <div className="page narrow">
      <p className="eyebrow">House rules</p>
      <h2 style={{ fontSize: 46, marginBottom: 12 }}>把账说在租之前。</h2>
      <div className="stack">
        <section className="card" style={{ padding: 18 }}>
          <h3>一个人可以同时是三种角色</h3>
          <p>找公共停车场、把自家空车位租出去、租别人的车位，用的是同一个账号。注册送 {WELCOME_POINTS} 积分。</p>
        </section>
        <section className="card" style={{ padding: 18 }}>
          <h3>时间可以切得很细</h3>
          <p>按小时，精确到整点。白天和夜间可以拆开卖，默认白天 08:00–20:00、夜间 20:00–次日 08:00，房东也能改。还可以按月、按年，或者把春节、国庆、跨年收成一整段，中途不加人。</p>
        </section>
        <section className="card" style={{ padding: 18 }}>
          <h3>钱和积分</h3>
          <p>平台向车主收取租金的 {Math.round(FEE_RATE * 100)}% 作为服务费。{100 / POINT_CENTS} 积分抵 1 元。租客用积分少付的现金，由平台补贴给车主，车主不会因为对方用积分而少收。上报停车场并通过审核，记 {REPORT_POINTS} 积分。</p>
          <p>这一版先把订单和金额记下来。微信支付接上之后，现金部分才会自动扣款。</p>
        </section>
        <section className="card" style={{ padding: 18 }}>
          <h3>一个网络地址</h3>
          <p>同一账号同一时间只能在一个网络地址下使用。同一台电脑开多个窗口可以，因为它们走的是同一个地址。换到新的网络，先退出，或用邮箱验证码把登录改过来。忘记密码也走邮箱验证码。</p>
        </section>
        <section className="card" style={{ padding: 18 }}>
          <h3>资料从哪来</h3>
          <p>公共停车场优先来自后台收录和用户上报。配置了高德、百度或腾讯地图的开放平台密钥后，搜索目的地时会补上官方接口返回的停车场，但收费和余位仍要人来补。位享不爬这些 App 的页面。</p>
          <p>车场若要回传实时余位，调用 <code>POST /api/open/availability</code>，带上在后台登记的 externalId。</p>
        </section>
        <section className="card" style={{ padding: 18 }}>
          <h3>取消</h3>
          <p>订单开始前，房东或租客都可以取消，用掉的积分会退回。已经开始的订单这一版不能在线上取消。</p>
        </section>
      </div>
      <p className="footer-note">车位信息由房东和用户提供。下单前请自行核实权属、通行条件和收费。位享是信息与预订服务，不代替停车场经营。</p>
      <p><Link className="btn btn-ink" href="/">去找车位</Link></p>
    </div>
  );
}
