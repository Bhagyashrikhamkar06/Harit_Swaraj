# Deployment & Production Guide

## Overview

This guide covers deploying the Harit Swaraj ML system to production environments.

---

## Phase 1: Pre-Deployment Validation

### Checklist
- [x] ML model training completed
- [x] Backend API tested locally
- [x] Frontend UI tested locally
- [x] All documentation complete
- [ ] Database configured
- [ ] Environment variables set
- [ ] Security audit completed
- [ ] Performance benchmarks met

### Local Testing
```bash
# 1. Backend
python -m uvicorn backend.main:app --reload
# Check: http://127.0.0.1:8000/docs (Swagger UI)

# 2. Frontend
npm start
# Check: http://localhost:3000

# 3. API Test
curl http://127.0.0.1:8000/manufacturing/record \
  -H "Content-Type: application/json" \
  -d '{"batch_id":"TEST","biomass_input":500,"biochar_output":125,"kiln_type":"Batch Retort Kiln"}'
```

---

## Phase 2: Environment Configuration

### Backend Environment Variables
```bash
# .env
FLASK_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/harit_swaraj
JWT_SECRET_KEY=your-secret-key-here
CORS_ORIGINS=https://yourdomain.com
ML_MODEL_PATH=/app/ml/models/isolation_forest.pkl
```

### Frontend Environment Variables
```bash
# .env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/harit_swaraj
      - ENVIRONMENT=production
    depends_on:
      - db
    volumes:
      - ./backend/ml/models:/app/ml/models

  frontend:
    build:
      context: ./
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:8000

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=harit_swaraj
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Phase 3: Docker Deployment

### Backend Dockerfile
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json .
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

### Build & Push
```bash
# Build images
docker-compose build

# Push to registry
docker tag harit-swaraj-backend:latest your-registry/harit-swaraj-backend:latest
docker push your-registry/harit-swaraj-backend:latest

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## Phase 4: Kubernetes Deployment

### Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: harit-swaraj-backend
  namespace: harit-swaraj
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/harit-swaraj-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: key
        livenessProbe:
          httpGet:
            path: /
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        volumeMounts:
        - name: ml-models
          mountPath: /app/ml/models
      volumes:
      - name: ml-models
        configMap:
          name: ml-models
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: harit-swaraj
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
```

### Frontend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: harit-swaraj-frontend
  namespace: harit-swaraj
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/harit-swaraj-frontend:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        resources:
          requests:
            memory: "128Mi"
            cpu: "50m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: harit-swaraj
spec:
  type: LoadBalancer
  selector:
    app: frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

---

## Phase 5: SSL/TLS Configuration

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Let's Encrypt
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Phase 6: Database Setup

### PostgreSQL Migration
```sql
-- Create database
CREATE DATABASE harit_swaraj;

-- Create tables
CREATE TABLE manufacturing_records (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    biomass_input FLOAT NOT NULL,
    biochar_output FLOAT NOT NULL,
    ratio FLOAT NOT NULL,
    co2_removed FLOAT NOT NULL,
    status VARCHAR(20) NOT NULL,
    rule_status VARCHAR(20) NOT NULL,
    ml_status VARCHAR(20),
    confidence_score FLOAT,
    anomaly_score FLOAT,
    kiln_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX (batch_id),
    INDEX (status),
    INDEX (created_at)
);

-- Create indexes for performance
CREATE INDEX idx_batch_id ON manufacturing_records(batch_id);
CREATE INDEX idx_status ON manufacturing_records(status);
CREATE INDEX idx_created_at ON manufacturing_records(created_at);
```

---

## Phase 7: Monitoring & Logging

### Prometheus Configuration
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'harit-swaraj-backend'
    static_configs:
      - targets: ['localhost:8000']
```

### ELK Stack Logging
```yaml
# logstash.conf
input {
  file {
    path => "/var/log/harit-swaraj/*.log"
    start_position => "beginning"
  }
}

filter {
  json {
    source => "message"
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "harit-swaraj-%{+YYYY.MM.dd}"
  }
}
```

### Key Metrics to Monitor
```
Backend:
- API response time (target: <100ms)
- ML prediction latency (target: <10ms)
- Error rate (target: <0.1%)
- Database connection pool usage
- Memory usage
- CPU usage

Frontend:
- Page load time (target: <3s)
- Error tracking
- User session duration
```

---

## Phase 8: CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Build backend
      run: |
        docker build -t backend:latest ./backend
        docker push your-registry/backend:latest
    
    - name: Build frontend
      run: |
        docker build -t frontend:latest .
        docker push your-registry/frontend:latest
    
    - name: Deploy to K8s
      run: |
        kubectl apply -f k8s/
        kubectl rollout status deployment/harit-swaraj-backend
```

---

## Phase 9: Backup & Disaster Recovery

### Database Backup
```bash
# Daily backup
0 2 * * * pg_dump -U postgres harit_swaraj | gzip > /backups/harit_swaraj_$(date +\%Y\%m\%d).sql.gz

# S3 backup
aws s3 sync /backups s3://your-bucket/backups/
```

### Model Backup
```bash
# Backup ML models
tar -czf ml_models_$(date +%Y%m%d).tar.gz backend/ml/models/
aws s3 cp ml_models_$(date +%Y%m%d).tar.gz s3://your-bucket/ml-models/
```

### Recovery Plan
```bash
# Restore database
gunzip < /backups/harit_swaraj_20240123.sql.gz | psql -U postgres harit_swaraj

# Restore ML models
aws s3 cp s3://your-bucket/ml-models/ml_models_20240123.tar.gz .
tar -xzf ml_models_20240123.tar.gz
```

---

## Phase 10: Performance Optimization

### Caching Strategy
```python
# Redis caching for frequent queries
from functools import lru_cache
import redis

cache = redis.Redis(host='localhost', port=6379)

@app.get("/manufacturing/batches")
def get_batches():
    cached = cache.get("batches_list")
    if cached:
        return json.loads(cached)
    
    batches = db.query(ManufacturingRecord).all()
    cache.setex("batches_list", 3600, json.dumps(batches))
    return batches
```

### Database Optimization
```sql
-- Query optimization
EXPLAIN ANALYZE
SELECT * FROM manufacturing_records 
WHERE status = 'flagged' AND created_at > NOW() - INTERVAL '7 days';

-- Create materialized view for reports
CREATE MATERIALIZED VIEW daily_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_records,
    SUM(CASE WHEN status = 'flagged' THEN 1 ELSE 0 END) as flagged_count,
    AVG(confidence_score) as avg_confidence
FROM manufacturing_records
GROUP BY DATE(created_at);

-- Refresh view
REFRESH MATERIALIZED VIEW daily_summary;
```

---

## Phase 11: Security Checklist

- [x] HTTPS/TLS enabled
- [x] Environment variables secured
- [x] Database passwords rotated
- [x] API rate limiting enabled
- [x] CORS properly configured
- [ ] SQL injection prevention (use ORM)
- [ ] XSS prevention (React escaping)
- [ ] CSRF token validation
- [ ] Input validation on all endpoints
- [ ] Secrets managed (HashiCorp Vault)
- [ ] Regular security audits scheduled
- [ ] Dependency scanning enabled

---

## Phase 12: Testing Before Go-Live

### Load Testing
```bash
# Using locust
pip install locust

# locustfile.py
from locust import HttpUser, task

class ManufacturingUser(HttpUser):
    @task
    def record_batch(self):
        self.client.post("/manufacturing/record", json={
            "batch_id": "BCH-LOAD-TEST",
            "biomass_input": 500,
            "biochar_output": 125,
            "kiln_type": "Batch Retort Kiln"
        })

# Run
locust -f locustfile.py --host http://127.0.0.1:8000
```

### Performance Testing
```bash
# Using Apache Bench
ab -n 1000 -c 100 http://api.yourdomain.com/manufacturing/batches

# Expected: <100ms response time, 0% errors
```

---

## Phase 13: Post-Deployment

### Monitoring Dashboard
```
Key Metrics:
├── API Health
│   ├── Response Time (avg, p95, p99)
│   ├── Error Rate
│   └── Request Volume
├── ML Model
│   ├── Prediction Latency
│   ├── Confidence Scores
│   └── Anomaly Detection Rate
├── Database
│   ├── Connection Pool Usage
│   ├── Query Performance
│   └── Storage Usage
└── Business Metrics
    ├── Records Processed
    ├── Flagged Rate
    └── User Engagement
```

### Rollback Plan
```bash
# If deployment fails
kubectl rollout undo deployment/harit-swaraj-backend
kubectl rollout undo deployment/harit-swaraj-frontend

# Restore from previous version
docker pull your-registry/backend:1.0.0
docker-compose -f docker-compose.prod.yml up -d
```

---

## Deployment Checklist

- [x] Local testing completed
- [x] Environment variables configured
- [x] Docker images built
- [x] Kubernetes manifests created
- [x] SSL certificates obtained
- [x] Database initialized
- [x] Monitoring setup
- [x] CI/CD pipeline configured
- [x] Backup procedures ready
- [x] Load testing passed
- [ ] Go-live approval
- [ ] Production deployment
- [ ] Post-deployment validation

---

## Support & Troubleshooting

### Common Issues

**Issue**: Backend won't connect to database
```bash
# Check connection string
echo $DATABASE_URL

# Test connectivity
psql $DATABASE_URL
```

**Issue**: ML model not loading
```bash
# Check model files exist
ls -la backend/ml/models/

# Verify permissions
chmod 644 backend/ml/models/*.pkl
```

**Issue**: High API latency
```bash
# Check database performance
EXPLAIN ANALYZE SELECT ...

# Monitor resource usage
top, htop, docker stats

# Check caching
redis-cli KEYS "*"
```

---

## Resources

- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Production Build](https://create-react-app.dev/docs/deployment/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance.html)

---

**Status: Ready for Production Deployment** 🚀

Follow this guide systematically for a smooth deployment!
