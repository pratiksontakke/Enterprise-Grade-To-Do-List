import json
from openai import OpenAI
from datetime import datetime
from app.core.config import settings
from typing import List, Dict

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
    1. task_name: Extract the core action. This field is mandatory.
    2. assignee: Extract the person's name. If no name is found, return null.
    3. due_date: Parse any date/time reference (e.g., "tomorrow 5pm", "tonight"). Convert it to an absolute ISO 8601 timestamp. If no date is found, return null.
    4. priority: Look for 'P1', 'P2', 'P3', or 'P4'. If a priority is not explicitly mentioned, you MUST default to "P3".
    5. Validation Rule: A task is only valid if it contains a `task_name` AND at least one of the following: an `assignee` or a `due_date`. If the user's input does not meet this requirement (e.g., the input is just "call" or "review the doc"), you MUST return an empty string `""` for the `task_name` field. This signals that the input was insufficient.
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

def parse_transcript_to_tasks(text: str) -> List[Dict]:
    """
    Takes a long-form transcript, sends it to the OpenAI API, and asks for
    an array of task objects to be extracted.
    """
    current_date_str = datetime.now().strftime("%Y-%m-%d")

    system_prompt = f"""
    You are a precision data extraction API. Your sole function is to analyze the user's meeting transcript and respond with a single, valid JSON object.
    
    The top-level JSON object you return MUST have a single key named "tasks", which holds an array of task objects. Do not include any other keys or conversational text.
    
    Each task object in the "tasks" array MUST conform to this exact structure: {{"task_name": "string", "assignee": "string | null", "due_date": "string (YYYY-MM-DDTHH:MM:SS) | null", "priority": "string ('P1'|'P2'|'P3'|'P4')"}}.

    Extraction Rules:
    1. For each distinct action item you identify, create one JSON object in the "tasks" array.
    2. task_name: Extract the core action. This field is mandatory.
    3. assignee: Extract the person's name assigned to the action. If no specific person is assigned, return null.
    4. due_date: Parse any date/time reference. You MUST use the current date, {current_date_str}, as the reference point for all relative dates like "tomorrow", "tonight", "next Wednesday", or "by Friday". Convert the result into an absolute ISO 8601 timestamp. If no date is found, return null.
    5. priority: Default to "P3" unless a priority is explicitly mentioned.
    6. Validation Rule: Each extracted task must have a `task_name` AND at least one of (`assignee` or `due_date`). If an identified action item does not meet this rule, do not include it in the output array.
    7. If no actionable tasks are found in the transcript, you MUST return an object with an empty array: {{"tasks": []}}.
    """

    response = client.chat.completions.create(
        model="gpt-3.5-turbo-1106",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]
    )
    
    response_content = response.choices[0].message.content
    data = json.loads(response_content)
    
    return data.get("tasks", []) 