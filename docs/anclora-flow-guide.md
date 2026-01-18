# ANCLORA FLOW - GUÍA TÉCNICA AVANZADA

**Última actualización:** 2026-01-17  
**Versión:** 1.1.0  
**Para:** Desarrolladores, DevOps, Arquitectos

---

## TABLA DE CONTENIDOS

1. [Configuración OCR Avanzada](#configuración-ocr-avanzada)
2. [Estrategias de Storage](#estrategias-de-storage)
3. [Integración Asistente IA](#integración-asistente-ia)
4. [Optimización de Rendimiento](#optimización-de-rendimiento)
5. [Seguridad](#seguridad)
6. [Troubleshooting Avanzado](#troubleshooting-avanzado)
7. [Analytics - Dashboard de Uso](#analytics---dashboard-de-uso)
8. [Configuración Avanzada del Asistente IA](#configuración-avanzada-del-asistente-ia)

---

## CONFIGURACIÓN OCR AVANZADA

### Comparativa de Motores

| Aspecto | Tesseract | PaddleOCR | RapidOCR |
|---------|-----------|-----------|----------|
| **Costo** | $0 | $0 | $0 |
| **Precisión** | 70-80% | 90%+ | 88-92% |
| **Velocidad** | Lenta | Media | Muy rápida |
| **Memoria** | Baja (50MB) | Alta (500MB) | Media (200MB) |
| **Detección rotación** | No | Sí | Sí |
| **Tablas** | Limitado | Excelente | Bueno |
| **Multiidioma** | 25+ | Nativo | Nativo |
| **Mejor para** | MVP/Testing | Producción | Batch masivo |

---

### Opción 1: Tesseract (Recomendado para MVP)

**Ventajas:**
- ✅ Completamente open-source
- ✅ Bajo consumo de recursos
- ✅ Instalación sencilla
- ✅ 0€ de costo

**Desventajas:**
- ❌ Precisión media (70-80%)
- ❌ Lento con imágenes de mala calidad

**Instalación:**

```bash
# macOS
brew install tesseract tesseract-lang

# Ubuntu
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-spa libtesseract-dev

# En requirements.txt
pytesseract==0.3.10
pdf2image==1.16.3
Pillow==9.5.0
```

**Configuración .env:**
```
TESSERACT_CMD=/usr/bin/tesseract  # Linux/macOS
TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe  # Windows
```

**Código de prueba:**
```python
import pytesseract
from PIL import Image

# Probar extracción
text = pytesseract.image_to_string("factura.jpg", lang='spa+eng')
print(text)

# Si da error, setear en código:
import pytesseract
pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

---

### Opción 2: PaddleOCR (Mejor precisión - RECOMENDADO)

**Ventajas:**
- ✅ Excelente precisión (90%+)
- ✅ Soporte multiidioma nativo
- ✅ Detección de tablas
- ✅ Mejor manejo de rotación y perspectiva

**Desventajas:**
- ❌ Requiere 200MB para descargar modelo
- ❌ Más lento que Tesseract
- ❌ Mayor consumo de memoria
- ❌ Mejor en GPU

**Instalación:**
```bash
pip install paddleocr==2.7.0.3
# Primera ejecución descarga ~200MB de modelos
```

**Implementación completa:**
```python
from paddleocr import PaddleOCR
from PIL import Image
import re

class PaddleOCRService:
    def __init__(self, use_gpu: bool = False):
        self.ocr = PaddleOCR(
            use_angle_cls=True,  # Detectar rotación
            lang=['es', 'en'],   # Español e inglés
            use_gpu=use_gpu
        )
    
    async def extract_invoice_data(self, image_path: str) -> dict:
        """Extrae datos estructurados de factura"""
        
        result = self.ocr.ocr(image_path, cls=True)
        
        extracted = {
            "items": [],
            "total": None,
            "tax": None,
            "vendor": None,
            "date": None,
            "document_number": None,
            "confidence": 0.0
        }
        
        text_parts = []
        confidences = []
        
        # Procesar líneas y palabras
        for line in result:
            if not line:
                continue
            
            for word_info in line:
                text = word_info[1][0]
                confidence = word_info[1][1]
                
                if confidence > 0.5:
                    text_parts.append(text)
                    confidences.append(confidence)
                    extracted["items"].append({
                        "text": text,
                        "confidence": confidence
                    })
        
        # Texto completo para regex
        full_text = " ".join(text_parts)
        
        # Confianza promedio
        extracted["confidence"] = sum(confidences) / len(confidences) if confidences else 0
        
        # Parsear datos estructurados
        extracted.update(self._parse_structured_data(full_text))
        
        return extracted
    
    def _parse_structured_data(self, text: str) -> dict:
        """Parsear datos de factura con regex"""
        parsed = {}
        
        # Búsqueda de total
        total_match = re.search(r'(?:TOTAL|Total|IMPORTE).*?(\d+[.,]\d{2})', text, re.IGNORECASE)
        if total_match:
            parsed["total"] = float(total_match.group(1).replace(',', '.'))
        
        # Búsqueda de IVA
        tax_match = re.search(r'(?:IVA|TAX|IMPUESTO).*?(\d+[.,]\d{2})', text, re.IGNORECASE)
        if tax_match:
            parsed["tax"] = float(tax_match.group(1).replace(',', '.'))
        
        # Búsqueda de fecha (DD/MM/YYYY o DD-MM-YYYY)
        date_match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', text)
        if date_match:
            parsed["date"] = f"{date_match.group(3)}-{date_match.group(2)}-{date_match.group(1)}"
        
        # Búsqueda de número de documento
        doc_match = re.search(r'(?:Factura|Número|N[ºo]\.?)\s*[:#]?\s*([A-Z0-9]+)', text, re.IGNORECASE)
        if doc_match:
            parsed["document_number"] = doc_match.group(1)
        
        # Proveedor: primera línea larga con mayúsculas
        lines = text.split('\n')
        for line in lines[:5]:
            if len(line) > 5:
                upper_count = sum(1 for c in line if c.isupper())
                if upper_count > 3:
                    parsed["vendor"] = line.strip()
                    break
        
        return parsed

# Uso
ocr = PaddleOCRService(use_gpu=False)
data = await ocr.extract_invoice_data("factura.pdf")
print(data)
```

---

### Opción 3: RapidOCR (Ultra-rápido para batch)

```bash
pip install rapidocr-onnxruntime
```

**Caso de uso:** Procesamiento masivo de 1000+ documentos

```python
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
result, _ = ocr(image_path)  # Muy rápido
```

---

## ESTRATEGIAS DE STORAGE

### Opción 1: Storage Local (MVP/Testing)

**Coste:** $0  
**Mejor para:** Desarrollo, MVP local

```python
# backend/app/services/storage_service.py

import os
import aiofiles
from pathlib import Path
from datetime import datetime
from typing import Optional

class LocalStorageService:
    def __init__(self):
        self.base_path = Path(os.getenv("STORAGE_PATH", "./storage"))
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    async def upload_file(
        self, 
        file, 
        folder: str, 
        custom_name: Optional[str] = None
    ) -> str:
        """
        Subir archivo localmente
        Retorna: /storage/receipts/20260117_120530_factura.pdf
        """
        folder_path = self.base_path / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_name = custom_name or Path(file.filename).stem
        file_ext = Path(file.filename).suffix[1:].lower()
        
        file_name = f"{timestamp}_{safe_name}.{file_ext}"
        file_path = folder_path / file_name
        
        # Guardar archivo con streaming
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return f"/storage/{folder}/{file_name}"
    
    async def cleanup_old_files(self, days: int = 90):
        """Limpiar archivos más antiguos que N días"""
        from datetime import timedelta
        
        cutoff = datetime.now() - timedelta(days=days)
        deleted_count = 0
        
        for root, dirs, files in os.walk(self.base_path):
            for file in files:
                file_path = Path(root) / file
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                
                if mtime < cutoff:
                    file_path.unlink()
                    deleted_count += 1
        
        print(f"Deleted {deleted_count} old files")

# Scheduler para limpieza automática
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.add_job(
    cleanup_storage,
    'cron',
    hour=3,
    minute=0
)
scheduler.start()
```

**Setup en docker-compose.yml:**
```yaml
services:
  backend:
    volumes:
      - ./storage:/app/storage  # Persistir archivos
```

---

### Opción 2: Backblaze B2 (Producción - Presupuesto)

**Coste:** ~$6 USD/TB/mes (después del free tier: 10GB/mes gratis)  
**Mejor para:** Producción con presupuesto limitado

```bash
pip install b2sdk
```

**Implementación:**
```python
from b2sdk.v2 import InMemoryAccountInfo, B2Api
import os

class BackblazeB2StorageService:
    def __init__(self):
        self.info = InMemoryAccountInfo()
        self.b2_api = B2Api(self.info)
        
        app_key = os.getenv("B2_APP_KEY")
        app_key_id = os.getenv("B2_APP_KEY_ID")
        self.bucket_name = os.getenv("B2_BUCKET_NAME")
        
        self.b2_api.authorize_account("production", app_key_id, app_key)
        self.bucket = self.b2_api.get_bucket_by_name(self.bucket_name)
    
    async def upload_file(self, file, folder: str, custom_name: str = None) -> str:
        """Subir a B2 y retornar URL pública"""
        from datetime import datetime
        from pathlib import Path
        
        content = await file.read()
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_name = custom_name or Path(file.filename).stem
        file_ext = Path(file.filename).suffix[1:].lower()
        
        file_name = f"{folder}/{timestamp}_{safe_name}.{file_ext}"
        
        file_info = self.bucket.upload_bytes(content, file_name)
        
        # URL pública
        return f"https://{self.bucket_name}.s3.us-west-000.backblazeb2.com/{file_name}"
```

**.env:**
```
B2_APP_KEY_ID=your_key_id_here
B2_APP_KEY=your_app_key_here
B2_BUCKET_NAME=anclora-flow-receipts
USE_BACKBLAZE_B2=true
```

---

### Opción 3: DigitalOcean Spaces (Producción - Balance)

**Coste:** $5 USD/mes (250GB)  
**Mejor para:** Producción con mejor UX

```bash
pip install boto3
```

```python
import boto3
import os

class DigitalOceanSpacesStorageService:
    def __init__(self):
        self.client = boto3.client(
            's3',
            region_name=os.getenv("DO_REGION", "nyc3"),
            endpoint_url=f"https://{os.getenv('DO_REGION', 'nyc3')}.digitaloceanspaces.com",
            aws_access_key_id=os.getenv("DO_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("DO_SECRET_KEY")
        )
        self.bucket = os.getenv("DO_BUCKET_NAME")
    
    async def upload_file(self, file, folder: str, custom_name: str = None) -> str:
        from datetime import datetime
        from pathlib import Path
        
        content = await file.read()
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_name = custom_name or Path(file.filename).stem
        file_ext = Path(file.filename).suffix[1:].lower()
        
        key = f"{folder}/{timestamp}_{safe_name}.{file_ext}"
        
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=content,
            ACL='public-read'
        )
        
        return f"https://{self.bucket}.nyc3.digitaloceanspaces.com/{key}"
```

---

## INTEGRACIÓN ASISTENTE IA

### Backend - Endpoint del Asistente

```python
# backend/app/api/v1/routes/assistant.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import os
import anthropic
from datetime import datetime

from app.core.security import get_current_user
from app.database import get_db

router = APIRouter(prefix="/assistant", tags=["assistant"])

class TaxAssistant:
    """Asistente IA especializado en fiscalidad española"""
    
    def __init__(self):
        self.api_key = os.getenv("CLAUDE_API_KEY")
        self.model = "claude-3-5-sonnet-20241022"
    
    async def get_response(self, message: str, context: str = "tax") -> str:
        """
        Obtener respuesta del asistente
        Contextos: tax, accounting, invoicing, payments
        """
        
        client = anthropic.Anthropic(api_key=self.api_key)
        system_prompt = self._get_system_prompt(context)
        
        response = client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {"role": "user", "content": message}
            ]
        )
        
        return response.content[0].text
    
    def _get_system_prompt(self, context: str) -> str:
        """Prompts especializados por contexto"""
        
        base = """Eres un asesor fiscal y contable especializado en autónomos españoles.
Responde siempre en español, de forma clara, práctica y actualizada para 2026.
Basa tus respuestas en normativa vigente."""
        
        contexts = {
            "tax": base + """
Especialidad: Impuestos, modelos fiscales (130, 303, 111), retenciones, IRPF, IVA.
Proporciona información actualizada sobre obligaciones fiscales españolas.
Cita la normativa específica cuando sea relevante.""",
            
            "accounting": base + """
Especialidad: Contabilidad, registros PGC, deducibilidad de gastos, márgenes.
Ayuda a optimizar la gestión contable y la estructura de los registros.
Sugiere mejores prácticas de organización contable.""",
            
            "invoicing": base + """
Especialidad: Facturación, control de pagos, cobranza, clientes morosos.
Sugiere estrategias para mejorar flujo de caja y reducir riesgo de impago.
Incluye mejores prácticas en facturación electrónica.""",
            
            "payments": base + """
Especialidad: Gestión de cobros, métodos de pago, reconciliación bancaria.
Resuelve dudas sobre pagos recibidos y gestión de tesorería.
Prevención de fraude y mejora de procesos de cobro."""
        }
        
        return contexts.get(context, base)

assistant = TaxAssistant()

@router.post("/chat")
async def chat_with_assistant(
    message: str,
    context: str = "tax",
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat con asistente IA"""
    
    try:
        response = await assistant.get_response(message, context)
        
        # Guardar en activity log
        from app.models import ActivityLog
        activity = ActivityLog(
            user_id=current_user.id,
            action_type="assistant_query",
            description=message[:100],
            metadata={
                "context": context,
                "response_length": len(response),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        db.add(activity)
        db.commit()
        
        return {
            "response": response,
            "context": context,
            "tokens_used": len(response.split())
        }
    
    except anthropic.APIError as e:
        return {"error": f"API Error: {str(e)}", "response": None}
    except Exception as e:
        return {"error": str(e), "response": None}
```

**.env:**
```
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxx
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

**requirements.txt:**
```
anthropic==0.20.0
```

---

## OPTIMIZACIÓN DE RENDIMIENTO

### Caching de OCR

```python
# backend/app/services/ocr_cache.py

import redis
import json
from hashlib import md5

class OCRCacheService:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        self.ttl = 86400 * 7  # 7 días
    
    def get_cache_key(self, file_hash: str) -> str:
        return f"ocr:result:{file_hash}"
    
    def get_file_hash(self, file_content: bytes) -> str:
        """MD5 hash del contenido del archivo"""
        return md5(file_content).hexdigest()
    
    async def get(self, file_hash: str) -> dict | None:
        """Obtener resultado de caché"""
        key = self.get_cache_key(file_hash)
        cached = self.redis_client.get(key)
        
        if cached:
            return json.loads(cached)
        return None
    
    async def set(self, file_hash: str, ocr_result: dict):
        """Guardar resultado en caché"""
        key = self.get_cache_key(file_hash)
        self.redis_client.setex(
            key,
            self.ttl,
            json.dumps(ocr_result)
        )

# Uso en OCR service
async def extract_data_async(self, file_path, receipt_id):
    cache = OCRCacheService()
    
    # Generar hash del archivo
    with open(file_path, 'rb') as f:
        file_hash = cache.get_file_hash(f.read())
    
    # Buscar en caché
    cached_result = await cache.get(file_hash)
    if cached_result:
        print(f"✅ Cache hit para {receipt_id}")
        return cached_result
    
    # Ejecutar OCR
    result = await self.extract_text_paddle(file_path)
    
    # Guardar en caché
    await cache.set(file_hash, result)
    
    return result
```

### Batch Processing con Celery

```python
# backend/app/tasks/ocr_batch.py

from celery import Celery
from app.services.ocr_service import OCRService
from datetime import datetime

celery_app = Celery('anclora_flow')

@celery_app.task(queue='ocr', max_retries=3)
def process_receipt_ocr(receipt_id: str):
    """Procesar OCR en worker separado"""
    
    from app.database import SessionLocal
    from app.models import Receipt
    
    db = SessionLocal()
    
    try:
        receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
        
        if receipt:
            ocr_service = OCRService()
            result = ocr_service.extract_text_paddle(receipt.file_url)
            
            receipt.extracted_data = result
            receipt.extraction_status = "completed"
            receipt.processed_at = datetime.utcnow()
            db.commit()
    
    except Exception as e:
        process_receipt_ocr.retry(exc=e, countdown=60)
    
    finally:
        db.close()

# En routes/receipts.py
@router.post("/")
async def upload_receipt(file: UploadFile, current_user = Depends(get_current_user)):
    # ... crear receipt ...
    
    # Encolar en background
    process_receipt_ocr.delay(str(receipt.id))
    
    return {
        "success": True,
        "message": "Archivo subido. Procesando...",
        "receipt_id": receipt.id
    }
```

---

## SEGURIDAD

### Validación de Archivos

```python
# backend/app/utils/validators.py

import magic
from pathlib import Path

class FileSecurityValidator:
    ALLOWED_MIMETYPES = {
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @staticmethod
    def validate_file_type(file_path: str) -> bool:
        """Validar tipo MIME real (no solo extensión)"""
        mime = magic.Magic(mime=True)
        file_mime = mime.from_file(file_path)
        
        return file_mime in FileSecurityValidator.ALLOWED_MIMETYPES
    
    @staticmethod
    def validate_file_size(file_size: int) -> bool:
        """Validar tamaño máximo"""
        return file_size <= FileSecurityValidator.MAX_FILE_SIZE

# En upload_receipt
from fastapi import HTTPException

async def upload_receipt(file: UploadFile):
    # Validar extensión
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in ['.pdf', '.jpg', '.jpeg', '.png']:
            raise HTTPException(status_code=400, detail="Extensión no permitida")
    
    # Validar tamaño
    content = await file.read()
    if not FileSecurityValidator.validate_file_size(len(content)):
        raise HTTPException(status_code=413, detail="Archivo muy grande")
    
    # Validar MIME type
    file_path = await storage_service.upload_file(file, "receipts")
    if not FileSecurityValidator.validate_file_type(file_path):
        raise HTTPException(status_code=400, detail="Tipo de archivo inválido")
```

### Rate Limiting

```python
# En main.py

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/health")
@limiter.limit("1/second")
async def health_check(request: Request):
    return {"status": "ok"}

# En rutas
@router.post("/")
@limiter.limit("5/minute")
async def upload_receipt(request: Request, file: UploadFile):
    # Máximo 5 uploads por minuto por IP
    pass
```

---

## TROUBLESHOOTING AVANZADO

### OCR muy lento

**Síntomas:** Uploads tardan >30 segundos

**Soluciones:**

```bash
# 1. Activar GPU
pip install paddleocr onnxruntime-gpu
export USE_GPU=true

# 2. Reducir resolución
# En OCR service:
image = Image.open(file_path)
if image.width > 2000:
    image.thumbnail((image.width // 2, image.height // 2))

# 3. Usar RapidOCR para batch
pip install rapidocr-onnxruntime
```

### Monitoreo de Memory Leak

```python
# backend/app/utils/monitoring.py

import psutil

class SystemMonitor:
    @staticmethod
    def get_memory_usage() -> dict:
        process = psutil.Process()
        memory_info = process.memory_info()
        
        return {
            "rss_mb": memory_info.rss / 1024 / 1024,
            "vms_mb": memory_info.vms / 1024 / 1024,
            "percent": process.memory_percent()
        }
    
    @staticmethod
    def get_system_memory() -> dict:
        vm = psutil.virtual_memory()
        return {
            "total_mb": vm.total / 1024 / 1024,
            "available_mb": vm.available / 1024 / 1024,
            "percent_used": vm.percent
        }

# Endpoint de debug
@app.get("/debug/monitoring")
async def get_monitoring_info(current_user = Depends(get_current_user)):
    if os.getenv("ENVIRONMENT") != "development":
        raise HTTPException(status_code=403)
    
    return {
        "process": SystemMonitor.get_memory_usage(),
        "system": SystemMonitor.get_system_memory()
    }
```

### Backup de Base de Datos

```bash
# Backup automático
docker exec anclora_postgres pg_dump -U user db > backup_$(date +%Y%m%d).sql

# Restaurar
docker exec -i anclora_postgres psql -U user db < backup_20260117.sql
```

---

## ANALYTICS - DASHBOARD DE USO

### Modelo de Datos para Analytics

Primero, agregar a tus modelos SQLAlchemy (`backend/app/models/analytics.py`):

```python
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class AnalyticsEvent(Base):
    """Eventos de uso del sistema"""
    __tablename__ = "analytics_events"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, index=True)
    event_type = Column(String)  # 'upload', 'ocr_success', 'assistant_query', etc.
    event_category = Column(String)  # 'extraction', 'chat', 'user_action'
    duration_ms = Column(Integer, nullable=True)  # ms que tardó la operación
    status = Column(String)  # 'success', 'failed', 'pending'
    metadata = Column(JSON)  # Datos adicionales
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
class AnalyticsSummary(Base):
    """Resumen diario de métricas"""
    __tablename__ = "analytics_summary"
    
    id = Column(String, primary_key=True)
    date = Column(DateTime, index=True)
    total_uploads = Column(Integer, default=0)
    successful_extractions = Column(Integer, default=0)
    failed_extractions = Column(Integer, default=0)
    avg_extraction_time_ms = Column(Float, default=0)
    total_users_active = Column(Integer, default=0)
    assistant_queries = Column(Integer, default=0)
    avg_confidence = Column(Float, default=0)
    storage_used_mb = Column(Float, default=0)
```

### Backend - Servicio de Analytics

```python
# backend/app/services/analytics_service.py

from sqlalchemy import func, and_
from datetime import datetime, timedelta
from app.models.analytics import AnalyticsEvent, AnalyticsSummary
from app.database import SessionLocal
import uuid
import json

class AnalyticsService:
    @staticmethod
    def track_event(
        user_id: str,
        event_type: str,
        event_category: str,
        status: str = "success",
        duration_ms: int = None,
        metadata: dict = None
    ):
        """Registrar un evento de uso"""
        db = SessionLocal()
        
        try:
            event = AnalyticsEvent(
                id=str(uuid.uuid4()),
                user_id=user_id,
                event_type=event_type,
                event_category=event_category,
                status=status,
                duration_ms=duration_ms,
                metadata=metadata or {},
                created_at=datetime.utcnow()
            )
            db.add(event)
            db.commit()
        finally:
            db.close()
    
    @staticmethod
    def get_dashboard_metrics(days: int = 30) -> dict:
        """Métricas principales del dashboard"""
        db = SessionLocal()
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        try:
            # Uploads totales
            total_uploads = db.query(func.count(AnalyticsEvent.id)).filter(
                and_(
                    AnalyticsEvent.event_type == 'upload',
                    AnalyticsEvent.created_at >= cutoff_date
                )
            ).scalar() or 0
            
            # Extracciones exitosas
            successful_ocr = db.query(func.count(AnalyticsEvent.id)).filter(
                and_(
                    AnalyticsEvent.event_type == 'ocr_success',
                    AnalyticsEvent.created_at >= cutoff_date
                )
            ).scalar() or 0
            
            # Extracciones fallidas
            failed_ocr = db.query(func.count(AnalyticsEvent.id)).filter(
                and_(
                    AnalyticsEvent.event_type == 'ocr_failed',
                    AnalyticsEvent.created_at >= cutoff_date
                )
            ).scalar() or 0
            
            # Tasa de éxito
            success_rate = (successful_ocr / total_uploads * 100) if total_uploads > 0 else 0
            
            # Usuarios activos
            active_users = db.query(func.count(func.distinct(AnalyticsEvent.user_id))).filter(
                AnalyticsEvent.created_at >= cutoff_date
            ).scalar() or 0
            
            # Queries al asistente
            assistant_queries = db.query(func.count(AnalyticsEvent.id)).filter(
                and_(
                    AnalyticsEvent.event_type == 'assistant_query',
                    AnalyticsEvent.created_at >= cutoff_date
                )
            ).scalar() or 0
            
            # Tiempo promedio de extracción
            avg_extraction_time = db.query(func.avg(AnalyticsEvent.duration_ms)).filter(
                and_(
                    AnalyticsEvent.event_type.in_(['ocr_success', 'ocr_failed']),
                    AnalyticsEvent.created_at >= cutoff_date
                )
            ).scalar() or 0
            
            return {
                "total_uploads": total_uploads,
                "successful_extractions": successful_ocr,
                "failed_extractions": failed_ocr,
                "success_rate": f"{success_rate:.2f}%",
                "active_users": active_users,
                "assistant_queries": assistant_queries,
                "avg_extraction_time_ms": round(avg_extraction_time, 2),
                "period_days": days
            }
        finally:
            db.close()
    
    @staticmethod
    def get_timeline_data(days: int = 30, interval: str = "day") -> list:
        """Datos de timeline para gráficas"""
        db = SessionLocal()
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        try:
            events = db.query(
                func.date_trunc(interval, AnalyticsEvent.created_at).label('period'),
                func.count(AnalyticsEvent.id).label('upload_count'),
                func.sum(
                    func.cast(
                        AnalyticsEvent.event_type == 'ocr_success',
                        Integer
                    )
                ).label('success_count')
            ).filter(
                AnalyticsEvent.created_at >= cutoff_date
            ).group_by(
                func.date_trunc(interval, AnalyticsEvent.created_at)
            ).all()
            
            return [
                {
                    "period": str(e.period),
                    "uploads": e.upload_count,
                    "successes": e.success_count or 0
                }
                for e in events
            ]
        finally:
            db.close()
    
    @staticmethod
    def get_user_stats(user_id: str) -> dict:
        """Estadísticas de usuario individual"""
        db = SessionLocal()
        
        try:
            user_events = db.query(AnalyticsEvent).filter(
                AnalyticsEvent.user_id == user_id
            ).all()
            
            uploads = [e for e in user_events if e.event_type == 'upload']
            extractions = [e for e in user_events if e.event_type in ['ocr_success', 'ocr_failed']]
            queries = [e for e in user_events if e.event_type == 'assistant_query']
            
            extraction_times = [e.duration_ms for e in extractions if e.duration_ms]
            avg_time = sum(extraction_times) / len(extraction_times) if extraction_times else 0
            
            return {
                "total_uploads": len(uploads),
                "total_extractions": len(extractions),
                "successful_extractions": len([e for e in extractions if e.status == 'success']),
                "assistant_queries": len(queries),
                "avg_extraction_time_ms": round(avg_time, 2),
                "last_activity": max([e.created_at for e in user_events], default=None)
            }
        finally:
            db.close()
```

### Backend - Rutas para Analytics

```python
# backend/app/api/v1/routes/analytics.py

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import time

from app.core.security import get_current_user
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard")
async def get_dashboard(
    days: int = 30,
    current_user = Depends(get_current_user)
):
    """Obtener métricas del dashboard"""
    
    # Verificar permisos (solo admin)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    
    metrics = AnalyticsService.get_dashboard_metrics(days)
    timeline = AnalyticsService.get_timeline_data(days, "day")
    
    return {
        "metrics": metrics,
        "timeline": timeline,
        "generated_at": datetime.utcnow().isoformat()
    }

@router.get("/user-stats")
async def get_user_stats(current_user = Depends(get_current_user)):
    """Obtener estadísticas del usuario actual"""
    
    stats = AnalyticsService.get_user_stats(current_user.id)
    
    return {
        "user_id": current_user.id,
        "stats": stats
    }

# Integración con upload endpoint
@router.post("/receipts")
async def upload_receipt_with_tracking(
    file: UploadFile,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload con tracking de analytics"""
    start_time = time.time()
    
    try:
        # ... código de upload ...
        receipt = Receipt(user_id=current_user.id, file_url=file_path)
        db.add(receipt)
        db.commit()
        
        # Registrar evento exitoso
        duration_ms = int((time.time() - start_time) * 1000)
        AnalyticsService.track_event(
            user_id=current_user.id,
            event_type="upload",
            event_category="extraction",
            status="success",
            duration_ms=duration_ms,
            metadata={"file_name": file.filename, "file_size": len(content)}
        )
        
        return {"success": True, "receipt_id": receipt.id}
        
    except Exception as e:
        # Registrar evento fallido
        duration_ms = int((time.time() - start_time) * 1000)
        AnalyticsService.track_event(
            user_id=current_user.id,
            event_type="upload",
            event_category="extraction",
            status="failed",
            duration_ms=duration_ms,
            metadata={"error": str(e)}
        )
        raise HTTPException(status_code=400, detail=str(e))
```

### Frontend - Dashboard React

```typescript
// frontend/src/pages/Analytics.tsx

import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface Metrics {
  total_uploads: number;
  successful_extractions: number;
  failed_extractions: number;
  success_rate: string;
  active_users: number;
  assistant_queries: number;
  avg_extraction_time_ms: number;
  period_days: number;
}

interface TimelineData {
  period: string;
  uploads: number;
  successes: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/v1/analytics/dashboard?days=${days}`);
        setMetrics(response.data.metrics);
        setTimeline(response.data.timeline);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  if (loading) return <div>Cargando...</div>;
  if (!metrics) return <div>Error cargando métricas</div>;

  return (
    <div className="analytics-dashboard p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8">Dashboard de Analíticas</h1>
      
      {/* Selector de período */}
      <div className="mb-6 flex gap-2">
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded ${days === d ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          >
            Últimos {d} días
          </button>
        ))}
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Uploads Totales"
          value={metrics.total_uploads}
          icon="📤"
        />
        <MetricCard
          title="Extracciones Exitosas"
          value={metrics.successful_extractions}
          icon="✅"
        />
        <MetricCard
          title="Tasa de Éxito"
          value={metrics.success_rate}
          icon="📊"
        />
        <MetricCard
          title="Usuarios Activos"
          value={metrics.active_users}
          icon="👥"
        />
      </div>

      {/* Gráfica de timeline */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Tendencia de Uploads</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="uploads" stroke="#8884d8" name="Uploads" />
            <Line type="monotone" dataKey="successes" stroke="#82ca9d" name="Éxitos" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Tiempo Promedio de Extracción</h3>
          <p className="text-2xl font-bold text-blue-600">
            {metrics.avg_extraction_time_ms}ms
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Queries al Asistente</h3>
          <p className="text-2xl font-bold text-green-600">
            {metrics.assistant_queries}
          </p>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: number | string; icon: string }> = ({
  title,
  value,
  icon
}) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
  </div>
);
```

---

## CONFIGURACIÓN AVANZADA DEL ASISTENTE IA

### Mejora de Prompts Especializados

El archivo anterior es básico. Aquí amplificamos la especialización:

```python
# backend/app/services/advanced_assistant_service.py

import anthropic
import json
from typing import Optional, List
from datetime import datetime
from app.database import SessionLocal
from app.models import ConversationHistory

class AdvancedAssistant:
    """Asistente IA con contexto avanzado y memory management"""
    
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))
        self.model = "claude-3-5-sonnet-20241022"
        self.max_tokens = 2048
        self.conversation_history = []
    
    async def get_contextualized_response(
        self,
        user_message: str,
        context_type: str,
        user_id: str,
        user_data: Optional[dict] = None
    ) -> dict:
        """
        Obtener respuesta contextualizada del asistente
        
        context_type: 'tax', 'accounting', 'invoicing', 'payments', 'analysis'
        """
        
        # Recuperar historial de conversación
        conversation = self._load_conversation_history(user_id)
        
        # Construir sistema prompt especializado
        system_prompt = self._build_system_prompt(context_type, user_data)
        
        # Agregar mensaje del usuario al historial
        conversation.append({"role": "user", "content": user_message})
        
        # Limitar historial a últimas 10 conversaciones
        if len(conversation) > 20:
            conversation = conversation[-20:]
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_prompt,
                messages=conversation
            )
            
            assistant_message = response.content[0].text
            
            # Guardar en historial
            conversation.append({"role": "assistant", "content": assistant_message})
            self._save_conversation_history(user_id, conversation)
            
            return {
                "response": assistant_message,
                "context": context_type,
                "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
                "success": True
            }
        
        except anthropic.APIError as e:
            return {
                "response": None,
                "error": f"API Error: {str(e)}",
                "success": False
            }
    
    def _build_system_prompt(self, context_type: str, user_data: Optional[dict] = None) -> str:
        """Construir prompt especializado según contexto"""
        
        base_context = """Eres un asesor especializado para autónomos españoles.
Responde siempre en español, de forma clara, práctica y basada en normativa actual 2026.
Cuando menciones leyes o normativas, cita de forma específica.
Sé conciso pero completo en tus explicaciones."""
        
        contexts = {
            "tax": self._tax_prompt(base_context, user_data),
            "accounting": self._accounting_prompt(base_context, user_data),
            "invoicing": self._invoicing_prompt(base_context, user_data),
            "payments": self._payments_prompt(base_context, user_data),
            "analysis": self._analysis_prompt(base_context, user_data)
        }
        
        return contexts.get(context_type, base_context)
    
    def _tax_prompt(self, base: str, user_data: Optional[dict]) -> str:
        """Prompt especializado en fiscalidad"""
        
        prompt = base + """

ESPECIALIDAD: Fiscalidad y obligaciones tributarias
ENFOQUE: Soluciones prácticas y cumplimiento normativo

ÁREAS PRINCIPALES:
1. Modelos de declaración: 130 (retenciones e ingresos), 303 (IVA trimestral), 111 (IRPF)
2. Regímenes de IVA: Régimen ordinario, SII (Suministro Inmediato de Información)
3. Retenciones: IRPF en servicios profesionales (15%), IVA en importaciones
4. Deducibilidad de gastos: Criterios para gastos deducibles/no deducibles
5. Estimación de impuestos: Cálculo anticipado de obligaciones

NORMATIVA APLICABLE:
- Ley 35/1988 (IRPF)
- Ley 37/1992 (IVA)
- RD 1096/1988 (Reglamento de Procedimiento de Recaudación)
- Instrucciones de la AEAT actualizadas 2026

RECOMENDACIONES AL RESPONDER:
- Proporciona cálculos concretos cuando sea posible
- Menciona plazos de presentación específicos
- Advierte sobre cambios recientes en normativa
- Sugiere estrategias legales de optimización fiscal"""
        
        if user_data and user_data.get("monthly_income"):
            prompt += f"""

CONTEXTO DEL USUARIO:
- Ingresos mensuales: {user_data['monthly_income']}€
- Actividad: {user_data.get('activity_type', 'No especificada')}
- Régimen IVA: {user_data.get('vat_regime', 'No indicado')}"""
        
        return prompt
    
    def _accounting_prompt(self, base: str, user_data: Optional[dict]) -> str:
        """Prompt especializado en contabilidad"""
        
        prompt = base + """

ESPECIALIDAD: Contabilidad y gestión financiera
ENFOQUE: Organización y optimización de registros contables

ÁREAS PRINCIPALES:
1. Plan General de Contabilidad (PGC): Cuentas, registros y asientos
2. Deducibilidad de gastos: Documentación necesaria y criterios
3. Provisiones y reservas: Gestión correcta para productividad
4. Márgenes y rentabilidad: Análisis de costes y análisis de beneficios
5. Registro en diario: Formas correctas de documentación

MEJORES PRÁCTICAS:
- Mantener separación clara entre gastos personales y empresariales
- Documentación de todos los gastos (facturas, recibos, contratos)
- Revisión periódica de cuentas por cobrar/pagar
- Actualizar catálogo de cuentas según cambios de actividad

ALERTAS COMUNES:
- Mezcla de gastos personales = rechazo en auditoría
- Falta de justificante = gasto no deducible
- Facturas sin IBAN para retención = problemas SII"""
        
        return prompt
    
    def _invoicing_prompt(self, base: str, user_data: Optional[dict]) -> str:
        """Prompt especializado en facturación"""
        
        prompt = base + """

ESPECIALIDAD: Facturación y gestión de cobros
ENFOQUE: Optimizar ingresos y minimizar riesgo de impago

ÁREAS PRINCIPALES:
1. Requisitos legales de factura: Datos obligatorios según Directiva 2014/55/UE
2. Facturación electrónica: Requisitos técnicos y legales
3. Gestión de vencimientos: Estrategias de cobro
4. Descuentos y bonificaciones: Tratamiento fiscal
5. Devoluciones y rectificativas: Trámite correcto

DATOS OBLIGATORIOS EN FACTURA:
- Número secuencial único
- Fecha de emisión
- Datos identificativos (CIF, nombre)
- Descripción clara de servicios/productos
- Base imponible, tipo IVA y total
- Forma de pago y cuenta bancaria
- Información SII

ESTRATEGIAS DE COBRO:
- Establecer términos de pago claros (máx 30-60 días)
- Enviar recordatorios automáticos
- Ofrecer descuentos por pago anticipado
- Incluir cláusula de intereses de demora (Ley 3/2004)"""
        
        return prompt
    
    def _payments_prompt(self, base: str, user_data: Optional[dict]) -> str:
        """Prompt especializado en pagos y tesorería"""
        
        prompt = base + """

ESPECIALIDAD: Gestión de pagos y tesorería
ENFOQUE: Optimizar flujo de caja y gestión bancaria

ÁREAS PRINCIPALES:
1. Métodos de pago: Transferencia, cheque, efectivo, agregadores
2. Reconciliación bancaria: Proceso mensual de validación
3. Previsión de tesorería: Flujo de entrada/salida de caja
4. Gestión de prórrogas: Procedimiento legal de moratoria
5. Prevención de fraude: Alertas y mejores prácticas

GESTIÓN ÓPTIMA DE PAGOS:
- Mantener fondo de maniobra = gastos 2-3 meses
- Automatizar pagos recurrentes (nómina, proveedores)
- Realizar reconciliación semanal vs mensuales
- Monitorizar gastos por categoría

PREVENCIÓN DE FRAUDE:
- Verificar CIFs antes de transferencias grandes
- Usar herramientas de detección de cambios de cuenta
- Implementar flujo de aprobación de pagos
- Auditar movimientos sospechosos"""
        
        return prompt
    
    def _analysis_prompt(self, base: str, user_data: Optional[dict]) -> str:
        """Prompt para análisis y reportes"""
        
        prompt = base + """

ESPECIALIDAD: Análisis financiero y reportes
ENFOQUE: Interpretación de datos y toma de decisiones

HERRAMIENTAS ANALÍTICAS:
1. Ratios de rentabilidad: ROI, margen neto, ROA
2. Análisis de tendencias: Comparativa periodo anterior
3. Proyecciones: Forecast de ingresos/gastos
4. Benchmarking: Comparativa con sector
5. Señales de alerta: Indicadores de riesgo

MÉTRICAS CLAVE A MONITORIZAR:
- Ingresos mes anterior vs mes actual (% cambio)
- Ratio de gastos sobre ingresos (debe estar <60%)
- Días de venta pendiente de cobro (DPO)
- Margen bruto y neto
- Rentabilidad sobre inversión

RECOMENDACIONES EN REPORTES:
- Ser específico con cifras y porcentajes
- Incluir visualizaciones (gráficas, tablas)
- Proponer acciones correctivas concretas
- Comparar con períodos anteriores
- Destacar puntos de alerta rojo"""
        
        return prompt
    
    def _load_conversation_history(self, user_id: str) -> List[dict]:
        """Cargar historial de conversación del usuario"""
        db = SessionLocal()
        
        try:
            history = db.query(ConversationHistory).filter(
                ConversationHistory.user_id == user_id
            ).order_by(ConversationHistory.created_at.desc()).first()
            
            if history and history.messages:
                return json.loads(history.messages)
            return []
        
        finally:
            db.close()
    
    def _save_conversation_history(self, user_id: str, conversation: List[dict]):
        """Guardar historial de conversación"""
        db = SessionLocal()
        
        try:
            history = db.query(ConversationHistory).filter(
                ConversationHistory.user_id == user_id
            ).first()
            
            if history:
                history.messages = json.dumps(conversation)
                history.updated_at = datetime.utcnow()
            else:
                from app.models import ConversationHistory
                history = ConversationHistory(
                    user_id=user_id,
                    messages=json.dumps(conversation),
                    created_at=datetime.utcnow()
                )
                db.add(history)
            
            db.commit()
        
        finally:
            db.close()

# Modelo de base de datos para historial
# backend/app/models/conversation.py

from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime

class ConversationHistory(Base):
    """Historial de conversaciones con el asistente"""
    __tablename__ = "conversation_history"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, index=True)
    messages = Column(Text)  # JSON serializado
    context_type = Column(String, default="tax")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Endpoint mejorado del asistente

```python
# backend/app/api/v1/routes/assistant_advanced.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.security import get_current_user
from app.services.advanced_assistant_service import AdvancedAssistant

router = APIRouter(prefix="/assistant", tags=["assistant"])

class AssistantRequest(BaseModel):
    message: str
    context: str = "tax"  # tax, accounting, invoicing, payments, analysis

@router.post("/v2/chat")
async def advanced_chat(
    request: AssistantRequest,
    current_user = Depends(get_current_user)
):
    """Chat mejorado con contexto y memory"""
    
    # Obtener datos del usuario para contexto
    user_data = {
        "monthly_income": current_user.monthly_income,
        "activity_type": current_user.activity_type,
        "vat_regime": current_user.vat_regime
    }
    
    assistant = AdvancedAssistant()
    
    result = await assistant.get_contextualized_response(
        user_message=request.message,
        context_type=request.context,
        user_id=current_user.id,
        user_data=user_data
    )
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    # Registrar en analytics
    AnalyticsService.track_event(
        user_id=current_user.id,
        event_type="assistant_query",
        event_category="chat",
        status="success",
        metadata={
            "context": request.context,
            "message_length": len(request.message),
            "response_length": len(result["response"]),
            "tokens_used": result["tokens_used"]
        }
    )
    
    return {
        "response": result["response"],
        "context": result["context"],
        "tokens_used": result["tokens_used"]
    }
```

---

## CHECKLIST DE DEPLOYMENT ACTUALIZADO

### Backend
- [ ] OCR engine elegido y configurado
- [ ] Storage elegido (local, B2 o DigitalOcean)
- [ ] Modelos de Analytics creados en DB
- [ ] Servicio de Analytics implementado
- [ ] Rutas de Analytics configuradas
- [ ] Servicio avanzado del asistente implementado
- [ ] Modelos de ConversationHistory en DB
- [ ] Variables de entorno completadas
- [ ] Base de datos migrada
- [ ] Redis corriendo
- [ ] Celery workers activos

### Frontend
- [ ] Componente Dashboard React creado
- [ ] Gráficas de Recharts integradas
- [ ] Selectores de período funcionando
- [ ] Llamadas a /analytics/dashboard integradas
- [ ] Estilos y responsive design aplicados

### Producción
- [ ] Logs centralizados (Datadog/ELK)
- [ ] Monitoring de endpoints activo
- [ ] Backups automáticos DB
- [ ] SSL/HTTPS configurado
- [ ] Rate limiting activo
- [ ] CORS limitado
- [ ] Tests de carga pasados
- [ ] Documentación API actualizada

---

**Última actualización:** 2026-01-17  
**Versión:** 1.1.0  
**Mantenedor:** Equipo ANCLORA Flow