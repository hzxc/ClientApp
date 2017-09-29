export class AppConsts{

    static readonly tenancyNamePlaceHolderInUrl = "{TENANCY_NAME}";
    
    static appBaseUrl: string;
    static appBaseUrlFormat: string;
    static remoteServiceBaseUrlFormat: string;
    static remoteServiceBaseUrl: string;
    static recaptchaSiteKey: string;
    static subscriptionExpireNootifyDayCount: number;
    
    static readonly authorization = {
        encrptedAuthTokenName: 'enc_auth_token'
    };
}