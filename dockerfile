FROM python:3.12-slim-bookworm

# Set the variables venv would set
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install dependencies
COPY ./venv/docker.txt ./requirements.txt
RUN pip install -r requirements.txt

# Run the application
COPY flask ./code
# CMD exec gunicorn myapp:code/app.py