import os
import json
import logging
import asyncio
import google.generativeai as genai

logger = logging.getLogger("agentic_strategy")

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "your_gemini_api_key_here":
    genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-1.5-flash")

async def run_6_agents(symbol: str, price: float, emas: dict, position: str) -> dict:
    """
    Runs the 6-agent discussion to validate a trading signal.
    Returns a dict with {"action": "buy"|"sell"|"hold", "reason": "..."}
    """
    if not api_key or api_key == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY not set or invalid. Agents asleep. Fallback to original signal.")
        return {"action": "pass", "reason": "No API Key"}

    pos_str = position if position else "None"
    
    from state import state
    try:
        logger.info(f"🚀 Waking up 6 Agents to validate trade on {symbol}...")
        
        # Reset all to Thinking
        for k in state.agents_state.keys():
            state.agents_state[k] = {"status": "Thinking", "message": "Analyzing signal..."}
        
        # Agent 1: Observer (Data Analyst)
        state.agents_state["Observer"] = {"status": "Observing", "message": f"Reading OHLCV for {symbol}..."}
        prompt_1 = f"Market Data for {symbol}: Price is {price}. EMA9: {emas['ema9']}, EMA21: {emas['ema21']}. Current position: {pos_str}. Give a brief 2-sentence factual summary of the trend."
        resp_1 = await model.generate_content_async(prompt_1)
        obs_text = resp_1.text
        state.agents_state["Observer"] = {"status": "Done", "message": obs_text}

        # Agent 2: Questioner (Critical Thinker)
        state.agents_state["Questioner"] = {"status": "Questioning", "message": "Finding loopholes in the data..."}
        prompt_2 = f"Based on this observation: '{obs_text}'. Ask 2 critical questions about potential risks or fakeouts. Keep it brief."
        resp_2 = await model.generate_content_async(prompt_2)
        q_text = resp_2.text
        state.agents_state["Questioner"] = {"status": "Done", "message": q_text}

        # Agent 3: Devil's Advocate (Risk Assessor)
        state.agents_state["Advocate"] = {"status": "Arguing", "message": "Finding reasons not to trade..."}
        prompt_3 = f"Observation: '{obs_text}'. Questions: '{q_text}'. Argue strictly AGAINST taking any new position or suggest closing existing ones. Give 2 strong pessimistic reasons."
        resp_3 = await model.generate_content_async(prompt_3)
        adv_text = resp_3.text
        state.agents_state["Advocate"] = {"status": "Done", "message": adv_text}

        # Agent 4: Summarizer (Synthesizer)
        state.agents_state["Summarizer"] = {"status": "Summarizing", "message": "Compiling the debate..."}
        prompt_4 = f"Summarize the market state considering Observation: {obs_text}, Risks: {q_text}, and Pessimistic view: {adv_text}. 3 sentences max."
        resp_4 = await model.generate_content_async(prompt_4)
        sum_text = resp_4.text
        state.agents_state["Summarizer"] = {"status": "Done", "message": sum_text}

        # Agent 5: Executor (Decision Maker)
        state.agents_state["Executor"] = {"status": "Deciding", "message": "Making the final call..."}
        prompt_5 = f"Based on this summary: '{sum_text}'. Our position is {pos_str}. Should we 'buy', 'sell', or 'hold'? Output ONLY a JSON object: {{\"action\": \"buy\"|\"sell\"|\"hold\", \"reason\": \"<short reason>\"}}"
        resp_5 = await model.generate_content_async(prompt_5)
        
        # Parse JSON
        text_5 = resp_5.text.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(text_5)
        action = data.get("action", "hold").lower()
        reason = data.get("reason", "")
        state.agents_state["Executor"] = {"status": "Done", "message": f"Action: {action.upper()} - {reason}"}
        
        # Agent 6: Supervisor (Risk Override)
        state.agents_state["Supervisor"] = {"status": "Reviewing", "message": f"Reviewing Executor's decision: {action.upper()}"}
        logger.info(f"🕵️ Supervisor reviewing Agent 5's decision: {action.upper()}")
        if action == "buy" and position == "long":
            action = "hold"
            reason = "Supervisor override: Already in a long position."
        elif action == "sell" and position is None:
            action = "hold"
            reason = "Supervisor override: Nothing to sell."
        
        state.agents_state["Supervisor"] = {"status": "Done", "message": f"Final Action: {action.upper()} - {reason}"}
        logger.info(f"✅ Agents Consensus: Action={action.upper()} | Reason={reason}")
        
        # Reset back to sleeping after 5 seconds to show they are done
        async def go_to_sleep():
            await asyncio.sleep(5)
            for k in state.agents_state.keys():
                state.agents_state[k] = {"status": "Sleeping", "message": "Zzz..."}
            state.agents_state["Supervisor"]["message"] = "Monitoring operation loop..."
        asyncio.create_task(go_to_sleep())

        return {"action": action, "reason": reason}
        
    except Exception as e:
        logger.error(f"❌ Agent flow failed: {e}")
        for k in state.agents_state.keys():
            state.agents_state[k] = {"status": "Error", "message": "Something went wrong!"}
        return {"action": "error", "reason": str(e)}
