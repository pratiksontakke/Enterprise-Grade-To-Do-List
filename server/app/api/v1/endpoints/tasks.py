from fastapi import APIRouter, HTTPException, status, Body, Response
from typing import List
from pydantic import ValidationError

from app.models.task import TaskInDB, TaskCreate, TaskParsed, TaskUpdate
from app.services import db_service, nlp_service

router = APIRouter()

@router.get("/tasks", response_model=List[TaskInDB])
def read_tasks():
    """
    Retrieve all tasks from the database.
    """
    # The service now returns a list of Pydantic models, which FastAPI can handle directly.
    return db_service.get_tasks()

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
        # The service now returns a validated Pydantic model.
        new_task = db_service.create_task(task_to_create)
        if not new_task:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create task in the database.",
            )
        return new_task

    except ValidationError:
        # This catches our custom "is_actionable" validation error from the Pydantic model.
        # We return a user-friendly message.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This doesn't seem to be an actionable task. Please provide a clear task name and either an assignee or a due date.",
        )
    except Exception as e:
        # Catch any other unexpected errors from the NLP service or DB
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"An unexpected error occurred: {e}",
        )

@router.post("/tasks/parse-transcript", response_model=List[TaskInDB], status_code=status.HTTP_201_CREATED)
def parse_transcript_and_create_tasks(text_input: dict = Body(...)):
    """
    Parses a long-form transcript to find and create multiple tasks.
    """
    raw_text = text_input.get("text")
    if not raw_text or len(raw_text.split()) < 5: # Basic check for transcript length
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript is too short. Please provide a more detailed transcript for accurate task parsing.",
        )
    
    try:
        created_tasks = []
        parsed_tasks_list = nlp_service.parse_transcript_to_tasks(raw_text)

        if not parsed_tasks_list:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No actionable tasks were found in the transcript. Try rephrasing or adding more details like names and deadlines."
            )

        for task_dict in parsed_tasks_list:
            try:
                # Validate each task from the transcript individually
                validated_parsed_data = TaskParsed(**task_dict)
                
                task_to_create = TaskCreate(
                    **validated_parsed_data.model_dump(),
                    original_text=raw_text, # Store the full transcript for context
                    source="transcript",
                    user_id=None
                )
                
                new_task = db_service.create_task(task_to_create)
                if new_task:
                    created_tasks.append(new_task)
            
            except ValidationError:
                # If a single task in the transcript is not actionable, we can skip it
                # and continue processing the rest. For now, we'll just log it.
                print(f"Skipping non-actionable task from transcript: {task_dict.get('task_name')}")
                continue
        
        if not created_tasks:
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="We found some potential tasks, but none were actionable. Please ensure tasks have a clear subject and a due date or an assignee."
            )

        return created_tasks

    except HTTPException as e:
        # Re-raise HTTPExceptions directly to preserve their status code and detail
        raise e
    except Exception as e:
        # A broad catch-all for other errors during transcript processing
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during transcript processing: {e}",
        )

@router.put("/tasks/{task_id}", response_model=TaskInDB)
def update_existing_task(task_id: str, task_update: TaskUpdate):
    """
    Updates a task's details.
    """
    updated_task = db_service.update_task(task_id, task_update)
    if not updated_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated_task

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_task(task_id: str):
    """
    Deletes a task by its ID.
    """
    success = db_service.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or could not be deleted")
    return Response(status_code=status.HTTP_204_NO_CONTENT)