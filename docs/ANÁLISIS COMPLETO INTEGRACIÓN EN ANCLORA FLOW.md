<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Este es el repositorio actual del proyecto:

[https://github.com/ToniIAPro73/Anclora-Flow.git](https://github.com/ToniIAPro73/Anclora-Flow.git)
Quiero que lo analices para que la integración de nuevas funcionalidades tanto de adjuntar justificante como de los cobros se ajuste a dicho repositorio. También quiero que genere los servicios de OCR y de storage, teniendo en cuenta también cómo se ha estructurado el directorio y teniendo en cuenta que solamente estoy buscando opciones o herramientas open source o zero o low cost.

Quiero también que incluyas las tres opciones que faltan del menú, cuyos pantallazos también te hayas juntado.

Excelente. Voy a crear una estructura completa basada en tu repositorio. Permíteme generar los documentos finales integrados:

# ANÁLISIS COMPLETO: INTEGRACIÓN EN ANCLORA FLOW

## PARTE 1: ESTRUCTURA DE DIRECTORIOS (ACTUAL vs NUEVA)

```
anclora-flow/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── routes/
│   │   │   │   │   ├── payments.py          ✨ NUEVO
│   │   │   │   │   ├── receipts.py          ✨ NUEVO
│   │   │   │   │   ├── invoices.py
│   │   │   │   │   ├── expenses.py
│   │   │   │   │   ├── reports.py           ✨ NUEVO
│   │   │   │   │   └── ...
│   │   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── models/                          ✨ ACTUALIZAR
│   │   │   ├── payment.py                   ✨ NUEVO
│   │   │   ├── receipt.py                   ✨ NUEVO
│   │   │   ├── bank_account.py              ✨ NUEVO
│   │   │   ├── invoice.py                   ✨ ACTUALIZAR
│   │   │   └── ...
│   │   ├── schemas/                         ✨ ACTUALIZAR
│   │   │   ├── payment.py                   ✨ NUEVO
│   │   │   ├── receipt.py                   ✨ NUEVO
│   │   │   └── ...
│   │   ├── services/                        ✨ NUEVO
│   │   │   ├── storage_service.py
│   │   │   ├── ocr_service.py
│   │   │   ├── payment_service.py
│   │   │   └── receipt_service.py
│   │   ├── utils/
│   │   │   ├── validators.py
│   │   │   └── enums.py
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   │   ├── test_payments.py                 ✨ NUEVO
│   │   ├── test_receipts.py                 ✨ NUEVO
│   │   └── ...
│   ├── requirements.txt
│   ├── .env.example
│   └── docker-compose.yml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── modals/
│   │   │   │   ├── AddPaymentModal.tsx       ✨ NUEVO
│   │   │   │   ├── AddReceiptModal.tsx       ✨ NUEVO
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Invoices.tsx
│   │   │   ├── Expenses.tsx
│   │   │   ├── Reports.tsx                  ✨ NUEVO
│   │   │   ├── Calendar.tsx                 ✨ NUEVO
│   │   │   ├── Assistant.tsx                ✨ NUEVO
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── payments.ts                  ✨ NUEVO
│   │   │   └── receipts.ts                  ✨ NUEVO
│   │   └── ...
│   └── ...
│
└── README.md
```


***

## PARTE 2: MODELOS SQLALCHEMY (PYTHON/POSTGRESQL)

```python
# backend/app/models/payment.py

from sqlalchemy import Column, String, DECIMAL, Date, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, date
import uuid
from enum import Enum

from app.database import Base

class PaymentMethod(str, Enum):
    BANK_TRANSFER = "bank_transfer"
    CARD = "card"
    CASH = "cash"
    CHEQUE = "cheque"
    PAYPAL = "paypal"
    STRIPE = "stripe"
    OTHER = "other"

class PaymentStatus(str, Enum):
    REGISTERED = "registered"
    RECONCILED = "reconciled"
    REJECTED = "rejected"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    
    amount = Column(DECIMAL(12, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    transaction_id = Column(String(255), unique=True, nullable=True)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.REGISTERED)
    reconciliation_date = Column(Date, nullable=True)
    
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")
    bank_account = relationship("BankAccount", back_populates="payments")
    receipts = relationship("Receipt", back_populates="payment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Payment {self.id} - {self.amount}€ - {self.payment_method}>"
```

```python
# backend/app/models/receipt.py

from sqlalchemy import Column, String, DECIMAL, Date, DateTime, ForeignKey, Boolean, Enum as SQLEnum, JSON, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from enum import Enum

from app.database import Base

class ReceiptType(str, Enum):
    INVOICE = "invoice"
    TICKET = "ticket"
    RECEIPT = "receipt"
    ALBARAN = "albaran"
    BANK_STATEMENT = "bank_statement"
    OTHER = "other"

class EntityType(str, Enum):
    EXPENSE = "expense"
    PAYMENT = "payment"
    INVOICE = "invoice"
    SUBSCRIPTION = "subscription"

class ExtractionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    receipt_type = Column(SQLEnum(ReceiptType), nullable=False)
    entity_type = Column(SQLEnum(EntityType), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Archivo
    file_name = Column(String(255), nullable=False)
    file_size = Column(BigInteger, nullable=False)  # bytes
    file_type = Column(String(50), nullable=True)   # pdf, jpg, png, docx, xlsx
    file_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Metadata del documento
    document_date = Column(Date, nullable=True)
    vendor_name = Column(String(255), nullable=True)
    invoice_number = Column(String(100), nullable=True)
    document_total = Column(DECIMAL(12, 2), nullable=True)
    currency = Column(String(10), default="EUR")
    
    # OCR/Clasificación
    is_verified = Column(Boolean, default=False)
    extraction_status = Column(SQLEnum(ExtractionStatus), default=ExtractionStatus.PENDING)
    extracted_data = Column(JSONB, nullable=True)  # JSON con datos extraídos
    
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="receipts")
    payment = relationship("Payment", back_populates="receipts")

    def __repr__(self):
        return f"<Receipt {self.id} - {self.receipt_type} - {self.file_name}>"
```

```python
# backend/app/models/bank_account.py

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.database import Base

class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    bank_name = Column(String(255), nullable=False)
    account_holder = Column(String(255), nullable=False)
    iban = Column(String(34), unique=True, nullable=False)
    bic = Column(String(11), nullable=True)
    
    account_type = Column(String(50), default="business")  # business, personal
    currency = Column(String(10), default="EUR")
    
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="bank_accounts")
    payments = relationship("Payment", back_populates="bank_account")

    def __repr__(self):
        return f"<BankAccount {self.bank_name} - {self.iban}>"
```

```python
# backend/app/models/__init__.py - ACTUALIZAR

from app.models.user import User
from app.models.client import Client
from app.models.project import Project
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.models.expense import Expense
from app.models.subscription import Subscription
from app.models.payment import Payment              # ✨ NUEVO
from app.models.receipt import Receipt              # ✨ NUEVO
from app.models.bank_account import BankAccount     # ✨ NUEVO
from app.models.tax_event import TaxEvent
from app.models.budget import Budget
from app.models.activity_log import ActivityLog

__all__ = [
    "User",
    "Client",
    "Project",
    "Invoice",
    "InvoiceItem",
    "Expense",
    "Subscription",
    "Payment",        # ✨
    "Receipt",        # ✨
    "BankAccount",    # ✨
    "TaxEvent",
    "Budget",
    "ActivityLog",
]
```


***

## PARTE 3: SCHEMAS PYDANTIC

```python
# backend/app/schemas/payment.py

from pydantic import BaseModel, Field, validator
from datetime import date
from decimal import Decimal
from typing import Optional
from enum import Enum
from uuid import UUID

class PaymentMethod(str, Enum):
    BANK_TRANSFER = "bank_transfer"
    CARD = "card"
    CASH = "cash"
    CHEQUE = "cheque"
    PAYPAL = "paypal"
    STRIPE = "stripe"
    OTHER = "other"

class PaymentStatus(str, Enum):
    REGISTERED = "registered"
    RECONCILED = "reconciled"
    REJECTED = "rejected"

class PaymentCreate(BaseModel):
    invoice_id: UUID
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    payment_date: date = Field(..., description="Cannot be in the future")
    payment_method: PaymentMethod
    transaction_id: Optional[str] = Field(None, max_length=255)
    bank_account_id: Optional[UUID] = None
    notes: Optional[str] = Field(None, max_length=500)

    @validator('payment_date')
    def validate_payment_date(cls, v):
        from datetime import date as d
        if v > d.today():
            raise ValueError("Payment date cannot be in the future")
        return v

    class Config:
        schema_extra = {
            "example": {
                "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
                "amount": 1000.50,
                "payment_date": "2026-01-17",
                "payment_method": "bank_transfer",
                "transaction_id": "TRF202601171234567",
                "bank_account_id": "550e8400-e29b-41d4-a716-446655440001",
                "notes": "Pago parcial del cliente"
            }
        }

class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    reconciliation_date: Optional[date] = None

class PaymentResponse(BaseModel):
    id: UUID
    invoice_id: UUID
    amount: Decimal
    payment_date: date
    payment_method: PaymentMethod
    status: PaymentStatus
    transaction_id: Optional[str]
    reconciliation_date: Optional[date]
    notes: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class PaymentDetailResponse(PaymentResponse):
    bank_account: Optional[dict] = None
    invoice_number: Optional[str] = None
    client_name: Optional[str] = None
```

```python
# backend/app/schemas/receipt.py

from pydantic import BaseModel, Field, validator
from datetime import date
from decimal import Decimal
from typing import Optional, Dict, Any
from enum import Enum
from uuid import UUID

class ReceiptType(str, Enum):
    INVOICE = "invoice"
    TICKET = "ticket"
    RECEIPT = "receipt"
    ALBARAN = "albaran"
    BANK_STATEMENT = "bank_statement"
    OTHER = "other"

class EntityType(str, Enum):
    EXPENSE = "expense"
    PAYMENT = "payment"
    INVOICE = "invoice"
    SUBSCRIPTION = "subscription"

class ExtractionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ReceiptCreate(BaseModel):
    receipt_type: ReceiptType
    entity_type: EntityType
    entity_id: UUID
    document_date: Optional[date] = None
    vendor_name: Optional[str] = Field(None, max_length=255)
    invoice_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)

class ReceiptResponse(BaseModel):
    id: UUID
    receipt_type: ReceiptType
    entity_type: EntityType
    entity_id: UUID
    file_name: str
    file_url: str
    thumbnail_url: Optional[str]
    document_date: Optional[date]
    vendor_name: Optional[str]
    invoice_number: Optional[str]
    extraction_status: ExtractionStatus
    is_verified: bool
    extracted_data: Optional[Dict[str, Any]]
    notes: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

class ExtractedDataSchema(BaseModel):
    total_amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    vendor_name: Optional[str] = None
    document_number: Optional[str] = None
    document_date: Optional[str] = None
    items: Optional[list] = None
    confidence: Optional[float] = None
```


***

## PARTE 4: SERVICIOS (STORAGE + OCR)

```python
# backend/app/services/storage_service.py

import os
import aiofiles
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
from PIL import Image
import io
from datetime import datetime

class StorageService:
    """
    Servicio de almacenamiento local.
    Para producción, migrar a: Backblaze B2, DigitalOcean Spaces, MinIO
    """
    
    def __init__(self):
        # Configuración
        self.base_path = Path(os.getenv("STORAGE_PATH", "./storage"))
        self.max_file_size = int(os.getenv("MAX_FILE_SIZE", 50 * 1024 * 1024))  # 50MB
        self.allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'}
        self.thumbnail_size = (200, 200)
        
        # Crear directorios si no existen
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    async def upload_file(
        self,
        file: UploadFile,
        folder: str,
        custom_name: Optional[str] = None
    ) -> str:
        """
        Subir archivo a almacenamiento local
        Retorna: path relativo para acceso HTTP
        """
        
        # Validar extensión
        file_ext = Path(file.filename).suffix[1:].lower()
        if file_ext not in self.allowed_extensions:
            raise ValueError(f"Extensión no permitida: {file_ext}")
        
        # Crear carpeta
        folder_path = self.base_path / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        
        # Nombre del archivo
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_name = custom_name or Path(file.filename).stem
        file_name = f"{timestamp}_{safe_name}.{file_ext}"
        
        # Guardar archivo
        file_path = folder_path / file_name
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Retornar path relativo
        return f"/storage/{folder}/{file_name}"
    
    async def create_thumbnail(self, file_url: str, size: Optional[tuple] = None) -> str:
        """Generar thumbnail para imágenes"""
        
        try:
            # Obtener path local del archivo
            file_path = self.base_path / file_url.lstrip("/storage/")
            
            if not file_path.exists():
                return None
            
            # Abrir imagen
            image = Image.open(file_path)
            size = size or self.thumbnail_size
            image.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Guardar thumbnail
            thumb_path = file_path.parent / f"thumb_{file_path.name}"
            image.save(thumb_path, optimize=True, quality=85)
            
            return f"/storage/{file_url.split('/storage/')[^1].split('/')[^0]}/thumb_{file_path.name}"
        
        except Exception as e:
            print(f"Error creating thumbnail: {str(e)}")
            return None
    
    async def delete_file(self, file_url: str) -> bool:
        """Eliminar archivo"""
        
        try:
            file_path = self.base_path / file_url.lstrip("/storage/")
            
            if file_path.exists():
                file_path.unlink()
            
            # Eliminar thumbnail si existe
            thumb_path = file_path.parent / f"thumb_{file_path.name}"
            if thumb_path.exists():
                thumb_path.unlink()
            
            return True
        
        except Exception as e:
            print(f"Error deleting file: {str(e)}")
            return False


# Para PRODUCCIÓN: Usar Backblaze B2 (Free tier + $6/TB/month)
class BackblazeB2StorageService:
    """
    Servicio para Backblaze B2
    Requiere: pip install b2sdk
    """
    
    def __init__(self):
        from b2sdk.v2 import InMemoryAccountInfo, B2Api
        
        self.info = InMemoryAccountInfo()
        self.b2_api = B2Api(self.info)
        
        app_key = os.getenv("B2_APP_KEY")
        app_key_id = os.getenv("B2_APP_KEY_ID")
        self.bucket_name = os.getenv("B2_BUCKET_NAME")
        
        self.b2_api.authorize_account("production", app_key_id, app_key)
        self.bucket = self.b2_api.get_bucket_by_name(self.bucket_name)
    
    async def upload_file(
        self,
        file: UploadFile,
        folder: str,
        custom_name: Optional[str] = None
    ) -> str:
        """Subir a Backblaze B2"""
        
        content = await file.read()
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_name = custom_name or Path(file.filename).stem
        file_ext = Path(file.filename).suffix[1:].lower()
        
        file_name = f"{folder}/{timestamp}_{safe_name}.{file_ext}"
        
        file_info = self.bucket.upload_bytes(content, file_name)
        
        return f"https://{self.bucket_name}.s3.us-west-000.backblazeb2.com/{file_name}"
```

```python
# backend/app/services/ocr_service.py

import asyncio
from typing import Optional, Dict, Any
from pathlib import Path
import os
from datetime import datetime
from sqlalchemy.orm import Session

class OCRService:
    """
    Servicio OCR con Tesseract (open source, gratuito)
    Alternativas: PaddleOCR (mejor precisión), RapidOCR (más rápido)
    """
    
    def __init__(self):
        self.tesseract_cmd = os.getenv("TESSERACT_CMD", "tesseract")
        self.use_paddle = os.getenv("USE_PADDLE_OCR", "false").lower() == "true"
    
    async def extract_text_tesseract(self, file_path: str) -> Dict[str, Any]:
        """
        Extracción con Tesseract (incluido en sistema)
        Requiere: apt-get install tesseract-ocr
        """
        try:
            import pytesseract
            from PIL import Image
            import pdf2image
            
            extracted_data = {
                "text": "",
                "confidence": 0.0,
                "processing_time": 0,
                "method": "tesseract"
            }
            
            start_time = datetime.utcnow()
            
            # Manejo de PDF
            if file_path.lower().endswith('.pdf'):
                images = pdf2image.convert_from_path(file_path)
                text_parts = []
                for image in images:
                    text = pytesseract.image_to_string(image, lang='spa+eng')
                    text_parts.append(text)
                extracted_data["text"] = "\n".join(text_parts)
            else:
                # Imagen
                image = Image.open(file_path)
                extracted_data["text"] = pytesseract.image_to_string(
                    image, 
                    lang='spa+eng',
                    config='--psm 6'
                )
            
            extracted_data["processing_time"] = (
                datetime.utcnow() - start_time
            ).total_seconds()
            
            return extracted_data
        
        except Exception as e:
            return {
                "text": "",
                "error": str(e),
                "method": "tesseract"
            }
    
    async def extract_text_paddle(self, file_path: str) -> Dict[str, Any]:
        """
        Extracción con PaddleOCR (mejor precisión)
        Requiere: pip install paddleocr
        Mejor para: Documentos formales, facturas, albaranes
        """
        try:
            from paddleocr import PaddleOCR
            from PIL import Image
            import pdf2image
            
            extracted_data = {
                "text": "",
                "confidence": 0.0,
                "processing_time": 0,
                "method": "paddle",
                "items": []
            }
            
            start_time = datetime.utcnow()
            
            # Inicializar OCR con idiomas
            ocr = PaddleOCR(use_angle_cls=True, lang='es')
            
            # Manejo de PDF
            if file_path.lower().endswith('.pdf'):
                images = pdf2image.convert_from_path(file_path)
                text_parts = []
                for image in images:
                    result = ocr.ocr(str(image), cls=True)
                    for line in result:
                        for word_info in line:
                            text = word_info[^1][^0]
                            confidence = word_info[^1][^1]
                            text_parts.append(text)
                            extracted_data["items"].append({
                                "text": text,
                                "confidence": float(confidence)
                            })
                    extracted_data["text"] += " ".join(text_parts) + "\n"
            else:
                # Imagen
                result = ocr.ocr(file_path, cls=True)
                for line in result:
                    for word_info in line:
                        text = word_info[^1][^0]
                        confidence = word_info[^1][^1]
                        extracted_data["text"] += text + " "
                        extracted_data["items"].append({
                            "text": text,
                            "confidence": float(confidence)
                        })
            
            # Calcular confianza promedio
            if extracted_data["items"]:
                avg_confidence = sum(
                    item["confidence"] 
                    for item in extracted_data["items"]
                ) / len(extracted_data["items"])
                extracted_data["confidence"] = avg_confidence
            
            extracted_data["processing_time"] = (
                datetime.utcnow() - start_time
            ).total_seconds()
            
            return extracted_data
        
        except Exception as e:
            return {
                "text": "",
                "error": str(e),
                "method": "paddle"
            }
    
    async def parse_invoice_data(self, extracted_text: str) -> Dict[str, Any]:
        """
        Parseado inteligente de datos de factura
        Busca patrones: total, fecha, proveedor, número
        """
        import re
        from datetime import datetime
        
        parsed = {
            "total_amount": None,
            "tax_amount": None,
            "vendor_name": None,
            "document_number": None,
            "document_date": None,
            "confidence": 0.7
        }
        
        text = extracted_text.upper()
        
        # Buscar total
        total_patterns = [
            r'TOTAL\s*[:\s]*(\d+[.,]\d{2})\s*€',
            r'TOTAL\s*[:\s]*(\d+[.,]\d{2})',
            r'IMPORTE TOTAL\s*[:\s]*(\d+[.,]\d{2})',
        ]
        
        for pattern in total_patterns:
            match = re.search(pattern, text)
            if match:
                amount_str = match.group(1).replace(',', '.')
                parsed["total_amount"] = float(amount_str)
                break
        
        # Buscar IVA
        tax_patterns = [
            r'IVA\s*[:\s]*(\d+[.,]\d{2})\s*€',
            r'(?:I\.V\.A|IVA)\s*[:\s]*(\d+[.,]\d{2})',
        ]
        
        for pattern in tax_patterns:
            match = re.search(pattern, text)
            if match:
                tax_str = match.group(1).replace(',', '.')
                parsed["tax_amount"] = float(tax_str)
                break
        
        # Buscar fecha (DD/MM/YYYY o DD-MM-YYYY)
        date_pattern = r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})'
        match = re.search(date_pattern, text)
        if match:
            day, month, year = match.groups()
            try:
                parsed["document_date"] = datetime(
                    int(year), int(month), int(day)
                ).isoformat()
            except:
                pass
        
        # Buscar número de documento (primera línea con números)
        num_pattern = r'(?:FACTURA|FAC|DOCUMENTO|DOC|Nº)\s*[:\s]*([A-Z0-9\-/]+)'
        match = re.search(num_pattern, text)
        if match:
            parsed["document_number"] = match.group(1).strip()
        
        return parsed
    
    async def extract_data_async(
        self,
        receipt_id: str,
        file_url: str,
        db: Session = None
    ):
        """
        Procesamiento async de OCR
        Llamado en background task
        """
        try:
            from app.models import Receipt
            
            # Obtener ruta local
            file_path = Path(os.getenv("STORAGE_PATH", "./storage")) / file_url.lstrip("/storage/")
            
            # Ejecutar OCR
            if self.use_paddle:
                ocr_result = await self.extract_text_paddle(str(file_path))
            else:
                ocr_result = await self.extract_text_tesseract(str(file_path))
            
            # Parsear datos de factura
            parsed_invoice = await self.parse_invoice_data(
                ocr_result.get("text", "")
            )
            
            # Actualizar receipt en BD
            if db:
                receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
                if receipt:
                    receipt.extraction_status = "completed"
                    receipt.extracted_data = {
                        **parsed_invoice,
                        "raw_text": ocr_result.get("text", ""),
                        "processing_time": ocr_result.get("processing_time", 0),
                        "method": ocr_result.get("method", "")
                    }
                    db.commit()
        
        except Exception as e:
            print(f"OCR Error for {receipt_id}: {str(e)}")
            if db:
                receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
                if receipt:
                    receipt.extraction_status = "failed"
                    db.commit()
```


***

## PARTE 5: RUTAS (ROUTES)

```python
# backend/app/api/v1/routes/payments.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from decimal import Decimal
from typing import List
from uuid import UUID

from app.core.security import get_current_user
from app.database import get_db
from app.models import Payment, Invoice, BankAccount
from app.schemas.payment import (
    PaymentCreate, PaymentUpdate, PaymentResponse, PaymentDetailResponse
)

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/", response_model=dict)
async def create_payment(
    payment_data: PaymentCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear nuevo cobro"""
    
    # Validar factura
    invoice = db.query(Invoice).filter(
        Invoice.id == payment_data.invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    # Validar importe
    if payment_data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Importe debe ser mayor a 0"
        )
    
    if payment_data.amount > invoice.amount_pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Importe excede lo pendiente: {invoice.amount_pending}€"
        )
    
    # Validar banco
    if payment_data.bank_account_id:
        bank = db.query(BankAccount).filter(
            BankAccount.id == payment_data.bank_account_id,
            BankAccount.user_id == current_user.id
        ).first()
        
        if not bank:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cuenta bancaria no válida"
            )
    
    # Crear cobro
    payment = Payment(
        user_id=current_user.id,
        invoice_id=payment_data.invoice_id,
        amount=payment_data.amount,
        payment_date=payment_data.payment_date,
        payment_method=payment_data.payment_method.value,
        transaction_id=payment_data.transaction_id,
        bank_account_id=payment_data.bank_account_id,
        notes=payment_data.notes
    )
    
    db.add(payment)
    db.flush()
    
    # Actualizar estado factura
    await update_invoice_payment_status(db, invoice)
    
    # Log actividad
    from app.models import ActivityLog
    activity = ActivityLog(
        user_id=current_user.id,
        action_type="payment_created",
        entity_type="payment",
        entity_id=payment.id,
        description=f"Cobro de {payment.amount}€ registrado",
        metadata={"invoice_id": str(invoice.id)}
    )
    db.add(activity)
    
    db.commit()
    db.refresh(payment)
    
    return {
        "success": True,
        "message": "Cobro registrado exitosamente",
        "payment": PaymentResponse.from_orm(payment)
    }

@router.get("/invoice/{invoice_id}", response_model=List[PaymentResponse])
async def get_invoice_payments(
    invoice_id: UUID,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener cobros de una factura"""
    
    payments = db.query(Payment).filter(
        Payment.invoice_id == invoice_id,
        Payment.user_id == current_user.id
    ).order_by(Payment.payment_date.desc()).all()
    
    return [PaymentResponse.from_orm(p) for p in payments]

@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: UUID,
    payment_data: PaymentUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar estado de cobro (reconciliación)"""
    
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cobro no encontrado"
        )
    
    if payment_data.status:
        payment.status = payment_data.status.value
    
    if payment_data.reconciliation_date:
        payment.reconciliation_date = payment_data.reconciliation_date
    
    db.commit()
    db.refresh(payment)
    
    return PaymentResponse.from_orm(payment)

@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: UUID,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar cobro"""
    
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cobro no encontrado"
        )
    
    invoice = payment.invoice
    db.delete(payment)
    db.flush()
    
    # Recalcular estado factura
    await update_invoice_payment_status(db, invoice)
    db.commit()
    
    return {"success": True, "message": "Cobro eliminado"}

async def update_invoice_payment_status(db: Session, invoice: Invoice):
    """Recalcular estado de pago de factura"""
    
    total_payments = db.query(func.sum(Payment.amount)).filter(
        Payment.invoice_id == invoice.id,
        Payment.status.in_(["registered", "reconciled"])
    ).scalar() or Decimal(0)
    
    invoice.amount_paid = total_payments
    invoice.amount_pending = invoice.total - total_payments
    
    if invoice.amount_pending == Decimal(0):
        invoice.payment_status = "paid"
        invoice.payment_received_date = date.today()
    elif invoice.amount_pending < invoice.total:
        invoice.payment_status = "partially_paid"
    elif invoice.due_date < date.today() and invoice.payment_status == "unpaid":
        invoice.payment_status = "overdue"
    else:
        invoice.payment_status = "unpaid"
```

```python
# backend/app/api/v1/routes/receipts.py

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from uuid import UUID
from pathlib import Path

from app.core.security import get_current_user
from app.database import get_db
from app.models import Receipt
from app.schemas.receipt import ReceiptCreate, ReceiptResponse
from app.services.storage_service import StorageService
from app.services.ocr_service import OCRService

router = APIRouter(prefix="/receipts", tags=["receipts"])

ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'}
MAX_FILE_SIZE = 50 * 1024 * 1024

@router.post("/", response_model=dict)
async def upload_receipt(
    file: UploadFile = File(...),
    receipt_type: str = Form(...),
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    document_date: Optional[str] = Form(None),
    vendor_name: Optional[str] = Form(None),
    invoice_number: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subir justificante con OCR"""
    
    # Validar extensión
    file_ext = Path(file.filename).suffix[1:].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo no permitido. Usa: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validar tamaño
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Archivo muy grande (máx 50MB)"
        )
    
    try:
        # Guardar archivo
        storage_service = StorageService()
        file_url = await storage_service.upload_file(
            file,
            f"receipts/{current_user.id}",
            file.filename
        )
        
        # Generar thumbnail
        thumbnail_url = None
        if file_ext in {'jpg', 'jpeg', 'png'}:
            thumbnail_url = await storage_service.create_thumbnail(file_url)
        
        # Crear registro
        receipt = Receipt(
            user_id=current_user.id,
            receipt_type=receipt_type,
            entity_type=entity_type,
            entity_id=UUID(entity_id),
            file_name=file.filename,
            file_size=file_size,
            file_type=file_ext,
            file_url=file_url,
            thumbnail_url=thumbnail_url,
            document_date=document_date,
            vendor_name=vendor_name,
            invoice_number=invoice_number,
            notes=notes,
            extraction_status="processing"
        )
        
        db.add(receipt)
        db.commit()
        db.refresh(receipt)
        
        # OCR en background
        if background_tasks:
            ocr_service = OCRService()
            background_tasks.add_task(
                ocr_service.extract_data_async,
                str(receipt.id),
                file_url,
                db
            )
        
        return {
            "success": True,
            "message": "Justificante subido. OCR en proceso...",
            "receipt": ReceiptResponse.from_orm(receipt)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )

@router.get("/{entity_type}/{entity_id}", response_model=List[ReceiptResponse])
async def get_receipts(
    entity_type: str,
    entity_id: UUID,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener justificantes de una entidad"""
    
    receipts = db.query(Receipt).filter(
        Receipt.user_id == current_user.id,
        Receipt.entity_type == entity_type,
        Receipt.entity_id == entity_id
    ).order_by(Receipt.created_at.desc()).all()
    
    return [ReceiptResponse.from_orm(r) for r in receipts]

@router.delete("/{receipt_id}")
async def delete_receipt(
    receipt_id: UUID,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar justificante"""
    
    receipt = db.query(Receipt).filter(
        Receipt.id == receipt_id,
        Receipt.user_id == current_user.id
    ).first()
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Justificante no encontrado"
        )
    
    # Eliminar archivo
    storage_service = StorageService()
    await storage_service.delete_file(receipt.file_url)
    
    db.delete(receipt)
    db.commit()
    
    return {"success": True, "message": "Justificante eliminado"}
```


***

## PARTE 6: REQUIREMENTS.txt

```txt
# backend/requirements.txt - ACTUALIZAR

# FastAPI & Uvicorn
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1

# Auth & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0

# OCR Services (elige uno según necesidades)
# Tesseract (Ligero, open-source, requiere sistema operativo)
pytesseract==0.3.10
pdf2image==1.16.3

# OPCIONAL: PaddleOCR (Mejor precisión, más pesado)
# paddleocr==2.7.0.3

# Storage
aiofiles==23.2.1
Pillow==10.1.0

# B2 Backblaze (Para producción)
# b2sdk==2.2.1

# Data Validation
pydantic==2.5.0
pydantic-settings==2.1.0

# Utils
requests==2.31.0
python-dateutil==2.8.2

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2

# Development
black==23.12.0
flake8==6.1.0
isort==5.13.2
```


***

## PARTE 7: VARIABLES DE ENTORNO

```bash
# backend/.env.example

# DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/anclora_flow_db

# STORAGE
STORAGE_PATH=./storage
MAX_FILE_SIZE=52428800  # 50MB

# OCR Configuration
USE_PADDLE_OCR=false  # true para usar PaddleOCR, false para Tesseract
TESSERACT_CMD=/usr/bin/tesseract  # Ruta a tesseract en el sistema

# B2 Backblaze (si usas para producción)
USE_BACKBLAZE_B2=false
B2_APP_KEY_ID=
B2_APP_KEY=
B2_BUCKET_NAME=

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```


***

## PARTE 8: COMPONENTES REACT - MODALES AMPLIADOS

Continuaré en siguiente respuesta con los componentes React completos...
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^2][^20][^3][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: imagen.jpg

[^2]: imagen.jpg

[^3]: imagen.jpg

[^4]: imagen.jpg

[^5]: imagen.jpg

[^6]: https://www.reddit.com/r/coolgithubprojects/comments/1oliyr8/free_opensource_tool_flow_version_13x/

[^7]: https://codingbit.hashnode.dev/implement-ocr-api-using-fastapi

[^8]: https://next3offload.com/blog/amazon-s3-alternatives/

[^9]: https://flowengineering.com/github/

[^10]: https://www.youtube.com/watch?v=22encMxW1_I

[^11]: https://www.digitalocean.com/resources/articles/amazon-s3-alternatives

[^12]: https://flow.readthedocs.io/en/latest/flow.html

[^13]: https://github.com/RapidAI/RapidOCR

[^14]: https://catalyst.zoho.com/blog/5-best-alternatives-for-amazon-s3.html

[^15]: https://repo-tree-viewer.vercel.app

[^16]: https://www.youtube.com/watch?v=A5JHYMN4-p0

[^17]: https://www.apideck.com/blog/top-5-file-storage-apis-to-integrate-with

[^18]: http://github.com/topics/flow-structure

[^19]: https://kinsta.com/blog/python-ocr/

[^20]: https://www.reddit.com/r/aws/comments/1d9g35z/looking_for_alternative_to_s3_that_has/

