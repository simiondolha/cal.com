import { DeploymentsRepository } from "@/modules/deployments/deployments.repository";
import { RedisService } from "@/modules/redis/redis.service";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const CACHING_TIME = 86400000; // 24 hours in milliseconds

const getLicenseCacheKey = (key: string) => `api-v2-license-key-goblin-url-${key}`;

type LicenseCheckResponse = {
  valid: boolean;
};
@Injectable()
export class DeploymentsService {
  constructor(
    private readonly deploymentsRepository: DeploymentsRepository,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService
  ) {}

  async checkLicense(): Promise<boolean> {
    if (this.configService.get("e2e")) {
      return true;
    }

    const envLicenseKey = this.configService.get("api.licenseKey");
    if (!envLicenseKey) {
      const deployment = await this.deploymentsRepository.getDeployment();
      const dbLicenseKey = deployment?.licenseKey;
      if (!dbLicenseKey) {
        return false;
      }
      return this.validateLicenseKey(dbLicenseKey);
    }

    return this.validateLicenseKey(envLicenseKey);
  }

  private async validateLicenseKey(licenseKey: string): Promise<boolean> {
    const cacheKey = getLicenseCacheKey(licenseKey);
    const cachedData = await this.redisService.redis.get(cacheKey);

    if (cachedData) {
      return (JSON.parse(cachedData) as LicenseCheckResponse)?.valid ?? false;
    }

    const licenseKeyUrl = `${this.configService.get("api.licenseKeyUrl")}/${licenseKey}`;
    const response = await fetch(licenseKeyUrl, { mode: "cors" });
    const data = (await response.json()) as LicenseCheckResponse;

    this.redisService.redis.set(cacheKey, JSON.stringify(data), "EX", CACHING_TIME);
    return data.valid;
  }
}
