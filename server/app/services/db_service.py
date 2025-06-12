from supabase import create_client, Client
from app.core.config import settings
from app.models.task import TaskCreate

# Initialize the Supabase client
# This single instance will be reused across the application
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_tasks():
    """
    Fetches all tasks from the database.
    """
    response = supabase.table('tasks').select("*").order('created_at', desc=True).execute()
    if response.data:
        return response.data
    return []

def create_task(task: TaskCreate):
    """
    Inserts a new task record into the database.

    Args:
        task: A Pydantic model of the task to create.

    Returns:
        The data from the newly created record.
    """
    # Pydantic's .dict() method converts the model to a dictionary
    # that Supabase client can work with.
    # We exclude unset fields to avoid sending nulls for non-nullable DB columns
    # if they have default values.
    task_dict = task.dict(exclude_unset=True)
    
    response = supabase.table('tasks').insert(task_dict).execute()
    
    if response.data:
        return response.data[0]
    return None

# We will add the create_task function and others here later,
# once we have the NLP service that produces the data for it. 