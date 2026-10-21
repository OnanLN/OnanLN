"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/shell";
import { api } from "@/lib/client";
import { CITIES, REPORT_POINTS } from "@/lib/constants";

function yuan(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.round(number * 100);
}

export function ReportForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { me } = useSession();
  const [name, setName] = useState(params.get("name") || "");
  const [city, setCity] = useState(params.get("city") || "上海");
  const [district, setDistrict] = useState(params.get("district") || "");
  const [address, setAddress] = useState(params.get("address") || "");
  const [landmark, setLandmark] = useState("");
  const [lat, setLat] = useState(params.get("lat") || "");
  const [lng, setLng] = useState(params.get("lng") || "");
  const [allowVisitor, setAllowVisitor] = useState("unknown");
  const [hourly, setHourly] = useState("");
  const [firstHour, setFirstHour] = useState("");
  const [dailyCap, setDailyCap] = useState("");
  const [monthly, setMonthly] = useState("");
  const [freeMinutes, setFreeMinutes] = useState("0");
  const [feeNote, setFeeNote] = useState("");
  const [total, setTotal] = useState("");
  const [fixed, setFixed] = useState("");
  const [flexible, setFlexible] = useState("");
  const [available, setAvailable] = useState("");
  const [openHours, setOpenHours] = useState("全天");
  const [lotType, setLotType] = useState("underground");
  const [ev, setEv] = useState("0");
  const [height, setHeight] = useState("");
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [payment, setPayment] = useState("");
  const [rules, setRules] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [reservable, setReservable] = useState(false);
  const [nightOpen, setNightOpen] = useState(true);
  const [accessible, setAccessible] = useState("0");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const lotId = params.get("lotId") || "";
  const source = params.get("source") || (lotId ? "user" : "user");
  const externalId = params.get("externalId") || "";

  async function locate() {
    const result = await api<{ best: { lat: number; lng: number } | null; suggestions: { lat: number; lng: number }[]; live: { lat: number; lng: number } | null }>(`/api/geocode?q=${encodeURIComponent(landmark)}&city=${encodeURIComponent(city)}`);
    const hit = result.best || result.live || result.suggestions[0];
    if (!hit) setError("没有对上这个地标");
    else { setLat(String(hit.lat)); setLng(String(hit.lng)); setError(""); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!me) {
      router.push(`/login?next=${encodeURIComponent(`/report?${params.toString()}`)}`);
      return;
    }
    setError("");
    try {
      await api("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          lotId, name, city, district, address, lat: Number(lat), lng: Number(lng), allowVisitor,
          hourlyPrice: yuan(hourly), firstHourPrice: yuan(firstHour), dailyCap: yuan(dailyCap), monthlyPrice: yuan(monthly),
          freeMinutes: Number(freeMinutes || 0), feeNote, totalSpots: total, fixedSpots: fixed, flexibleSpots: flexible,
          availableSpots: available, openHours, lotType, evChargers: Number(ev || 0), heightLimitM: height,
          phone, paymentMethods: payment, rules, operatorName, reservable, nightOpen, accessibleSpots: Number(accessible || 0),
          source: source === "user" ? "user" : source, externalId,
        }),
      });
      setDone(`已经交到审核队列。通过后记 ${REPORT_POINTS} 积分，积分可以在租车位时抵扣。`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提交失败");
    }
  }

  return (
    <div className="page narrow">
      <p className="eyebrow">Report · 人肉数据也算数</p>
      <h2 style={{ fontSize: 42 }}>{lotId ? "更正一条停车场资料" : "上报一个停车场"}</h2>
      <p className="muted">审核通过记 {REPORT_POINTS} 积分。价格按元填写，留空表示你还不知道，不要猜。</p>
      <form className="card form-card" style={{ marginTop: 16 }} onSubmit={submit}>
        <label className="field"><span>名称</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <div className="grid-2">
          <label className="field"><span>城市</span><input list="cities" value={city} onChange={(event) => setCity(event.target.value)} /><datalist id="cities">{CITIES.map((item) => <option key={item} value={item} />)}</datalist></label>
          <label className="field"><span>区</span><input value={district} onChange={(event) => setDistrict(event.target.value)} /></label>
        </div>
        <label className="field"><span>地址</span><input value={address} onChange={(event) => setAddress(event.target.value)} /></label>
        <div className="search-row">
          <input value={landmark} onChange={(event) => setLandmark(event.target.value)} placeholder="用地标定位" aria-label="地标" />
          <button className="btn btn-ghost" type="button" onClick={locate}>定位</button>
        </div>
        <p className="muted">{lat && lng ? `坐标 ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : "还没有坐标"}</p>
        <div className="grid-2">
          <label className="field"><span>外来车辆</span>
            <select value={allowVisitor} onChange={(event) => setAllowVisitor(event.target.value)}>
              <option value="unknown">还不确定</option>
              <option value="yes">可以进</option>
              <option value="permit">需要登记</option>
              <option value="no">不让进</option>
            </select>
          </label>
          <label className="field"><span>类型</span>
            <select value={lotType} onChange={(event) => setLotType(event.target.value)}>
              <option value="underground">地下</option>
              <option value="ground">地面</option>
              <option value="roadside">路边</option>
              <option value="stereo">立体</option>
              <option value="mechanical">机械</option>
            </select>
          </label>
        </div>
        <div className="grid-2">
          <label className="field"><span>小时价（元）</span><input value={hourly} onChange={(event) => setHourly(event.target.value)} /></label>
          <label className="field"><span>首小时（元）</span><input value={firstHour} onChange={(event) => setFirstHour(event.target.value)} /></label>
          <label className="field"><span>日封顶（元）</span><input value={dailyCap} onChange={(event) => setDailyCap(event.target.value)} /></label>
          <label className="field"><span>月租参考（元）</span><input value={monthly} onChange={(event) => setMonthly(event.target.value)} /></label>
        </div>
        <label className="field"><span>收费说明</span><textarea value={feeNote} onChange={(event) => setFeeNote(event.target.value)} /></label>
        <div className="grid-2">
          <label className="field"><span>总车位，不确定可留空</span><input value={total} onChange={(event) => setTotal(event.target.value)} /></label>
          <label className="field"><span>固定车位</span><input value={fixed} onChange={(event) => setFixed(event.target.value)} /></label>
          <label className="field"><span>临停 / 非固定</span><input value={flexible} onChange={(event) => setFlexible(event.target.value)} /></label>
          <label className="field"><span>当前可用</span><input value={available} onChange={(event) => setAvailable(event.target.value)} /></label>
          <label className="field"><span>免费分钟</span><input value={freeMinutes} onChange={(event) => setFreeMinutes(event.target.value)} /></label>
          <label className="field"><span>营业时间</span><input value={openHours} onChange={(event) => setOpenHours(event.target.value)} /></label>
          <label className="field"><span>充电桩数量</span><input value={ev} onChange={(event) => setEv(event.target.value)} /></label>
          <label className="field"><span>限高（米）</span><input value={height} onChange={(event) => setHeight(event.target.value)} /></label>
          <label className="field"><span>无障碍车位</span><input value={accessible} onChange={(event) => setAccessible(event.target.value)} /></label>
          <label className="field"><span>电话</span><input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        </div>
        <label className="field"><span>支付方式</span><input value={payment} onChange={(event) => setPayment(event.target.value)} placeholder="微信、支付宝、上海停车" /></label>
        <label className="field"><span>管理方</span><input value={operatorName} onChange={(event) => setOperatorName(event.target.value)} /></label>
        <label className="field"><span>规则备注</span><textarea value={rules} onChange={(event) => setRules(event.target.value)} /></label>
        <label className="row"><input type="checkbox" checked={nightOpen} onChange={(event) => setNightOpen(event.target.checked)} /> 夜间开放</label>
        <label className="row"><input type="checkbox" checked={reservable} onChange={(event) => setReservable(event.target.checked)} /> 可以预约</label>
        {error ? <div className="alert alert-bad">{error}</div> : null}
        {done ? <div className="alert alert-ok">{done}</div> : null}
        <button className="btn btn-ink" type="submit">{me ? "提交审核" : "登录后提交"}</button>
      </form>
    </div>
  );
}
