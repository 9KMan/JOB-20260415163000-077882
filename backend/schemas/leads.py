from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"


class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    company: Optional[str] = Field(None, max_length=200)
    status: LeadStatus = LeadStatus.NEW
    score: int = Field(default=0, ge=0, le=100)
    notes: Optional[str] = Field(None, max_length=2000)


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    company: Optional[str] = Field(None, max_length=200)
    status: Optional[LeadStatus] = None
    score: Optional[int] = Field(None, ge=0, le=100)
    notes: Optional[str] = Field(None, max_length=2000)


class LeadResponse(LeadBase):
    id: str
    userId: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class AIAgentRequest(BaseModel):
    leadId: str
    action: str = Field(..., pattern="^(analyze|score|compose)$")


class AIAgentResponse(BaseModel):
    action: str
    result: str
    leadId: str


class UserBase(BaseModel):
    email: EmailStr


class UserResponse(UserBase):
    uid: str
    createdAt: datetime
