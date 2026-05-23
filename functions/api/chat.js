export async function onRequestPost(context) {
    try {
        // 1. Get the incoming text from your portfolio UI frontend
        const body = await context.request.json();
        const userMessage = body.message;

        // 2. Setup Rate Limiting Metrics
        const MAX_REQUESTS = 5;       // Messages allowed
        const WINDOW_SECONDS = 60;    // Within 60 seconds
        
        // Fetch the user's IP to know who is texting the bot
        const userIp = context.request.headers.get("cf-connecting-ip") || "anonymous";
        const kvKey = `rate_limit:${userIp}`;

        // Verify that your KV storage was linked in the dashboard
        if (!context.env.RATELIMIT_KV) {
            return Response.json({ reply: "Database Error: Missing RATELIMIT_KV dashboard binding." }, { status: 500 });
        }

        // Evaluate user counts in the database
        let currentRequests = await context.env.RATELIMIT_KV.get(kvKey);
        
        if (currentRequests !== null) {
            currentRequests = parseInt(currentRequests, 10);
            if (currentRequests >= MAX_REQUESTS) {
                return Response.json({ 
                    reply: "Slow down a bit! You've sent too many messages. Please try again in a minute." 
                }, { status: 429 });
            }
            // Increment visitor message count
            await context.env.RATELIMIT_KV.put(kvKey, (currentRequests + 1).toString(), { expirationTtl: WINDOW_SECONDS });
        } else {
            // First message in this window frame, set to 1
            await context.env.RATELIMIT_KV.put(kvKey, "1", { expirationTtl: WINDOW_SECONDS });
        }

        // 3. Chat Style Input (Adapted from your boilerplate template)
        const chatInput = {
            messages: [
                { 
                    role: 'system', 
                    content: 'You are an AI portfolio assistant for Abhinav, an MCA student and AI Developer. Answer briefly and professionally about his projects like TruthLens and AI Study Buddy.' 
                },
                { role: 'user', content: userMessage }
            ]
        };

        // Run the Llama model on Cloudflare's free GPU matrix using your workspace binding
        // Using the high-quality @cf/meta/llama-3-8b-instruct from your template
        const aiResponse = await context.env.AI.run('@cf/meta/llama-3-8b-instruct', chatInput);
        
        // Grab the response text cleanly
        const replyText = aiResponse.response || "Sorry, I couldn't formulate a response right now.";

        // 4. Return clean JSON back to your glassmorphic UI container
        return Response.json({ reply: replyText });

    } catch (error) {
        // Fallback catch block to display accurate details if a network request breaks
        return Response.json({ reply: `System Error: ${error.message}` }, { status: 500 });
    }
}