import pytest
from pydantic import ValidationError
from backend.schemas.leads import LeadStatus, LeadCreate, LeadUpdate, LeadResponse


class TestLeadSchemas:
    def test_lead_status_enum_values(self):
        assert LeadStatus.NEW == "new"
        assert LeadStatus.CONTACTED == "contacted"
        assert LeadStatus.QUALIFIED == "qualified"
        assert LeadStatus.CONVERTED == "converted"

    def test_lead_create_valid(self):
        lead = LeadCreate(
            name="John Doe",
            email="john@example.com",
            company="Acme Corp",
            status=LeadStatus.NEW,
            score=75,
            notes="Hot lead",
        )
        assert lead.name == "John Doe"
        assert lead.email == "john@example.com"
        assert lead.score == 75

    def test_lead_create_invalid_email(self):
        with pytest.raises(ValidationError):
            LeadCreate(name="John", email="not-an-email")

    def test_lead_create_name_required(self):
        with pytest.raises(ValidationError):
            LeadCreate(email="john@example.com")

    def test_lead_update_partial(self):
        update = LeadUpdate(status=LeadStatus.QUALIFIED)
        assert update.status == LeadStatus.QUALIFIED
        assert update.name is None
        assert update.email is None

    def test_lead_response_model(self):
        response = LeadResponse(
            id="lead_123",
            userId="user_456",
            name="Jane Doe",
            email="jane@example.com",
            company="TechCo",
            status=LeadStatus.CONVERTED,
            score=95,
            notes="Converted to paid",
            createdAt="2024-01-15T10:00:00Z",
            updatedAt="2024-01-20T14:30:00Z",
        )
        assert response.id == "lead_123"
        assert response.score == 95
