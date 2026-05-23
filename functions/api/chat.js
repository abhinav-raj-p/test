export async function onRequestPost(context) {
    try {
        // 1. Extract the prompt sent from your portfolio UI frontend
        const body = await context.request.json();
        const userMessage = body.message;

        // 2. Grab your cloud keys from the secure production variables
        const OLLAMA_API_KEY = context.env.OLLAMA_API_KEY;
        const base_url = context.env.OLLAMA_API_URL || 'https://ollama.com';
        
        // Construct the cloud target endpoint route
        const targetUrl = `${base_url.replace(/\/$/, '')}/api/chat`;

        // Safety check: ensure your cloud variable is loading cleanly
        if (!OLLAMA_API_KEY) {
            return new Response(JSON.stringify({ reply: "Cloud Configuration Error: Missing OLLAMA_API_KEY in Cloudflare settings." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Build the cloud payload payload using cloud-accessible models (e.g. llama3.2)
        const payload = {
            model: context.env.OLLAMA_MODEL || "llama3.2", 
            messages: [
                { 
                    role: "system", 
                    content: "You are a helpful portfolio assistant for Abhinav, an AI Developer and MCA student. Answer briefly and professionally." 
                },
                { role: "user", content: userMessage }
            ],
            stream: false
        };

        // 4. Dispatch the request directly to Ollama's cloud infrastructure
        const ollamaResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OLLAMA_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama Cloud responded with error code: ${ollamaResponse.status}`);
        }

        const ollamaData = await ollamaResponse.json();
        const replyText = ollamaData.message?.content || "Sorry, I couldn't process a cloud response right now.";

        // 5. Send text stream response cleanly back to your portfolio UI component
        return new Response(JSON.stringify({ reply: replyText }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ reply: `Cloud Connection Error: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}