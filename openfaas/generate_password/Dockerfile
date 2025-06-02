FROM openfaas/of-watchdog:0.8.4 as watchdog
FROM python:3.9-slim
COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog
RUN chmod +x /usr/bin/fwatchdog
WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN apk add --no-cache postgresql-dev gcc python3-dev musl-dev

RUN pip install --no-cache-dir --user -r requirements.txt
COPY handler.py .
COPY index.py .
ENV mode="http"
ENV upstream_url="http://127.0.0.1:5000"
ENV fprocess="python index.py"
EXPOSE 8080
HEALTHCHECK --interval=5s CMD [ -e /tmp/.lock ] || exit 1
CMD ["fwatchdog"]