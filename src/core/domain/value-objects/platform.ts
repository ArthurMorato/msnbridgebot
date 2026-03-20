export enum Platform {
  TELEGRAM = 'telegram',
  WHATSAPP = 'whatsapp'
}

// Validação helper para Platform
export class PlatformValidator {
  static isValid(platform: string): platform is Platform {
    return Object.values(Platform).includes(platform as Platform);
  }

  static validate(platform: string): Result<Platform> {
    if (this.isValid(platform)) {
      return ResultFactory.ok(platform);
    }
    return ResultFactory.fail(
      new ValidationError(
        `Invalid platform: ${platform}. Valid platforms are: ${Object.values(Platform).join(', ')}`,
        'platform'
      )
    );
  }
}
