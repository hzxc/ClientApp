import { SubdomainTenancyNameFinder } from '@shared/helpers/SubdomainTenancyNameFinder';
import { AppConsts } from '@shared/AppConsts';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { AppAuthService } from '@app/shared/common/auth/app-auth.service';
import { UtilsService } from '@abp/utils/utils.service';

export class AppPreBootstrap{
    static run(callback: () => void): void {
        AppPreBootstrap.getApplicationConfig(() => {
            const queryStringObj = UrlHelper.getQueryParameters();

            if (queryStringObj.redirect && queryStringObj.redirect === "TenantRegistration") {
                if (queryStringObj.forceNewRegistration) {
                    new AppAuthService().logout();
                }

                location.href = AppConsts.appBaseUrl + '/account/select-edition';
            }
            else if (queryStringObj.impersonationToken) {
                AppPreBootstrap.impersonatedAuthenticate(queryStringObj.impersonationToken, queryStringObj.tenantId, () => { AppPreBootstrap.getUserConfiguration(callback); });
            } else if (queryStringObj.switchAccountToken) {
                AppPreBootstrap.linkedAccountAuthenticate(queryStringObj.switchAccountToken, queryStringObj.tenantId, () => { AppPreBootstrap.getUserConfiguration(callback); });
            } else {
                AppPreBootstrap.getUserConfiguration(callback);
            }
        });
    }

    private static getApplicationConfig(callback: () => void) {
        return abp.ajax({
            url: '/assets/appconfig.json',
            method: 'GET',
            headers: {
                'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
            }
        }).done(result => {

            let subdomainTenancyNameFinder = new SubdomainTenancyNameFinder();
            var tenancyName = subdomainTenancyNameFinder.getCurrentTenancyNameOrNull(result.appBaseUrl);

            AppConsts.appBaseUrlFormat = result.appBaseUrl;
            AppConsts.remoteServiceBaseUrlFormat = result.remoteServiceBaseUrl;
            
            if (tenancyName == null) {
                AppConsts.appBaseUrl = result.appBaseUrl.replace(AppConsts.tenancyNamePlaceHolderInUrl + ".", "");
                AppConsts.remoteServiceBaseUrl = result.remoteServiceBaseUrl.replace(AppConsts.tenancyNamePlaceHolderInUrl + ".", "");
            } else {
                AppConsts.appBaseUrl = result.appBaseUrl.replace(AppConsts.tenancyNamePlaceHolderInUrl, tenancyName);
                AppConsts.remoteServiceBaseUrl = result.remoteServiceBaseUrl.replace(AppConsts.tenancyNamePlaceHolderInUrl, tenancyName);
            }

            callback();
        });
    }

    private static impersonatedAuthenticate(impersonationToken: string, tenantId: number, callback: () => void): JQueryPromise<any> {
        abp.multiTenancy.setTenantIdCookie(tenantId);
        const cookieLangValue = abp.utils.getCookieValue("Abp.Localization.CultureName");
        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/ImpersonatedAuthenticate?impersonationToken=' + impersonationToken,
            method: 'POST',
            headers: {
                '.AspNetCore.Culture': ('c=' + cookieLangValue + '|uic=' + cookieLangValue),
                'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
            }
        }).done(result => {
            abp.auth.setToken(result.accessToken);
            AppPreBootstrap.setEncryptedTokenCookie(result.encryptedAccessToken);
            location.search = '';
            callback();
        });
    }

    private static linkedAccountAuthenticate(switchAccountToken: string, tenantId: number, callback: () => void): JQueryPromise<any> {
        abp.multiTenancy.setTenantIdCookie(tenantId);
        const cookieLangValue = abp.utils.getCookieValue("Abp.Localization.CultureName");
        return abp.ajax({
            url: AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/LinkedAccountAuthenticate?switchAccountToken=' + switchAccountToken,
            method: 'POST',
            headers: {
                '.AspNetCore.Culture': ('c=' + cookieLangValue + '|uic=' + cookieLangValue),
                'Abp.TenantId': abp.multiTenancy.getTenantIdCookie()
            }
        }).done(result => {
            abp.auth.setToken(result.accessToken);
            AppPreBootstrap.setEncryptedTokenCookie(result.encryptedAccessToken);
            location.search = '';
            callback();
        });
    }

    private static setEncryptedTokenCookie(encryptedToken: string) {
        new UtilsService().setCookieValue(AppConsts.authorization.encrptedAuthTokenName,
            encryptedToken,
            new Date(new Date().getTime() + 365 * 86400000), //1 year
            abp.appPath
        );
    }
}