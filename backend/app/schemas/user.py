from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=64, description="Optional public moniker or handle")
    bio: Optional[str] = Field(None, max_length=256, description="Brief user bio or organization description")


class UserProfileResponse(BaseModel):
    wallet_address: str = Field(..., pattern="^0x[a-fA-F0-9]{40}$")
    display_name: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    borrowed_loans_count: int = 0
    funded_loans_count: int = 0

    class Config:
        from_attributes = True
