export async function onRequestPost(context) {
    try {
        // 1. Parse incoming user text from frontend
        const body = await context.request.json();
        const userMessage = body.message;

        // 2. Fall back to your raw tunnel link if configured, or use localhost for local testing
        // Strip trailing slash if it exists, then append /api/chat safely
        let base_url = context.env.OLLAMA_API_URL || 'http://localhost:11434';
        if (base_url.endsWith('/')) base_url = base_url.slice(0, -1);
        
        // If your URL variable didn't already include the path, append it
        const targetUrl = base_url.includes('/api/chat') ? base_url : `${base_url}/api/chat`;

        // 3. Construct payload exactly how Ollama requires it
        const payload = {
            model: context.env.OLLAMA_MODEL || "llama3.2:1b", // Matches your local model pull
            messages: [
                { 
                    role: "system", 
                    content: "You are an AI assistant representing Abhinav, an MCA student and AI developer. Answer briefly and professionally about his projects like TruthLens and AI Study Buddy." 
                },
                { role: "user", content: userMessage }
            ],
            stream: false
        };

        // 4. Forward request through the tunnel straight to your machine
        const headers = { 'Content-Type': 'application/json' };
        
        // Optional: If you ever decide to set a custom header key for your tunnel, include it here
        if (context.env.OLLAMA_API_KEY) {
            headers['Authorization'] = `Bearer ${context.env.OLLAMA_API_KEY}`;
        }

        const ollamaResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama API error status: ${ollamaResponse.status}`);
        }

        const ollamaData = await ollamaResponse.json();
        const replyText = ollamaData.message?.content || "Sorry, I couldn't generate a response.";

        // 5. Send the text output back to the UI
        return new Response(JSON.stringify({ reply: replyText }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ reply: `Error connecting to your machine: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}