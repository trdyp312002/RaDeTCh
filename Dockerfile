FROM python:3.11-slim

WORKDIR /app

# Install dependencies for both bots
COPY bot/requirements.txt ./bot_requirements.txt
COPY bot_raphael/requirements.txt ./bot_raphael_requirements.txt
RUN pip install --no-cache-dir -r bot_requirements.txt && \
    pip install --no-cache-dir -r bot_raphael_requirements.txt

# Copy all project files (including start.sh, bot, bot_raphael, and data folder)
COPY . .

# Make start.sh executable
RUN chmod +x start.sh

CMD ["./start.sh"]
