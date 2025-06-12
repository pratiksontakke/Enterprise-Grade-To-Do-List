from supabase import create_client, Client
from app.core.config import settings
from app.models.task import TaskCreate, TaskInDB, TaskUpdate
from fastapi.middleware.cors import CORSMiddleware

# Initialize the Supabase client
# This single instance will be reused across the application
print("SUPABASE_URL:", settings.SUPABASE_URL)
print("SUPABASE_KEY:", settings.SUPABASE_KEY[:6], "...")  # Don't print full key in logs!

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_tasks():
    """
    Fetches all tasks from the database.
    """
    response = supabase.table('tasks').select("*").order('created_at', desc=True).execute()
    if response.data:
        # Convert the list of dictionaries into a list of TaskInDB models
        return [TaskInDB(**task) for task in response.data]
    return []

def create_task(task: TaskCreate) -> TaskInDB:
    """
    Inserts a new task record into the database.

    Args:
        task: A Pydantic model of the task to create.

    Returns:
        The data from the newly created record.
    """
    # Use Pydantic's `model_dump` with `mode='json'`. This correctly
    # converts special types like datetime and UUID into JSON-compatible strings.
    task_dict = task.model_dump(mode='json')
    
    response = supabase.table('tasks').insert(task_dict).execute()
    
    if response.data:
        # Return the new record as a validated TaskInDB model
        return TaskInDB(**response.data[0])
    return None

def update_task(task_id: str, task_update: TaskUpdate) -> TaskInDB:
    """
    Updates an existing task in the database.
    Only updates the fields that are provided in the task_update model.
    """
    # Convert Pydantic model to a JSON-compatible dict.
    # `mode='json'` handles types like datetime.
    # `exclude_unset=True` ensures we only update fields that were actually sent.
    update_data = task_update.model_dump(mode='json', exclude_unset=True)

    # If the request body is empty, there is nothing to update.
    if not update_data:
        # We perform a select query to confirm the task exists.
        # .single() returns a dictionary directly in response.data.
        response = supabase.table('tasks').select("*").eq('id', task_id).single().execute()
        if response.data:
            return TaskInDB(**response.data)
    else:
        # We perform the update.
        # .update() returns a list containing the updated record(s).
        response = supabase.table('tasks').update(update_data).eq('id', task_id).execute()
        if response.data:
            # We take the first element from the list.
            return TaskInDB(**response.data[0])

    # If response.data is empty in either case, it means no record was found.
    return None

def delete_task(task_id: str) -> bool:
    """
    Deletes a task from the database.
    Returns True if the deletion was successful, otherwise False.
    """
    response = supabase.table('tasks').delete().eq('id', task_id).execute()
    
    # Supabase delete operation returns the deleted records in response.data.
    # If data exists, it means records were deleted.
    if response.data:
        return True
    return False

# We will add the create_task function and others here later,
# once we have the NLP service that produces the data for it. 

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://auratasks.netlify.app",
        "http://localhost:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) 