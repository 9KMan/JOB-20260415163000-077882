from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import firebase_admin
from firebase_admin import firestore
import openai
import os

router = APIRouter(prefix="/api/leads", tags=["leads"])

firebase_app = firebase_admin.initialize_app()
db = firestore.client()


class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"


class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    company: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    score: int = Field(default=0, ge=0, le=100)
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    status: Optional[LeadStatus] = None
    score: Optional[int] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


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


def get_current_user_id() -> str:
    return "user_123"


@router.post("/", response_model=LeadResponse, status_code=201)
async def create_lead(lead: LeadCreate, userId: str = Depends(get_current_user_id)):
    lead_data = {
        **lead.model_dump(),
        "userId": userId,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }

    doc_ref = db.collection("leads").document()
    doc_ref.set(lead_data)

    doc = doc_ref.get()
    data = doc.to_dict()
    data["id"] = doc.id
    data["createdAt"] = datetime.utcnow()
    data["updatedAt"] = datetime.utcnow()

    return LeadResponse(**data)


@router.get("/", response_model=List[LeadResponse])
async def list_leads(
    status: Optional[LeadStatus] = None, userId: str = Depends(get_current_user_id)
):
    leads_ref = db.collection("leads")
    query = leads_ref.where("userId", "==", userId)

    if status:
        query = query.where("status", "==", status.value)

    docs = query.order_by("createdAt", direction=firestore.Query.DESCENDING).get()

    leads = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        data["createdAt"] = data.get("createdAt", datetime.utcnow())
        data["updatedAt"] = data.get("updatedAt", datetime.utcnow())
        leads.append(LeadResponse(**data))

    return leads


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str, userId: str = Depends(get_current_user_id)):
    doc_ref = db.collection("leads").document(lead_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Lead not found")

    data = doc.to_dict()
    if data.get("userId") != userId:
        raise HTTPException(status_code=403, detail="Access denied")

    data["id"] = doc.id
    return LeadResponse(**data)


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str, lead: LeadUpdate, userId: str = Depends(get_current_user_id)
):
    doc_ref = db.collection("leads").document(lead_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Lead not found")

    data = doc.to_dict()
    if data.get("userId") != userId:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = {k: v for k, v in lead.model_dump().items() if v is not None}
    update_data["updatedAt"] = firestore.SERVER_TIMESTAMP

    doc_ref.update(update_data)

    updated_doc = doc_ref.get()
    updated_data = updated_doc.to_dict()
    updated_data["id"] = updated_doc.id

    return LeadResponse(**updated_data)


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(lead_id: str, userId: str = Depends(get_current_user_id)):
    doc_ref = db.collection("leads").document(lead_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Lead not found")

    data = doc.to_dict()
    if data.get("userId") != userId:
        raise HTTPException(status_code=403, detail="Access denied")

    doc_ref.delete()


@router.post("/ai-assist")
async def ai_agent_endpoint(
    request: AIAgentRequest, userId: str = Depends(get_current_user_id)
):
    doc_ref = db.collection("leads").document(request.leadId)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Lead not found")

    data = doc.to_dict()
    if data.get("userId") != userId:
        raise HTTPException(status_code=403, detail="Access denied")

    openai.api_key = os.getenv("OPENAI_API_KEY")

    if request.action == "analyze":
        prompt = f"Analyze this lead and suggest improvements: {data}"
    elif request.action == "score":
        prompt = f"Score this lead 0-100 based on conversion likelihood: {data}"
    elif request.action == "compose":
        prompt = f"Compose an outreach email for: {data}"

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant for lead generation.",
                },
                {"role": "user", "content": prompt},
            ],
        )

        return {
            "action": request.action,
            "result": response.choices[0].message.content,
            "leadId": request.leadId,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")
