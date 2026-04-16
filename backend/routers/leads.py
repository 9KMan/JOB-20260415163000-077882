from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, List
from datetime import datetime
import firebase_admin
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud.firestore_v1 import Query

from ..schemas.leads import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    AIAgentRequest,
    AIAgentResponse,
    LeadStatus,
)

router = APIRouter(prefix="/api/leads", tags=["leads"])

firebase_app = firebase_admin.initialize_app()
db = firestore.client()


async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        return "anonymous_user"
    token = authorization.replace("Bearer ", "")
    try:
        decoded = firebase_admin.auth.verify_id_token(token)
        return decoded.get("uid", "anonymous_user")
    except Exception:
        return "anonymous_user"


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
    queries = [
        FieldFilter("userId", "==", userId),
    ]

    if status:
        queries.append(FieldFilter("status", "==", status.value))

    query = Query(db.collection("leads"), filters=queries)
    query = query.order_by("createdAt", direction=Query.DESCENDING)

    docs = query.get()

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
    if data.get("userId") != userId and userId != "anonymous_user":
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
    if data.get("userId") != userId and userId != "anonymous_user":
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
    if data.get("userId") != userId and userId != "anonymous_user":
        raise HTTPException(status_code=403, detail="Access denied")

    doc_ref.delete()
