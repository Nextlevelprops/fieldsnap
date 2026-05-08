import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Use imagescript which is pure Deno/WASM - no native deps needed
    const { Image } = await import("https://deno.land/x/imagescript@1.2.15/mod.ts")
    
    const decoded = await Image.decode(uint8Array)
    const jpeg = await decoded.encodeJPEG(85)

    return new Response(jpeg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/jpeg",
      },
    });
  } catch (err: any) {
    console.error("Conversion error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
