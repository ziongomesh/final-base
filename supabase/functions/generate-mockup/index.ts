import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, scene } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Imagem não fornecida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const scenePrompts: Record<string, string> = {
      wood: "Place this document flat on a beautiful dark polished wooden desk/table surface. The document should look like a real physical card laying on the table. Add realistic soft natural lighting coming from a window on the left side, with gentle warm shadows under and around the document. Add subtle reflections on the polished wood. The scene should look like a professional photograph taken from slightly above. Make it ultra photorealistic, like a DSLR photo with shallow depth of field. The wood grain should be visible and detailed. Add maybe a pen or glasses subtly blurred in the background for realism.",
      marble: "Place this document flat on an elegant white/grey marble surface. The document should look like a real physical card laying on the marble. Add realistic soft studio lighting with gentle shadows. The marble veins should be visible. Ultra photorealistic, like a professional product photo. Shallow depth of field.",
      leather: "Place this document flat on a premium dark brown leather desk pad/surface. The document should look like a real physical card. Add warm ambient lighting with soft shadows. The leather texture should be detailed and realistic. Ultra photorealistic DSLR quality photo.",
      concrete: "Place this document flat on a modern concrete/cement surface. Industrial aesthetic. The document should look like a real physical card. Cool toned lighting with sharp shadows. Ultra photorealistic.",
      plastic: "Place this document inside a transparent plastic sleeve/holder/protector, like a clear plastic ID badge holder or document protector. The plastic should have realistic reflections, slight wrinkles, and light glare. Then make the document look old, worn, and aged — with yellowed edges, slight creases, faded colors, and minor scratches/scuffs on the plastic. The plastic sleeve should have fingerprint smudges and light scratches. Place it on a simple surface. Ultra photorealistic DSLR photo quality. The aging effect should be subtle but noticeable — like a document that has been carried in a wallet for years.",
    };

    const prompt = scenePrompts[scene] || scenePrompts.wood;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar mockup" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response keys:", JSON.stringify(Object.keys(data)));
    console.log("AI choices:", JSON.stringify(data.choices?.[0]?.message ? Object.keys(data.choices[0].message) : "no message"));
    
    // Try multiple paths to find the image
    let resultImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!resultImage) {
      // Try inline_data format
      resultImage = data.choices?.[0]?.message?.images?.[0]?.url;
    }
    
    if (!resultImage) {
      // Check content array for image parts
      const content = data.choices?.[0]?.message?.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          if (part.type === "image_url" && part.image_url?.url) {
            resultImage = part.image_url.url;
            break;
          }
          if (part.type === "image" && part.url) {
            resultImage = part.url;
            break;
          }
        }
      }
    }

    if (!resultImage) {
      console.error("No image in response. Full response:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Não foi possível gerar o mockup. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, image: resultImage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-mockup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
