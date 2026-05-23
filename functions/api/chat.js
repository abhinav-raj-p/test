export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const userMessage = body.message;

        // 1. Setup Rate Limiting Configuration
        const MAX_REQUESTS = 5;       // Max messages allowed
        const WINDOW_SECONDS = 60;    // Time window frame
        
        // Grab the user's anonymized IP address from Cloudflare's request metadata
        const userIp = context.request.headers.get("cf-connecting-ip") || "anonymous";
        const kvKey = `rate_limit:${userIp}`;

        // Ensure our newly bound KV storage is online
        if (!context.env.RATELIMIT_KV) {
            return new Response(JSON.stringify({ reply: "Database Configuration Error: Missing RATELIMIT_KV binding." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Evaluate Rate Limit
        let currentRequests = await context.env.RATELIMIT_KV.get(kvKey);
        
        if (currentRequests !== null) {
            currentRequests = parseInt(currentRequests, 10);
            if (currentRequests >= MAX_REQUESTS) {
                return new Response(JSON.stringify({ 
                    reply: "Slow down a bit! You've sent too many messages. Please try again in a minute." 
                }), {
                    status: 429, // Standard HTTP code for Too Many Requests
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            // Increment request count by 1
            await context.env.RATELIMIT_KV.put(kvKey, (currentRequests + 1).toString(), { expirationTtl: WINDOW_SECONDS });
        } else {
            // First time this IP is visiting within the active window, initialize to 1
            await context.env.RATELIMIT_KV.put(kvKey, "1", { expirationTtl: WINDOW_SECONDS });
        }

        // 3. If within limits, execute the Native Workers AI Llama model
        const payload = {
            messages: [
                { 
                    role: "system", 
                    content: "You are a helpful portfolio assistant for Abhinav, an AI Developer and MCA student. Answer briefly and professionally about his projects." 
                },
                { role: "user", content: userMessage }
            ]
        };

        const aiResponse = await context.env.AI.run("@cf/meta/llama-3.2-3b-instruct", payload);
        const replyText = aiResponse.response || "Sorry, I couldn't process that.";

        return new Response(JSON.stringify({ reply: replyText }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ reply: `System Error: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}