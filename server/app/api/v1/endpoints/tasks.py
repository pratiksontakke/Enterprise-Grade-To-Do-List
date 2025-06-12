from fastapi import APIRouter, HTTPException, status, Body
from typing import List
from pydantic import ValidationError

from app.models.task import TaskInDB, TaskCreate, TaskParsed
from app.services import db_service, nlp_service

router = APIRouter()

@router.get("/tasks", response_model=List[TaskInDB])
def read_tasks():
    """
    Retrieve all tasks from the database.
    """
    tasks = db_service.get_tasks()
    return tasks

@router.post("/tasks/parse-single", response_model=TaskInDB, status_code=status.HTTP_201_CREATED)
def parse_and_create_task(text_input: dict = Body(...)):
    """
    Parses a single line of text to create a task.
    This endpoint performs the following steps:
    1. Receives raw text.
    2. Sends it to the NLP service to get structured data.
    3. Validates the structured data with Pydantic (the "Pydantic Gate").
    4. If valid, enriches and saves the data to the database.
    5. Returns the newly created task.
    """
    raw_text = text_input.get("text")
    if not raw_text or not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Input text cannot be empty.",
        )

    try:
        # 1. Get structured data from the AI
        parsed_data_dict = nlp_service.parse_text_to_structured_task(raw_text)

        # 2. Validate the data from the AI (The Pydantic Gate)
        validated_parsed_data = TaskParsed(**parsed_data_dict)

        # 3. Enrich with server-side data and create the final DB object
        task_to_create = TaskCreate(
            **validated_parsed_data.dict(),
            original_text=raw_text,
            source="single_task",
            user_id=None # Explicitly set user_id to None for MVP
        )

        # 4. Save to the database
        new_task = db_service.create_task(task_to_create)
        if not new_task:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create task in the database.",
            )
        return new_task

    except ValidationError as e:
        # This catches errors if the AI's output doesn't match our Pydantic model
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "AI output failed validation.", "errors": e.errors()},
        )
    except Exception as e:
        # Catch any other unexpected errors from the NLP service or DB
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"An unexpected error occurred: {e}",
        ) 