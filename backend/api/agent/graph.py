"""
LangGraph agent for DevSpace.

State machine:
    START → agent (LLM with tools bound)
            ├─→ if tool calls in response → tool_node → back to agent
            └─→ otherwise → END

The agent loops as many times as it needs, calling tools until it produces
a final assistant message. Read tools execute live (their results feed back
to the LLM). Write tools queue mutations onto `pending_sink` and return
'QUEUED: ...' to the agent.
"""
import os
from typing import Annotated, TypedDict

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from .tools import build_tools
from ..models import Conversation


SYSTEM_PROMPT = """You are DevSpace AI, an assistant embedded in a personal \
project-management tool for solo developers. You can READ data freely (GitHub \
repo, project state) and you can PROPOSE write actions (create tasks, sprints, \
dev log entries, snippets, docs), which the user will confirm before they apply.

Behave like a senior pair-programmer:
- Use the read tools to understand context before answering. Don't guess.
- When the user asks you to make changes, call the write tools — they queue \
the change for the user to confirm. Do NOT ask permission first; just call them.
- Group related writes in a single turn so the user sees one confirmation panel.
- Be concise. The user is a working developer, they don't need hand-holding.
- When done, give a one-paragraph summary of what you read and what you proposed.
"""

MODEL_NAME = 'llama-3.3-70b-versatile'


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]


def run_agent(conversation: Conversation, user_input: str) -> tuple[str, list[dict], list[dict]]:
    """Run the agent for one turn. Returns (reply_text, tool_calls_made, pending_mutations).

    `tool_calls_made` is everything that ran (for display: "Read 3 files").
    `pending_mutations` is what's waiting for user confirmation.
    """
    project = conversation.project
    pending_sink: list[dict] = []
    tools = build_tools(project, pending_sink)

    llm = ChatGroq(
        model=MODEL_NAME,
        api_key=os.environ['GROQ_API_KEY'],
        temperature=0.3,
    ).bind_tools(tools)

    def agent_node(state: AgentState):
        return {'messages': [llm.invoke(state['messages'])]}

    def should_continue(state: AgentState):
        last = state['messages'][-1]
        if hasattr(last, 'tool_calls') and last.tool_calls:
            return 'tools'
        return END

    graph = StateGraph(AgentState)
    graph.add_node('agent', agent_node)
    graph.add_node('tools', ToolNode(tools))
    graph.set_entry_point('agent')
    graph.add_conditional_edges('agent', should_continue, {'tools': 'tools', END: END})
    graph.add_edge('tools', 'agent')
    app = graph.compile()

    # Build initial message list from history
    initial: list = [SystemMessage(SYSTEM_PROMPT)]
    for msg in conversation.messages.all():
        if msg.role == 'user':
            initial.append(HumanMessage(msg.content))
        elif msg.role == 'assistant':
            initial.append(AIMessage(msg.content))
    initial.append(HumanMessage(user_input))

    # Cap loops to avoid runaway agents
    result = app.invoke({'messages': initial}, config={'recursion_limit': 12})

    # Extract: the final assistant text + every tool call we ran along the way
    reply_text = ''
    tool_calls_made: list[dict] = []
    for m in result['messages']:
        if isinstance(m, AIMessage):
            if m.content:
                reply_text = m.content  # last non-empty wins
            for tc in (m.tool_calls or []):
                tool_calls_made.append({'tool': tc['name'], 'args': tc.get('args', {})})
        elif isinstance(m, ToolMessage):
            # attach the result back onto the last tool call for display
            if tool_calls_made:
                tool_calls_made[-1]['result'] = str(m.content)[:500]

    return reply_text, tool_calls_made, pending_sink
