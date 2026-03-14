import json
from datetime import datetime, timezone


def log_admin_action(admin_user_id, action, target_id, details=None):
    """Registra accion de administrador en CloudWatch en formato JSON estructurado."""
    log_entry = {
        "type": "ADMIN_AUDIT",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "adminUserId": admin_user_id,
        "action": action,
        "targetId": target_id,
    }
    if details:
        log_entry["details"] = details
    print(json.dumps(log_entry))
