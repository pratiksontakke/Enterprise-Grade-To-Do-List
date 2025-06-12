from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

# This model defines the data we expect from the AI after parsing.
# It's a subset of the full model, representing the core parsable fields.
class TaskParsed(BaseModel):
    task_name: str = Field(..., min_length=1, description="The core action of the task. Cannot be empty.")
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = Field(default="P3", pattern="^(P1|P2|P3|P4)$", description="Must be P1, P2, P3, or P4.")

    @model_validator(mode='after')
    def check_task_is_actionable(self):
        """Ensures that a task has more than just a name."""
        if self.task_name and not (self.assignee or self.due_date):
            raise ValueError('Task must have an assignee or a due date to be actionable.')
        return self

# This model defines the data required to create a task in the database.
# It includes the parsed data plus data added by our backend logic.
class TaskCreate(TaskParsed):
    original_text: Optional[str] = None
    source: str
    user_id: Optional[UUID] = None  # Present but optional for MVP, will be set to None

# This is the new model for updating an existing task.
# All fields are optional, so the frontend can send only the fields that have changed.
class TaskUpdate(BaseModel):
    task_name: Optional[str] = Field(None, min_length=1)
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = Field(None, pattern="^(P1|P2|P3|P4)$")
    status: Optional[str] = None

# This model represents a full task record as it exists in the database.
# This is the model that will be sent back to the frontend in API responses.
class TaskInDB(TaskCreate):
    id: UUID
    created_at: datetime
    status: str

    class Config:
        from_attributes = True # Allows the model to be created from ORM objects