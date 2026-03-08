import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Horizon = "1D" | "7D";

interface PredictionPoint {
  dayLabel: string;
  price: number;
}

interface NearbyMandiPoint {
  name: string;
  distanceKm: number;
  targetPrice: number;
  extraPerQtl: number;
  netProfit: number;
  worthIt: boolean;
  reason?: string;
}

interface CandidateMandi {
  name: string;
  stateName?: string;
}

interface PredictionResponse {
  predictions: PredictionPoint[];
  baseMandi: string;
  nearbyMandis: NearbyMandiPoint[];
  model: string;
  confidence: "low" | "medium" | "high";
  summary: string;
}

interface RequestBody {
  crop?: string;
  mandi?: string;
  horizon?: Horizon;
  candidateMandis?: CandidateMandi[];
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash";

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function normalizePredictionsByContext(
  predictions: PredictionPoint[],
  crop: string,
  baseMandi: string,
): PredictionPoint[] {
  const seed = hashString(`${crop}|${baseMandi}`);
  const baseShift = (seed % 401) - 200; // -200 to +200
  const trendStep = ((seed >> 3) % 11) - 5; // -5 to +5
  const wiggle = 20 + ((seed >> 7) % 40); // 20 to 59

  return predictions.map((point, index) => {
    const directional = index * trendStep * 6;
    const wave = index % 2 === 0 ? wiggle : -wiggle;
    const adjustedPrice = Math.max(400, Math.round(point.price + baseShift + directional + wave));

    return {
      dayLabel: point.dayLabel || (index === 0 ? "Tomorrow" : `Day ${index + 1}`),
      price: adjustedPrice,
    };
  });
}

function buildFallbackPredictions(crop: string): PredictionPoint[] {
  const base = 2500 + (crop.length % 11) * 95;

  return Array.from({ length: 7 }, (_, index) => {
    const dayShift = index - 3;
    const price = Math.max(400, Math.round(base + dayShift * 42));

    return {
      dayLabel: index === 0 ? "Tomorrow" : `Day ${index + 1}`,
      price,
    };
  });
}

function buildFallbackNearbyMandis(
  baseMandi: string,
  basePrice: number,
  candidateMandis: CandidateMandi[],
): NearbyMandiPoint[] {
  const fallbackNames = ["Nearby APMC 1", "Nearby APMC 2", "Nearby APMC 3"];
  const normalizedCandidates = candidateMandis
    .filter((item) => typeof item?.name === "string" && item.name.trim().length > 0)
    .filter((item) => item.name.trim().toLowerCase() !== baseMandi.trim().toLowerCase());

  const options = [
    { name: normalizedCandidates[0]?.name || fallbackNames[0], distanceKm: 25, factor: 1.08 },
    { name: normalizedCandidates[1]?.name || fallbackNames[1], distanceKm: 40, factor: 0.97 },
    { name: normalizedCandidates[2]?.name || fallbackNames[2], distanceKm: 60, factor: 1.12 },
  ];
  const quantityQtl = 10;
  const transportPerKmPerQtl = 5;

  return options.map((option) => {
    const targetPrice = Math.max(1, Math.round(basePrice * option.factor));
    const extraPerQtl = targetPrice - basePrice;
    const netProfit = extraPerQtl * quantityQtl - option.distanceKm * transportPerKmPerQtl * quantityQtl;

    return {
      name: option.name === baseMandi ? `${option.name} (alt)` : option.name,
      distanceKm: option.distanceKm,
      targetPrice,
      extraPerQtl,
      netProfit,
      worthIt: netProfit > 0,
      reason: netProfit > 0
        ? "Higher effective return after transport"
        : "Transport and spread make this less profitable",
    };
  });
}

function parseModelPrediction(content: string): PredictionResponse | null {
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const jsonText = content.slice(firstBrace, lastBrace + 1);

  try {
    const parsed = JSON.parse(jsonText) as PredictionResponse;
    if (!Array.isArray(parsed.predictions) || parsed.predictions.length === 0) {
      return null;
    }

    const sanitizedPredictions = parsed.predictions.slice(0, 7).map((point, index) => ({
      dayLabel: point?.dayLabel || (index === 0 ? "Tomorrow" : `Day ${index + 1}`),
      price: Number.isFinite(point?.price) ? Math.max(1, Math.round(point.price)) : 0,
    }));

    if (sanitizedPredictions.some((point) => point.price <= 0)) {
      return null;
    }

    const baseMandi = typeof parsed.baseMandi === "string" && parsed.baseMandi.trim().length > 0
      ? parsed.baseMandi.trim()
      : "Your selected mandi";

    const tomorrowPrice = sanitizedPredictions[0].price;
    const sanitizedNearbyMandis: NearbyMandiPoint[] = Array.isArray(parsed.nearbyMandis)
      ? parsed.nearbyMandis.slice(0, 5).map((item, index) => {
        const name = typeof item?.name === "string" && item.name.trim().length > 0
          ? item.name.trim()
          : `Nearby mandi ${index + 1}`;
        const distanceKm = Number.isFinite(item?.distanceKm) ? Math.max(0, Math.round(item.distanceKm)) : 0;
        const targetPrice = Number.isFinite(item?.targetPrice) ? Math.max(1, Math.round(item.targetPrice)) : tomorrowPrice;
        const extraPerQtl = Number.isFinite(item?.extraPerQtl)
          ? Math.round(item.extraPerQtl)
          : targetPrice - tomorrowPrice;
        const netProfit = Number.isFinite(item?.netProfit)
          ? Math.round(item.netProfit)
          : extraPerQtl * 10 - distanceKm * 5 * 10;
        const worthIt = typeof item?.worthIt === "boolean" ? item.worthIt : netProfit > 0;

        return {
          name,
          distanceKm,
          targetPrice,
          extraPerQtl,
          netProfit,
          worthIt,
          reason: typeof item?.reason === "string" ? item.reason : undefined,
        };
      })
      : [];

    return {
      predictions: sanitizedPredictions,
      baseMandi,
      nearbyMandis: sanitizedNearbyMandis,
      confidence: parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
        ? parsed.confidence
        : "medium",
      summary: parsed.summary || "Forecast generated.",
      model: parsed.model || GEMINI_MODEL,
    };
  } catch {
    return null;
  }
}

function enforceCandidateMandis(
  items: NearbyMandiPoint[],
  candidateMandis: CandidateMandi[],
  baseMandi: string,
  tomorrowPrice: number,
): NearbyMandiPoint[] {
  const filteredCandidates = candidateMandis
    .map((item) => ({
      name: item?.name?.trim() || "",
      stateName: item?.stateName?.trim() || "",
    }))
    .filter((item) => item.name.length > 0)
    .filter((item) => item.name.toLowerCase() !== baseMandi.toLowerCase());

  if (filteredCandidates.length === 0) {
    return items.slice(0, 3);
  }

  const used = new Set<string>();
  const output: NearbyMandiPoint[] = [];

  for (let index = 0; index < Math.min(3, filteredCandidates.length); index += 1) {
    const candidate = filteredCandidates[index];
    const modelItem = items.find((item) => item.name.toLowerCase() === candidate.name.toLowerCase());
    const targetPrice = modelItem?.targetPrice ?? tomorrowPrice;
    const extraPerQtl = modelItem?.extraPerQtl ?? targetPrice - tomorrowPrice;
    const netProfit = modelItem?.netProfit ?? extraPerQtl * 10 - (modelItem?.distanceKm ?? 0) * 5 * 10;
    const distanceKm = modelItem?.distanceKm ?? 20 + index * 15;

    if (used.has(candidate.name.toLowerCase())) {
      continue;
    }

    used.add(candidate.name.toLowerCase());
    output.push({
      name: candidate.name,
      distanceKm,
      targetPrice,
      extraPerQtl,
      netProfit,
      worthIt: netProfit > 0,
      reason: modelItem?.reason,
    });
  }

  return output;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const crop = body.crop?.trim();
  const mandi = body.mandi?.trim();
  const horizon = body.horizon === "7D" ? "7D" : "1D";
  const candidateMandis = Array.isArray(body.candidateMandis) ? body.candidateMandis : [];

  if (!crop) {
    return new Response(
      JSON.stringify({ error: "crop is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    const fallback = buildFallbackPredictions(crop);
    const outputPredictions = horizon === "1D" ? fallback.slice(0, 1) : fallback;
    const baseMandiNameForMissingKey = mandi || "Your selected mandi";
    const fallbackNearbyMandis = buildFallbackNearbyMandis(
      baseMandiNameForMissingKey,
      fallback[0].price,
      candidateMandis,
    );

    return new Response(
      JSON.stringify({
        predictions: outputPredictions,
        baseMandi: baseMandiNameForMissingKey,
        nearbyMandis: enforceCandidateMandis(
          fallbackNearbyMandis,
          candidateMandis,
          baseMandiNameForMissingKey,
          fallback[0].price,
        ),
        confidence: "low",
        model: "local-fallback",
        summary: "Fallback estimate used because Gemini key is not configured.",
        error: "GEMINI_API_KEY is not configured",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const systemPrompt =
    "You are an agricultural price forecasting assistant for Indian mandi markets. Return only valid JSON with no markdown.";

  const baseMandiName = mandi || "Your selected mandi";
  const candidateListText = candidateMandis
    .filter((item) => typeof item?.name === "string" && item.name.trim().length > 0)
    .slice(0, 25)
    .map((item, index) => `${index + 1}. ${item.name}${item.stateName ? ` (${item.stateName})` : ""}`)
    .join("\n");

  const userPrompt =
    `Generate a complete crop intelligence output for crop '${crop}' and user mandi '${baseMandiName}'.\n` +
    "Requirements:\n" +
    "1) Create 7-day quintal price forecast in INR (dayLabel: Tomorrow, Day 2 ... Day 7).\n" +
    "2) Include mandi profit comparison against exactly 3 nearby mandis.\n" +
    "3) Use quantity assumption 10 qtl and transport cost 5 INR per km per qtl for net profit.\n" +
    "4) Ensure worthIt=true only when netProfit > 0.\n" +
    "5) Keep values realistic and avoid extreme volatility.\n" +
    "6) The output must change based on crop and mandi context; do not reuse fixed template numbers.\n" +
    "6) For nearbyMandis, you MUST choose names only from the candidate list below and never invent names.\n" +
    (candidateListText
      ? `Candidate nearby mandis:\n${candidateListText}\n`
      : "If no candidate list is provided, choose realistic nearby mandi names.\n") +
    "Return ONLY strict JSON with this schema:\n" +
    "{" +
    "\"predictions\":[{\"dayLabel\":\"Tomorrow\",\"price\":3200}]," +
    "\"baseMandi\":\"string\"," +
    "\"nearbyMandis\":[{" +
    "\"name\":\"string\"," +
    "\"distanceKm\":25," +
    "\"targetPrice\":3350," +
    "\"extraPerQtl\":150," +
    "\"netProfit\":2500," +
    "\"worthIt\":true," +
    "\"reason\":\"brief reason\"}]," +
    "\"confidence\":\"medium\"," +
    "\"summary\":\"short summary\"," +
    "\"model\":\"model-name\"}";

  try {
    const geminiResponse = await fetch(`${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini request failed: ${geminiResponse.status} ${errorText}`);
    }

    const geminiJson = await geminiResponse.json();
    const content = (geminiJson?.candidates?.[0]?.content?.parts ?? [])
      .map((part: { text?: string }) => part?.text ?? "")
      .join("\n")
      .trim();

    if (typeof content !== "string") {
      throw new Error("Model response missing content");
    }

    const parsed = parseModelPrediction(content);
    if (!parsed) {
      throw new Error("Failed to parse structured model response");
    }

    const contextPredictions = normalizePredictionsByContext(parsed.predictions, crop, baseMandiName);
    const outputPredictions = horizon === "1D" ? contextPredictions.slice(0, 1) : contextPredictions;
    const rawNearbyMandis = parsed.nearbyMandis.length > 0
      ? parsed.nearbyMandis
      : buildFallbackNearbyMandis(baseMandiName, contextPredictions[0].price, candidateMandis);
    const outputNearbyMandis = enforceCandidateMandis(
      rawNearbyMandis,
      candidateMandis,
      baseMandiName,
      contextPredictions[0].price,
    );

    return new Response(
      JSON.stringify({
        ...parsed,
        predictions: outputPredictions,
        baseMandi: parsed.baseMandi || baseMandiName,
        nearbyMandis: outputNearbyMandis,
        model: GEMINI_MODEL,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const fallback = buildFallbackPredictions(crop);
    const outputPredictions = horizon === "1D" ? fallback.slice(0, 1) : fallback;
    const fallbackNearbyMandis = buildFallbackNearbyMandis(baseMandiName, fallback[0].price, candidateMandis);
    const rawErrorMessage = error instanceof Error ? error.message : "Unknown error";
    const publicErrorMessage = rawErrorMessage.includes("429")
      ? "Gemini quota exceeded. Please enable billing/quota and retry."
      : "Gemini is temporarily unavailable. Please retry.";

    return new Response(
      JSON.stringify({
        predictions: outputPredictions,
        baseMandi: baseMandiName,
        nearbyMandis: enforceCandidateMandis(fallbackNearbyMandis, candidateMandis, baseMandiName, fallback[0].price),
        confidence: "low",
        model: `${GEMINI_MODEL}-fallback`,
        summary: "Fallback estimate used due to temporary model issue.",
        error: publicErrorMessage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
