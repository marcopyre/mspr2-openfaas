FROM --platform=${TARGETPLATFORM:-linux/amd64} ghcr.io/openfaas/of-watchdog:0.10.7 as watchdog
FROM --platform=${TARGETPLATFORM:-linux/amd64} python:3.12-alpine

# Install PostgreSQL and Pillow dependencies
RUN apk add --no-cache postgresql-dev gcc python3-dev musl-dev \
    zlib-dev jpeg-dev tiff-dev freetype-dev lcms2-dev \
    openjpeg-dev libwebp-dev

COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog
RUN chmod +x /usr/bin/fwatchdog

# Add non root user
RUN addgroup -S app && adduser app -S -G app
RUN chown app /home/app

WORKDIR /home/app/

COPY --chown=app:app index.py           .
COPY --chown=app:app requirements.txt   .

RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p function
RUN touch ./function/__init__.py

WORKDIR /home/app/function/
COPY --chown=app:app function/requirements.txt        .

# Install packages using pip
RUN pip install --no-cache-dir --user -r requirements.txt

# Install packages from the function folder
COPY --chown=app:app function/           .

# Allow any user to write to the app folder
# OpenShift runs with a random user ID
RUN chmod g+w -R /home/app

WORKDIR /home/app/

USER app

ENV fprocess="python index.py"
ENV cgi_headers="true"
ENV mode="http"
ENV upstream_url="http://127.0.0.1:5000"

HEALTHCHECK --interval=5s CMD [ -e /tmp/.lock ] || exit 1

CMD ["fwatchdog"]