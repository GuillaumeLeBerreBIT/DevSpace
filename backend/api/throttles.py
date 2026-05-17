from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class AgentMessageThrottle(UserRateThrottle):
    """Strict limit on the LLM-triggering endpoint.

    Each POST to /api/conversations/:id/messages/ spins up a LangGraph agent
    that can make up to 12 LLM hops. 20/minute is generous for real use but
    kills runaway loops and protects the Groq API quota.
    """
    scope = 'agent_message'


class LoginThrottle(AnonRateThrottle):
    """Brute-force protection on the JWT login endpoint.

    Uses AnonRateThrottle (keyed on IP) because the user isn't authenticated
    yet when they hit /api/token/. 5 attempts per minute is enough for typos.
    """
    scope = 'login'
