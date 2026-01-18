# ANCLORA FLOW - GUÍA TÉCNICA AVANZADA

**Última actualización:** 2026-01-17  
**Versión:** 1.0.1  
**Para:** Desarrolladores, DevOps, Arquitectos

---

## TABLA DE CONTENIDOS

1. [Configuración OCR Avanzada](#configuración-ocr-avanzada)
2. [Estrategias de Storage](#estrategias-de-storage)
3. [Integración Asistente IA](#integración-asistente-ia)
4. [Optimización de Rendimiento](#optimización-de-rendimiento)
5. [Seguridad](#seguridad)
6. [Troubleshooting Avanzado](#troubleshooting-avanzado)

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

## CHECKLIST DE DEPLOYMENT

- [ ] OCR engine elegido y configurado
- [ ] Storage elegido (local, B2 o DigitalOcean)
- [ ] Variables de entorno completadas
- [ ] Base de datos migrada
- [ ] Redis corriendo
- [ ] Celery workers activos
- [ ] Logs centralizados
- [ ] Monitoring activo
- [ ] Backups automáticos
- [ ] SSL/HTTPS configurado
- [ ] Rate limiting activo
- [ ] CORS limitado
- [ ] Tests pasando 100%
- [ ] Load testing completado

---

**Última actualización:** 2026-01-17  
**Versión:** 1.0.1
