import json
from openai import OpenAI
from datetime import datetime
from app.core.config import settings

# Initialize the OpenAI client
# This single instance will be reused across the application
client = OpenAI(api_key=settings.OPENAI_API_KEY)

def parse_text_to_structured_task(text: str) -> dict:
    """
    Takes raw user text, sends it to OpenAI's chat completion API with a specific
    prompt to get structured data back, and returns the parsed JSON.
    """
    current_date_str = datetime.now().strftime("%Y-%m-%d")

    system_prompt = f"""
    You are a precision data extraction API. Your sole function is to analyze user text and respond with a single, valid JSON object. Do not include any explanations, apologies, or conversational text. The current date is {current_date_str}. The JSON object MUST conform to this exact structure and typing: {{"task_name": "string", "assignee": "string | null", "due_date": "string (YYYY-MM-DDTHH:MM:SS) | null", "priority": "string ('P1'|'P2'|'P3'|'P4')"}}.
    Extraction Rules:
    1. task_name: Extract the core action. This field is mandatory. If you cannot determine a task name, return an empty string "" for this field.
    2. assignee: Extract the person's name. If no name is found, return null.
    3. due_date: Parse any date/time reference (e.g., "tomorrow 5pm", "tonight"). Convert it to an absolute ISO 8601 timestamp. If no date is found, return null.
    4. priority: Look for 'P1', 'P2', 'P3', or 'P4'. If a priority is not explicitly mentioned, you MUST default to "P3".
    """

    response = client.chat.completions.create(
        model="gpt-3.5-turbo-1106",  # A model that supports JSON mode
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]
    )

    # The response is a guaranteed JSON string, which we can parse
    response_content = response.choices[0].message.content
    return json.loads(response_content) 