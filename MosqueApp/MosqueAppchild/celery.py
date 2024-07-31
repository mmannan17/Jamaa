from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
import django
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'MosqueAppchild.settings')

# Initialize Django
django.setup()

app = Celery('MosqueAppchild')

# Using a string here means the worker will not have to
# pickle the object when using Windows.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Configure Celery logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Celery configuration settings
REDIS_URL = os.environ.get('REDIS_URL', 'redis://masjidapp-cache-uqcrs3.serverless.use1.cache.amazonaws.com:6379/0')
print(f'Configured Redis URL: {REDIS_URL}')  # Add this line to print the Redis URL

app.conf.update(
    broker_url=REDIS_URL,
    result_backend=REDIS_URL,
    worker_concurrency=1,  # Adjust concurrency as needed
    worker_prefetch_multiplier=1,  # Reduce prefetching to lower memory usage
    broker_transport_options={
        'max_retries': 3,
        'interval_start': 0,  # First retry immediately
        'interval_step': 0.2,  # Increase by 0.2s for each retry
        'interval_max': 0.5,  # Max 0.5s between retries
    },
    task_acks_late=True,  # Enable late acknowledgments to handle task failures better
    task_reject_on_worker_lost=True,  # Ensure tasks are re-queued if worker crashes
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks
    worker_max_memory_per_child=200000,  # Restart worker if memory usage exceeds 200MB (adjust as needed)
)

# Example task to verify configuration and log details
@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
    logging.debug(f'Task Request: {self.request!r}')
