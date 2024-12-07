FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if needed, for example, if pyodbc/firestore needed extras.
# RUN apt-get update && apt-get install -y ...

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Copy serviceAccountKey.json if not already in code base
# Make sure this file is in your .gitignore if your repo is public
COPY serviceAccountKey.json /app/serviceAccountKey.json

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
