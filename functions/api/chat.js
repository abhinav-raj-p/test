export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const userMessage = body.message;

        // Calls Cloudflare's natively hosted Llama 3.2 model inside your free tier account
        const payload = {
            messages: [
                { role: "system", content: "You are a helpful portfolio assistant for Abhinav, an AI Developer and MCA student." },
                { role: "user", content: userMessage }
            ]
        };

        // This runs instantly on Cloudflare's global edge infrastructure
        const aiResponse = await context.env.AI.run("@cf/meta/llama-3.2-3b-instruct", payload);
        const replyText = aiResponse.response || "Sorry, I couldn't process that.";

        return new Response(JSON.stringify({ reply: replyText }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ reply: `Cloudflare Workers AI Error: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}