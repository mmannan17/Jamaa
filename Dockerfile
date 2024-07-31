# Use the official Python image from the Docker Hub
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variables
ENV DJANGO_SETTINGS_MODULE=MosqueAppchild.settings
ENV PYTHONPATH=/app/MosqueApp

# Run the migration script and then start the Django server
CMD ["sh", "-c", "if [ \"$RUN_MIGRATIONS\" = \"true\" ]; then python manage.py migrate; fi && python manage.py runserver 0.0.0.0:8000"]
