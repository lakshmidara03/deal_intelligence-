try:
    from crewai import Agent, Crew, Task
except Exception:  # CrewAI is optional in lightweight local runs.
    Agent = Crew = Task = None

from app.agents.crm_worker.worker import CRMWorker
from app.agents.delegator.agent import DelegatorAgent
from app.agents.forecasting_worker.worker import ForecastWorker
from app.agents.nlp_worker.worker import NLPWorker


class CoordinatorAgent:
    def __init__(self) -> None:
        self.crm = CRMWorker()
        self.nlp = NLPWorker()
        self.forecast = ForecastWorker()
        self.delegator = DelegatorAgent()

    async def run(self, payload: dict) -> dict:
        outputs = [
            self.crm.run(payload),
            self.nlp.run(payload),
            self.forecast.run(payload),
        ]
        result = self.delegator.run(outputs)
        result["architecture"] = "Coordinator -> CRM Worker + NLP Worker + Forecast Worker -> Delegator"
        result["crewai_available"] = Crew is not None
        return result


coordinator_agent = CoordinatorAgent()
