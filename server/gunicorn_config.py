import os

bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"
workers = 4
threads = 2
timeout = 120
keepalive = 5
worker_class = "sync"
loglevel = "debug" 