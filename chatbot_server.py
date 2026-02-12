from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)
CORS(app)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
)

SYSTEM_PROMPT = """You are Hala AI Assistant, a helpful chatbot for "Bangalore Sehri Finder" app. You help users find Sehri (pre-dawn meal) providers during Ramadan in Bangalore. 

Be friendly, concise, and helpful. Provide information about:
- Finding nearby Sehri providers (Masjids, Volunteer groups, Restaurants)
- Prayer times and Sehri/Iftar times
- Free vs Paid options
- How to use the app features
- Ramadan related guidance

Keep responses short and to the point (2-3 sentences max unless asked for more details).
"""

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        completion = client.chat.completions.create(
            model="openrouter/aurora-alpha",
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            temperature=0.7,
            max_tokens=256
        )
        
        bot_response = completion.choices[0].message.content
        return jsonify({'response': bot_response})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
