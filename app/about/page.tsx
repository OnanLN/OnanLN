import { Footer } from "@/components/Footer";
import { isDemoMode } from "@/lib/config";

export const metadata = { title: "关于途记" };

export default function AboutPage() {
  return (
    <div className="page-scroll" id="content">
      <article className="narrow prose">
        <p className="eyebrow">关于</p>
        <h1>途记把攻略留在地图上。</h1>
        <p>
          这是一个记录不同目的地旅行攻略的站点。你可以按手机号登录，写下怎么去、怎么玩、吃什么、要避开什么，再把那一个地点钉在地图上。别人不用先翻目录，打开地图就能看见。
        </p>
        <h2>留言可以再回复</h2>
        <p>每篇攻略下面都能留言。点「回复」会挂在那一条下面，而不是变成一条没有上下文的新留言。删掉自己的留言时，下面的回复会一起消失。</p>
        <h2>位置怎么共享</h2>
        <p>
          「我在这」只在你自己的屏幕上显示一个点，不会告诉别人。共享位置需要登录，并且由你打开开关。可以选择模糊到大约一公里，或使用精确位置。24 小时没有更新，这个点会从大家的地图上消失。
        </p>
        <h2>分享到微信和 QQ</h2>
        <p>
          每篇攻略可以复制链接，也可以分享到 QQ 和微博。微信里打开时，用右上角菜单发送给朋友；在普通浏览器里，途记会给出二维码。网页不能代替已认证公众号的分享卡片，那一步要等域名和公众号都准备好。
        </p>
        <h2>地图坐标</h2>
        <p>
          现在使用 OpenStreetMap 的公开底图，坐标是 GPS 通用的 WGS84。国内商业地图通常使用经过加密的 GCJ-02。面向国内用户正式运营时，应换成高德或腾讯地图，并做坐标转换。公开瓦片不适合大流量，上线前要换成自己的地图服务。
        </p>
        {isDemoMode() ? (
          <p>你现在看到的是演示环境。登录验证码会直接显示在页面上，不会发送短信，也不会产生短信费用。</p>
        ) : null}
        <Footer demo={isDemoMode()} />
      </article>
    </div>
  );
}
