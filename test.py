

from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="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",
)

completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
  },
  model="openrouter/aurora-alpha",
  messages=[
    {
      "role": "user",
      "content": "What is your name?"
    }
  ]
)

print(completion.choices[0].message.content)
