const CEDA_BASE_URL = "https://api.ceda.ashoka.edu.in/v1";

export type CedaConnectionResult = {
  ok: boolean;
  status: number;
};

export async function verifyCedaConnection(token: string): Promise<CedaConnectionResult> {
  const response = await fetch(`${CEDA_BASE_URL}/agmarknet/commodities`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { ok: response.ok, status: response.status };
}

export async function getRegionalWeather(latitude = 13.136, longitude = 78.133) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
    timezone: "Asia/Kolkata",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error("Weather data is temporarily unavailable.");
  return response.json();
}

type CedaCommodity = { commodity_id: number; commodity_name: string };
type CedaGeography = { state_id: number; state_name: string; districts?: { district_id: number; district_name: string }[] };
type CedaPrice = { date: string; modal_price: number; min_price: number; max_price: number };

function cedaHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function getTomatoMandiSnapshot(token: string) {
  const catalogResponse = await fetch(`${CEDA_BASE_URL}/agmarknet/commodities`, { headers: cedaHeaders(token) });
  if (!catalogResponse.ok) throw new Error("Mandi commodity catalogue is temporarily unavailable.");
  const catalog = await catalogResponse.json() as { commodities?: CedaCommodity[] };
  const tomato = catalog.commodities?.find(item => item.commodity_name.toLowerCase().includes("tomato"));
  if (!tomato) return null;

  const geographyResponse = await fetch(`${CEDA_BASE_URL}/agmarknet/geographies?commodity_id=${tomato.commodity_id}`, { headers: cedaHeaders(token) });
  if (!geographyResponse.ok) return null;
  const geography = await geographyResponse.json() as { geographies?: CedaGeography[] };
  const karnataka = geography.geographies?.find(item => item.state_name.toLowerCase() === "karnataka");
  const kolar = karnataka?.districts?.find(item => item.district_name.toLowerCase() === "kolar");
  if (!karnataka || !kolar) return null;

  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 14);
  const response = await fetch(`${CEDA_BASE_URL}/agmarknet/prices`, {
    method: "POST",
    headers: cedaHeaders(token),
    body: JSON.stringify({
      commodity_id: tomato.commodity_id,
      state_id: karnataka.state_id,
      district_id: [kolar.district_id],
      from_date: from.toISOString().slice(0, 10),
      to_date: today.toISOString().slice(0, 10),
    }),
  });
  if (!response.ok) return null;
  const payload = await response.json() as { data?: CedaPrice[] };
  const latest = payload.data?.at(-1);
  if (!latest) return null;
  return {
    date: latest.date,
    // CEDA returns INR/quintal; the marketplace UI compares INR/kg.
    modalPerKg: Number((latest.modal_price / 100).toFixed(2)),
    lowPerKg: Number((latest.min_price / 100).toFixed(2)),
    highPerKg: Number((latest.max_price / 100).toFixed(2)),
  };
}

export async function getRegionalSignals() {
  const [weatherResult, mandiResult] = await Promise.allSettled([
    getRegionalWeather(),
    getTomatoMandiSnapshot(process.env.CEDA_API_TOKEN || ""),
  ]);
  const weather = weatherResult.status === "fulfilled" ? weatherResult.value as { current?: { temperature_2m?: number; precipitation?: number; wind_speed_10m?: number; weather_code?: number } } : null;
  const mandi = mandiResult.status === "fulfilled" ? mandiResult.value : null;

  return {
    weather: weather?.current ? {
      temperatureC: weather.current.temperature_2m ?? null,
      precipitationMm: weather.current.precipitation ?? null,
      windKph: weather.current.wind_speed_10m ?? null,
      code: weather.current.weather_code ?? null,
      source: "Open-Meteo live forecast",
    } : null,
    mandi: mandi ? { ...mandi, source: "CEDA Agmarknet" } : null,
    generatedAt: new Date().toISOString(),
  };
}
