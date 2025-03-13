import { APIClient } from '@/lib/api/client';
import type { DonationCertificate } from '@/lib/contracts/donation';

export class CertificateService {
  private static instance: CertificateService;
  private api: APIClient;

  private constructor() {
    this.api = APIClient.getInstance();
  }

  public static getInstance(): CertificateService {
    if (!CertificateService.instance) {
      CertificateService.instance = new CertificateService();
    }
    return CertificateService.instance;
  }

  /**
   * 生成公益证书
   * @param orderId 订单ID
   * @returns 证书信息
   */
  public async generateCertificate(orderId: string): Promise<DonationCertificate> {
    const response = await this.api.client.post(`/api/certificates/generate`, {
      orderId,
    });
    return response.data;
  }

  /**
   * 验证证书
   * @param verificationCode 验证码
   * @returns 证书信息
   */
  public async verifyCertificate(verificationCode: string): Promise<DonationCertificate> {
    const response = await this.api.client.get(
      `/api/certificates/verify/${verificationCode}`
    );
    return response.data;
  }

  /**
   * 分享证书到社交媒体
   * @param certificateId 证书ID
   * @param platform 社交媒体平台
   */
  public async shareCertificate(
    certificateId: string,
    platform: 'wechat' | 'weibo' | 'twitter'
  ): Promise<{ shareUrl: string }> {
    const response = await this.api.client.post(`/api/certificates/${certificateId}/share`, {
      platform,
    });
    return response.data;
  }

  /**
   * 下载证书PDF
   * @param certificateId 证书ID
   */
  public async downloadCertificate(certificateId: string): Promise<Blob> {
    const response = await this.api.client.get(
      `/api/certificates/${certificateId}/download`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }
} 