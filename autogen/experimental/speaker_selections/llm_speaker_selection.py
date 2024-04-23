import json
import re
from typing import Dict, List, Optional, Tuple

from autogen.experimental.types import SystemMessage
from autogen.experimental.utils import convert_messages_to_llm_messages

from ..agent import Agent
from ..chat_history import ChatHistoryReadOnly
from ..model_client import ModelClient
from ..speaker_selection import SpeakerSelection


def _mentioned_agents(message_content: str, agents: List[Agent]) -> Dict[str, int]:
    mentions: Dict[str, int] = {}
    for agent in agents:
        # Finds agent mentions, taking word boundaries into account,
        # accommodates escaping underscores and underscores as spaces
        regex = (
            r"(?<=\W)("
            + re.escape(agent.name)
            + r"|"
            + re.escape(agent.name.replace("_", " "))
            + r"|"
            + re.escape(agent.name.replace("_", r"\_"))
            + r")(?=\W)"
        )
        count = len(re.findall(regex, f" {message_content} "))  # Pad the message to help with matching
        if count > 0:
            mentions[agent.name] = count
    return mentions


class LLMSpeakerSelection(SpeakerSelection):
    def __init__(
        self,
        client: ModelClient,
    ) -> None:
        self._model_client = client

    async def _select_text(self, agents: List[Agent], chat_history: ChatHistoryReadOnly) -> Tuple[Agent, None]:
        select_speaker_message_template = """You are in a role play game. The following roles are available:
                {roles}.
                Read the following conversation.
                Then select the next role from {agent_list} to play. Only return the role."""
        select_speaker_prompt_template = (
            "Read the above conversation. Then select the next role from {agent_list} to play. Only return the role."
        )

        roles = "\n".join([f"{x.name}: {x.description}" for x in agents])
        agent_list = [x.name for x in agents]

        messages = (
            [SystemMessage(select_speaker_message_template.format(roles=roles, agent_list=agent_list))]
            # Note: name isn't used here so they will all be user messages - is that right?
            + convert_messages_to_llm_messages(list(chat_history.messages), "speaker_selection")
            + [SystemMessage(select_speaker_prompt_template.format(agent_list=agent_list))]
        )
        response = await self._model_client.create(messages, json_output=False)
        assert isinstance(response.content, str)
        mentions = _mentioned_agents(response.content, agents)
        if len(mentions) != 1:
            raise ValueError(f"Expected exactly one agent mention, but got {len(mentions)}")
        agent_name = next(iter(mentions))
        for agent in agents:
            if agent.name == agent_name:
                return agent, None
        else:
            raise ValueError(f"Agent {agent_name} not found in list of agents")

    async def _select_json(self, agents: List[Agent], chat_history: ChatHistoryReadOnly) -> Tuple[Agent, Optional[str]]:
        select_speaker_message_template = """You are in a role play game. The following roles are available:
                {roles}.
                Read the following conversation.
                Then select the next role from {agent_list} to play. Only return the role."""
        select_speaker_prompt_template = """Read the above conversation. Then select the next role to speak. Your output must be limited to a JSON-formatted object with no other text so that it can be directly parsed by json.loads. Please use the following schema:

    {{
        "reason": <a string containing an explanation for why the specified role should speak next>,
        "next_role": <a string naming the next player to speak, selected from: {agent_list}>
    }}
"""
        roles = "\n".join([f"{x.name}: {x.description}" for x in agents])
        agent_list = [x.name for x in agents]

        messages = (
            [SystemMessage(select_speaker_message_template.format(roles=roles, agent_list=agent_list))]
            # Note: name isn't used here so they will all be user messages - is that right?
            + convert_messages_to_llm_messages(list(chat_history.messages), "speaker_selection")
            + [SystemMessage(select_speaker_prompt_template.format(agent_list=agent_list))]
        )

        response = await self._model_client.create(messages, json_output=True)
        assert isinstance(response.content, str)
        json_obj = json.loads(response.content)
        if "next_role" not in json_obj:
            raise ValueError("Expected 'next_role' property in JSON response")
        agent_name = json_obj["next_role"]
        reason = json_obj.get("reason", None)
        assert isinstance(reason, str)
        for agent in agents:
            if agent.name == agent_name:
                return agent, reason
        else:
            raise ValueError(f"Agent {agent_name} not found in list of agents")

    async def select_speaker(
        self, agents: List[Agent], chat_history: ChatHistoryReadOnly
    ) -> Tuple[Agent, Optional[str]]:
        if self._model_client.capabilities["json_output"]:
            return await self._select_json(agents, chat_history)
        else:
            return await self._select_text(agents, chat_history)
