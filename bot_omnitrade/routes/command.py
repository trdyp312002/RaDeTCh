from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class CommandRequest(BaseModel):
    assignTo: str
    directive: str
    context: str | None = None

_log: list[dict] = []

@router.post("/command")
async def receive_command(cmd: CommandRequest):
    entry = cmd.model_dump()
    _log.append(entry)
    # TODO: wire to strategy executor per assignTo
    return {"received": True, "queued": len(_log), "directive": cmd.directive}

@router.get("/commands")
async def list_commands():
    return {"commands": _log[-50:]}
