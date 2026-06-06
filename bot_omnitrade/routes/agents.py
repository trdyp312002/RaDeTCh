from fastapi import APIRouter
from state import state

router = APIRouter()

@router.get("/agents/status")
def get_agents_status():
    return state.agents_state

@router.post("/agents/force_run")
def force_agents_run():
    state.force_agent_run = True
    return {"status": "success", "message": "Agents awakened."}
