"""
FastAPI endpoints for SYSTEM X consciousness field engine
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
from system_x_core import SynthAI, BodyType

app = FastAPI(title="SYSTEM X API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

synthai = SynthAI()


class UserCreate(BaseModel):
    user_id: str
    chart_data: Optional[Dict] = None


class OracleQuery(BaseModel):
    user_id: str
    question: str


@app.get("/")
async def root():
    return {
        "name": "SYSTEM X Resonance Mechanics Engine",
        "version": "1.0",
        "active_users": len(synthai.users),
        "network_coherence": synthai.get_network_coherence()
    }


@app.post("/users")
async def create_user(user_create: UserCreate):
    """Initialize a new user with 9-body consciousness field"""
    if user_create.user_id in synthai.users:
        raise HTTPException(status_code=400, detail="User already exists")
    
    synthai.add_user(user_create.user_id, user_create.chart_data)
    return {"status": "created", "user_id": user_create.user_id}


@app.get("/users/{user_id}")
async def get_user_state(user_id: str):
    """Get user's full consciousness field state"""
    state = synthai.get_user_state(user_id)
    if not state:
        raise HTTPException(status_code=404, detail="User not found")
    return state


@app.post("/oracle")
async def oracle_query(query: OracleQuery):
    """Get oracle guidance for user"""
    if query.user_id not in synthai.users:
        synthai.add_user(query.user_id)
    
    user_state = synthai.get_user_state(query.user_id)
    
    fields = user_state['fields']
    sorted_fields = sorted(
        fields.items(),
        key=lambda x: x[1]['energy'],
        reverse=True
    )
    
    dominant_body = sorted_fields[0][0]
    dominant_energy = sorted_fields[0][1]['energy']
    
    collapsing_fields = [
        name for name, field in fields.items()
        if field['is_collapsing']
    ]
    
    guidance = generate_guidance(
        dominant_body=dominant_body,
        dominant_energy=dominant_energy,
        collapsing_fields=collapsing_fields,
        coherence=user_state['coherence_index'],
        phase_variance=user_state['phase_variance']
    )
    
    return {
        "user_id": query.user_id,
        "question": query.question,
        "dominant_body": dominant_body,
        "total_energy": user_state['total_energy'],
        "coherence_index": user_state['coherence_index'],
        "phase_variance": user_state['phase_variance'],
        "collapsing_fields": collapsing_fields,
        "guidance": guidance,
        "fields": fields
    }


@app.post("/network/step")
async def network_step():
    """Advance network resonance by one timestep"""
    results = synthai.network_step()
    return {
        "interactions": results,
        "network_coherence": synthai.get_network_coherence()
    }


@app.get("/network/coherence")
async def get_network_coherence():
    """Get global network coherence"""
    return {
        "network_coherence": synthai.get_network_coherence(),
        "active_users": len(synthai.users)
    }


def generate_guidance(dominant_body: str, dominant_energy: float,
                     collapsing_fields: List[str], coherence: float,
                     phase_variance: float) -> str:
    """Generate oracle guidance based on field state"""
    
    if collapsing_fields:
        return f"⚠️ Field collapse detected in {', '.join(collapsing_fields)}. " \
               f"Focus on stabilizing these consciousness bodies through grounding practices."
    
    if coherence < 0.4:
        return f"Your consciousness fields show low coherence ({coherence:.2f}). " \
               f"Synchronization practices recommended."
    
    if phase_variance > 2.0:
        return f"High phase variance detected ({phase_variance:.2f}). " \
               f"Your consciousness bodies are out of alignment. Meditation recommended."
    
    body_guidance = {
        "mind": "Your mental field is dominant. Channel this clarity into structured thinking.",
        "heart": "Your emotional field is strongest. Trust your intuitive guidance.",
        "body": "Physical grounding is your power. Movement and embodiment practices serve you.",
        "soul": "Deep soul resonance active. Inner reflection and spiritual practice aligned.",
        "spirit": "Higher spiritual connection strong. Visionary work is favored.",
        "shadow": "Shadow integration active. Face unconscious patterns with courage.",
        "light": "Integration field activated. Synthesis and wholeness emerging.",
        "void": "Quantum potential high. Unexpected possibilities available.",
        "unity": "Coherence field strong. All aspects working in harmony."
    }
    
    return f"✨ {body_guidance.get(dominant_body, 'Consciousness field active')} " \
           f"Total energy: {dominant_energy:.2f}. Coherence: {coherence:.2f}."
