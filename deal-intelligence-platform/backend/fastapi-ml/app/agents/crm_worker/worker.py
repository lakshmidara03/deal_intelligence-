class CRMWorker:
    def run(self, payload: dict) -> dict:
        return {
            "crm_signals": {
                "stage_age_days": payload.get("stage_age_days", 0),
                "inactivity_days": payload.get("inactivity_days", 0),
                "next_step_defined": payload.get("next_step_defined", False),
            }
        }
