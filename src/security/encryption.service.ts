import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;
  private IV_LENGTH = 16;

  // Bandera para asegurar que la inicialización solo ocurra una vez
  private isKeyInitialized = false;
  private initializationPromise: Promise<void>;

  constructor(private readonly configService: ConfigService) {
    // Iniciar la inicialización de la clave en el constructor
    this.initializationPromise = this.initializeKey();
  }

  private async initializeKey(): Promise<void> {
    if (this.isKeyInitialized) {
      return; // Ya inicializada
    }

    const password = this.configService.get<string>('APP_ENCRYPTION_KEY');
    const salt = this.configService.get<string>('APP_ENCRYPTION_SALT'); // <<< Leemos la sal de la variable de entorno

    if (!password) {
      throw new InternalServerErrorException(
        'Environment variable APP_ENCRYPTION_KEY for encryption is not defined. Please ensure it is set.',
      );
    }
    if (!salt) {
      throw new InternalServerErrorException(
        'Environment variable APP_ENCRYPTION_SALT for encryption key derivation is not defined. Please ensure it is set.',
      );
    }

    // Derivar la clave usando la contraseña y la sal obtenidas del entorno
    this.key = (await promisify(scrypt)(password, salt, 32)) as Buffer; // 32 bytes para aes-256
    this.isKeyInitialized = true; // Marcar como inicializada
  }

  // Asegura que la clave esté inicializada antes de cualquier operación
  private async ensureKeyInitialized(): Promise<void> {
    if (!this.isKeyInitialized) {
      await this.initializationPromise; // Esperar a que la inicialización asíncrona termine
    }
  }

  async encrypt(text: string): Promise<string> {
    await this.ensureKeyInitialized(); // Esperar a que la clave esté lista
    const iv = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  async decrypt(encryptedText: string): Promise<string> {
    await this.ensureKeyInitialized(); // Esperar a que la clave esté lista
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new InternalServerErrorException('Invalid encrypted data format.');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];

    const decipher = createDecipheriv(this.algorithm, this.key, iv);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
