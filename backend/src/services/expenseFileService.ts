import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid_generate_v4 } from 'uuid';
import path from 'path';

// Configuración de archivos
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

/**
 * Servicio para gestionar archivos de comprobantes de gastos
 */
export class ExpenseFileService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private baseUrl: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'eu-west-1';
    this.bucketName = process.env.S3_BUCKET || 'anclora-expenses';
    this.baseUrl = process.env.S3_BASE_URL || `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }

  /**
   * Validar archivo antes de subir
   */
  private validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Validar MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`
      };
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Archivo demasiado grande. Máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB, recibido: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      };
    }

    // Validar extensión
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Extensión no permitida: ${ext}. Permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Sanitizar nombre de archivo
   */
  private sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100);
  }

  /**
   * Subir comprobante de gasto
   * @param file - Archivo a subir
   * @param userId - ID del usuario
   * @param expenseId - ID del gasto
   * @returns { url, key, fileName, size }
   */
  async uploadReceipt(
    file: Express.Multer.File,
    userId: string,
    expenseId: string
  ): Promise<{
    url: string;
    key: string;
    fileName: string;
    size: number;
    contentType: string;
  }> {
    // 1. Validar archivo
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 2. Sanitizar nombre
    const sanitizedName = this.sanitizeFileName(file.originalname);
    const ext = path.extname(sanitizedName);
    const uniqueKey = `expenses/${userId}/${expenseId}/${uuid_generate_v4()}${ext}`;

    // 3. Preparar upload
    const uploadParams = {
      Bucket: this.bucketName,
      Key: uniqueKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        'user-id': userId,
        'expense-id': expenseId,
        'uploaded-at': new Date().toISOString(),
        'original-filename': sanitizedName
      },
      ServerSideEncryption: 'AES256' as const,
      ACL: 'private' as const
    };

    // 4. Subir a S3
    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      
      // 5. Generar URL firmada (válida por 24 horas)
      const signedUrl = await this.generateSignedUrl(uniqueKey);

      return {
        url: signedUrl,
        key: uniqueKey,
        fileName: sanitizedName,
        size: file.size,
        contentType: file.mimetype
      };
    } catch (error: any) {
      console.error('Error uploading to S3:', error);
      throw new Error(`Error subiendo archivo a S3: ${error.message}`);
    }
  }

  /**
   * Generar URL firmada para descargar archivo
   */
  private async generateSignedUrl(key: string): Promise<string> {
    try {
      const getObjectParams = {
        Bucket: this.bucketName,
        Key: key
      };

      // URL válida por 24 horas
      const url = await getSignedUrl(
        this.s3Client,
        new GetObjectCommand(getObjectParams),
        { expiresIn: 24 * 60 * 60 }
      );

      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      // Fallback: URL sin firma (si el bucket es público)
      return `${this.baseUrl}/${key}`;
    }
  }

  /**
   * Eliminar comprobante
   */
  async deleteReceipt(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key
        })
      );
      return true;
    } catch (error: any) {
      console.error('Error deleting from S3:', error);
      throw new Error(`Error eliminando archivo: ${error.message}`);
    }
  }

  /**
   * Validar URL de comprobante
   */
  async validateReceiptUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Información de archivos permitidos
   */
  getAllowedFileInfo(): {
    mimeTypes: string[];
    extensions: string[];
    maxSizeMB: number;
  } {
    return {
      mimeTypes: ALLOWED_MIME_TYPES,
      extensions: ALLOWED_EXTENSIONS,
      maxSizeMB: MAX_FILE_SIZE / 1024 / 1024
    };
  }
}

export const expenseFileService = new ExpenseFileService();
